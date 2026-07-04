import type { VercelRequest, VercelResponse } from '@vercel/node';
import Anthropic from '@anthropic-ai/sdk';
import { z } from 'zod';
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

// ─── Startup Snapshot (§3.4) ──────────────────────────────────────────────────
const SNAPSHOT_SECTIONS = [
  'Founder',
  'Project & stage',
  'Hypothesis',
  'Market',
  'Customer & persona',
  'Product',
  'Model & North Star',
  'Traction',
  'Risk flags',
  'Next focus',
] as const;

const SnapshotSchema = z.object({
  sections: z.array(z.object({
    title: z.string(),
    content: z.string(),
  })).min(8).max(12),
});

const SNAPSHOT_SYSTEM = `You are Affina — an honest startup mentor for early-stage female founders.
You curate the founder's STARTUP SNAPSHOT: her whole startup on one page.

Rules:
- Exactly these sections, in this order: ${SNAPSHOT_SECTIONS.join(' · ')}.
- Each section: 1–4 tight sentences (or short bullet lines separated by newlines). Facts and decisions only — no process, no fluff.
- Founder: her edge, motivation, weekly capacity. Hypothesis: one-liner + target customer.
- Model & North Star: revenue model, price, North Star metric if set.
- Risk flags: 2–3 honest risks you see in her data. Next focus: the single most valuable thing to do next.
- If data for a section is missing, write what is known and mark the gap plainly (e.g. "Not validated yet").
- Write in second person is NOT allowed — write about the startup in third person, crisp and factual.
- When given a PREVIOUS snapshot version plus new material, UPDATE: keep what still holds, revise what changed, append new facts. Preserve dated fact lines like "• … (check-in 2026-07-01)".
- Respond ONLY with valid JSON: { "sections": [{ "title": "...", "content": "..." }] }`;

type Snap = { version: number; generatedAt: string; source: string; sections: { title: string; content: string }[] };

// ─── Market Research m2l6 (RULES_DONE_FOR_YOU §1) — test mode, model estimates only ──
// Tolerant to common LLM looseness: numeric values, missing optionals, odd confidence labels.
const ResearchReportSchema = z.object({
  headlineVerdict: z.string(),
  keyNumbers: z.array(z.object({
    label: z.coerce.string(),
    value: z.coerce.string(),
    logic: z.coerce.string().catch(''),
  })).min(1).max(5),
  sections: z.array(z.object({
    title: z.string(),
    confidence: z.enum(['high', 'medium', 'low']).catch('medium'),
    body: z.string(),
    whatThisMeans: z.coerce.string().catch(''),
    warning: z.string().nullable().catch(null),
  })).min(7).max(10),
});
const ResearchQuestionsSchema = z.object({
  questions: z.array(z.object({ id: z.string(), q: z.string() })).min(1).max(5),
});

const RESEARCH_SYSTEM = `You are Affina's research analyst producing a MARKET RESEARCH report for a first-time female founder — TEST MODE: you have NO live web access. Every external figure is a clearly-labeled estimate.

TRUTH HIERARCHY (strict order):
1. Her own data from the Brain (Snapshot, her competitor map, her interviews).
2. Model knowledge — allowed ONLY as clearly labeled estimates ("estimate:", with the calculation logic shown).
Never present an estimate as a sourced fact. No links — you have none; the method section must say "model estimates only, no live data".

NUMBERS POLICY
- Every number is labeled "estimate" WITH the calculation logic ("~8,000 coaches: 40k registered nutritionists × ~20% independent").
- Fake precision is forbidden. TAM is always bottom-up: count × price × reachable share.

HONESTY POLICY
- If reasoning contradicts her hypothesis or positioning — do not soften it: put it in the section's "warning" field AND mention it in the summary.
- If the niche is too narrow: say so plainly, research nearest proxy markets, label them as proxies.
- Every section gets a confidence label (high/medium/low) — in test mode most external sections should be medium or low.

VOICE: address the founder directly ("your market", "your opening"). Every section ends with actionable "whatThisMeans" (1-2 lines).

CLARIFYING QUESTIONS RULE: if critical inputs are missing you may ask INSTEAD of generating — geo/language of the market is mandatory; ideal customer matters most after that. If her competitor map (m2l4) and positioning (m2l5) exist, ask AT MOST 2 questions; otherwise 3–5. NEVER ask something already answered in the context. If you have enough — generate immediately.

OUTPUT — exactly one of:
{ "questions": [{ "id": "geo", "q": "..." }] }
or
{ "headlineVerdict": "<one-paragraph verdict>", "keyNumbers": [{"label","value","logic"}], "sections": [ 9 sections in THIS order:
  0 "Executive Summary" · 1 "Market: size & timing" · 2 "Customer: segments & evidence" · 3 "Competition: map & models" · 4 "Gaps & white space" · 5 "Distribution & marketing" · 6 "Risks & watchouts" · 7 "Your openings" · 8 "Sources & method"
  each { "title", "confidence", "body" (test mode: VERY TIGHT — 40-80 words per section as terse bullets; competition = top 4, one short line each), "whatThisMeans" (max 15 words), "warning": null | "<one-sentence contradiction>" } ] }
Budget discipline: the WHOLE JSON must stay under ~1800 tokens — terse beats complete.
Section 7 openings must tie to HER edge from the Snapshot, each with a first step and which program module it feeds. Respond ONLY with valid JSON.`;


