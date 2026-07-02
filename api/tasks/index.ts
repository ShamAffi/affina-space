import type { VercelRequest, VercelResponse } from '@vercel/node';
import Anthropic from '@anthropic-ai/sdk';
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { eq, and } from 'drizzle-orm';
import { users, tasks, completedLessons, brainEntries } from '../../src/db/schema.js';
import { MODULES, BRAIN_ENTRY_TYPES } from '../../src/data.js';
import { blockKind } from '../../src/types.js';

function getDb() {
  const sql = neon(process.env.DATABASE_URL!);
  return drizzle(sql, { schema: { users, tasks, completedLessons, brainEntries } });
}

// §4b Mission Briefing — generated from the Brain when the founder opens a field task
const BRIEFING_SYSTEM = `You are Affina — the founder's AI mentor, writing a MISSION BRIEFING for a real-world task she is about to do.

Structure (use exactly these four plain-text headers, each followed by 1–3 tight sentences or bullet lines):
WHO TO TALK TO — pulled from her persona/pipeline: who exactly, where to find them.
WHAT TO SAY — grounded in her interview/sales script and positioning: the opener and key questions/asks.
WHAT TO EXPECT — likely reactions, common traps for this mission.
DONE WHEN — the concrete artifact/criterion that means the mission is complete.

Rules: use HER data (persona names, her product, her price). Be specific and practical, warm but direct. No markdown symbols except the headers. Max ~180 words total.`;

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

  // POST /api/tasks — create self-task | action 'briefing'
  if (req.method === 'POST') {
    // §4b — generate & cache the Mission Briefing for a program field task
    if (req.body.action === 'briefing') {
      const { email, taskId } = req.body;
      if (!email || !taskId) return res.status(400).json({ error: 'email and taskId required' });

      const user = await db.query.users.findFirst({ where: eq(users.email, email) });
      if (!user) return res.status(404).json({ error: 'user not found' });
      const task = await db.query.tasks.findFirst({
        where: and(eq(tasks.id, Number(taskId)), eq(tasks.userId, user.id)),
      });
      if (!task) return res.status(404).json({ error: 'task not found' });
      if (task.briefing) return res.status(200).json({ briefing: task.briefing });

      const entries = await db.query.brainEntries.findMany({ where: eq(brainEntries.userId, user.id) });
      const snap = user.snapshot as { sections: { title: string; content: string }[] } | null;
      const relevantTypes = ['persona', 'interview_script', 'sales_script', 'value_proposition', 'positioning', 'pipeline'];
      const relevant = entries
        .filter((e) => relevantTypes.includes(e.entryType))
        .map((e) => `[${e.entryType}] ${(e.content ?? '').slice(0, 700)}`)
        .join('\n\n');

      const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
      try {
        const msg = await client.messages.create({
          model: 'claude-sonnet-4-6',
          max_tokens: 500,
          system: BRIEFING_SYSTEM,
          messages: [{
            role: 'user',
            content: `Startup Snapshot:\n${snap ? snap.sections.map((s) => `## ${s.title}\n${s.content}`).join('\n') : '(none yet)'}\n\nRelevant Brain entries:\n${relevant || '(none yet)'}\n\nTHE MISSION — "${task.title}":\n${task.instruction}\n\nWrite her Mission Briefing.`,
          }],
        });
        const briefing = msg.content[0].type === 'text' ? msg.content[0].text.trim() : '';
        if (!briefing) throw new Error('empty');
        await db.update(tasks).set({ briefing, updatedAt: new Date() }).where(eq(tasks.id, task.id));
        return res.status(200).json({ briefing });
      } catch {
        return res.status(502).json({ error: 'ai_unavailable' });
      }
    }

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
