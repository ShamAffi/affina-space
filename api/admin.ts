import type { VercelRequest, VercelResponse } from '@vercel/node';
import { neon } from '@neondatabase/serverless';
import { applyCors } from '../src/server/http.js';
import { requireAuth } from '../src/server/requireAuth.js';
import { captureError } from '../src/server/observability.js';

// Internal admin panel (SPEC_ADMIN_PANEL). This is the ONE endpoint that returns OTHER users'
// data, so access control is critical (§1): every action requires a valid session (requireAuth
// → 401) AND the caller's own row `is_admin = true` (→ 403). No secret-in-URL scheme. Reporting-
// heavy, low-traffic (Shamil only), so it uses raw parameterized SQL (neon tagged template —
// every ${} is a bound parameter) rather than the Drizzle query builder. Read-only except the
// single mentor-request status write.

type Sql = ReturnType<typeof neon>;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (applyCors(req, res, 'GET,POST,OPTIONS')) return;

  // §1 — 401 without a session, 403 without the admin flag. Order matters (auth before authz).
  const email = requireAuth(req, res);
  if (!email) return;
  const sql = neon(process.env.DATABASE_URL!);
  const me = await sql`SELECT is_admin FROM users WHERE email = ${email} LIMIT 1`;
  if (!me[0]?.is_admin) return res.status(403).json({ error: 'forbidden' });

  const action = String(req.query.action ?? '');
  try {
    if (req.method === 'GET') {
      if (action === 'ping') return res.status(200).json({ ok: true });
      if (action === 'stats') return res.status(200).json(await getStats(sql));
      if (action === 'users') return res.status(200).json(await getUsers(sql, req.query));
      if (action === 'user') {
        const detail = await getUser(sql, Number(req.query.id));
        if (!detail) return res.status(404).json({ error: 'not found' });
        return res.status(200).json(detail);
      }
      if (action === 'requests') return res.status(200).json(await getRequests(sql, req.query.status));
      return res.status(400).json({ error: 'unknown action' });
    }
    if (req.method === 'POST' && action === 'request-status') return await setRequestStatus(sql, req.body, res);
    return res.status(405).json({ error: 'method not allowed' });
  } catch (err) {
    captureError(err, { endpoint: 'admin', mode: action });
    return res.status(500).json({ error: 'admin_error' });
  }
}

// ─── §4 Overview ──────────────────────────────────────────────────────────────
async function getStats(sql: Sql) {
  const tiles = await sql`SELECT
    (SELECT count(*)::int FROM users)                                          AS total_users,
    (SELECT count(*)::int FROM users WHERE verified_at IS NOT NULL)            AS verified,
    (SELECT count(*)::int FROM users WHERE subscribed)                         AS subscribed,
    (SELECT count(*)::int FROM users WHERE phone IS NOT NULL)                  AS phones,
    (SELECT coalesce(sum((props->>'amountCents')::bigint),0)::bigint FROM events WHERE name='payment_succeeded') AS revenue_cents,
    (SELECT count(*)::int FROM mentor_requests WHERE status='new')             AS new_requests`;
  // Cumulative 7d + 30d funnel in one pass over the last 30 days of events.
  const funnel = await sql`SELECT
    count(DISTINCT anon_id) FILTER (WHERE name='email_captured'   AND created_at > now()-interval '7 days')::int  AS cap7,
    count(DISTINCT user_id) FILTER (WHERE name='email_verified'   AND created_at > now()-interval '7 days')::int  AS ver7,
    count(DISTINCT user_id) FILTER (WHERE name='paywall_viewed'   AND created_at > now()-interval '7 days')::int  AS pw7,
    count(DISTINCT user_id) FILTER (WHERE name='payment_succeeded' AND created_at > now()-interval '7 days')::int AS pay7,
    count(DISTINCT anon_id) FILTER (WHERE name='email_captured')::int   AS cap30,
    count(DISTINCT user_id) FILTER (WHERE name='email_verified')::int   AS ver30,
    count(DISTINCT user_id) FILTER (WHERE name='paywall_viewed')::int   AS pw30,
    count(DISTINCT user_id) FILTER (WHERE name='payment_succeeded')::int AS pay30
    FROM events WHERE created_at > now()-interval '30 days'`;
  const signups = await sql`SELECT date_trunc('day', created_at)::date AS day, count(*)::int AS n
    FROM users WHERE created_at > now()-interval '14 days' GROUP BY 1 ORDER BY 1`;
  const utm = await sql`SELECT source, campaign, captures::int, verified::int, paid::int, revenue_cents::bigint
    FROM v_utm_performance LIMIT 8`;
  return { tiles: tiles[0], funnel: funnel[0], signups, utm };
}

