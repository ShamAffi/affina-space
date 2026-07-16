import type { VercelRequest, VercelResponse } from '@vercel/node';
import { callClaude } from '../src/server/anthropic.js';
import { MODELS } from '../src/server/models.js';
import { z } from 'zod';
import { withAuth } from '../src/server/handler.js';
import { clamp, LIMITS } from '../src/server/limits.js';
import type { Db } from '../src/server/db.js';
import { eq, desc, and, ne, inArray } from 'drizzle-orm';
import { users, checkIns, completedLessons, brainEntries, tasks } from '../src/db/schema.js';
import { MODULES } from '../src/data.js';

// Consolidated Pulse endpoint (SPEC_RESEND_AUTH §1b) — merged from the former
// api/pulse/{index,draft,commit}.ts to reclaim 2 Vercel-function slots (Hobby 12-fn cap).
// Same behaviors: GET list · POST {action:'draft'} AI draft · POST {action:'commit'} save.

function getWeekOf(date: Date): string {
  const d = new Date(date);
  const day = d.getDay(); // 0=Sun
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  return d.toISOString().split('T')[0];
}

function titlesAreSimilar(a: string, b: string): boolean {
  const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9 ]/g, '').trim().split(/\s+/);
  const aWords = new Set(norm(a));
  const bWords = norm(b);
  const overlap = bWords.filter((w) => aWords.has(w)).length;
  return overlap >= Math.min(3, Math.ceil(norm(a).length * 0.5));
}

const MetricSchema = z.object({
  name: z.coerce.string().catch(''),
  value: z.coerce.number().catch(0),
  delta: z.coerce.number().catch(0),
});

// Tolerant to LLM looseness (CLAUDE.md pattern, audit F52): an off-count keyResults/
// tasks array or a stringy number must not THROW the check-in draft into a silent 502.
// Accept any shape + coerce; the arrays are sliced to their caps after parse.
const DraftSchema = z.object({
  headline: z.coerce.string().catch(''),
  keyResults: z.array(z.object({
    type: z.enum(['win', 'setback', 'milestone']).catch('win'),
    text: z.coerce.string().catch(''),
    metric: z.coerce.string().optional().catch(undefined),
  })).catch([]),
  metrics: z.array(MetricSchema).catch([]),
  sentiment: z.enum(['energized', 'steady', 'struggling']).catch('steady'),
  mentorNote: z.coerce.string().catch(''),
  tasks: z.array(z.object({
    title: z.coerce.string().catch(''),
    instruction: z.coerce.string().catch(''),
    priority: z.coerce.number().int().catch(60),
  })).catch([]),
});

const ActivitySchema = z.array(z.object({
  key: z.coerce.string().catch(''),
  label: z.coerce.string().catch(''),
  count: z.coerce.number().catch(0),
})).catch([]);

// §3.4(b) — facts from the check-in that belong in the Startup Snapshot
const SnapshotFactsSchema = z.array(z.object({
  section: z.coerce.string().catch(''),
  fact: z.coerce.string().catch(''),
})).catch([]);

// The commit path (handleCommit) receives the draft back from the client and writes it
// into check_ins / tasks / users. It is NOT trusted (audit F09/F53): validate every field
// through the same tolerant schema before any DB write so a malformed/hostile blob can
// neither corrupt jsonb nor 500 the endpoint. momentumCard is validated by parseMomentumCard.
const CommitDraftSchema = DraftSchema.extend({
  activity: ActivitySchema,
  snapshotFacts: SnapshotFactsSchema,
});

// Tolerant to common LLM looseness: numbers-as-strings (z.coerce), missing
// delta (defaulted), odd period labels (.catch). A card with real traction must
// not silently vanish to null and drop the dashboard back to Tier 3 (bug §7).
const num = z.coerce.number();
const MomentumBlockSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('headline_metric'), label: z.string(), value: num, delta: num.catch(0), trend: z.array(num).optional(), sentiment: z.string().optional() }),
  z.object({ type: z.literal('milestone'), text: z.string(), period: z.enum(['3w', 'all']).catch('3w'), value: num.optional() }),
  z.object({ type: z.literal('trajectory'), text: z.string(), trend: z.array(num).optional() }),
  z.object({ type: z.literal('this_week'), items: z.array(z.object({ kind: z.enum(['win', 'learning', 'setback']).catch('win'), text: z.string() })).min(1).max(4) }),
  z.object({ type: z.literal('cumulative'), stats: z.array(z.object({ label: z.string(), value: z.union([z.number(), z.string()]) })).min(1).max(4) }),
  z.object({ type: z.literal('learning_progress'), stats: z.array(z.object({ label: z.string(), value: z.union([z.number(), z.string()]) })).min(1).max(4) }),
  z.object({ type: z.literal('streak'), weeks: num, text: z.string() }),
  z.object({ type: z.literal('encouragement'), text: z.string() }),
  z.object({ type: z.literal('nudge'), text: z.string() }),
]);

