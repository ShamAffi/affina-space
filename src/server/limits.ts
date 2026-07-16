// Input size caps for text that gets interpolated into a Claude prompt (audit F11/F21/F24).
// Rate limiting caps the NUMBER of calls; without these a single call could still carry
// ~1M tokens and run up the Anthropic bill. Every user-controlled string that reaches a
// prompt is clamped at the point it's read from req.body. 1 char ≈ ¼ token, so e.g. a
// 12k-char cap bounds one call's input to ~3k tokens.
export const LIMITS = {
  shortField: 600,     // a one-line field: idea / customer / model, a metric label, a name
  answer: 6000,        // a free-text exercise answer / textarea response
  longText: 12000,     // long-form: task submission, pasted transcript, saved lesson input
  rationale: 2000,     // a short justification (North Star rationale, a "why" line)
  preAuthField: 600,   // pre-auth onboarding fields (score, generate-name) — no session; tightest
} as const;

// Coerce to string and hard-cap its length. Non-strings become '' (callers already treat
// missing input as empty). Safe to apply to any req.body field before it touches a prompt.
export function clamp(v: unknown, max: number): string {
  return typeof v === 'string' ? v.slice(0, max) : '';
}

// Coerce to an integer within [min, max]; non-numeric / NaN / ±Infinity → min. For a
// client-supplied number that must never be trusted verbatim — e.g. the onboarding
// readiness score (audit F14): the client could send 100, so the server clamps it.
export function clampInt(v: unknown, min: number, max: number): number {
  const n = Number(v);
  return Number.isFinite(n) ? Math.max(min, Math.min(max, Math.round(n))) : min;
}
