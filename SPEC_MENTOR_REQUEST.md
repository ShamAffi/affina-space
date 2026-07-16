# Mentor request — topic + "send request" (replaces mailto booking)

> Replaces the `mailto:` stubs in the S1 booking page (`StartSession.tsx`) and
> the S1/S2/S3 modal (`MentorSessionModal.tsx`) with a real request flow: she
> writes the topic that matters most right now → "Send request" → saved to DB
> (the future admin panel will read this table) + alert email to
> admin@affina.space. No calendar integration in alpha — Shamil coordinates the
> time personally after the alert.

## §1 — UX (both surfaces: S1 full page + S2/S3 modal)
Replace the mailto button with an inline form:
- Label: **"What's on your mind most right now?"**
- Textarea (≤ 500 chars), placeholder: *"e.g. I'm not sure my pricing is right ·
  I keep stalling on talking to customers · I don't know what to focus on next"*
- CTA: **[ Send request ]** (disabled until non-empty).
- Success state (replaces the form): **"Request sent 🎉 We'll reach out within
  24–48h to set a time."** — and the surface behaves as "booked" from here on
  (no more nudges).
- Keep the existing secondary CTA on S1 ("I'll book later — continue to Module
  5") — unchanged; booking is still never required to continue.

## §2 — Data: `mentor_requests` table (feeds the future admin panel)
```ts
mentorRequests: {
  id: serial PK,
  userId: integer → users.id (cascade),
  session: text,            // 'S1' | 'S2' | 'S3'
  topic: text,              // her words, ≤500 chars
  status: text default 'new',   // 'new' | 'scheduled' | 'done' — admin panel will manage
  createdAt: timestamptz default now(),
}
```
Migration via node script; `schema.ts` same change. This table IS the alpha
"admin panel" backlog — until the panel exists, Shamil works from the alert
emails (and can query the table in Neon).

## §3 — API: NO new function (we're 12/12)
Extend the existing **session-authed PATCH path in `api/user.ts`** with a
`mentorRequest: { session, topic }` payload:
1. Validate (session ∈ S1/S2/S3, topic non-empty ≤500).
2. Insert into `mentor_requests`.
3. Set `users.mentorSessions[session].booked = true` (existing semantics — this
   is what stops the dashboard nudge and the lifecycle "book mentor" email, and
   it fires the existing #4 confirmation email in its "we'll be in touch to
   confirm your time" variant — do NOT add a second user-facing email).
4. Fire the admin alert (§4), fire-and-forget.
Identity from the session cookie only (Phase B), as with all PATCH writes.

## §4 — Admin alert email
On every request: `sendEmail` (fire-and-forget) to **`ADMIN_EMAIL`** (new env
var, **default `sk@affina.space`** — confirmed receiving mailbox, decided
2026-07-06):
- Subject: `🧑‍🏫 Mentor request: {name} ({session})`
- Body: name · project · email · phone (if on file) · session (Start/Mid/Final)
  · **her topic (verbatim)** · current module · subscribed status.
- Same address the hot-lead phone alerts already use — one inbox for all alpha
  sales/ops signals.

## §5 — Integration points
- Dashboard "session due" card + lifecycle "book your mentor" email CTAs →
  route to the S1 page / open the modal with this form (existing routes stay).
- After a request: `booked=true` suppresses all further nudges for that session
  (existing behavior — verify it holds).
- Analytics (when SPEC_ANALYTICS ships): `mentor_request_submitted {session}` —
  add to the taxonomy alongside `mentor_book_clicked`.

## AMENDMENT (2026-07-16) — mentor sessions are a PAID feature: gate on
## `subscribed`, unpaid click opens the paywall (decided by Shamil)

Found in live testing: with M4 complete but unpaid, the Dashboard "session due"
card opened the request modal and the request went through. Mentor sessions are
part of the paid value stack — gate them. Decision: do NOT hide the card —
keep it visible as a value teaser; an unpaid click opens the paywall instead.

**Frontend:**
- Dashboard "session due" card: visibility logic unchanged (due = trigger
  module complete & not booked/completed). Click behavior branches:
  `subscribed → open MentorSessionModal` · `not subscribed → navigate to the
  paywall (/unlock)`.
- Same branch EVERYWHERE `MentorSessionModal` opens (`Dashboard.tsx`,
  `LMS.tsx`) — no unpaid path reaches the request form.
- `/start-session` (S1 page): add a route guard — `!subscribed` → redirect to
  `/unlock` (defense in depth against direct URL entry).
- If the API ever returns 403 `subscription_required` (below), the frontend
  treats it as "open the paywall", not a generic error.

**Backend (the real enforcement — UI gates are bypassable):**
- `api/user.ts` PATCH: reject `mentorRequest` when the session user is not
  `subscribed` → **403 `{error:'subscription_required'}`**. No row, no emails.
- Gate `mentorSessions` writes (booked/later flips) the same way — nothing
  unpaid legitimately writes them.
- If the earlier security-audit commit already added an entitlement check here,
  verify it matches this exact behavior and keep one implementation.

Amendment acceptance:
- [ ] Unpaid + M4 complete: card visible → click opens the PAYWALL (no modal).
- [ ] Unpaid direct PATCH `mentorRequest` (curl, valid session) → 403
      `subscription_required`; no `mentor_requests` row, no alert email.
- [ ] Unpaid direct visit to `/start-session` → redirected to `/unlock`.
- [ ] Paid user: click → modal → request works end-to-end as before (row +
      admin alert + booked flip + confirmation email).
- [ ] S2/S3 behave identically to S1 under the gate.
Admin panel UI (future — the table is ready for it) · real calendar/scheduling ·
reminders to Shamil about unanswered requests.

## §7 — Acceptance
- [ ] `mentor_requests` table added; `schema.ts` updated.
- [ ] S1 page + S2/S3 modal show the topic form; no `mailto:` anywhere.
- [ ] Submit → row in `mentor_requests` + `mentorSessions[session].booked=true`
      + ONE user confirmation email (existing #4) + admin alert to ADMIN_EMAIL.
- [ ] Success state shows; nudges for that session stop; S1 "continue to M5"
      unchanged.
- [ ] Empty/oversize topic rejected client- and server-side.
- [ ] Works via session cookie only (no email in payload).
- [ ] `tsc -b` + `vite build` pass; prod smoke green.
