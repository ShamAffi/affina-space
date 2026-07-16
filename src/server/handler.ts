import type { VercelRequest, VercelResponse } from '@vercel/node';
import { applyCors } from './http.js';
import { requireAuth } from './requireAuth.js';
import { checkRateLimit } from './ratelimit.js';
import { getDb, type Db } from './db.js';

export type AuthedCtx = { email: string; db: Db };
export type AuthedHandler = (
  req: VercelRequest,
  res: VercelResponse,
  ctx: AuthedCtx,
) => unknown | Promise<unknown>;

// Shared authed-endpoint preamble (audit P2). The block
//   applyCors → requireAuth → checkRateLimit(429) → getDb
// was copy-pasted into every session-guarded handler; a single wrapper makes the
// security-critical order impossible to get subtly wrong per endpoint. The handler
// runs only after CORS/preflight, a valid session cookie, and the rate-limit pass,
// and receives the authenticated (lowercased) email plus a DB client.
//
// Mixed pre/post-auth endpoints (ai generate-name, user onboarding POST, progress
// admin POST) and pre-auth ones (auth, cron, score, stripe webhook) deliberately do
// NOT use this — they keep a custom preamble but still share getDb() from db.ts.
export function withAuth(methods: string, handler: AuthedHandler) {
  return async (req: VercelRequest, res: VercelResponse) => {
    if (applyCors(req, res, methods)) return;
    const email = requireAuth(req, res);
    if (!email) return;
    const rl = await checkRateLimit(req, { email });
    if (!rl.ok) {
      if (rl.retryAfter) res.setHeader('Retry-After', String(rl.retryAfter));
      return res.status(429).json({ error: 'rate_limited', retryAfter: rl.retryAfter });
    }
    return handler(req, res, { email, db: getDb() });
  };
}
