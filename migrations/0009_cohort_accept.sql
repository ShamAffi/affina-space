-- 0009 — founding-cohort post-call acceptance (SPEC_COHORT_PAYWALL §3a). Set by the admin
-- "Accept into cohort" action: cohort_accepted_at marks the fit decision, seat_held_until (=
-- accept time + 72h default) drives the accepted paywall variant + acceptance/reminder emails.
-- Idempotent.
ALTER TABLE users ADD COLUMN IF NOT EXISTS cohort_accepted_at timestamptz;
ALTER TABLE users ADD COLUMN IF NOT EXISTS seat_held_until timestamptz;
