# ALPHA SPRINT — final TZ (master index, 2026-07-06)

> The single work order for the remaining pre-alpha dev work. Four specs, in
> this order, plus a self-found-bugs sweep. Each spec carries its own acceptance
> checklist; this doc adds the order, the sweep rules, and the final end-to-end
> test. Everything else from the last two weeks is SHIPPED (see CLAUDE.md
> backlog) — this is what's left.

## Order of work

| # | Spec | Size | Why this order |
|---|---|---|---|
| 1 | **SPEC_MENTOR_REQUEST.md** | S | Closes the last `mailto:` stub in the PAID flow; small, ship first. Alerts → `sk@affina.space` (ADMIN_EMAIL default). |
| 2 | **SPEC_ANALYTICS.md** | L | The measurement backbone — needed BEFORE alpha users arrive (can't re-collect their funnels later). Starts with the tasks 2→1 consolidation (we are 12/12). |
| 3 | **SPEC_DOCS_LIBRARY.md** | S | Branded downloadable files at stable `/downloads/<slug>.pdf` URLs (swap file = same link) + `DOCS` registry. Guide = doc #1. Carries amendments to the phone & programs specs (§5 there). No auth/`?next` work — files are public marketing artifacts. |
| 4 | **SPEC_PHONE_CAPTURE.md** | M | Depends on analytics events (§4 taxonomy) + docs library (GUIDE_URL = in-app `/docs/…` path). Popup A stays hidden until `GUIDE_URL` is set (Shamil supplies the guide content — do NOT wait on it, the env gate handles it). |
| 5 | **SPEC_PROGRAMS_PAGE.md** | M | Catalog page (Launch Program + 4 "coming soon" specialized courses) **+ the Resources section listing DOCS** (SPEC_DOCS_LIBRARY §3). Makes the paywall's "specialized programs" promise tangible. Frontend-only. NOTE: this spec predates the current codebase state — where it references old screens/nav, adapt to what exists now (Dashboard "View all lessons" entry stands). |

## Self-found bugs & leftover tasks (explicit part of this sprint)
After (or interleaved with) the four specs, sweep and fix the issues you
yourself have discovered while building the last two weeks:
- Your own known-bugs / TODO list, silent-failure paths, rough edges you noticed
  but deferred.
- Rules: **fixes yes, unrequested features no.** Keep each fix scoped and listed
  (one line per fix in the final report: what was broken → what you did). No
  speculative refactors. Anything product-level or ambiguous (copy, UX changes,
  pricing, program content) → flag it in the report instead of inventing.
- Known items that need SHAMIL's decision — do NOT build, just leave flagged:
  m11l4 three-block treatment, AI role-plays (m3l6/m8l4/m12l4), "D + text"
  outreach buttons, per-entry Interview Log review.

## Final acceptance — full alpha journey (after all four ship)
Run end-to-end on prod (test Stripe keys), as a brand-new user:
1. Landing with `?utm_source=test` → onboarding → email capture → report → name
   → project → magic link → verify → welcome zone.
2. M0 → M1 complete → (if `GUIDE_URL` set) guide popup → phone submit → hot-lead
   email to sk@ arrives.
3. Continue to M4 → Founder's Case → paywall → dismiss → founder-call offer →
   paywall again → checkout (4242…) → webhook flips `subscribed` → S1 request
   form (topic) → admin alert to sk@ arrives → M5 opens.
4. Verify in DB/views: the user's full event trail exists, utmFirst stamped,
   `payment_succeeded` with amount in `v_utm_performance`, mentor_request row
   `new`.
5. `tsc -b` + `vite build` + prod smoke green; ≤12 functions; report delivered
   (shipped items + fix list + flagged decisions).

## On Shamil (parallel, not blocking dev)
- ✅ Guide PDF delivered — already sitting (uncommitted) at
  `public/downloads/ai-first-founders-guide.pdf` (36 pp, ~40 MB; source: "AI
  Guide by Affina Space.pdf"). Dev commits it with the docs-library work.
  Remaining for Shamil: set `GUIDE_URL=/downloads/ai-first-founders-guide.pdf`
  in Vercel. ⚠️ 40 MB is heavy for a mobile lead-magnet download — recommended:
  export a compressed version (<10 MB) from the design tool and swap it in at
  the same path (that swap is exactly the §1 replace mechanism).
- Confirm Anthropic spend cap is set (Console → Billing).
- Stripe live keys — AFTER internal testing passes (his call, §10 of SPEC_STRIPE).
- Value-stack ops: mentors availability, community, events.
