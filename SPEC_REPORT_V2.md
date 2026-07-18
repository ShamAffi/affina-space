# Onboarding Report v2 — "Founder Readiness Snapshot" (the aha moment)

> Upgrades the onboarding report from 3 shallow bullets to a real assessment
> framework grounded in how top incubators/accelerators evaluate startups:
> Village Capital VIRAL (readiness LEVELS, licensed to 26 accelerators),
> Scorecard Method (weighted DIMENSIONS), Berkus (qualitative pre-revenue
> criteria), YC/Techstars lenses (team/market/timing/validation-in-any-form),
> Startup Genome (premature-scaling risk — 70% of failures). Decided with
> Shamil: 3 strengths, 3 risks, roadmap as 3 paragraphs.
>
> Honesty rule (non-negotiable): input is 5 intake fields — we assess her
> CLARITY & READINESS (VIRAL-style awareness), never the business's "true
> value"; no invented facts, numbers, or market data. Hedge as "based on what
> you've shared."

## §1 — The framework (5 blocks)

**1. Readiness Level — the ladder (VIRAL-inspired, tuned to our journey):**
5 levels mapping EXACTLY to the program arc:
- L1 **Spark** — an idea, articulated
- L2 **Focus** — a specific customer + a specific pain
- L3 **Validated** — evidence from real people (interviews/signals)
- L4 **Built** — an MVP live in the world
- L5 **Selling** — first paying customers
Output: her level + one line why + "what unlocks Level N+1" (one sentence,
maps to the program: M1–M3 validation → M6–M7 MVP → M8 first sale).

**2. Dimension profile — 4 scored bars (Scorecard-inspired):**
- **Problem & Customer** — how sharply she knows WHO and what PAIN (YC lens)
- **Market & Timing** — opportunity/why-now signal in her answers (Techstars)
- **Business Model** — does the money flow fit how her customer buys (Berkus)
- **Stage & Momentum** — where she is vs her ambition (Startup Genome pacing)
Each: `score 0–100` + `read` (ONE line, references her actual words).
Overall score = kept (drives the existing percentile, computed
deterministically — unchanged).

**3. Strengths ×3** — each tagged to a dimension, each quoting/echoing HER
words (never generic praise).

**4. Risks ×3** — each with "why this matters at your stage" (one line). At
least one must be a PACING risk when goal outruns stage (Startup Genome:
premature scaling kills 70%) — phrased warmly, not scary.

**5. Roadmap 90 days — 3 PARAGRAPHS (was 3 short steps):**
- **Weeks 1–2** / **Weeks 3–6** / **Weeks 7–12**
- Each paragraph (3–4 sentences): what to do → why (tie to a named risk or
  weak dimension) → the PROOF she'll hold at the end (interviews done, MVP
  live, first payment).
- Mirrors the program arc so the CTA ("Start the program for free") is the
  natural next click. Do not name modules explicitly — describe the work.

Kept from v1: `summary` (2–3 sentence honest verdict, punchy), `firstFocus`
(renamed in UI to "This week's first move" — the single next action), the
deterministic `percentileAheadOf`.

## §2 — Data & API changes (`api/score.ts`)
- Extend the JSON schema (Zod) to:
```
{ score, summary, level: {n: 1|2|3|4|5, name, why, unlocksNext},
  dimensions: [{key: 'problem_customer'|'market_timing'|'business_model'|'stage_momentum',
                score, read}] (exactly 4),
  strengths: [3 × {dimension, text}],
  risks: [3 × {text, whyNow}],
  roadmap: [3 × {horizon: 'w1_2'|'w3_6'|'w7_12', title, body}],
  firstFocus }
```
- Lenient parsing as elsewhere (`z.coerce`, `.catch()`, clamp counts: accept
  2–3 strengths/risks, pad/trim to 3 in UI only if needed — better to demand 3
  in the prompt and tolerate 2).
- `max_tokens`: 900 → **~2200**. Model stays `MODELS.standard`. Still one call,
  fits `maxDuration` comfortably.
- Prompt rewrite: embed the framework + honesty rules + the existing
  anti-inflation tone (warm but straight, reference her actual words, no
  fabricated numbers/market sizes; level/dimension scores = readiness of
  thinking, not valuation).
- `FALLBACK` object updated to the new shape (thin but valid).
- `computePercentile(score)` unchanged.

## §3 — UI (`RevealTeaser.tsx` — same component, richer render)
Order: score + percentile hero → **level ladder** (5 steps, hers lit, violet;
"unlocks next" line under it) → **4 dimension bars** (score + one-line read)
→ strengths (3, green) / risks (3, amber, with whyNow small text) →
**"Your next 90 days"** (3 paragraphs w/ horizon labels) → "This week's first
move" highlight → existing CTA unchanged ("Start the program for free").
- DESIGN.md tokens; bars/ladder = simple divs, no chart lib.
- Must render sanely on mobile (stacked) — she may open from the day-0 email.
- `/report` page and email #12 reuse this automatically (same component/data).
- **Back-compat:** old `onboardingReport` rows (v1 shape) exist on test users —
  render-guard: if `level`/`dimensions` absent, fall back to the v1 layout (or
  regenerate on next visit). Don't crash.

## §4 — Out of scope
Quiz-stage inputs (goal3y etc. — the report generates before the quiz);
re-scoring later in the program (Snapshot owns that); PDF export of the report.

## §5 — Acceptance
- [ ] Fresh onboarding run: report renders level ladder + 4 scored dimensions +
      3 strengths + 3 risks (each with whyNow) + 3 roadmap paragraphs + first
      move + percentile.
- [ ] Strengths/risks visibly reference the founder's own wording (spot-check
      2 different test ideas — a vague one and a sharp one; scores должны
      differ meaningfully, vague ≠ 80+).
- [ ] A goal far ahead of stage (e.g. stage=idea, goal=investment) produces a
      pacing risk.
- [ ] No invented numbers/market data anywhere in output.
- [ ] Old-shape stored reports don't crash `/report` (guard or regenerate).
- [ ] Day-0 email → `/report` shows the full new report on mobile width.
- [ ] `tsc -b` + `vite build` pass; one AI call, fits the 60s budget.
