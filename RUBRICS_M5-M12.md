# AI Mentor Scoring Rubrics — M5–M12

> Companion to CONTENT_M5-M12.md, RULES_DONE_FOR_YOU.md, and RUBRICS_M0-M4.md.
> Global rules (§0 of RUBRICS_M0-M4.md — scoring philosophy, feedback recipe,
> context/consistency, fabrication protocol) apply unchanged. This file adds
> block-specific criteria plus three new global additions below.

---

## 0a. New global additions for M5–M12

```
DELEGATE MODE C — SPECIAL HANDLING (Pivot/Scale scorecard, and similar)
When a block uses Delegate mode C (analysis + recommendation, decision stays hers):
- Score her DECISION REASONING, never the decision itself. There is no "correct"
  pivot/scale answer to grade against.
- Criteria shift to: did she engage with the evidence? Did she address the
  strongest counter-argument? Is the reasoning falsifiable (names what would
  change her mind)? A well-reasoned "I'm scaling despite mixed signals because X"
  can outscore a poorly-reasoned "I'm pivoting because the scorecard said so."
- Never penalize disagreeing with the AI's recommendation. Flag it, ask her to
  address why, then score the quality of that address.

FIRST-SALE CELEBRATION PROTOCOL (m8l6 and equivalent North Star milestones)
- On a genuine close: lead with unqualified celebration BEFORE any critique.
  This is the single most important milestone in the program — treat it that way.
- Do not immediately pivot to "but here's what to improve." Give the win its
  own full beat. Constructive notes, if any, come after, softly, optional.
- On no close: zero shame, zero "better luck next time" cheeriness that rings
  false. Treat documented no-reasons as valuable data, genuinely, not as
  consolation-prize framing.

FINANCIAL / LEGAL DISCLAIMER (Module 12 only)
- Never give specific legal advice on term sheets, specific valuation numbers,
  or jurisdiction-specific compliance. Explain concepts and mechanics (already
  in lecture content); for anything numeric/binding, the standard line is:
  "Run any real term sheet by a startup lawyer before signing — this tool
  explains the shape of the deal, not the terms of yours."
- This disclaimer belongs in AI outputs for m12l3 (deck), m12l4 lecture context,
  and any Delegate draft touching valuation/dilution — not just once at module start.
```

---

## 1. MODULE 5 — Business Model & Revenue

### m7l3 · Your business model
```
CRITERIA
- Model named clearly (25%): one of the standard shapes (subscription, one-off,
  marketplace, freemium, services), not a vague hybrid with no primary.
- Fit to customer (25%): connects to how HER persona actually prefers to pay —
  evidence from intake/interviews if available yet, reasoning if not.
- Fit to value (25%): matches whether the value is one-time-fix or ongoing —
  ongoing value priced as one-off (or vice versa) gets flagged.
- Honest rejection (25%): names the alternative she considered and what would
  make her reconsider — this is the "why THIS one" test, not just description.

AUTO-FLAGS
- Model chosen with no connection to founder's own 12-week goal (m0l3) or
  ambition type → flag mismatch gently ("you said lifestyle business — does a
  VC-scale marketplace model still make sense?").
- "I'll do subscription AND one-off AND marketplace" → cap at 50; ask her to
  pick a primary for the next 90 days.
BRAIN: business_model; Snapshot → Model.
```

### m8l3 · Unit economics v1
```
CRITERIA
- Numbers stated (30%): price, retention/repeat estimate, CAC guess — all three
  present, even roughly.
- Honesty over precision (30%): "I'm not sure, maybe €30" scores HIGHER than
  fake-precise numbers with no basis. Reward stated uncertainty.
- Shaky assumptions flagged (25%): AI's own job here — identify the 2-3 numbers
  doing the most work and say so explicitly in the response, not just score them.
- Ratio sanity (15%): LTV:CAC roughly assessed, with the 3:1 rule of thumb named
  as reference, not gospel — early numbers being below it is fine and expected.

AUTO-FLAGS
- LTV:CAC wildly above 3:1 (e.g., 50:1) on invented numbers → this reads as
  unexamined optimism, not strength; probe the CAC number specifically.
- No connection to pricing from m7l3/M4 quantified value → flag inconsistency.
NEXT-STEP: name which shaky number the M5 field interviews (m5l7) should test.
BRAIN: unit_economics; Snapshot → Model (mark assumptions confidence: high/med/low).
```

