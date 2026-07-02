import type { VercelRequest, VercelResponse } from '@vercel/node';
import Anthropic from '@anthropic-ai/sdk';
import { z } from 'zod';
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { eq, and } from 'drizzle-orm';
import { users, tasks, brainEntries } from '../../src/db/schema.js';

const TaskReviewSchema = z.object({
  score: z.number().int().min(0).max(100),
  verdict: z.enum(['strong', 'good', 'needs_work']),
  highlights: z.array(z.string()).min(1).max(3),
  improvements: z.array(z.string()).min(0).max(3),
  nextStep: z.string(),
});

function getDb() {
  const sql = neon(process.env.DATABASE_URL!);
  return drizzle(sql, { schema: { users, tasks, brainEntries } });
}

const REVIEW_SYSTEM_PROMPT = `You are Affina — a warm but honest startup mentor reviewing a founder's real-world task completion.
Be specific: reference what they actually wrote. Keep each bullet to 1-2 sentences.
Score guide: 90+ = excellent execution, 70-89 = good with minor gaps, 50-69 = partial, below 50 = needs significant improvement.
Respond ONLY with valid JSON, no other text.`;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'method not allowed' });

  const { email, taskId, submissionText, submissionData } = req.body;
  if (!email || !taskId || !submissionText?.trim()) {
    return res.status(400).json({ error: 'email, taskId, and submissionText required' });
  }

  const db = getDb();
  const user = await db.query.users.findFirst({ where: eq(users.email, email) });
  if (!user) return res.status(404).json({ error: 'user not found' });

  const task = await db.query.tasks.findFirst({
    where: and(eq(tasks.id, Number(taskId)), eq(tasks.userId, user.id)),
  });
  if (!task) return res.status(404).json({ error: 'task not found' });

  // Mark as submitted (submissionData = structured field-task artifact, §3.2)
  await db.update(tasks)
    .set({
      submissionText: submissionText.trim(),
      submissionData: submissionData ?? null,
      status: 'submitted',
      updatedAt: new Date(),
    })
    .where(eq(tasks.id, task.id));

  // AI review
  let review: z.infer<typeof TaskReviewSchema>;
  try {
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const userMessage = `Task: "${task.title}"
Full instruction: ${task.instruction}
Founder's submission: "${submissionText.trim()}"

Return JSON:
{
  "score": <0-100>,
  "verdict": <"strong" if ≥80, "good" if 55-79, "needs_work" if <55>,
  "highlights": [<2-3 specific things they did well>],
  "improvements": [<0-2 gaps to strengthen — omit if score≥90>],
  "nextStep": "<one concrete follow-up action>"
}`;

    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 800,
      system: REVIEW_SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userMessage }],
    });
    const raw = message.content[0].type === 'text' ? message.content[0].text : '';
    const match = raw.match(/\{[\s\S]*\}/);
    if (!match) throw new Error('no JSON');
    review = TaskReviewSchema.parse(JSON.parse(match[0]));
  } catch {
    const [updated] = await db.update(tasks)
      .set({ status: 'submitted', updatedAt: new Date() })
      .where(eq(tasks.id, task.id))
      .returning();
    return res.status(200).json({ task: updated, reviewError: 'ai_unavailable' });
  }

  // score ≥ 50 → done; otherwise reviewed (needs improvement)
  const finalStatus = review.score >= 50 ? 'done' : 'reviewed';

  const [updated] = await db.update(tasks)
    .set({ aiReview: JSON.stringify(review), status: finalStatus, updatedAt: new Date() })
    .where(eq(tasks.id, task.id))
    .returning();

  // score ≥ 50 → save to brain_entries so it appears in Documents
  if (review.score >= 50) {
    const brainLessonId = `task_${task.id}`;
    // Map TaskReview → AiFeedback shape for consistent display in DocumentsPanel
    const mappedFeedback = {
      score: review.score,
      verdict: review.verdict === 'strong' ? 'strong' : review.verdict === 'good' ? 'ok' : 'can_be_stronger',
      good: review.highlights,
      missing: review.improvements,
      nextStep: review.nextStep,
      realWorldTask: null,
    };

    const existingBrain = await db.query.brainEntries.findFirst({
      where: and(eq(brainEntries.userId, user.id), eq(brainEntries.lessonId, brainLessonId)),
    });

    if (existingBrain) {
      await db.update(brainEntries)
        .set({
          content: submissionText.trim(),
          processedByAi: true,
          aiScore: review.score,
          aiFeedback: JSON.stringify(mappedFeedback),
          updatedAt: new Date(),
        })
        .where(eq(brainEntries.id, existingBrain.id));
    } else {
      await db.insert(brainEntries).values({
        userId: user.id,
        lessonId: brainLessonId,
        lessonTitle: task.title,
        prompt: task.instruction,
        content: submissionText.trim(),
        entryType: 'task_result',
        processedByAi: true,
        aiScore: review.score,
        aiFeedback: JSON.stringify(mappedFeedback),
      });
    }
  }

  return res.status(200).json({ task: updated });
}
