# Auth Phase B — session enforcement (security: retire email-in-query)

> Closes the core security hole: identity is currently taken from a
> client-supplied `?email=` param, which every user-data endpoint trusts. Anyone
> can read/write another user's data by passing their email. This spec wires the
> already-issued session cookie into every endpoint so identity is derived from a
> server-signed cookie the client cannot forge, and removes email-as-identity.
> Depends on Auth Phase A (shipped: `src/server/session.ts` issues/reads a signed
> httpOnly cookie on magic-link verify). Coordinate with SPEC_ONBOARDING_FUNNEL
> (the pre-auth surface — §7).

## Current state (audited — the vulnerability)
- `session.ts` exists (`issueSession`/`readSession`/`clearSession`, HMAC-signed
  httpOnly+Secure+SameSite cookie) but **`readSession` is used by ZERO
  endpoints.**
- Every user-data endpoint reads identity from `req.query.email` / `req.body.email`
  and trusts it: `api/user.ts`, `api/progress.ts`, `api/brain.ts`,
  `api/tasks/index.ts`, `api/tasks/submit.ts`, `api/pulse.ts`,
  `api/northstar/index.ts`, `api/score.ts`, `api/ai.ts`.
- Result: `GET /api/brain?email=someone@else.com` returns that person's private
  data. Read AND write. This is a GDPR/privacy + security must-fix.

## Platform constraints (CLAUDE.md — do not violate)
- 12-function cap (currently 11/12); new helpers go in `src/server/`, not `api/`.
- Verify with `tsc -b` + `vite build` + live curl on prod. Deploy per CLAUDE.md.
- Migrations (if any) via node script; update `schema.ts` same change.

---

## §1 — The auth guard (`src/server/requireAuth.ts`)

```ts
import { readSession } from './session';
// Returns the authenticated email from the signed cookie, or null after
// sending 401. Identity comes ONLY from the cookie — never from req params.
export function requireAuth(req, res): string | null {
  const email = readSession(req);
  if (!email) { res.status(401).json({ error: 'unauthorized' }); return null; }
  return email;
}
```

---

## §2 — Apply the guard to every authed endpoint

In each endpoint below, replace `const email = req.query.email` /
`req.body.email` with:
```ts
const email = requireAuth(req, res);
if (!email) return;
```
The client-supplied email param is then **ignored entirely** — the session is
the sole source of identity.

| Endpoint | Methods | Notes |
|---|---|---|
| `api/user.ts` | GET, PATCH | Profile read/edit → session email. **POST create path = pre-auth onboarding — see §7.** |
| `api/progress.ts` | GET, POST | session email |
| `api/brain.ts` | GET, POST | snapshot / market-research / entries → session email |
| `api/tasks/index.ts` | GET, POST | session email |
| `api/tasks/submit.ts` | POST | session email + ownership check (§4) on the task |
| `api/pulse.ts` | GET, POST | draft/commit → session email |
| `api/northstar/index.ts` | POST | suggest/commit → session email |
| `api/score.ts` | POST | session email |
| `api/ai.ts` | POST | all modes → session email (feedback/delegate operate on her data) |

**NOT guarded (pre-auth or non-user — §7):** `api/auth.ts`, `api/cron.ts`, and
the pre-auth onboarding write path.

---