### m11l6 · North Star + year goal (structured, aiMode: north-star)
```
Do not score as pass/fail. Evaluate the CANDIDATE SET and her SELECTION:
- Candidates must follow from her business model (m7l3) — subscription model
  should not suggest "deals closed" as a candidate, for example.
- Selected metric reflects delivered VALUE, not vanity (revenue alone, follower
  counts, registrations are weak candidates — flag if selected without reasoning).
- Year goal + quarterly milestones: sanity-check against unit economics (m8l3)
  and market size (M2 TAM). "Brave but unrealistic" gets a kind, specific flag
  ("your TAM math suggests ~800 reachable customers — a 5,000-subscriber year
  goal needs either a bigger market story or a longer timeline").
NEXT-STEP: this becomes the standing weekly check-in question from here forward.
BRAIN: north_star; Snapshot → Model (pin as headline metric).
```

### m5l7 · 🟡 5–10 interviews with WTP questions (Interview Log, min 5)
```
Builds on M3/M3.7 rubric (interview_log) — same per-entry criteria, with one
weight shift and one addition:

- Price signal field (now weighted 25%, up from 15%): must contain something
  concrete — a number mentioned, a reaction to a price point, an existing spend
  amount. "Didn't discuss price" on multiple entries → flag pattern, not
  individual entries (some conversations naturally don't reach money — fine
  once, a pattern across all 5+ is a coaching moment).
- New auto-flag: if she asked "would you pay X?" (future hypothetical) instead
  of anchoring to past spend/behavior — same Mom Test override as M3, but
  softer tone (she's now explicitly probing price, some hypothetical framing
  is unavoidable here; correct toward "what have you paid before" framing
  rather than hard-blocking).
VERDICT: done requires ≥5 entries (up from ≥1 in M3), majority with price signal.
CELEBRATE: reaching double-digit interview count is a genuine milestone — name it.
BRAIN: interview_log entries → pricing hypothesis update; Snapshot → Model + Customer.
```

---

## 2. MODULE 6 — MVP & Website

### m9l3 · Assumptions map (KEEP-урок, рубрика формализована)
```
CRITERIA
- Riskiest-first (35%): assumptions ranked, not just listed — the one that
  kills the business if false is clearly marked as #1.
- Testable framing (30%): each assumption stated so a test could prove it
  wrong ("customers will pay €30/mo" not "people will like it").
- Traces to evidence gaps (25%): connects to what interviews/research haven't
  yet confirmed — not invented from thin air.
- Right altitude (10%): business-model-level assumptions, not implementation
  details ("the button should be blue" is not a riskiest assumption).
AUTO-FLAG: no assumption about willingness to pay anywhere in the list → missing[],
this is almost always the riskiest one.
BRAIN: key_assumptions; feeds directly into m10l3 MVBP scope.
```

### m10l3 · MVBP definition (KEEP-урок, рубрика формализована)
```
CRITERIA
- Delivers real value (30%): the cut-down version still solves the core job,
  not just a feature demo.
- Enables payment (30%): some mechanism for money to change hands exists, even
  informally (Stripe link, manual invoice, pre-order) — "MVP" that can't
  possibly be paid for yet is not an MVBP by this program's definition.
- Genuinely minimal (25%): scope knife applied — she named what she cut, not
  just what she kept.
- Buildable in days, not months (15%): realistic against her stated capacity
  (m0l3) and available tools.
AUTO-FLAG: scope includes 5+ features → ask her to cut to the single core loop;
cap at 55 until she does.
BRAIN: mvbp_definition; Snapshot → Product.
```

### m6l7 · Your site structure
```
CRITERIA
- Message-match (30%): hero language echoes actual customer words from
  interview_log — check for verbatim or near-verbatim phrases, not generic copy.
- One clear ask (25%): a single CTA/action, not three competing buttons.
- Proof present (20%): something true and specific (a quote, a number, her
  story) — not placeholder "trusted by thousands" with no basis.
- Success metric named (15%): she stated what conversion she's testing for
  before publishing (feeds m6l8).
- Sounds like her (10%): edited, not a raw AI draft accepted unchanged.

AUTO-FLAGS
- Generic marketing language with no persona-specific phrasing → flag, this is
  a Delegate-draft-accepted-unedited signal; ask her to add one real quote.
- No success metric stated → block progression to m6l8 gently ("what number
  will tell you this worked?").
BRAIN: site_structure; Snapshot → Product.
```

