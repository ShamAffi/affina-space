import type { VercelRequest, VercelResponse } from '@vercel/node';
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { eq } from 'drizzle-orm';
import { users, brainEntries } from '../src/db/schema';

function getDb() {
  const sql = neon(process.env.DATABASE_URL!);
  return drizzle(sql, { schema: { users, brainEntries } });
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'method not allowed' });

  const db = getDb();
  const email = req.query.email as string;
  if (!email) return res.status(400).json({ error: 'email required' });

  const user = await db.query.users.findFirst({ where: eq(users.email, email) });
  if (!user) return res.status(200).json([]);

  const entries = await db.query.brainEntries.findMany({
    where: eq(brainEntries.userId, user.id),
    orderBy: (t, { desc }) => [desc(t.updatedAt)],
  });

  return res.status(200).json(entries);
}
