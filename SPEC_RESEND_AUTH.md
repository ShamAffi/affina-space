# Resend email + magic-link auth (Phase A: foundation + login)

> Connect Resend as the email layer, and build magic-link login on top of it.
> One integration serves both: transactional emails AND passwordless auth.
> This is **Phase A** — email foundation + working login that issues a session.
> Enforcing that session on every existing endpoint (retiring email-in-query)
> is **Phase B**, a separate spec — DON'T do it here (it would break every API
> at once).

## ⚠️ Platform constraints (from CLAUDE.md — do not violate)
- **Vercel Hobby caps at 12 serverless functions; every `.ts` under `/api`
  counts (incl. `api/lib`). We are at 12/12 — no headroom.** §1 frees slots
  BEFORE anything is added.
- New shared/non-handler helpers go in **`src/server/`**, never `api/`.
- `maxDuration: 60`. Email send is fast; fine.
- DB migration: `drizzle-kit push` fails headless — use a throwaway node
  script with `@neondatabase/serverless` + `CREATE TABLE IF NOT EXISTS`
  (tagged templates / `sql.query()`), and update `src/db/schema.ts` in the
  same change.
- Verify with `tsc -b` + `vite build` + live curl against prod; UI eyeballed.
- Secrets in `.env.local` + Vercel dashboard only. Never print key values.

---

## §1 — Free up function slots FIRST (prerequisite refactor)

We need a **dedicated `api/auth.ts`** function for Resend + auth, plus room for
a future `api/stripe.ts`. Reclaim slots:

**1a. Move the mis-placed helper (free, zero risk) — +1 slot**
- `api/lib/progressUtils.ts` is a pure helper (weights + readiness math), NOT a
  handler (no `export default`). It wastes a function slot.
- Move it to **`src/server/progressUtils.ts`**; update every import
  (`grep -rn "lib/progressUtils" api/ src/`). Delete the now-empty `api/lib/`.
- Acceptance: `find api -name '*.ts'` no longer lists `progressUtils`; build passes.

**1b. Consolidate `pulse/` (3 functions → 1) — +2 slots**
- Merge `api/pulse/index.ts` + `api/pulse/draft.ts` + `api/pulse/commit.ts`
  into a single **`api/pulse.ts`** using the existing mode/action pattern
  (like `ai.ts`/`brain.ts`):
  - `GET /api/pulse?email=…` → current `index.ts` behavior (list check-ins).
  - `POST /api/pulse {action:'draft', …}` → current `draft.ts` behavior.
  - `POST /api/pulse {action:'commit', …}` → current `commit.ts` behavior.
- **Update all frontend callers** — `grep -rn "pulse/index\|pulse/draft\|pulse/commit\|/api/pulse" src/` and repoint them to the new shape.
- Delete the old `api/pulse/` directory.
- Acceptance: check-in flow works end-to-end on prod (draft generates, commit
  saves, list returns) — this is the risk area, test it thoroughly.

**Result: 12 → 9 functions.** Now add `api/auth.ts` (→10) with room for
`api/stripe.ts` later (→11). Do NOT skip §1 — adding `api/auth.ts` at 12/12
breaks the deploy.

---

## §2 — Resend setup

**✅ ALREADY DONE (verified 2026-07-04) — no manual Resend work needed:**
- Domain `affina.space` is **verified** in the Resend account (sending enabled,
  EU region). Confirmed via a live test send.
- API key is in `.env.local` (`RESEND_API_KEY`). Confirmed working.
- **From identity: `EMAIL_FROM=Affina <hello@affina.space>`** — tested, delivers.
- ⚠️ The ONLY remaining manual step: add `RESEND_API_KEY` + `EMAIL_FROM` to the
  **Vercel** env (Dashboard → Settings → Environment Variables) for prod. Local
  `.env.local` already has the key.

**Code:**
- `npm i resend`.
- Env vars (§9): `RESEND_API_KEY` (set), `EMAIL_FROM` (= above), `SESSION_SECRET`
  (new — generate), `APP_URL`.

---

## §3 — Email helper + templates (`src/server/email.ts`)

- Export `sendEmail({ to, subject, html }): Promise<void>` wrapping
  `new Resend(process.env.RESEND_API_KEY)`. Log failures, **never throw into
  the request path** — a failed welcome email must not fail user creation
  (fire-and-forget with a caught error + logged).
- Templates are **inline-styled HTML** (email clients strip `<style>`). One
  shared wrapper (Affina wordmark header + small footer) + per-email body.
  Use DESIGN.md brand: violet `#7150EA`, emerald `#119C74`, canvas `#F4F4F5`,
  ink text — but hardcode hex inline (no Tailwind in email).
- Keep templates as small functions returning HTML strings; no heavy template
  engine.

---

## §4 — `api/auth.ts` — the dedicated function (Resend + magic link)

Single handler, action-routed. **Rate-limit both actions** via the existing
`src/server/ratelimit.ts` (reuse `ip:min` + `email:day` keys).

**`POST /api/auth {action:'request-link', email}`**
1. Normalize email (trim/lowercase).
2. Generate a 32-byte random token (`crypto.randomBytes(32).hex`).
3. Store `sha256(token)` + `expires_at = now + 15 min` in `auth_tokens`
   (§5). Store only the HASH; the raw token lives only in the emailed link.
