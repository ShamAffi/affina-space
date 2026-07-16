import type { VercelRequest, VercelResponse } from '@vercel/node';
import { eq, and, ne, sql } from 'drizzle-orm';
import { getDb } from '../src/server/db.js';
import { safeEqual } from '../src/server/env.js';
import { captureError } from '../src/server/observability.js';
import { users, tasks, completedLessons } from '../src/db/schema.js';
import { MODULES } from '../src/data.js';
import { sendOnce, alreadyLogged, logEmail } from '../src/server/emailLog.js';
import {
  weeklyTasksEmail, reflectionEmail, bookMentorEmail, reengagementEmail,
  finish1Email, finish2Email, finish3Email, reportReadyEmail, sendEmail,
} from '../src/server/email.js';
import { createMagicLink } from '../src/server/magicLink.js';

// Lifecycle-email sweep (SPEC_EMAILS §3 + AMENDMENT §C + SPEC_ONBOARDING_FUNNEL §4).
// Driven HOURLY by GitHub Actions (Vercel Hobby caps cron at daily). Branches on state:
//   PENDING (verifiedAt null):
//     • Day-0 report-ready (#12) — ELAPSED-TIME trigger: once, when now-emailCapturedAt
//       ≥ 1h. NOT gated to 11:00 (runs any hourly tick). CTA → verify + /report.
//     • Finish chain (#9/#10/#11) — by age since emailCapturedAt (+1d/+3d/+7d), each once,
//       at the user's LOCAL 11:00, then stop. Verifying stops the whole sequence.
//   REGISTERED (verifiedAt set) → the existing #5–#8 lifecycle (weekly/reflection/
//     book-mentor / re-engagement) at LOCAL 11:00 — never runs for pending users.
// Protected by CRON_SECRET. Dedup via email_log. Test hooks: ?day/?hour/?dry=1/?only.

