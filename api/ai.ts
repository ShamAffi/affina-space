import type { VercelRequest, VercelResponse } from '@vercel/node';
import Anthropic from '@anthropic-ai/sdk';
import { z } from 'zod';
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { eq, and } from 'drizzle-orm';
import { users, brainEntries, tasks } from '../src/db/schema.js';
import { computeLaunchReadiness, LAYER_LABELS } from './lib/progressUtils.js';

const FeedbackSchema = z.object({
  score: z.number().int().min(0).max(100),
  verdict: z.enum(['strong', 'ok', 'can_be_stronger']),
  good: z.array(z.string()).min(1).max(2),
  missing: z.array(z.string()).min(1).max(3),
  nextStep: z.string(),
  realWorldTask: z.union([
    z.object({ title: z.string(), instruction: z.string() }),
    z.null(),
  ]).default(null),
});

export type AiFeedback = z.infer<typeof FeedbackSchema>;

const CompareSchema = z.object({
  candidates: z.array(z.object({
    label: z.string(),
    painIntensity: z.number().int().min(1).max(5),
    reachability: z.number().int().min(1).max(5),
    abilityToPay: z.number().int().min(1).max(5),
    wordOfMouth: z.number().int().min(1).max(5),
    total: z.number().int().min(4).max(20),
  })).min(1).max(4),
  recommendation: z.string(),
  runnerUp: z.string(),
  nextStep: z.string(),
});

export type CompareResult = z.infer<typeof CompareSchema>;

function getDb() {
  const sql = neon(process.env.DATABASE_URL!);
  return drizzle(sql, { schema: { users, brainEntries, tasks } });
}

const FEEDBACK_SYSTEM_PROMPT = `You are Affina — a warm but honest startup mentor for early-stage female founders.
Your job: evaluate a founder's exercise answer and return structured feedback.

Rules:
- Be specific. Reference the actual words in their answer.
- Always find at least one genuine positive, even in a weak answer — it keeps founders going.
- Identify concrete gaps (not vague "improve your phrasing" — say exactly what's missing).
- Give exactly ONE next step. If it's a real-world action outside the app (e.g. interview customers, build a landing page, run an ad), set realWorldTask with a short imperative title (≤6 words) AND the full detailed instruction. If it's just an in-app rewrite, set realWorldTask to null.
- Tone: warm but direct. "This describes the product, not the value to the person" — not "Great work!".
- Respond ONLY with valid JSON, no other text.`;

