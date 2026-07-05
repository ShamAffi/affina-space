// One-off migration: users.country / city / timezone (onboarding location + 11:00-local sends).
// Run once against prod Neon:  node scripts/add-location-timezone.mjs
import { neon } from '@neondatabase/serverless';
import { readFileSync } from 'node:fs';

const env = readFileSync(new URL('../.env.local', import.meta.url), 'utf8');
const url = env.match(/^DATABASE_URL=(.+)$/m)?.[1]?.trim().replace(/^["']|["']$/g, '');
if (!url) throw new Error('DATABASE_URL not found in .env.local');

const sql = neon(url);
await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS country  TEXT DEFAULT ''`;
await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS city     TEXT DEFAULT ''`;
await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS timezone TEXT DEFAULT ''`;
console.log('✓ users.country, city, timezone ready');
