import type { VercelRequest, VercelResponse } from '@vercel/node';
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { eq, and, ne } from 'drizzle-orm';
import { users, tasks, completedLessons } from '../src/db/schema.js';
import { MODULES } from '../src/data.js';
import { sendOnce } from '../src/server/emailLog.js';
import { weeklyTasksEmail, reflectionEmail, bookMentorEmail, reengagementEmail } from '../src/server/email.js';

// Lifecycle-email sweep (SPEC_EMAILS §3). Sends each lifecycle email at the user's
// LOCAL 11:00 (from users.timezone, browser-captured at onboarding). Driven HOURLY by
// a GitHub Actions workflow (Vercel Hobby caps cron at daily) — each run only acts on
// users whose local hour == 11 right now, so across a day everyone is hit at their 11:00.
// Protected by CRON_SECRET. Dedup via email_log (sendOnce): weeklies once/week,
// book-mentor once/session, re-engagement once ever.
// Test hooks (secret-gated): ?day=0..6 forces DOW, ?hour=0..23 forces local hour,
// ?dry=1 computes without sending, ?only=<email> scopes to one user.

function getDb() {
  return drizzle(neon(process.env.DATABASE_URL!), { schema: { users, tasks, completedLessons } });
}

const DAY_MS = 86_400_000;
const ACTIVE_WINDOW_MS = 14 * DAY_MS;
const SEND_HOUR = 11; // 11:00 local
const THURSDAY = 4;
const SATURDAY = 6;

// Local hour (0–23) + day-of-week (0=Sun) for an IANA timezone. Invalid tz → {-1,-1}
// so it never matches SEND_HOUR (that user is skipped rather than mis-timed).
function localParts(now: Date, tz: string): { hour: number; dow: number } {
  try {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: tz, hour: 'numeric', hour12: false, weekday: 'short',
    }).formatToParts(now);
    const hour = Number(parts.find((p) => p.type === 'hour')?.value ?? 'NaN');
    const wd = parts.find((p) => p.type === 'weekday')?.value ?? '';
    const DOW: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
    return { hour: hour === 24 ? 0 : hour, dow: DOW[wd] ?? -1 };
  } catch {
    return { hour: -1, dow: -1 };
  }
}

// Monday-anchored ISO week string (matches pulse getWeekOf) — the weekly dedup key.
function weekOf(d: Date): string {
  const x = new Date(d);
  const day = x.getUTCDay();
  x.setUTCDate(x.getUTCDate() - day + (day === 0 ? -6 : 1));
  return x.toISOString().split('T')[0];
}

// Which session (S1→S3) is due-but-unbooked: trigger module (mentorSessionAfter)
// fully complete AND the session not booked. Returns the first such, else null.
function dueUnbookedSession(
  completedIds: Set<string>,
  mentorSessions: Record<string, { booked?: boolean }> | null,
): string | null {
  for (const sid of ['S1', 'S2', 'S3']) {
    const mod = MODULES.find((m) => m.mentorSessionAfter === sid);
    if (!mod) continue;
    const complete = mod.lessons.every((l) => completedIds.has(l.id));
    if (complete && mentorSessions?.[sid]?.booked !== true) return sid;
  }
  return null;
}

// Re-engagement "Module X" = first module (in order) she hasn't fully finished.
function currentModuleLabel(completedIds: Set<string>): string {
  for (let i = 0; i < MODULES.length; i++) {
    if (!MODULES[i].lessons.every((l) => completedIds.has(l.id))) return `Module ${i}`;
  }
  return `Module ${MODULES.length - 1}`;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // §3 — CRON_SECRET gate. GitHub Actions / Vercel Cron send `Authorization: Bearer <secret>`;
  // manual runs can pass ?secret= instead.
  const secret = process.env.CRON_SECRET;
  const auth = req.headers.authorization;
  const provided = (auth?.startsWith('Bearer ') ? auth.slice(7) : '') || (req.query.secret as string) || '';
  if (!secret || provided !== secret) return res.status(401).json({ error: 'unauthorized' });

  const now = new Date();
  const forcedDay = req.query.day !== undefined ? Number(req.query.day) : null;
  const forcedHour = req.query.hour !== undefined ? Number(req.query.hour) : null;
  const dry = req.query.dry === '1';
  const only = typeof req.query.only === 'string' ? req.query.only : undefined;

  const db = getDb();
  let allUsers = await db.query.users.findMany();
  if (only) allUsers = allUsers.filter((u) => u.email === only);

  const summary: { email: string; tz: string; active: boolean; sent: string[]; skipped: string[] }[] = [];

  for (const u of allUsers) {
    const tz = u.timezone?.trim() || 'UTC'; // existing users w/o location default to UTC 11:00
    const local = localParts(now, tz);
    const hour = forcedHour ?? local.hour;
    const dow = forcedDay ?? local.dow;

    // Only act at the user's local 11:00. Cheap skip BEFORE the per-user DB queries.
    if (hour !== SEND_HOUR) continue;

    const active = !!u.lastActiveAt && now.getTime() - new Date(u.lastActiveAt).getTime() < ACTIVE_WINDOW_MS;
    const sent: string[] = [];
    const skipped: string[] = [];
    const mark = (label: string, ok: boolean) => (ok ? sent : skipped).push(label);

    const completed = await db.query.completedLessons.findMany({ where: eq(completedLessons.userId, u.id) });
    const completedIds = new Set(completed.map((c) => c.lessonId));
    const ms = (u.mentorSessions ?? null) as Record<string, { booked?: boolean }> | null;

    if (active) {
      // Thursday + ≥1 open task → weekly tasks (real titles, deterministic; none → nothing)
      if (dow === THURSDAY) {
        const open = await db.query.tasks.findMany({ where: and(eq(tasks.userId, u.id), ne(tasks.status, 'done')) });
        if (open.length >= 1) {
          const titles = open.slice(0, 5).map((t) => t.title);
          mark('weekly_tasks', dry ? true : await sendOnce(u.id, 'weekly_tasks', weekOf(now), weeklyTasksEmail(u.email, titles)));
        }
      }
      // Saturday → business-week reflection
      if (dow === SATURDAY) {
        mark('reflection', dry ? true : await sendOnce(u.id, 'reflection', weekOf(now), reflectionEmail(u.email)));
      }
      // mentor session due & unbooked → book-mentor nudge (once per session)
      const dueSid = dueUnbookedSession(completedIds, ms);
      if (dueSid) {
        mark(`book_mentor:${dueSid}`, dry ? true : await sendOnce(u.id, 'book_mentor', dueSid, bookMentorEmail(u.email, dueSid)));
      }
    } else {
      // ≥14 days inactive → re-engagement, once ever
      const label = currentModuleLabel(completedIds);
      const line = (u.idea?.trim() || u.projectName?.trim() || 'your idea').slice(0, 120);
      mark('reengagement', dry ? true : await sendOnce(u.id, 'reengagement', 'once', reengagementEmail(u.email, label, line)));
    }

    summary.push({ email: u.email, tz, active, sent, skipped });
  }

  return res.status(200).json({
    ok: true, sendHour: SEND_HOUR, forcedDay, forcedHour, dry, only: only ?? null,
    scanned: allUsers.length, acted: summary.length, summary,
  });
}