const COMPARE_SYSTEM_PROMPT = `You are Affina — a startup mentor for early-stage female founders.
Your job: score 3 candidate customer segments and recommend the best beachhead to start with.

Score each candidate on 4 criteria (1–5 scale):
- painIntensity: How intense and frequent is their pain? (5 = actively hunting for a solution today)
- reachability: Can the founder reach them without a big budget? (5 = direct, low-cost access)
- abilityToPay: Real willingness and means to pay? (5 = already spending on this problem)
- wordOfMouth: Will a delighted customer tell others like her? (5 = tight network, high trust)

Calculate total = sum of the 4 scores (max 20).
Recommend the candidate with the highest total as the beachhead.
If tied, prefer the one with the highest painIntensity.

Rules:
- Be honest — don't inflate scores. A 5 should be exceptional.
- Use the founder's own words for the candidate label (keep it short, e.g. "Moms on maternity leave").
- Recommend exactly one candidate; name the runner-up with a one-sentence reason.
- Give one concrete next step the founder can take in the next 7 days.
- Respond ONLY with valid JSON, no other text.`;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'method not allowed' });

  // Generate project name mode — cheap Haiku call, no lesson context required
  if (req.body.mode === 'generate-name') {
    const { idea, customer, businessModel, stage, avoid } = req.body;
    if (!idea?.trim()) return res.status(200).json({ name: '' });
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const avoidList: string[] = Array.isArray(avoid) ? avoid.filter(Boolean) : [];
    const avoidLine = avoidList.length
      ? `\nAlready suggested — return something clearly DIFFERENT in sound and root: ${avoidList.join(', ')}.`
      : '';
    const message = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 24,
      system: `You name consumer startups. Output ONE brand name that fits THIS specific business.
Rules:
- The name must connect to what the startup actually does, its value, or its customer — never generic.
- 1–2 words, short, memorable, easy to pronounce and spell. A coined or blended word is great.
- No generic mashups ("SmartHub", "QuickConnect"); no "AI"/"Tech"/"Labs"/"App"/"Hub" suffixes.
- Output JUST the name. No quotes, no punctuation, no explanation.`,
      messages: [{
        role: 'user',
        content: `Name this startup:
What it does: ${idea}
Target customer: ${customer || 'not specified'}
Business model: ${businessModel || 'not specified'}
Stage: ${stage || 'early'}${avoidLine}`,
      }],
    });
    const raw = message.content[0].type === 'text' ? message.content[0].text.trim() : '';
    const name = raw.replace(/["""''`*.\n]/g, '').trim().split(/\s+/).slice(0, 2).join(' ');
    return res.status(200).json({ name });
  }

  const { email, lessonId, lessonTitle, prompt, answer, aiMode, context } = req.body;
  const contextBlock = context?.idea
    ? `\n\nFounder context (use this to personalize feedback — reference their actual project and address them by name):\n- Name: ${context.name || 'not provided'}\n- Idea: ${context.idea}\n- Target customer: ${context.customer || 'not specified'}\n- Stage: ${context.stage || 'not specified'}`
    : '';
  if (!email || !lessonId || !answer?.trim()) {
    return res.status(400).json({ error: 'email, lessonId, and answer are required' });
  }

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const isCompare = aiMode === 'compare';

  let result: AiFeedback | CompareResult;

  try {
    if (isCompare) {
      const userMessage = `Lesson: ${lessonTitle}
Exercise: ${prompt}
Founder's answer: "${answer}"

Return JSON with exactly this structure:
{
  "candidates": [
    {
      "label": "<short name from their words>",
      "painIntensity": <1-5>,
      "reachability": <1-5>,
      "abilityToPay": <1-5>,
      "wordOfMouth": <1-5>,
      "total": <sum of above 4>
    }
  ],
  "recommendation": "<We'd start with [label], because [1-2 sentence reason using her words]>",
  "runnerUp": "<Runner-up label + one-sentence reason>",
  "nextStep": "<one concrete action for the next 7 days>"
}`;
      const message = await client.messages.create({
        model: 'claude-sonnet-4-6',
        max_tokens: 1024,
        system: COMPARE_SYSTEM_PROMPT + contextBlock,
        messages: [{ role: 'user', content: userMessage }],
      });
      const raw = message.content[0].type === 'text' ? message.content[0].text : '';
      const match = raw.match(/\{[\s\S]*\}/);
      if (!match) throw new Error('no JSON in response');
      result = CompareSchema.parse(JSON.parse(match[0]));
    } else {
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
  "nextStep": "<one concrete next step>",
  "realWorldTask": null | { "title": "<≤6 word imperative, e.g. 'Interview 5 target customers'>", "instruction": "<full detailed instruction with context, how-to, and expected output>" }
}`;
      const message = await client.messages.create({
        model: 'claude-sonnet-4-6',
        max_tokens: 1024,
        system: FEEDBACK_SYSTEM_PROMPT + contextBlock,
        messages: [{ role: 'user', content: userMessage }],
      });
      const raw = message.content[0].type === 'text' ? message.content[0].text : '';
      const match = raw.match(/\{[\s\S]*\}/);
      if (!match) throw new Error('no JSON in response');
      result = FeedbackSchema.parse(JSON.parse(match[0]));
    }
  } catch {
    return res.status(502).json({ error: 'ai_unavailable' });
  }

  // Persist to brain_entries + auto-create real-world task if applicable
  try {
    const db = getDb();
    const user = await db.query.users.findFirst({ where: eq(users.email, email) });
    if (user) {
      const existing = await db.query.brainEntries.findFirst({
        where: and(eq(brainEntries.userId, user.id), eq(brainEntries.lessonId, lessonId)),
      });
      const oldScore = existing?.aiScore ?? null;
      if (existing) {
        const score = isCompare ? null : (result as AiFeedback).score;
        await db.update(brainEntries)
          .set({
            processedByAi: true,
            aiScore: score,
            aiFeedback: JSON.stringify(result),
            updatedAt: new Date(),
          })
          .where(and(eq(brainEntries.userId, user.id), eq(brainEntries.lessonId, lessonId)));

        // Record the readiness gain from this scored exercise (feedback mode only — compare has no score).
        if (!isCompare) {
          const allEntries = await db.query.brainEntries.findMany({ where: eq(brainEntries.userId, user.id) });
          const after = computeLaunchReadiness(
            allEntries.map((e) => ({ entryType: e.entryType, aiScore: e.aiScore ?? null })),
            user.score ?? 0,
          ).readiness;
          const before = computeLaunchReadiness(
            allEntries.map((e) => ({ entryType: e.entryType, aiScore: e.lessonId === lessonId ? oldScore : (e.aiScore ?? null) })),
            user.score ?? 0,
          ).readiness;
          const delta = after - before;
          if (delta > 0) {
            await db.update(users).set({
              lastReadinessGain: { delta, sourceLabel: LAYER_LABELS[existing.entryType] ?? existing.entryType },
              updatedAt: new Date(),
            }).where(eq(users.id, user.id));
          }
        }
      }

      // Upsert real-world task if mentor returned one
      if (!isCompare) {
        const rwt = (result as AiFeedback).realWorldTask;
        if (rwt) {
          const existingTask = await db.query.tasks.findFirst({
            where: and(eq(tasks.userId, user.id), eq(tasks.sourceRef, lessonId)),
          });
          if (existingTask) {
            await db.update(tasks)
              .set({ title: rwt.title, instruction: rwt.instruction, updatedAt: new Date() })
              .where(eq(tasks.id, existingTask.id));
          } else {
            await db.insert(tasks).values({
              userId: user.id,
              source: 'mentor',
              sourceRef: lessonId,
              title: rwt.title,
              instruction: rwt.instruction,
            });
          }
        }
      }
    }
  } catch {
    // DB write failure — still return result to client
  }

  return res.status(200).json(result);
}
