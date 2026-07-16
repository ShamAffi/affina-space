import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { and, eq } from 'drizzle-orm';
import { emailLog } from '../db/schema.js';
import { sendEmail } from './email.js';

// email_log = idempotency + analytics for user-scoped emails (SPEC_EMAILS §4). Lives
// in src/server/ (Vercel 12-function cap). Every helper is fire-and-forget — a DB
// hiccup here must never fail the request or the cron sweep. `weekOf` is the dedup
// window key: the week string for weeklies, a sentinel ('once') or session id for
// once-only emails (never NULL, so dedup is exact).

type Mail = { to: string; subject: string; html: string };

function db() {
  return drizzle(neon(process.env.DATABASE_URL!), { schema: { emailLog } });
}

export async function alreadyLogged(userId: number, type: string, weekOf: string): Promise<boolean> {
  try {
    const rows = await db()
      .select({ id: emailLog.id })
      .from(emailLog)
      .where(and(eq(emailLog.userId, userId), eq(emailLog.type, type), eq(emailLog.weekOf, weekOf)))
      .limit(1);
    return rows.length > 0;
  } catch (err) {
    console.error('[emailLog] check failed (treating as not-sent):', err);
    return false;
  }
}

export async function logEmail(userId: number, type: string, weekOf = 'once'): Promise<void> {
  try {
    await db().insert(emailLog).values({ userId, type, weekOf });
  } catch (err) {
    console.error('[emailLog] insert failed:', err);
  }
}

/**
 * Send a user-scoped email at most ONCE per (userId, type, weekOf) window.
 * audit F30 — CLAIM-then-send: insert the log row FIRST (unique index → ON CONFLICT DO
 * NOTHING); only send if WE claimed it. This is atomic (no double-send under concurrency)
 * AND survives a failing send without re-sending (the claim is already recorded). Returns
 * true if it sent, false if it was already claimed (deduped) or the claim failed.
 */
export async function sendOnce(userId: number, type: string, weekOf: string, mail: Mail): Promise<boolean> {
  let claimed = false;
  try {
    const r = await db().insert(emailLog).values({ userId, type, weekOf })
      .onConflictDoNothing().returning({ id: emailLog.id });
    claimed = r.length > 0;
  } catch (err) {
    console.error('[emailLog] claim failed (not sending):', err);
    return false;
  }
  if (!claimed) return false; // already sent — deduped
  await sendEmail(mail);
  return true;
}
