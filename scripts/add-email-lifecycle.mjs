// One-off migration: users.last_active_at column + email_log table (SPEC_EMAILS §4).
// Run once against prod Neon:  node scripts/add-email-lifecycle.mjs
// (drizzle-kit push needs a TTY and fails headless — repo node-script pattern.)
import { neon } from '@neondatabase/serverless';
import { readFileSync } from 'node:fs';

const env = readFileSync(new URL('../.env.local', import.meta.url), 'utf8');
const url = env.match(/^DATABASE_URL=(.+)$/m)?.[1]?.trim().replace(/^["']|["']$/g, '');
if (!url) throw new Error('DATABASE_URL not found in .env.local');

const sql = neon(url);
await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS last_active_at TIMESTAMP`;
await sql`
  CREATE TABLE IF NOT EXISTS email_log (
    id       SERIAL PRIMARY KEY,
    user_id  INTEGER REFERENCES users(id) ON DELETE CASCADE,
    type     TEXT NOT NULL,
    week_of  TEXT NOT NULL DEFAULT 'once',
    sent_at  TIMESTAMP DEFAULT now()
  )
`;
await sql`CREATE INDEX IF NOT EXISTS email_log_dedup_idx ON email_log (user_id, type, week_of)`;
const [{ n }] = await sql`SELECT count(*)::int AS n FROM email_log`;
console.log(`✓ users.last_active_at + email_log ready (email_log rows: ${n})`);
