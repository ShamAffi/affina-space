import crypto from 'node:crypto';
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { authTokens } from '../db/schema.js';

// Mint a magic-link token: store sha256(raw) + expiry in auth_tokens, return the
// /auth/verify URL carrying the raw token. Shared by api/auth.ts request-link (login,
// 15-min TTL) and the finish-registration emails (long TTL — the nudge may sit in an
// inbox for days). Lives in src/server/ (Vercel 12-function cap).
export async function createMagicLink(email: string, ttlMs: number): Promise<string> {
  const raw = crypto.randomBytes(32).toString('hex');
  const tokenHash = crypto.createHash('sha256').update(raw).digest('hex');
  const expiresAt = new Date(Date.now() + ttlMs);
  const db = drizzle(neon(process.env.DATABASE_URL!), { schema: { authTokens } });
  await db.insert(authTokens).values({ email, tokenHash, expiresAt });
  const appUrl = process.env.APP_URL || 'https://affina-space.vercel.app';
  return `${appUrl}/auth/verify?token=${raw}`;
}
