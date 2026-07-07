import type { VercelRequest, VercelResponse } from '@vercel/node';
import { callClaude } from '../src/server/anthropic.js';
import { MODELS } from '../src/server/models.js';
import { z } from 'zod';
import { applyCors } from '../src/server/http.js';
import { requireAuth } from '../src/server/requireAuth.js';
import { checkRateLimit } from '../src/server/ratelimit.js';
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { eq, and } from 'drizzle-orm';
import { users, brainEntries, tasks, delegations } from '../src/db/schema.js';
import { computeExercisePoints, LAYER_LABELS } from '../src/server/progressUtils.js';
import { RUBRICS, GLOBAL_RUBRIC_RULES, NO_SCORE_LESSONS } from '../src/rubrics.js';

// Tolerant to LLM looseness (CLAUDE.md pattern): the model sometimes returns 3 strengths,
// 0 gaps, a stringy score, etc. Strict .min()/.max() used to THROW on those → a silent 502
// ("mentor couldn't respond") even though the answer was fine. Accept any counts and coerce;
// we clamp for display after parsing.
const FeedbackSchema = z.object({
  score: z.coerce.number().int().min(0).max(100).nullable().catch(null),
  verdict: z.enum(['strong', 'ok', 'can_be_stronger']).catch('ok'),
  good: z.array(z.coerce.string()).catch([]),
  missing: z.array(z.coerce.string()).catch([]),
  nextStep: z.coerce.string().catch(''),
  realWorldTask: z.union([
    z.object({ title: z.coerce.string(), instruction: z.coerce.string() }),
    z.null(),
  ]).catch(null),
});

export type AiFeedback = z.infer<typeof FeedbackSchema>;

// Tolerant like FeedbackSchema (CLAUDE.md): the model sometimes scores 0/6, mismatches the
// total, or returns 5 candidates — strict ranges used to THROW → a silent 502. Coerce +
// clamp per field; total is recomputed from the scores after parse, and candidates sliced to 4.
const score = z.coerce.number().int().min(1).max(5).catch(3);
const CompareSchema = z.object({
  candidates: z.array(z.object({
    label: z.coerce.string().catch(''),
    painIntensity: score,
    reachability: score,
    abilityToPay: score,
    wordOfMouth: score,
    total: z.coerce.number().int().catch(0),
  })).catch([]),
  recommendation: z.coerce.string().catch(''),
  runnerUp: z.coerce.string().catch(''),
  nextStep: z.coerce.string().catch(''),
});

export type CompareResult = z.infer<typeof CompareSchema>;

function getDb() {
  const sql = neon(process.env.DATABASE_URL!);
  return drizzle(sql, { schema: { users, brainEntries, tasks, delegations } });
}

const DELEGATE_SYSTEM = `You are Affina — the founder's AI mentor, drafting ON BEHALF of the founder, from her own data only.

SOURCE RULE: build the draft exclusively from her Brain — intake, Snapshot, prior
answers, interview log. Use her words and phrasing wherever they exist.

NO-FABRICATION RULE (absolute): never invent facts, interview quotes, numbers,
customer commitments, or life details. Delegate exists for FORMULATION, not for facts.
If the Brain lacks material for an honest draft — do not improvise. Say what's
missing and ask exactly ONE question; draft after she answers.

QUALITY BAR: the draft must pass this block's own rubric at ≥70. Self-check before
returning; regenerate once if below.

MODE A (single draft): answer the exercise prompt directly, first person as the founder
("I", "my customer"). Match the format the exercise asks for. Output ONLY the draft text —
no footer, no disclaimer, no sign-off: the UI shows the "draft to react to" note itself.

MODE B (variants): produce 2–3 genuinely DIFFERENT takes (different angle each — e.g.
pain-led vs result-led vs audience-led), not paraphrases. Respond ONLY with valid JSON:
{ "variants": [{ "label": "<the angle, 2-4 words>", "text": "<the draft>" }] }

MODE C (analysis only): you NEVER write her decision — you give her a fast read to decide
from. Speak in SECOND PERSON, directly to the founder ("you", "your interviews"). NEVER
third person — no "she", "her", "the founder". Build every point from her Brain; no
fabrication (if the Brain lacks material, ask ONE question instead).
Respond ONLY with valid JSON:
{ "analysis": {
  "verdict": "ONE line: the lean, decisive. 'Your evidence points to <X>.' Name a concrete choice — never 'it depends'.",
  "reason":  "ONE line: the single strongest reason from her Brain.",
  "gap":     "ONE line: the one thing that would let you defend the other option — 'To defend <Y> instead, you'd first need <Z>.'",
  "for":     ["≤3 points, ONE line each (≤15 words), each anchored to a real Brain fact"],
  "against": ["≤3 points, ONE line each (≤15 words), same rule"]
} }
No paragraphs. No disclaimers, no meta-labels, no 'this is a recommendation' preamble in
any field — the UI shows the 'analysis, not your decision' note.`;

