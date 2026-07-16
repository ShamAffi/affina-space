#!/usr/bin/env node
// Versioned migration runner (audit P9) — replaces the ad-hoc, hand-run scripts/add-*.mjs.
// Applies migrations/*.sql in filename order, exactly once each, tracked in a _migrations
// history table with a content checksum. Idempotent + headless (no TTY, unlike
// drizzle-kit push): safe to run repeatedly, in CI, or against prod.
//
//   npm run migrate            # apply all pending migrations
//   DATABASE_URL=... npm run migrate
//
// Conventions:
//   • one file per change, NNNN_description.sql, numbers strictly increasing
//   • every statement idempotent (IF NOT EXISTS / ADD COLUMN IF NOT EXISTS)
//   • migrations are IMMUTABLE once applied — to change schema, add a NEW file
import { neon } from '@neondatabase/serverless';
import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import crypto from 'node:crypto';

const here = dirname(fileURLToPath(import.meta.url));
const migrationsDir = join(here, '..', 'migrations');

function resolveDatabaseUrl() {
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL;
  try {
    const env = readFileSync(join(here, '..', '.env.local'), 'utf8');
    const m = env.match(/^DATABASE_URL=(.+)$/m);
    if (m) return m[1].trim().replace(/^["']|["']$/g, '');
  } catch { /* no .env.local — fall through */ }
  return null;
}

const url = resolveDatabaseUrl();
if (!url) {
  console.error('✗ DATABASE_URL not set (checked env var and .env.local).');
  process.exit(1);
}
const sql = neon(url);

// Split a migration file into individual statements. Full-line SQL comments are stripped
// first; our DDL never contains a ';' inside a string literal, so a naive split is safe.
function statementsOf(raw) {
  return raw
    .replace(/^\s*--.*$/gm, '')
    .split(';')
    .map((s) => s.trim())
    .filter(Boolean);
}

await sql`CREATE TABLE IF NOT EXISTS _migrations (
  name       TEXT PRIMARY KEY,
  checksum   TEXT NOT NULL,
  applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
)`;

const appliedRows = await sql`SELECT name, checksum FROM _migrations`;
const applied = new Map(appliedRows.map((r) => [r.name, r.checksum]));

const files = readdirSync(migrationsDir).filter((f) => f.endsWith('.sql')).sort();
if (files.length === 0) {
  console.log('No .sql migrations found in migrations/.');
  process.exit(0);
}

let appliedCount = 0;
for (const file of files) {
  const raw = readFileSync(join(migrationsDir, file), 'utf8');
  const checksum = crypto.createHash('sha256').update(raw).digest('hex').slice(0, 16);

  if (applied.has(file)) {
    if (applied.get(file) !== checksum) {
      console.warn(`⚠ ${file}: already applied but content changed since — migrations are immutable, add a NEW file instead of editing this one.`);
    }
    continue;
  }

  const statements = statementsOf(raw);
  process.stdout.write(`▶ ${file} — ${statements.length} statement(s)… `);
  try {
    for (const stmt of statements) await sql.query(stmt);
  } catch (err) {
    console.log('FAILED');
    console.error(`✗ ${file} failed (not recorded — fix and re-run):`, err instanceof Error ? err.message : err);
    process.exit(1);
  }
  await sql`INSERT INTO _migrations (name, checksum) VALUES (${file}, ${checksum})`;
  appliedCount++;
  console.log('done');
}

console.log(appliedCount ? `✓ applied ${appliedCount} migration(s).` : '✓ already up to date.');
