import type { VercelRequest, VercelResponse } from '@vercel/node';
import { callClaude } from '../../src/server/anthropic.js';
import { MODELS } from '../../src/server/models.js';
import { z } from 'zod';
import { applyCors } from '../../src/server/http.js';
import { requireAuth } from '../../src/server/requireAuth.js';
import { checkRateLimit } from '../../src/server/ratelimit.js';
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { eq, desc } from 'drizzle-orm';
import { users, brainEntries, checkIns } from '../../src/db/schema.js';
import { computeExercisePoints, LAYER_LABELS } from '../../src/server/progressUtils.js';

function getDb() {
  const sql = neon(process.env.DATABASE_URL!);
  return drizzle(sql, { schema: { users, brainEntries, checkIns } });
}

const SuggestionSchema = z.object({
  candidates: z.array(z.object({
    key: z.string(),
    label: z.string(),
    unit: z.enum(['people', '$', '%', 'count']),
    why: z.string(),
    howToMeasure: z.string(),
    currentValue: z.number().optional(),
  })).min(1).max(2),
  recommended: z.string(),
});

const CommitEvalSchema = z.object({
  score: z.number().int().min(0).max(100),
  verdict: z.enum(['strong', 'ok', 'needs_work']),
  mentorNote: z.string(),
  isVanity: z.boolean(),
  betterAlternative: z.string().optional(),
});

const SUGGEST_SYSTEM = `You are Affina — a warm startup mentor for early-stage female founders.
Given a founder's Brain context (value proposition, business model, use case, persona) and any metrics they've already tracked in weekly check-ins, suggest 1–2 North Star metric candidates.

Rules:
- Suggest leading metrics that reflect delivered customer value, NOT vanity metrics (not downloads, followers, app opens)
- At early stage: proxy signals (activations, weekly completed sessions, paying users) are better than revenue alone
- Each candidate must be measurable at the founder's current stage
- key: machine-readable slug (snake_case), label: human-readable, unit: 'people'|'$'|'%'|'count'
- why: 1 sentence on how it reflects real value to her customer
- howToMeasure: 1 sentence on how to track it right now
- recommended: the key of the strongest candidate
- If any metric appears in their check-in history, include currentValue
Respond ONLY with valid JSON.`;

