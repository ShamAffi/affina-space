import type { VercelRequest, VercelResponse } from '@vercel/node';
import { applyCors } from '../src/server/http.js';
import { requireAuth } from '../src/server/requireAuth.js';
import { checkRateLimit } from '../src/server/ratelimit.js';
import { getDb } from '../src/server/db.js';
import { clampInt } from '../src/server/limits.js';
import { eq } from 'drizzle-orm';
import { users, lessonInputs, completedLessons, brainEntries, tasks, checkIns, achievements, delegations } from '../src/db/schema.js';
import { GROWTH_SEED_XP } from '../src/server/progressUtils.js';
import { mentorBookedEmail } from '../src/server/email.js';
import { sendOnce } from '../src/server/emailLog.js';

// Auth Phase B (SPEC_AUTH_PHASE_B): GET + PATCH derive identity from the session cookie
// (requireAuth) — the client email param is ignored. POST is the PRE-AUTH onboarding
// surface (§7): no session, IP rate-limited, and it may ONLY create/update a PENDING row
// (verifiedAt IS NULL) — it refuses to touch a verified account. Post-verify profile
// edits go through PATCH.

// Re-onboarding with an existing email (freshStart) must not inherit the previous
// life of that account: wipe all child rows and reset derived state, otherwise old
// tasks/brain/progress leak into the new project (root cause of the ghost-tasks bug).
async function wipeUserChildren(db: ReturnType<typeof getDb>, userId: number) {
  await Promise.all([
    db.delete(lessonInputs).where(eq(lessonInputs.userId, userId)),
    db.delete(completedLessons).where(eq(completedLessons.userId, userId)),
    db.delete(brainEntries).where(eq(brainEntries.userId, userId)),
    db.delete(tasks).where(eq(tasks.userId, userId)),
    db.delete(checkIns).where(eq(checkIns.userId, userId)),
    db.delete(achievements).where(eq(achievements.userId, userId)),
    db.delete(delegations).where(eq(delegations.userId, userId)),
  ]);
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (applyCors(req, res, 'GET,POST,PATCH,OPTIONS')) return;

  const db = getDb();

  // GET /api/user — load the SESSION user's data (identity from the cookie, not a param).
  if (req.method === 'GET') {
    const email = requireAuth(req, res);
    if (!email) return;

    const user = await db.query.users.findFirst({ where: eq(users.email, email) });
    if (!user) return res.status(404).json({ error: 'not found' });

    const inputs = await db.query.lessonInputs.findMany({
      where: eq(lessonInputs.userId, user.id),
    });
    const completed = await db.query.completedLessons.findMany({
      where: eq(completedLessons.userId, user.id),
    });

    return res.status(200).json({
      name: user.name ?? '',
      projectName: user.projectName ?? '',
      idea: user.idea ?? '',
      customer: user.customer ?? '',
      businessModel: user.businessModel ?? '',
      stage: user.stage ?? '',
      goal: user.goal ?? '',
      country: user.country ?? '',
      city: user.city ?? '',
      timezone: user.timezone ?? '',
      email: user.email,
      score: user.score ?? 0,
      subscribed: user.subscribed ?? false,
      mentorSessions: user.mentorSessions ?? null,
      // Funnel (SPEC_ONBOARDING_FUNNEL): verification state + persisted report for /report.
      verifiedAt: user.verifiedAt ? new Date(user.verifiedAt).toISOString() : null,
      onboardingReport: user.onboardingReport ?? null,
      lessonInputs: Object.fromEntries(inputs.map((i) => [i.lessonId, i.content ?? ''])),
      completedLessons: completed.map((c) => c.lessonId),
    });
  }

  // POST /api/user — PRE-AUTH onboarding surface (SPEC_AUTH_PHASE_B §7). No session:
  // it may ONLY create/update a PENDING row (verifiedAt IS NULL) and refuses to touch a
  // verified account (a pre-auth caller must never overwrite / read a real user's data).
  // IP rate-limited. Post-verify profile edits go through PATCH (session-guarded).
  //   emailCapture=true (SPEC_ONBOARDING_FUNNEL §2a): email-capture / change-email — blocks
  //     on a verified account, else creates/reuses the pending row FOR `email` only, sets
  //     emailCapturedAt. (No cross-email relocate — see F06 note below.)
  //   plain sync: name/project/report onto the pending row during onboarding.
  if (req.method === 'POST') {
    const rl = await checkRateLimit(req); // pre-auth → IP-based only (no session email)
    if (!rl.ok) {
      if (rl.retryAfter) res.setHeader('Retry-After', String(rl.retryAfter));
      return res.status(429).json({ error: 'rate_limited', retryAfter: rl.retryAfter });
    }

    const body = req.body ?? {};
    const email = String(body.email ?? '').trim().toLowerCase();
    if (!email) return res.status(400).json({ error: 'email required' });
    const { name, projectName, idea, customer, businessModel, stage, goal, country, city, timezone, onboardingReport, emailCapture } = body;
    // audit F14 — never trust the client-supplied onboarding score; clamp to [0,100].
    // It's a display/motivation number (from the pre-auth /api/score compute), never an
    // entitlement, so clamping — not recomputing — is the proportionate fix.
    const score = clampInt(body.score, 0, 100);

    // Profile fields written on every path. drizzle .set()/.values() skips `undefined`,
    // so an omitted field (e.g. name at capture time) never clobbers an existing value.
    const profile = { name, projectName, idea, customer, businessModel, stage, goal, score, country, city, timezone };
    // email-capture reuse wipes the previous life of a reused pending row.
    const derivedReset = {
      phase: 'launch', launchValidatedAt: null, growthXp: 0, northStar: null,
      pulseStreak: 0, lastCheckInAt: null, momentumCard: null, lastReadinessGain: null,
      snapshot: null, snapshotHistory: null, mentorSessions: null, subscribed: false,
    };

    // ── EMAIL CAPTURE (§2a) — verification = ownership; block only on verified ────────
    // audit F06: the previousEmail "relocate" branch was REMOVED. It let an anonymous
    // caller move ANY pending row (keyed by a client-supplied previousEmail) onto an
    // address the caller controls, then verify it and steal the victim's onboarding data
    // (and deny the victim their signup). A pre-auth caller may now only ever touch the
    // row for the email it is capturing — never a row keyed by some other address, and
    // never a verified one. Change-email simply captures onto the new address; the client
    // re-sends the full onboarding data, and the old pending row is left to expire.
    if (emailCapture === true) {
      const capturedAt = new Date();
      const target = await db.query.users.findFirst({ where: eq(users.email, email) });
      // The one intentional signal the funnel UX needs (EmailCapture/ConfirmEmail show
      // "you already have an account — sign in"). Bounded by the IP rate limit above.
      if (target?.verifiedAt) return res.status(200).json({ blocked: true, reason: 'already_registered' });

      if (target) {
        // Reuse the pending row: overwrite intake/report with this run, refresh the clock.
        await wipeUserChildren(db, target.id);
        await db.update(users)
          .set({ ...profile, ...derivedReset, onboardingReport, emailCapturedAt: capturedAt, updatedAt: capturedAt })
          .where(eq(users.id, target.id));
      } else {
        await db.insert(users).values({ email, ...profile, onboardingReport, emailCapturedAt: capturedAt });
      }
      // Uniform success shape (no id / reused / created leak) — the only distinguishable
      // response is the verified-account block above, which the UX requires.
      return res.status(200).json({ ok: true });
    }

    // Plain onboarding sync (syncUserToDB — fire-and-forget; the client ignores the body).
    // Refuse a VERIFIED row (§7: pre-auth touches pending only). audit F14: return a
    // UNIFORM response for verified / pending / new, so this path is not an email-
    // registration enumeration oracle (a prober can't tell the three cases apart).
    const existing = await db.query.users.findFirst({ where: eq(users.email, email) });
    if (existing?.verifiedAt) {
      return res.status(200).json({ ok: true }); // silently no-op — never touch a verified row, never reveal it
    }
    if (existing) {
      await db.update(users)
        .set({ ...profile, onboardingReport, updatedAt: new Date() })
        .where(eq(users.id, existing.id));
    } else {
      // Welcome fires on magic-link verification (api/auth.ts verify-link), not here.
      await db.insert(users).values({ email, ...profile, onboardingReport });
    }
    return res.status(200).json({ ok: true });
  }

  // PATCH /api/user — post-auth profile/account edits. Identity from the SESSION cookie;
  // the client email param is ignored (§2). Handles the full profile so post-verify edits
  // (m0l3 "Your Project Today", AccountPanel) go through the session, never the pre-auth POST.
  if (req.method === 'PATCH') {
    const email = requireAuth(req, res);
    if (!email) return;
    // Rate limit (audit F07) — PATCH can trigger mentor-booked emails; without this a
    // session could fan out unbounded Resend sends by toggling mentorSessions keys.
    const rl = await checkRateLimit(req, { email });
    if (!rl.ok) {
      if (rl.retryAfter) res.setHeader('Retry-After', String(rl.retryAfter));
      return res.status(429).json({ error: 'rate_limited', retryAfter: rl.retryAfter });
    }
    // NOTE: `subscribed` is NOT accepted here — it's driven ONLY by the Stripe webhook
    // (SPEC_STRIPE §3), never from the browser. The paywall now redirects to Checkout.
    const { name, projectName, idea, customer, businessModel, stage, goal, country, city, timezone, mentorSessions } = req.body ?? {};
    const existingUser = await db.query.users.findFirst({ where: eq(users.email, email) });
    const patchFields: Record<string, unknown> = { updatedAt: new Date() };
    for (const [k, v] of Object.entries({ name, projectName, idea, customer, businessModel, stage, goal, country, city, timezone })) {
      if (v !== undefined) patchFields[k] = v;
    }
    // Merge mentorSessions (partial patch per session) — never clobber other sessions.
    const newlyBooked: string[] = [];
    if (mentorSessions !== undefined) {
      const prev = (existingUser?.mentorSessions ?? {}) as Record<string, unknown>;
      const merged: Record<string, unknown> = { ...prev };
      for (const [k, v] of Object.entries(mentorSessions as Record<string, unknown>)) {
        // audit F07 — only the 3 real sessions exist; ignoring unknown keys bounds the
        // email fan-out to ≤3 per request (a hostile client can't invent S4…S999).
        if (k !== 'S1' && k !== 'S2' && k !== 'S3') continue;
        const before = prev[k] as { booked?: boolean } | undefined;
        const after = v as { booked?: boolean };
        if (after?.booked === true && before?.booked !== true) newlyBooked.push(k);
        merged[k] = { ...(prev[k] as object ?? {}), ...(v as object) };
      }
      patchFields.mentorSessions = merged;
    }

    // Graduation (решение Шамиля): completing mentor session S3 IS the launch→growth
    // moment — the post-program Growth/XP phase starts here with its seed points.
    if (mentorSessions?.S3?.completed === true) {
      if (existingUser && (existingUser.phase ?? 'launch') === 'launch') {
        patchFields.phase = 'growth';
        patchFields.launchValidatedAt = new Date();
        patchFields.growthXp = GROWTH_SEED_XP;
      }
    }

    await db.update(users).set(patchFields).where(eq(users.email, email));
    // §2.4 — mentor-session-booked email when a session's `booked` flips true. sendOnce
    // dedups by (user, 'mentor_booked', sid) so a false→true→false→true toggle can't
    // re-send (audit F07); combined with the ≤3-key bound + rate limit, fan-out is capped.
    if (existingUser) {
      for (const sid of newlyBooked) {
        await sendOnce(existingUser.id, 'mentor_booked', sid, mentorBookedEmail(email, sid));
      }
    }
    return res.status(200).json({ ok: true });
  }

  return res.status(405).json({ error: 'method not allowed' });
}
