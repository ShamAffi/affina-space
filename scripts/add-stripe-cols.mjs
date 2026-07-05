// One-off migration: Stripe subscription columns (SPEC_STRIPE §5).
// Run once against prod Neon:  node scripts/add-stripe-cols.mjs
import { neon } from '@neondatabase/serverless';
import { readFileSync } from 'node:fs';

const env = readFileSync(new URL('../.env.local', import.meta.url), 'utf8');
const url = env.match(/^DATABASE_URL=(.+)$/m)?.[1]?.trim().replace(/^["']|["']$/g, '');
if (!url) throw new Error('DATABASE_URL not found in .env.local');

const sql = neon(url);
await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT`;
await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT`;
await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_status TEXT`;
await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS current_period_end TIMESTAMPTZ`;
console.log('✓ users stripe columns ready');