const DAY_MS = 86_400_000;
const HOUR_MS = 3_600_000;
const ACTIVE_WINDOW_MS = 14 * DAY_MS;
const FINISH_TTL_MS = 14 * DAY_MS; // finish-email magic links live long enough to sit in an inbox
const SEND_HOUR = 11; // 11:00 local
const RECOVERY_NEXT = '/report'; // recovery emails verify + land on the interactive report page
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
  // §3 — CRON_SECRET gate. GitHub Actions / manual runs send `Authorization: Bearer <secret>`
  // (or ?secret=).
  const auth = req.headers.authorization;
  const provided = (auth?.startsWith('Bearer ') ? auth.slice(7) : '') || (req.query.secret as string) || '';
  // Constant-time compare (audit F15); safeEqual returns false when CRON_SECRET is unset → fail closed.
  if (!safeEqual(provided, process.env.CRON_SECRET)) return res.status(401).json({ error: 'unauthorized' });

  const now = new Date();
  const forcedDay = req.query.day !== undefined ? Number(req.query.day) : null;
  const forcedHour = req.query.hour !== undefined ? Number(req.query.hour) : null;
  const dry = req.query.dry === '1';
  const only = typeof req.query.only === 'string' ? req.query.only : undefined;

  const db = getDb();

  // Maintenance sweep (audit F33): rate_limits + auth_tokens grow without bound from
  // attacker-controlled keys and one-time magic-link tokens. This hourly cron is the
  // natural GC point. Best-effort — cleanup must never break the email sweep. A stale
  // rate_limits row is safe to drop: the next hit for that key re-inserts a fresh window.
  if (!dry) {
    try {
      await db.execute(sql`DELETE FROM rate_limits WHERE window_start < now() - interval '2 days'`);
      await db.execute(sql`DELETE FROM auth_tokens WHERE used_at IS NOT NULL OR expires_at < now()`);
    } catch (err) {
      captureError(err, { endpoint: 'cron', mode: 'sweep' });
    }
  }

  let allUsers = await db.query.users.findMany();
  if (only) allUsers = allUsers.filter((u) => u.email === only);

  const summary: { email: string; tz: string; state: string; active?: boolean; sent: string[]; skipped: string[] }[] = [];

  for (const u of allUsers) {
    const tz = u.timezone?.trim() || 'UTC';
    const local = localParts(now, tz);
    const hour = forcedHour ?? local.hour;
    const dow = forcedDay ?? local.dow;

    const sent: string[] = [];
    const skipped: string[] = [];
    const mark = (label: string, ok: boolean) => (ok ? sent : skipped).push(label);

    if (!u.verifiedAt) {
      // ── PENDING → day-0 report (elapsed) + finish chain (11:00). No #5–#8. ──────
      // Funnel: the clock starts at emailCapturedAt (fallback createdAt for legacy rows).
      const clock = (u.emailCapturedAt ?? u.createdAt) as Date | null;
      const sinceMs = clock ? now.getTime() - new Date(clock).getTime() : 0;

      // Day-0 report-ready (#12): once, ≥1h after capture, at ANY hour (elapsed trigger).
      if (u.emailCapturedAt && sinceMs >= HOUR_MS) {
        if (dry) mark('report_ready', true);
        else if (await alreadyLogged(u.id, 'report_ready', 'once')) mark('report_ready', false);
        else {
          const link = await createMagicLink(u.email, FINISH_TTL_MS, RECOVERY_NEXT);
          await sendEmail(reportReadyEmail(u.email, link));
          await logEmail(u.id, 'report_ready', 'once');
          mark('report_ready', true);
        }
      }

      // Finish nudges (#9/#10/#11): LOCAL 11:00 only, by age since capture, each once.
      if (hour === SEND_HOUR) {
        const ageDays = sinceMs / DAY_MS;
        const stage =
          ageDays >= 7 ? { type: 'finish_7', build: finish3Email }
          : ageDays >= 3 ? { type: 'finish_3', build: finish2Email }
          : ageDays >= 1 ? { type: 'finish_1', build: finish1Email }
          : null;
        if (stage) {
          if (dry) mark(stage.type, true);
          else if (await alreadyLogged(u.id, stage.type, 'once')) mark(stage.type, false);
          else {
            const link = await createMagicLink(u.email, FINISH_TTL_MS, RECOVERY_NEXT); // verify + /report
            await sendEmail(stage.build(u.email, link));
            await logEmail(u.id, stage.type, 'once');
            mark(stage.type, true);
          }
        }
      }
      if (sent.length || skipped.length) summary.push({ email: u.email, tz, state: 'pending', sent, skipped });
      continue;
    }

    // ── REGISTERED → existing #5–#8 lifecycle (LOCAL 11:00 only) ────────────────
    if (hour !== SEND_HOUR) continue;
    const active = !!u.lastActiveAt && now.getTime() - new Date(u.lastActiveAt).getTime() < ACTIVE_WINDOW_MS;
    const completed = await db.query.completedLessons.findMany({ where: eq(completedLessons.userId, u.id) });
    const completedIds = new Set(completed.map((c) => c.lessonId));
    const ms = (u.mentorSessions ?? null) as Record<string, { booked?: boolean }> | null;

    if (active) {
      if (dow === THURSDAY) {
        const open = await db.query.tasks.findMany({ where: and(eq(tasks.userId, u.id), ne(tasks.status, 'done')) });
        if (open.length >= 1) {
          const titles = open.slice(0, 5).map((t) => t.title);
          mark('weekly_tasks', dry ? true : await sendOnce(u.id, 'weekly_tasks', weekOf(now), weeklyTasksEmail(u.email, titles)));
        }
      }
      if (dow === SATURDAY) {
        mark('reflection', dry ? true : await sendOnce(u.id, 'reflection', weekOf(now), reflectionEmail(u.email)));
      }
      const dueSid = dueUnbookedSession(completedIds, ms);
      if (dueSid) {
        mark(`book_mentor:${dueSid}`, dry ? true : await sendOnce(u.id, 'book_mentor', dueSid, bookMentorEmail(u.email, dueSid)));
      }
    } else {
      // registered-only: a PENDING quiet user gets the finish chain above, never re-engagement
      const label = currentModuleLabel(completedIds);
      const line = (u.idea?.trim() || u.projectName?.trim() || 'your idea').slice(0, 120);
      mark('reengagement', dry ? true : await sendOnce(u.id, 'reengagement', 'once', reengagementEmail(u.email, label, line)));
    }

    summary.push({ email: u.email, tz, state: 'registered', active, sent, skipped });
  }

  return res.status(200).json({
    ok: true, sendHour: SEND_HOUR, forcedDay, forcedHour, dry, only: only ?? null,
    scanned: allUsers.length, acted: summary.length, summary,
  });
}
