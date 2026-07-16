-- 0004 — analytics reporting views (SPEC_ANALYTICS §7). Query from the Neon console or any
-- Postgres BI (Grafana Cloud free / Metabase). CREATE OR REPLACE so a later view edit is a
-- new migration file, not an in-place change. See migrations/README.md for ready queries.

-- Daily funnel: raw counts per stage per day (conversion = ratios between columns).
CREATE OR REPLACE VIEW v_funnel_daily AS
SELECT
  date_trunc('day', created_at)::date AS day,
  count(*) FILTER (WHERE name = 'page_view')                     AS page_views,
  count(DISTINCT anon_id) FILTER (WHERE name = 'onboarding_start') AS onboarding_starts,
  count(DISTINCT anon_id) FILTER (WHERE name = 'email_captured')   AS email_captures,
  count(DISTINCT user_id) FILTER (WHERE name = 'email_verified')   AS verified,
  count(DISTINCT user_id) FILTER (WHERE name = 'paywall_viewed')   AS paywall_views,
  count(DISTINCT user_id) FILTER (WHERE name = 'checkout_started')  AS checkouts_started,
  count(DISTINCT user_id) FILTER (WHERE name = 'payment_succeeded') AS payments
FROM events
GROUP BY 1
ORDER BY 1 DESC;

-- Weekly cohorts keyed on the week a founder captured her email (from the users table,
-- authoritative). size / verified / paid — the core retention-to-revenue shape.
CREATE OR REPLACE VIEW v_cohort_weekly AS
SELECT
  date_trunc('week', email_captured_at)::date AS cohort_week,
  count(*)                                       AS cohort_size,
  count(*) FILTER (WHERE verified_at IS NOT NULL) AS verified,
  count(*) FILTER (WHERE subscribed)              AS paid
FROM users
WHERE email_captured_at IS NOT NULL
GROUP BY 1
ORDER BY 1 DESC;

-- UTM performance (сквозная ad → revenue): first-touch source/campaign → captures,
-- verified, paid, and summed revenue. Revenue is pre-aggregated per user to avoid the
-- LEFT JOIN inflating the user counts.
CREATE OR REPLACE VIEW v_utm_performance AS
WITH pay AS (
  SELECT user_id, sum((props->>'amountCents')::bigint) AS revenue_cents
  FROM events WHERE name = 'payment_succeeded' AND user_id IS NOT NULL
  GROUP BY user_id
)
SELECT
  coalesce(u.utm_first->>'source', '(none)')   AS source,
  coalesce(u.utm_first->>'campaign', '(none)') AS campaign,
  count(*)                                        AS captures,
  count(*) FILTER (WHERE u.verified_at IS NOT NULL) AS verified,
  count(*) FILTER (WHERE u.subscribed)              AS paid,
  coalesce(sum(pay.revenue_cents), 0)               AS revenue_cents
FROM users u
LEFT JOIN pay ON pay.user_id = u.id
WHERE u.email_captured_at IS NOT NULL
GROUP BY 1, 2
ORDER BY revenue_cents DESC;

-- Per-user journey: the key milestone timestamps, for eyeballing individual paths in alpha.
CREATE OR REPLACE VIEW v_user_journey AS
SELECT
  u.id AS user_id,
  u.email,
  u.email_captured_at AS captured_at,
  u.verified_at,
  (SELECT min(created_at) FROM events e WHERE e.user_id = u.id AND e.name = 'lesson_opened')     AS first_lesson_at,
  (SELECT min(created_at) FROM events e WHERE e.user_id = u.id AND e.name = 'paywall_viewed')    AS first_paywall_at,
  (SELECT min(created_at) FROM events e WHERE e.user_id = u.id AND e.name = 'payment_succeeded') AS paid_at,
  u.subscribed,
  u.utm_first->>'source' AS utm_source
FROM users u
WHERE u.email_captured_at IS NOT NULL OR u.verified_at IS NOT NULL
ORDER BY u.id DESC;
