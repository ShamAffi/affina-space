import type { VercelRequest } from '@vercel/node';
import { neon } from '@neondatabase/serverless';

// Lives in src/ (not api/): every .ts under /api is emitted as its own Vercel
// function and Hobby caps us at 12. All shared non-handler helpers live in
// src/server/ for that reason (same as src/rubrics.ts). The api handlers import this.
//
// Neon-backed fixed-window rate limiter — the ACTUAL protection for the Anthropic
// bill (CORS only stops other sites' browsers, never curl/scripts). One row per
// (identity, window) in the rate_limits table; each request atomically bumps the
// counter and the row resets itself once its window has elapsed.
//
// Fails OPEN on any error: a limiter hiccup must never block real founders — the
// Anthropic Console monthly spend cap (SPEC §0) is the hard backstop beneath this.

export type RateLimitResult = { ok: boolean; retryAfter?: number };

function clientIp(req: VercelRequest): string {
  const xff = req.headers['x-forwarded-for'];
  const raw = Array.isArray(xff) ? xff[0] : xff;
  if (typeof raw === 'string' && raw.trim()) return raw.split(',')[0].trim();
  const xri = req.headers['x-real-ip'];
  if (typeof xri === 'string' && xri.trim()) return xri.trim();
  return 'unknown';
}

// Auth Phase B (§6): the email dimension keys ONLY on the SESSION email, passed
// explicitly by guarded endpoints. We no longer read email from body/query — a client
// email is untrusted (spoofable), and letting it key the limiter would let an attacker
// exhaust a victim's bucket. Pre-auth surfaces (§7) pass no email → IP-based limiting only.
function pickEmail(explicit?: string): string | undefined {
  const e = explicit?.trim().toLowerCase();
  return e || undefined;
}

// Limit + window length are inferred from the key suffix (keys: ip:<ip>:min,
// ip:<ip>:day, email:<email>:day) — the same source of truth the SQL reset uses.
// Generous for a real founder (a full session ≈ 20–50 AI calls), lethal to a
// script loop. Tune from real telemetry later.
function limitFor(key: string): { max: number; windowSec: number } {
  if (key.endsWith(':min')) return { max: 20, windowSec: 60 };
  if (key.startsWith('email:')) return { max: 200, windowSec: 86_400 };
  return { max: 300, windowSec: 86_400 }; // ip:<ip>:day
}

/**
 * Rate-limit a request by IP (20/min, 300/day) and email (200/day).
 * GET/HEAD/OPTIONS are never limited (they don't reach Claude). Returns
 * `{ ok: false, retryAfter }` when any limit is exceeded; the caller replies 429.
 */
export async function checkRateLimit(
  req: VercelRequest,
  opts?: { email?: string },
): Promise<RateLimitResult> {
  const method = (req.method ?? 'GET').toUpperCase();
  if (method === 'GET' || method === 'HEAD' || method === 'OPTIONS') return { ok: true };

  const url = process.env.DATABASE_URL;
  if (!url) return { ok: true }; // no DB configured (e.g. local) → fail open

  try {
    const sql = neon(url);
    const ip = clientIp(req);
    const email = pickEmail(opts?.email);

    const keys = [`ip:${ip}:min`, `ip:${ip}:day`];
    if (email) keys.push(`email:${email}:day`);

    // One round-trip: a single multi-row fixed-window upsert. Each row's window
    // length is derived from its key suffix (:min → 1 minute, else 1 day), so the
    // reset logic lives entirely in SQL and stays atomic per row.
    const values = keys.map((_, i) => `($${i + 1}, now(), 1)`).join(', ');
    const text = `
      INSERT INTO rate_limits (key, window_start, count)
      VALUES ${values}
      ON CONFLICT (key) DO UPDATE SET
        count = CASE WHEN rate_limits.window_start <= now() - (CASE WHEN rate_limits.key LIKE '%:min' THEN interval '1 minute' ELSE interval '1 day' END)
                     THEN 1 ELSE rate_limits.count + 1 END,
        window_start = CASE WHEN rate_limits.window_start <= now() - (CASE WHEN rate_limits.key LIKE '%:min' THEN interval '1 minute' ELSE interval '1 day' END)
                     THEN now() ELSE rate_limits.window_start END
      RETURNING key, count, window_start
    `;
    const rows = (await sql.query(text, keys)) as { key: string; count: number; window_start: string }[];

    const now = Date.now() / 1000;
    let retryAfter = 0;
    for (const r of rows) {
      const { max, windowSec } = limitFor(r.key);
      if (Number(r.count) > max) {
        const resetAt = new Date(r.window_start).getTime() / 1000 + windowSec;
        retryAfter = Math.max(retryAfter, resetAt - now); // wait for the longest window to clear
      }
    }
    if (retryAfter <= 0) return { ok: true };
    return { ok: false, retryAfter: Math.max(1, Math.ceil(retryAfter)) };
  } catch (err) {
    console.error('[ratelimit] failing open:', err);
    return { ok: true };
  }
}