### m6l8 · 🟡 Publish your site/MVP + first traffic — field task
```
CRITERIA
- Artifact present (25%): live URL, reachable.
- Threshold pre-declared (25%): she stated success criteria BEFORE seeing
  results (per briefing) — if this is missing, note it kindly but don't block;
  ask her to state it retroactively for honesty's sake going forward.
- Real audience (25%): traffic came from people/communities connected to her
  interview pool or persona — not just "posted on my personal Instagram to
  20 friends" with no persona match (still counts, but flag as thin evidence).
- Numbers reported honestly (25%): actual visitor/conversion counts, not
  rounded-up impressions.

VERDICT: done requires live URL + at least directional numbers reported,
regardless of whether the threshold was hit — hitting zero conversions with
good traffic is valid, useful data, not a failed task.
BELOW-THRESHOLD HANDLING: this is diagnostic, not disappointing — walk through
message/audience/offer as candidate explanations per the debrief hint in content.
BRAIN: launch_results; Snapshot → Traction; update unit_economics (m8l3) with
real conversion data if available.
```

---

## 3. MODULE 7 — Customer Acquisition & Marketing

### m6l3 · Acquisition path (KEEP-урок, рубрика формализована)
```
CRITERIA
- Full path mapped (35%): discovery → consideration → decision → payment,
  no stage skipped.
- Realistic friction (30%): names actual points where she'll lose people
  (budget approval, trust, comparison shopping) — not a frictionless fantasy.
- Timeframe stated (20%): how long the path typically takes for this customer
  (impulse buy vs multi-week B2B decision) — affects everything downstream.
- Consistent with DMU (15%): aligns with who actually decides (feeds m6l4).
BRAIN: acquisition_path; Snapshot → Market.
```

### m6l4 · Decision & influence map (KEEP-урок, рубрика формализована)
```
CRITERIA
- Roles distinguished (40%): champion / end user / economic buyer / blocker
  named separately, even if one person holds multiple roles for her (common
  in B2C — still name it explicitly: "she is all four").
- Right person targeted (30%): her sales/marketing plan implicitly or
  explicitly aims at the actual decision-maker, not just the end user.
- Vetoes named (20%): who could kill the deal and why (partner, budget,
  boss) — often missing, and often the actual reason deals stall.
- Grounded in evidence (10%): traces to what interviews revealed about how
  decisions actually get made.
AUTO-FLAG: single-person B2C sold as if it needs enterprise-style DMU complexity
→ right-size it down; over-engineering here wastes her time.
BRAIN: decision_map; Snapshot → Market.
```

### m7l7 · Five candidate channels, two bets
```
CRITERIA
- Ranked, not just listed (25%): candidates ordered by fit to persona +
  reachability, with reasoning.
- Two chosen with rationale (25%): the two she commits to connect logically
  to where her persona actually spends time (from persona/interview data).
- Falsifiable hypothesis per channel (35%): "X will bring Y for Z effort" —
  BOTH a number and an effort estimate present, not just "I'll try LinkedIn."
- Unscalable-first bias respected (15%): at least one channel is a
  do-things-that-don't-scale move, not two paid-ads bets on day one.

AUTO-FLAGS
- Hypothesis with no number ("I'll post and see what happens") → needs_work,
  ask for a specific expected result to test against.
- Both channels are paid/scalable with meaningful budget required → flag
  against her stated capacity/budget from Snapshot.
BRAIN: channel_shortlist; feeds m7l8.
```

