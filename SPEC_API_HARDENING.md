# API hardening — CORS lockdown + rate limiting (protect Anthropic billing)

> Problem: no auth + CORS `*` + zero rate limiting → the 7 Claude-calling
> endpoints are open. Anyone with a script can loop /api/ai and run up the
> Anthropic bill without limit. This is the pre-auth stopgap that caps the
> damage. (Real auth is a separate, larger task — this protects money NOW.)

## 0. Anthropic spend cap — ✅ DONE (Shamil set a monthly $ limit in the Console)

The hard backstop is in place: the monthly bill physically cannot exceed the
cap Shamil set. Everything below reduces the chance of hitting it.

## 1. The 7 endpoints to protect (call Claude)

`api/ai.ts` · `api/brain.ts` · `api/northstar/index.ts` · `api/pulse/draft.ts`
· `api/score.ts` · `api/tasks/index.ts` · `api/tasks/submit.ts`

The other 5 (progress, user, pulse/commit, pulse/index, tasks... non-AI paths)
get CORS lockdown but rate limiting is optional (cheap DB calls, lower risk).

## 2. CORS lockdown (necessary, but not billing protection on its own)

- Replace every `res.setHeader('Access-Control-Allow-Origin', '*')` with an
  **allowlist**. New env var `ALLOWED_ORIGINS` = comma-separated
  (e.g. `https://affina-space.vercel.app,http://localhost:5173`).
- Shared helper `api/lib/http.ts` — `applyCors(req, res)`: reads the request
  `Origin`, echoes it back only if it's in the allowlist, else omits the header
  (or sets the primary prod origin). Handles the OPTIONS preflight too.
- Refactor all 12 api files to call `applyCors(req, res)` instead of inline
  `*`. One helper, one source of truth.
- Reminder in code comment: CORS is browser-enforced only — it stops abuse
  from other websites' browsers, NOT curl/scripts. Rate limiting (below) is
  what protects the bill.

## 3. Rate limiting (the actual billing protection)

Since there's no auth, key limits on **IP** (primary — Vercel provides it via
`x-forwarded-for` / `x-real-ip`) AND **email** (secondary — from req body/query).

### DECISION: Neon-based limiter (Shamil chose this — no new services)
- Use the existing Neon Postgres. New table `rate_limits`:
  `key text` (e.g. `ip:1.2.3.4:min` / `email:x@y.com:day`), `window_start
  timestamptz`, `count int`, PRIMARY KEY on `key`.
- Fixed-window (simplest, good enough here): on each protected request, upsert
  the row for the current window bucket, increment `count`; if `count` exceeds
  the limit for that window → reject. Old rows can be lazily overwritten when a
  new window starts (window_start moves), or cleaned by a periodic delete.
- Helper `api/lib/ratelimit.ts` exporting `checkRateLimit(req, { email })` →
  returns `{ ok: boolean, retryAfter?: number }`. Do the IP-minute, IP-day and
  email-day checks inside it (3 keys). Keep it one round-trip where possible
  (batch the upserts) to limit added latency.
- No new dependency, no Upstash. Reuses the existing `DATABASE_URL` connection.
- Note: adds a small DB write per protected AI call — fine at MVP scale.
  If it ever becomes a latency/load issue, swap the helper's internals for
  Upstash later without touching the call sites.

### Limits (generous for real users, lethal to scripts)
Apply to the 7 Claude endpoints:
- **Per IP:** 20 requests / minute AND 300 / day.
- **Per email:** 200 requests / day.
A real founder doing a full session makes maybe 20–50 AI calls; these caps
never bite a real user but stop a loop cold. Tune later from real telemetry.

### On limit hit
- Return HTTP **429** with JSON `{ error: 'rate_limited', retryAfter }`.
- Frontend: the existing AI error/retry state (commit b486280) should show a
  friendly "You're going a bit fast — give it a moment" instead of a crash.
  Confirm 429 is handled distinctly from a 500.

## 4. Order of work

1. Anthropic Console spend cap (§0) — now, no code.
2. `applyCors` helper + refactor all 12 endpoints (§2).
3. `checkRateLimit` helper + wire into the 7 Claude endpoints (§3).
4. Frontend 429 handling (§3).

## 5. Env vars to add
`ALLOWED_ORIGINS` only (Neon limiter reuses existing `DATABASE_URL`).
Document in `.env.example`.

## 6. Explicitly out of scope (separate task)
Real authentication (Clerk/NextAuth). This spec is the pre-auth billing
stopgap only — it reduces abuse surface but does NOT secure per-user data
(email is still the identity; anyone with an email can still read/write that
user until auth lands). Do auth next.

## 7. Acceptance
- Anthropic key has a monthly spend cap set.
- Request to any Claude endpoint from an origin NOT in ALLOWED_ORIGINS is
  blocked by CORS in a browser.
- A script looping /api/ai from one IP gets 429 after the per-minute cap;
  a real user going through a module never sees a 429.
- 429 shows a friendly slow-down message, not a crash.
- npm run build passes.
