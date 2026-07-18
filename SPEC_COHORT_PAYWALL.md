# Founding Cohort Paywall — full selling page (copy final, EN)

> Replaces the current paywall entirely. Triggered by the First Venture Report
> CTA (SPEC_VENTURE_REPORT) and by any locked M1+ click. Structure per Shamil's
> brief (2026-07-17): strong cohort headline → 15 seats / personalization /
> shape-the-platform / 50% founding price → platform card slider → price block
> with seat counter → dual CTA (Calendly-first) → guarantee. Photos =
> placeholders for now. Full-page, dismissible, DESIGN.md tokens.

## §0 — PRICING CHANGE (⚠️ Stripe work + one decision)
- New founding price: **€300 for 3 months** (was €360). Anchor: full price
  **€600**.
- **Renewal scheme — DEFAULT (build this): (а) single recurring €300 / 3
  months** — no annual phase for founding members, cancel anytime; the
  schedule-to-annual webhook logic is BYPASSED for this price (keep the code,
  gate by price id). Revisit pricing post-cohort. (If Shamil later picks the
  2-phase variant, it's a Stripe-price + schedule-numbers change only.)
- ONE new Stripe price needed (Shamil, sandbox, like before): recurring
  **€300 every 3 months** on the same product → env `STRIPE_PRICE_FOUNDING`;
  checkout switches to it.
- **Stripe (test mode, Shamil creates like last time):** one new recurring
  price on the product — €300 every 3 months → new `STRIPE_PRICE_FOUNDING` env;
  checkout switches to it; the schedule-to-annual webhook logic is bypassed for
  this price (keep code, gate by price id).
- **Legal nuance on the strikethrough (EU):** a crossed-out €600 that nobody
  ever paid can read as a fake discount (Omnibus rules). Fix by wording, keep
  the visual: strikethrough ~~€600~~ + the nearby line says *"€600 after the
  founding cohort"* — future price, not fictitious past price. Honest and
  stronger anyway.

## §1 — Page structure & final copy (EN)

### 1. Hero
- Eyebrow: `FOUNDING COHORT · 15 SEATS`
- **H1: "Be one of the 15 we build this with."**
- Sub: *"A founding cohort of 15 women founders. Super-personal attention, a
  direct line to us, and a hand in shaping the platform that will help millions
  of women build — at half the price, as a one-time founding offer."*

### 2. Platform slider — 6 cards (horizontal swipe/scroll, roomy)
| # | Card title | Body line | Visual |
|---|---|---|---|
| 1 | **The 12-Week Launch Sprint** | "Twelve weeks: from your project to real business results." | schematic path graphic (idea → validated → built → first sale) [placeholder] |
| 2 | **3 Private Mentor Sessions** | "Real founders and operators, 1:1 — at the moments that matter most." | expert photo mosaic [placeholder ×4–6] — **the heaviest card, give it visual weight** |
| 3 | **Your Working Dashboard** | "Tasks, feedback, momentum — your whole build in one place." | REAL app screenshot (dashboard) |
| 4 | **Your Startup Brain (AI)** | "An AI that actually knows your project — every insight and fact, working for your decisions." | REAL snippet of an AI review referencing a specific project — the anti-course differentiator |
| 5 | **Deep-Dive Programs & Consults** | "From vibe-coding to marketing to B2B sales — go deep where your business needs it." | screenshot of the Programs page [real] |
| 6 | **Founding Status** | "Shape the product. A direct channel to the founders. Founding terms — forever." | schematic card (violet) |

### 3. Price block
- ~~€600~~ → **€300 founding price** — *"one-time price offer"*
- Seat counter: **"11 of 15 seats left"** (see §2)
- One quiet line: *"3-month subscription · all updates · live mentor sessions ·
  community"*
- Micro-line under (legal-safe anchor): *"€600 after the founding cohort."*

### 4. CTA block (mutual-selection frame)
- **Primary:** `Book my seat — 20 minutes with a founder` → Calendly (§3)
  - Caption: *"Not a sales call — we'll walk through your project together and
    decide if we're a fit."*
- **Secondary (quieter):** `I'm not waiting — start now` → Stripe checkout
  (founding price).
- Dismiss stays: `Not now — I'll keep exploring` (existing behavior: back to
  dashboard, founder-call phone offer logic unchanged).

### 5. Guarantee (bottom, framed card — visible, not shouty)
- **The Founding Cohort Guarantee**
- *"Finish the program without your first customers — and we refund
  everything. Or, if you'd rather, we keep working with you personally until
  you get there. We're here for business results, not subscriptions."*
- (Ops: refunds are manual via the Stripe dashboard; no code.)

## §2 — Seat counter (honest scarcity only)
- Constants/env: `COHORT_SEATS_TOTAL=15`, `COHORT_SEATS_LEFT=11` — rendered as
  "11 of 15 seats left". Manually updated (env change) as real seats fill;
  NEVER auto-decrement or fake-animate. No countdown timers anywhere.
- When it hits 0 → CTA flips to a waitlist state (simple: primary button
  becomes "Join the waitlist" → the founder-call phone modal). One `if`.

## §3 — Calendly-later stopgap (primary CTA works day one)
- Env `CALENDLY_URL`. If set → primary button opens it (new tab).
- If unset (now) → primary button opens the EXISTING founder-call modal
  ("leave your number, we'll reach out") with `phoneSource='paywall'` — the
  hot-lead alert to sk@ covers scheduling manually until Calendly lands.
- Analytics: `paywall_viewed` (exists) + `cohort_call_clicked`,
  `cohort_checkout_clicked`, `waitlist_joined`.

## §3a — POST-CALL FLOW (added 2026-07-18): acceptance, not a re-pitch

The call is mutual selection → three outcomes, each with its own path. The
generic paywall is NEVER the post-call answer — the human already sold; what
converts now is a PERSONAL acceptance moment.

**Outcome A — fit → "You're in" (the core flow):**
1. After the call, Shamil hits **"Accept into cohort"** on the user in the
   admin panel (one new admin action — add to SPEC_ADMIN_PANEL §2: POST
   `cohort-accept` → sets fields below + fires the email; idempotent).
2. Data: `users.cohortAcceptedAt` (timestamptz) + `users.seatHeldUntil`
   (= accept time + **72h** default). Migration via node script.
3. **Acceptance email (#13)** fires (dedup `email_log` type `cohort_accept`):
   - Subject: **You're in — welcome to the founding cohort 🎉**
   - Body: *"Hey {name} 👋 — We loved talking about {project}. We'd be glad to
     build it with you: you're accepted into the founding cohort. Your seat is
     held until {date}. Claim it below — and from there we start properly:
     your 12 weeks, your mentors, your cohort."*
   - CTA: **[ Claim my seat — €300 founding price ]** = magic link →
     `/unlock` (auto-login, works from any device).
   - P.S.: *"Questions? Just reply — this email reaches us directly."*
   - **Reply-To: `sk@affina.space`** on this email (the P.S. invites replies;
     the From stays `hello@affina.space` — replies must land in a mailbox
     Shamil actually reads).
4. **The paywall itself becomes the acceptance screen** for accepted users:
   same page, hero swaps → eyebrow `YOU'RE ACCEPTED`, headline *"Your seat in
   the founding cohort is reserved, {name}."*, sub shows the hold date; the
   slider/price stay; primary CTA becomes **"Claim my seat — €300"** (straight
   to checkout, no call CTA anymore). Any locked-content click shows this
   accepted variant too.
5. **Seat-hold reminder (#14):** cron, once, at T+48h if accepted & not
   subscribed: Subject *"Your seat is still held, {name}"* — one line + hold
   date + the same claim CTA. Dedup `cohort_hold_reminder`. After
   `seatHeldUntil` passes: NO auto-release in v1 — the accepted state simply
   stops advertising the hold date (copy drops the date); Shamil decides
   manually whether to release the seat (env counter is manual anyway).

**Outcome B — not a fit / she declines:** nothing in-app changes — she keeps
free M0 + her report. Any decline note is a personal manual email from Shamil
(no template in v1 — at 15 seats it SHOULD be personal).

**Outcome C — call happened, she's undecided:** no state change; the standard
paywall (with both CTAs) remains; lifecycle emails continue as-is.

**Short-circuit:** if she pays on/after the call via "start now" — `subscribed`
wins; acceptance emails are suppressed (guard: never send #13/#14 to a
subscribed user).

Analytics: `cohort_accepted` (server event on the admin action),
`seat_claim_viewed` (accepted paywall variant), existing checkout events.

## §4 — Out of scope
Real expert photos & screenshots (placeholders now — Shamil supplies assets) ·
Calendly account/wiring (env drop-in later) · post-cohort pricing page ·
auto seat counting from Stripe.

## §5 — Acceptance
- [ ] Paywall renders: hero (15 seats) → 6-card slider (placeholders where
      noted, real screenshots for cards 3–5) → price block (~~€600~~ €300 ·
      locked forever · 11/15 · quiet inclusions line · "€600 after the
      founding cohort") → dual CTA with mutual-selection caption → guarantee.
- [ ] Primary CTA: opens `CALENDLY_URL` when set; founder-call modal when not.
- [ ] Secondary CTA → Stripe checkout charges **€300/3mo** on the new founding
      price; webhook flips `subscribed`; renewal behavior matches whichever §0
      option Shamil confirmed.
- [ ] Seat counter reads from env; 0 → waitlist state.
- [ ] Dismiss → dashboard; M1+ clicks re-open it (gating per
      SPEC_VENTURE_REPORT §4).
- [ ] No fake urgency: no timers, no auto-decrement.
- [ ] Mobile: slider swipes, page scrolls cleanly.
- [ ] **Post-call (§3a):** admin "Accept into cohort" → `cohortAcceptedAt` +
      `seatHeldUntil` set → #13 acceptance email with magic-link claim CTA →
      paywall renders the ACCEPTED variant (personal hero, claim CTA, no call
      CTA) → checkout works from it. T+48h reminder #14 fires once when still
      unsubscribed; neither email ever reaches a subscribed user; accept action
      is idempotent.
- [ ] `tsc -b` + `vite build` pass; prod smoke green.
