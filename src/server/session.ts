import crypto from 'node:crypto';
import type { VercelRequest, VercelResponse } from '@vercel/node';

// Passwordless session (SPEC_RESEND_AUTH §6): a signed, httpOnly cookie — no session
// table. Cookie = base64url(email|exp) + '.' + HMAC-SHA256(payload, SESSION_SECRET).
// Phase A only ISSUES this (on verify) and can READ it; enforcement on other
// endpoints is Phase B. Lives in src/server/ (Vercel 12-function cap).

const COOKIE = 'affina_session';
const MAX_AGE_DAYS = 30;
const MAX_AGE_SEC = MAX_AGE_DAYS * 24 * 60 * 60;

function sign(payload: string): string {
  const secret = process.env.SESSION_SECRET || '';
  return crypto.createHmac('sha256', secret).update(payload).digest('base64url');
}

export function issueSession(res: VercelResponse, email: string): void {
  const exp = Date.now() + MAX_AGE_SEC * 1000;
  const payload = Buffer.from(`${email}|${exp}`).toString('base64url');
  const value = `${payload}.${sign(payload)}`;
  res.setHeader(
    'Set-Cookie',
    `${COOKIE}=${value}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=${MAX_AGE_SEC}`,
  );
}

export function readSession(req: VercelRequest): string | null {
  const cookieHeader = req.headers.cookie;
  if (!cookieHeader) return null;
  const entry = cookieHeader.split(/;\s*/).find((c) => c.startsWith(`${COOKIE}=`));
  if (!entry) return null;
  const value = entry.slice(COOKIE.length + 1);
  const dot = value.lastIndexOf('.');
  if (dot < 0) return null;
  const payload = value.slice(0, dot);
  const sig = value.slice(dot + 1);
  const expected = sign(payload);
  // constant-time compare; guard equal length (timingSafeEqual throws otherwise)
  if (sig.length !== expected.length) return null;
  if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null;
  const decoded = Buffer.from(payload, 'base64url').toString('utf8');
  const bar = decoded.lastIndexOf('|');
  if (bar < 0) return null;
  const email = decoded.slice(0, bar);
  const exp = Number(decoded.slice(bar + 1));
  if (!Number.isFinite(exp) || Date.now() > exp) return null;
  return email || null;
}

export function clearSession(res: VercelResponse): void {
  res.setHeader('Set-Cookie', `${COOKIE}=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0`);
}
