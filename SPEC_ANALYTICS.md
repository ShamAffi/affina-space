# Analytics — first-party events, funnels, cohorts, UTM (сквозная to revenue)

> Build our OWN analytics: per-user event stream from first anonymous pageview
> through onboarding, program usage, paywall, and payment — stitched to UTM so
> ad money can be traced to revenue. First-party only (our Neon DB, no external
> trackers): better data, no consent-banner circus, works for EU founders.
> Visualization = SQL views + any Postgres BI (Grafana Cloud free / Neon
> console) — no in-app dashboard in v1.

## ⚠️ Slot constraint (do FIRST)
We are at **12/12 functions**. Before adding the ingestion endpoint:
- **Consolidate `api/tasks/index.ts` + `api/tasks/submit.ts` → one `api/tasks.ts`**
  (action-routed, same proven pattern as pulse). Update all frontend callers;
  delete `api/tasks/` dir. This frees 1 slot.
- Then add **`api/track.ts`** → back to 12/12.
No other new `api/` files. Helpers in `src/`.

## §1 — Data model

**New table `events`:**
```ts
events: {
  id: bigserial PK,
  anonId: text NOT NULL,        // client-generated UUID, localStorage 'affina_aid'
  userId: integer NULL,         // resolved server-side (session cookie or stitching) — NEVER from client
  name: text NOT NULL,          // event name from the taxonomy (§5)
  props: jsonb,                 // small event-specific payload
  path: text,                   // location.pathname
  referrer: text,               // document.referrer (first event of a session is enough)
  createdAt: timestamptz default now(),
}
// indexes: (userId, createdAt), (anonId), (name, createdAt)
```

**`users` additions:**
```ts
anonId: text,            // stitched at email capture — joins pre-auth events to the user
utmFirst: jsonb,         // first-touch {source, medium, campaign, term, content, referrer, landing}
utmLast: jsonb,          // last-touch before capture (same shape)
```
Migration via node script; `schema.ts` same change.

## §2 — Client tracker (`src/lib/analytics.ts`)
- `anonId`: UUID in `localStorage['affina_aid']` (created on first load).
- **UTM capture:** on app load, parse `utm_*` from the URL; if present → save as
  last-touch; if no first-touch stored yet → also save as first-touch (both in
  localStorage, with `referrer` + `landing` path + timestamp).
- `track(name, props?)`: pushes to an in-memory queue with `anonId`, `path`.
  Flush: batched POST to `/api/track` every ~5s or 10 events, and
  `navigator.sendBeacon` on `visibilitychange/hidden`. **Fail-silent** — analytics
  must never break or slow UX (no awaits in UI paths, catch-all).
- Auto `page_view` on route change (react-router location effect).
- No cookies, no IP, no fingerprinting — anonId + session cookie only.

## §3 — Ingestion (`api/track.ts`)
- `POST` batch `{ events: [{name, props?, path?, referrer?}], anonId }`,
  max 20/batch. Zod-validate; `name` ≤ 64 chars, props ≤ 2KB.
