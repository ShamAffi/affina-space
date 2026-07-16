# Migrations

Versioned, idempotent SQL migrations applied by `npm run migrate` (`scripts/migrate.mjs`).
Replaces the old hand-run `scripts/add-*.mjs` one-offs (audit P9): those had no ordering,
no history, and no way to know what had run against prod.

## Run

```bash
npm run migrate                       # DATABASE_URL from env, else .env.local
DATABASE_URL=postgres://… npm run migrate
```

Idempotent + headless (no TTY, unlike `drizzle-kit push`): safe to run repeatedly, in CI,
or against prod. Each file runs **exactly once**; applied files are recorded in a
`_migrations` table with a content checksum, and skipped thereafter.

## Add a migration

1. Create `NNNN_short_description.sql` — next number, strictly increasing.
2. Make every statement idempotent: `CREATE TABLE IF NOT EXISTS`,
   `ALTER TABLE … ADD COLUMN IF NOT EXISTS`, `CREATE INDEX IF NOT EXISTS`.
3. Update `src/db/schema.ts` in the same change so the Drizzle ORM matches the DB.
4. `npm run migrate`.

## Rules

- **Migrations are immutable.** Once a file is recorded in `_migrations`, never edit it —
  the runner warns on a checksum mismatch. To change schema, add a NEW file.
- `0000_baseline.sql` is the complete schema as of adopting the runner: a no-op on the
  live prod DB (everything already exists), a full bootstrap on a fresh DB.
- One statement per `;`; do not put a `;` inside a string literal (fine for DDL).
- The old `scripts/add-*.mjs` are kept only as history — they are superseded by
  `0000_baseline.sql` and should not be run.