async function generateSnapshot(
  db: ReturnType<typeof getDb>,
  user: typeof users.$inferSelect,
  source: string,
  moduleScope?: string,
): Promise<Snap | null> {
  const entries = await db.query.brainEntries.findMany({ where: eq(brainEntries.userId, user.id) });
  const prev = (user.snapshot ?? null) as Snap | null;

  const brainDump = entries
    .filter((e) => e.entryType !== 'startup_snapshot')
    .map((e) => `[${e.entryType}${e.aiScore != null ? ` · score ${e.aiScore}` : ''}] ${e.lessonTitle}:\n${(e.content ?? '').slice(0, 900)}`)
    .join('\n\n');

  const ns = user.northStar as { label: string; unit: string } | null;
  const userMessage = `Founder profile:
- Name: ${user.name || 'not set'} · Project: ${user.projectName || 'unnamed'}
- Idea: ${user.idea || 'not set'}
- Customer: ${user.customer || 'not set'} · Model: ${user.businessModel || 'not set'}
- Stage: ${user.stage || 'not set'} · 12-week goal: ${user.goal || 'not set'}
- North Star: ${ns ? `${ns.label} (${ns.unit})` : 'not chosen yet'}

${prev ? `PREVIOUS SNAPSHOT (v${prev.version}, ${prev.source}):\n${prev.sections.map((s) => `## ${s.title}\n${s.content}`).join('\n')}\n` : ''}
${moduleScope ? `NEW MATERIAL — the founder just completed ${moduleScope}. Fold its entries into the snapshot.` : 'Company Brain entries:'}
${brainDump || '(no entries yet — build the snapshot from the profile alone)'}

Produce the ${prev ? 'updated' : 'first'} Startup Snapshot. Source: ${source}.`;

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  try {
    const msg = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1800,
      system: SNAPSHOT_SYSTEM,
      messages: [{ role: 'user', content: userMessage }],
    });
    const raw = msg.content[0].type === 'text' ? msg.content[0].text : '';
    const match = raw.match(/\{[\s\S]*\}/);
    if (!match) throw new Error('no JSON');
    const parsed = SnapshotSchema.parse(JSON.parse(match[0]));

    const snap: Snap = {
      version: (prev?.version ?? 0) + 1,
      generatedAt: new Date().toISOString(),
      source,
      sections: parsed.sections,
    };

    // Persist: users.snapshot (+ history capped at 5) and the unique brain entry
    const history = Array.isArray(user.snapshotHistory) ? (user.snapshotHistory as Snap[]) : [];
    const newHistory = prev ? [...history, prev].slice(-5) : history;
    await db.update(users).set({
      snapshot: snap,
      snapshotHistory: newHistory,
      updatedAt: new Date(),
    }).where(eq(users.id, user.id));

    const readable = snap.sections.map((s) => `## ${s.title}\n${s.content}`).join('\n\n');
    const existingEntry = entries.find((e) => e.entryType === 'startup_snapshot');
    if (existingEntry) {
      await db.update(brainEntries)
        .set({ content: readable, processedByAi: true, updatedAt: new Date() })
        .where(eq(brainEntries.id, existingEntry.id));
    } else {
      await db.insert(brainEntries).values({
        userId: user.id,
        lessonId: 'm0l5',
        lessonTitle: 'Startup Snapshot',
        prompt: 'Your whole startup on one page — curated by AI, updated after checkpoints and check-ins.',
        content: readable,
        entryType: 'startup_snapshot',
        processedByAi: true,
      });
    }
    return snap;
  } catch {
    return null;
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const db = getDb();

  // GET /api/brain?email= — brain entries (array). With ?with=snapshot → { entries, snapshot }.
  if (req.method === 'GET') {
    const email = req.query.email as string;
    if (!email) return res.status(400).json({ error: 'email required' });
    const withSnapshot = req.query.with === 'snapshot';

    const user = await db.query.users.findFirst({ where: eq(users.email, email) });
    if (!user) return res.status(200).json(withSnapshot ? { entries: [], snapshot: null } : []);

    const entries = await db.query.brainEntries.findMany({
      where: eq(brainEntries.userId, user.id),
      orderBy: (t, { desc }) => [desc(t.updatedAt)],
    });
    if (withSnapshot) {
      return res.status(200).json({ entries, snapshot: user.snapshot ?? null });
    }
    return res.status(200).json(entries);
  }

  // POST /api/brain — save-input | toggle-complete | generate-snapshot
  if (req.method === 'POST') {
    const { action, email, lessonId, content, userDraft, aiDraft } = req.body;

    let user = await db.query.users.findFirst({ where: eq(users.email, email) });
    if (!user) {
      const [created] = await db.insert(users).values({ email }).returning();
      user = created;
    }

    // ⚙️ M0.5 / explicit regeneration — the wow moment (§6.1)
    if (action === 'generate-snapshot') {
      const snap = await generateSnapshot(db, user, user.snapshot ? 'manual refresh' : 'Module 0');
      if (!snap) return res.status(502).json({ error: 'ai_unavailable' });
      return res.status(200).json({ snapshot: snap });
    }

    // 🏛 m4l10 "The Founder's Case" (SPEC_PAYWALL §0) — pre-paywall milestone reveal.
    // Vision + Proof (real Brain data) + Potential (napkin math, optimistic, NOT a forecast).
    if (action === 'founders-case') {
      const entries = await db.query.brainEntries.findMany({ where: eq(brainEntries.userId, user.id) });
      const cached = entries.find((e) => e.entryType === 'founders_case');
      if (cached && req.body.refresh !== true) {
        // Only serve cache in the NEW stats shape — old-format entries fall through to regen.
        try {
          const c = JSON.parse(cached.content);
          if (Array.isArray(c?.potential?.stats)) return res.status(200).json({ case: c });
        } catch { /* regen */ }
      }
      const byType: Record<string, string> = {};
      for (const e of entries) if (e.content) byType[e.entryType] = e.content;
      const snap = user.snapshot as { sections: { title: string; content: string }[] } | null;

      // Ambition signals (SPEC_PAYWALL §0 calibration). PRIMARY = her stated 3-year goal
      // (m0l4 quiz goal3y) — the number + shape she wants; then goal_12w, onboarding goal, capacity.
      let goal3y = '', goal12w = '', capacity = '';
      try {
        const intake = JSON.parse(byType['founder_intake'] || '{}');
        goal3y = intake.goal3y ?? ''; goal12w = intake.goal12w ?? ''; capacity = intake.capacity ?? '';
      } catch { /* no quiz yet */ }

      // Potential = 2–3 clean stats, each {label (small grey), hero (bold number), support (plain line)}.
      // No box-math, no jargon, no formula line — the AI already delivers presentation-ready copy.
      const CaseSchema = z.object({
        vision: z.coerce.string(),
        proof: z.array(z.coerce.string()).min(1).max(6),
        potential: z.object({
          stats: z.array(z.object({
            label: z.coerce.string(),
            hero: z.coerce.string(),
            support: z.coerce.string().catch(''),
          })).min(2).max(3),
        }),
      });
      const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
      try {
        const msg = await client.messages.create({
          model: 'claude-sonnet-4-6',
          max_tokens: 1100,
          system: `You are Affina, writing "The Founder's Case" — a milestone reveal for a founder who just finished Module 4, right before she decides to continue. Tone: inspiring but HONEST, PLAIN language — never an investment lecture. All from HER real data, never generic or invented.

Return three parts:
- vision: her project one-liner + why it matters in the world (2-3 sentences, plain).
- proof: 3-6 short bullet strings of what she actually did/validated across 4 modules (real numbers from her Brain: interviews run, problem validated, first demand). Concrete and hers.
- potential.stats: EXACTLY 3 stats, each { "label": small caption, "hero": ONE punchy number/range, "support": one short plain sentence }. Optimistic upside, napkin-level.
  Stat 1 — Reachable customers, year one. hero e.g. "250–500". support: one plain line. Anchor to HER stated goal if she gave one (a "first 10 customers" founder must NOT see 500) — otherwise a modest year-one reach from her M2 market.
  Stat 2 — Revenue potential at an illustrative price. hero e.g. "£18k–£36k/year". support says the price humanly, e.g. "at a price around £6/month" — NOT box-math.
  Stat 3 — CALIBRATED TO HER AMBITION (below).

AMBITION CALIBRATION (critical — her 3-YEAR GOAL is the PRIMARY signal; read its number AND shape, then anchor Stat 3 and the size of all numbers to it):
- INCOME / lifestyle ambition (3-year goal is a monthly/annual income figure, "a business that pays me", first customers, OR low weekly capacity) → Stat 3 is MONTHLY INCOME. label "What it means for you", hero anchored to HER stated income target (e.g. she said "$8k/month" → build toward that, not a generic number), support e.g. "a real business that pays you, on your terms". Keep ALL numbers modest and grounded. NEVER show a valuation.
- SCALE / INVESTMENT / EXIT ambition (3-year goal mentions raising $Y, a valuation, selling for $Z, or big growth; or onboarding goal = Investment) → Stat 3 is VALUATION, anchored toward HER stated figure where she gave one (she said "sell for $20M" → the range points that way, honestly as an early-stage step toward it). label "What it could be worth", support e.g. "early businesses like yours are valued on revenue, and it climbs fast once people stay". Bigger numbers, revenue language ok.
- UNCLEAR / not stated → income frame + one light line of upside. No valuation.
Never contradict her stated 3-year number: if she wants a lifestyle income, don't dangle a huge valuation; if she wants a $20M exit, don't cap her at a modest side-income.

HARD PRESENTATION RULES:
- hero = ONLY the number/range/short phrase (the app renders it bold). label and support are plain, lowercase-ish captions/sentences.
- BAN this jargon from all visible text: "illustrative only", "pricing not yet set", "N× revenue multiple", "SAM", "cold-chain", "conservative anchor", "benchmark", "ARR" in support lines for income founders. Say things like a human.
- NO formula/derivation line anywhere.
- Do NOT add napkin/"not a promise" caveats inside stats — the app appends the single closing line itself.

Respond ONLY with valid JSON: {"vision":"...","proof":["..."],"potential":{"stats":[{"label":"...","hero":"...","support":"..."}]}}`,
          messages: [{ role: 'user', content: `PROJECT: ${user.projectName || 'unnamed'} — ${user.idea || 'not set'}
HER AMBITION → 3-YEAR GOAL (primary, use this): ${goal3y || 'not stated'} · onboarding goal: ${user.goal || 'not set'} · 12-week goal: ${goal12w || 'not stated'} · weekly capacity: ${capacity || 'not stated'}
STARTUP SNAPSHOT:\n${snap ? snap.sections.map((x) => `## ${x.title}\n${x.content}`).join('\n') : '(none)'}
VALUE PROP: ${byType['value_proposition'] || '(none)'}
PERSONA: ${byType['persona'] || '(none)'}
MARKET / TAM: ${byType['competitive_landscape'] || byType['market_research'] || '(none)'}
PROBLEM-SOLUTION CHECK: ${byType['problem_solution_check'] || '(none)'}
QUANTIFIED VALUE: ${byType['value_advantage'] || byType['quantified_value'] || '(none)'}
MICRO-COMMITMENT / DEMAND: ${byType['micro_commitment'] || '(none)'}

Write her Founder's Case — calibrate the numbers and the third stat to her ambition above.` }],
        });
        const raw = msg.content[0].type === 'text' ? msg.content[0].text : '';
        const match = raw.match(/\{[\s\S]*\}/);
        if (!match) throw new Error('no JSON');
        const parsed = CaseSchema.parse(JSON.parse(match[0]));
        if (cached) {
          await db.update(brainEntries).set({ content: JSON.stringify(parsed), updatedAt: new Date() }).where(eq(brainEntries.id, cached.id));
        } else {
          await db.insert(brainEntries).values({
            userId: user.id, lessonId: 'm4l10', lessonTitle: "The Founder's Case",
            prompt: 'Vision · Proof · Potential — your case, before Module 5', content: JSON.stringify(parsed),
            entryType: 'founders_case', processedByAi: true,
          });
        }
        return res.status(200).json({ case: parsed });
      } catch {
        return res.status(502).json({ error: 'ai_unavailable' });
      }
    }

    // 🟢 m2l6 — Market Research, test mode (§1.1–§1.7). answers = replies to clarifying questions.
    if (action === 'market-research') {
      const { answers } = req.body as { answers?: Record<string, string> };
      const entries = await db.query.brainEntries.findMany({ where: eq(brainEntries.userId, user.id) });
      const byType: Record<string, string> = {};
      for (const e of entries) byType[e.entryType] = e.content;
      const snap = (user.snapshot ?? null) as Snap | null;

      const answersBlock = answers && Object.keys(answers).length
        ? `\nHER ANSWERS TO YOUR CLARIFYING QUESTIONS:\n${Object.entries(answers).map(([k, v]) => `- ${k}: ${v}`).join('\n')}`
        : '';

      const userMessage = `PROJECT: ${user.projectName || 'unnamed'} — ${user.idea || 'not set'}
Customer: ${user.customer || 'not set'} · Model: ${user.businessModel || 'not set'} · Stage: ${user.stage || 'not set'}

STARTUP SNAPSHOT:
${snap ? snap.sections.map((x) => `## ${x.title}\n${x.content}`).join('\n') : '(none yet)'}

HER COMPETITOR MAP (m2l4): ${byType['competitive_landscape'] || '(not filled)'}
HER POSITIONING (m2l5): ${byType['positioning'] || '(not filled)'}
HER INTAKE (m0l3): ${byType['founder_intake'] || '(not filled)'}
IMPORTED LINKS (m0l4): ${byType['imported_assets'] || '(none)'}
PRIOR RESEARCH INPUTS: ${byType['research_inputs'] || '(none)'}${answersBlock}

Produce the test-mode report — or the clarifying questions if critical inputs are missing.`;

      const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
      try {
        const msg = await client.messages.create({
          model: 'claude-sonnet-4-6',
          max_tokens: 2800,
          system: RESEARCH_SYSTEM,
          messages: [{ role: 'user', content: userMessage }],
        });
        const raw = msg.content[0].type === 'text' ? msg.content[0].text : '';
        const match = raw.match(/\{[\s\S]*\}/);
        if (!match) throw new Error('no JSON');
        const parsed = JSON.parse(match[0]);

        if (parsed.questions) {
          const qs = ResearchQuestionsSchema.parse(parsed);
          return res.status(200).json(qs);
        }

        const report = ResearchReportSchema.parse(parsed);
        const full = { mode: 'test' as const, generatedAt: new Date().toISOString(), ...report };

        // §1.2a — clarifying answers enrich the Brain (reused on re-runs)
        if (answers && Object.keys(answers).length) {
          const text = Object.entries(answers).map(([k, v]) => `${k}: ${v}`).join('\n');
          const prior = entries.find((e) => e.entryType === 'research_inputs');
          if (prior) {
            await db.update(brainEntries)
              .set({ content: `${prior.content}\n${text}`, updatedAt: new Date() })
              .where(eq(brainEntries.id, prior.id));
          } else {
            await db.insert(brainEntries).values({
              userId: user.id, lessonId: 'm2l6_inputs', lessonTitle: 'Research inputs',
              prompt: 'Clarifying answers for market research', content: text, entryType: 'research_inputs',
            });
          }
        }

        // §1.5 deliver — the report itself lives in the Brain as market_research
        const existingR = entries.find((e) => e.entryType === 'market_research');
        if (existingR) {
          await db.update(brainEntries)
            .set({ content: JSON.stringify(full), processedByAi: true, updatedAt: new Date() })
            .where(eq(brainEntries.id, existingR.id));
        } else {
          await db.insert(brainEntries).values({
            userId: user.id, lessonId: 'm2l6', lessonTitle: 'Market Research (test mode)',
            prompt: 'Done-for-you market research — 9 sections, model estimates only',
            content: JSON.stringify(full), entryType: 'market_research', processedByAi: true,
          });
        }

        // key facts → Snapshot → Market (mechanical, like check-in facts)
        if (snap) {
          const sections = snap.sections.map((x) => ({ ...x }));
          const market = sections.find((x) => /market/i.test(x.title));
          if (market) {
            const day = new Date().toISOString().slice(0, 10);
            const facts = [
              `• Research verdict: ${report.headlineVerdict.slice(0, 220)} (research ${day})`,
              ...report.keyNumbers.slice(0, 3).map((k) => `• ${k.label}: ${k.value} — ${k.logic.slice(0, 120)} (research ${day})`),
            ].join('\n');
            market.content = `${market.content}\n${facts}`.trim();
            const history = Array.isArray(user.snapshotHistory) ? (user.snapshotHistory as Snap[]) : [];
            await db.update(users).set({
              snapshot: { version: snap.version + 1, generatedAt: new Date().toISOString(), source: 'market research', sections },
              snapshotHistory: [...history, snap].slice(-5),
              updatedAt: new Date(),
            }).where(eq(users.id, user.id));
          }
        }

        return res.status(200).json({ report: full });
      } catch (err) {
        console.error('market-research error', err instanceof Error ? err.message : JSON.stringify(err).slice(0, 800));
        return res.status(502).json({ error: 'ai_unavailable' });
      }
    }

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

      const entryType = BRAIN_ENTRY_TYPES[lessonId];
      if (entryType && content.trim()) {
        const meta = getLessonMeta(lessonId);
        if (meta) {
          // §4: when the save came out of a Delegate choice, keep both drafts
          const draftCols = {
            ...(userDraft !== undefined ? { userDraft } : {}),
            ...(aiDraft !== undefined ? { aiDraft } : {}),
          };
          const existingBrain = await db.query.brainEntries.findFirst({
            where: and(eq(brainEntries.userId, user.id), eq(brainEntries.lessonId, lessonId)),
          });
          if (existingBrain) {
            await db.update(brainEntries)
              .set({ content, processedByAi: false, updatedAt: new Date(), ...draftCols })
              .where(and(eq(brainEntries.userId, user.id), eq(brainEntries.lessonId, lessonId)));
          } else {
            await db.insert(brainEntries).values({
              userId: user.id,
              lessonId,
              lessonTitle: meta.title,
              prompt: meta.prompt,
              content,
              entryType,
              ...draftCols,
            });
          }
        }
      }
      return res.status(200).json({ ok: true });
    }

    if (action === 'toggle-complete') {
      const existing = await db.query.completedLessons.findFirst({
        where: and(eq(completedLessons.userId, user.id), eq(completedLessons.lessonId, lessonId)),
      });
      if (existing) {
        await db.delete(completedLessons)
          .where(and(eq(completedLessons.userId, user.id), eq(completedLessons.lessonId, lessonId)));
        return res.status(200).json({ completed: false });
      }

      await db.insert(completedLessons).values({ userId: user.id, lessonId });

      // §3.4(a) module checkpoint: when this completion closes a module (except M0 —
      // its snapshot is generated explicitly at 0.5), refresh the Snapshot.
      let snapshotUpdated = false;
      try {
        const mod = MODULES.find((m) => m.lessons.some((l) => l.id === lessonId));
        if (mod && mod.id !== 'm0' && user.snapshot) {
          const done = await db.query.completedLessons.findMany({
            where: eq(completedLessons.userId, user.id),
          });
          const doneSet = new Set(done.map((c) => c.lessonId));
          const moduleComplete = mod.lessons.every((l) => doneSet.has(l.id));
          if (moduleComplete) {
            const snap = await generateSnapshot(
              db, user, `Module ${mod.order} checkpoint`, `Module ${mod.order} — ${mod.title}`,
            );
            snapshotUpdated = !!snap;
          }
        }
      } catch { /* checkpoint refresh must never break lesson completion */ }

      return res.status(200).json({ completed: true, snapshotUpdated });
    }

    return res.status(400).json({ error: 'unknown action' });
  }

  return res.status(405).json({ error: 'method not allowed' });
}
