# Paywall + post-paywall mentor booking

> Turns ON the paywall after Module 4 (was designed but not enforced in v2 —
> SPEC_PROGRAM_V2.md §4 PAYWALL_BOUNDARY). Full-page blocking overlay,
> dismissible, gates M5–M12. After payment → a full-page (not modal) mentor
> booking step for session S1, then M5 unlocks.

## 0. Pre-paywall summary block — "The Founder's Case" (NEW, m4l10)

A new block added AFTER m4l9, as the last block of M4. Free. A milestone
reveal (like the m0l5 Snapshot reveal) — kind: 'system', not scored. Its job:
peak emotion + sense of scale right before the paywall ("look what you built
and what's at stake"), not "pay now".

**Working name: "The Founder's Case"** (echoes the m4l5 "AI case file";
alternatives Shamil is choosing between: Proof & Potential · The Napkin ·
Your Venture Brief). Use whatever Shamil picks; wire the id as m4l10.

AI-generated from Brain (Snapshot + value_proposition, persona,
competitive_landscape/TAM, problem_solution_check, quantified_value,
micro_commitment). Three sections:

1. **The Vision** — her project one-liner + why it matters in the world
   (from value prop + problem). Reminds her the business is cool.
2. **The Proof** — bullets of what she did/validated across the 4 modules,
   from her real Brain data (N interviews, validated problem, first demand
   signals) — not generic.
3. **The Potential** — inspiring, plain-language upside. NOT an investment
   lecture. 2–3 clean stats, each: small grey label + ONE bold hero number +
   a short plain support line. Derived from M2 TAM + illustrative price.
   - Reachable customers (year one)
   - Revenue potential (at an illustrative price)
   - Upside stat — **calibrated to her ambition** (see below)
   - Closing line (KEEP verbatim, it tested well): *"These are napkin numbers
     — the optimistic case if you hit it, not a promise. Module 5 is where
     these guesses become your real numbers."*

**★ AMBITION CALIBRATION (critical — the numbers AND the frame adapt to her).**
Read her ambition from intake: onboarding `goal`, m0l3/quiz `goal_12w`,
`capacity`. Do NOT impose a generic venture model.
- **Income / lifestyle / first-customers ambition** (or low capacity): frame
  the third stat as MONTHLY INCOME ("What it means for you · £1.5k–£3k/month ·
  a real business that pays you, on your terms"). Modest, achievable numbers.
  **Do NOT show a valuation** — it's irrelevant and scary for her.
- **Scale / investment ambition** (goal=Investment, or goal_12w mentions
  raising/growth): frame the third stat as VALUATION ("What it could be worth ·
  £50k–£180k · early businesses like yours are valued on revenue, and it climbs
  fast once people stay"). Bigger numbers, ARR language allowed.
- **Unclear/exploring:** conservative income frame + one light line of upside.
Year-one target is anchored to her stated goal where she gave one, not a fixed
benchmark — a "first 10 customers" founder must not be shown 500 subscribers.

**★ PRESENTATION RULES (fixes the bad first draft — apply to all 3 sections):**
- **Bold ONLY the hero numbers/phrases** (e.g. "250–500", "£18k–£36k/year",
  the M5 hook). Everything else regular weight. No bold paragraphs.
- **No methodology / jargon in visible text.** Ban: "illustrative only —
  pricing not yet set", "N× revenue multiple", "SAM assumption", "cold-chain
  costs", "conservative anchor against benchmarks". Say it human: "at a price
  around £6/month", not the box-math derivation.
- **No formula line** (the "300 × £72 = £21,600 ARR × 3–5× = £65k–£108k" line
  is removed entirely — pointless to her).
- The napkin/"not a promise" honesty lives ONLY in the single closing line
  above — not sprinkled as caveats inside every stat.

**CTA:** **"Sounds great — continue →"** → opens the paywall overlay (§1).

## 1. Trigger & gating

- **Boundary:** everything up to and including m4l10 ("The Founder's Case")
  is FREE. M5–M12 are gated.
- **Paywall opens when:** she clicks "Sounds great — continue" on m4l10, OR
  clicks any locked M5–M12 lesson in the sidebar/dashboard program map.
  (m4l9 → m4l10 is a normal free lesson advance; the paywall fires from the
  m4l10 CTA, not from finishing m4l9.)
- **Full-page blocking overlay** (not a small modal) — covers the app, but is
  **dismissible** (X / "Not now").
- **On dismiss:** returns to Dashboard. Dashboard + M0–M4 stay fully usable.
  M5–M12 remain locked (lock icon already exists in the program map).
- **Re-trigger:** any attempt to enter locked content reopens the overlay.
- **State:** new `users.subscribed` boolean (or reuse an existing entitlement
  flag). Gating checks this flag. Default false.

## 2. Payment (v2 = stub — Stripe not integrated)

- Primary CTA (label "Оформить подписку" / "Unlock the full program") → in v2
  it is NOT wired to any payment: clicking it just sets `subscribed = true` and
  proceeds to the S1 booking page. No checkout screen, no charge. Structure the
  code so a real Stripe checkout drops in between the click and the flag later,
  without reworking the gating.
- ⚠️ **Blocked on Shamil decisions before real launch:** the price number and
  billing period (see §6). Copy has a `[PRICE]` placeholder.

## 3. Paywall content (copy — ready to use, price pending)

- Eyebrow: **You've made it further than most.**
- Headline: **The problem is real. Now build the business.**
- Recap (personalize from Brain/Snapshot when available; static fallback below):
  *"In four modules you've sharpened your idea, sized your market, talked to real
  people, and tested your hypothesis against what they actually said — the hard
  part most founders skip."*
- Turning point:
  *"What comes next is where it becomes a company: your business model, your
  first MVP, your first sale. This is the part you came for."*
- Value stack (dearest first):
  1. **The full Launch Program** — all 12 modules, idea → first paying customer (you've done 4)
  2. **3 live 1:1 mentor sessions** — real founders, at the moments that matter
  3. **Specialized deep-dive programs** — Marketing, AI, Fundraising
  4. **Live online events & workshops**
  5. **A community of women founders** building alongside you
- Price line: **[PRICE] · Cancel anytime.**
- Primary CTA: **Unlock the full program →**
- Secondary (dismiss): **Not now — I'll keep exploring**
- Trust line (small): founder-to-founder note / guarantee (e.g. *"Built by
  founders who've been where you are."*) — placeholder until real testimonials.

**Design:** warm, editorial, DESIGN.md tokens. No aggressive urgency, no fake
scarcity. One primary CTA only (no multi-tier pricing table in MVP).

**Personalization (nice-to-have, not blocker):** the recap line can pull her
actual milestones from Snapshot ("you interviewed 6 people, validated a real
problem…"). Static fallback ships first; personalize when cheap.

## 4. Post-paywall: mentor booking — FULL PAGE (session S1)

On `subscribed` becoming true → route to a full-page mentor-booking screen
(same chrome as a lesson page, NOT a modal). This relocates the existing S1
"Start" mentor session from the modal into this mandatory flow step.

- Eyebrow: **You're in 🎉**
- Headline: **First — let's get you a real mentor.**
- Body: *"Your Start session is a 1:1 with a founder who's done this. We'll talk
  through your 12-week goal, look at your Snapshot together, and set your rhythm
  — the fastest way to make sure you're pointed at the right thing before
  Module 5."*
- Primary CTA: **Book my Start session** (v2: existing booking stub — mailto/
  Calendly placeholder, same as MentorSessionModal today)
- Secondary CTA: **I'll book later — continue to Module 5 →**
- Note under CTAs: *"You don't have to wait for the session to keep going —
  book it, then dive straight into Module 5."*

**Flow rules:**
- Cannot be skipped as a SCREEN — it's a required step between payment and M5.
- Both CTAs advance to M5. Booking is optional; booking does NOT block
  continuing (she can book and immediately go to M5 without waiting for the date).
- Mark S1 state consistent with existing mentorSessions model (booked / later).
  If she chose "later", the existing Dashboard "session due" nudge still applies.

## 5. Interaction with existing mentor-session infra

- Existing `mentorSessionAfter: 'S1'` on M4 + MentorSessionModal + Dashboard
  "session due" card: S1 now surfaces as this full-page step post-paywall
  instead of (or in addition to) the modal. S2 (after M9) and S3 (after M12)
  stay as they are for now — this spec only changes S1's placement.
- Don't double-prompt: once she's passed the S1 full page, the Dashboard S1
  nudge should only reappear if she chose "book later" and still hasn't booked.

## 6. Open decisions (Shamil — needed before real launch, NOT before dev starts)

1. **Price** — the number for the `[PRICE]` placeholder.
2. **Billing period — "6 weeks" vs 12 weeks (⚠️ discrepancy).** The program is
   12 modules / ~12 weeks, but the subscription was described as "6 недель".
   Clarify: is the subscription a 6-week access window? Monthly? One payment for
   full program access? The value stack lists the full 12-module program, so a
   6-week window would under-cover it. Resolve the label before the price line
   is finalized.
3. **Stripe** — payment stays a stub until Stripe is integrated (separate task).

Dev can build the full flow now with `[PRICE]` placeholder and stub checkout;
only the final price string + Stripe wiring wait on the above.

## 7. Acceptance

- Finish m4l9 → advance to m4l10 "The Founder's Case" (free reveal with vision /
  proof / napkin-potential, generated from her Brain) → its CTA "Sounds great —
  continue" opens the full-page paywall overlay, dismissible.
- Dismiss → Dashboard + M0–M4 usable; M5–M12 locked; clicking any locked lesson
  or "Next" from m4l9 reopens the overlay.
- Click "Unlock" → subscribed=true → routed to full-page S1 booking screen.
- On booking screen: "Book" and "Continue to Module 5" both advance; neither is
  required to wait; screen cannot be bypassed except via those two CTAs.
- After the booking screen → M5 unlocked and enterable.
