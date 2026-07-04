import type { VercelRequest, VercelResponse } from '@vercel/node';

// Lives in src/ (not api/lib) on purpose: every .ts under /api counts against the
// Vercel Hobby 12-function cap, and we're already at 12. api handlers import this.

// Fallback keeps the live app working even if ALLOWED_ORIGINS is not set in an env.
const DEFAULT_ORIGIN = 'https://affina-space.vercel.app';

function allowedOrigins(): string[] {
  const raw = process.env.ALLOWED_ORIGINS?.trim();
  if (!raw) return [DEFAULT_ORIGIN];
  return raw.split(',').map((s) => s.trim()).filter(Boolean);
}

/**
 * CORS lockdown + preflight handling, shared by every /api handler.
 *
 * Echoes the request Origin back in `Access-Control-Allow-Origin` ONLY when it is
 * in the `ALLOWED_ORIGINS` allowlist (comma-separated env var; falls back to the
 * prod origin when unset). An origin not on the list gets no ACAO header at all,
 * so a browser on another site is blocked from reading the response.
 *
 * NOTE: CORS is browser-enforced ONLY. It stops abuse from other websites'
 * browsers — NOT curl, scripts, or server-to-server calls. Rate limiting
 * (`checkRateLimit`) is what actually protects the Anthropic bill.
 *
 * Returns `true` when it has already ended the response (an OPTIONS preflight):
 * the caller must `return` immediately in that case.
 */
export function applyCors(
  req: VercelRequest,
  res: VercelResponse,
  methods = 'GET,POST,OPTIONS',
  headers = 'Content-Type',
): boolean {
  const origin = typeof req.headers.origin === 'string' ? req.headers.origin : '';
  res.setHeader('Vary', 'Origin');
  if (origin && allowedOrigins().includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Access-Control-Allow-Methods', methods);
  res.setHeader('Access-Control-Allow-Headers', headers);
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return true;
  }
  return false;
}
