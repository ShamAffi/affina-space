import type { VercelRequest, VercelResponse } from '@vercel/node';
import type Stripe from 'stripe';
import { eq } from 'drizzle-orm';
import { applyCors } from '../src/server/http.js';
import { requireAuth } from '../src/server/requireAuth.js';
import { getDb } from '../src/server/db.js';
import { captureError } from '../src/server/observability.js';
import { insertServerEvent } from '../src/server/events.js';
import { stripe, priceQuarterly, priceAnnual, priceFounding } from '../src/server/stripe.js';
import { users } from '../src/db/schema.js';
import { sendOnce } from '../src/server/emailLog.js';
import { subscriptionEmail } from '../src/server/email.js';

// SPEC_STRIPE — the one new function (checkout + portal + webhook), action-routed.
// The WEBHOOK needs the RAW request body for signature verification, so body parsing is
// disabled for the whole function; frontend actions route on ?action= (no body needed).
export const config = { api: { bodyParser: false } };

const appUrl = () => process.env.APP_URL || 'https://affina-space.vercel.app';

async function readRawBody(req: VercelRequest): Promise<Buffer> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  return Buffer.concat(chunks);
}

const idOf = (v: string | { id: string } | null | undefined): string | undefined =>
  typeof v === 'string' ? v : v?.id;

// Robust read of the subscription's period end across Stripe API versions (top-level in
// older versions, on the item in newer ones).
function periodEndDate(sub: Stripe.Subscription): Date | null {
  const top = (sub as unknown as { current_period_end?: number }).current_period_end;
  const item = sub.items?.data?.[0] as unknown as { current_period_end?: number } | undefined;
  const ts = typeof top === 'number' ? top : item?.current_period_end;
  return typeof ts === 'number' ? new Date(ts * 1000) : null;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (applyCors(req, res, 'POST,OPTIONS')) return;
  if (req.method !== 'POST') return res.status(405).json({ error: 'method not allowed' });

  const raw = await readRawBody(req);
  const sig = req.headers['stripe-signature'];

  // ── WEBHOOK (Stripe → us): signed server-to-server, no session (§3/§8) ─────────
  if (sig) return handleWebhook(raw, String(sig), res);

  // ── Frontend actions: require the logged-in session (Auth Phase B) ────────────
  const email = requireAuth(req, res);
  if (!email) return;
  const action = req.query.action;
  if (action === 'checkout') return handleCheckout(email, res, typeof req.query.next === 'string' ? req.query.next : undefined);
  if (action === 'portal') return handlePortal(email, res);
  if (action === 'cancel-renewal') return handleCancelRenewal(email, res, true);
  if (action === 'resume-renewal') return handleCancelRenewal(email, res, false);
  return res.status(400).json({ error: 'unknown action (expected checkout|portal|cancel-renewal|resume-renewal)' });
}

// Restrict `next` to a safe in-app path (single leading slash, no scheme/host/query) so the
// return URL can never become an open redirect. Used to send an m2l6 buyer back to the research.
function safeReturnPath(p: string | undefined): string | undefined {
  if (!p || !p.startsWith('/') || p.startsWith('//')) return undefined;
  return /^\/[A-Za-z0-9/_-]*$/.test(p) ? p : undefined;
}

// POST /api/stripe?action=checkout[&next=/path] — Checkout Session (subscription, quarterly first term).
async function handleCheckout(email: string, res: VercelResponse, next?: string) {
  // Founding-cohort funnel (SPEC_COHORT_PAYWALL §0): checkout charges the €300/3mo founding price
  // when STRIPE_PRICE_FOUNDING is set, else falls back to the existing (working) quarterly test
  // price so checkout keeps working until Shamil creates the founding price. The webhook's
  // annual-phase bypass is gated on the founding price id, so the fallback keeps legacy behavior.
  const checkoutPrice = priceFounding() || priceQuarterly();
  if (!process.env.STRIPE_SECRET_KEY || !checkoutPrice) {
    return res.status(503).json({ error: 'stripe_not_configured' });
  }
  const db = getDb();
  const user = await db.query.users.findFirst({ where: eq(users.email, email) });
  if (!user) return res.status(404).json({ error: 'user not found' });
  // Already subscribed (e.g. bought at m2l6, later reached the M4 paywall) — never open a 2nd sub.
  if (user.subscribed) return res.status(409).json({ error: 'already_subscribed' });

  const ret = safeReturnPath(next); // e.g. /learning/launch/m2l6 for the Market Research entry point
  try {
    const session = await stripe().checkout.sessions.create({
      mode: 'subscription',
      line_items: [{ price: checkoutPrice, quantity: 1 }],
      // Map the payment → user for the webhook. Reuse the customer if we have one.
      client_reference_id: String(user.id),
      ...(user.stripeCustomerId ? { customer: user.stripeCustomerId } : { customer_email: email }),
      // On success, PaymentSuccess polls for `subscribed` then routes to `next` (default → S1).
      success_url: `${appUrl()}/unlock/success?session_id={CHECKOUT_SESSION_ID}${ret ? `&next=${encodeURIComponent(ret)}` : ''}`,
      cancel_url: ret ? `${appUrl()}${ret}` : `${appUrl()}/unlock`,
      allow_promotion_codes: true,
    });
    return res.status(200).json({ url: session.url });
  } catch (err) {
    captureError(err, { endpoint: 'stripe', mode: 'checkout' });
    return res.status(502).json({ error: 'checkout_failed' });
  }
}

