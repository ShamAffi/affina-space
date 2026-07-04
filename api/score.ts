import type { VercelRequest, VercelResponse } from '@vercel/node';
import { callClaude } from '../src/server/anthropic.js';
import { MODELS } from '../src/server/models.js';
import { z } from 'zod';
import { applyCors } from '../src/server/http.js';
import { checkRateLimit } from '../src/server/ratelimit.js';

const ScoreSchema = z.object({
  score: z.number().int().min(0).max(100),
  summary: z.string(),
  steps: z.array(z.object({
    title: z.string(),
    body: z.string(),
  })).min(3).max(3),
  strength: z.string(),
  threat: z.string(),
  firstFocus: z.string(),
});

function computePercentile(score: number): number {
  return Math.min(92, Math.max(55, Math.round(score * 0.9 + 4)));
}

const SYSTEM_PROMPT = `You are Affina — an honest but encouraging startup mentor for early-stage female founders.
Based on a founder's onboarding answers, give a readiness score, 3 personalized next steps, a strength, and a first-month focus.

Scoring guide (be honest — do not default to 80):
- 20–45: Idea is vague, customer undefined, or very early stage
- 46–65: Real problem identified, customer partially described, limited clarity
- 66–80: Clear problem, identifiable customer segment, some thought given to model
- 81–95: Sharp idea, specific customer, measurable value, real traction

Rules:
- Reference their actual idea and words in the summary and steps — no generic advice.
- Each step title must be an action (verb-first, e.g. "Narrow your customer segment to X").
- Keep step body to 2 sentences max.
- strength: one sentence naming the founder's clearest competitive asset based on what they wrote.
- threat: one sentence naming the biggest near-future RISK to this business — a likely upcoming obstacle (market, competition, adoption, timing, regulation), NOT a current weakness in the answer. Think SWOT "T". Be honest and specific to their idea.
- firstFocus: one specific, actionable sentence — the single most valuable thing to do in Month 1.
- Respond ONLY with valid JSON, no other text.`;

const FALLBACK = {
  score: 62,
  percentileAheadOf: 60,
  strength: "You've identified a real problem with a clear target audience in mind.",
  threat: "A larger, funded player could move on this space before you build a loyal early base.",
  firstFocus: "Have 5 honest conversations with potential customers before building anything.",
  summary: "You're onto a real opportunity — there's a genuine problem here worth solving. Right now your idea is still broad, which makes it harder to validate and sell. With sharper focus on one customer and one offer, this can become a launch-ready business.",
  steps: [
    { title: 'Narrow your idea to one problem', body: 'Focus on one specific pain felt often and badly enough to pay for a fix. The narrower you go, the faster you can validate.' },
    { title: 'Name your first customer', body: "Don't say \"everyone\" — pick one type of person who suffers this problem most. Describe her life in one sentence." },
    { title: 'Define the result you deliver', body: 'What measurable change does your customer get? Time saved, money earned, stress removed — make it concrete.' },
  ],
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (applyCors(req, res, 'POST,OPTIONS')) return;

  const rl = await checkRateLimit(req);
  if (!rl.ok) {
    if (rl.retryAfter) res.setHeader('Retry-After', String(rl.retryAfter));
    return res.status(429).json({ error: 'rate_limited', retryAfter: rl.retryAfter });
  }
  if (req.method !== 'POST') return res.status(405).json({ error: 'method not allowed' });

  const { idea, customer, businessModel, stage, goal } = req.body;
  if (!idea?.trim()) return res.status(200).json(FALLBACK);

  const userMessage = `Founder's onboarding answers:
- Business idea: "${idea}"
- Target customer: "${customer || 'not specified'}"
- Business model: "${businessModel || 'not specified'}"
- Stage: "${stage || 'not specified'}"
- Launch goal: "${goal || 'not specified'}"

Return JSON with exactly this structure:
{
  "score": <integer 0-100>,
  "summary": "<2-3 sentences: honest assessment referencing their actual idea>",
  "steps": [
    { "title": "<action-oriented, specific to their idea>", "body": "<2 sentences max>" },
    { "title": "<action-oriented, specific to their idea>", "body": "<2 sentences max>" },
    { "title": "<action-oriented, specific to their idea>", "body": "<2 sentences max>" }
  ],
  "strength": "<one sentence: their clearest competitive asset based on what they wrote>",
  "threat": "<one sentence: the biggest near-future risk/obstacle to this business — SWOT 'T', not a current weakness>",
  "firstFocus": "<one specific action sentence: the single most valuable thing to do in Month 1>"
}`;

  try {
    const message = await callClaude({
      model: MODELS.standard,
      max_tokens: 900,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userMessage }],
    }, { endpoint: 'score', mode: 'score' });

    const raw = message.content[0].type === 'text' ? message.content[0].text : '';
    const match = raw.match(/\{[\s\S]*\}/);
    if (!match) throw new Error('no JSON');
    const parsed = ScoreSchema.parse(JSON.parse(match[0]));
    return res.status(200).json({
      ...parsed,
      percentileAheadOf: computePercentile(parsed.score),
    });
  } catch {
    return res.status(200).json(FALLBACK);
  }
}