- **Pre-auth by design** (the onboarding funnel is anonymous): no session required.
  IP rate-limited (reuse `src/server/ratelimit.ts`; generous, e.g. 120/min —
  it's a batch endpoint).
- **userId resolution — server-side only:** if a valid session cookie is present,
  set `userId` from it. NEVER accept a userId from the client body.
- Insert rows; respond 204 fast. Failures must not throw to the client (200/204
  even on partial validation drop).

## §4 — Identity stitching (anonymous → user)
Two stitch points, both server-side:
1. **Email capture** (`api/user.ts` POST emailCapture): frontend includes
   `anonId` in the capture request → store `users.anonId`, stamp
   `users.utmFirst`/`utmLast` (sent from the tracker's stored touches), and
   backfill: `UPDATE events SET user_id = :uid WHERE anon_id = :aid AND user_id IS NULL`.
2. **Verify** (`api/auth.ts` verify-link): session starts → subsequent events
   carry userId via cookie automatically. Run the same backfill once more
   (covers events between capture and verify on another device? no — link email
   was opened elsewhere; the backfill by anonId still only joins same-device
   events; accept that).
After stitching, the full pre-signup trail (landing → questions → report views)
belongs to the user row → cohortable, UTM-attributable.

## §5 — Event taxonomy (canonical names — implement exactly these)
Funnel (client): `page_view` · `onboarding_start` · `onboarding_q_answered`
{step} · `email_captured` · `report_viewed` · `name_set` · `project_named` ·
`magic_link_requested` · `report_page_viewed` (the /report recovery route).
Program (client): `lesson_opened` {lessonId} · `exercise_submitted` {lessonId} ·
`ai_feedback_received` {lessonId, score} · `delegate_used` {lessonId, mode} ·
`checkin_committed` · `northstar_set` · `task_completed` {taskId}.
Monetization (client): `paywall_viewed` · `paywall_dismissed` ·
`checkout_started`. Mentor: `mentor_book_clicked` {session}.
**Server-truth (insert directly, not via client):** `email_verified` (auth
verify) · `payment_succeeded` {amountCents, currency, interval} (stripe webhook
`checkout.session.completed`/`invoice.paid` — amount from the invoice) ·
`subscription_canceled` (webhook). Server events use the user's stored anonId.
Email sends stay in `email_log` (already our analytics for email) — JOIN in
views, don't duplicate.

## §6 — UTM / сквозная (ad → revenue)
- The chain: ad click (utm) → first-touch stored → email capture stamps
  `utmFirst` on the user → `payment_succeeded` events + Stripe fields on the
  same user → **revenue per utm_source/campaign is one JOIN**.
- ⚠️ **Ops requirement (Shamil):** if ads land on the marketing site
  (`affina.space`) first, every link from it into the app MUST pass the `utm_*`
  params through (or the chain breaks at the door). Simplest: ads point straight
  at the app's onboarding URL with utm params.
- Last-touch (`utmLast`) kept for comparison; first-touch is the default
  attribution for reporting.

## §7 — Cohorts & views (SQL, in a migration or `scripts/analytics-views.mjs`)
Create as DB views (queryable from Neon console / Grafana Cloud free / Metabase):
- **`v_funnel_daily`** — per day: counts of each funnel event + conversion %
  (landing→capture→verified→paywall_viewed→payment).
- **`v_cohort_weekly`** — cohort = ISO week of `email_captured`; columns: cohort
  size, verified %, active week 1..N (any event that week), paid %.
- **`v_utm_performance`** — group by `utmFirst->>'source'`/`campaign`: captures,
  verified, paid, revenue (sum of payment_succeeded amounts).
- **`v_user_journey`** — per user: key timestamps (captured, verified, first
  lesson, paywall, paid) for eyeballing individual journeys during alpha.
Document 3–4 ready-to-paste queries in the spec/README for Shamil (e.g. "show
this week's funnel", "cohort table", "utm table").

## §8 — Privacy
- First-party only; no third-party pixels/cookies in v1. Don't store IP or
  user-agent in `events`. This should be reflected in the privacy policy on
  affina.space (ops note for Shamil: add an "analytics we collect ourselves"
  clause).
- Ad-platform pixels/CAPI (Meta, Google) = Phase 2, when paid ads start — our
  server-truth `payment_succeeded` event is the future conversion source.

## §9 — Out of scope (v1)
In-app admin dashboard · A/B testing framework · ad-platform conversion APIs ·
session replay. The event stream is designed so these bolt on later.

## §10 — Acceptance
- [ ] tasks consolidated (2→1); `api/track.ts` added; still ≤12 functions.
- [ ] Anonymous visitor: page_view + onboarding events land in `events` with
      anonId, no userId.
- [ ] After email capture: `users.anonId`+`utmFirst`/`utmLast` set; prior events
      backfilled with userId.
- [ ] After verify: subsequent events carry userId via session automatically.
- [ ] `payment_succeeded` (with amount) inserted by the Stripe webhook (test mode).
- [ ] `?utm_source=test&utm_campaign=x` on the landing URL → visible on the user
      row and in `v_utm_performance` after a test payment.
- [ ] Views return sane data; example queries documented.
- [ ] Tracker is fail-silent: blocking `/api/track` (devtools) breaks nothing.
- [ ] `tsc -b` + `vite build` pass; prod smoke green (incl. tasks flow after
      consolidation).
