# Affina Space

Virtual incubator for early-stage female founders. React + Vite + TS + Tailwind SPA (react-router), Vercel Hobby, Neon Postgres + Drizzle in `/api`. Prod: https://affina-space.vercel.app

## Design — read this before any UI work
The visual design system is defined in **[DESIGN.md](./DESIGN.md)**. Tokens are wired into `tailwind.config.js` and `src/index.css`.

Use the Tailwind classes (`bg-brand`, `text-ink`, `bg-canvas`, `rounded-pill`, `rounded-card`, `font-display`, `font-sans`, `bg-brand-50`, etc.). **Never** reintroduce Inter, pure-white (`#fff`) page backgrounds, pure-black (`#000`) text, purple gradients, or the old `#9333EA` purple.

Brand in one line: **editorial, confident, minimal — royal-violet primary (`#7150EA`) + emerald accent (`#119C74`) on a soft light-gray canvas (`#F4F4F5`), big typography, ultra-rounded pills, flat surfaces.**

## Product spec — source of truth
- **SPEC_PROGRAM_V2.md** — the program (13 modules M0–M12, block kinds, Snapshot, Delegate, Briefing/Debrief, Launch Readiness §7, mentor sessions). Implemented in full (Phases 1–3 + audit P1–P5).
- **SPEC_M0_INTAKE_REDESIGN.md** — M0 intake (implemented: m0l3 five-field review + links, m0l4 Typeform quiz, m0l5 approve CTA).
- **RULES_DONE_FOR_YOU.md** — Market Research (m2l6, live in test mode "model estimates only") + Delegate modes A/B/C map (§2.2–2.4).
- **RUBRICS_M0-M4.md / RUBRICS_M5-M12.md** — per-block AI-review rubrics → generated into `src/rubrics.ts` (44 rubrics + global rules). Edit the MD, regenerate.
- **CONTENT_*.md** — final lecture texts. All "Coming soon" stubs are filled; 12 `// TODO: rewrite per spec` blocks in data.ts still have old text while their REWRITE versions sit ready in CONTENT_M5-M12.md.

**ID numbering:** all working docs (CONTENT_*, RUBRICS_*, RULES_DONE_FOR_YOU) were normalized to the live `src/data.ts` numbering on 2026-07-03 — ids now match 1:1 (retired old blocks appear as `old-mXlY` markers). The only doc still in pre-restructure numbering is the historical SPEC_PROGRAM_V2.md (flagged in its header) — for it, match by block title.

## Dev workflow & constraints (hard-won, follow these)
- **Deploy:** `npx vercel build --prod` → `npx vercel deploy --prebuilt --prod` → smoke via `/usr/bin/curl` (homepage 200, `/api/progress?email=…` returns JSON — SPA rewrite must not shadow `/api`). Vercel preview URLs are SSO-gated (unusable); test on prod.
- **Vercel Hobby limits:** max **12 serverless functions** — every `.ts` under `/api` counts; shared non-handler code goes in `src/server/` (e.g. `src/rubrics.ts`, `src/server/*`). **Currently 10/12** (`api/lib/` retired — progressUtils moved to `src/server/`; pulse consolidated to one `api/pulse.ts`; SPEC_RESEND_AUTH §1). `maxDuration: 60` is set in vercel.json — long AI generations must fit ~50s (trim max_tokens/verbosity, e.g. market research is budgeted to ~2300 tokens).
- **DB migrations:** `drizzle-kit push` needs a TTY (fails headless). Use a throwaway node script with `@neondatabase/serverless` + `ALTER TABLE … ADD COLUMN IF NOT EXISTS` (tagged templates only, or `sql.query()` for dynamic SQL). Update `src/db/schema.ts` in the same change.
- **Secrets:** keys live in `.env.local` only (git-ignored via `*.local`); Vercel env vars via Dashboard. Never print key values.
- **Test users:** create via `POST /api/user` with `freshStart: true`; walk lessons via `POST /api/brain {action:'toggle-complete'}`; program tasks auto-sync on `GET /api/tasks`. Always delete test users after (`DELETE FROM users WHERE email LIKE 'audit-%@test.local'` + `ALTER SEQUENCE users_id_seq RESTART WITH 1`) — cascades clean everything.
- **AI endpoints pattern:** action/mode routing inside existing handlers (brain.ts: snapshot/market-research; ai.ts: feedback/compare/delegate/generate-name; tasks: briefing/debrief) — never a new function file. Zod-validate LLM JSON leniently (`z.coerce`, `.catch()`); non-JSON answers may be a legit "ask one question" path. **Models are centralized:** `src/server/models.ts` (`MODELS.standard`=`claude-sonnet-5`) + every call routes through `callClaude(params, meta)` in `src/server/anthropic.ts` (shared client + per-call usage logging) — no inline model strings (`grep claude- api/` = 0), no per-file `new Anthropic`. `callClaude` defaults `thinking:{type:'disabled'}` (Sonnet 5 runs adaptive otherwise); pass your own `thinking` to override.
- **Verification:** browser preview tooling does not work in this environment — verify with `tsc -b` + `vite build` + live curl checks against prod APIs; UI interactions get eyeballed by Shamil.
- Commits in English with `Co-Authored-By: Claude <model> <noreply@anthropic.com>`; commit per logical task; deploy after each user-visible change.

