-- 0002 — mentor_requests (SPEC_MENTOR_REQUEST §2). Replaces the mailto booking;
-- feeds the future admin panel. Written only via the session-authed PATCH in api/user.ts.
CREATE TABLE IF NOT EXISTS mentor_requests (
  id         SERIAL PRIMARY KEY,
  user_id    INTEGER REFERENCES users(id) ON DELETE CASCADE,
  session    TEXT NOT NULL,
  topic      TEXT NOT NULL,
  status     TEXT NOT NULL DEFAULT 'new',
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS mentor_requests_user_id_idx ON mentor_requests (user_id);
CREATE INDEX IF NOT EXISTS mentor_requests_status_idx ON mentor_requests (status);
