# "Your Startup Brain" — canonical naming + tagline pass (copy-only)

> Decision (Shamil): the compounding-context feature is officially
> **Your Startup Brain** — "все инсайты и факты в одном месте для принятия
> решений". This spec unifies the name across the product and surfaces the
> positioning EARLIER (onboarding/report/emails), where it currently doesn't
> exist. Copy-only pass — no logic, no schema, no renames in code identifiers
> (`brainEntries`, `/api/brain` etc. stay as-is).

## §1 — Canonical naming rules
- **Full name (first mention on a surface / headers):** `Your Startup Brain`
- **Short form (flowing copy, repeat mentions):** `your Brain` (already the
  dominant in-lesson usage — keep).
- **Kill:** `Company Brain` (inconsistent), and never use "second brain" /
  "AI co-founder" phrasing anywhere.
- **Tagline (canonical EN):**
  **"Every insight and fact about your startup — in one place, working for
  your decisions."**
  (Approved alternates, if a surface needs shorter: "All your insights and
  facts in one place — built for decisions." · "Everything you learn becomes
  a decision-ready system.")

## §2 — Fixes (existing surfaces)
- `DocumentsPanel.tsx:81` — "Your Company Brain" → **"Your Startup Brain"**;
  add the tagline as the small subtitle under it.
- `DocumentsPanel.tsx:139` (empty state) — "…to build your Company Brain" →
  "…to build your Startup Brain".
- `data.ts` m0l1 (How Affina works) — the explainer line names it fully once:
  "==Everything you do feeds your Startup Brain== — a living memory of your
  startup…" (rest of the paragraph unchanged; later "your Brain" mentions in
  lessons stay short-form).
- LMS loaders ("Reading your Brain…", "Mentor is analyzing your Brain…") —
  unchanged (correct short form).

## §3 — NEW surfaces (start selling the concept before the paywall)
1. **Report / RevealTeaser (+ /report page):** one line above/near the CTA:
   *"From here, every step builds **Your Startup Brain** — every insight and
   fact in one place, working for your decisions."* (Coordinate with
   SPEC_REPORT_V2 if it lands together — same component.)
2. **Welcome email (#2, `email.ts`):** extend the middle line: "…you've got AI
   guidance, live mentors, and a community — and everything you do builds
   **your Startup Brain**: every insight in one place, working for your
   decisions."
3. **Paywall value stack (`Paywall.tsx`):** add ONE small line under the recap
   (not a new stack item): *"And everything you've built lives in your Startup
   Brain — it keeps working for you through all 12 modules."*

## §4 — Acceptance
- [ ] `grep -rn "Company Brain" src/` → 0 matches.
- [ ] DocumentsPanel header = "Your Startup Brain" + tagline subtitle.
- [ ] m0l1 names it fully once; short form elsewhere intact.
- [ ] Report CTA area, welcome email, and paywall carry the § 3 lines.
- [ ] No "second brain" / "AI co-founder" anywhere (`grep -rin "second brain\|co-founder" src/` → 0 user-facing).
- [ ] `tsc -b` + `vite build` pass.