4. `sendEmail` a magic link: `${APP_URL}/auth/verify?token=<raw>`.
5. **Always return `200 {ok:true}`** regardless of whether the email exists —
   don't leak account existence.

**`POST /api/auth {action:'verify-link', token}`**
1. `sha256(token)` → look up a row that is unexpired AND `used_at IS NULL`.
   Not found/expired/used → `401 {error:'invalid_or_expired'}`.
2. Mark the row `used_at = now` (single-use).
3. **Upsert the user by email**: if none exists, create a minimal shell
   (`email` only) — this doubles as signup. Return `isNew: true/false`.
4. Issue a session cookie (§6) and return `{ ok:true, email, isNew }`.

---

## §5 — Schema: `auth_tokens` table

Migration via throwaway node script (`CREATE TABLE IF NOT EXISTS`), and add to
`src/db/schema.ts`:

```ts
export const authTokens = pgTable('auth_tokens', {
  id: serial('id').primaryKey(),
  email: text('email').notNull(),
  tokenHash: text('token_hash').notNull(),   // sha256 of the raw token
  expiresAt: timestamp('expires_at').notNull(),
  usedAt: timestamp('used_at'),              // null until consumed (single-use)
  createdAt: timestamp('created_at').defaultNow(),
});
```
- Index on `tokenHash` for lookup. Old rows can be lazily ignored (expired) or
  cleaned by a periodic delete later — not required now.

---

## §6 — Session (`src/server/session.ts`)

Passwordless session via a **signed httpOnly cookie** (no session table needed).
- `issueSession(res, email)` — set cookie `affina_session` =
  `base64(email|exp) + '.' + hmacSHA256(payload, SESSION_SECRET)`,
  `HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=30d`.
- `readSession(req): string | null` — parse cookie, verify HMAC + expiry,
  return email or null.
- `clearSession(res)` — expire the cookie (for a future logout).
- **Phase A does NOT enforce this** on other endpoints — it just gets issued on
  verify and can be read. Enforcement = Phase B.

---

## §7 — Frontend: real `/login` + `/auth/verify` (replace placeholders)

Current `src/App.tsx:86-87` has `LoginPlaceholder` + `VerifyPlaceholder`.
- **`/login`**: email field → `POST /api/auth {action:'request-link', email}` →
  success state: "Check your inbox — we sent you a magic link." (No password.)
- **`/auth/verify`**: on mount, read `?token=` from URL →
  `POST /api/auth {action:'verify-link', token}` → on success, route by
  `isNew`: new user → onboarding; existing → dashboard. On failure: "This link
  expired or was already used — request a new one" + link back to `/login`.
- Keep DESIGN.md tokens (violet/emerald/canvas, pills, big type).

---

## §8 — First tranche of transactional emails (event-triggered, no cron)

Wire these now — each fires inline from existing handler code, fire-and-forget:
1. **Magic link** — from `api/auth.ts` request-link (§4).
2. **Welcome** — on first user creation (`api/user.ts` POST create path). Warm,
   short: what Affina is, "start Module 0" CTA to `APP_URL`.
3. **Subscription confirmed** — when `subscribed` flips true (the `/unlock`
   path). "You're in — here's what you unlocked" + book-S1 CTA.

Everything else (weekly pulse nudge, mentor-session-due reminder,
re-engagement, streak, etc.) is **Phase B** — those need a scheduler (Vercel
Cron), not inline triggers. Don't build them here.

---

## §9 — Env vars (document in `.env.example`)
- `RESEND_API_KEY` — Resend API key.
- `EMAIL_FROM` — e.g. `Affina <hello@affina.space>`.
- `SESSION_SECRET` — random 32+ byte string for cookie HMAC.
- `APP_URL` — e.g. `https://affina-space.vercel.app` (for link building).
- (existing `ALLOWED_ORIGINS`, `DATABASE_URL`, `ANTHROPIC_API_KEY` unchanged.)

---

## §10 — Out of scope (Phase B / later — do NOT do here)
- **Enforcing the session** on the other endpoints / retiring email-in-query
  identity. Big change; separate spec. Phase A leaves existing APIs working as
  they are.
- **Scheduled/nudge emails** via Vercel Cron (pulse reminder, session-due,
  re-engagement) and the remaining of the ~23 triggers.
- **Stripe** webhook (`api/stripe.ts` — uses a freed slot later).
- Email open/click analytics.

---

## §11 — Acceptance
- [ ] §1 done: `progressUtils` in `src/server/`, `pulse/` consolidated to
      `api/pulse.ts`; `find api -name '*.ts' | wc -l` ≤ 10; check-in flow works.
- [ ] `api/auth.ts` exists as the dedicated Resend+auth function.
- [ ] `auth_tokens` table created; `src/db/schema.ts` updated.
- [ ] Request a magic link → email arrives (real inbox) with a working link.
- [ ] Click link → session cookie set → new user lands in onboarding, existing
      user lands on dashboard.
- [ ] Expired/reused token → clean error, not a crash.
- [ ] request-link is rate-limited and always returns 200 (no account-leak).
- [ ] Welcome email fires on new signup; subscription email on unlock.
- [ ] Email send failure does NOT fail the underlying request (fire-and-forget).
- [ ] `tsc -b` + `vite build` pass; prod smoke green (homepage 200,
      `/api/progress` returns JSON, `/api/pulse` works after consolidation).
