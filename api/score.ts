import type { VercelRequest, VercelResponse } from '@vercel/node';
import { callClaude } from '../src/server/anthropic.js';
import { MODELS } from '../src/server/models.js';
import { z } from 'zod';
import { applyCors } from '../src/server/http.js';
import { checkRateLimit } from '../src/server/ratelimit.js';
import { clamp, LIMITS } from '../src/server/limits.js';

// Tolerant to LLM looseness (CLAUDE.md pattern): an off-count `steps` array or a
// stringy/out-of-range score must not THROW the founder's real onboarding analysis
// away to the generic FALLBACK. Accept any shape + coerce; clamp on return.
// Exported for unit tests (audit P5) — Vercel ignores named exports on handler files.
export const ScoreSchema = z.object({
  score: z.coerce.number().int().catch(60),
  summary: z.coerce.string().catch(''),
  level: z.object({
    n: z.coerce.number().int().catch(1),
    name: z.coerce.string().catch(''),
    why: z.coerce.string().catch(''),
    unlocksNext: z.coerce.string().catch(''),
  }).catch({ n: 1, name: '', why: '', unlocksNext: '' }),
  dimensions: z.array(z.object({
    key: z.coerce.string().catch(''),
    score: z.coerce.number().int().catch(50),
    read: z.coerce.string().catch(''),
  })).catch([]),
  strengths: z.array(z.object({
    dimension: z.coerce.string().catch(''),
    text: z.coerce.string().catch(''),
  })).catch([]),
  risks: z.array(z.object({
    text: z.coerce.string().catch(''),
    whyNow: z.coerce.string().catch(''),
  })).catch([]),
  roadmap: z.array(z.object({
    horizon: z.coerce.string().catch(''),
    title: z.coerce.string().catch(''),
    body: z.coerce.string().catch(''),
  })).catch([]),
  firstFocus: z.coerce.string().catch(''),
});

function computePercentile(score: number): number {
  return Math.min(92, Math.max(55, Math.round(score * 0.9 + 4)));
}

const SYSTEM_PROMPT = `You are Affina — an honest, warm startup mentor for early-stage female founders.
From 5 onboarding answers, produce a "Founder Readiness Snapshot": an overall score, a readiness LEVEL, 4 scored DIMENSIONS, 3 STRENGTHS, 3 strategic THREATS, a 90-day ROADMAP, a punchy SUMMARY, and this week's FIRST MOVE.

HONESTY (non-negotiable): you assess the CLARITY & READINESS of her thinking based ONLY on what she wrote — never the business's "true value". Do NOT invent facts, numbers, market sizes, or traction she didn't mention. When you infer, hedge ("based on what you've shared").

READINESS LADDER — pick her level honestly:
- L1 Spark — an idea, articulated
- L2 Focus — a specific customer + a specific pain
- L3 Validated — evidence from real people (interviews/signals)
- L4 Built — an MVP live in the world
- L5 Selling — first paying customers
Most idea-stage founders are L1–L2. Reserve L3+ for real evidence in her answers. "unlocksNext" = the ONE concrete thing that moves her up one level.

DIMENSIONS — score each 0–100 (readiness of her THINKING, not a valuation):
- problem_customer — how sharply she knows WHO and what PAIN
- market_timing — the opportunity / why-now signal in her answers
- business_model — does the money flow fit how her customer buys
- stage_momentum — where she is versus her stated ambition
Scoring honesty (do NOT default to 80): vague/undefined = 25–45; a real problem but broad = 46–65; clear problem + identifiable customer + some model = 66–80; sharp + specific + measurable value = 81–95. A vague idea must NOT score 80+.

STRENGTHS (exactly 3): each tagged to a dimension key, each echoing HER actual words — no generic praise.
THREATS (exactly 3): the biggest STRATEGIC threats to this venture — likely FUTURE, EXTERNAL obstacles (a competitor or incumbent move, a market or timing shift, a customer-adoption barrier, a channel or regulation risk). This is the SWOT "T": specific to her space, honest, forward-looking — NOT a current weakness in her answers and NOT a stage-based worry. Each is ONE plain sentence. Leave "whyNow" empty.
ROADMAP (exactly 3 paragraphs, horizons w1_2 / w3_6 / w7_12): each 3–4 sentences — what to do → why (tie to a named risk or weak dimension) → the PROOF she'll hold at the end (interviews done, offer sharpened, first yes). Describe the work; don't name modules.
SUMMARY: 2–3 sentences, honest but encouraging, referencing her actual idea.
firstFocus: the single most valuable action to take THIS week.

Respond ONLY with valid JSON, no other text.`;

