# Emails — complete spec (all emails: copy + triggers + dev instructions)

> THE single source of truth for every email Affina sends. Final English copy,
> triggers, data sources, and build instructions.
>
> **Depends on** SPEC_RESEND_AUTH.md for the plumbing: slot cleanup (§1), Resend
> helper `src/server/email.ts` (§3), `api/auth.ts`, sessions. That doc owns the
> AUTH mechanics (token/session/login pages); THIS doc owns all email content,
> triggers, and the lifecycle cron. Supersedes the email drafts in
> SPEC_RESEND_AUTH §8 and consolidates SPEC_EMAIL_LIFECYCLE.md.
>
> App is **English-language** — all copy below is final English, ready to wire.

## Platform constraints (from CLAUDE.md — do not violate)
- Vercel Hobby **12-function cap**; every `.ts` under `/api` counts. Slot
  cleanup in SPEC_RESEND_AUTH §1 frees room for `api/auth.ts` + `api/cron.ts`.
- New helpers go in `src/server/`, never `api/`.
- DB migrations via throwaway node script (`ADD COLUMN / CREATE TABLE IF NOT
  EXISTS`), update `src/db/schema.ts` same change. `drizzle-kit push` fails headless.
- Verify with `tsc -b` + `vite build` + live curl on prod.

---

## §0 — Shared foundation (build once, all emails use it)

- **Resend:** account-level, domain `affina.space` **verified** (tested working
  2026-07-04). `RESEND_API_KEY` in `.env.local` (add to Vercel env for prod).
- **From:** `EMAIL_FROM = "Affina <hello@affina.space>"` (tested, delivers).
- **`src/server/email.ts`** — `sendEmail({to, subject, html})` wrapping Resend.
  **Fire-and-forget:** catch + log errors; NEVER throw into a request path (a
  failed welcome email must not fail signup). Log every send to `email_log` (§4).
- **Shared brand wrapper** — one HTML shell used by every email: Affina wordmark
  header, body slot, small footer (unsubscribe link where legally needed for
  non-transactional). **Inline-styled HTML** (email clients strip `<style>`).
  Brand: violet `#7150EA`, emerald `#119C74`, canvas `#F4F4F5`, ink text —
  hardcode hex inline, no Tailwind. Buttons = filled violet pill.
- Keep templates as small functions returning HTML strings. No template engine.

---

## §1 — Email catalog

| # | Email | Type | Trigger | Phase |
|---|---|---|---|---|
| 1 | Magic link | transactional | user requests login link | A |
| 2 | Welcome | transactional | **email VERIFIED via magic link (verify-link) — see AMENDMENT** | A |
| 3 | Subscription confirmed | transactional | `subscribed` flips true (unlock) | A |
| 4 | Mentor session booked | transactional | user books S1/S2/S3 | A |
| 5 | Weekly tasks | lifecycle (cron) | Thursday, IF ≥1 open task — **registered only** | B |
| 6 | Business-week reflection | lifecycle (cron) | Saturday, active users — **registered only** | B |
| 7 | Book your mentor | lifecycle (cron) | session due & unbooked — **registered only** | B |
| 8 | Re-engagement | lifecycle (cron) | 14 days no login, once — **registered only** | B |
| 9 | Finish registration #1 | lifecycle (cron) | pending user, +1 day | B |
| 10 | Finish registration #2 | lifecycle (cron) | pending user, +3 days | B |
| 11 | Finish registration #3 | lifecycle (cron) | pending user, +7 days | B |
| — | Updates / tips | broadcast | manual, Resend dashboard | later |

Dropped by decision: "first paying customer" and "milestone completed" emails.
**See AMENDMENT (registration states) below — it changes #2's trigger and gates
#5–#8 to registered users only.**

---

## §2 — Transactional emails (Phase A) — instant, fired inline from code

Each fires with `sendEmail(...)` at the moment of the event, fire-and-forget.

