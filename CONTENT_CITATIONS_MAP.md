# Citation-restoration map — exact find/replace per theory block

> Companion to CONTENT_M0-M4.md / CONTENT_M5-M12.md. Built from the LIVE text in
> src/data.ts (dumped directly via TS import, not guessed). Covers every
> `kind: 'theory'` block across all 13 modules. Apply mechanically: find the
> exact snippet, replace with the cited version — no other changes.
>
> Status legend: **INSERT** = citation missing, add it · **ALREADY CITED** =
> no change needed, verified · **SKIP** = no single attributable framework,
> leave as-is (general synthesis, not borrowed from one named source) ·
> **STUB** = block is a placeholder, out of scope here — fixed via Prompt 1
> / CONTENT_STUBS_FIX.md instead, do not touch in this pass.

---

## Module 0

**m0l1 "How Affina works"** — SKIP. Platform's own voice, not a borrowed framework.

**m0l2 "Being a founder in the AI era"** — SKIP. Original synthesis, no single source.

## Module 1

**m1l1 "Think in hypotheses: the lean loop"** — INSERT. Framework: Lean Startup (Eric Ries) + Customer Development (Steve Blank).
```
FIND:    A startup is not a small big company — it's a search machine for a business model that works.
REPLACE: A startup is not a small big company — it's what Steve Blank and Eric Ries call a search machine for a business model that works.
```

**m1l2 "Why a clear idea beats a big idea"** — SKIP. General founder wisdom, no single attributable source.

