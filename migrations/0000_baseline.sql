-- 0000_baseline — the complete schema as of adopting the migration runner (audit P9).
-- Mirrors src/db/schema.ts + the raw tables (rate_limits, auth_tokens, email_log).
-- Every statement is idempotent (IF NOT EXISTS), so running it against the LIVE prod DB
-- is a safe no-op, and running it against a FRESH DB bootstraps the whole schema. The
-- older one-off scripts/add-*.mjs are superseded by this file (kept only as history).

CREATE TABLE IF NOT EXISTS users (
  id                     SERIAL PRIMARY KEY,
  email                  TEXT NOT NULL UNIQUE,
  name                   TEXT DEFAULT '',
  project_name           TEXT DEFAULT '',
  idea                   TEXT DEFAULT '',
  customer               TEXT DEFAULT '',
  business_model         TEXT DEFAULT '',
  stage                  TEXT DEFAULT '',
  goal                   TEXT DEFAULT '',
  country                TEXT DEFAULT '',
  city                   TEXT DEFAULT '',
  timezone               TEXT DEFAULT '',
  score                  INTEGER DEFAULT 0,
  phase                  TEXT DEFAULT 'launch',
  launch_validated_at    TIMESTAMP,
  growth_xp              INTEGER DEFAULT 0,
  north_star             JSONB,
  pulse_streak           INTEGER DEFAULT 0,
  last_check_in_at       TIMESTAMP,
  last_active_at         TIMESTAMP,
  momentum_card          JSONB,
  last_readiness_gain    JSONB,
  snapshot               JSONB,
  snapshot_history       JSONB,
  mentor_sessions        JSONB,
  subscribed             BOOLEAN DEFAULT false,
  stripe_customer_id     TEXT,
  stripe_subscription_id TEXT,
  subscription_status    TEXT,
  current_period_end     TIMESTAMPTZ,
  verified_at            TIMESTAMPTZ,
  email_captured_at      TIMESTAMPTZ,
  onboarding_report      JSONB,
  created_at             TIMESTAMP DEFAULT now(),
  updated_at             TIMESTAMP DEFAULT now()
);

CREATE TABLE IF NOT EXISTS lesson_inputs (
  id         SERIAL PRIMARY KEY,
  user_id    INTEGER REFERENCES users(id) ON DELETE CASCADE,
  lesson_id  TEXT NOT NULL,
  content    TEXT DEFAULT '',
  updated_at TIMESTAMP DEFAULT now(),
  UNIQUE (user_id, lesson_id)
);

CREATE TABLE IF NOT EXISTS completed_lessons (
  id           SERIAL PRIMARY KEY,
  user_id      INTEGER REFERENCES users(id) ON DELETE CASCADE,
  lesson_id    TEXT NOT NULL,
  completed_at TIMESTAMP DEFAULT now(),
  UNIQUE (user_id, lesson_id)
);

CREATE TABLE IF NOT EXISTS brain_entries (
  id               SERIAL PRIMARY KEY,
  user_id          INTEGER REFERENCES users(id) ON DELETE CASCADE,
  lesson_id        TEXT NOT NULL,
  lesson_title     TEXT NOT NULL,
  prompt           TEXT NOT NULL,
  content          TEXT NOT NULL DEFAULT '',
  entry_type       TEXT NOT NULL,
  processed_by_ai  BOOLEAN DEFAULT false,
  ai_score         INTEGER,
  ai_feedback      TEXT,
  user_draft       TEXT,
  ai_draft         TEXT,
  created_at       TIMESTAMP DEFAULT now(),
  updated_at       TIMESTAMP DEFAULT now(),
  UNIQUE (user_id, lesson_id)
);

CREATE TABLE IF NOT EXISTS tasks (
  id                SERIAL PRIMARY KEY,
  user_id           INTEGER REFERENCES users(id) ON DELETE CASCADE,
  source            TEXT NOT NULL,
  source_ref        TEXT,
  title             TEXT NOT NULL,
  instruction       TEXT NOT NULL,
  status            TEXT DEFAULT 'todo',
  priority          INTEGER DEFAULT 0,
  submission_text   TEXT,
  submission_files  JSONB,
  submission_data   JSONB,
  briefing          TEXT,
  ai_review         TEXT,
  linked_entry_type TEXT,
  created_at        TIMESTAMP DEFAULT now(),
  updated_at        TIMESTAMP DEFAULT now()
);

CREATE TABLE IF NOT EXISTS check_ins (
  id          SERIAL PRIMARY KEY,
  user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  week_of     TEXT NOT NULL,
  raw_text    TEXT,
  headline    TEXT,
  key_results JSONB,
  metrics     JSONB,
  activity    JSONB,
  sentiment   TEXT,
  mentor_note TEXT,
  created_at  TIMESTAMP DEFAULT now(),
  UNIQUE (user_id, week_of)
);

CREATE TABLE IF NOT EXISTS achievements (
  id         SERIAL PRIMARY KEY,
  user_id    INTEGER REFERENCES users(id) ON DELETE CASCADE,
  type       TEXT NOT NULL,
  value      TEXT,
  verified   BOOLEAN DEFAULT false,
  xp         INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT now()
);

CREATE TABLE IF NOT EXISTS delegations (
  id         SERIAL PRIMARY KEY,
  user_id    INTEGER REFERENCES users(id) ON DELETE CASCADE,
  lesson_id  TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT now()
);

CREATE TABLE IF NOT EXISTS modules_content (
  id    TEXT PRIMARY KEY,
  "order" INTEGER NOT NULL,
  title TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS lessons_content (
  id           TEXT PRIMARY KEY,
  module_id    TEXT REFERENCES modules_content(id) ON DELETE CASCADE,
  "order"      INTEGER NOT NULL,
  title        TEXT NOT NULL,
  type         TEXT NOT NULL,
  body         TEXT NOT NULL,
  input_prompt TEXT
);

CREATE TABLE IF NOT EXISTS rate_limits (
  key          TEXT PRIMARY KEY,
  window_start TIMESTAMPTZ NOT NULL,
  count        INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS auth_tokens (
  id         SERIAL PRIMARY KEY,
  email      TEXT NOT NULL,
  token_hash TEXT NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  used_at    TIMESTAMP,
  created_at TIMESTAMP DEFAULT now()
);
CREATE INDEX IF NOT EXISTS auth_tokens_token_hash_idx ON auth_tokens (token_hash);

CREATE TABLE IF NOT EXISTS email_log (
  id      SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  type    TEXT NOT NULL,
  week_of TEXT NOT NULL DEFAULT 'once',
  sent_at TIMESTAMP DEFAULT now()
);
CREATE INDEX IF NOT EXISTS email_log_dedup_idx ON email_log (user_id, type, week_of);