### m7l8 · 🟡 First traffic on purpose — field task
```
CRITERIA (per channel, both channels required for "done")
- Executed as hypothesized (30%): she actually ran what she committed to in
  m7l7, not a different channel entirely (pivoting the test is fine, but say so).
- Numbers reported (30%): reach/clicks/replies/conversions — real counts, and
  hours spent (for later CAC math).
- Verdict stated (25%): double-down / drop / adjust, WITH the reasoning — not
  just a label.
- Compared to hypothesis (15%): explicitly says whether the prediction from
  m7l7 was right, wrong, or partially right — this is the actual learning.

VERDICT: done requires both channels attempted with real numbers, even if
results are poor. A channel that clearly failed with honest numbers is a
completed, valuable task — do not require success for done status.
BRAIN: acquisition_results; recompute rough CAC per channel into unit_economics
(m8l3); Snapshot → Market (winning channel flagged).
```

---

## 4. MODULE 8 — Sales

### m8l4 · Your sales script
```
CRITERIA
- Discovery-first open (30%): starts with a question about her situation,
  not an immediate pitch — Mom Test discipline carried into sales context.
- Honest bridge (25%): connects her stated pain (from interview_log, in her
  words) to the offer in one clear sentence — no exaggeration beyond what
  the product actually does.
- Explicit ask with price (25%): the script contains an actual moment of
  asking for the sale, with a specific number — not a fade-out ending.
- Objection answers grounded (20%): the top 3 objections handled are ones
  that ACTUALLY came up in her interviews/pipeline, not generic startup
  objections copy-pasted.

AUTO-FLAGS
- No explicit ask anywhere in the script → override, this is the single most
  common founder sales failure; flag directly with the missing line highlighted.
- Overpromising beyond validated product capability → flag as an integrity
  issue, not just a quality one — this protects her reputation with early customers.
NEXT-STEP: rehearse with AI skeptic before first real use.
BRAIN: sales_script.
```

### m8l5 · Your pipeline
```
CRITERIA
- Real prospects only (35%): named individuals traceable to interview_log,
  waitlist, or warm intros — no invented "segments" or placeholder rows.
- Honest staging (30%): stages reflect actual conversation status, not
  aspirational ("in conversation" for someone who hasn't replied to an email
  gets corrected to "to contact").
- Sustainable quota (25%): weekly touch target is something she can actually
  sustain given capacity from Snapshot — an unrealistic quota she'll abandon
  in week two scores lower than a modest one she'll keep.
- Coverage (10%): pipeline size proportional to her North Star goal — too
  thin a pipeline can't mathematically hit her stated year target; flag the gap.
AUTO-FLAG: any prospect entry with no name/traceable source → this violates
no-fabrication; ask her to remove or substantiate it.
BRAIN: pipeline.
```

### m8l6 · 🟡 Close your first paid deal — field task
```
Apply the First-Sale Celebration Protocol (§0a) — this overrides normal tone
defaults for this block specifically.

CRITERIA (on close)
- Payment proof present (40%): screenshot or equivalent evidence.
- What worked captured (30%): she names what made this one say yes — this
  becomes the template for the next ones.
- Terms honest (20%): if it was a discounted/founder-price/pilot deal, she
  says so plainly (this matters for unit economics accuracy later).
- Reflection connects to earlier modules (10%): links back to the value prop,
  persona, or objection-handling that made it click.

CRITERIA (on no close — this path is NOT a lesser outcome)
- ≥5 documented real asks (50%): with dates/context, not vague "I tried."
- No-reasons captured with specificity (35%): price, timing, trust, fit —
  categorized, feeding directly into M9.
- No shame in the writing (15%): AI checks her own framing isn't self-flagellating;
  if it reads discouraged, the response leads with reassurance before feedback.

VERDICT: done = close (celebrate) OR ≥5 honest documented asks with reasons
(also counts as done — this is explicit in the rubric, not a fallback).
BRAIN: first_sale (or no_close_log); Snapshot → Traction (major Launch Readiness
event on close); feeds M9 funnel analysis either way.
```

---

## 5. MODULE 9 — Review Block

### m11l3 · Traction dashboard
```
Do not score her input heavily — this exercise is mostly AI-assembled (Delegate
mode A per RULES_DONE_FOR_YOU.md §2.4). Evaluate HER contribution:
- Leak identification (50%): she names a stage, not "everything needs work"
  (too vague) or a stage the data doesn't actually support (unsupported).
- Why-hypothesis quality (35%): connects to a specific candidate cause
  (message/audience/road-to-value/offer/price) with reasoning, not a guess.
- Evidence cited (15%): references something concrete from earlier modules
  (an interview quote, a channel result) supporting the hypothesis.
AUTO-FLAG: leak identified doesn't match what the assembled funnel actually
shows → gently point to the data, ask her to reconsider.
BRAIN: traction_metrics; Snapshot → Traction.
```

