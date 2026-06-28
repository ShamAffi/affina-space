import type { VercelRequest, VercelResponse } from '@vercel/node';
import Anthropic from '@anthropic-ai/sdk';
import { z } from 'zod';
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { eq, and } from 'drizzle-orm';
import { users, brainEntries } from '../src/db/schema.js';

const FeedbackSchema = z.object({
  score: z.number().int().min(0).max(100),
  verdict: z.enum(['strong', 'ok', 'can_be_stronger']),
  good: z.array(z.string()).min(1).max(2),
  missing: z.array(z.string()).min(1).max(3),
  nextStep: z.string(),
});

export type AiFeedback = z.infer<typeof FeedbackSchema>;

function getDb() {
  const sql = neon(process.env.DATABASE_URL!);
  return drizzle(sql, { schema: { users, brainEntries } });
}

const SYSTEM_PROMPT = `You are Affina — a warm but honest startup mentor for early-stage female founders.
Your job: evaluate a founder's exercise answer and return structured feedback.

Rules:
- Be specific. Reference the actual words in their answer.
- Always find at least one genuine positive, even in a weak answer — it keeps founders going.
- Identify concrete gaps (not vague "improve your phrasing" — say exactly what's missing).
- Give exactly ONE next step with a concrete mini-example that uses their actual project/audience.
- Tone: warm but direct. "This describes the product, not the value to the person" — not "Great work!".
- Respond ONLY with valid JSON, no other text.`;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'method not allowed' });

  const { email, lessonId, lessonTitle, prompt, answer } = req.body;
  if (!email || !lessonId || !answer?.trim()) {
    return res.status(400).json({ error: 'email, lessonId, and answer are required' });
  }

  // Call Claude
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const userMessage = `Lesson: ${lessonTitle}
Exercise: ${prompt}
Founder's answer: "${answer}"

Evaluation rubric: problem clarity · target segment · measurable result

Return JSON with exactly this structure:
{
  "score": <integer 0-100>,
  "verdict": <"strong" if score≥80, "ok" if score 55-79, "can_be_stronger" if score<55>,
  "good": [<1-2 specific strengths from their actual answer>],
  "missing": [<1-3 specific gaps referencing what they wrote — not generic advice>],
  "nextStep": "<one concrete rewrite technique + mini-example using their specific product and audience>"
}`;

  let feedback: AiFeedback;
  try {
    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userMessage }],
    });

    const raw = message.content[0].type === 'text' ? message.content[0].text : '';
    const parsed = JSON.parse(raw);
    feedback = FeedbackSchema.parse(parsed);
  } catch {
    return res.status(502).json({ error: 'ai_unavailable' });
  }

  // Persist aiScore + aiFeedback to brain_entries
  try {
    const db = getDb();
    const user = await db.query.users.findFirst({ where: eq(users.email, email) });
    if (user) {
      const existing = await db.query.brainEntries.findFirst({
        where: and(eq(brainEntries.userId, user.id), eq(brainEntries.lessonId, lessonId)),
      });
      if (existing) {
        await db.update(brainEntries)
          .set({
            processedByAi: true,
            aiScore: feedback.score,
            aiFeedback: JSON.stringify(feedback),
            updatedAt: new Date(),
          })
          .where(and(eq(brainEntries.userId, user.id), eq(brainEntries.lessonId, lessonId)));
      }
    }
  } catch {
    // DB write failure — still return the feedback to the client
  }

  return res.status(200).json(feedback);
}