### 2.1 Magic link
- **Fires from:** `api/auth.ts` `request-link` action (SPEC_RESEND_AUTH §4).
- **Data:** the signed link `${APP_URL}/auth/verify?token=<raw>`.
- **Copy:**
  - **Subject:** Your Affina sign-in link
  - **Body:**
    > Hey 👋
    > Tap the button and you're in. No password needed.
    >
    > **[ Sign in to Affina ]**
    >
    > This link works once and expires in 15 minutes. If this wasn't you, just ignore this email — nothing will happen.
    >
    > — Affina

### 2.2 Welcome
- **Fires from:** first user creation (`api/user.ts` POST create path). Once.
- **Data:** user name if present.
- **Copy:**
  - **Subject:** Welcome to Affina — let's build this
  - **Body:**
    > Hey [name] 👋
    > You're in. Affina takes you from an idea to your first paying customer — one small, real step at a time. Not a course to watch: a program to *do*.
    >
    > You won't do it alone — you've got AI guidance, live mentors, and a community of women building right alongside you.
    >
    > Start with Module 0. It's short, and it sets everything up.
    >
    > **[ Start Module 0 ]**
    >
    > — Affina

### 2.3 Subscription confirmed
- **Fires from:** the `/unlock` path where `subscribed` flips true.
- **Copy:**
  - **Subject:** You're in — the full program is open
  - **Body:**
    > That's the hard part started — now you build the business.
    >
    > You've just unlocked:
    > • All 12 modules — idea → first paying customer
    > • 3 live 1:1 mentor sessions with real founders
    > • Specialized deep-dive programs
    > • Live events & a community of women founders
    >
    > First thing: book your **Start** session with a mentor — the fastest way to make sure you're pointed at the right thing before Module 5.
    >
    > **[ Book my Start session ]**
    >
    > — Affina

### 2.4 Mentor session booked
- **Fires from:** booking action for S1/S2/S3 (the existing booking stub).
- **Data:** which session (Start/Mid/Final), date/time if the booking captures it.
- **Copy:**
  - **Subject:** Your [Start] session is booked ✅
  - **Body:**
    > You're set for your **[Start]** session[ on [date/time]].
    >
    > It's a 1:1 with a founder who's done this. Come with your Snapshot open and whatever's on your mind — this hour is yours.
    >
    > See you there.
    >
    > — Affina
- If the booking stub captures no date (mailto/Calendly placeholder), send a
  simpler "we'll be in touch to confirm your time" variant — dev picks based on
  what the stub returns.

---

## §3 — Lifecycle emails (Phase B) — cron-driven, personalized

### Cron design
- **One daily cron** → `api/cron.ts` (uses a freed slot). Hobby-friendly
  (1 job, daily). Per-user sweep decides what to send *today*:
  ```
  For each user:
    active = lastActiveAt within 14 days
    if active:
      Thursday & ≥1 open task            → 2.5 Weekly tasks
      Saturday                           → 2.6 Business-week reflection
      mentor session due & unbooked & not yet nudged → 2.7 Book mentor
    else (≥14 days inactive):
      not already re-engaged             → 2.8 Re-engagement (once), mark it
  ```
- **Protect** with `CRON_SECRET` (env) — reject calls without it (401).
- **Trigger:** Vercel Cron in `vercel.json` (`0 9 * * *`, pick a sensible TZ for
  day-of-week). Fallback if Hobby cron limits bite: external free scheduler
  (cron-job.org / GitHub Actions) hitting `api/cron.ts` daily.
- **Idempotency:** check/write `email_log` (§4) — a user gets each lifecycle
  email at most once per window; re-engagement & mentor-nudge fire once total.

### 2.5 Weekly tasks (Thursday)
- **Condition:** active user AND ≥1 open task in `tasks` (status ≠ done). Zero
  open tasks → send nothing.
- **Content:** deterministic list of her REAL open tasks (title, maybe module) —
  never invent tasks. Optional ONE AI-composed warm intro line via `callClaude`
  (like momentumCard); the list itself stays deterministic.
