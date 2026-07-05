import type { VercelRequest, VercelResponse } from '@vercel/node';
import crypto from 'node:crypto';
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { eq, and, isNull, gt } from 'drizzle-orm';
import { applyCors } from '../src/server/http.js';
import { checkRateLimit } from '../src/server/ratelimit.js';
import { users, authTokens } from '../src/db/schema.js';
import { sendEmail, magicLinkEmail, welcomeEmail } from '../src/server/email.js';
import { issueSession, clearSession } from '../src/server/session.js';
import { createMagicLink } from '../src/server/magicLink.js';
import { sendOnce } from '../src/server/emailLog.js';

// Dedicated Resend + magic-link auth function (SPEC_RESEND_AUTH §4). Action-routed,
// rate-limited. Phase A: issue a session on verify; enforcement elsewhere is Phase B.

function getDb() {
  const sql = neon(process.env.DATABASE_URL!);
  return drizzle(sql, { schema: { users, authTokens } });
}

const sha256 = (s: string) => crypto.createHash('sha256').update(s).digest('hex');

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (applyCors(req, res, 'POST,OPTIONS')) return;

  const rl = await checkRateLimit(req); // reuses ip:min/ip:day + email:day keys
  if (!rl.ok) {
    if (rl.retryAfter) res.setHeader('Retry-After', String(rl.retryAfter));
    return res.status(429).json({ error: 'rate_limited', retryAfter: rl.retryAfter });
  }
  if (req.method !== 'POST') return res.status(405).json({ error: 'method not allowed' });

  const db = getDb();
  const action = (req.body ?? {}).action;

  // ── logout (Phase B §5) — clear the session cookie ───────────────────────────
  if (action === 'logout') {
    clearSession(res);
    return res.status(200).json({ ok: true });
  }

  // ── request a magic link ─────────────────────────────────────────────────────
  if (action === 'request-link') {
    const email = String(req.body?.email ?? '').trim().toLowerCase();
    if (!email || !email.includes('@')) return res.status(400).json({ error: 'valid email required' });

    try {
      // Optional post-verify redirect (funnel confirm-email → program start). Only safe
      // in-app paths; Verify re-sanitizes on read too.
      const rawNext = req.body?.next;
      const next = typeof rawNext === 'string' && /^\/[A-Za-z0-9/_-]*$/.test(rawNext) ? rawNext : undefined;
      // 15-min magic link; only sha256(token) is stored (raw lives in the emailed link).
      const link = await createMagicLink(email, 15 * 60 * 1000, next);
      // fire-and-forget: sendEmail never throws; await so the lambda doesn't freeze mid-send.
      await sendEmail(magicLinkEmail(email, link));
    } catch (err) {
      console.error('[auth] request-link failed:', err);
      // fall through — still return 200 (don't leak failures or account existence)
    }
    // Always 200 regardless of whether the account exists — no account enumeration.
    return res.status(200).json({ ok: true });
  }

  // ── verify a magic link ──────────────────────────────────────────────────────
  if (action === 'verify-link') {
    const token = String(req.body?.token ?? '').trim();
    if (!token) return res.status(400).json({ error: 'token required' });

    const row = await db.query.authTokens.findFirst({
      where: and(
        eq(authTokens.tokenHash, sha256(token)),
        isNull(authTokens.usedAt),
        gt(authTokens.expiresAt, new Date()),
      ),
    });
    if (!row) return res.status(401).json({ error: 'invalid_or_expired' });

    // Single-use: consume the token.
    await db.update(authTokens).set({ usedAt: new Date() }).where(eq(authTokens.id, row.id));

    // Upsert user by email — creating the shell doubles as signup. AMENDMENT: welcome
    // fires on the verifiedAt null→set transition only (genuine first verification).
    const existing = await db.query.users.findFirst({ where: eq(users.email, row.email) });
    let isNew = false;
    let firstVerify = false;
    let userId: number;
    if (!existing) {
      const [created] = await db.insert(users).values({ email: row.email, verifiedAt: new Date() }).returning({ id: users.id });
      userId = created.id;
      isNew = true;
      firstVerify = true;
    } else {
      userId = existing.id;
      if (!existing.verifiedAt) {
        await db.update(users).set({ verifiedAt: new Date() }).where(eq(users.id, existing.id));
        firstVerify = true;
      }
    }
    if (firstVerify) await sendOnce(userId, 'welcome', 'once', welcomeEmail(row.email, existing?.name ?? undefined));

    issueSession(res, row.email);
    return res.status(200).json({ ok: true, email: row.email, isNew });
  }

  return res.status(400).json({ error: 'unknown action (expected request-link|verify-link)' });
}
