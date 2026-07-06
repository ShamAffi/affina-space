// Frontend counterpart to the server helpers: turns non-OK API responses into typed
// errors the UI can branch on.
//  - 429  → RateLimitError  → "going too fast" copy (NOT a crash).
//  - 401  → SessionExpiredError → the session is gone (Auth Phase B): clear local state
//           and redirect to /login. Handled centrally via a registered handler so EVERY
//           call site (checkRes users + the global fetch interceptor) behaves identically,
//           instead of showing a fake "server hiccup".

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

export class SessionExpiredError extends Error {
  constructor() {
    super('unauthorized');
    this.name = 'SessionExpiredError';
  }
}

export function isSessionExpired(e: unknown): e is SessionExpiredError {
  return e instanceof SessionExpiredError;
}

// ── Central session-expiry handling ───────────────────────────────────────────
// App registers the actual "clear state + go to /login" action; helpers below just
// signal expiry. `firing` collapses a burst of simultaneous 401s into ONE redirect.
let onSessionExpired: (() => void) | null = null;
let firing = false;

export function setSessionExpiredHandler(fn: () => void): void {
  onSessionExpired = fn;
}

export function resetSessionExpired(): void {
  firing = false; // re-arm after a fresh login so a later expiry redirects again
}

export function triggerSessionExpired(): void {
  if (firing) return;
  firing = true;
  onSessionExpired?.();
  setTimeout(() => { firing = false; }, 1000);
}

/**
 * Use in a fetch chain: `.then(checkRes).then((r) => r.json())`.
 * Throws SessionExpiredError on 401 (and triggers the redirect), RateLimitError on 429,
 * and a plain Error on any other non-OK status. Reads Retry-After when present.
 */
export function checkRes(r: Response): Response {
  if (r.status === 401) {
    triggerSessionExpired();
    throw new SessionExpiredError();
  }
  if (r.status === 429) {
    const ra = Number(r.headers.get('Retry-After'));
    throw new RateLimitError(Number.isFinite(ra) && ra > 0 ? ra : undefined);
  }
  if (!r.ok) throw new Error('api error');
  return r;
}

export const RATE_LIMIT_MESSAGE = "You're going a bit fast — give it a moment, then try again.";
