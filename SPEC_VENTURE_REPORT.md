# Venture Report (m0l5) + founding-cohort paywall shift

> FUNNEL CHANGE (Shamil, 2026-07-17): the paywall moves from "after M4" to
> "after Module 0", reframed as joining the **founding cohort**. The m0l5
> Startup Snapshot reveal (today: assembled info) is replaced by a POWERFUL
> one-page venture analysis — Founder's-Case-grade, but deeper: opportunity
> with market numbers, why SHE can win, what's missing, risks — the emotional
> peak that warms up the cohort offer. Venture craft + marketing craft.
>
> Before: onboarding → report → M0–M4 free → m4l10 Founder's Case → paywall → M5+
> After:  onboarding → report → M0 free → **m0l5 VENTURE REPORT → cohort paywall** → M1+

## §1 — The artifact: **"Your First Venture Report"** (DECIDED 2026-07-17)

Naming series (resolved): m0l5 = **Your First Venture Report** · m4l10 =
**Your Validated Venture Report** (working name — same generation machinery,
now re-analyzed from 4 modules of REAL Brain data: interviews, validation,
personas; CTA "Continue to Module 5", no paywall).

**Format rule (Shamil): must NOT repeat the onboarding-report style.** The
onboarding report is a dashboard-style snapshot (ladder, bars, bullets). The
First Venture Report is an **editorial one-pager** — an analyst memo: titled
sections of PROSE, hero numbers set large, pull-quotes of her own words,
document feel (like a brief an associate hands a partner). Deeper, denser,
visually distinct — she should feel the upgrade from "quiz result" to
"a real analysis of my company".

One page, six blocks, in this order (marketing arc: dream → proof → gap → path):

1. **Verdict hero** — project one-liner (her words) + a strong verdict sentence
   + readiness level (reuse the 1–5 ladder from SPEC_REPORT_V2 for continuity;
   she should SEE she moved since the first report).
2. **The Opportunity** — 2–3 napkin numbers, ambition-calibrated (reuse the
   m4l10 calibration: `goal3y` primary → income framing vs valuation framing):
   reachable audience (range), revenue potential at an illustrative price
   (range), one why-now line (trend stated qualitatively). **Model estimates,
   honestly labeled** — reuse the market-research estimate discipline
   (bottom-up napkin, ranges not points, zero fabricated citations). One
   honesty line, verbatim the tested one: *"These are napkin numbers — the
   optimistic case if you hit it, not a promise."*
3. **Why you can win** — founder-fit, 2–3 points from HER data: `whyMe`
   (her real reason), `doneSoFar` (already-taken action = execution signal),
   capacity/stage fit. Quote her words. This is the "мы верим в тебя" block —
   grounded, not flattery.
