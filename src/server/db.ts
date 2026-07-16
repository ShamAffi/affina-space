import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from '../db/schema.js';

// One DB client for every /api handler (audit P2). Replaces the getDb() that was
// copy-pasted into 11 handlers, each with a hand-maintained schema subset that could
// drift. neon-http is stateless (each query is its own HTTP round-trip), so a fresh
// client per invocation carries no connection cost. The full schema is passed so
// `db.query.<anyTable>` works from any handler without curating a per-file subset.
export function getDb() {
  return drizzle(neon(process.env.DATABASE_URL!), { schema });
}

export type Db = ReturnType<typeof getDb>;
