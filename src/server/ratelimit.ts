import type { VercelRequest } from '@vercel/node';
import { neon } from '@neondatabase/serverless';

// Lives in src/ (not api/lib): every .ts under /api counts against the Vercel
// Hobby 12-function cap and we're at 12. The api handlers import this.
//
// Neon-backed fixed-window rate limiter — this is the ACTUAL protection for the
// Anthropic bill (CORS only stops other sites' browsers, never curl/scripts).
// One row per (identity, window); each request atomically bumps the counter and
// the row resets itself once its window has elapsed.
//
// Fails OPEN on any error: a limiter hiccup must never block real founders — the
// Anthropic Console monthly spend cap (SPEC §0) is the hard backstop beneath this.

export type RateLimitResult = { ok: boolean; retryAfter?: number };

// Generous for a real founder (a full session ≈ 20–50 AI calls), lethal to a
// script loop. Tune from real telemetry later.
const LIMITS = {
  ipPerMin: { windowSec: 60, max: 20 },
  ipPerDay: { windowSec: 86_400, max: 300 },
  emailPerDay: { windowSec: 86_400, max: 200 },
};

function clientIp(req: VercelRequest): string {
  const xff = req.headers['x-forwarded-for'];
  const raw = Array.isArray(xff) ? xff[0] : xff;
  if (typeof raw === 'string' && raw.trim()) return raw.split(',')[0].trim();
  const xri = req.headers['x-real-ip'];
  if (typeof xri === 'string' && xri.trim()) return xri.trim();
  return 'unknown';
}

function pickEmail(req: VercelRequest, explicit?: string): string | undefined {
  const body = req.body as { email?: unknown } | undefined;
  const query = req.query as { email?: unknown } | undefined;
  const cand =
    explicit ??
    (typeof body?.email === 'string' ? body.email : undefined) ??
    (typeof query?.email === 'string' ? query.email : undefined);
  const e = cand?.trim().toLowerCase();
  return e || undefined;
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
    const now = Math.floor(Date.now() / 1000);
    const ip = clientIp(req);
    const email = pickEmail(req, opts?.email);

    // One atomic upsert: insert a fresh window, increment the live one, or reset
    // it if its window already elapsed. Returns post-increment count + window end.
    const bump = async (key: string, windowSec: number) => {
      const rows = await sql`
        INSERT INTO rate_limits (bucket_key, window_seconds, count, window_start)
        VALUES (${key}, ${windowSec}, 1, ${now})
        ON CONFLICT (bucket_key) DO UPDATE SET
          count = CASE WHEN rate_limits.window_start + rate_limits.window_seconds <= ${now}
                       THEN 1 ELSE rate_limits.count + 1 END,
          window_start = CASE WHEN rate_limits.window_start + rate_limits.window_seconds <= ${now}
                       THEN ${now} ELSE rate_limits.window_start END
        RETURNING count, window_start
      `;
      const r = rows[0] as { count: number; window_start: number };
      return { count: Number(r.count), resetAt: Number(r.window_start) + windowSec };
    };

    const jobs = [
      bump(`ip:${ip}:1m`, LIMITS.ipPerMin.windowSec).then((r) => ({ ...r, max: LIMITS.ipPerMin.max })),
      bump(`ip:${ip}:1d`, LIMITS.ipPerDay.windowSec).then((r) => ({ ...r, max: LIMITS.ipPerDay.max })),
    ];
    if (email) {
      jobs.push(bump(`email:${email}:1d`, LIMITS.emailPerDay.windowSec).then((r) => ({ ...r, max: LIMITS.emailPerDay.max })));
    }

    const results = await Promise.all(jobs);
    const over = results.filter((r) => r.count > r.max);
    if (over.length === 0) return { ok: true };
    // Wait for the longest-blocking window to clear so the retry clears all caps.
    const retryAfter = Math.max(1, ...over.map((r) => r.resetAt - now));
    return { ok: false, retryAfter };
  } catch (err) {
    console.error('[ratelimit] failing open:', err);
    return { ok: true };
  }
}
