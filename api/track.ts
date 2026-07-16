import type { VercelRequest, VercelResponse } from '@vercel/node';
import { z } from 'zod';
import { applyCors } from '../src/server/http.js';
import { checkTrackLimit } from '../src/server/ratelimit.js';
import { readSession } from '../src/server/session.js';
import { getDb } from '../src/server/db.js';
import { events, users } from '../src/db/schema.js';
import { eq } from 'drizzle-orm';

// Analytics ingestion (SPEC_ANALYTICS §3). Pre-auth by design — the funnel is anonymous.
// The client sends its anonId; the userId is resolved SERVER-SIDE from the session cookie
// ONLY (never trusted from the body). Everything is best-effort: a bad/oversized/blocked
// request returns 204 and drops the batch — analytics must never error the client.
const BatchSchema = z.object({
  anonId: z.string().min(1).max(80),
  events: z.array(z.object({
    name: z.string().min(1).max(64),
    props: z.record(z.string(), z.unknown()).optional(),
    path: z.string().max(400).optional(),
    referrer: z.string().max(600).optional(),
  })).max(20),
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (applyCors(req, res, 'POST,OPTIONS')) return;
  if (req.method !== 'POST') return res.status(405).end();

  // IP rate-limited (generous); over budget → silently drop.
  if (!(await checkTrackLimit(req))) return res.status(204).end();

  const parsed = BatchSchema.safeParse(req.body ?? {});
  if (!parsed.success || parsed.data.events.length === 0) return res.status(204).end();
  const { anonId, events: evs } = parsed.data;

  // userId — SERVER-SIDE only (session cookie), never from the client.
  let userId: number | null = null;
  try {
    const sessionEmail = readSession(req);
    if (sessionEmail) {
      const u = await getDb().query.users.findFirst({
        where: eq(users.email, sessionEmail.trim().toLowerCase()),
        columns: { id: true },
      });
      userId = u?.id ?? null;
    }
  } catch { /* anonymous is fine */ }

  try {
    const rows = evs.map((e) => {
      let props: unknown = e.props ?? null;
      try { if (props && JSON.stringify(props).length > 2048) props = { _dropped: 'oversize' }; } catch { props = null; }
      return { anonId, userId, name: e.name, props, path: e.path ?? null, referrer: e.referrer ?? null };
    });
    await getDb().insert(events).values(rows);
  } catch { /* insertion failure must never surface to the client */ }

  return res.status(204).end();
}