const DelegateVariantsSchema = z.object({
  variants: z.array(z.object({ label: z.string(), text: z.string() })).min(2).max(3),
});
// Mode C "mentor's read" (SPEC_DELEGATE_C_REWORK §2): verdict/reason/gap replace the old
// buried recommendation; for/against are the collapsed detail. Tolerant (coerce/.catch, no
// strict counts that could 502); clamped to ≤3 bullets in the handler.
const DelegateAnalysisSchema = z.object({
  analysis: z.object({
    verdict: z.coerce.string().catch(''),
    reason: z.coerce.string().catch(''),
    gap: z.coerce.string().catch(''),
    for: z.array(z.coerce.string()).catch([]),
    against: z.array(z.coerce.string()).catch([]),
  }),
});

const FEEDBACK_SYSTEM_PROMPT = `You are Affina — a warm but honest startup mentor for early-stage female founders.
Your job: evaluate a founder's exercise answer and return structured feedback.

Rules:
- Be specific. Reference the actual words in their answer.
- Always find at least one genuine positive, even in a weak answer — it keeps founders going.
- Identify concrete gaps (not vague "improve your phrasing" — say exactly what's missing).
- Give exactly ONE next step. If it's a real-world action outside the app (e.g. interview customers, build a landing page, run an ad), set realWorldTask with a short imperative title (≤6 words) AND the full detailed instruction. If it's just an in-app rewrite, set realWorldTask to null.
- Tone: warm but direct. "This describes the product, not the value to the person" — not "Great work!".
- Respond ONLY with valid JSON, no other text.

GLOBAL RUBRIC RULES (always in force):
${GLOBAL_RUBRIC_RULES}`;

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
  if (applyCors(req, res, 'POST,OPTIONS')) return;
  if (req.method !== 'POST') return res.status(405).json({ error: 'method not allowed' });

  // Auth Phase B (§2/§7): every mode operates on HER data → session-guarded, EXCEPT
  // `generate-name`, which runs during onboarding (project-name step) before a session
  // exists and is pure compute (no user data). Pre-auth = IP-limited; the rest key the
  // limiter on the session email and derive identity ONLY from the cookie.
  const preAuth = req.body?.mode === 'generate-name';
  let email = '';
  if (!preAuth) {
    const authed = requireAuth(req, res);
    if (!authed) return;
    email = authed;
  }
  const rl = await checkRateLimit(req, preAuth ? undefined : { email });
  if (!rl.ok) {
    if (rl.retryAfter) res.setHeader('Retry-After', String(rl.retryAfter));
    return res.status(429).json({ error: 'rate_limited', retryAfter: rl.retryAfter });
  }

  // Interview transcript extraction (SPEC_INTERVIEW_LOG_TRANSCRIPT §5).
  // NOT a Delegate mode (§6): this only RESTRUCTURES her own pasted real data into
  // the 5 interview-log fields — it never invents an interview, quote, or verdict.
  if (req.body.mode === 'extract-interview') {
    const { text } = req.body;
    if (!text?.trim()) return res.status(400).json({ error: 'text required' });
    const conf = z.enum(['found', 'unclear']).catch('unclear');
    const Field = z.object({ value: z.coerce.string().catch(''), confidence: conf });
    const ExtractSchema = z.object({
      who: Field, mainPain: Field, keyQuotes: Field, priceSignal: Field, verdict: Field,
    });
    try {
      const msg = await callClaude({
        model: MODELS.standard,
        max_tokens: 1200,
        system: `You are extracting structured fields from a founder's raw interview notes or transcript. Do not invent anything not present in the text.

Extract, if present:
- who: name/role/segment of the interviewee
- mainPain: their main pain + how they currently solve it
- keyQuotes: their most telling verbatim words (prefer exact phrasing over paraphrase)
- priceSignal: anything about money — what they pay today, reaction to price
- verdict: only if SHE explicitly stated a conclusion in the notes (confirms/contradicts her hypothesis) — do not infer a verdict she didn't state; leave it empty for her to write if it's not clearly there.

For each field, mark confidence: "found" (clearly stated) or "unclear" (inferred/thin/absent). Never fabricate to avoid an "unclear" flag — an honest gap is better than an invented answer. An absent field must be {"value":"","confidence":"unclear"}.

Respond ONLY with valid JSON:
{"who":{"value":"...","confidence":"found|unclear"},"mainPain":{...},"keyQuotes":{...},"priceSignal":{...},"verdict":{...}}`,
        messages: [{ role: 'user', content: `Raw interview notes / transcript:\n"""\n${String(text).slice(0, 8000)}\n"""` }],
      }, { endpoint: 'ai', mode: 'extract-interview', email });
      const raw = msg.content[0].type === 'text' ? msg.content[0].text : '';
      const match = raw.match(/\{[\s\S]*\}/);
      if (!match) throw new Error('no JSON');
      const p = ExtractSchema.parse(JSON.parse(match[0]));
      // Map spec field names → component keys (mainPain→pain, keyQuotes→quotes)
      return res.status(200).json({
        fields: {
          who: p.who.value, pain: p.mainPain.value, quotes: p.keyQuotes.value,
          priceSignal: p.priceSignal.value, verdict: p.verdict.value,
        },
        confidence: {
          who: p.who.confidence, pain: p.mainPain.confidence, quotes: p.keyQuotes.confidence,
          priceSignal: p.priceSignal.confidence, verdict: p.verdict.confidence,
        },
      });
    } catch {
      return res.status(502).json({ error: 'ai_unavailable' });
    }
  }

  // m4l5 per-block AI assist (SPEC_M4L5_THREE_BLOCK). Structures her own Brain data
  // into evidence blocks; each mode fills ONLY its own block(s), never the others.
  if (req.body.mode === 'psc-for-against') {
    const db = getDb();
    const user = await db.query.users.findFirst({ where: eq(users.email, email) });
    if (!user) return res.status(404).json({ error: 'user not found' });
    const entries = await db.query.brainEntries.findMany({ where: eq(brainEntries.userId, user.id) });
    const byType: Record<string, string> = {};
    for (const e of entries) if (e.content) byType[e.entryType] = e.content;
    const Schema = z.object({ for: z.coerce.string().catch(''), against: z.coerce.string().catch('') });
    try {
      const msg = await callClaude({
        model: MODELS.standard,
        max_tokens: 900,
        system: `You are helping a founder check her Module 1 idea against her real Module 3 customer interviews. From her Brain ONLY, draft two evidence blocks in her first person ("I"/"my"):
- for: what her interviews CONFIRM about her original hypothesis — concrete evidence, quotes, patterns that support it.
- against: what her interviews CONTRADICT or that surprised her — evidence that challenges or reorders the hypothesis.
Use her actual data (her value proposition/hypothesis, interview log, persona, market notes). NEVER invent interviews, quotes, or findings not in her Brain. If the evidence is thin on a side, say so honestly and briefly rather than padding. Do NOT write a conclusion or a decision — only the two evidence blocks. Respond ONLY with valid JSON: {"for":"...","against":"..."}`,
        messages: [{ role: 'user', content: `HER HYPOTHESIS / VALUE PROP: ${byType['value_proposition'] || byType['mission_vision'] || '(not written)'}
PERSONA: ${byType['persona'] || '(not written)'}
INTERVIEW LOG: ${byType['interview_log'] || '(no interviews logged yet)'}
MARKET / COMPETITORS: ${byType['competitive_landscape'] || byType['positioning'] || '(none)'}

Draft her For (confirms) and Against (contradicts/surprised) from this.` }],
      }, { endpoint: 'ai', mode: 'psc-for-against', email });
      const raw = msg.content[0].type === 'text' ? msg.content[0].text : '';
      const match = raw.match(/\{[\s\S]*\}/);
      if (!match) throw new Error('no JSON');
      const p = Schema.parse(JSON.parse(match[0]));
      return res.status(200).json({ for: p.for, against: p.against });
    } catch {
      return res.status(502).json({ error: 'ai_unavailable' });
    }
  }

  if (req.body.mode === 'psc-conclusion') {
    const { forText, againstText } = req.body;
    if (!forText?.trim() && !againstText?.trim()) return res.status(400).json({ error: 'for/against required' });
    const Schema = z.object({ conclusion: z.coerce.string().catch('') });
    try {
      const msg = await callClaude({
        model: MODELS.standard,
        max_tokens: 600,
        system: `A founder has weighed what her interviews CONFIRM vs CONTRADICT about her idea. From the two blocks she gives you — and ONLY those — draft a starting CONCLUSION in her first person: what she should keep, what to change, and why, grounded strictly in the For/Against provided. This is a draft for her to edit and make her own — keep it honest and specific to her evidence, not generic startup advice. Do not invent evidence beyond the two blocks. Respond ONLY with valid JSON: {"conclusion":"..."}`,
        messages: [{ role: 'user', content: `FOR (confirms):\n${forText || '(empty)'}\n\nAGAINST (contradicts/surprised):\n${againstText || '(empty)'}\n\nDraft her conclusion.` }],
      }, { endpoint: 'ai', mode: 'psc-conclusion' });
      const raw = msg.content[0].type === 'text' ? msg.content[0].text : '';
      const match = raw.match(/\{[\s\S]*\}/);
      if (!match) throw new Error('no JSON');
      const p = Schema.parse(JSON.parse(match[0]));
      return res.status(200).json({ conclusion: p.conclusion });
    } catch {
      return res.status(502).json({ error: 'ai_unavailable' });
    }
  }

  // Generate project name mode — cheap Haiku call, no lesson context required
  if (req.body.mode === 'generate-name') {
    const { idea, customer, businessModel, stage, avoid } = req.body;
    if (!idea?.trim()) return res.status(200).json({ name: '' });
    const avoidList: string[] = Array.isArray(avoid) ? avoid.filter(Boolean) : [];
    const avoidLine = avoidList.length
      ? `\nAlready suggested — return something clearly DIFFERENT in sound and root: ${avoidList.join(', ')}.`
      : '';
    const message = await callClaude({
      model: MODELS.standard,
      max_tokens: 32,
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
    }, { endpoint: 'ai', mode: 'name-gen' });
    const raw = message.content[0].type === 'text' ? message.content[0].text.trim() : '';
    const name = raw.replace(/["""''`*.\n]/g, '').trim().split(/\s+/).slice(0, 2).join(' ');
    return res.status(200).json({ name });
  }

  // §4 Delegate — "Let AI mentor draft this for me" (after ≥1 user attempt; logged for the credit model)
  if (req.body.mode === 'delegate') {
    const { lessonId, lessonTitle, prompt, delegateMode } = req.body;
    if (!lessonId) return res.status(400).json({ error: 'lessonId required' });
    const dMode: 'A' | 'B' | 'C' = delegateMode === 'B' || delegateMode === 'C' ? delegateMode : 'A';

    const db = getDb();
    const user = await db.query.users.findFirst({ where: eq(users.email, email) });
    if (!user) return res.status(404).json({ error: 'user not found' });

    const entries = await db.query.brainEntries.findMany({ where: eq(brainEntries.userId, user.id) });
    const snap = user.snapshot as { sections: { title: string; content: string }[] } | null;
    const snapText = snap
      ? snap.sections.map((s) => `## ${s.title}\n${s.content}`).join('\n')
      : '(no snapshot yet)';
    const brainDump = entries
      .filter((e) => e.entryType !== 'startup_snapshot' && e.lessonId !== lessonId)
      .map((e) => `[${e.entryType}] ${(e.content ?? '').slice(0, 600)}`)
      .join('\n\n');

    const modeTask =
      dMode === 'B' ? `MODE B — produce the JSON variants for this exercise.`
      : dMode === 'C' ? `MODE C — give her the fast read (verdict + reason + gap, then ≤3 short for/against one-liners) to decide from. Do NOT write the decision itself.`
      : `MODE A — draft the founder's answer.`;

    try {
      const msg = await callClaude({
        model: MODELS.standard,
        max_tokens: dMode === 'A' ? 900 : dMode === 'C' ? 600 : 1400,
        system: DELEGATE_SYSTEM,
        messages: [{
          role: 'user',
          content: `STARTUP SNAPSHOT:\n${snapText}\n\nOTHER BRAIN ENTRIES:\n${brainDump || '(none yet)'}\n\nEXERCISE — "${lessonTitle}":\n${prompt || 'Write the answer for this exercise.'}\n\n${modeTask}`,
        }],
      }, { endpoint: 'ai', mode: `delegate-${dMode}`, email });
      const raw = msg.content[0].type === 'text' ? msg.content[0].text.trim() : '';
      if (!raw) throw new Error('empty');

      // §10.5 — log every delegation (userId, lessonId, timestamp)
      try { await db.insert(delegations).values({ userId: user.id, lessonId }); } catch { /* log must not block */ }

      if (dMode === 'B' || dMode === 'C') {
        const match = raw.match(/\{[\s\S]*\}/);
        if (!match) {
          // NO-FABRICATION path (§2.1): the Brain lacks material — the model asks ONE question instead
          return res.status(200).json({ question: raw.slice(0, 600) });
        }
        if (dMode === 'B') {
          const parsed = DelegateVariantsSchema.parse(JSON.parse(match[0]));
          return res.status(200).json({ variants: parsed.variants });
        }
        const parsed = DelegateAnalysisSchema.parse(JSON.parse(match[0]));
        // ≤3 one-line bullets each (schema stays tolerant so an off-count never 502s).
        parsed.analysis.for = parsed.analysis.for.slice(0, 3);
        parsed.analysis.against = parsed.analysis.against.slice(0, 3);
        return res.status(200).json({ analysis: parsed.analysis });
      }
      // Safety strip: the react-to-it footer belongs to the UI, never to the draft text
      const aiDraft = raw.replace(/(?:\n|^)\s*(?:[-—–_*]{2,}\s*)?This is a draft to react to[\s\S]*$/i, '').trim();
      return res.status(200).json({ aiDraft });
    } catch (err) {
      console.error('delegate error', dMode, err instanceof Error ? err.message : err);
      return res.status(502).json({ error: 'ai_unavailable' });
    }
  }

  const { lessonId, lessonTitle, prompt, answer, aiMode, context } = req.body;
  const contextBlock = context?.idea
    ? `\n\nFounder context (use this to personalize feedback — reference their actual project and address them by name):\n- Name: ${context.name || 'not provided'}\n- Idea: ${context.idea}\n- Target customer: ${context.customer || 'not specified'}\n- Stage: ${context.stage || 'not specified'}`
    : '';
  if (!lessonId || !answer?.trim()) {
    return res.status(400).json({ error: 'lessonId and answer are required' });
  }

  const isCompare = aiMode === 'compare';

  let result: AiFeedback | CompareResult;

  try {
    if (isCompare) {
      const compareRubric = RUBRICS[lessonId]
        ? `\nSCORING RUBRIC FOR THIS BLOCK:\n${RUBRICS[lessonId]}\n`
        : '';
      const userMessage = `Lesson: ${lessonTitle}
Exercise: ${prompt}
Founder's answer: "${answer}"
${compareRubric}
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
      const message = await callClaude({
        model: MODELS.standard,
        max_tokens: 1024,
        // §4 caching: stable rubric/system in a cached block; her answer + per-user
        // context go in the user turn (never above the cache breakpoint).
        system: [{ type: 'text', text: COMPARE_SYSTEM_PROMPT, cache_control: { type: 'ephemeral' } }],
        messages: [{ role: 'user', content: userMessage + contextBlock }],
      }, { endpoint: 'ai', mode: 'compare', email });
      const raw = message.content[0].type === 'text' ? message.content[0].text : '';
      const match = raw.match(/\{[\s\S]*\}/);
      if (!match) throw new Error('no JSON in response');
      const parsed = CompareSchema.parse(JSON.parse(match[0]));
      // Trust the 4 scores; recompute total (the model often mismatches it) + cap at 4 cards.
      parsed.candidates = parsed.candidates.slice(0, 4).map((c) => ({
        ...c, total: c.painIntensity + c.reachability + c.abilityToPay + c.wordOfMouth,
      }));
      result = parsed;
    } else {
      const rubric = RUBRICS[lessonId];
      const noScore = NO_SCORE_LESSONS.includes(lessonId);
      const rubricBlock = rubric
        ? `\nSCORING RUBRIC FOR THIS BLOCK (overrides the generic rubric):\n${rubric}\n`
        : '\nEvaluation rubric: problem clarity · target segment · measurable result\n';
      const scoreLine = noScore
        ? '"score": null,  // DO NOT SCORE this intake block — extraction + follow-ups only (see rubric)'
        : '"score": <integer 0-100>,';
      // m4l5 provenance (SPEC_M4L5_THREE_BLOCK §7): flag an unedited AI conclusion.
      const prov = req.body.provenance as { conclusionDrafted?: boolean; conclusionEditedAfterDraft?: boolean } | undefined;
      const provBlock = prov?.conclusionDrafted && !prov.conclusionEditedAfterDraft
        ? '\nPROVENANCE: her CONCLUSION is the AI draft, accepted UNEDITED. Apply the rubric provenance rule — the "explicit delta / her reasoning" criterion cannot score in the top band; gently ask her to say in her own words what SHE is changing and why. Do not penalize her for using the draft, only for not engaging with it.\n'
        : '';
      const userMessage = `Lesson: ${lessonTitle}
Exercise: ${prompt}
Founder's answer: "${answer}"
${rubricBlock}${provBlock}
Return JSON with exactly this structure:
{
  ${scoreLine}
  "verdict": <"strong" if score≥80, "ok" if score 55-79, "can_be_stronger" if score<55>,
  "good": [<1-2 specific strengths from their actual answer>],
  "missing": [<1-3 specific gaps referencing what they wrote — not generic advice>],
  "nextStep": "<one concrete next step>",
  "realWorldTask": null | { "title": "<≤6 word imperative, e.g. 'Interview 5 target customers'>", "instruction": "<full detailed instruction with context, how-to, and expected output>" }
}`;
      const message = await callClaude({
        model: MODELS.standard,
        max_tokens: 1024,
        // §4 caching: stable feedback rubric (FEEDBACK_SYSTEM_PROMPT + GLOBAL_RUBRIC_RULES)
        // in a cached block; her answer + per-user context go in the user turn.
        system: [{ type: 'text', text: FEEDBACK_SYSTEM_PROMPT, cache_control: { type: 'ephemeral' } }],
        messages: [{ role: 'user', content: userMessage + contextBlock }],
      }, { endpoint: 'ai', mode: 'feedback', email });
      const raw = message.content[0].type === 'text' ? message.content[0].text : '';
      const match = raw.match(/\{[\s\S]*\}/);
      if (!match) throw new Error('no JSON in response');
      const parsed = FeedbackSchema.parse(JSON.parse(match[0]));
      // Schema no longer enforces counts (was a silent-502 source); clamp for a tidy card.
      parsed.good = parsed.good.slice(0, 3);
      parsed.missing = parsed.missing.slice(0, 3);
      result = parsed;
    }
  } catch (err) {
    console.error('[ai] feedback/compare failed:', err instanceof Error ? err.message : err);
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
        // §7: exercises contribute +1 (score ≥50) / +1.5 (score ≥80) — delta comes from that component.
        if (!isCompare) {
          const allEntries = await db.query.brainEntries.findMany({ where: eq(brainEntries.userId, user.id) });
          const after = computeExercisePoints(
            allEntries.map((e) => ({ entryType: e.entryType, aiScore: e.aiScore ?? null })));
          const before = computeExercisePoints(
            allEntries.map((e) => ({ entryType: e.entryType, aiScore: e.lessonId === lessonId ? oldScore : (e.aiScore ?? null) })));
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
