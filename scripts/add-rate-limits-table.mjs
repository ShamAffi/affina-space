// One-off migration: create the rate_limits table used by src/server/ratelimit.ts.
// Run once against prod Neon:  node scripts/add-rate-limits-table.mjs
// (drizzle-kit push needs a TTY and fails headless — this is the repo's node-script pattern.)
import { neon } from '@neondatabase/serverless';
import { readFileSync } from 'node:fs';

const env = readFileSync(new URL('../.env.local', import.meta.url), 'utf8');
const url = env.match(/^DATABASE_URL=(.+)$/m)?.[1]?.trim().replace(/^["']|["']$/g, '');
if (!url) throw new Error('DATABASE_URL not found in .env.local');

const sql = neon(url);
await sql`
  CREATE TABLE IF NOT EXISTS rate_limits (
    bucket_key     TEXT PRIMARY KEY,
    window_seconds INTEGER NOT NULL,
    count          INTEGER NOT NULL DEFAULT 0,
    window_start   BIGINT  NOT NULL
  )
`;
const [{ n }] = await sql`SELECT count(*)::int AS n FROM rate_limits`;
console.log(`✓ rate_limits table ready (rows: ${n})`);
