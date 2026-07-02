import type { VercelRequest, VercelResponse } from '@vercel/node';
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { eq, and } from 'drizzle-orm';
import { users, tasks, completedLessons } from '../../src/db/schema.js';
import { MODULES, BRAIN_ENTRY_TYPES } from '../../src/data.js';
import { blockKind } from '../../src/types.js';

function getDb() {
  const sql = neon(process.env.DATABASE_URL!);
  return drizzle(sql, { schema: { users, tasks, completedLessons } });
}

// Program v2 (§3.2): field-block tasks are auto-created when the user reaches
// a module containing a 🟡 block. "Reached" = module unlocked (previous module complete).
async function syncProgramTasks(db: ReturnType<typeof getDb>, userId: number) {
  const completed = await db.query.completedLessons.findMany({
    where: eq(completedLessons.userId, userId),
  });
  const done = new Set(completed.map((c) => c.lessonId));

  const existing = await db.query.tasks.findMany({
    where: and(eq(tasks.userId, userId), eq(tasks.source, 'program')),
  });
  const have = new Set(existing.map((t) => t.sourceRef));

  for (let i = 0; i < MODULES.length; i++) {
    const unlocked = i === 0 || MODULES[i - 1].lessons.every((l) => done.has(l.id));
    if (!unlocked) continue;
    for (const lesson of MODULES[i].lessons) {
      if (blockKind(lesson) !== 'field' || have.has(lesson.id)) continue;
      await db.insert(tasks).values({
        userId,
        source: 'program',
        sourceRef: lesson.id,
        title: lesson.title,
        instruction: lesson.body,
        priority: 90,
        status: 'todo',
        linkedEntryType: BRAIN_ENTRY_TYPES[lesson.id] ?? null,
      });
    }
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const db = getDb();

  // GET /api/tasks?email=...
  if (req.method === 'GET') {
    const email = req.query.email as string;
    if (!email) return res.status(400).json({ error: 'email required' });

    const user = await db.query.users.findFirst({ where: eq(users.email, email) });
    if (!user) return res.status(200).json({ tasks: [] });

    try {
      await syncProgramTasks(db, user.id);
    } catch { /* sync failure must not break the task list */ }

    const rows = await db.query.tasks.findMany({ where: eq(tasks.userId, user.id) });

    // Sort: active (todo/submitted) first, then by updatedAt desc
    const order = { todo: 0, submitted: 1, reviewed: 2, done: 3 } as Record<string, number>;
    rows.sort((a, b) => {
      const diff = (order[a.status ?? 'todo'] ?? 0) - (order[b.status ?? 'todo'] ?? 0);
      if (diff !== 0) return diff;
      return new Date(b.updatedAt ?? '').getTime() - new Date(a.updatedAt ?? '').getTime();
    });

    return res.status(200).json({ tasks: rows });
  }

  // POST /api/tasks — create self-task
  if (req.method === 'POST') {
    const { email, title, instruction } = req.body;
    if (!email || !title?.trim() || !instruction?.trim()) {
      return res.status(400).json({ error: 'email, title, and instruction required' });
    }

    const user = await db.query.users.findFirst({ where: eq(users.email, email) });
    if (!user) return res.status(404).json({ error: 'user not found' });

    const [task] = await db.insert(tasks).values({
      userId: user.id,
      source: 'self',
      sourceRef: null,
      title: title.trim().slice(0, 60),
      instruction: instruction.trim(),
    }).returning();

    return res.status(201).json({ task });
  }

  return res.status(405).json({ error: 'method not allowed' });
}
