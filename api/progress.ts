import type { VercelRequest, VercelResponse } from '@vercel/node';
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { eq } from 'drizzle-orm';
import { users, lessonInputs, completedLessons, brainEntries } from '../src/db/schema.js';
import { computeLaunchReadiness, computeGrowth, GROWTH_SEED_XP } from './lib/progressUtils.js';

function getDb() {
  const sql = neon(process.env.DATABASE_URL!);
  return drizzle(sql, { schema: { users, lessonInputs, completedLessons, brainEntries } });
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,X-Mentor-Secret');
  if (req.method === 'OPTIONS') return res.status(200).end();

  // POST /api/progress — mentor validates launch, moves user to growth phase
  if (req.method === 'POST') {
    const secret = req.headers['x-mentor-secret'];
    if (!secret || secret !== process.env.MENTOR_SECRET) {
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

  const email = req.query.email as string;
  if (!email) return res.status(400).json({ error: 'email required' });

  try {
    const db = getDb();
    const user = await db.query.users.findFirst({ where: eq(users.email, email) });

    if (!user) {
      return res.status(200).json({
        phase: 'launch',
        launch: { readiness: 0, seed: 0, weakestLayer: null, unmetRequired: [] },
        completedLessons: [],
        lessonInputs: {},
      });
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
      return res.status(200).json({
        phase: 'growth',
        growth,
        completedLessons: completedIds,
        lessonInputs: inputsMap,
        momentumCard: user.momentumCard ?? null,
        streak: user.pulseStreak ?? 0,
        lastCheckInAt: user.lastCheckInAt ?? null,
        lastReadinessGain: user.lastReadinessGain ?? null,
      });
    }

    // launch phase — compute readiness from brain entries
    const brain = await db.query.brainEntries.findMany({
      where: eq(brainEntries.userId, user.id),
    });

    const launch = computeLaunchReadiness(
      brain.map((e) => ({ entryType: e.entryType, aiScore: e.aiScore ?? null })),
      user.score ?? 0,
    );

    return res.status(200).json({
      phase: 'launch',
      launch,
      completedLessons: completedIds,
      lessonInputs: inputsMap,
      momentumCard: user.momentumCard ?? null,
      streak: user.pulseStreak ?? 0,
      lastCheckInAt: user.lastCheckInAt ?? null,
      lastReadinessGain: user.lastReadinessGain ?? null,
    });
  } catch (err) {
    console.error('progress error', err);
    return res.status(200).json({
      phase: 'launch',
      launch: { readiness: 0, seed: 0, weakestLayer: null, unmetRequired: [] },
      completedLessons: [],
      lessonInputs: {},
    });
  }
}
