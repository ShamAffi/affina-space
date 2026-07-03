# m4l5 redesign — three editable blocks (For / Against / Conclusion)

> Supersedes the current Mode-C treatment of m4l5 ("Problem–Solution check
> against your interviews"). Fixes a real bug: today the AI case file
> (FOR/AGAINST/RECOMMENDATION) is read-only AND there's a separate mandatory
> text field she must rewrite from scratch — so the AI's analysis can't be
> applied or edited. New design: the case file IS the input, in three
> editable blocks, fillable by her, by AI, or both.

## 1. The three blocks (all editable, all persisted)

| Block | Label | What goes in it |
|---|---|---|
| **FOR** | "What my interviews CONFIRM" | Evidence that supports her M1 hypothesis |
| **AGAINST** | "What they CONTRADICT or surprised me" | Evidence that challenges / reorders it |
| **CONCLUSION** | "What I'm keeping, changing — and why" (*your call*) | Her synthesis / decision |

Two separate text areas for FOR and AGAINST (Shamil's point: splitting
them is psychologically easier than one blob). CONCLUSION is the third.

## 2. Two AI-assist buttons — explicit, never automatic

No silent regeneration on Save (that would overwrite her edits). Exactly
two AI actions, each triggered by her:

1. **"✨ Draft For & Against from my interviews"** (on the For/Against area)
   → AI reads her Brain (M1 hypothesis, interview_log, persona, market data)
   and fills/refills ONLY the For and Against blocks. Never touches Conclusion.

2. **"✨ Generate conclusion from For & Against"** (on the Conclusion block)
   → AI reads the CURRENT contents of For + Against (her text, AI's, or edited
   mix) and writes/rewrites ONLY the Conclusion. She triggers it when ready.

Both are optional. Both refill only their own block(s). Her edits to any
block are never destroyed by the other button.

## 3. The two flows Shamil described — both supported by the above

- **Flow A (she leads — DEFAULT, stronger learning):** she types For and
  Against herself → clicks "Generate conclusion" → edits the conclusion →
  **Save**.
- **Flow B (AI leads — the fast/help-me-start path):** clicks "Draft For &
  Against" → edits them → clicks "Generate conclusion" → edits it → **Save**.

Either way she ends with three blocks she has seen and can edit, and one
final **Save** that commits all three as-is. Re-editing + Save again just
updates the stored version — no AI call on Save.

## 4. What this removes

- Delete the separate mandatory "Restate your hypothesis…" input field
  entirely. The three blocks replace it — they ARE the answer.
- The old read-only case file becomes these three editable blocks (same
  FOR/AGAINST/RECOMMENDATION content, now editable, RECOMMENDATION → CONCLUSION).

## 4b. Display / read state (critical — this is half the "wall of text" bug)

When the answer is saved and shown back (the FeedbackCard "answer recap"),
render the three blocks as THREE visually separated, labeled sections —
FOR / AGAINST / CONCLUSION each with its heading — never concatenated into
one paragraph. Each section preserves line breaks (`whitespace-pre-wrap`).

**Global prerequisite (affects ALL exercises, not just m4l5):** the current
FeedbackCard answer recap (src/components/FeedbackCard.tsx, the `{answer}`
block) has NO `whitespace-pre-wrap` — every multi-line answer collapses into
a grey wall. Add `whitespace-pre-wrap` there as a standalone quick fix; it
improves readability of every exercise answer app-wide, independent of this
redesign.

## 5. Default state on first open

Blocks start EMPTY with the "✨ Draft For & Against" button visible, so she
can choose to write first (Flow A) or let AI start her off (Flow B). Do NOT
auto-generate on load — the choice is hers, and an empty page invites her
to think first.

## 6. Data model

```ts
// entryType stays 'problem_solution_check'
{
  for: string;          // was AI-only array; now her editable text
  against: string;      // same
  conclusion: string;   // was the separate mandatory field / AI 'recommendation'
  aiAssisted?: {        // provenance, for the review step
    forAgainstDrafted: boolean;   // did AI fill For/Against?
    conclusionDrafted: boolean;   // did AI draft the conclusion?
    conclusionEditedAfterDraft: boolean; // did she change it after AI wrote it?
  };
}
```

Provenance flags are for the review only (see §7) — not shown to her.

## 7. Scoring change (amends RUBRICS_M0-M4.md m4l5)

Score her FINAL three blocks, same criteria as before (problem in
customer's words · evidence-led · explicit delta · honest risk), PLUS:

- If `conclusionDrafted && !conclusionEditedAfterDraft` (she accepted the
  AI conclusion untouched): the "explicit delta / her reasoning" criterion
  cannot score in the top band — gently note it ("This reads like the draft
  I offered — tell me in your own words what YOU are changing and why").
  A blindly-accepted AI conclusion is usually generic-to-her and will
  naturally score lower on voice/specificity anyway; this just makes it
  explicit rather than accidental.
- Never penalize her for USING the AI draft — only for not engaging with it.
  A heavily-edited AI draft scores exactly like her own writing.

## 8. Delegate taxonomy note (updates RULES_DONE_FOR_YOU.md §2.4)

m4l5 is no longer strict Mode C. It becomes a **structured evidence-balance
exercise with per-block AI assist** — AI may draft any block, she owns and
edits all three, one Save commits. Update the §2.4 row for m4l5 accordingly
(was "C — analysis only, decision never pre-filled").

## 9. ⚠️ Open question — does m11l4 get the same treatment?

m11l4 (Pivot/Scale scorecard) shares the exact FOR/AGAINST/RECOMMENDATION
structure and is the OTHER Mode C block. But its "decision" is a genuine
fork — pivot vs scale vs fix — that she should own more strictly than a
problem-statement refinement.

**Recommendation:** apply the three-editable-block UI to m11l4 too (For/
Against become editable, AI can draft them), BUT keep the final decision
stricter there — the Conclusion block on m11l4 stays hers to write (AI
drafts For/Against, but NOT the pivot/scale/fix choice). This preserves
"the fork is hers" while still fixing the same read-only/rewrite friction.

Shamil to confirm: same full treatment on m11l4, or the stricter
decision-stays-hers variant above?