const MoodSchema = z.enum(['building', 'progressing', 'traction', 'recovering', 'quiet']).catch('progressing');

// Parse blocks individually and keep the valid ones — one malformed block must
// not throw away the whole card. Returns null only when nothing survives.
function parseMomentumCard(raw: unknown): { mood: z.infer<typeof MoodSchema>; blocks: z.infer<typeof MomentumBlockSchema>[] } | null {
  if (!raw || typeof raw !== 'object') return null;
  const obj = raw as { mood?: unknown; blocks?: unknown };
  const blocksIn = Array.isArray(obj.blocks) ? obj.blocks : [];
  const blocks = blocksIn
    .map((b) => MomentumBlockSchema.safeParse(b))
    .filter((r): r is z.SafeParseSuccess<z.infer<typeof MomentumBlockSchema>> => r.success)
    .map((r) => r.data)
    .slice(0, 4);
  if (blocks.length === 0) return null;
  return { mood: MoodSchema.parse(obj.mood), blocks };
}

const SYSTEM = `You are Affina — a warm but honest startup mentor for early-stage female founders.
From one weekly update you do TWO things.

PART A — Analyze the check-in:
- headline: one punchy line capturing the week (max 10 words)
- keyResults: 2–5 items. INCLUDE setbacks if mentioned — never omit failures.
  type: 'win' | 'setback' | 'milestone'. metric: e.g. "signups 40→62" if a number relates.
- metrics: extract EVERY number mentioned. value: new value. delta: change vs last week (0 if unknown/first).
- sentiment: energized | steady | struggling
- mentorNote: 1–2 warm, honest sentences. No toxic positivity.
- tasks: 0–3 next steps. ≤6-word titles. priority 80/60/40. These are PRACTICE tasks — keep her practice list light, not crowded with small similar chores.
  - CONSOLIDATE (practice only): fold several small related actions into ONE meaningful task instead of listing them separately (e.g. not "DM 3 moms" + "reply to comments" + "post story" → one "Reach 5 target moms this week").
  - Prefer ONE strong task over three overlapping small ones. It is perfectly fine to return 0 tasks if her update needs no new one.
  - LOAD-AWARE (practice only): judge crowding by her open PRACTICE/check-in tasks, NOT her Real World missions. If several practice tasks are already open, add at most one — or none. Never re-create one she already has, even worded differently.
  - HANDS OFF Real World: never merge, restate, or replace her Real World (field mission) tasks — they are important and stand on their own. At most, avoid duplicating one with a new practice task.

PART B — Extract activity, snapshot facts + compose the Momentum card:
- snapshotFacts: FACTS and DECISIONS from this update that change the startup's one-page Snapshot — new numbers, changed inputs, corrections ("price is now $29", "pivoted to B2B", "first paying customer"). NOT process ("worked hard this week"). section ∈ [Founder, Project & stage, Hypothesis, Market, Customer & persona, Product, Model & North Star, Traction, Risk flags, Next focus]. [] if nothing snapshot-worthy.
- activity: normalise the REAL-WORLD actions she mentions into [{key,label,count}]. Canonical snake_case keys reused across weeks (people_talked_to, interviews_done, experiments_run, posts_published, demos_given...). Only real actions with a count; [] if none.
- momentumCard: you are the narrative EDITOR of her Traction card (the deterministic Business block is built from her numbers separately — your job is to pick the MOST RECENT and IMPORTANT business achievements and phrase them well). Business ALWAYS comes first; it is fine to omit Learning entirely when business progress is strong. Lead with the HIGHEST tier that has real content; lower tiers drop off as higher ones appear:
  TIER 1 traction (North Star moving, customers, revenue, milestones) → headline_metric / milestone / trajectory
  TIER 2 real-world effort (activity) → this_week + cumulative
  TIER 3 learning (lessons/exercises/modules) → learning_progress  ← LOWEST. Show ONLY when there is no real-world action yet; it disappears the moment real activity exists.
  Block palette (each block needs "type"):
   headline_metric {label,value,delta,trend?:number[],sentiment?}  · milestone {text,period:'3w'|'all',value?}
   trajectory {text,trend?:number[]}  · this_week {items:[{kind:'win'|'learning'|'setback',text}]}
   cumulative {stats:[{label,value}]}  · learning_progress {stats:[{label,value}]}
   streak {weeks,text}  · encouragement {text}  · nudge {text}
  RULES:
  - Focus on the LAST WEEK. Use a multi-week block (milestone/trajectory) ONLY when clearly stronger than the weekly highlight, when the week was weak (zoom out), or ~once every 4 weeks. At most ONE multi-week block.
  - NEVER headline a falling or zero external number. On a dip → this_week (framed as learning) + cumulative + encouragement.
  - A milestone (first customer, first revenue, a round) → celebrate (headline_metric/milestone).
  - Quiet week / nothing real → nudge.
  - Always ≥1 truthful positive. A setback is learning, never failure. Warm, honest tone.
  - mood: building | progressing | traction | recovering | quiet. 2–4 blocks, most important first.
Respond ONLY with valid JSON matching the structure exactly.`;

