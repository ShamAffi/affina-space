import type { VercelRequest, VercelResponse } from '@vercel/node';
import { readSession } from './session.js';

// Auth Phase B guard (SPEC_AUTH_PHASE_B §1). Identity comes ONLY from the signed,
// httpOnly session cookie — never from req.query.email / req.body.email (the client
// cannot forge the cookie). Returns the authenticated (lowercased) email, or null
// AFTER sending 401 — callers do `const email = requireAuth(req, res); if (!email) return;`.
// Lives in src/server/ (Vercel 12-function cap). Pre-auth surfaces (auth.ts, cron.ts,
// the onboarding pending-write path, score, ai generate-name) must NOT use this.
export function requireAuth(req: VercelRequest, res: VercelResponse): string | null {
  const email = readSession(req);
  if (!email) {
    res.status(401).json({ error: 'unauthorized' });
    return null;
  }
  return email.trim().toLowerCase();
}
