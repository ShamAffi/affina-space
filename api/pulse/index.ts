import type { VercelRequest, VercelResponse } from '@vercel/node';
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { eq, desc } from 'drizzle-orm';
import { users, checkIns } from '../../src/db/schema.js';

function getDb() {
  const sql = neon(process.env.DATABASE_URL!);
  return drizzle(sql, { schema: { users, checkIns } });
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'method not allowed' });

  const email = req.query.email as string;
  if (!email) return res.status(400).json({ error: 'email required' });

  const db = getDb();
  const user = await db.query.users.findFirst({ where: eq(users.email, email) });
  if (!user) return res.status(200).json({ checkIns: [], northStar: null, streak: 0 });

  const rows = await db.query.checkIns.findMany({
    where: eq(checkIns.userId, user.id),
    orderBy: [desc(checkIns.weekOf)],
  });

  return res.status(200).json({
    checkIns: rows,
    northStar: user.northStar ?? null,
    streak: user.pulseStreak ?? 0,
  });
}