// POST {action:'draft'} — AI check-in draft (was api/pulse/draft.ts). email = session.
async function handleDraft(db: Db, email: string, req: VercelRequest, res: VercelResponse) {
  // Length cap (audit F11) — rawText is the founder's weekly update, AI-analysed.
  const rawText = clamp(req.body?.rawText, LIMITS.longText);
  if (!rawText.trim()) return res.status(400).json({ error: 'rawText required' });

  const user = await db.query.users.findFirst({ where: eq(users.email, email) });
  if (!user) return res.status(404).json({ error: 'user not found' });

  // ── Windowed inputs ──────────────────────────────────────────────────────────
  const past = await db.query.checkIns.findMany({
    where: eq(checkIns.userId, user.id),
    orderBy: [desc(checkIns.weekOf)],
    limit: 12,
  });
  const completed = await db.query.completedLessons.findMany({ where: eq(completedLessons.userId, user.id) });
  const brain = await db.query.brainEntries.findMany({ where: eq(brainEntries.userId, user.id) });
  // §8 — open tasks fed to the prompt so new check-in tasks don't overload her.
  // Real World (program) tasks are important and standalone — never merged, and they
  // do NOT count toward "she's crowded". Consolidation/load-awareness is Practice-only.
  const openTasks = await db.query.tasks.findMany({
    where: and(eq(tasks.userId, user.id), ne(tasks.status, 'done')),
  });
  const realWorldOpen = openTasks.filter((t) => t.source === 'program');
  const practiceOpen = openTasks.filter((t) => t.source !== 'program');
  const realWorldList = realWorldOpen.length
    ? realWorldOpen.map((t) => `- ${t.title}`).join('\n')
    : '(none)';
  const practiceList = practiceOpen.length
    ? practiceOpen.map((t) => `- ${t.title}`).join('\n')
    : '(none)';

  const completedSet = new Set(completed.map((c) => c.lessonId));
  const lessonsDone = completed.length;
  const exercisesScored = brain.filter((b) => b.aiScore !== null).length;
  const modulesCompleted = MODULES.filter((m) => m.lessons.every((l) => completedSet.has(l.id))).length;

  type Act = { key: string; label: string; count: number };
  const sumActivity = (rows: typeof past) => {
    const out: Record<string, { label: string; count: number }> = {};
    for (const ci of rows) {
      const acts = Array.isArray(ci.activity) ? (ci.activity as Act[]) : [];
      for (const a of acts) {
        if (!out[a.key]) out[a.key] = { label: a.label, count: 0 };
        out[a.key].count += a.count;
      }
    }
    return Object.values(out);
  };
  const fmt = (arr: { label: string; count: number }[]) =>
    arr.length ? arr.map((a) => `${a.label}: ${a.count}`).join(', ') : 'none recorded';

  const ns = user.northStar as { key: string; label: string } | null;
  const nsSeries = ns
    ? [...past].reverse().map((ci) => {
        const ms = Array.isArray(ci.metrics) ? (ci.metrics as { name: string; value: number }[]) : [];
        const m = ms.find((x) =>
          x.name.toLowerCase().includes(ns.key.toLowerCase()) ||
          x.name.toLowerCase().includes(ns.label.toLowerCase()));
        return m ? m.value : null;
      }).filter((v): v is number => v !== null)
    : [];

  const pastContext = past.length > 0
    ? past.slice(0, 4).map((c) => {
        const metricsStr = Array.isArray(c.metrics) && c.metrics.length > 0
          ? (c.metrics as { name: string; value: number }[]).map((m) => `${m.name}: ${m.value}`).join(', ')
          : 'no metrics';
        return `Week of ${c.weekOf}: "${c.headline ?? ''}" · ${metricsStr}`;
      }).join('\n')
    : 'No previous check-ins (this is the first one).';

  const lastMetrics = past[0]?.metrics
    ? (past[0].metrics as { name: string; value: number }[]).map((m) => `${m.name}: ${m.value}`).join(', ')
    : 'none';

  const userMessage = `Project: ${user.projectName || 'startup'} — ${user.idea || 'not specified'}
North star metric: ${ns ? `${ns.label} (${ns.key})` : 'not set yet'}

Recent check-ins (for deltas):
${pastContext}
Last known metrics: ${lastMetrics}

REAL WORLD tasks she already has (${realWorldOpen.length}) — these are her important field
missions. Leave them alone: never merge, fold, or re-create them, and DON'T count them
toward how busy she is. Just don't propose a practice task that duplicates one:
${realWorldList}

PRACTICE / check-in tasks she already has (${practiceOpen.length} open) — THIS is the list to
keep light. Consolidate related ones, don't duplicate by meaning, and if several are already
open here, add at most one new task — or none:
${practiceList}

This week's update from the founder:
"${rawText}"

=== MOMENTUM INPUTS ===
LEARNING (tier 3 — drop once real-world activity exists): lessons ${lessonsDone}, exercises scored ${exercisesScored}, modules ${modulesCompleted}
REAL-WORLD ACTIVITY (tier 2): last 3 weeks → ${fmt(sumActivity(past.slice(0, 3)))}; all-time → ${fmt(sumActivity(past))}
TRACTION (tier 1): North Star ${ns ? ns.label : 'not set'}; series oldest→newest → ${nsSeries.length ? nsSeries.join(' → ') : 'no data'}
CONTEXT: stage ${user.stage || 'early'}, phase ${user.phase || 'launch'}, goal ${user.goal || 'not set'}, weeks active ${past.length + 1}, streak ${user.pulseStreak ?? 0}, last check-in ${past[0]?.weekOf ?? 'first ever'}

Return JSON:
{
  "headline": "...",
  "keyResults": [{"type": "win|setback|milestone", "text": "...", "metric": "optional"}],
  "metrics": [{"name": "...", "value": 0, "delta": 0}],
  "sentiment": "energized|steady|struggling",
  "mentorNote": "...",
  "tasks": [{"title": "...", "instruction": "...", "priority": 80}],
  "activity": [{"key": "people_talked_to", "label": "People talked to", "count": 4}],
  "momentumCard": { "mood": "progressing", "blocks": [ /* 2-4 blocks, each with "type" */ ] },
  "snapshotFacts": [{"section": "Traction", "fact": "First 5 sign-ups from Instagram"}]
}`;

  try {
    const message = await callClaude({
      model: MODELS.standard,
      max_tokens: 2500,
      system: SYSTEM,
      messages: [{ role: 'user', content: userMessage }],
    }, { endpoint: 'pulse', mode: 'check-in', email });
    const raw = message.content[0].type === 'text' ? message.content[0].text : '';
    const match = raw.match(/\{[\s\S]*\}/);
    if (!match) throw new Error('no JSON');
    const parsed = JSON.parse(match[0]);
    const draft = DraftSchema.parse(parsed);
    // Tolerant schema never throws on count; clamp to the caps the prompt asks for.
    draft.keyResults = draft.keyResults.slice(0, 5);
    draft.tasks = draft.tasks.slice(0, 3);

    // Momentum + activity parsed leniently — a malformed card must not break the check-in.
    const activity = ActivitySchema.parse(parsed.activity ?? []).slice(0, 8);
    const momentumCard = parseMomentumCard(parsed.momentumCard);
    const snapshotFacts = SnapshotFactsSchema.parse(parsed.snapshotFacts ?? []).slice(0, 6);

    return res.status(200).json({ ...draft, activity, momentumCard, snapshotFacts });
  } catch {
    return res.status(502).json({ error: 'ai_unavailable' });
  }
}

