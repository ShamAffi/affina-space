# Onboarding funnel redesign — email-first, report, magic-link account

> Reorders the onboarding funnel so we capture email BEFORE showing the report,
> then convert to a real account via magic-link confirmation. Adds a recovery
> path (day-0 report email → interactive page) for anyone who doesn't confirm.
> Amends SPEC_M0_INTAKE_REDESIGN.md (onboarding) + SPEC_EMAILS.md (day-0 email,
> finish sequence). Depends on Auth Phase A (magic link) — already shipped.

## Current flow (for context — `src/screens/Onboarding.tsx` STEPS)
`q_idea → q_customer → q_business_model → q_stage → q_goal → q_location →
analyzing → reveal_teaser (REPORT) → register (name+email) → project_name →
program_intro → unlock`
- "The report" = `RevealTeaser.tsx` (`OnboardingScore`), generated from intake
  answers. **Reuse it** — no new report artifact.
- No Privacy/Terms pages exist yet (must be added — §5).

## New flow (target order)
```
1. Intake questions (q_idea…q_goal) + location        — UNCHANGED
2. EMAIL CAPTURE  (NEW position — before the report)  — "we'll email you your report"
3. analyzing → REPORT (reveal_teaser)                 — CTA: "Start the program for free"
4. NAME screen  ("What's your name?")                 — YOUR name → users.name
5. PROJECT NAME screen ("Your startup's name?")       — PROJECT name → users.projectName
6. CONFIRM EMAIL screen (NEW)                          — prefilled email, change-email,
                                                          "Send me a magic link", consent
7. (magic link clicked) → Welcome zone / program start — as today
```
Location step stays (it captures `country`/`city`/`timezone` — timezone drives
the lifecycle-email send hour). Keep it within block 1 or right after email.

---

## §1 — Screen-by-screen changes

### Step 2 — Email capture (NEW position)
- A screen asking for her email, framed as value not friction:
  headline e.g. *"Where should we send your report?"* / sub: *"We'll build your
  report and email you a copy so it's always saved."*
- **Consent line under the field:** *"By continuing, you agree to our
  [Privacy Policy] and [Terms of Use]."* (links → §5).
- **On submit → create the PENDING user row** (email only, `verifiedAt` null,
  `emailCapturedAt = now`) and kick off report generation. This is the moment
  the finish-sequence clock starts (§4).
- Validate email format; if it already belongs to a VERIFIED account, offer
  "Looks like you already have an account — sign in" (→ /login).

### Step 3 — Report (reveal_teaser)
- Same `RevealTeaser` component/content.
- **Change the CTA label** from "create account"/register to
  **"Start the program for free →"**.
- **Persist the report** on the pending user (so day-0 email + interactive page
  can render it) — see §3.

### Step 4 — Name
- Standalone screen: *"First — what's your name?"* → `users.name`. (This is the
  `name` half of the current Register, split out.)

### Step 5 — Project name
- *"What's your startup called?"* → `users.projectName`. (Existing project_name
  step, now positioned right after Name.)

### Step 6 — Confirm email (NEW)
- Headline: *"Almost there — confirm your email to create your account and start
  the program."*
- **Email prefilled** with what she entered in Step 2.
- **"Change email" control** — lets her edit it. On change: **update the pending
  user row's `email`** in the DB (§2 handles the edge cases).
- Primary CTA: **"Send me a magic link"** → calls `request-link` (existing auth)
  → sends the magic-link email.
- **Consent line again** (shown regardless of whether she changed the email):
  *"By continuing, you agree to our [Privacy Policy] and [Terms of Use]."*
- After sending: a "check your inbox" state.

### Step 7 — Verified → Welcome zone
- Clicking the magic link → `verify-link` → sets `verifiedAt` (pending→
  registered, fires Welcome email per SPEC_EMAILS amendment) → lands in the
  Welcome zone / program start (as today).

---

## §2 — Data model

- **`users.emailCapturedAt` (NEW timestamptz)** — set at Step 2; drives the
  finish-sequence timing (day 0/1/3/7). Migrate via node script; update `schema.ts`.
- `users.verifiedAt` (from SPEC_EMAILS amendment) — null until Step 7.
- `users.email` stays `NOT NULL UNIQUE` — one row per email. Pending vs
  registered is distinguished by `verifiedAt`.

## §2a — Ownership model: block ONLY on verified (resolves the "email already
used" question)

**Principle: verification = ownership.** A magic link can only be clicked by
whoever controls the inbox, so verification — not email capture — is what claims
an email. Therefore a PENDING (unverified) record never blocks anyone.

