import type { VercelRequest, VercelResponse } from '@vercel/node';
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { eq } from 'drizzle-orm';
import { users, lessonInputs, completedLessons } from '../src/db/schema.js';

function getDb() {
  const sql = neon(process.env.DATABASE_URL!);
  return drizzle(sql, { schema: { users, lessonInputs, completedLessons } });
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

  // POST /api/user — upsert user with onboarding data
  if (req.method === 'POST') {
    const { email, name, projectName, idea, customer, businessModel, stage, goal, score } = req.body;
    if (!email) return res.status(400).json({ error: 'email required' });

    const existing = await db.query.users.findFirst({ where: eq(users.email, email) });

    if (existing) {
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
    await db.update(users).set(patchFields).where(eq(users.email, email));
    return res.status(200).json({ ok: true });
  }

  return res.status(405).json({ error: 'method not allowed' });
}
