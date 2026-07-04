# M0 Intake redesign — split onboarding-review from new-info quiz

> Amendment to SPEC_PROGRAM_V2.md §6.1. Replaces the current single-textarea
> "Deep intake" screen (m0l3) with 3 distinct steps. Root cause fixed: mixing
> prefilled onboarding answers with brand-new questions in one scrollable
> field is bad UX (confirmed via live screenshots — text visually runs
> together, no way to tell "already known" from "still needs an answer").

## New M0 flow (block count unchanged: still 5 program-visible blocks)

| Step | id | Title | What changed |
|---|---|---|---|
| 0.1 | m0l1 | How Affina works | unchanged |
| 0.2 | m0l2 | Being a founder in the AI era | unchanged |
| **0.3** | **m0l3** | **Your Project Today** | **REDESIGNED** — was "Deep intake" (one blob), now: review/edit onboarding answers as separate fields + optional links, no new questions here |
| **0.4** | **m0l4** | **A few quick questions** | **REDESIGNED** — was "Import what you have" (links only), now: Typeform-style 5-question mini-quiz. Links functionality moves into 0.3 |
| 0.5 | m0l5 | Startup Snapshot | **AMENDED** — add explicit Approve CTA (see §3) |

---

## §1 — Step 3 "Your Project Today" (m0l3)

**Purpose:** let her review and correct what onboarding already captured — nothing new asked here. Two sections.

### Section A — "What we already know" (editable, prefilled)
Five separate small fields, NOT one textarea — each maps 1:1 to a `users` column:

| Field | Type | Prefill source | Label |
|---|---|---|---|
| `idea` | textarea, short | `users.idea` | "What you're building" |
| `customer` | text | `users.customer` | "Who it's for" |
| `businessModel` | text | `users.businessModel` | "How it makes money" |
| `stage` | select (same options as onboarding) | `users.stage` | "Stage today" |
| `goal` | select (same options as onboarding) | `users.goal` | "Big goal" |

Each field is independently editable inline (small input/select, not a shared blob). Edits here **write back** to the `users` columns (this is the source of truth going forward, not a copy).

### Section B — "Anything live already?" (optional, collapsed by default)
Folds in the current m0l4 "Import what you have" functionality as an optional expandable sub-section under a "+ Add links" toggle — up to 5 links, one per line, with an optional one-word note each. Same behavior as current m0l4 (saved as `imported_assets` brain entry).

**CTA:** single button at the bottom — **"Continue to a few quick questions →"** — advances to Step 4. No AI review/scoring on this step (it's data correction, not an exercise).

---

## §2 — Step 4 "A few quick questions" (m0l4) — Typeform-style mini-quiz

**Mechanic:** one question per screen, large centered type, progress dots (1–5) at top, **back arrow** (returns to previous question, answer preserved and editable), forward via button or Enter. Counts as **ONE lesson/block** for program tracking (completedLessons, progress %) — internally it's a 5-step component, not 5 separate lessons.

**Validation:** soft, not hard-gated (consistent with M0's welcoming tone). Q3 (chip-select) requires a selection to advance. All free-text questions (Q1, Q2, Q4, Q5) show a gentle one-time nudge if left empty ("This one really helps your mentor understand you — sure you want to skip it?") but never hard-block.

### The 5 questions

**Q1 — "What have you done so far?"**
Open text (free-form, generous textarea). Subtitle under the question: *"Write it all down — even the small stuff. And if anything's live (a site, an Instagram, a doc, a prototype), drop the links right here."*
Placeholder: *"e.g. Talked to 5 people about this, built a rough landing page (link below), got 3 people to say they'd try it…"*
→ maps to `doneSoFar: string` (single free-text field, replaces the earlier chip+detail design)
Note for dev: if she pastes a URL inline here, also extract it into the `imported_assets` brain entry alongside whatever she added in Step 3's "+ Add links" — don't lose the signal just because it landed in the wrong box.

**Q2 — "Where do you feel stuck or unsure right now?"**
Free text, generous textarea. Placeholder: *"e.g. I don't know if people would actually pay, I can't pick between two ideas, I launched but nobody came…"*
→ `stuckPoint: string`

**Q3 — "How many hours a week can you realistically give this?"**
Single-select buttons: `Under 5` · `5–10` · `10–20` · `20+ (full focus)`
→ `capacity: 'under5' | '5to10' | '10to20' | '20plus'`

**Q4 — "Why does this matter to you — really?"**
Free text. Placeholder: *"Not the elevator pitch — the real reason. What happens if you don't do this?"*
→ `whyMe: string`

**Q5 — "What would make the next 12 weeks feel like a win?"**
Free text. Placeholder: *"e.g. I have a paying customer. I know this idea is right. I've launched, even if small."*
→ `goal12w: string`

**Q6 — "What's your 3-year business goal?"** (added)
Free text, with a subtitle giving example shapes: *"A rough number and shape is enough — a steady income of $X/month, raising $Y M in investment, or selling the business for $Z M. Any numbers and plans — it tells us the scale of your ambition, and we use it when we show you your potential."*
Placeholder: *"e.g. steady $8k/month that supports my family · raise $2M and grow fast · build it to sell for $20M · not sure yet, but big"*
→ `goal3y: string` — the PRIMARY ambition signal for the Founder's Case (m4l10) potential calibration.

**Design rationale for this exact set:** Q1+Q2 read the startup's real state (what exists, where it's stuck — the second one directly targets our "stuck at some stage" ICP signal). Q3–Q5 read the founder (real capacity → paces the whole program per delegation/ritm principles already in SPEC §10; Q4 is the raw emotional edge, feeding into the formal "Why You" exercise later in M1; Q5 is an early, sharper version of her 12-week goal — cross-checked later against the real North Star in M5). No question re-asks anything Step 3 already covers.

**On completing Q5:** brief transition ("Generating your Snapshot…") → Step 5.

---

## §3 — Step 5 "Startup Snapshot" (m0l5) — amendment

Generation logic unchanged (now pulls from Step-3 edited fields + Step-4 answers + any imported links). **New requirement:** add an explicit approval action, not just a passive "Start Module 1" button.

- Primary CTA: **"This looks right — let's start Module 1 →"**
- Secondary line under it (matches existing read-only/check-in-update design already locked in SPEC_PROGRAM_V2.md §10): *"Something looks off? Tell us in your weekly check-in — your Snapshot updates itself."*

No edit mode on the Snapshot itself — approval is acknowledgment, not editing (consistent with the earlier decision that Snapshot stays read-only).

---

## §4 — Data model changes

- `submissionData`/`lessonInputs` for m0l4 (the quiz) stores one JSON object with the named fields above (`doneSoFar`, `stuckPoint`, `capacity`, `whyMe`, `goal12w`, `goal3y` — all plain strings except `capacity`, which is the enum) — one brain entry, `entryType: 'founder_intake'` (already exists in BRAIN_ENTRY_TYPES).
- m0l3 edits write directly to `users.idea/customer/businessModel/stage/goal` (same columns onboarding already populates) — no separate brain entry needed for Section A; Section B (links) keeps existing `imported_assets` entry type.
- No schema migration needed — same columns/entry types as before, just redistributed across screens.

---

**Status: approved by Shamil, ready for dev.** Q1 reworded to open text (was chip-select), Q5 reworded to a warmer, friend-to-friend phrasing. No further changes pending.