const FALLBACK = {
  score: 58,
  percentileAheadOf: 56,
  summary: "You're onto a real problem worth solving — that's the hardest part to find. Right now the idea is still broad, which makes it harder to validate and sell. Sharpen who it's for and what changes for them, and this becomes something you can test in weeks.",
  firstFocus: "This week, have 5 honest conversations with people who have this problem — before building anything.",
  level: {
    n: 1,
    name: 'Spark',
    why: "You've articulated an idea — a real start — but it isn't yet tied to one specific customer and one specific pain.",
    unlocksNext: "Name one specific customer and the exact pain they feel to reach Level 2 — Focus.",
  },
  dimensions: [
    { key: 'problem_customer', score: 50, read: 'The problem is visible, but the customer is still described broadly.' },
    { key: 'market_timing', score: 52, read: "There's an opportunity here; the \"why now\" isn't spelled out yet." },
    { key: 'business_model', score: 48, read: 'A sense of how this makes money exists, but the details are early.' },
    { key: 'stage_momentum', score: 45, read: "You're at the idea stage — the next weeks are about evidence, not scale." },
  ],
  strengths: [
    { dimension: 'problem_customer', text: "You've identified a genuine problem — the kind people actually feel." },
    { dimension: 'stage_momentum', text: "You're taking a structured first step instead of guessing in the dark." },
    { dimension: 'business_model', text: 'You already have an instinct for how this could make money.' },
  ],
  risks: [
    { text: 'A larger, funded player could move into this space and out-spend you on reach before you build a loyal early base.', whyNow: '' },
    { text: 'Customer habits are hard to shift — the real fight is winning attention away from the tools people already use.', whyNow: '' },
    { text: 'A market or timing shift can expose a single-channel plan — keep more than one way to reach buyers.', whyNow: '' },
  ],
  roadmap: [
    { horizon: 'w1_2', title: 'Talk to 5 real people', body: "Find five people who likely have this problem and ask how they handle it today. You're not pitching — you're learning whether the pain is real and sharp enough to pay to remove. By the end you'll know if you're onto something or need to adjust." },
    { horizon: 'w3_6', title: 'Sharpen one offer', body: 'Using what you heard, narrow to ONE customer and ONE result you deliver, written as a single clear sentence anyone could repeat. This directly attacks the "too broad" risk. It turns a vague idea into something you can actually test and sell.' },
    { horizon: 'w7_12', title: 'Get a real yes', body: 'Build the simplest possible version — a landing page, a manual service, a prototype — and get real people to commit (sign up, pre-pay, or book). This is the proof that separates a hobby from a business. A single genuine yes from a stranger outweighs a hundred "great idea"s from friends.' },
  ],
};

