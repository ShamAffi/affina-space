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
 * Checks email_log first, then sends + records. Returns true if it sent, false if
 * it was already sent (deduped). Cron runs once/day single-threaded, so the
 * check-then-write is race-free in practice.
 */
export async function sendOnce(userId: number, type: string, weekOf: string, mail: Mail): Promise<boolean> {
  if (await alreadyLogged(userId, type, weekOf)) return false;
  await sendEmail(mail);
  await logEmail(userId, type, weekOf);
  return true;
}