// ─── §3 Users: list (search + pagination) ──────────────────────────────────────
async function getUsers(sql: Sql, q: VercelRequest['query']) {
  const search = String(q.search ?? '').trim();
  const like = `%${search}%`;
  const page = Math.max(0, Number(q.page ?? 0) || 0);
  const PAGE = 50;
  // Single query, no fragment composition: an empty search short-circuits the ILIKE clause.
  const rows = await sql`
    SELECT u.id, u.email, u.name, u.project_name, u.verified_at, u.subscribed, u.subscription_status,
      u.last_active_at, u.phone, u.phone_source, u.utm_first->>'source' AS utm_source,
      u.utm_first->>'campaign' AS utm_campaign, u.created_at,
      (SELECT count(*)::int FROM completed_lessons cl WHERE cl.user_id = u.id) AS completed_count
    FROM users u
    WHERE (${search}::text = '' OR u.email ILIKE ${like} OR u.name ILIKE ${like} OR u.project_name ILIKE ${like})
    ORDER BY u.created_at DESC NULLS LAST
    LIMIT ${PAGE} OFFSET ${page * PAGE}`;
  const totalRow = await sql`SELECT count(*)::int AS total FROM users u
    WHERE (${search}::text = '' OR u.email ILIKE ${like} OR u.name ILIKE ${like} OR u.project_name ILIKE ${like})`;
  return { rows, page, pageSize: PAGE, total: totalRow[0].total };
}

// ─── §3 Users: per-user detail (profile · money · program · timeline · emails) ──
async function getUser(sql: Sql, id: number) {
  if (!id || Number.isNaN(id)) return null;
  const urow = await sql`SELECT id, email, name, project_name, idea, customer, business_model, stage, goal,
      country, city, timezone, score, phase, subscribed, subscription_status, current_period_end,
      stripe_customer_id, verified_at, email_captured_at, phone, phone_source, utm_first, utm_last,
      onboarding_report->>'score' AS report_score, snapshot->'sections' AS snapshot_sections,
      pulse_streak, last_active_at, created_at
    FROM users WHERE id = ${id}`;
  if (!urow[0]) return null;

  const [events, emails, mentorReqs, brain, taskAgg, checkinsRow, achievements, payments, completedRow] = await Promise.all([
    sql`SELECT created_at, name, path, props FROM events WHERE user_id = ${id} ORDER BY created_at DESC LIMIT 100`,
    sql`SELECT type, sent_at FROM email_log WHERE user_id = ${id} ORDER BY sent_at DESC LIMIT 100`,
    sql`SELECT id, session, topic, status, created_at FROM mentor_requests WHERE user_id = ${id} ORDER BY created_at DESC`,
    sql`SELECT lesson_id, entry_type, ai_score, updated_at FROM brain_entries WHERE user_id = ${id} ORDER BY updated_at DESC`,
    sql`SELECT count(*)::int AS total, count(*) FILTER (WHERE status='done')::int AS done,
        count(*) FILTER (WHERE status IN ('todo','submitted'))::int AS open FROM tasks WHERE user_id = ${id}`,
    sql`SELECT count(*)::int AS n FROM check_ins WHERE user_id = ${id}`,
    sql`SELECT type, value, xp, created_at FROM achievements WHERE user_id = ${id} ORDER BY created_at DESC`,
    sql`SELECT created_at, (props->>'amountCents')::bigint AS amount_cents FROM events
        WHERE user_id = ${id} AND name='payment_succeeded' ORDER BY created_at DESC`,
    sql`SELECT count(*)::int AS n FROM completed_lessons WHERE user_id = ${id}`,
  ]);

  return {
    user: urow[0],
    tasks: taskAgg[0],
    checkInsCount: checkinsRow[0].n,
    completedCount: completedRow[0].n,
    brain, achievements, payments, emails,
    mentorRequests: mentorReqs,
    timeline: events,
  };
}

// ─── §2 Requests: mentor_requests × users ──────────────────────────────────────
async function getRequests(sql: Sql, status: unknown) {
  const st = String(status ?? '').trim(); // '' = all
  const rows = await sql`
    SELECT mr.id, mr.session, mr.topic, mr.status, mr.created_at,
      u.id AS user_id, u.name, u.email, u.phone, u.subscribed
    FROM mentor_requests mr JOIN users u ON u.id = mr.user_id
    WHERE (${st}::text = '' OR mr.status = ${st})
    ORDER BY (mr.status='new') DESC, mr.created_at DESC`;
  return { rows };
}

// ─── §2 The ONE write: advance a request's status ──────────────────────────────
async function setRequestStatus(sql: Sql, body: unknown, res: VercelResponse) {
  const b = (body ?? {}) as { id?: unknown; status?: unknown };
  const id = Number(b.id);
  const status = String(b.status ?? '');
  if (!id || Number.isNaN(id) || !['new', 'scheduled', 'done'].includes(status)) {
    return res.status(400).json({ error: 'invalid (id + status ∈ new|scheduled|done)' });
  }
  const updated = await sql`UPDATE mentor_requests SET status = ${status} WHERE id = ${id} RETURNING id, status`;
  if (!updated[0]) return res.status(404).json({ error: 'not found' });
  return res.status(200).json({ ok: true, id: updated[0].id, status: updated[0].status });
}
