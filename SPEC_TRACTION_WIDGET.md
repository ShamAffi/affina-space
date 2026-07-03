# Traction widget — dynamic Business vs Learning balance

> Redesign of the Dashboard "Traction" card (src/components/MomentumCard.tsx +
> its data in api/pulse/draft.ts, api/progress.ts). Fixes: real check-in
> numbers not showing; and makes the card a living balance of two achievement
> categories that flex by how much REAL traction exists.

## Core principle

The card holds **two categories**, and their relative size is driven by real
traction:

- **BUSINESS PROGRESS** — real-world achievements (from check-ins + achievements).
- **LEARNING PROGRESS** — lessons / exercises / modules.

**The more real business progress exists, the LARGER the Business block and the
SMALLER the Learning block — down to Learning disappearing entirely.** Card
keeps its fixed height (md:h-[500px]); freed space is filled with the most
recent and important business achievements.

Business always outranks Learning. Learning is the floor for the idea stage,
never a replacement for real results (the current bug: when the AI card is
null, the widget shows ONLY learning stats and hides her real numbers — that
must never happen again).

## Data sources

**Business Progress (real):**
- `check_ins.metrics` [{name, value, delta}] — latest week's numbers
- `check_ins.keyResults` [{type: win|milestone|setback, text, metric}]
- `achievements` table (paying_customer, mrr_milestone, funding_round,
  metric_growth, soft_milestone) — verified real milestones
- `users.northStar` — the headline metric to prioritize

**Learning Progress:**
- lessonsDone, exercisesScored, modulesCompleted (already computed client-side)

**Recency:** a "business achievement in the last 7 days" = a check_in with
weekOf within 7 days carrying ≥1 win/milestone keyResult OR any metric with a
non-zero delta, OR an achievements-table row created within 7 days.

## Sizing tiers (deterministic — based on presence/recency of business progress)

| Tier | Condition | Business block | Learning block |
|---|---|---|---|
| **A — Idea stage** | No business achievements ever | Empty → shows the check-in invite | FULL stats (current early view) |
| **B — Early traction** | Some business progress exists | MEDIUM — headline metric + top 1–2 items | COMPACT — one summary line ("+ 17 lessons · 5 exercises") |
| **C — Real momentum** | Rich/recent business progress | FULL — headline + milestone + top 3 this-week + trajectory | HIDDEN entirely |

The tier is computed deterministically (count + recency of business
achievements), so it never depends on an AI call succeeding.

## Business block content (priority order, fill until height budget used)

1. **Headline metric** — North Star value (or top metric) with delta, big number.
2. **Milestone** — most significant keyResult of type milestone / achievements row.
3. **This week** — top wins/insights (keyResults), most recent & important first,
   capped to what fits (≈3 in Tier C).
4. **Trajectory / sparkline** — only if AI card provided it (enhancement).

**Deterministic floor + AI enhancement:** items 1–3 are built directly from
stored check_in data — they render even if the AI momentum card is null. The
AI card (api/pulse/draft.ts) is the *nicer* version — narrative headline,
trajectory text, sparkline trend — layered ON TOP when present, and its job is
to pick "самые последние и важные" among many achievements. It is never the
sole source.

## Staleness — the red update card

If there is **no business achievement in the last 7 days** (per the recency
rule above), show a **red mini-card at the top of the body**:

- Copy: **"Your business needs an update"** · sub: *"It's been a week — tell me
  what moved. Even a small win or a number keeps your momentum real."*
- Style: red/rose background (soft, not alarming — DESIGN.md accent), not a
  blocker, just a prompt. Clicking it opens the weekly check-in.
- **Precedence:** this red card REPLACES the existing amber "streak at risk"
  card when both would apply (don't stack two warnings). Streak-at-risk only
  shows if the red business-update card is NOT showing.

Note: staleness is about *business* updates specifically. A founder who did
lessons this week but logged no real progress still gets the red card — the
whole point is to pull her back into the real world.

## Layout (fixed height preserved)

```
┌ Traction · Your weekly rhythm            [⭐ North Star] ┐
│ [🔴 red update-needed card — only if stale]              │
│                                                          │
│ BUSINESS PROGRESS  (size per tier)                       │
│   • headline metric (big) + delta                        │
│   • milestone                                            │
│   • this week: win / insight bullets                     │
│   • trajectory (if AI provided)                          │
│                                                          │
│ LEARNING PROGRESS  (inverse size — full / one-line / gone)│
│                                                          │
│ 🔥 streak (if >0)                                        │
│                                                          │
│ [ 📊 Weekly check-in ]                                    │
└──────────────────────────────────────────────────────────┘
```

If business items exceed the height budget, show the most recent/important and
let the middle area scroll (overflow-y-auto already present) — never truncate
the headline metric or the red card.

## Implementation notes

1. **MomentumCard.tsx** — replace the current binary logic (AI card OR
   client learning-stats) with: compute businessTier (A/B/C) deterministically
   → render Business block (from check_in data, enhanced by AI card blocks if
   present) → render Learning block at the tier-appropriate size → streak.
   Add the red staleness card with precedence over amber streak card.
2. **Data to the component:** Dashboard must pass the latest check_in's
   metrics + keyResults (and/or recent achievements) to MomentumCard, not just
   momentumCard + learning counts. Extend props / the progress payload so the
   deterministic Business block has its source data. (api/progress.ts may need
   to return latestCheckIn metrics/keyResults + last business achievement date.)
3. **api/pulse/draft.ts** — update the momentum-card prompt so the AI, when it
   DOES compose a card, is told: surface Business achievements first, pick the
   most recent and important, and it's fine to omit learning entirely when
   business progress is strong. (The deterministic tier still governs sizing;
   AI governs narrative/selection.)
4. Keep the North Star chip and Weekly-check-in button exactly as they are.

## Acceptance

- Check-in with real metrics (e.g. Waitlist 125 +75, validators 4, survey 35)
  → Business block shows those numbers prominently, Learning shrinks to a line
  or disappears — EVEN IF the AI momentum card is null.
- User with only lessons done, no real progress → Learning full, Business shows
  the invite, and (if >7 days since any business update) the red card appears.
- Red update card and amber streak card never show simultaneously.
- Card height stays fixed; overflow scrolls, headline never truncated.
