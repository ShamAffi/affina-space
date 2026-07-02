import type { VercelRequest, VercelResponse } from '@vercel/node';
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { eq } from 'drizzle-orm';
import { users, lessonInputs, completedLessons, brainEntries, tasks, checkIns, achievements, delegations } from '../src/db/schema.js';
import { GROWTH_SEED_XP } from './lib/progressUtils.js';

function getDb() {
  const sql = neon(process.env.DATABASE_URL!);
  return drizzle(sql, { schema: { users, lessonInputs, completedLessons, brainEntries, tasks, checkIns, achievements, delegations } });
}

// Re-onboarding with an existing email (freshStart) must not inherit the previous
// life of that account: wipe all child rows and reset derived state, otherwise old
// tasks/brain/progress leak into the new project (root cause of the ghost-tasks bug).
async function wipeUserChildren(db: ReturnType<typeof getDb>, userId: number) {
  await Promise.all([
    db.delete(lessonInputs).where(eq(lessonInputs.userId, userId)),
    db.delete(completedLessons).where(eq(completedLessons.userId, userId)),
    db.delete(brainEntries).where(eq(brainEntries.userId, userId)),
    db.delete(tasks).where(eq(tasks.userId, userId)),
    db.delete(checkIns).where(eq(checkIns.userId, userId)),
    db.delete(achievements).where(eq(achievements.userId, userId)),
    db.delete(delegations).where(eq(delegations.userId, userId)),
  ]);
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PATCH,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const db = getDb();

  // GET /api/user?email=... — load user data
  if (req.method === 'GET') {
    const email = req.query.email as string;
    if (!email) return res.status(400).json({ error: 'email required' });

    const user = await db.query.users.findFirst({ where: eq(users.email, email) });
    if (!user) return res.status(404).json({ error: 'not found' });

    const inputs = await db.query.lessonInputs.findMany({
      where: eq(lessonInputs.userId, user.id),
    });
    const completed = await db.query.completedLessons.findMany({
      where: eq(completedLessons.userId, user.id),
    });

    return res.status(200).json({
      name: user.name ?? '',
      projectName: user.projectName ?? '',
      idea: user.idea ?? '',
      customer: user.customer ?? '',
      businessModel: user.businessModel ?? '',
      stage: user.stage ?? '',
      goal: user.goal ?? '',
      email: user.email,
      score: user.score ?? 0,
      lessonInputs: Object.fromEntries(inputs.map((i) => [i.lessonId, i.content ?? ''])),
      completedLessons: completed.map((c) => c.lessonId),
    });
  }

  // POST /api/user — upsert user with onboarding data.
  // freshStart=true (sent ONLY by the Register flow) = this email is starting a new
  // project: wipe child rows + reset derived state before applying the new profile.
  // Plain sync calls (LMS mount etc.) never send the flag and never touch children.
  if (req.method === 'POST') {
    const { email, name, projectName, idea, customer, businessModel, stage, goal, score, freshStart } = req.body;
    if (!email) return res.status(400).json({ error: 'email required' });

    const existing = await db.query.users.findFirst({ where: eq(users.email, email) });

    if (existing) {
      if (freshStart === true) {
        await wipeUserChildren(db, existing.id);
        await db.update(users)
          .set({
            name, projectName, idea, customer, businessModel, stage, goal, score,
            // reset everything derived from the previous life of this email
            phase: 'launch',
            launchValidatedAt: null,
            growthXp: 0,
            northStar: null,
            pulseStreak: 0,
            lastCheckInAt: null,
            momentumCard: null,
            lastReadinessGain: null,
            snapshot: null,
            snapshotHistory: null,
            mentorSessions: null,
            updatedAt: new Date(),
          })
          .where(eq(users.email, email));
        return res.status(200).json({ id: existing.id, freshStart: true });
      }

      await db.update(users)
        .set({ name, projectName, idea, customer, businessModel, stage, goal, score, updatedAt: new Date() })
        .where(eq(users.email, email));
      return res.status(200).json({ id: existing.id });
    } else {
      const [created] = await db.insert(users)
        .values({ email, name, projectName, idea, customer, businessModel, stage, goal, score })
        .returning({ id: users.id });
      return res.status(201).json({ id: created.id });
    }
  }

  // PATCH /api/user — update account fields (name, projectName, mentorSessions)
  if (req.method === 'PATCH') {
    const { email, name, projectName, mentorSessions } = req.body;
    if (!email) return res.status(400).json({ error: 'email required' });
    const patchFields: Record<string, unknown> = { updatedAt: new Date() };
    if (name !== undefined) patchFields.name = name;
    if (projectName !== undefined) patchFields.projectName = projectName;
    if (mentorSessions !== undefined) patchFields.mentorSessions = mentorSessions;

    // Graduation (решение Шамиля): completing mentor session S3 IS the launch→growth
    // moment — the post-program Growth/XP phase starts here with its seed points.
    if (mentorSessions?.S3?.completed === true) {
      const u = await db.query.users.findFirst({ where: eq(users.email, email) });
      if (u && (u.phase ?? 'launch') === 'launch') {
        patchFields.phase = 'growth';
        patchFields.launchValidatedAt = new Date();
        patchFields.growthXp = GROWTH_SEED_XP;
      }
    }

    await db.update(users).set(patchFields).where(eq(users.email, email));
    return res.status(200).json({ ok: true });
  }

  return res.status(405).json({ error: 'method not allowed' });
}