/**
 * Per-DESTINATION-email throttle for outbound magic-link emails (audit F02). The IP
 * limiter alone doesn't stop inbox-bombing: an attacker rotating IPs could still send
 * many "sign in" emails to ONE victim and burn the Resend quota / harm sender
 * reputation. This caps sends TO a given address regardless of who requests them.
 *
 * Same fixed-window mechanism as checkRateLimit, on `maillink:<email>:hour|day` keys.
 * Returns false when a window is exceeded. Fails OPEN on any error — the IP limit and
 * the always-200 anti-enumeration response are the backstops, and a DB blip must never
 * block a real founder's login. Every attempt counts toward the window (throttled ones
 * included), so a burst can't slip extra sends through.
 */
export async function checkEmailSendLimit(
  email: string,
  limits: { perHour: number; perDay: number },
): Promise<boolean> {
  const url = process.env.DATABASE_URL;
  if (!url) return true; // no DB (e.g. local) → fail open
  const e = email.trim().toLowerCase();
  if (!e) return true;
  try {
    const sql = neon(url);
    const keys = [`maillink:${e}:hour`, `maillink:${e}:day`];
    const values = keys.map((_, i) => `($${i + 1}, now(), 1)`).join(', ');
    const text = `
      INSERT INTO rate_limits (key, window_start, count)
      VALUES ${values}
      ON CONFLICT (key) DO UPDATE SET
        count = CASE WHEN rate_limits.window_start <= now() - (CASE WHEN rate_limits.key LIKE '%:hour' THEN interval '1 hour' ELSE interval '1 day' END)
                     THEN 1 ELSE rate_limits.count + 1 END,
        window_start = CASE WHEN rate_limits.window_start <= now() - (CASE WHEN rate_limits.key LIKE '%:hour' THEN interval '1 hour' ELSE interval '1 day' END)
                     THEN now() ELSE rate_limits.window_start END
      RETURNING key, count
    `;
    const rows = (await sql.query(text, keys)) as { key: string; count: number }[];
    for (const r of rows) {
      const cap = r.key.endsWith(':hour') ? limits.perHour : limits.perDay;
      if (Number(r.count) > cap) return false;
    }
    return true;
  } catch (err) {
    console.error('[ratelimit] email send limit failing open:', err);
    return true;
  }
}

// Generous per-IP limit for the analytics ingestion endpoint (SPEC_ANALYTICS §3) — it's a
// batch endpoint fired every ~5s, so 120/min/IP is comfortable for a real user and still
// caps a flood. Returns true (proceed) unless the minute budget is exceeded. Fails OPEN:
// the analytics limiter must never block a page.
export async function checkTrackLimit(req: VercelRequest): Promise<boolean> {
  const url = process.env.DATABASE_URL;
  if (!url) return true;
  try {
    const sql = neon(url);
    const key = `trk:${clientIp(req)}:min`;
    const rows = (await sql.query(
      `INSERT INTO rate_limits (key, window_start, count) VALUES ($1, now(), 1)
       ON CONFLICT (key) DO UPDATE SET
         count = CASE WHEN rate_limits.window_start <= now() - interval '1 minute' THEN 1 ELSE rate_limits.count + 1 END,
         window_start = CASE WHEN rate_limits.window_start <= now() - interval '1 minute' THEN now() ELSE rate_limits.window_start END
       RETURNING count`,
      [key],
    )) as { count: number }[];
    return Number(rows[0]?.count ?? 0) <= 120;
  } catch {
    return true;
  }
}
