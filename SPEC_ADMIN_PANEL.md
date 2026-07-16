# Admin panel — users, activity, per-user analytics, mentor requests

> Internal panel for Shamil: every user, their activity and per-user analytics,
> and the mentor-request inbox. Read-mostly v1 (the only write = request status).
> Fits the free function slot (we are 11/12 after the northstar consolidation).

## §1 — Access control (critical — this endpoint returns OTHER users' data)
- **`users.isAdmin boolean default false`** (migration script; set `true` for
  `sk@affina.space` in the same script).
- **`api/admin.ts`** (the one new function, → 12/12): EVERY action =
  `requireAuth` (session cookie) → load user → **`isAdmin` check → 403** if not.
  No session → 401. No secret-in-URL schemes; MENTOR_SECRET stays what it was.
- Client route **`/admin`**: on mount calls `?action=ping`; non-admin → redirect
  to dashboard. Route not linked anywhere in the user-facing UI.
- Rate limiting: skip the email-dimension limiter for admin actions (they're
  isAdmin-gated); keep IP limiter generous.

## §2 — `api/admin.ts` actions (GET, `?action=`)
| action | returns |
|---|---|
| `ping` | `{ok:true}` if admin (the /admin gate) |
| `stats` | overview aggregates (§4) |
| `users&search=&page=` | paginated list (§3), search by email/name/project, 50/page, newest first |
| `user&id=` | full per-user detail (§3) |
| `requests&status=` | mentor_requests × users join (name, email, phone, topic, session, status, createdAt) |
| POST `request-status` `{id, status}` | advance `new → scheduled → done` (the only write) |

## §3 — Users: list + per-user detail
**List columns:** email · name · project · verified? (`verifiedAt`) · plan
(`subscribed`/`subscriptionStatus`) · module progress (completed/total) ·
`lastActiveAt` · phone (+source) · utm source/campaign (`utmFirst`) · `createdAt`.

**User detail (`action=user`):**
- Profile: all onboarding fields, snapshot one-liner, country/city/tz, report
  score (`onboardingReport.score`).
- Money: subscription status, `currentPeriodEnd`, Stripe customer id, payments
  (from `payment_succeeded` events: date + amount).
- Program: current module, completed lessons count, brain entries (lessonId +
  aiScore list), open/done tasks, check-ins count + streak, achievements.
- **Activity timeline:** last ~100 rows from `events` (createdAt · name · path
  · key props) — this IS the per-user analytics view. Plus emails received
  (`email_log`: type + sentAt) merged or shown as a second list.
- Mentor requests by this user.

## §4 — Overview (`action=stats`)
- Tiles: total users · verified · subscribed (paying) · revenue (sum of
  `payment_succeeded` amounts) · **new mentor requests** · phones collected.
- Funnel 7d/30d (from `events`/`v_funnel_daily`): captures → verified →
  paywall_viewed → payments.
- Signups by day (14d sparkline data).
- Top UTM sources (from `v_utm_performance`).
Reuse the existing SQL views where they fit; otherwise compute inline. Keep
each stats query cheap (alpha scale — no caching layer needed yet).

## §5 — UI `/admin` (3 tabs, DESIGN.md tokens, desktop-first)
1. **Overview** — stat tiles + funnel numbers + signups mini-chart + top UTM.
2. **Users** — search box + table (§3 columns) → click row = detail panel/page
   with the timeline.
3. **Requests** — inbox grouped by status (`new` first, badge with count);
   one-click status advance (new→scheduled→done); topic verbatim, user contact
   (email/phone) visible right there.
Plain tables > fancy charts in v1; it's an internal tool.

## §6 — Out of scope (later)
User editing/deletion · refunds · impersonation ("login as") · CSV export ·
email-composer/broadcasts UI · docs upload (the SPEC_DOCS_LIBRARY admin story)
· charts beyond the sparkline.

## §7 — Acceptance
- [ ] `users.isAdmin` migrated; `sk@affina.space` flagged admin.
- [ ] `api/admin.ts` added (exactly 12/12 functions). Every action: no session
      → 401; non-admin session → **403** (test with a fresh non-admin user);
      admin → data.
- [ ] `/admin` hidden from user UI; non-admin visiting it is bounced.
- [ ] Users tab: search + pagination work; row → detail with profile, money,
      program, event timeline, emails.
- [ ] Requests tab: new requests visible with topic + contact; status advance
      persists (and is visible in Neon).
- [ ] Overview shows sane numbers consistent with the DB/views.
- [ ] `tsc -b` + `vite build` pass; prod smoke green.
