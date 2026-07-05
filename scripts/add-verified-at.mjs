// One-off migration: users.verified_at (AMENDMENT 2026-07-05 — null = pending, set on
// first magic-link verification). Run once against prod Neon:  node scripts/add-verified-at.mjs
import { neon } from '@neondatabase/serverless';
import { readFileSync } from 'node:fs';

const env = readFileSync(new URL('../.env.local', import.meta.url), 'utf8');
const url = env.match(/^DATABASE_URL=(.+)$/m)?.[1]?.trim().replace(/^["']|["']$/g, '');
if (!url) throw new Error('DATABASE_URL not found in .env.local');

const sql = neon(url);
await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS verified_at TIMESTAMPTZ`;
console.log('✓ users.verified_at ready');
