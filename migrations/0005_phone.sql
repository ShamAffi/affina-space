-- 0005 — phone lead capture (SPEC_PHONE_CAPTURE §1). Written only via the session-authed
-- PATCH; the only egress is the hot-lead alert email to ADMIN_EMAIL.
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone        TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone_source TEXT;   -- 'guide' | 'paywall' (first wins)
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone_at     TIMESTAMPTZ;
