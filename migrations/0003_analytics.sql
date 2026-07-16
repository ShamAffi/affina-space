-- 0003 — first-party analytics (SPEC_ANALYTICS §1). events table + user attribution cols.
ALTER TABLE users ADD COLUMN IF NOT EXISTS anon_id   TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS utm_first JSONB;
ALTER TABLE users ADD COLUMN IF NOT EXISTS utm_last  JSONB;

CREATE TABLE IF NOT EXISTS events (
  id         BIGSERIAL PRIMARY KEY,
  anon_id    TEXT NOT NULL,
  user_id    INTEGER,
  name       TEXT NOT NULL,
  props      JSONB,
  path       TEXT,
  referrer   TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS events_user_created_idx ON events (user_id, created_at);
CREATE INDEX IF NOT EXISTS events_anon_idx ON events (anon_id);
CREATE INDEX IF NOT EXISTS events_name_created_idx ON events (name, created_at);
-- backfill join by anonId (stitching) hits this a lot:
CREATE INDEX IF NOT EXISTS events_anon_user_idx ON events (anon_id, user_id);
