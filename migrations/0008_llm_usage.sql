-- 0008 — persist Claude token usage per call (admin per-user token calculator). callClaude
-- already logs a usage line; this stores it so the admin panel can total tokens per founder.
-- email is nullable (pre-auth onboarding calls have no user); attribution joins on users.email.
CREATE TABLE IF NOT EXISTS llm_usage (
  id                    bigserial PRIMARY KEY,
  email                 text,
  endpoint              text,
  mode                  text,
  model                 text,
  input_tokens          integer NOT NULL DEFAULT 0,
  output_tokens         integer NOT NULL DEFAULT 0,
  cache_read_tokens     integer NOT NULL DEFAULT 0,
  cache_creation_tokens integer NOT NULL DEFAULT 0,
  created_at            timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS llm_usage_email_idx ON llm_usage(email);