## Current state (2026-07-04)
Program v2 fully live, ALL lecture texts filled (M0–M12, LECTURES_V2 markup via LessonBody renderer). Paywall LIVE (SPEC_PAYWALL): m4l10 "Founder's Case" reveal (ambition-calibrated to m0l4 quiz goal3y) → dismissible /unlock (users.subscribed; "Unlock" is a stub flipping the flag, Stripe drops in later) gating M5–M12 → full-page /start-session S1 booking. Also: M0 intake (6-Q quiz incl goal3y), m4l5 three-block For/Against/Conclusion, Traction card deterministic Business tiers (+ red staleness card), Interview Log Add-Transcript, Tasks Real World/Practice + newest-first, course-level pills, Snapshot, Delegate A/B/C, 44 rubrics, mentor S1–S3, Market Research test-mode. DB wiped for launch.


## Backlog (agreed, not started)
- Stripe: paywall "Unlock" is a stub (sets subscribed=true); drop checkout between click and flag, gating unchanged. Plus [PRICE] + billing-period decision (SPEC_PAYWALL §6: "6 weeks" vs 12-week — unresolved).
- Auth Phase A SHIPPED (SPEC_RESEND_AUTH): Resend email layer (`src/server/email.ts`, fire-and-forget) + magic-link login (`api/auth.ts` request-link/verify-link, `auth_tokens` table, signed httpOnly session cookie `src/server/session.ts`). Real /login + /auth/verify; welcome + subscription emails wired. §1 freed slots first (progressUtils→src/server, pulse 3→1). ⚠️ Manual: add RESEND_API_KEY, EMAIL_FROM, SESSION_SECRET, APP_URL to Vercel env (prod has only ANTHROPIC_API_KEY+DATABASE_URL). **Phase B (NOT done):** enforce the session on endpoints + retire email-in-query identity; scheduled/nudge emails via Vercel Cron; `api/stripe.ts` (uses a freed slot).
- API hardening SHIPPED (SPEC_API_HARDENING.md): CORS allowlist (`ALLOWED_ORIGINS`, `applyCors` in src/server/http.ts) on all 11 handlers + Neon rate limiter (src/server/ratelimit.ts, `rate_limits` table, IP 20/min+300/day, email 200/day) on the 7 Claude endpoints → 429 + Retry-After, fails open. Helpers in src/ (not api/lib — 12-fn cap). ⚠️ Manual: set Anthropic monthly spend cap (Console → Billing) + `ALLOWED_ORIGINS` in Vercel env.
- Model strategy SHIPPED (SPEC_MODEL_STRATEGY.md): central `src/server/models.ts` + `callClaude` wrapper (usage logging). All 16 calls on Sonnet 5; name-gen moved Haiku→Sonnet 5 (max_tokens 32). Prompt caching wired on feedback/compare but DORMANT — every stable prefix is 125–1289 tok, below Sonnet 5's ~2048 cache min, so `cache_read` stays 0 until prompts grow. Open decision: promote brain snapshot + founders-case to `deep`/Opus 4.8 (recommended in §3 map, left on standard).
- Landing at /.
- Out of v2 scope (SPEC §9): Resend 23-trigger emails, booking calendar, Market Research full mode (needs Exa-vs-Tavily), legal mini-course, viral cards, S3 certificate.
- Smaller: AI role-plays (m3l6/m8l4/m12l4), per-entry Interview Log review, "D + text" outreach buttons, m11l4 three-block treatment (awaiting decision).