// PRE-AUTH surface (SPEC_AUTH_PHASE_B §7): this is the onboarding report generator — it
// runs at the `analyzing` step before a session exists. Pure compute: it scores the intake
// fields in the body and returns; it never reads/writes user data, so there is nothing to
// leak and no session to require. Abuse is bounded by IP rate limiting (below).
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (applyCors(req, res, 'POST,OPTIONS')) return;

  const rl = await checkRateLimit(req); // IP-based only (pre-auth, no session email)
  if (!rl.ok) {
    if (rl.retryAfter) res.setHeader('Retry-After', String(rl.retryAfter));
    return res.status(429).json({ error: 'rate_limited', retryAfter: rl.retryAfter });
  }
  if (req.method !== 'POST') return res.status(405).json({ error: 'method not allowed' });

  // Length caps (audit F21) — pre-auth, no session, so keep the tightest bound.
  const idea = clamp(req.body?.idea, LIMITS.preAuthField);
  const customer = clamp(req.body?.customer, LIMITS.preAuthField);
  const businessModel = clamp(req.body?.businessModel, LIMITS.preAuthField);
  const stage = clamp(req.body?.stage, LIMITS.preAuthField);
  const goal = clamp(req.body?.goal, LIMITS.preAuthField);
  if (!idea.trim()) return res.status(200).json(FALLBACK);

  const userMessage = `Founder's onboarding answers:
- Business idea: "${idea}"
- Target customer: "${customer || 'not specified'}"
- Business model: "${businessModel || 'not specified'}"
- Stage: "${stage || 'not specified'}"
- Launch goal: "${goal || 'not specified'}"

Return JSON with exactly this structure:
{
  "score": <integer 0-100, overall readiness of her thinking>,
  "summary": "<2-3 sentence honest verdict referencing her actual idea>",
  "level": { "n": <1-5>, "name": "<Spark|Focus|Validated|Built|Selling>", "why": "<one line, honest>", "unlocksNext": "<one line: the single thing that reaches the next level>" },
  "dimensions": [
    { "key": "problem_customer", "score": <0-100>, "read": "<one line referencing her words>" },
    { "key": "market_timing", "score": <0-100>, "read": "<one line>" },
    { "key": "business_model", "score": <0-100>, "read": "<one line>" },
    { "key": "stage_momentum", "score": <0-100>, "read": "<one line>" }
  ],
  "strengths": [
    { "dimension": "<one of the 4 keys>", "text": "<echoes her actual words>" },
    { "dimension": "<key>", "text": "<echoes her words>" },
    { "dimension": "<key>", "text": "<echoes her words>" }
  ],
  "risks": [
    { "text": "<a strategic threat — a likely FUTURE external obstacle to this venture (competitor, market/timing, adoption, channel, regulation)>", "whyNow": "" },
    { "text": "<another strategic threat, specific to her space>", "whyNow": "" },
    { "text": "<another strategic threat>", "whyNow": "" }
  ],
  "roadmap": [
    { "horizon": "w1_2", "title": "<short label>", "body": "<3-4 sentences: what to do -> why -> the proof she'll hold>" },
    { "horizon": "w3_6", "title": "<short label>", "body": "<3-4 sentences>" },
    { "horizon": "w7_12", "title": "<short label>", "body": "<3-4 sentences>" }
  ],
  "firstFocus": "<one specific action: the single most valuable thing to do THIS week>"
}`;

  try {
    const message = await callClaude({
      model: MODELS.standard,
      max_tokens: 2200,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userMessage }],
    }, { endpoint: 'score', mode: 'score' });

    const raw = message.content[0].type === 'text' ? message.content[0].text : '';
    const match = raw.match(/\{[\s\S]*\}/);
    if (!match) throw new Error('no JSON');
    const parsed = ScoreSchema.parse(JSON.parse(match[0]));
    // A structurally-empty parse (model returned garbage) → keep the graceful fallback.
    if (!parsed.summary && parsed.dimensions.length === 0) return res.status(200).json(FALLBACK);
    const score = Math.max(0, Math.min(100, parsed.score));
    // Trim to the contracted counts (prompt demands 4/3/3/3; tolerate fewer, never more).
    return res.status(200).json({
      score,
      summary: parsed.summary,
      firstFocus: parsed.firstFocus,
      level: { ...parsed.level, n: Math.max(1, Math.min(5, parsed.level.n)) },
      dimensions: parsed.dimensions.slice(0, 4).map((d) => ({ ...d, score: Math.max(0, Math.min(100, d.score)) })),
      strengths: parsed.strengths.slice(0, 3),
      risks: parsed.risks.slice(0, 3),
      roadmap: parsed.roadmap.slice(0, 3),
      percentileAheadOf: computePercentile(score),
    });
  } catch {
    return res.status(200).json(FALLBACK);
  }
}