**m1l3 "The shape of a one-liner that lands"** — SKIP. Copywriting structure, no single named framework (loosely echoes Geoffrey Moore's positioning statement, but too indirect to force a citation).

## Module 2

**m2l1 "Is this a market worth winning?"** — SKIP. Standard VC due-diligence heuristic (painkiller/vitamin), not one named source.

**m2l2 "Your real competitor is the status quo"** — SKIP. Common product/VC heuristic, pre-existing text, no single named source.

**m2l3 "Market size: TAM bottom-up"** — INSERT. Framework: MIT Disciplined Entrepreneurship, Step 4 (Bill Aulet).
```
FIND:    Estimate it bottom-up, not top-down.
REPLACE: Estimate it bottom-up, not top-down — the approach Bill Aulet's MIT Disciplined Entrepreneurship framework insists on.
```

## Module 3

**m3l1 "You can't build for everyone"** — INSERT. Framework: MIT DE "beachhead market" (Bill Aulet); Peter Thiel (own a small market).
```
FIND:    This is your beachhead: the narrow front where you win completely before expanding.
REPLACE: This is your beachhead — Bill Aulet's term for it — the narrow front where you win completely before expanding, echoing Peter Thiel's advice to dominate a small market before going wide.
```

**m3l2 "What makes a great first customer"** — INSERT. Framework: MIT DE beachhead customer profile (Bill Aulet).
```
FIND:    Not all customers are equal at the start.
REPLACE: Not all customers are equal at the start — Bill Aulet's MIT framework scores exactly this with four criteria.
```

**m3l3 "Interviews that tell the truth"** — INSERT. Framework: "The Mom Test" (Rob Fitzpatrick) — book already named, author missing.
```
FIND:    The Mom Test fixes this: never pitch, never ask about the future, ask about past behavior instead.
REPLACE: Rob Fitzpatrick's The Mom Test fixes this: never pitch, never ask about the future, ask about past behavior instead.
```

## Module 4

**m4l1 "Fall in love with the problem, not the solution"** — INSERT. Framework: Jobs-to-be-Done (Clayton Christensen).
```
FIND:    Jobs-to-be-Done flips the lens: what progress is she trying to make, and what does she "fire" to hire you?
REPLACE: Clayton Christensen's Jobs-to-be-Done framework flips the lens: what progress is she trying to make, and what does she "fire" to hire you?
```

**m4l2, m4l3, m4l4** — STUB, fixed via CONTENT_STUBS_FIX.md (already cite Bill Aulet's MIT DE Steps 6/7/8 explicitly in the new text). Do not edit here.

## Module 5

**m5l1, m5l2** — STUB, fixed via CONTENT_M5-M12.md text (5.1/5.2). Do not edit here.

**m5l3 "LTV, CAC & your North Star Metric"** — INSERT. Framework: North Star Metric (Sean Ellis / growth community).
```
FIND:    A North Star metric is the opposite: one number that captures the core value your product delivers to a real customer.
REPLACE: A North Star metric — the term Sean Ellis and the growth community coined — is the opposite: one number that captures the core value your product delivers to a real customer.
```

## Module 6

**m6l1, m6l2, m6l3** — STUB, fixed via CONTENT_STUBS_FIX.md (already cite Bill Aulet / Alberto Savoia / Paul Graham explicitly). Do not edit here.

**m6l4 "Anatomy of a landing page that converts"** — INSERT. Framework: StoryBrand (Donald Miller) — already named, author missing.
```
FIND:    The StoryBrand structure: your customer is the hero, her problem is the villain, you are the guide with a plan, and one clear call to action.
REPLACE: Donald Miller's StoryBrand structure: your customer is the hero, her problem is the villain, you are the guide with a plan, and one clear call to action.
```

## Module 7

**m7l1, m7l2** — STUB, fixed via CONTENT_STUBS_FIX.md (already cite Bill Aulet's MIT DE Steps 13/12 explicitly). Do not edit here.

**m7l3 "19 channels, pick 2"** — INSERT. Framework: "Traction" Bullseye method (Gabriel Weinberg) — method named, author missing.
```
FIND:    The Bullseye method: brainstorm all, shortlist the promising, test cheaply, double down on what works.
REPLACE: Gabriel Weinberg's Bullseye method (from his book Traction): brainstorm all, shortlist the promising, test cheaply, double down on what works.
```

**m7l4 "CJM & retention: the leaky bucket"** — INSERT. Framework: AARRR / "pirate metrics" (Dave McClure).
```
FIND:    Map the journey — Awareness, Acquisition, Activation, Retention, Referral, Revenue — and find where users leak out.
REPLACE: Map the journey with Dave McClure's AARRR framework — Acquisition, Activation, Retention, Referral, Revenue — and find where users leak out.
```
*(Note: live text prepends "Awareness" to the classic 5-stage AARRR — the replace above drops it to match McClure's actual model; flag to Shamil if the 6-stage version was intentional.)*

## Module 8

**m8l1 "The founder is the first salesperson"** — INSERT. Framework: Tyler Bosmeny (Clever), Y Combinator CS183B "How to Sell" lecture.
```
FIND:    Founder-led sales is a simple pipeline: prospecting (finding the right people), conversations (understanding their pain), closing (asking for the deal).
REPLACE: Founder-led sales, as Clever founder Tyler Bosmeny puts it, is a simple pipeline: prospecting (finding the right people), conversations (understanding their pain), closing (asking for the deal).
```

**m8l2 "You're not selling — you're helping"** — SKIP. Reframe/values statement, not a distinct named framework beyond m8l1's Bosmeny citation (which already anchors this pair of lectures).

**m8l3 "The funnel math: volume beats perfection"** — INSERT. Same source as m8l1 (Tyler Bosmeny).
```
FIND:    Sales is a numbers game long before it's a craft.
REPLACE: As Bosmeny teaches it, sales is a numbers game long before it's a craft.
```

## Module 9

**m9l1 "Three numbers that matter: traction · product · cash"** — INSERT. Framework: MIT delta v accelerator's 3-metric model.
```
FIND:    Strip the noise: at this stage your business is three numbers.
REPLACE: MIT's delta v accelerator strips it down to this: at this stage your business is three numbers.
```

**m9l2 "Funnel & conversions: vanity vs real metrics"** — INSERT. Framework: "vanity metrics" (Eric Ries, Lean Startup).
```
FIND:    Followers, impressions, and app downloads feel great and predict nothing.
REPLACE: Eric Ries's "vanity metrics" — followers, impressions, app downloads — feel great and predict nothing.
```

**m9l3** — STUB, fixed via CONTENT_M5-M12.md text (9.3, already cites Sean Ellis). Do not edit here.

## Module 10

**m10l1 "Focus, energy, burnout"** — INSERT. Framework: "Maker's Schedule, Manager's Schedule" (Paul Graham).
```
FIND:    Maker time and manager time don't mix — batch them.
REPLACE: Paul Graham's maker-time and manager-time don't mix — batch them.
```

**m10l2 "Manage like Horowitz"** — ALREADY CITED. "Ben Horowitz's order of operations" is already in the live text. No change.

**m10l3 "Operate like Rabois"** — ALREADY CITED. "Keith Rabois' operating model" is already in the live text. No change.

## Module 11

**m11l1 "The fork: decide from data, not emotion"** — INSERT. Framework: Startup Genome research (premature scaling).
```
FIND:    Premature scaling — pouring fuel on an engine that doesn't run — is the #1 startup killer.
REPLACE: Premature scaling — pouring fuel on an engine that doesn't run — is, per Startup Genome's research across thousands of startups, the #1 startup killer.
```

**m11l2 "Types of pivot: changing course ≠ failure"** — ALREADY CITED (partial). "Ries catalogued them" names the author by surname. Optional upgrade only:
```
FIND:    Ries catalogued them: zoom-in pivot (one feature becomes the product), customer-segment pivot (same product, truer audience), channel, revenue-model, and more.
REPLACE: Eric Ries catalogued them: zoom-in pivot (one feature becomes the product), customer-segment pivot (same product, truer audience), channel, revenue-model, and more.
```

**m11l3 "Scale only what repeats"** — INSERT (optional). Framework: MIT DE beachhead → follow-on markets (Bill Aulet).
```
FIND:    and expand from your beachhead to adjacent segments, not to "everyone."
REPLACE: and expand from your beachhead to adjacent segments — Aulet's "follow-on markets" — not to "everyone."
```

## Module 12

**m12l1 "Do you even need VC?"** — SKIP. General financing menu, no single attributable source.

**m12l2 "How a round works + SAFE basics"** — INSERT. Framework: SAFE instrument (Y Combinator).
```
FIND:    The instruments: SAFEs (simple, deferred pricing), priced rounds (valuation now), and the term-sheet clauses that actually matter — dilution, pro-rata, liquidation preference.
REPLACE: The instruments: Y Combinator's SAFE (simple, deferred pricing), priced rounds (valuation now), and the term-sheet clauses that actually matter — dilution, pro-rata, liquidation preference.
```

**m12l3** — STUB, fixed via CONTENT_M5-M12.md text (12.3, already cites Sequoia deck structure). Do not edit here.

---

## Summary for the developer

| Status | Count | Action |
|---|---|---|
| INSERT | 15 | Apply exact find/replace above |
| ALREADY CITED | 3 | Verify only, no change (m10l2, m10l3, m11l2-partial) |
| SKIP | 9 | Leave as-is, no single attributable source |
| STUB | 12 | Handled separately — Prompt 1 + CONTENT_STUBS_FIX.md / CONTENT_M5-M12.md |

Total theory blocks covered: 39 (= 15+3+9+12).
