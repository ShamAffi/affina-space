# Stripe — subscription (3 months upfront → annual)

> Replaces the paywall "Unlock" stub (which just flips `subscribed=true` for
> free) with real Stripe payment. Billing model: **first term = 3 months, paid
> in full upfront; after 3 months it renews as an ANNUAL subscription.** Gating
> logic (M5–M12 on `users.subscribed`) is unchanged — Stripe just becomes what
> flips the flag. NOT Anthropic — use the official `stripe` SDK / Stripe docs.

## Platform constraints (CLAUDE.md)
- 12-function cap (currently 11/12) — `api/stripe.ts` uses the free slot. No
  other new `api/` files. Helpers in `src/server/`.
- Migrations via node script; update `schema.ts` same change.
- Verify `tsc -b` + `vite build` + live curl; deploy per CLAUDE.md.
- Build & test in Stripe **test mode** first (test keys + card `4242…`), then
  swap to live keys.

---

## §1 — Stripe products & prices — ✅ DONE (verified 2026-07-05, test mode)
One product ("Affina Space … Full Program") with two recurring Prices, both
active, EUR, in the Stripe **sandbox / test mode**:
- **Quarterly:** €360 every 3 months (`interval: month, interval_count: 3`) →
  **`STRIPE_PRICE_QUARTERLY = price_1TppacH9BgajPg4t9az1fZMc`** (first term,
  charged upfront).
- **Annual:** €1200 / year → **`STRIPE_PRICE_ANNUAL = price_1TppawH9BgajPg4tQatnBc0d`**
  (the renewal after month 3).
- These are TEST-mode price IDs. At go-live, recreate the same two prices in
  live mode and swap the IDs (§10). Amounts live in Stripe — code references IDs.

## §2 — The two-phase subscription (the key mechanism)
Use **Stripe Subscription Schedules** (the correct primitive for phased pricing):
- **Phase 1:** `STRIPE_PRICE_QUARTERLY`, **1 iteration** → one 3-month cycle,
  charged in full at checkout.
- **Phase 2:** `STRIPE_PRICE_ANNUAL`, ongoing (default unlimited iterations) →
  begins when Phase 1 ends (month 3), then renews yearly.

