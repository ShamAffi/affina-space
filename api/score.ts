import type { VercelRequest, VercelResponse } from '@vercel/node';
import Anthropic from '@anthropic-ai/sdk';
import { z } from 'zod';

const ScoreSchema = z.object({
  score: z.number().int().min(0).max(100),
  summary: z.string(),
  steps: z.array(z.object({
    title: z.string(),
    body: z.string(),
  })).min(3).max(3),
});

export type OnboardingScore = z.infer<typeof ScoreSchema>;

const SYSTEM_PROMPT = `You are Affina — an honest but encouraging startup mentor for early-stage female founders.
Based on a founder's onboarding answers, give a readiness score and 3 personalized next steps.

Scoring guide (be honest — do not default to 80):
- 20–45: Idea is vague, customer undefined, or very early stage
- 46–65: Real problem identified, customer partially described, limited clarity
- 66–80: Clear problem, identifiable customer segment, some thought given to model
- 81–95: Sharp idea, specific customer, measurable value, real traction

Rules:
- Reference their actual idea and words in the summary and steps — no generic advice.
- Each step title must be an action (verb-first, e.g. "Narrow your customer segment to X").
- Keep step body to 2 sentences max.
- Respond ONLY with valid JSON, no other text.`;

const FALLBACK: OnboardingScore = {
  score: 62,
  summary: "You're onto a real opportunity — there's a genuine problem here worth solving. Right now your idea is still broad, which makes it harder to validate and sell. With sharper focus on one customer and one offer, this can become a launch-ready business.",
  steps: [
    { title: 'Narrow your idea to one problem', body: 'Focus on one specific pain felt often and badly enough to pay for a fix. The narrower you go, the faster you can validate.' },
    { title: 'Name your first customer', body: "Don't say \"everyone\" — pick one type of person who suffers this problem most. Describe her life in one sentence." },
    { title: 'Define the result you deliver', body: 'What measurable change does your customer get? Time saved, money earned, stress removed — make it concrete.' },
  ],
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'method not allowed' });

  const { idea, customer, businessModel, stage } = req.body;
  if (!idea?.trim()) return res.status(200).json(FALLBACK);

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const userMessage = `Founder's onboarding answers:
- Business idea: "${idea}"
- Target customer: "${customer || 'not specified'}"
- Business model: "${businessModel || 'not specified'}"
- Stage: "${stage || 'not specified'}"

Return JSON with exactly this structure:
{
  "score": <integer 0-100>,
  "summary": "<2-3 sentences: honest assessment referencing their actual idea>",
  "steps": [
    { "title": "<action-oriented, specific to their idea>", "body": "<2 sentences max>" },
    { "title": "<action-oriented, specific to their idea>", "body": "<2 sentences max>" },
    { "title": "<action-oriented, specific to their idea>", "body": "<2 sentences max>" }
  ]
}`;

  try {
    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 800,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userMessage }],
    });

    const raw = message.content[0].type === 'text' ? message.content[0].text : '';
    const match = raw.match(/\{[\s\S]*\}/);
    if (!match) throw new Error('no JSON');
    return res.status(200).json(ScoreSchema.parse(JSON.parse(match[0])));
  } catch {
    return res.status(200).json(FALLBACK);
  }
}
