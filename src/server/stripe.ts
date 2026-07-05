import Stripe from 'stripe';

// Shared Stripe client + price IDs (SPEC_STRIPE). Lives in src/server/ (Vercel 12-function
// cap — only api/stripe.ts is a function). No apiVersion pinned: the SDK's default is used,
// so upgrading the `stripe` package is the single source of truth for the API version.
// Amounts/intervals live in Stripe; the code only references the Price IDs from env (§1/§9).

let client: Stripe | null = null;
export function stripe(): Stripe {
  if (!client) client = new Stripe(process.env.STRIPE_SECRET_KEY ?? '');
  return client;
}

export const priceQuarterly = () => process.env.STRIPE_PRICE_QUARTERLY ?? '';
export const priceAnnual = () => process.env.STRIPE_PRICE_ANNUAL ?? '';