Recommended wiring: Checkout in `mode: subscription` with the quarterly price
creates the subscription; in the `checkout.session.completed` webhook, convert
it to a Subscription Schedule (`from_subscription`) and set Phase 2 to the
annual price so it transitions after the first 3-month cycle. Verify the phase
transition in test mode (use Stripe's clock/test tooling to fast-forward).

## §3 — `api/stripe.ts` (the one new function)
Action-routed, like the other handlers:
- **`POST /api/stripe {action:'checkout'}`** — creates a Stripe Checkout Session
  (`mode: subscription`, line item = quarterly price), returns the session URL.
  - **Requires the logged-in session** (Auth Phase B) — identity from the cookie,
    NOT a client email. Attach the user to the session via `client_reference_id`
    (the user id) and `customer_email` so the webhook can map payment → user.
  - `success_url` → an in-app success route; `cancel_url` → back to the paywall.
- **`POST /api/stripe` webhook** (Stripe → us) — **verify the signature** with
  `STRIPE_WEBHOOK_SECRET` (raw body required; make sure the handler reads the
  raw request body, not parsed JSON, for signature verification). Handle:
  - `checkout.session.completed` → set up the Phase-2 schedule (§2); mark the
    user `subscribed=true`; store Stripe ids (§5).
  - `invoice.paid` → keep `subscribed=true` (renewals).
  - `customer.subscription.deleted` / `invoice.payment_failed` (after retries) →
    set `subscribed=false`.
  - Map every event back to the user via `client_reference_id` / stored
    `stripeCustomerId`.
- ⚠️ **The webhook — not the browser redirect — is the source of truth** for
  `subscribed`. Never flip the flag from the `success_url` return alone (it can
  be forged). The redirect just shows a nice "you're in" screen; the webhook
  does the actual entitlement.

## §4 — Flow
```
Click "Unlock" → POST /api/stripe {action:'checkout'} (session-authed)
   → redirect to Stripe Checkout (Stripe hosts the card form — no PCI on us)
   → pay → redirect to success_url (in-app)
   → Stripe webhook → verify → subscribed=true + store ids + set schedule
   → gating opens (M5–M12) → existing full-page S1 mentor booking (unchanged)
```
Cancel → back to paywall, `subscribed` untouched (still false).

## §5 — Data model (add to `users`)
- `stripeCustomerId text` — Stripe customer.
- `stripeSubscriptionId text` — the subscription/schedule.
- `subscriptionStatus text` — e.g. `active|past_due|canceled` (for display/logic).
- `currentPeriodEnd timestamptz` — for "renews on …" UI + grace handling.
- `subscribed boolean` (exists) — the gate; driven by the webhook.
Migrate via node script; update `schema.ts`.

## §6 — `subscribed` lifecycle (webhook-driven)
- `true` on first successful payment (`checkout.session.completed` / `invoice.paid`).
- Stays `true` across renewals (`invoice.paid`).
- `false` on `customer.subscription.deleted`, or `invoice.payment_failed` once
  Stripe exhausts retries (decide: cut access immediately vs at period end —
  default: keep access until `currentPeriodEnd`, then cut).

## §7 — Manage / cancel (self-serve)
- Use the **Stripe Customer Portal** (hosted, minimal code): a
  `POST /api/stripe {action:'portal'}` returns a portal URL where she can cancel
  / update card / see invoices. Link it from the account panel.
- "Cancel anytime" in the paywall copy: with a 3-month upfront term, cancelling
  stops the annual renewal; the paid 3 months remain hers. See §11 copy note.

## §8 — Auth interplay (Phase B)
- Checkout + portal endpoints require the session cookie → we always know which
  user is paying; no client-supplied email. Webhooks are Stripe-signed (not
  session — they're server-to-server) and map to the user via
  `client_reference_id` / `stripeCustomerId`.

## §9 — Env vars (test first, then live; add to `.env.example` + Vercel)
- `STRIPE_SECRET_KEY` — server API key.
- `STRIPE_WEBHOOK_SECRET` — from the Dashboard webhook config, for signature verify.
- `STRIPE_PRICE_QUARTERLY`, `STRIPE_PRICE_ANNUAL` — the two Price IDs.
- (Publishable key only if you later use Elements; hosted Checkout redirect
  doesn't need it client-side.)

## §10 — Test → live checklist (Shamil manual)
- Test mode: create the two Prices, get test keys, register the webhook endpoint
  (`https://…/api/stripe`) → test-mode webhook secret. Dev tests with `4242…`.
- Go live: complete Stripe business verification, create the SAME two Prices in
  live mode, swap env to live keys + live webhook secret.

## §11 — Paywall copy (numbers confirmed)
- Replace the `[PRICE]` placeholder in SPEC_PAYWALL with:
  **"€360 for your first 3 months, then €1,200/year · cancel anytime."**
- Honesty note next to "cancel anytime" (3-month upfront term): e.g.
  *"Cancel anytime — your first 3 months are yours; cancel before renewal to stop
  the annual plan."* (final wording = Shamil.)

## §12 — Acceptance
- [ ] `api/stripe.ts` = checkout + portal + webhook; only new `api/` file (≤12).
- [ ] Checkout requires session; user mapped via `client_reference_id`.
- [ ] Webhook signature verified (raw body); `subscribed` flips ONLY from the
      webhook, never the redirect.
- [ ] First payment charges 3 months upfront; a Subscription Schedule transitions
      to the annual price after the first cycle (verified in test mode).
- [ ] `subscribed=true` on payment → M5–M12 unlock → S1 booking flow (unchanged).
- [ ] Cancel via Customer Portal → renewal stops; access per §6 rule.
- [ ] Stripe ids + status stored on the user.
- [ ] Test mode green end-to-end (`4242…`), then live keys swapped.
- [ ] `tsc -b` + `vite build` pass; prod smoke green.
