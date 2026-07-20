-- 0010 — subscription self-management. `cancel_at_period_end` mirrors Stripe: renewal turned
-- off, but access runs to `current_period_end` (already paid in advance). Set by the in-app
-- "cancel renewal" action + synced from Stripe's customer.subscription.updated webhook. Idempotent.
ALTER TABLE users ADD COLUMN IF NOT EXISTS cancel_at_period_end boolean DEFAULT false;