// POST /api/stripe?action=portal — hosted Customer Portal (cancel / card / invoices).
async function handlePortal(email: string, res: VercelResponse) {
  const db = getDb();
  const user = await db.query.users.findFirst({ where: eq(users.email, email) });
  if (!user?.stripeCustomerId) return res.status(400).json({ error: 'no_subscription' });
  try {
    const portal = await stripe().billingPortal.sessions.create({
      customer: user.stripeCustomerId,
      return_url: `${appUrl()}/dashboard`,
    });
    return res.status(200).json({ url: portal.url });
  } catch (err) {
    captureError(err, { endpoint: 'stripe', mode: 'portal' });
    return res.status(502).json({ error: 'portal_failed' });
  }
}

// POST /api/stripe?action=cancel-renewal | resume-renewal — turn auto-renewal off/on.
// Cancelling renewal does NOT refund or cut access: the period is paid in advance, so access
// runs to `current_period_end`, then the subscription just doesn't renew. A schedule-managed sub
// (quarterly→annual) can't take `cancel_at_period_end` directly, so we RELEASE the schedule first
// (the sub stays on its current phase — no annual transition), then set the flag.
async function handleCancelRenewal(email: string, res: VercelResponse, cancel: boolean) {
  const db = getDb();
  const user = await db.query.users.findFirst({ where: eq(users.email, email) });
  if (!user?.stripeSubscriptionId) return res.status(400).json({ error: 'no_subscription' });
  try {
    if (cancel) {
      const sub = await stripe().subscriptions.retrieve(user.stripeSubscriptionId, { expand: ['schedule'] });
      const schedId = idOf(sub.schedule as string | { id: string } | null | undefined);
      if (schedId) {
        try { await stripe().subscriptionSchedules.release(schedId); }
        catch (e) { captureError(e, { endpoint: 'stripe', mode: 'schedule-release', note: 'cancel-renewal' }); }
      }
    }
    const updated = await stripe().subscriptions.update(user.stripeSubscriptionId, { cancel_at_period_end: cancel });
    await db.update(users).set({
      cancelAtPeriodEnd: cancel,
      subscriptionStatus: updated.status,
      currentPeriodEnd: periodEndDate(updated),
      updatedAt: new Date(),
    }).where(eq(users.id, user.id));
    return res.status(200).json({ ok: true, cancelAtPeriodEnd: cancel, currentPeriodEnd: periodEndDate(updated) });
  } catch (err) {
    captureError(err, { endpoint: 'stripe', mode: cancel ? 'cancel-renewal' : 'resume-renewal' });
    return res.status(502).json({ error: 'update_failed' });
  }
}

