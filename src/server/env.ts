import crypto from 'node:crypto';

// Fail-closed config access (audit P4). A security-critical secret must NEVER silently
// default to an empty/weak value — that turns a missing env var into a forgeable-cookie
// account takeover (F10 SESSION_SECRET). requireSecret throws loudly instead, so a
// misconfigured environment fails SHUT (the function 500s at cold start) rather than
// OPEN (auth bypass). Call it at module load so the failure is immediate and obvious.
export function requireSecret(name: string, minLength = 16): string {
  const v = process.env[name];
  if (!v || v.length < minLength) {
    throw new Error(
      `${name} is missing or shorter than ${minLength} chars — refusing to start fail-open. Set it in the environment.`,
    );
  }
  return v;
}

// Constant-time comparison for secret/token checks (audit F15). A plain `!==` on secrets
// leaks, via response timing, how many leading characters matched. timingSafeEqual does
// not. Length-guarded (timingSafeEqual throws on unequal lengths) and returns false for
// any missing value, so an unset server secret can never match — i.e. it fails closed.
export function safeEqual(a: string | undefined | null, b: string | undefined | null): boolean {
  if (!a || !b) return false;
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) return false;
  return crypto.timingSafeEqual(ab, bb);
}
