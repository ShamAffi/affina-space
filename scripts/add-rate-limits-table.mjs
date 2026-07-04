// One-off migration: (re)create the rate_limits table used by src/server/ratelimit.ts.
// Schema per SPEC_API_HARDENING §2: (key text PK, window_start timestamptz, count int).
// Run against prod Neon:  node scripts/add-rate-limits-table.mjs
// Safe pre-launch: the table only holds transient counters (no user data), so we
// DROP + CREATE to guarantee the exact shape. (drizzle-kit push needs a TTY and
// fails headless — this is the repo's node-script pattern.)
import { neon } from '@neondatabase/serverless';
import { readFileSync } from 'node:fs';

const env = readFileSync(new URL('../.env.local', import.meta.url), 'utf8');
const url = env.match(/^DATABASE_URL=(.+)$/m)?.[1]?.trim().replace(/^["']|["']$/g, '');
if (!url) throw new Error('DATABASE_URL not found in .env.local');

const sql = neon(url);
await sql`DROP TABLE IF EXISTS rate_limits`;
await sql`
  CREATE TABLE rate_limits (
    key          TEXT PRIMARY KEY,
    window_start TIMESTAMPTZ NOT NULL,
    count        INTEGER NOT NULL DEFAULT 0
  )
`;
const [{ n }] = await sql`SELECT count(*)::int AS n FROM rate_limits`;
console.log(`✓ rate_limits table ready — schema (key, window_start, count), rows: ${n}`);
