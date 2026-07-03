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

⚠️ **ID mapping trap:** the content/rubrics docs use PRE-restructure lesson numbering; live ids in `src/data.ts` differ (e.g. docs "m11l4 12-month plan" = live `m11l5`; docs "m1l3 VP" = live `m1l5`). Never copy by id — match by lesson TITLE. A verified old→new map lives in the rubrics generator comment and in each doc's "ID map" section.

## Dev workflow & constraints (hard-won, follow these)
- **Deploy:** `npx vercel build --prod` → `npx vercel deploy --prebuilt --prod` → smoke via `/usr/bin/curl` (homepage 200, `/api/progress?email=…` returns JSON — SPA rewrite must not shadow `/api`). Vercel preview URLs are SSO-gated (unusable); test on prod.
- **Vercel Hobby limits:** max **12 serverless functions** — every `.ts` under `/api` counts (incl. `api/lib`); shared non-handler code goes in `src/` (e.g. `src/rubrics.ts`). `maxDuration: 60` is set in vercel.json — long AI generations must fit ~50s (trim max_tokens/verbosity, e.g. market research is budgeted to ~2300 tokens).
- **DB migrations:** `drizzle-kit push` needs a TTY (fails headless). Use a throwaway node script with `@neondatabase/serverless` + `ALTER TABLE … ADD COLUMN IF NOT EXISTS` (tagged templates only, or `sql.query()` for dynamic SQL). Update `src/db/schema.ts` in the same change.
- **Secrets:** keys live in `.env.local` only (git-ignored via `*.local`); Vercel env vars via Dashboard. Never print key values.
- **Test users:** create via `POST /api/user` with `freshStart: true`; walk lessons via `POST /api/brain {action:'toggle-complete'}`; program tasks auto-sync on `GET /api/tasks`. Always delete test users after (`DELETE FROM users WHERE email LIKE 'audit-%@test.local'` + `ALTER SEQUENCE users_id_seq RESTART WITH 1`) — cascades clean everything.
- **AI endpoints pattern:** action/mode routing inside existing handlers (brain.ts: snapshot/market-research; ai.ts: feedback/compare/delegate/generate-name; tasks: briefing/debrief) — never a new function file. Zod-validate LLM JSON leniently (`z.coerce`, `.catch()`); non-JSON answers may be a legit "ask one question" path.
- **Verification:** browser preview tooling does not work in this environment — verify with `tsc -b` + `vite build` + live curl checks against prod APIs; UI interactions get eyeballed by Shamil.
- Commits in English with `Co-Authored-By: Claude <model> <noreply@anthropic.com>`; commit per logical task; deploy after each user-visible change.

## Current state (2026-07-03)
Live: full Program v2 (13 modules, 87 lessons, all lecture bodies real — citations restored), Snapshot with checkpoint/check-in updates, Delegate A/B/C, per-block rubrics with NO-SCORE intake, Briefing/Debrief, Launch Readiness §7 with `lastReadinessGain`, mentor sessions S1–S3 (S3 completion = launch→growth transition), Market Research test mode, M0 intake redesign, dynamic Momentum ("Traction") card, weekly Pulse check-ins, routing (`/start`, `/dashboard`, `/learning/:course/:lesson`, `/tasks`, `/traction`), freshStart re-onboarding wipe. DB was wiped for launch (users start at id 1).

## Backlog (agreed, not started)
- Fill the 12 `TODO: rewrite` lecture texts from CONTENT_M5-M12.md (title-matched).
- Auth (magic link) — `/login`, `/auth/verify` are placeholders; then lock down email-in-query APIs + rate-limit AI endpoints.
- Landing page at `/` (placeholder hero now).
- Out of v2 scope per SPEC §9: paywall enforce, payments, Resend/email triggers (23-trigger table), booking calendar, Market Research full mode (needs search API decision: Exa vs Tavily), legal mini-course, viral cards, S3 certificate.
- Smaller: AI role-play (m3l6 practice customer, m8l4 skeptic, m12l4 investor Q&A), per-entry Interview Log AI review, "D + text" outreach draft buttons in field briefings, m0l4 link content fetching.