### m9l5 · Progress report + defense
```
CRITERIA
- Honest win (25%): specific, with the number attached — not generic positivity.
- Real surprise named (25%): something that contradicted an earlier assumption —
  if she says "nothing surprised me," probe once ("truly nothing? even the
  interview responses?").
- Evidence-linked change (30%): what she changed and WHY, citing the specific
  evidence that caused it — this is the pivot-is-a-skill principle made concrete.
- Forward priority is specific (20%): one clear next-4-weeks priority, not a
  wish list of five things.

DEFENSE PANEL LOGIC: after her narrative, generate 2-3 follow-up questions a
mentor panel would actually ask (per content brief), score her responses on
the same criteria, then output: rating + exactly 3 priorities for next sprint
(not 1, not 5 — three, matching Founder Institute's format).
BRAIN: progress_report; Snapshot → Traction (checkpoint snapshot saved).
```

### m9l6 · 🟡 Talk to the ones who said no — field task
```
CRITERIA (per entry)
- Real conversation happened (30%): evidence of an actual exchange, not
  speculation about why someone didn't convert.
- Their words captured (30%): her interpretation clearly separated from what
  they actually said — "she said X" vs "I think she felt Y" should read differently.
- Stage identified (20%): where in the funnel they dropped, connecting to M9.4.
- No defensiveness (20%): AI checks the log doesn't read like she argued her
  case to them — pure listening mode maintained (Mom Test discipline again).

FABRICATION PROTOCOL applies with extra weight here — "no" conversations are
uncomfortable to have, and thin/invented entries are a common failure mode.
Probe kindly if entries feel generic.
BRAIN: non_buyer_insights; cross-reference against m11l3 leak; feeds directly
into m11l7 scorecard as evidence.
```

---

## 6. MODULE 10 — Be a Solopreneur

### m10l8 · Audit yourself honestly
```
CRITERIA
- Strengths tied to evidence (35%): each strength references something she
  actually did well in the program (a task that flew, a score, a pattern) —
  not generic self-assessment ("I'm a hard worker").
- Drains named honestly (35%): specific tasks/patterns that stalled or
  exhausted her — AI's own behavioral read (from task history) should roughly
  match; flag large mismatches gently ("you rated sales as a strength, but
  your pipeline task took three reminders — worth a second look?").
- Blind spot has texture (20%): not a throwaway line; something she genuinely
  seems unsure about.
- Confirmed, not just accepted (10%): she edited/reacted to the AI draft
  rather than clicking through unchanged.
BRAIN: strengths_audit; Snapshot → Founder & edge (update).
```

### m10l5 · Do / Delegate / Automate
```
CRITERIA
- Real inventory (30%): actual recurring tasks from her week, not abstract
  categories.
- Correct bucketing (35%): "Do" reserved for judgment/relationship work;
  things requiring her literal face/voice with customers stay in Do even if
  tedious — AI should catch mis-bucketed items (e.g., "sales calls" in Automate).
- One clear commitment (25%): a single specific item chosen to offload this
  week, not a vague intention.
- Realistic to/whom (10%): the automation/delegate target is plausible given
  her tools/budget from Snapshot.
AUTO-FLAG: everything bucketed as "Do" → gently challenge; the exercise fails
its purpose if nothing moves.
BRAIN: delegation_matrix.
```

### m10l9 · 🟡 Actually offload one thing — field task
```
CRITERIA
- Handoff genuinely happened (40%): the task ran without her at least once —
  not "I set up the tool" with no evidence it worked.
- Proof present (25%): screenshot, output, or description of the task
  completing autonomously.
- Hours honestly counted (20%): a real number, not rounded up.
- Reflection on hours spent (15%): where the freed time actually went —
  "scrolled" is an acceptable honest answer per the brief; vague non-answers
  are not.
VERDICT: done requires evidence of at least one successful autonomous run.
BRAIN: delegation_action; adjust weekly plan capacity assumptions going forward.
```

---

## 7. MODULE 11 — Pivot or Scale

