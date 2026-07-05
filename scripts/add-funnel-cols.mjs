// One-off migration: onboarding-funnel columns (SPEC_ONBOARDING_FUNNEL §2/§3).
//   users.email_captured_at — set at email capture; drives the finish-sequence clock.
//   users.onboarding_report — persisted OnboardingScore (day-0 email + /report page).
// Run once against prod Neon:  node scripts/add-funnel-cols.mjs
import { neon } from '@neondatabase/serverless';
import { readFileSync } from 'node:fs';

const env = readFileSync(new URL('../.env.local', import.meta.url), 'utf8');
const url = env.match(/^DATABASE_URL=(.+)$/m)?.[1]?.trim().replace(/^["']|["']$/g, '');
if (!url) throw new Error('DATABASE_URL not found in .env.local');

const sql = neon(url);
await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS email_captured_at TIMESTAMPTZ`;
await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS onboarding_report JSONB`;
console.log('✓ users.email_captured_at + users.onboarding_report ready');