**Email-capture logic (Step 2) and change-email (Step 6) both follow this:**
- Look up the `users` row for the entered email:
  - **Row exists AND `verifiedAt` set (real account)** → **block**: show the
    existing "this email is already registered — sign in, or use another email"
    (this behavior already exists — reuse it).
  - **Row exists but PENDING (`verifiedAt` null)** → **reuse the row**: overwrite
    its intake/report with the new run, refresh `emailCapturedAt`. (Same email
    testing another idea just regenerates the report — allowed. A stranger's
    stale capture is harmlessly overwritten.)
  - **No row** → create a fresh pending row.
- **This solves both concerns:**
  1. *"Same email, different ideas, different reports"* → re-entry overwrites the
     pending row and produces a fresh report. Not blocked. ✅
  2. *"Someone typed an email that isn't theirs — will the real owner be locked
     out?"* → No. The real owner enters the same email, reuses the (unverified)
     row, requests a magic link, and — because only they can open that inbox —
     verifies and becomes the owner. The stranger, who never verified, never had
     access and their stale data is overwritten. ✅
- Change-email (Step 6): allowed only while pending; the target email runs
  through the exact same three-way check above. Child rows key on `userId`, so
  they follow the row automatically.
- Edge: a magic link may have been emailed to a stranger's inbox — but that's
  the inbox owner's inbox, so no data leak; if the real owner clicks an older
  link and lands on stale onboarding, route them back through onboarding.

---

## §3 — Report persistence (needed for day-0 email + interactive page)
- Today `OnboardingScore` lives in React state only (ephemeral). **Persist it**
  on the pending user at Step 3 — e.g. `users.onboardingReport jsonb`, or a
  brain entry. So it survives a page close and can be re-rendered.
- Add an **authed in-app route to view it** (e.g. `/report`) that renders the
  stored report + a **"Continue into the program →"** CTA → Welcome zone. This
  is where the day-0 email lands her (§4).

---

## §4 — Recovery path (pending user who doesn't confirm)
The clock starts at Step 2 (`emailCapturedAt`). Handled by the existing daily
cron (`api/cron.ts`), pending branch (SPEC_EMAILS amendment §C), now with a
**day-0** addition:

| When | Email | Purpose |
|---|---|---|
| **T + 1 hour** | **Report ready (NEW #12)** | deliver her generated report + link to the interactive `/report` page to continue |
| +1 day | Finish #9 (simple) | nudge |
| +3 days | Finish #10 (SCORE 5×) | nudge |
| +7 days | Finish #11 (dream) | nudge |

- **Every CTA = a fresh magic link** → verify + land on `/report` (interactive:
  her report + continue), which flows into the program. One tap both confirms
  the account and continues.
- Stops immediately once she verifies. All dedup via `email_log`.
- ⚠️ Cron currently runs per-user at LOCAL 11:00 (hour-gated). The **day-0
  "T+1h" report** is time-since-capture, not a fixed daily slot — dev must handle
  it as an elapsed-time trigger (send once when `now - emailCapturedAt ≥ 1h` and
  not yet verified/sent), separate from the 11:00 day-of-week nudges. The hourly
  GitHub-Actions cron cadence makes ~1h granularity feasible.

Day-0 email copy lives in SPEC_EMAILS.md (added as #12).

---

## §5 — Consent / legal
- Privacy Policy + Terms live on the marketing site (EXTERNAL URLs, nothing to
  build in the app):
  - Privacy → `https://affina.space/privacy`
  - Terms → `https://affina.space/terms`
- Link both from the consent line at Step 2 AND Step 6 (open in a new tab).
- Consent is implied by continuing, per the copy — no separate checkbox.

---

## §6 — Decisions (RESOLVED)
1. **Nudge cadence:** T+1h report (day 0) + **1 / 3 / 7 days**. ✅
2. **Legal:** external links — `affina.space/privacy` + `affina.space/terms`
   (no in-app pages). ✅
3. **Email conflict:** block ONLY on verified accounts; pending records reuse the
   row and never block (§2a). ✅
4. **`/report` page:** reuse `RevealTeaser`; build whatever infra is needed for a
   proper persisted-report + interactive continue page (§3). ✅

---

## §7 — Acceptance
- [ ] New order: intake → **email capture (+consent)** → report → name → project
      → **confirm-email (prefilled, change-email, magic link, +consent)** → verify
      → welcome zone.
- [ ] Pending user + `emailCapturedAt` created at email capture; report persisted.
- [ ] Report CTA reads **"Start the program for free"**.
- [ ] Confirm screen: email prefilled; "change email" updates the DB row (with the
      conflict guard); consent line shown regardless of change; "Send me a magic
      link" sends it.
- [ ] Magic link → verify → welcome zone (Welcome email fires once).
- [ ] Pending non-confirmer gets: T+1h report email → interactive `/report` page;
      then +1/+3/+7 nudges; all stop on verify; no double-sends.
- [ ] `/privacy` + `/terms` render and are linked from both consent lines.
- [ ] `tsc -b` + `vite build` pass; prod smoke green.
