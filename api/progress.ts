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
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'method not allowed' });

  const email = req.query.email as string;
  if (!email) return res.status(400).json({ error: 'email required' });

  try {
    const db = getDb();
    const user = await db.query.users.findFirst({ where: eq(users.email, email) });
    if (!user) {
      return res.status(200).json({ completedLessons: [], lessonInputs: {} });
    }

    const [completed, inputs] = await Promise.all([
      db.query.completedLessons.findMany({ where: eq(completedLessons.userId, user.id) }),
      db.query.lessonInputs.findMany({ where: eq(lessonInputs.userId, user.id) }),
    ]);

    const inputsMap: Record<string, string> = {};
    for (const row of inputs) inputsMap[row.lessonId] = row.content;

    return res.status(200).json({
      completedLessons: completed.map((c) => c.lessonId),
      lessonInputs: inputsMap,
    });
  } catch {
    return res.status(200).json({ completedLessons: [], lessonInputs: {} });
  }
}
