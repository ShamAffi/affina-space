# Progress sync fix — server is the single source of truth on login

> Bug (live testing): after logout → login, lesson completion state is
> inconsistent — later lessons show completed while earlier ones don't.
> Root cause: THREE compounding issues found in code:
> 1. `signIn` hydration (`App.tsx`) loads profile fields from the DB but NOT
>    `completedLessons` — checkmarks render from the localStorage cache.
> 2. The localStorage cache key (`'userData'`) is NOT per-user — switching
>    accounts on one browser leaks one user's completions into another's UI.
> 3. `toggle-complete` writes are fire-and-forget — a failed POST leaves a
>    local checkmark with no DB row (lost forever on next hydration).

## §1 — Login hydration: server REPLACES local (never merges)
- On `signIn` (and on any full app load with a valid session): fetch the
  authoritative completed-lessons list from the server (extend `/api/user` GET
  or `/api/progress` — whichever already returns it cheapest; add the field if
  absent) and **REPLACE** `userData.completedLessons` wholesale. No union with
  local state — server wins, always.
- Same for any other progress-bearing local fields that render UI state
  (verify: brain-derived flags, mentorSessions — anything checkmark-like).
  Profile-field merge (`db.x || local.x`) can stay for cosmetic fields.

## §2 — Local cache is per-account
- On `signIn(email)`: if the cached `userData.email` differs from the session
  email → **reset the store to defaults first**, then apply DB data. A browser
  switching between accounts must never show user A's state to user B.
- On `logout` and on the global 401 interceptor: clear the localStorage key
  entirely (verify this actually happens today — not just React state reset).

## §3 — Completion writes must be reliable
- `toggle-complete` (store.ts → `/api/brain`): await the POST. On failure →
  revert the local checkmark + show the existing calm error/retry affordance
  (429 keeps its "slow down" message). No silent local-only completions.
- §1 hydration also self-heals any historical local-only checkmarks: they
  disappear (server truth), which is correct — better honest than phantom.

## §4 — Test-data note (no code)
Existing test users may carry inconsistent rows from the pre-fix era. Don't
build a repair — re-test with a fresh user (or `freshStart`) after the fix.

## §5 — Acceptance
- [ ] Complete m0l1–m0l3 as user A → logout → login as A: exactly those three
      completed, nothing else. Refresh mid-session: same.
- [ ] Same browser, login as user B (different account): B sees ONLY B's
      completions (fresh user = zero), none of A's.
- [ ] Kill the network (devtools offline) → toggle a lesson complete → checkmark
      reverts + calm error; back online → toggle works and survives relogin.
- [ ] Logout clears the localStorage key (inspect Application tab).
- [ ] `tsc -b` + `vite build` pass; prod smoke green.
