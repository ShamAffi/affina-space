import type { VercelRequest, VercelResponse } from '@vercel/node';
import type Stripe from 'stripe';
import { eq } from 'drizzle-orm';
import { applyCors } from '../src/server/http.js';
import { requireAuth } from '../src/server/requireAuth.js';
import { getDb } from '../src/server/db.js';
import { captureError } from '../src/server/observability.js';
import { insertServerEvent } from '../src/server/events.js';
import { stripe, priceQuarterly, priceAnnual } from '../src/server/stripe.js';
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
  if (action === 'checkout') return handleCheckout(email, res);
  if (action === 'portal') return handlePortal(email, res);
  return res.status(400).json({ error: 'unknown action (expected checkout|portal)' });
}

// POST /api/stripe?action=checkout — Checkout Session (subscription, quarterly first term).
async function handleCheckout(email: string, res: VercelResponse) {
  if (!process.env.STRIPE_SECRET_KEY || !priceQuarterly()) {
    return res.status(503).json({ error: 'stripe_not_configured' });
  }
  const db = getDb();
  const user = await db.query.users.findFirst({ where: eq(users.email, email) });
  if (!user) return res.status(404).json({ error: 'user not found' });

  try {
    const session = await stripe().checkout.sessions.create({
      mode: 'subscription',
      line_items: [{ price: priceQuarterly(), quantity: 1 }],
      // Map the payment → user for the webhook. Reuse the customer if we have one.
      client_reference_id: String(user.id),
      ...(user.stripeCustomerId ? { customer: user.stripeCustomerId } : { customer_email: email }),
      success_url: `${appUrl()}/unlock/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl()}/unlock`,
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

        // §2 — convert the subscription to a schedule and add Phase 2 (annual, ongoing)
        // so it transitions after the first quarterly cycle. Never let this fail the webhook.
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
        if (u) await sendOnce(userId, 'subscription', 'once', subscriptionEmail(u.email));
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