- **Copy:**
  - **Subject:** Your tasks for this week
  - **Body:**
    > Hey! Here's what's waiting for you in Affina — small steps toward your first customer:
    >
    > • [task 1]
    > • [task 2]
    > • [task 3]
    >
    > Even one task done is momentum. Start with the easiest one.
    >
    > **[ Open my tasks ]**

### 2.6 Business-week reflection (Saturday) — the important one
- **Condition:** active user (any). Leads to the weekly check-in (pulse).
- **Requirement:** warm, and it must make the WHY obvious — reflecting weekly is
  for *her* (spot progress, keep momentum), not a report for us. Friend asking,
  not a form.
- **Copy:**
  - **Subject:** How did your week go? (2 min — and it's for you)
  - **Body:**
    > Hey 👋
    > Saturday's a good moment to look back. Not to report to us — for yourself: what actually moved this week, and what got stuck.
    >
    > This is the quiet habit of founders who go the distance — they **notice their own progress**. Heads-down in the day-to-day, it feels like you're standing still. But mark the week and you see it: *"oh — I talked to three customers and rewrote my offer."* That gives your energy back and shows you where to steer next.
    >
    > Takes a couple of minutes:
    >
    > **[ Share how your week went ]**
    >
    > — Affina
    >
    > P.S. A rough week is fine too. Stuck? Just say so — that's exactly why your mentor and the program are right here.

### 2.7 Book your mentor
- **Condition:** an S1/S2/S3 session is due (S1 after M4, S2 after M9, S3 after
  M12) but unbooked. Once per session.
- **Copy:**
  - **Subject:** Your mentor session is waiting
  - **Body:**
    > You've reached the point where one real conversation saves you weeks. Your **[Start / Mid / Final]** session is a 1:1 with a founder who's already walked this path — you'll talk through where you're headed and check your course.
    >
    > **[ Book my session ]**

### 2.8 Re-engagement (14 days no login, once)
- **Condition:** user crossed 14 days inactive, not already re-engaged.
- **Data:** current module + Snapshot one-liner.
- **Copy:**
  - **Subject:** Your idea is still here
  - **Body:**
    > Hey 👋 We haven't seen you in a couple of weeks — everything okay?
    >
    > You left off at **Module [X]**, and your project — *"[one line from Snapshot]"* — hasn't gone anywhere. Picking back up is easy: just continue from where you stopped.
    >
    > **[ Jump back in ]**
    >
    > Life gets busy — no pressure. But your first customer won't find itself 🙂

---

## §4 — Data signals & tables the dev must add

- **`users.lastActiveAt` (NEW column)** — drives the 14-day suppression &
  re-engagement. Set it on any authenticated activity once Phase A auth lands
  (session read). Until then `updatedAt` is a proxy (note: touched by background
  writes). Migrate via node script; update `schema.ts`.
- **`email_log` table (NEW)** — `{ id, userId, type, sentAt, weekOf? }`. Purpose:
  (a) idempotency (dedupe sends), (b) our email analytics. Weeklies dedupe by
  `(userId, type, weekOf)`; once-only emails by `(userId, type[, session])`.
- **`tasks`** — open-task query (exists).
- **`users.mentorSessions`** — booked/completed flags (exists) + progress for
  due-ness.
- **`users.snapshot`** — one-liner for re-engagement (exists).
- **Current module** — from progress (for re-engagement copy).

---

## §5 — Informational broadcasts (updates / tips) — NOT in code

General newsletters (product updates, useful content, "to all subscribers") are
**Resend Broadcasts** — composed and sent from the Resend dashboard against an
audience list. No cron, minimal code (just keep an audience in sync, or manage
the list manually to start). Out of scope for this build; documented so it's not
confused with lifecycle emails.

---

## §6 — Env vars (document in `.env.example`)
- `RESEND_API_KEY` (set), `EMAIL_FROM` (= `Affina <hello@affina.space>`),
  `APP_URL`, `SESSION_SECRET` (auth), **`CRON_SECRET`** (new, protects cron).

---

## §7 — Dev: order of work
1. **Prereq — SPEC_RESEND_AUTH §1** (slot cleanup) + §3 (`src/server/email.ts`)
   + shared brand wrapper (§0 here). Nothing sends without this.
2. **Transactional (Phase A):** wire emails 1–4 at their trigger points (§2),
   fire-and-forget. #1 is part of the auth build; 2–4 hang off existing handlers.
3. **Data layer:** add `lastActiveAt` + `email_log` (§4).
4. **Cron (Phase B):** `api/cron.ts` + `CRON_SECRET` + the daily sweep (§3);
   wire emails 5–8. Add the Vercel Cron entry (or document the external fallback).
5. Broadcasts (§5) — later, dashboard, no code.

## §8 — Acceptance
- [ ] Slot cleanup done (SPEC_RESEND_AUTH §1); `find api -name '*.ts'` leaves
      room for `api/auth.ts` + `api/cron.ts` without exceeding 12.
- [ ] `src/server/email.ts` + shared brand wrapper; a test send renders correctly
      in a real inbox (brand, button, mobile).
- [ ] Emails 1–4 fire at the right events; a failed send never breaks the request.
- [ ] `lastActiveAt` column + `email_log` table added; `schema.ts` updated.
- [ ] `api/cron.ts` protected by `CRON_SECRET` (200 authorized / 401 not).
- [ ] Thursday: user WITH open tasks → real task list; user with none → nothing.
- [ ] Saturday: active user → reflection email; >14d inactive → nothing.
- [ ] 14+ days inactive → exactly ONE re-engagement, never repeated.
- [ ] Mentor-due-unbooked → one booking nudge, not repeated.
- [ ] No email sends twice (email_log dedupe verified on a re-run).
- [ ] `tsc -b` + `vite build` pass; prod smoke green.

---

## AMENDMENT (2026-07-05) — registration states + finish-registration sequence

> Change request to the already-shipped email code. Introduces TWO user states
> and a 3-part "finish registration" nudge sequence. Overrides the Welcome
> trigger and gates all lifecycle emails to registered users.

### A. Two user states
| State | How reached | Emails they get |
|---|---|---|
| **Pending** | entered email (requested a magic link) but has NOT clicked/verified | ONLY the finish-registration sequence (#9–#11) |
| **Registered** | verified email via magic link | Welcome (on verify) + the full lifecycle (#5–#8) |

- **New column `users.verifiedAt` (timestamptz, null = pending).** Set to `now()`
  inside `api/auth.ts` verify-link, only on the transition to verified. Migrate
  via node script (`ADD COLUMN IF NOT EXISTS`), update `schema.ts`.
- A pending user row exists as soon as she requests a link (email captured).

### B. Welcome moves — fires on VERIFICATION only
- Send Welcome (#2) from `api/auth.ts` verify-link, **only when `verifiedAt`
  transitions from null → set** (i.e. genuine first verification). Dedupe via
  `email_log` (`welcome`, once).
- **Remove the Welcome send from `api/user.ts`.** Entering email / saving profile
  is no longer "registration" and must not trigger Welcome. (Onboarding just
  writes profile fields.)

### C. Lifecycle gating (cron)
The daily sweep in `api/cron.ts` branches on state:
```
if verifiedAt is null (PENDING):
    send finish-registration by age since email captured:
      +1 day  → #9  (once)
      +3 days → #10 (once)
      +7 days → #11 (once)
    after #11 → stop. Verifies at any point → stop immediately.
else (REGISTERED):
    the existing active/inactive logic (#5–#8) — unchanged, but now only
    ever runs for registered users.
```
- Dedupe each finish email separately in `email_log`: types `finish_1`,
  `finish_3`, `finish_7` (once each). "Age since captured" = `createdAt` (or a
  dedicated `emailCapturedAt`) of the pending row.
- Re-engagement (#8) is **registered-only** — a pending user who goes quiet gets
  the finish sequence, never re-engagement.
- Each finish email's CTA generates a **fresh magic link** (same mechanism as
  login) so one tap both verifies and signs her in.

### D. Copy — the 3 finish-registration emails (distinct angles)

**#9 — Day 1 · simple reminder**
- **Subject:** Your project is waiting — one click to continue
- **Body:**
  > Hey 👋
  > You started with Affina but haven't confirmed your email yet — so your spot (and your project) is on pause. One tap and you're in for good, no password:
  >
  > **[ Confirm my email & continue ]**
  >
  > — Affina

**#10 — Day 3 · the odds (guidance raises success)**
- ✅ **Source-verified (keep the copy below as-is):** SCORE (an SBA resource
  partner) — **5× more likely to start a business + higher revenues & growth.**
  SCORE's stat is about working with a *mentor*; we intentionally frame it as
  "the right support" (Affina = AI + mentors + community, which includes
  mentorship). 5× is about *starting* (NOT "start and succeed"). Do NOT "correct"
  the phrasing back to "with a mentor." Source: https://www.score.org/press-releases/mentorship-improves-odds-success-entrepreneurs/
- **Subject:** With the right support, you're 5× more likely to start
- **Body:**
  > Hey 👋
  > Do you know: **entrepreneurs with the right support are 5× more likely to start a business — and report higher revenues and increased business growth** (SCORE, an SBA partner).
  >
  > Most ideas never launch — not because they're bad, but because going it alone is overwhelming. With real guidance you stop guessing and just take the next step.
  >
  > That's exactly Affina — AI incubation and real mentors guiding you the whole way, with honest feedback at each step. Your project's waiting:
  >
  > **[ Confirm my email & start ]**
  >
  > — Affina

**#11 — Day 7 · the dream + the right support**
- **Subject:** You had a reason to start. Don't let it fade.
- **Body:**
  > Hey 👋
  > You came to Affina for a reason — a dream, an itch, a *"what if I actually did this?"* Don't let it quietly slip.
  >
  > You don't have to do it alone. With Affina you get **AI incubation** guiding each step, **live expert mentors** when it matters, and a **community of women founders** building right alongside you.
  >
  > Your idea deserves that. One tap and it's yours:
  >
  > **[ Confirm my email & begin ]**
  >
  > — Affina
  >
  > *(after this we'll stop reminding — no spam, promise)*

### D2. Report-ready email (#12 — day 0, T+1h) — added by SPEC_ONBOARDING_FUNNEL
- **Trigger:** pending user, `now - emailCapturedAt ≥ 1h`, not yet verified,
  not yet sent (elapsed-time trigger, not the 11:00 slot). Once.
- **CTA:** fresh magic link → verify + land on the interactive `/report` page
  (her report + "continue into the program").
- **Copy:**
  - **Subject:** Your Affina report is ready 📋
  - **Body:**
    > Hey 👋
    > You started mapping out your idea on Affina — here's your report, saved and ready for you.
    >
    > Open it to see where your idea stands and take the next step. It's all set up — one tap and you're in:
    >
    > **[ Open my report & continue ]**
    >
    > — Affina
- Precedes the +1/+3/+7 finish nudges (#9–#11). Dedup `email_log` type `report_ready`.

### E. Amendment acceptance
- [ ] `users.verifiedAt` added; set on verify-link transition; `schema.ts` updated.
- [ ] Welcome fires ONLY on first verification; removed from `api/user.ts`.
- [ ] Pending user gets #9/#10/#11 at +1/+3/+7 days, each once, then stops.
- [ ] Verifying at any point stops the finish sequence immediately.
- [ ] #5–#8 (incl. re-engagement) never send to a pending (unverified) user.
- [ ] Finish-email CTAs mint a fresh magic link that verifies + logs in.