### m11l7 · The scorecard — Delegate mode C, special rubric (see §0a)
```
Do NOT score whether she chose pivot, scale, or fix-first — there is no correct
answer. Score the REASONING:

CRITERIA
- Engages the evidence (35%): reasoning references specific data points from
  the AI-assembled case file (retention, unit economics, funnel, non-buyer
  patterns) — not generic "I have a good feeling about this."
- Addresses the counter-case (30%): if she disagrees with the AI recommendation,
  she says why — what she weighs differently and why that's defensible.
- Falsifiable (20%): names what evidence would change her mind — a decision
  with no exit condition is a belief, not a strategy.
- Specific commitment (15%): which type of pivot / which scaling motion /
  which fix — not just the category label.

AUTO-FLAGS
- Decision reverses a strong-evidence recommendation with zero reasoning given
  ("scorecard said pivot, I'm scaling") → needs_work, ask her to engage with
  WHY she disagrees; do not lower score just for disagreeing once she does.
- Decision matches AI recommendation with zero personal reasoning added
  ("going with what it said") → also flag — rubber-stamping isn't ownership either.
BRAIN: pivot_scale_decision; this becomes the load-bearing fact for m11l4 and
the entire next phase of the program.
```

### m11l4 · Your 12-month plan
```
CRITERIA
- Four real milestones (30%): concrete, dated, different from each other
  (not "grow more" repeated four times).
- North Star targets attached (25%): each quarter has a number tied to the
  m11l6 North Star, showing a believable trajectory.
- Resources named (25%): hours/money/hiring or agent needs stated per phase,
  checked against her actual capacity (Snapshot).
- One load-bearing assumption named (20%): she identifies the single thing
  the whole plan depends on — this becomes what M11.6 verification tests.
AUTO-FLAG: milestone targets that ignore the unit economics ceiling from M5/M9
(e.g., revenue target impossible given stated CAC/conversion) → flag the math,
kindly, with the specific numbers.
BRAIN: roadmap; Snapshot → Model (year plan).
```

### m11l11 · 🟡 Verification sprint — field task (branching)
```
Branch-specific criteria, common verdict logic:

SCALE BRANCH: real test run on the exact motion being bet on (not a different,
easier test); numbers reported; explicit compare to what the roadmap assumed.
PIVOT BRANCH: reuses M3/M5 interview rubric — 3-5 entries against the NEW
hypothesis, same quote/evidence standards.
FIX-FIRST BRANCH: fix actually shipped (not just planned); the specific leaking
funnel stage re-measured for the week; before/after numbers both present.

COMMON
- Result compared honestly against what the plan assumed (40% weight regardless
  of branch): "confirmed" or "adjusted" must be justified with the actual numbers,
  not asserted.
- If evidence contradicts the plan: treat as valuable, not as failure — this
  block exists specifically to catch expensive mistakes early; say so explicitly.
VERDICT: done requires branch-appropriate artifact + explicit verdict written.
BRAIN: verification_sprint; updates roadmap (m11l4) and scorecard (m11l7) with
real results; gates entry to M12 either way once verdict is recorded.
```

---

## 8. MODULE 12 — Fundraising & Your Story

*Financial/Legal Disclaimer (§0a) applies to every AI output in this section.*

### m12l3 · Build your deck
```
CRITERIA
- Hook lands (20%): slide-one sentence makes the stated problem/opportunity
  clear to someone hearing it cold.
- Traction slide is real (30%): actual evidence from her Brain (interviews,
  conversions, first sale, retention signal) — not aspirational placeholders.
  This is the single most heavily weighted criterion; a deck with a thin
  traction slide caps at 60 regardless of narrative polish.
- Ask is specific (25%): amount, milestones it buys, rough terms — vague
  "seeking investment" asks get flagged directly.
- Internally consistent (15%): market size, model, and ask agree with each
  other and with what's in her Snapshot (no invented numbers slipping in
  during the polish pass).
- Narrative arc (10%): reads as one story, not ten disconnected slides.

AUTO-FLAGS
- Any number on the deck not traceable to Brain/Snapshot data → flag as
  unverified, apply the financial disclaimer, ask for source.
- Traction slide missing or empty at this point in the program → this is
  unusual (M8 required at least a documented close attempt) — ask what happened.
NEXT-STEP: rehearse with AI investor Q&A before real outreach.
BRAIN: pitch_narrative.
```

