-- 0007 — admin panel access flag (SPEC_ADMIN_PANEL §1). is_admin gates api/admin.ts, which
-- returns other users' data; the flag is the only access control (no secret-in-URL). Idempotent.
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_admin boolean DEFAULT false;

-- Grant the one admin. Re-running is safe (sets true again). Add more admins here later.
UPDATE users SET is_admin = true WHERE email = 'sk@affina.space';
