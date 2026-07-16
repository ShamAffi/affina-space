import type { VercelRequest, VercelResponse } from '@vercel/node';
import { applyCors } from '../src/server/http.js';
import { requireAuth } from '../src/server/requireAuth.js';
import { getDb } from '../src/server/db.js';
import { safeEqual } from '../src/server/env.js';
import { eq } from 'drizzle-orm';
import { users, lessonInputs, completedLessons, brainEntries, tasks, checkIns, achievements } from '../src/db/schema.js';
import { computeLaunchReadiness, computeGrowth, GROWTH_SEED_XP, onboardingSeed } from '../src/server/progressUtils.js';
import { MODULES } from '../src/data.js';
import { blockKind } from '../src/types.js';

// Theory lesson ids + checkpoint modules (M4/M9) resolved once from the program map
const THEORY_IDS = new Set(
  MODULES.flatMap((m) => m.lessons.filter((l) => blockKind(l) === 'theory').map((l) => l.id)),
);
const CHECKPOINT_MODULES = MODULES.filter((m) => m.mentorSessionAfter === 'S1' || m.mentorSessionAfter === 'S2');

type KR = { type: string; text: string; metric?: string };
type Metric = { name: string; value: number; delta: number };

// SPEC_TRACTION_WIDGET — deterministic Business-block source: the latest check-in's
// numbers/keyResults + the date of the most recent REAL business update (check-in
// with a win/milestone or a real metric, or an achievements row).
async function buildTraction(db: ReturnType<typeof getDb>, userId: number) {
  const [cis, achs] = await Promise.all([
    db.query.checkIns.findMany({ where: eq(checkIns.userId, userId) }),
    db.query.achievements.findMany({ where: eq(achievements.userId, userId) }),
  ]);
  const sorted = [...cis].sort((a, b) => b.weekOf.localeCompare(a.weekOf));
  const latest = sorted[0] ?? null;
  const latestCheckIn = latest
    ? {
        weekOf: latest.weekOf,
        metrics: (Array.isArray(latest.metrics) ? latest.metrics : []) as Metric[],
        keyResults: (Array.isArray(latest.keyResults) ? latest.keyResults : []) as KR[],
      }
    : null;

  const isBusinessCheckIn = (ci: typeof cis[number]) => {
    const krs = (Array.isArray(ci.keyResults) ? ci.keyResults : []) as KR[];
    const ms = (Array.isArray(ci.metrics) ? ci.metrics : []) as Metric[];
    return krs.some((k) => k.type === 'win' || k.type === 'milestone')
      || ms.some((m) => (m.value ?? 0) > 0 || (m.delta ?? 0) !== 0);
  };
  const dates: number[] = [];
  for (const ci of cis) if (isBusinessCheckIn(ci) && ci.createdAt) dates.push(new Date(ci.createdAt).getTime());
  for (const a of achs) if (a.createdAt) dates.push(new Date(a.createdAt).getTime());
  const lastBusinessUpdateAt = dates.length ? new Date(Math.max(...dates)).toISOString() : null;

  return { latestCheckIn, lastBusinessUpdateAt };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (applyCors(req, res, 'GET,POST,OPTIONS', 'Content-Type,X-Mentor-Secret')) return;

  // POST /api/progress — mentor validates launch, moves user to growth phase.
  // ADMIN surface (not a user session): gated by MENTOR_SECRET like api/cron.ts; it acts
  // on a specified user's row, so it legitimately takes the target email in the body (§7).
  if (req.method === 'POST') {
    const secret = req.headers['x-mentor-secret'];
    // Constant-time compare (audit F15); safeEqual returns false when MENTOR_SECRET is unset → fail closed.
    if (!safeEqual(typeof secret === 'string' ? secret : '', process.env.MENTOR_SECRET)) {
      return res.status(403).json({ error: 'forbidden' });
    }
    const { email } = req.body ?? {};
    if (!email) return res.status(400).json({ error: 'email required' });
    try {
      const db = getDb();
      const user = await db.query.users.findFirst({ where: eq(users.email, email) });
      if (!user) return res.status(404).json({ error: 'user not found' });
      if (user.phase === 'growth') {
        return res.status(200).json({ ok: true, phase: 'growth', alreadyValidated: true });
      }
      await db.update(users).set({
        phase: 'growth',
        launchValidatedAt: new Date(),
        growthXp: GROWTH_SEED_XP,
        updatedAt: new Date(),
      }).where(eq(users.id, user.id));
      return res.status(200).json({ ok: true, phase: 'growth', growthXp: GROWTH_SEED_XP, seedXp: GROWTH_SEED_XP });
    } catch (err) {
      console.error('validate-launch error', err);
      return res.status(500).json({ error: 'internal error' });
    }
  }

  if (req.method !== 'GET') return res.status(405).json({ error: 'method not allowed' });

  // GET — identity from the session cookie (§2), never a client param.
  const email = requireAuth(req, res);
  if (!email) return;

  try {
    const db = getDb();
    const user = await db.query.users.findFirst({ where: eq(users.email, email) });

    if (!user) {
      return res.status(200).json({
        phase: 'launch',
        launch: { readiness: 0, seed: 0, breakdown: null },
        completedLessons: [],
        lessonInputs: {},
      });
    }

    // §4 — activity signal for lifecycle emails. Throttle to ≤1 write/hour/user.
    const lastActive = user.lastActiveAt ? new Date(user.lastActiveAt).getTime() : 0;
    if (Date.now() - lastActive > 3_600_000) {
      await db.update(users).set({ lastActiveAt: new Date() }).where(eq(users.id, user.id));
    }

    const [completed, inputs] = await Promise.all([
      db.query.completedLessons.findMany({ where: eq(completedLessons.userId, user.id) }),
      db.query.lessonInputs.findMany({ where: eq(lessonInputs.userId, user.id) }),
    ]);

    const inputsMap: Record<string, string> = {};
    for (const row of inputs) inputsMap[row.lessonId] = row.content ?? '';

    const completedIds = completed.map((c) => c.lessonId);
    const phase = (user.phase ?? 'launch') as 'launch' | 'growth';

    if (phase === 'growth') {
      const growth = computeGrowth(user.growthXp ?? 0);
      const traction = await buildTraction(db, user.id);
      return res.status(200).json({
        phase: 'growth',
        growth,
        completedLessons: completedIds,
        lessonInputs: inputsMap,
        momentumCard: user.momentumCard ?? null,
        streak: user.pulseStreak ?? 0,
        lastCheckInAt: user.lastCheckInAt ?? null,
        lastReadinessGain: user.lastReadinessGain ?? null,
        northStar: user.northStar ?? null,
        mentorSessions: user.mentorSessions ?? null,
        subscribed: user.subscribed ?? false,
        ...traction,
      });
    }

    // launch phase — Launch Readiness v2 (§7): seed + lessons + exercises + field + checkpoints + traction
    const [brain, userTasks, userCheckIns] = await Promise.all([
      db.query.brainEntries.findMany({ where: eq(brainEntries.userId, user.id) }),
      db.query.tasks.findMany({ where: eq(tasks.userId, user.id) }),
      db.query.checkIns.findMany({ where: eq(checkIns.userId, user.id) }),
    ]);

    const doneSet = new Set(completedIds);
    const theoryDoneCount = completedIds.filter((id) => THEORY_IDS.has(id)).length;
    const fieldDone = userTasks
      .filter((t) => t.source === 'program' && t.status === 'done' && t.sourceRef)
      .map((t) => t.sourceRef as string);
    const checkpointsPassed = CHECKPOINT_MODULES
      .filter((m) => m.lessons.every((l) => doneSet.has(l.id))).length;
    const checkInMetrics = [...userCheckIns]
      .sort((a, b) => a.weekOf.localeCompare(b.weekOf))
      .map((ci) => (Array.isArray(ci.metrics) ? (ci.metrics as { name: string; value: number }[]) : []));

    const { readiness, breakdown } = computeLaunchReadiness({
      onboardingScore: user.score ?? 0,
      theoryDoneCount,
      brainRows: brain.map((e) => ({ entryType: e.entryType, aiScore: e.aiScore ?? null })),
      fieldDone,
      checkpointsPassed,
      checkInMetrics,
    });

    const traction = await buildTraction(db, user.id);
    return res.status(200).json({
      phase: 'launch',
      launch: { readiness, seed: onboardingSeed(user.score ?? 0), breakdown },
      completedLessons: completedIds,
      lessonInputs: inputsMap,
      momentumCard: user.momentumCard ?? null,
      streak: user.pulseStreak ?? 0,
      lastCheckInAt: user.lastCheckInAt ?? null,
      lastReadinessGain: user.lastReadinessGain ?? null,
      northStar: user.northStar ?? null,
      mentorSessions: user.mentorSessions ?? null,
      subscribed: user.subscribed ?? false,
      ...traction,
    });
  } catch (err) {
    console.error('progress error', err);
    return res.status(200).json({
      phase: 'launch',
      launch: { readiness: 0, seed: 0, breakdown: null },
      completedLessons: [],
      lessonInputs: {},
    });
  }
}