### m12l5 · 🟡 Find 20 investors who actually fit — field task
```
CRITERIA (aggregate across the list, per-entry lighter touch)
- Genuine fit evidence (40%): "why they fit" cites actual portfolio companies
  or fund thesis, not "they invest in startups."
- Stage/check/geo match (25%): targets plausibly write checks at her stage
  and size — padding the list with famous funds that don't do pre-seed gets
  flagged as a pattern, not per-entry.
- Warmest-path realism (20%): path-in assessment is honest (most should be
  "cold" at this stage — that's fine and expected, not a problem to fix).
- Grants/angels included (15%): list isn't 100% traditional VC if her stage/
  ambition (from Snapshot) suggests grants/angels are actually the better fit —
  flag if entirely absent without reasoning.
VERDICT: done requires ~20 targets with fit reasoning for each, prioritized.
BRAIN: investor_targets.
```

### m12l6 · 🟡 Talk to 10 of them — field task (outreach log)
```
CRITERIA
- Volume (30%): ≥10 real contacts attempted, traceable to the m12l5 list.
- At least one live conversation (30%): a call/meeting/genuine email exchange
  with questions — this is the "done" bar, not just sent messages.
- Objections/questions logged with specificity (25%): what they actually asked,
  not "they had questions" — this feeds deck iteration directly.
- Batched, not trickled (15%): outreach clustered in the same window per the
  lecture's momentum principle — spread over a month with no overlap gets a
  gentle nudge, not a penalty.

FABRICATION PROTOCOL applies — investor conversations are high-stakes to fake;
probe kindly if entries feel too smooth/generic.
CELEBRATION: any live conversation, regardless of outcome, is worth naming as
genuine progress — most founders never get this far.
BRAIN: outreach_log; feeds deck iteration (m12l3) and — for anyone continuing —
sets up the S3 graduation session narrative.
```

---

## 9. Сводная таблица порогов (М5–М12)

| Блок | Тип | Проходной (Readiness) | Особый режим |
|---|---|---|---|
| m7l3, m8l3 | 🔴 | ≥50 | — |
| m11l6 North Star | 🔴 | не pass/fail | sanity-check реалистичности |
| m5l7 | 🟡 | done: ≥5 записей, б.ч. с ценовым сигналом | — |
| m9l3, m10l3 | 🔴 | ≥50 | — |
| m6l7 | 🔴 | ≥50 | блок success-metric перед прогрессом |
| m6l8 | 🟡 | done: URL + цифры (успех не обязателен) | — |
| m6l3, m6l4 | 🔴 | ≥50 | — |
| m7l7 | 🔴 | ≥50 | override: нет числа в гипотезе |
| m7l8 | 🟡 | done: оба канала + цифры (успех не обязателен) | — |
| m8l4 | 🔴 | ≥50 | override: нет explicit ask |
| m8l5 | 🔴 | ≥50 | fabrication check на именах |
| m8l6 | 🟡 | done: close ИЛИ ≥5 asks с причинами | **Celebration Protocol** |
| m11l3 | 🔴 | ≥50 | AI-assembled, оценка её вклада |
| m9l5 | 🔴 | ≥50 | defense panel: 3 приоритета фикс |
| m9l6 | 🟡 | done: записи с реальными словами | fabrication check |
| m10l8, m10l5 | 🔴 | ≥50 | — |
| m10l9 | 🟡 | done: доказанный автономный прогон | — |
| m11l7 | 🔴 | **Mode C** — оценка reasoning, не решения | **особая рубрика §0a** |
| m11l4 | 🔴 | ≥50 | сверка с потолком юнит-экономики |
| m11l11 | 🟡 | done: branch-artifact + verdict | ветвление по 11.4 |
| m12l3 | 🔴 | ≥50 | traction-слайд весит 30%, cap 60 если пуст |
| m12l5 | 🟡 | done: ~20 целей с обоснованием | — |
| m12l6 | 🟡 | done: ≥1 живой разговор | fabrication check |

---

*Rubric set complete for M0–M12. Next: iterate M0–M4 rubrics/content based on
internal test results; email copy for the 23-trigger table once Resend is connected.*
