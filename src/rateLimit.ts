// Frontend counterpart to src/server/ratelimit.ts. A 429 from any AI endpoint
// means "going too fast" — NOT a crash. Call sites catch RateLimitError and show
// the friendly slow-down copy instead of the generic "something broke" state.

export class RateLimitError extends Error {
  retryAfter?: number;
  constructor(retryAfter?: number) {
    super('rate_limited');
    this.name = 'RateLimitError';
    this.retryAfter = retryAfter;
  }
}

export function isRateLimit(e: unknown): e is RateLimitError {
  return e instanceof RateLimitError;
}

/**
 * Use in a fetch chain: `.then(checkRes).then((r) => r.json())`.
 * Throws RateLimitError on 429 (distinct from a generic failure, so the UI can
 * branch), and a plain Error on any other non-OK status. Reads the Retry-After
 * header when present.
 */
export function checkRes(r: Response): Response {
  if (r.status === 429) {
    const ra = Number(r.headers.get('Retry-After'));
    throw new RateLimitError(Number.isFinite(ra) && ra > 0 ? ra : undefined);
  }
  if (!r.ok) throw new Error('api error');
  return r;
}

export const RATE_LIMIT_MESSAGE = "You're going a bit fast — give it a moment, then try again.";