async function handleWebhook(raw: Buffer, sig: string, res: VercelResponse) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) return res.status(500).json({ error: 'webhook_not_configured' });

  let event: Stripe.Event;
  try {
    event = stripe().webhooks.constructEvent(raw, sig, secret);
  } catch (err) {
    // Bad/forged signature — never trust it (§3).
    console.error('[stripe] webhook signature verification failed:', err instanceof Error ? err.message : err);
    return res.status(400).json({ error: 'invalid_signature' });
  }

  const db = getDb();
  try {
    switch (event.type) {
      // First payment succeeded — set up the phase-2 schedule, flip the gate, store ids.
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = Number(session.client_reference_id);
        const customerId = idOf(session.customer);
        const subscriptionId = idOf(session.subscription);
        if (!userId || !subscriptionId) break;

        const sub = await stripe().subscriptions.retrieve(subscriptionId);

        // §2 — quarterly→annual schedule. SPEC_COHORT_PAYWALL §0: founding-cohort subs are a
        // single recurring €300/3mo price with NO annual phase — so we BYPASS this block when the
        // purchased price is the founding price (gate by price id; keep the code for legacy
        // quarterly subs). `subscribed` still flips below regardless. Never fail the webhook.
        const purchasedPrice = sub.items.data[0]?.price?.id;
        if (purchasedPrice && purchasedPrice !== priceFounding()) {
          try {
            const schedule = await stripe().subscriptionSchedules.create({ from_subscription: subscriptionId });
            // from_subscription already sets phase[0] to the quarterly cycle (its end_date =
            // the 3-month period end). Preserve it and append the annual phase (ongoing) →
            // Stripe transitions to annual when the quarterly cycle ends. (No `iterations` —
            // removed in current API versions; the phase boundary is end_date/start_date.)
            const p0 = schedule.phases[0];
            await stripe().subscriptionSchedules.update(schedule.id, {
              end_behavior: 'release',
              phases: [
                { items: [{ price: priceQuarterly(), quantity: 1 }], start_date: p0.start_date, end_date: p0.end_date },
                { items: [{ price: priceAnnual(), quantity: 1 }] }, // ongoing → renews yearly
              ],
            });
          } catch (err) {
            captureError(err, { endpoint: 'stripe', mode: 'schedule-setup', note: 'subscription still active on quarterly' });
          }
        }

        await db.update(users).set({
          subscribed: true,
          stripeCustomerId: customerId,
          stripeSubscriptionId: subscriptionId,
          subscriptionStatus: sub.status,
          currentPeriodEnd: periodEndDate(sub),
          updatedAt: new Date(),
        }).where(eq(users.id, userId));

        // §2.3 subscription-confirmed email (moved off the browser PATCH → the webhook).
        const u = await db.query.users.findFirst({ where: eq(users.id, userId) });
        if (u) await sendOnce(userId, 'subscription', 'once', subscriptionEmail(u.email, u.name));
        break;
      }

      // Renewal (incl. the quarterly→annual transition) — keep the gate open.
      case 'invoice.paid': {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = idOf(invoice.customer);
        if (!customerId) break;
        const u = await db.query.users.findFirst({ where: eq(users.stripeCustomerId, customerId) });
        if (u) {
          const periodEnd = invoice.lines?.data?.[0]?.period?.end;
          await db.update(users).set({
            subscribed: true,
            subscriptionStatus: 'active',
            ...(typeof periodEnd === 'number' ? { currentPeriodEnd: new Date(periodEnd * 1000) } : {}),
            updatedAt: new Date(),
          }).where(eq(users.id, u.id));
          // Server-truth revenue event (SPEC_ANALYTICS §5) — ONE per paid invoice (first +
          // renewals), so no double-count with checkout.session.completed. Amount from the invoice.
          const line = invoice.lines?.data?.[0] as { price?: { recurring?: { interval?: string } } } | undefined;
          await insertServerEvent(db, u.id, 'payment_succeeded', {
            amountCents: invoice.amount_paid,
            currency: invoice.currency,
            interval: line?.price?.recurring?.interval ?? invoice.billing_reason ?? null,
          }, u.anonId);
        }
        break;
      }

      // Payment failed — keep access until currentPeriodEnd (§6); Stripe cancels after retries.
      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = idOf(invoice.customer);
        if (!customerId) break;
        const u = await db.query.users.findFirst({ where: eq(users.stripeCustomerId, customerId) });
        if (u) await db.update(users).set({ subscriptionStatus: 'past_due', updatedAt: new Date() }).where(eq(users.id, u.id));
        break;
      }

      // Sub changed (renewal toggled, plan change, schedule release) — mirror the state so the
      // account panel shows the truth even when changed via the hosted portal. Requires the
      // `customer.subscription.updated` event to be enabled on the Stripe webhook (manual, §ops).
      case 'customer.subscription.updated': {
        const sub = event.data.object as Stripe.Subscription;
        const customerId = idOf(sub.customer);
        if (!customerId) break;
        const u = await db.query.users.findFirst({ where: eq(users.stripeCustomerId, customerId) });
        if (u) {
          await db.update(users).set({
            cancelAtPeriodEnd: !!sub.cancel_at_period_end,
            subscriptionStatus: sub.status,
            currentPeriodEnd: periodEndDate(sub),
            updatedAt: new Date(),
          }).where(eq(users.id, u.id));
        }
        break;
      }

      // Subscription ended (cancel after retries / customer cancel) — cut access.
      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription;
        const customerId = idOf(sub.customer);
        if (!customerId) break;
        const u = await db.query.users.findFirst({ where: eq(users.stripeCustomerId, customerId) });
        if (u) {
          await db.update(users).set({ subscribed: false, subscriptionStatus: 'canceled', updatedAt: new Date() }).where(eq(users.id, u.id));
          await insertServerEvent(db, u.id, 'subscription_canceled', {}, u.anonId);
        }
        break;
      }
    }
  } catch (err) {
    captureError(err, { endpoint: 'stripe', mode: 'webhook', eventType: event.type });
    // 500 → Stripe retries. The events are idempotent, so a retry is safe.
    return res.status(500).json({ error: 'handler_error' });
  }

  return res.status(200).json({ received: true });
}