## §3 — Retire email-in-query (frontend + backend)
- **Frontend:** remove `?email=…` from all API calls (`src/store.ts`,
  `src/App.tsx`, screens, panels). The browser sends the httpOnly cookie
  automatically; add `credentials: 'include'` on fetches if/when needed
  (same-origin includes it by default — we're same-origin today).
- **Backend:** after §2, no authed handler reads an email from query/body for
  identity. Leave no `req.query.email`/`req.body.email` identity reads in the
  guarded endpoints (`grep` them to confirm none remain).

---

## §4 — Ownership checks on nested entities
Session tells you WHO she is; it does not authorize arbitrary object ids. Any
endpoint that accepts a `taskId` / `lessonId` / entry id / etc. must verify that
row belongs to the session user (`row.userId === sessionUser.id`) before
read/write. Reject with 403 otherwise. **Rule: never trust an id or email from
the request — always scope to the session user.** (`tasks/submit`, `brain`
entry ops, anything id-addressed.)

---

## §5 — Frontend: cookie session + 401 handling
- After magic-link verify (`/auth/verify`), the cookie is set (Phase A). All
  subsequent calls are authenticated by the cookie — nothing to pass manually.
- On any **401** from an API call → treat as logged-out: clear local user state
  and redirect to `/login`.
- Wire a **logout** action calling `clearSession` (helper exists) → clears cookie
  → `/login`.
- Session lasts 30 days (cookie Max-Age); expiry surfaces as 401 → /login.

---

## §6 — Rate limiter keys on the session
`src/server/ratelimit.ts` currently keys on the request email. After
enforcement, key the email dimension on the **session** email (IP dimension
unchanged). Pre-auth surfaces (§7) keep IP-based limiting.

---

## §7 — Pre-auth surface (must NOT require a session) — precise boundary
Some actions legitimately happen before a session exists. These stay
unauthenticated, but are constrained:

1. **`api/auth.ts`** — `request-link`, `verify-link`. No session (they create it).
   Already rate-limited. `request-link` must never reveal whether an email
   exists (always 200).
2. **Onboarding pre-auth writes (SPEC_ONBOARDING_FUNNEL):** email capture, report
   generation, name, project — all write to a **PENDING** row before
   verification. These must:
   - be **rate-limited** (IP-based) to prevent abuse;
   - only ever create/update a row where `verifiedAt IS NULL` (a pending row);
   - **refuse to touch a VERIFIED user's row** (the "email already registered"
     check returns only a boolean, never that user's data);
   - not return any private data of an existing verified account.
   Implement these as clearly-marked pre-auth actions (e.g. dedicated `action`
   values on `api/user.ts` or on `api/auth.ts`) so the boundary is explicit —
   NOT the same generic guarded path as post-login profile edits.
3. **`api/cron.ts`** — `CRON_SECRET`-gated, not user-scoped. Unchanged.

Everything else requires a session. The moment a user is verified, ALL of her
data access (including profile edits via `user.ts` PATCH) goes through the
session; the pre-auth path is only for the not-yet-verified onboarding.

---

## §8 — Cookie / domain / CORS
- `SameSite=Lax` + `Secure` works while app and API share an origin (true today
  on the Vercel domain). If app and API later split across domains (custom
  domain), revisit: may need `SameSite=None` + explicit CORS `credentials`
  allow-origin (not `*`). Note this in code so it's not missed at domain cutover.

---

## §9 — Testing implications (for the dev)
- The CLAUDE.md test-user pattern (`POST /api/user`) changes: profile
  read/writes now need a session cookie. To test authed endpoints, obtain a
  cookie by running the magic-link flow (`request-link` → read token from DB →
  `verify-link` → capture `Set-Cookie`) and send that cookie on subsequent curl
  calls. Document the test recipe.
- Verify the negative case explicitly: a request with NO cookie (or a tampered
  cookie) to any guarded endpoint returns **401**, and cannot read another
  user's data by passing `?email=`.

---

## §10 — Acceptance
- [ ] `requireAuth` helper in `src/server/`.
- [ ] All 9 authed endpoints derive identity from the session; client email param
      ignored. `grep -rn "query.email\|body.email" api/` shows no identity reads
      in guarded handlers (only pre-auth surfaces §7 may reference email).
- [ ] No-cookie / bad-cookie request to any guarded endpoint → **401**.
- [ ] Passing `?email=other@user.com` with a valid session returns the SESSION
      user's data, never the other user's (param ignored).
- [ ] Nested-id endpoints reject entities not owned by the session user (403).
- [ ] Frontend sends no `?email=`; 401 → redirect to `/login`; logout works.
- [ ] Pre-auth onboarding still works (email capture / report / name / project on
      a pending row) WITHOUT a session, and cannot read/modify a verified user's
      data.
- [ ] Rate limiter keys on session email for authed calls; IP for pre-auth.
- [ ] `tsc -b` + `vite build` pass; prod smoke green; full user journey works
      end-to-end (verify → use app → logout → 401).
