// One-off migration: create the auth_tokens table for magic-link auth (SPEC_RESEND_AUTH §5).
// Run once against prod Neon:  node scripts/add-auth-tokens-table.mjs
// (drizzle-kit push needs a TTY and fails headless — repo node-script pattern.)
import { neon } from '@neondatabase/serverless';
import { readFileSync } from 'node:fs';

const env = readFileSync(new URL('../.env.local', import.meta.url), 'utf8');
const url = env.match(/^DATABASE_URL=(.+)$/m)?.[1]?.trim().replace(/^["']|["']$/g, '');
if (!url) throw new Error('DATABASE_URL not found in .env.local');

const sql = neon(url);
await sql`
  CREATE TABLE IF NOT EXISTS auth_tokens (
    id          SERIAL PRIMARY KEY,
    email       TEXT NOT NULL,
    token_hash  TEXT NOT NULL,
    expires_at  TIMESTAMP NOT NULL,
    used_at     TIMESTAMP,
    created_at  TIMESTAMP DEFAULT now()
  )
`;
await sql`CREATE INDEX IF NOT EXISTS auth_tokens_token_hash_idx ON auth_tokens (token_hash)`;
const [{ n }] = await sql`SELECT count(*)::int AS n FROM auth_tokens`;
console.log(`✓ auth_tokens table ready — schema (id, email, token_hash, expires_at, used_at, created_at), rows: ${n}`);
