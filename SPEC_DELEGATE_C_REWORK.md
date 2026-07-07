# Delegate Mode C rework — "Mentor's read → your call"

> Full rework of the Mode-C decision aid (seen live on m5l3 "Your business
> model"): not just the prompt text, but the FORMAT and MECHANIC. The old
> version is a read-only two-column FOR/AGAINST wall of paragraphs, in third
> person, with a hedging recommendation buried at the bottom and a disconnected
> empty answer field. Replace with a compact, second-person "mentor's read"
> (verdict + reason + gap), full for/against collapsed behind a toggle, and an
> answer field connected right below with a soft scaffold. Concept (AI analyzes,
> she decides) stays; execution + mechanic change.

## The 6 problems (from the live screenshot)
1. Wall of text — paragraph-length bullets.
2. Two dense columns, unreadable (esp. vertical).
3. Recommendation hedges ("if she wants X… if she wants Y") — no clear lean.
4. Third person — "her evidence", "she wants", "the founder".
5. Meta-instruction leaked into the output ("This is a recommendation for her
   decision, not the decision itself:").
6. **Mechanic:** read-only analysis + a SEPARATE blank field → passive, and the
   AI's work doesn't flow into her answer (same disease as the old m4l5).

## Root cause (`api/ai.ts`)
`DELEGATE_SYSTEM` Mode-C is third-person ("from her own data", "recommendation
for HER decision" → the model prints that meta-label), `max_tokens: 1400`, and
`DelegateAnalysisSchema` allows 6 unbounded strings per side. The UI renders it
as two paragraph columns + a disconnected field.

---

## The new mechanic — "Mentor's read → your call"
```
┌─ 🧠 Mentor's read ───────────────────────────────┐
│ VERDICT  Your evidence points to TRANSACTION      │ ← 1 line, 2nd person
│          (wholesale to cafés & bars).             │
│ WHY      Your interviews validated a bar/club     │ ← 1 line
│          buying moment, not a home subscription.  │
│ THE GAP  To defend subscription instead, you'd    │ ← 1 line
│          first need a few "Sarah"-type interviews.│
│                                                    │
│ ▸ See the full for / against        (collapsed)   │ ← optional depth, hidden
└──────────────────────────────────────────────────┘
      This is analysis, not your decision.            ← ONE small caption

Now your call ↓
┌──────────────────────────────────────────────────┐
│ My model is [subscription / transaction /         │ ← her field, soft scaffold
│ freemium / other] because…                         │   (placeholder, NOT prefilled)
└──────────────────────────────────────────────────┘
```
- The verdict/reason/gap ARE the content — 3 tight lines, decisive, in second
  person. No two-column debate up front.
- Full FOR/AGAINST lives behind "See the full for / against", collapsed by
  default — available for depth, never a wall.
- Her answer field sits directly below with a soft structural scaffold
  (placeholder only — the AI NEVER fills her decision; Mode C intact).

---

## §1 — Prompt rewrite (Mode C section of `DELEGATE_SYSTEM`)
Replace the MODE C block with:
```
MODE C (analysis only): you NEVER write her decision — you give her a fast read
to decide from. Speak in SECOND PERSON, directly to the founder ("you", "your
interviews"). NEVER third person — no "she", "her", "the founder". Build every
point from her Brain; no fabrication (if the Brain lacks material, ask ONE
question instead).
Respond ONLY with valid JSON:
{ "analysis": {
  "verdict": "ONE line: the lean, decisive. 'Your evidence points to <X>.' Name a concrete choice — never 'it depends'.",
  "reason":  "ONE line: the single strongest reason from her Brain.",
  "gap":     "ONE line: the one thing that would let her defend the other option — 'To defend <Y> instead, you'd first need <Z>.'",
  "for":     ["≤3 points, ONE line each (≤ 15 words), each anchored to a real Brain fact"],
  "against": ["≤3 points, ONE line each (≤ 15 words), same rule"]
} }
No paragraphs. No disclaimers, no meta-labels, no 'this is a recommendation'
preamble in any field — the UI shows the 'analysis, not your decision' note.
```
Key changes: second person · decisive one-line verdict · reason + gap replace the
buried hedge · for/against become tight one-liners (the collapsed detail).

## §2 — Schema change (`DelegateAnalysisSchema`)
```
analysis: {
  verdict: string,
  reason: string,
  gap: string,
  for:     string[].min(1).max(3),
  against: string[].min(1).max(3),
}
```
(The old `recommendation: string` is replaced by `verdict`+`reason`+`gap`.)
Keep the no-fabrication → `{ question }` path unchanged (Brain lacks material).

## §3 — Mode-C `max_tokens`
1400 → **600** (the output is now 3 lines + ≤6 short bullets).

## §4 — UI rendering (the case-file component)
- **Top card = the read:** VERDICT / WHY / THE GAP as three labelled one-liners
  (small grey label + the line). Decisive, scannable, violet accent on the verdict.
- **Collapsed detail:** a "See the full for / against" toggle → reveals FOR
  (green) / AGAINST (amber) as tight one-line bullet lists. Collapsed by default.
  On narrow/vertical, stacked single column (never two dense paragraph columns).
- **ONE caption** under the read: *"This is analysis, not your decision."* — UI
  chrome, exactly once. Remove any equivalent sentence from AI output.
- **Connected field:** a "Now your call" heading + the answer box directly below,
  with a soft scaffold placeholder (e.g. *"My model is … because …"*). The field
  is NEVER prefilled by AI.

## §5 — Alternative mechanic (documented, NOT built now)
"Pick then defend": chips (subscription / transaction / freemium / other) → she
taps her choice → AI gives a short read FOR that pick + the one gap → she writes.
More active; "AI never decides" preserved (she picks). Keep on file — build the
"Mentor's read" mechanic above first; revisit chips if the read still feels passive.

## §6 — Scope
Applies to EVERY Mode-C exercise (RULES_DONE_FOR_YOU §2.4 delegate map) — the fix
is in the shared prompt + component. Mode A (single draft) and Mode B (variants)
unchanged.

## §7 — Acceptance
- [ ] Output is second person — no "she/her/the founder" anywhere.
- [ ] Read = VERDICT/WHY/THE GAP, one line each, decisive (verdict names a
      concrete choice, not "it depends").
- [ ] Full FOR/AGAINST collapsed by default; ≤3 one-line bullets each when opened;
      scannable stacked on a narrow viewport (no two-column paragraph wall).
- [ ] No disclaimer/meta text inside AI output; the "analysis, not your decision"
      note appears once as UI caption.
- [ ] Answer field sits directly under the read with a "Now your call" heading and
      a soft scaffold placeholder; AI never prefills it.
- [ ] Re-run on m5l3 with a real Brain: output is tight, second person, decisive,
      and the field flows from the read.
- [ ] `tsc -b` + `vite build` pass.
