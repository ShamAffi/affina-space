import type { VercelRequest, VercelResponse } from '@vercel/node';
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { eq, and } from 'drizzle-orm';
import { users, lessonInputs, completedLessons, brainEntries } from '../src/db/schema.js';
import { BRAIN_ENTRY_TYPES, MODULES } from '../src/data.js';

function getDb() {
  const sql = neon(process.env.DATABASE_URL!);
  return drizzle(sql, { schema: { users, lessonInputs, completedLessons, brainEntries } });
}

function getLessonMeta(lessonId: string): { title: string; prompt: string } | null {
  for (const mod of MODULES) {
    const lesson = mod.lessons.find((l) => l.id === lessonId);
    if (lesson) return { title: lesson.title, prompt: lesson.inputPrompt ?? '' };
  }
  return null;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'method not allowed' });

  const db = getDb();
  const { action, email, lessonId, content } = req.body;

  let user = await db.query.users.findFirst({ where: eq(users.email, email) });
  if (!user) {
    const [created] = await db.insert(users).values({ email }).returning();
    user = created;
  }

  // Save lesson input + write to brain_entries if this lesson has an entry type
  if (action === 'save-input') {
    const existing = await db.query.lessonInputs.findFirst({
      where: and(eq(lessonInputs.userId, user.id), eq(lessonInputs.lessonId, lessonId)),
    });
    if (existing) {
      await db.update(lessonInputs)
        .set({ content, updatedAt: new Date() })
        .where(and(eq(lessonInputs.userId, user.id), eq(lessonInputs.lessonId, lessonId)));
    } else {
      await db.insert(lessonInputs).values({ userId: user.id, lessonId, content });
    }

    // Write to brain_entries if this lesson maps to a brain entry type
    const entryType = BRAIN_ENTRY_TYPES[lessonId];
    if (entryType && content.trim()) {
      const meta = getLessonMeta(lessonId);
      if (meta) {
        const existingBrain = await db.query.brainEntries.findFirst({
          where: and(eq(brainEntries.userId, user.id), eq(brainEntries.lessonId, lessonId)),
        });
        if (existingBrain) {
          await db.update(brainEntries)
            .set({ content, processedByAi: false, updatedAt: new Date() })
            .where(and(eq(brainEntries.userId, user.id), eq(brainEntries.lessonId, lessonId)));
        } else {
          await db.insert(brainEntries).values({
            userId: user.id,
            lessonId,
            lessonTitle: meta.title,
            prompt: meta.prompt,
            content,
            entryType,
          });
        }
      }
    }

    return res.status(200).json({ ok: true });
  }

  // Toggle lesson completion
  if (action === 'toggle-complete') {
    const existing = await db.query.completedLessons.findFirst({
      where: and(eq(completedLessons.userId, user.id), eq(completedLessons.lessonId, lessonId)),
    });
    if (existing) {
      await db.delete(completedLessons)
        .where(and(eq(completedLessons.userId, user.id), eq(completedLessons.lessonId, lessonId)));
      return res.status(200).json({ completed: false });
    } else {
      await db.insert(completedLessons).values({ userId: user.id, lessonId });
      return res.status(200).json({ completed: true });
    }
  }

  return res.status(400).json({ error: 'unknown action' });
}