4. **What's missing** — 2–3 concrete gaps (from `stuckPoint`, stage vs
   ambition distance): each framed as SOLVABLE with structure ("this is a
   process problem, not a you problem") — each gap implicitly maps to what the
   program provides, without naming modules.
5. **Risks** — 2–3 honest ones incl. the pacing risk when goal3y outruns stage
   (Startup Genome framing, warm tone). Risks make the report credible — the
   praise lands because the risks are real.
6. **The Path** — 3–4 sentences: the 12-week arc that closes exactly these
   gaps, then CTA: **"Join the founding cohort →"** → opens the paywall (§4).

**Presentation rules (reuse SPEC_PAYWALL §0 — they tested well):** bold ONLY
hero numbers; no methodology/jargon in visible text (no "TAM", "SAM",
"multiple"); the napkin honesty line appears exactly once; her name + project
name used throughout.

## §2 — Generation
- **Inputs (all exist by m0l5):** intake fields (idea/customer/model/stage/
  goal, m0l3-edited), quiz `founder_intake` (doneSoFar, stuckPoint, capacity,
  whyMe, goal12w, **goal3y**), imported links, onboarding report (score/level —
  for continuity: "when you arrived you were at L1…").
- **One `callClaude` at `MODELS.deep` (Opus 4.8)** — this resolves the open
  model-strategy decision FOR THIS artifact: flagship emotional moment, runs
  once per user, quality is the product. (Snapshot/other calls stay standard.)
- `max_tokens` ~2800; structured JSON (Zod, lenient); fits maxDuration.
- **No-fabrication rules in the prompt:** estimates clearly derived + ranged;
  founder-fit/gaps/risks must reference her actual words; if an input is
  empty, skip gracefully — never invent.
- **Storage:** `brain_entries` type `venture_report` (JSON) — cached like
  founders-case (regenerate action available but default = cached).
- Analytics: `venture_report_viewed`, and the paywall funnel events after it.

## §3 — Snapshot machinery STAYS (infrastructure, silent)
`generate-snapshot` still runs at m0l5 completion — Delegate, market research,
re-engagement emails, and mentor context all read the snapshot. Change is
DISPLAY-ONLY: the m0l5 screen shows the Venture Report; the snapshot lives in
DocumentsPanel as before. Do not remove any snapshot code.

## §4 — Gating flip: free = M0 only
- Paywall boundary: M5+ → **M1+** (make it a single constant, e.g.
  `PAYWALL_BOUNDARY = 'm1'`; grep all M5 gating references — LMS locks,
  dashboard program map lock icons, locked-lesson click → paywall, Programs
  page Launch card label).
- m0l5 flow: report reveal → CTA opens the paywall. Dismiss → dashboard; M0 +
  report remain accessible; any M1+ click reopens the paywall (existing
  re-trigger pattern).
- `/unlock/success` → S1 booking → lands on **M1** now (was M5).
- Mentor sessions: already `subscribed`-gated — unchanged (S1 offered after
  payment as today; its "after M4" due-marker stays for cohort members).

## §5 — Paywall: SUPERSEDED → see **SPEC_COHORT_PAYWALL.md**
The founding-cohort paywall grew into a full selling page (card slider, seat
counter, dual CTA, guarantee, NEW pricing €600→€300). Its complete structure,
final EN copy, and Stripe changes live in `SPEC_COHORT_PAYWALL.md` — build the
paywall from THAT spec. (This spec still owns the report itself + gating flip.)

## §6 — Side effects (handle explicitly)
- **m4l10 Founder's Case:** no longer pre-paywall. KEEP as a subscriber
  milestone reveal at the end of M4 ("look how far the case has come — now
  with YOUR validated data"); its CTA becomes "Continue to Module 5 →" (no
  paywall). Open decision (§7): rename it to avoid confusion with the m0l5
  artifact.
- **Guide popup (phone lead magnet):** its M1-complete trigger now fires only
  for PAID users — dead as lead-gen. **New trigger:** Dashboard mount where
  user is unpaid + M0 complete + paywall dismissed at least once + no phone +
  not shown before. (NOT at the dismiss moment itself — the founder-call offer
  (placement B) owns that moment; two asks back-to-back is pushy.)
- **Weekly-tasks email:** unpaid users now rarely have open program tasks
  (M1+ locked) — the "only if open tasks" condition already handles it. No
  change; just expected behavior.
- **Programs page:** Launch card label for unpaid → "Module 0 free · join the
  founding cohort to unlock all 12 modules".

## §7 — Decisions (RESOLVED 2026-07-17)
1. m0l5 artifact = **"Your First Venture Report"** ✅
2. m4l10 = kept as the end-of-M4 subscriber milestone, re-analyzed from her 4
   modules of real Brain data; working name **"Your Validated Venture Report"**
   (rename-able later); CTA "Continue to Module 5". ✅
3. Cohort perks/pricing → fully specified in SPEC_COHORT_PAYWALL.md
   (€600 → €300 founding, 15 seats, guarantee). ✅

## §8 — Acceptance
- [ ] Completing m0l4 → m0l5 shows the Venture Report: verdict+level,
      2–3 calibrated napkin numbers with the honesty line, 3 why-you points
      quoting her words, 2–3 gaps, 2–3 risks (pacing risk when goal3y ≫
      stage), path + "Join the founding cohort" CTA → paywall.
- [ ] Income-ambition user sees income framing; investment-ambition sees
      valuation framing (goal3y calibration works).
- [ ] No fabricated citations/precise-point numbers; estimates are ranges.
- [ ] M1+ locked until subscribed; every locked entry opens the cohort paywall;
      M0 + report free forever; `/unlock/success` → S1 → M1.
- [ ] m4l10 renders for subscribers with the new CTA (no paywall).
- [ ] Guide popup fires on the new dashboard-mount rule for unpaid users; never
      double-asks at the dismiss moment.
- [ ] Snapshot still generated + visible in DocumentsPanel; Delegate/market
      research unaffected.
- [ ] Report generated on `MODELS.deep`, cached in brain_entries, regenerate
      action works; `venture_report_viewed` lands in events.
- [ ] `tsc -b` + `vite build` pass; prod smoke green.