// POST {action:'commit'} — save the check-in (was api/pulse/commit.ts). email = session.
async function handleCommit(db: Db, email: string, req: VercelRequest, res: VercelResponse) {
  const { confirmedMetrics, draft } = req.body ?? {};
  // Cap rawText but preserve the "keep existing on re-commit" semantics (undefined = untouched).
  const rawText = req.body?.rawText !== undefined ? clamp(req.body.rawText, LIMITS.longText) : undefined;
  if (!draft) return res.status(400).json({ error: 'draft required' });

  // Validate the client-returned draft before ANY DB write (audit F09/F53) — tolerant
  // schema, so a malformed/hostile blob degrades to safe defaults instead of corrupting
  // jsonb or 500ing. momentumCard is validated separately by parseMomentumCard.
  const d = CommitDraftSchema.parse(draft);
  d.keyResults = d.keyResults.slice(0, 5);
  d.tasks = d.tasks.slice(0, 3);
  d.activity = d.activity.slice(0, 8);
  d.snapshotFacts = d.snapshotFacts.slice(0, 6);
  const momentumCard = parseMomentumCard((draft as { momentumCard?: unknown }).momentumCard);

  const user = await db.query.users.findFirst({ where: eq(users.email, email) });
  if (!user) return res.status(404).json({ error: 'user not found' });

  const weekOf = getWeekOf(new Date());
  const finalMetrics = confirmedMetrics !== undefined
    ? z.array(MetricSchema).catch([]).parse(confirmedMetrics)
    : d.metrics;

  // 1. Upsert check_in (same week = update, not duplicate)
  const existing = await db.query.checkIns.findFirst({
    where: and(eq(checkIns.userId, user.id), eq(checkIns.weekOf, weekOf)),
  });
  let checkInId: number;
  if (existing) {
    await db.update(checkIns).set({
      rawText: rawText ?? existing.rawText,
      headline: d.headline,
      keyResults: d.keyResults,
      metrics: finalMetrics,
      activity: d.activity,
      sentiment: d.sentiment,
      mentorNote: d.mentorNote,
    }).where(eq(checkIns.id, existing.id));
    checkInId = existing.id;
  } else {
    const [created] = await db.insert(checkIns).values({
      userId: user.id,
      weekOf,
      rawText: rawText ?? '',
      headline: d.headline,
      keyResults: d.keyResults,
      metrics: finalMetrics,
      activity: d.activity,
      sentiment: d.sentiment,
      mentorNote: d.mentorNote,
    }).returning({ id: checkIns.id });
    checkInId = created.id;
  }

  // 2. Create tasks (dedup against open ones)
  const openTasks = await db.query.tasks.findMany({
    where: and(eq(tasks.userId, user.id), inArray(tasks.status, ['todo', 'submitted'])),
  });

  const createdTasks: number[] = [];
  for (const t of d.tasks) {
    const isDup = openTasks.some((ot) => titlesAreSimilar(t.title, ot.title));
    if (!isDup) {
      const [created] = await db.insert(tasks).values({
        userId: user.id,
        source: 'pulse',
        sourceRef: `checkin_${checkInId}`,
        title: t.title,
        instruction: t.instruction,
        priority: t.priority ?? 80,
        status: 'todo',
      }).returning({ id: tasks.id });
      createdTasks.push(created.id);
    }
  }

  // 3. Update traction_metrics brain entry
  if (finalMetrics.length > 0) {
    const metricsText = finalMetrics
      .map((m: { name: string; value: number; delta: number }) =>
        `${m.name}: ${m.value}${m.delta !== 0 ? ` (${m.delta > 0 ? '+' : ''}${m.delta})` : ''}`)
      .join('\n');
    const brainContent = `Week of ${weekOf}:\n${metricsText}`;

    const existingBrain = await db.query.brainEntries.findFirst({
      where: and(eq(brainEntries.userId, user.id), eq(brainEntries.entryType, 'traction_metrics')),
    });
    if (existingBrain) {
      await db.update(brainEntries).set({
        content: brainContent,
        processedByAi: false,
        updatedAt: new Date(),
      }).where(eq(brainEntries.id, existingBrain.id));
    } else {
      await db.insert(brainEntries).values({
        userId: user.id,
        lessonId: 'pulse_traction',
        lessonTitle: 'Traction Metrics',
        prompt: 'Weekly metrics from Pulse check-ins',
        content: brainContent,
        entryType: 'traction_metrics',
      });
    }
  }

  // 4. Update streak
  const now = new Date();
  const prevWeek = getWeekOf(new Date(now.getTime() - 7 * 86400000));
  let newStreak = 1;
  if (user.lastCheckInAt) {
    const lastWeek = getWeekOf(user.lastCheckInAt);
    if (lastWeek === weekOf) {
      newStreak = user.pulseStreak ?? 1; // re-commit same week, keep streak
    } else if (lastWeek === prevWeek) {
      newStreak = (user.pulseStreak ?? 0) + 1; // consecutive week
    }
    // else gap — reset to 1
  }
  // §3.4(b) — merge check-in facts into the Startup Snapshot (mechanical, no AI call).
  // Each fact lands in its section as a dated line; version bumps; previous version → history (cap 5).
  type Snap = { version: number; generatedAt: string; source: string; sections: { title: string; content: string }[] };
  let snapshotPatch: { snapshot?: Snap; snapshotHistory?: Snap[] } = {};
  const facts = d.snapshotFacts;
  const prevSnap = user.snapshot as Snap | null;
  if (prevSnap && facts.length > 0) {
    const sections = prevSnap.sections.map((s) => ({ ...s }));
    let touched = false;
    for (const f of facts) {
      const target = sections.find((s) => s.title.toLowerCase() === f.section.toLowerCase())
        ?? sections.find((s) => s.title.toLowerCase().includes(f.section.toLowerCase().split(' ')[0]));
      if (target && f.fact.trim()) {
        target.content = `${target.content}\n• ${f.fact.trim()} (check-in ${weekOf})`.trim();
        touched = true;
      }
    }
    if (touched) {
      const history = Array.isArray(user.snapshotHistory) ? (user.snapshotHistory as Snap[]) : [];
      snapshotPatch = {
        snapshot: {
          version: prevSnap.version + 1,
          generatedAt: now.toISOString(),
          source: `check-in ${weekOf}`,
          sections,
        },
        snapshotHistory: [...history, prevSnap].slice(-5),
      };
    }
  }

  await db.update(users).set({
    pulseStreak: newStreak,
    lastCheckInAt: now,
    momentumCard,
    ...snapshotPatch,
    updatedAt: now,
  }).where(eq(users.id, user.id));

  return res.status(200).json({
    checkInId,
    createdTasks,
    streak: newStreak,
    weekOf,
    momentumCard,
  });
}

export default withAuth('GET,POST,OPTIONS', async (req, res, { email, db }) => {
  // GET /api/pulse — the session user's check-ins.
  if (req.method === 'GET') {
    const user = await db.query.users.findFirst({ where: eq(users.email, email) });
    if (!user) return res.status(200).json({ checkIns: [], northStar: null, streak: 0 });
    const rows = await db.query.checkIns.findMany({
      where: eq(checkIns.userId, user.id),
      orderBy: [desc(checkIns.weekOf)],
    });
    return res.status(200).json({ checkIns: rows, northStar: user.northStar ?? null, streak: user.pulseStreak ?? 0 });
  }

  if (req.method !== 'POST') return res.status(405).json({ error: 'method not allowed' });

  const action = (req.body ?? {}).action;
  if (action === 'draft') return handleDraft(db, email, req, res);
  if (action === 'commit') return handleCommit(db, email, req, res);
  return res.status(400).json({ error: 'unknown action (expected draft|commit)' });
});
