# Model strategy — centralize, upgrade, cache (API cost + quality audit)

> Audit + refactor of how the app calls Claude. Goal: one source of truth for
> model choice, a free quality bump, prompt caching on the big repeated
> prefixes (rubrics/system prompts), and usage logging so we can price the
> subscription on real cost. NOT a rewrite; the app is already sanely on
> Sonnet, this tightens it.

## ⚠️ Platform constraints (from CLAUDE.md — do not violate)
- **Vercel Hobby caps at 12 serverless functions, and EVERY `.ts` under `/api`
  counts (incl. `api/lib`).** New shared helpers therefore go in **`src/server/`**
  (where `http.ts`/`ratelimit.ts` already live), NEVER in `api/`. Do not add
  any file under `api/`.
- `maxDuration: 60` (must finish ~50s). Setting `thinking: disabled` on the
  short calls keeps us well inside it.
- Verify with `tsc -b` + `vite build` + live curl against prod (browser preview
  tooling doesn't work here). Deploy per the CLAUDE.md flow.

## 0. Current state (audited — for context, don't re-discover)

- **8 endpoints call Claude**, ~15 call sites total.
- Every text call is hardcoded `model: 'claude-sonnet-4-6'` **inline in each
  file** (15+ copies). One exception: `api/ai.ts` name-generation mode
  (`:250`) uses `claude-haiku-4-5-20251001` — **this moves to Sonnet 5**
  (Haiku produces weak/generic names; see §2a).
- Every file does its own `new Anthropic({ apiKey: ... })`.
- **No `cache_control` anywhere.** Every call re-sends its full system prompt
  (rubric / instructions) at full input price on every request.

Call sites (file : line : max_tokens):
- `api/score.ts:93` (900) — score exercise answer vs rubric
- `api/ai.ts:143` (1200), `:195` (900), `:225` (600), `:300` (900/1400 delegate),
  `:375` (1024), `:412` (1024) — feedback / delegate drafts
- `api/ai.ts:250` (24) — **Haiku** name gen (leave as-is)
- `api/brain.ts:144` (1800), `:280` (1100), `:365` (2800) — brain synth / snapshot
- `api/tasks/index.ts:122` (500) — task generation
- `api/tasks/submit.ts:103` (800) — task feedback
- `api/pulse/draft.ts:246` (2500) — check-in draft
- `api/northstar/index.ts:138` (800), `:184` (400) — North Star

## 1. Single source of truth for models (do this first)

Create **`src/server/models.ts`** (NOT `api/lib/` — 12-function cap):

```ts
// One place to change models app-wide. Tier by task, not by file.
export const MODELS = {
  // Default for all bounded Q&A: scoring, feedback, drafts, synthesis,
  // AND name generation (quality matters — Haiku names were too generic).
  standard: 'claude-sonnet-5',
  // Trivial/deterministic tasks. Currently UNUSED (name gen moved to
  // standard). Kept defined for future tiny classifications.
  cheap: 'claude-haiku-4-5',
  // Reserve for flagship generation where depth clearly matters
  // (see §3). Use sparingly — 5× the input cost of standard.
  deep: 'claude-opus-4-8',
} as const;
```

- Replace every inline `model: 'claude-sonnet-4-6'` with `model: MODELS.standard`.
- Replace the Haiku name-gen string (`api/ai.ts:250`) **also with
  `model: MODELS.standard`** — name generation now runs on Sonnet 5.
- Import from `../src/server/models` (mirror how the handlers already import
  `http`/`ratelimit` from `src/server/`).
- Acceptance: `grep -rn "claude-" api/` returns **zero** matches — every model
  string now lives only in `src/server/models.ts`.

## 2. Upgrade Sonnet 4.6 → Sonnet 5 (free quality bump + cheaper for now)

- `MODELS.standard = 'claude-sonnet-5'` (done in §1).
- Why: Sonnet 5 is near-Opus quality on reasoning at the **same** list price
  as 4.6 ($3 in / $15 out per 1M), and is on **intro pricing $2 in / $10 out
  through 2026-08-31** — i.e. temporarily cheaper than what we pay now.
- ⚠️ **Sonnet 5 is a breaking-API upgrade — check each call:**
  - `temperature` / `top_p` / `top_k`: if any call sets a non-default value,
    **remove it** (Sonnet 5 rejects non-default sampling params with a 400).
  - Any assistant-message prefill (last message `role: 'assistant'`): **remove
    it** — 400 on Sonnet 5. Use a system-prompt instruction or structured
    output instead.
  - Adaptive thinking is **on by default** when `thinking` is omitted. Our
    calls are short bounded generations — set `thinking: { type: 'disabled' }`
    explicitly on the standard-tier calls to keep latency/cost as-is (we don't
    need chain-of-thought for scoring/feedback). Confirm `max_tokens` still
    covers the output either way.
  - New tokenizer (~same as before for our text) — no action, just don't be
    surprised if `usage` token counts shift slightly.
- Acceptance: every standard-tier call runs on Sonnet 5, build passes, and a
  manual smoke test of score / feedback / snapshot returns sane output (no 400s).

## 2a. Name generation → Sonnet 5 (⚠️ special case, don't skip)

The name-gen call (`api/ai.ts:250`) moves off Haiku onto Sonnet 5 for better
names. But that call has `max_tokens: 24` — and **Sonnet 5 runs adaptive
thinking by default, which would consume those 24 tokens and return an empty
name.** So this call MUST:
- set `thinking: { type: 'disabled' }` explicitly, and
- keep `max_tokens` small but give the name room — bump `24 → 32`.
- Everything else (the system prompt / naming rules) stays as-is.
- Acceptance: generate a project name end-to-end — a real, non-empty,
  on-topic name comes back (not blank, not truncated).

## 3. Model tiering — produce the map, don't guess

Deliverable: a short table (in this file or a PR comment) — **one row per call
site** — with columns: `file:line · what it does · max_tokens · chosen tier ·
why`. Default everything to `standard`. Only propose `deep` (Opus 4.8) where
the output is **user-facing, flagship, and low-frequency**, e.g.:
- `api/brain.ts:365` (2800 tok) — if this is the Snapshot / Founder's Case
  generation (the big emotional reveals), Opus may be worth it: it runs a
  handful of times per user, not per action, and quality is visible.
- Everything high-frequency (scoring, per-answer feedback, task gen) stays on
  `standard` — that's where volume lives, so cost matters and Sonnet 5 is
  plenty.
Name gen is now `standard` (§2a), not `cheap` — the `cheap`/Haiku tier is
currently unused. **Do not put Opus/Fable on any per-answer or per-task path.** Rule of thumb:
dear model only where it runs O(once per user), never O(once per action).

## 4. Prompt caching on the big stable prefixes (the actual cost saver)

Cache reads cost ~0.1× of input. Our scoring/feedback calls re-send a large,
byte-identical rubric/system prompt every time — prime caching target.

For each **standard-tier** call whose system prompt is large and stable across
requests (rubrics in `score.ts`, delegate/feedback instructions in `ai.ts`,
synthesis instructions in `brain.ts`):
- Move the stable instruction/rubric into a `system` **array block** with
  `cache_control: { type: 'ephemeral' }` on the last stable block.
- Keep the **volatile** part (the student's actual answer, their Brain data,
  per-request IDs) AFTER the cached block / in the `messages`, never
  interpolated into the cached prefix.
- Minimum cacheable prefix for Sonnet 5 is ~2048 tokens — short prompts won't
  cache (that's fine, skip them).
- Verify it works: log `usage.cache_read_input_tokens` on the 2nd identical
  request; if it's 0, a silent invalidator is in the prefix (a timestamp,
  unsorted JSON, or the per-user data leaked above the breakpoint) — fix by
  moving the volatile bit below the breakpoint.
- ⚠️ Do **not** put anything user-specific (name, email, answer) above the
  cache breakpoint, or every user gets a distinct prefix and nothing caches.

## 5. Shared client + call helper (do it — this is where logging hangs)

Add **`src/server/anthropic.ts`** (NOT `api/lib/`) exporting:
- a single configured `Anthropic` client (import in all 8 endpoints instead of
  `new Anthropic({...})` in each), and
- a thin `callClaude(params, meta)` wrapper that every endpoint routes through.
  The wrapper does the `messages.create`, then logs usage (§5b) before
  returning. This gives us one choke point for logging, retries, and future
  model-routing without touching call sites again.

## 5b. Usage logging (turn the cost estimate into a real number)

Right now we have an *estimate* of ~$2–2.5 API per student over the full
program. We need the real figure to price the subscription. In `callClaude`,
after each response, log one structured line:

```
{ ts, endpoint, mode, model,
  input_tokens, output_tokens,
  cache_creation_input_tokens, cache_read_input_tokens,
  email }        // email only if already in scope; omit otherwise
```

- `meta` (endpoint + mode) is passed in by the caller so we can attribute cost
  per feature (scoring vs snapshot vs pulse…).
- Simplest sink that fits the platform: `console.log(JSON.stringify(...))` —
  Vercel captures it, and we can read it back from the function logs. (A DB
  table is nicer long-term but not required for a first read; don't add a
  serverless function for it.)
- Cost math lives OUTSIDE the code (a spreadsheet from the logs) — do not
  hardcode prices in the app; they change.
- Acceptance: after a manual walk through a few lessons, the logs show one
  usage line per Claude call with real token counts, tagged by endpoint/mode.
  Shamil can then compute true cost-per-student from a week of real traffic.

## 6. Out of scope
- No multi-model orchestration / "software factory" pattern — that's for
  building apps, not for our runtime. Our runtime is bounded single-calls.
- No Fable anywhere in the runtime. If any deep task needs more than Sonnet 5,
  Opus 4.8 is the ceiling.

## 7. Order of work (priority)
1. **§1 models config + §5 shared client/wrapper** — foundation; everything
   else hangs off it. Low risk.
2. **§2 + §2a Sonnet 5 upgrade** (incl. name-gen fix) — the quality/cost win.
   Test for 400s.
3. **§5b usage logging** — cheap, unblocks real pricing. Do it early so a week
   of traffic accrues.
4. **§4 prompt caching** — the recurring cost saver. Verify cache reads > 0.
5. **§3 model map** — deliver as PR comment; only then consider `deep` tier for
   the 1–2 flagship generations.
Ship 1–3 together (they're one refactor); 4 and 5 can follow.

## 8. Acceptance checklist
- [ ] `grep -rn "claude-" api/` → **zero** matches (all strings in
      `src/server/models.ts`).
- [ ] No new file added under `api/` (12-function cap intact); helpers in
      `src/server/`.
- [ ] All standard calls on `claude-sonnet-5`; no `temperature`/prefill 400s.
- [ ] Name gen on Sonnet 5 with `thinking: disabled` + `max_tokens: 32` →
      returns a real non-empty name (§2a).
- [ ] Every Claude call routes through `callClaude` and emits one usage log
      line tagged by endpoint/mode (§5b).
- [ ] `cache_control` added to the large stable prefixes; a repeated request
      shows non-zero `cache_read_input_tokens`.
- [ ] Model-tier map delivered (one row per call site, §3).
- [ ] `tsc -b` + `vite build` pass; prod smoke (homepage 200, `/api/progress`
      returns JSON) green after deploy.
- [ ] Manual smoke test: score an answer, get feedback, generate a snapshot,
      generate a name — all return sane output.
