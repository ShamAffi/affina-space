import { events } from '../db/schema.js';
import { eq, and, isNull } from 'drizzle-orm';
import type { Db } from './db.js';

// Server-truth analytics events (SPEC_ANALYTICS §5) — inserted directly by the server
// (email_verified, payment_succeeded, subscription_canceled), never via the client
// tracker. Uses the user's stored anonId so the event joins their trail; falls back to a
// server sentinel when there's none. Best-effort — analytics must never break the request.
export async function insertServerEvent(
  db: Db,
  userId: number,
  name: string,
  props?: Record<string, unknown>,
  anonId?: string | null,
): Promise<void> {
  try {
    await db.insert(events).values({ anonId: anonId || `server:${userId}`, userId, name, props: props ?? {} });
  } catch { /* best-effort */ }
}

// Join same-device pre-auth events to a user (identity stitching, §4).
export async function backfillEvents(db: Db, anonId: string, userId: number): Promise<void> {
  try {
    await db.update(events).set({ userId }).where(and(eq(events.anonId, anonId), isNull(events.userId)));
  } catch { /* best-effort */ }
}