const COMMIT_SYSTEM = `You are Affina — a warm startup mentor for early-stage female founders.
Evaluate a founder's chosen North Star metric against these criteria:
1. Reflects delivered customer value (not vanity/activity)
2. Measurable at her current stage
3. Preferably leading (predicts future health, not just records past)
4. Aligned with her business model

Scoring: 80–100 strong, 60–79 ok, 0–59 needs work.
If the metric is vanity (downloads, followers, page views without engagement), isVanity=true and gently suggest a better alternative.
mentorNote: 1–2 warm, honest sentences. Acknowledge what's good; if needs_work, guide specifically toward a better choice.
Respond ONLY with valid JSON.`;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (applyCors(req, res, 'POST,OPTIONS')) return;

  // Auth Phase B (§2) — identity from the session cookie; client email ignored.
  const email = requireAuth(req, res);
  if (!email) return;

  const rl = await checkRateLimit(req, { email }); // §6 — limiter keys on the session email
  if (!rl.ok) {
    if (rl.retryAfter) res.setHeader('Retry-After', String(rl.retryAfter));
    return res.status(429).json({ error: 'rate_limited', retryAfter: rl.retryAfter });
  }
  if (req.method !== 'POST') return res.status(405).json({ error: 'method not allowed' });

  const { action } = req.body ?? {};
  if (action !== 'suggest' && action !== 'commit') return res.status(400).json({ error: 'action must be suggest or commit' });

  const db = getDb();
  const user = await db.query.users.findFirst({ where: eq(users.email, email) });
  if (!user) return res.status(404).json({ error: 'user not found' });

  // ── SUGGEST ──────────────────────────────────────────────────────────────────
  if (action === 'suggest') {
    const brain = await db.query.brainEntries.findMany({ where: eq(brainEntries.userId, user.id) });
    const recentCheckIns = await db.query.checkIns.findMany({
      where: eq(checkIns.userId, user.id),
      orderBy: [desc(checkIns.weekOf)],
      limit: 3,
    });

    const brainMap: Record<string, string> = {};
    for (const e of brain) brainMap[e.entryType] = e.content;

    const existingMetrics: Record<string, number[]> = {};
    for (const ci of recentCheckIns) {
      if (!Array.isArray(ci.metrics)) continue;
      for (const m of ci.metrics as { name: string; value: number }[]) {
        if (!existingMetrics[m.name]) existingMetrics[m.name] = [];
        existingMetrics[m.name].push(m.value);
      }
    }
    const metricsContext = Object.entries(existingMetrics)
      .map(([name, vals]) => `${name}: latest ${vals[0]}`)
      .join(', ') || 'none tracked yet';

    const userMessage = `Founder: ${user.name || 'unnamed'}
Project: ${user.projectName || 'startup'} — ${user.idea || 'not described'}
Stage: ${user.stage || 'early'}

Brain layers:
- Value proposition: ${brainMap['value_proposition'] || 'not written yet'}
- Business model: ${brainMap['business_model'] || 'not written yet'}
- Use case: ${brainMap['use_case'] || 'not written yet'}
- Target persona: ${brainMap['persona'] || 'not written yet'}

Already tracking in check-ins: ${metricsContext}

Suggest 1–2 North Star metric candidates for this founder.

Return JSON:
{
  "candidates": [
    {
      "key": "weekly_active_users",
      "label": "Weekly active users",
      "unit": "people",
      "why": "Moves only when users actually return and get value",
      "howToMeasure": "Count users who complete at least one core action per week",
      "currentValue": 42
    }
  ],
  "recommended": "weekly_active_users"
}`;

    try {
      const msg = await callClaude({
        model: MODELS.standard,
        max_tokens: 800,
        system: SUGGEST_SYSTEM,
        messages: [{ role: 'user', content: userMessage }],
      }, { endpoint: 'northstar', mode: 'suggest', email });
      const raw = msg.content[0].type === 'text' ? msg.content[0].text : '';
      const match = raw.match(/\{[\s\S]*\}/);
      if (!match) throw new Error('no JSON');
      const parsed = SuggestionSchema.parse(JSON.parse(match[0]));
      return res.status(200).json(parsed);
    } catch {
      return res.status(502).json({ error: 'ai_unavailable' });
    }
  }

  // ── COMMIT ───────────────────────────────────────────────────────────────────
  const { key, label, unit, rationale } = req.body;
  if (!key || !label || !unit) return res.status(400).json({ error: 'key, label, unit required' });

  const brain = await db.query.brainEntries.findMany({ where: eq(brainEntries.userId, user.id) });
  const brainMap: Record<string, string> = {};
  for (const e of brain) brainMap[e.entryType] = e.content;

  const commitMessage = `Founder: ${user.name || 'unnamed'}
Project: ${user.projectName || 'startup'} — ${user.idea || 'not described'}
Business model: ${brainMap['business_model'] || 'not described'}
Value proposition: ${brainMap['value_proposition'] || 'not described'}
Use case: ${brainMap['use_case'] || 'not described'}

Chosen North Star metric:
- Key: ${key}
- Label: ${label}
- Unit: ${unit}
- Founder's rationale: ${rationale || '(none provided)'}

Evaluate this metric. Return JSON:
{
  "score": 75,
  "verdict": "ok",
  "mentorNote": "...",
  "isVanity": false,
  "betterAlternative": "optional — only if isVanity is true"
}`;

  try {
    const msg = await callClaude({
      model: MODELS.standard,
      max_tokens: 400,
      system: COMMIT_SYSTEM,
      messages: [{ role: 'user', content: commitMessage }],
    }, { endpoint: 'northstar', mode: 'commit', email });
    const raw = msg.content[0].type === 'text' ? msg.content[0].text : '';
    const match = raw.match(/\{[\s\S]*\}/);
    if (!match) throw new Error('no JSON');
    const evaluation = CommitEvalSchema.parse(JSON.parse(match[0]));

    const northStarValue = { key, label, unit };
    const brainContent = `North Star: ${label} (${unit})\nRationale: ${rationale || '(none)'}`;

    // Upsert brain entry
    const existing = brain.find((e) => e.entryType === 'north_star');
    if (existing) {
      await db.update(brainEntries).set({
        content: brainContent,
        aiScore: evaluation.score,
        aiFeedback: JSON.stringify(evaluation),
        processedByAi: true,
        updatedAt: new Date(),
      }).where(eq(brainEntries.id, existing.id));
    } else {
      await db.insert(brainEntries).values({
        userId: user.id,
        lessonId: 'm5l6',
        lessonTitle: 'Choose your North Star + year goal',
        prompt: 'Why did you choose this metric as your North Star?',
        content: brainContent,
        entryType: 'north_star',
        aiScore: evaluation.score,
        aiFeedback: JSON.stringify(evaluation),
        processedByAi: true,
      });
    }

    // Readiness gain from setting/strengthening the North Star (§7 exercise points).
    const baseRows = brain
      .filter((e) => e.entryType !== 'north_star')
      .map((e) => ({ entryType: e.entryType, aiScore: e.aiScore ?? null }));
    const after = computeExercisePoints(
      [...baseRows, { entryType: 'north_star', aiScore: evaluation.score }]);
    const before = computeExercisePoints(
      existing ? [...baseRows, { entryType: 'north_star', aiScore: existing.aiScore ?? null }] : baseRows);
    const gainDelta = after - before;

    // Update users.north_star (+ readiness gain line)
    await db.update(users).set({
      northStar: northStarValue,
      ...(gainDelta > 0 ? { lastReadinessGain: { delta: gainDelta, sourceLabel: LAYER_LABELS['north_star'] } } : {}),
      updatedAt: new Date(),
    }).where(eq(users.id, user.id));

    return res.status(200).json({
      score: evaluation.score,
      verdict: evaluation.verdict,
      mentorNote: evaluation.mentorNote,
      isVanity: evaluation.isVanity,
      betterAlternative: evaluation.betterAlternative ?? null,
    });
  } catch {
    return res.status(502).json({ error: 'ai_unavailable' });
  }
}
