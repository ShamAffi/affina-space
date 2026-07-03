# Interview Log — "Add Transcript" (AI-assisted fill)

> Amendment to Interview Log field-task UI (m3l7, m5l7, m11l6 — everywhere
> the 5-field interview entry card is used). Adds a second way to log an
> interview: paste raw notes/transcript, AI distributes them into the 5
> fields, low-confidence fields are flagged (not blocked).

## 1. Placement & entry point

New button **"📄 Add Transcript"** — bottom-left of the entry card, same
row as Cancel/Add interview (which stay bottom-right, unchanged). Row
becomes: `[Add Transcript]` ······ `[Cancel] [Add interview]`.

## 2. Flow

1. Click "Add Transcript" → the 5 individual fields collapse (or grey out)
   and a single large textarea appears in their place: **"Paste your notes
   or transcript — as messy as it actually is."** Placeholder: *"e.g. raw
   notes from the call, a copy-pasted chat transcript, voice-memo notes…"*
2. Below it: **"✨ Fill in fields with AI"** button.
3. On click → AI parses the pasted text and populates all 5 fields
   (Who / Main pain / Key quotes / Price signal / Verdict), each rendered
   back in its normal input box, fully editable.
4. Any field the AI could not confidently extract gets an **amber/orange
   left-border + a small "AI wasn't sure — check this" note** under it.
   Amber fields are **never a submit-blocker** (see §4).
5. She can freely edit any field (AI-filled or amber) before adding the
   interview, exactly as if she'd typed it manually. "Add Transcript" is
   reversible — a "← back to manual fields" link stays available.

## 3. Data model

```ts
type InterviewLogEntry = {
  who: string;
  mainPain: string;
  keyQuotes: string;
  priceSignal: string;
  verdict: string;
  rawTranscript?: string;         // NEW — the pasted source, kept for provenance
  aiExtracted?: {                 // NEW — only present if filled via transcript
    fields: string[];             // which field names AI populated
    lowConfidence: string[];      // which of those are flagged amber
  };
};
```

`rawTranscript` is stored alongside the parsed fields (not discarded) —
it lets the AI mentor's later review cross-check quotes against the real
source, and protects the fabrication-protocol check in RUBRICS_M0-M4.md
(§0: "if submitted data looks invented... ask ONE probing question") —
having the source transcript makes that check sharper, not weaker.

## 4. Validation change — manual vs. transcript path

- **Manual entry (current behavior, unchanged):** Who, Main pain, and
  Verdict stay hard-required — "Who, pain, and verdict are required."
  She's typing this herself; there's no reason to allow her to skip it.
- **Transcript path (new):** no field blocks submission, regardless of
  confidence. If AI genuinely can't find a Who, Main pain, or Verdict
  anywhere in the pasted text, those fields render **empty and amber**,
  not blocked — she can add the interview anyway and fill gaps later,
  or leave them for the AI review to flag.

**Rationale:** the whole point of Add Transcript is removing friction —
a hard gate here would recreate the exact friction the manual form has,
just one step later. The review step (already in RUBRICS_M0-M4.md) is
where thin/missing data gets addressed with feedback, not with a blocked
submit button.

## 5. Extraction prompt logic (for dev)

```
You are extracting structured fields from a founder's raw interview notes
or transcript. Do not invent anything not present in the text.

Extract, if present:
- who: name/role/segment of the interviewee
- mainPain: their main pain + how they currently solve it
- keyQuotes: their most telling verbatim words (prefer exact phrasing over paraphrase)
- priceSignal: anything about money — what they pay today, reaction to price
- verdict: only if SHE explicitly stated a conclusion in the notes (confirms/
  contradicts her hypothesis) — do not infer a verdict she didn't state;
  leave it for her to write if it's not clearly there.

For each field, mark confidence: "found" (clearly stated) or "unclear"
(inferred/thin/absent). Never fabricate to avoid an "unclear" flag —
an honest gap is better than an invented answer.
```

## 6. Note on Delegate taxonomy (RULES_DONE_FOR_YOU.md)

This is **not** a Delegate mode (A/B/C/D) — those apply to AI drafting an
*answer* on her behalf for written exercises. Here, AI is only
**restructuring her own real data** into the existing fields — it never
invents an interview, a quote, or a verdict that isn't in the pasted
source. Keep this distinction explicit in code comments so it isn't
confused with the Delegate button elsewhere.

## 7. Scope

Applies everywhere the Interview Log component is used: m3l7 (1–2 warm
interviews), m5l7 (5–10 WTP interviews), m11l6 (verification sprint,
pivot branch). Same component, same button, same logic — no per-module
variation needed.
