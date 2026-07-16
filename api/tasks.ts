import type { VercelRequest, VercelResponse } from '@vercel/node';
import { callClaude } from '../src/server/anthropic.js';
import { MODELS } from '../src/server/models.js';
import { z } from 'zod';
import { withAuth } from '../src/server/handler.js';
import { requireEntitlement } from '../src/server/entitlement.js';
import { clamp, LIMITS } from '../src/server/limits.js';
import type { Db } from '../src/server/db.js';
import { eq, and } from 'drizzle-orm';
import { users, tasks, completedLessons, brainEntries } from '../src/db/schema.js';
import { MODULES, BRAIN_ENTRY_TYPES } from '../src/data.js';
import { blockKind } from '../src/types.js';
import { RUBRICS, GLOBAL_RUBRIC_RULES } from '../src/rubrics.js';
import { FIELD_POINTS, LAYER_LABELS } from '../src/server/progressUtils.js';

// §4b Mission Briefing — generated from the Brain when the founder opens a field task
const BRIEFING_SYSTEM = `You are Affina — the founder's AI mentor, writing a MISSION BRIEFING for a real-world task she is about to do.

Structure (use exactly these four plain-text headers, each followed by 1–3 tight sentences or bullet lines):
WHO TO TALK TO — pulled from her persona/pipeline: who exactly, where to find them.
WHAT TO SAY — grounded in her interview/sales script and positioning: the opener and key questions/asks.
WHAT TO EXPECT — likely reactions, common traps for this mission.
DONE WHEN — the concrete artifact/criterion that means the mission is complete.

Rules: use HER data (persona names, her product, her price). Be specific and practical, warm but direct. No markdown symbols except the headers. Max ~180 words total.`;

// ── Task submission review (was api/tasks/submit.ts — folded here to reclaim a Vercel
// function slot, audit P8; behaviour identical, reached via POST { action: 'submit' }). ──
// Tolerant to LLM looseness (CLAUDE.md pattern): an off-count highlights/improvements
// array or a stringy score must not THROW a real review into the 502 fallback.
const TaskReviewSchema = z.object({
  score: z.coerce.number().int().catch(60),
  verdict: z.enum(['strong', 'good', 'needs_work']).catch('good'),
  highlights: z.array(z.coerce.string()).catch([]),
  improvements: z.array(z.coerce.string()).catch([]),
  nextStep: z.coerce.string().catch(''),
  debrief: z.object({
    meaning: z.coerce.string().catch(''),
    adjust: z.coerce.string().catch(''),
  }).nullable().catch(null).optional(),
});

const REVIEW_SYSTEM_PROMPT = `You are Affina — a warm but honest startup mentor reviewing a founder's real-world task completion.
Be specific: reference what they actually wrote. Keep each bullet to 1-2 sentences.
Score guide: 90+ = excellent execution, 70-89 = good with minor gaps, 50-69 = partial, below 50 = needs significant improvement.
Respond ONLY with valid JSON, no other text.

GLOBAL RUBRIC RULES (always in force — fabrication protocol and celebration
protocol matter most on field missions):
${GLOBAL_RUBRIC_RULES}`;

async function handleSubmit(db: Db, email: string, req: VercelRequest, res: VercelResponse) {
  const { taskId, submissionData } = req.body;
  // Length cap (audit F11) — submissionText is AI-reviewed; bound it before the prompt.
  const submissionText = clamp(req.body?.submissionText, LIMITS.longText);
  if (!taskId || !submissionText.trim()) {
    return res.status(400).json({ error: 'taskId and submissionText required' });
  }

  const user = await db.query.users.findFirst({ where: eq(users.email, email) });
  if (!user) return res.status(404).json({ error: 'user not found' });

  // §4 ownership — the task must belong to the session user (scoped by userId).
  const task = await db.query.tasks.findFirst({
    where: and(eq(tasks.id, Number(taskId)), eq(tasks.userId, user.id)),
  });
  if (!task) return res.status(404).json({ error: 'task not found' });

  // Server-side paywall (audit P1) — a field mission on a paid module (M5–M12) can only
  // be submitted/AI-reviewed by a subscriber. Self/ad-hoc + free-module missions pass.
  if (!requireEntitlement(res, task.sourceRef, user.subscribed)) return;

  // Mark as submitted (submissionData = structured field-task artifact, §3.2)
  await db.update(tasks)
    .set({
      submissionText: submissionText.trim(),
      submissionData: submissionData ?? null,
      status: 'submitted',
      updatedAt: new Date(),
    })
    .where(eq(tasks.id, task.id));

  const isFieldMission = task.source === 'program';
  let review: z.infer<typeof TaskReviewSchema>;
  try {
    const debriefPart = isFieldMission
      ? `,
  "debrief": {
    "meaning": "<2-3 sentences: what what-she-heard/did actually MEANS for her startup — the honest interpretation of the field results>",
    "adjust": "<1-2 sentences: what to correct in her hypothesis, script, or approach based on this>"
  }`
      : '';
    const missionRubric = task.sourceRef && RUBRICS[task.sourceRef]
      ? `\nSCORING RUBRIC FOR THIS MISSION (overrides the generic score guide):\n${RUBRICS[task.sourceRef]}\n`
      : '';
    const userMessage = `Task: "${task.title}"
Full instruction: ${task.instruction}
Founder's submission: "${submissionText.trim()}"
${missionRubric}${isFieldMission ? '\nThis was a REAL-WORLD field mission — include a debrief interpreting the results.\n' : ''}
Return JSON:
{
  "score": <0-100>,
  "verdict": <"strong" if ≥80, "good" if 55-79, "needs_work" if <55>,
  "highlights": [<2-3 specific things they did well>],
  "improvements": [<0-2 gaps to strengthen — omit if score≥90>],
  "nextStep": "<one concrete follow-up action>"${debriefPart}
}`;

    const message = await callClaude({
      model: MODELS.standard,
      max_tokens: 800,
      system: REVIEW_SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userMessage }],
    }, { endpoint: 'tasks', mode: 'submit', email });
    const raw = message.content[0].type === 'text' ? message.content[0].text : '';
    const match = raw.match(/\{[\s\S]*\}/);
    if (!match) throw new Error('no JSON');
    review = TaskReviewSchema.parse(JSON.parse(match[0]));
    review.score = Math.max(0, Math.min(100, review.score));
    review.highlights = review.highlights.slice(0, 3);
    review.improvements = review.improvements.slice(0, 3);
  } catch {
    const [updated] = await db.update(tasks)
      .set({ status: 'submitted', updatedAt: new Date() })
      .where(eq(tasks.id, task.id))
      .returning();
    return res.status(200).json({ task: updated, reviewError: 'ai_unavailable' });
  }

  const finalStatus = review.score >= 50 ? 'done' : 'reviewed';

  const [updated] = await db.update(tasks)
    .set({ aiReview: JSON.stringify(review), status: finalStatus, updatedAt: new Date() })
    .where(eq(tasks.id, task.id))
    .returning();

  // §7: a program field mission reaching done for the FIRST time earns its readiness points.
  if (finalStatus === 'done' && task.source === 'program' && task.sourceRef && task.status !== 'done') {
    try {
      const delta = FIELD_POINTS[task.sourceRef] ?? 2;
      const label = LAYER_LABELS[task.linkedEntryType ?? ''] ?? 'field mission';
      await db.update(users).set({
        lastReadinessGain: { delta, sourceLabel: label },
        updatedAt: new Date(),
      }).where(eq(users.id, user.id));
    } catch { /* gain line must never block the submit */ }
  }

  // score ≥ 50 → save to brain_entries so it appears in Documents
  if (review.score >= 50) {
    const brainLessonId = `task_${task.id}`;
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
        entryType: (task.source === 'program' && task.linkedEntryType) ? task.linkedEntryType : 'task_result',
        processedByAi: true,
        aiScore: review.score,
        aiFeedback: JSON.stringify(mappedFeedback),
      });
    }
  }

  return res.status(200).json({ task: updated });
}

// Program v2 (§3.2): field-block tasks are auto-created when the user reaches
// a module containing a 🟡 block. "Reached" = module unlocked (previous module complete).
// audit F46 — accepts already-fetched rows (GET fetches tasks + completedLessons in one
// parallel pass) so this doesn't re-query them, and RETURNS the number of tasks created so
// the caller only re-fetches the list when something actually changed.
async function syncProgramTasks(
  db: Db,
  userId: number,
  preloaded?: { existing: typeof tasks.$inferSelect[]; completed: typeof completedLessons.$inferSelect[] },
): Promise<number> {
  const completed = preloaded?.completed
    ?? await db.query.completedLessons.findMany({ where: eq(completedLessons.userId, userId) });
  const done = new Set(completed.map((c) => c.lessonId));

  const existingProgram = (preloaded?.existing
    ?? await db.query.tasks.findMany({ where: and(eq(tasks.userId, userId), eq(tasks.source, 'program')) })
  ).filter((t) => t.source === 'program');
  const have = new Set(existingProgram.map((t) => t.sourceRef));

  let created = 0;
  for (let i = 0; i < MODULES.length; i++) {
    const unlocked = i === 0 || MODULES[i - 1].lessons.every((l) => done.has(l.id));
    if (!unlocked) continue;
    for (const lesson of MODULES[i].lessons) {
      if (blockKind(lesson) !== 'field' || have.has(lesson.id)) continue;
      await db.insert(tasks).values({
        userId,
        source: 'program',
        sourceRef: lesson.id,
        title: lesson.title,
        instruction: lesson.body,
        priority: 90,
        status: 'todo',
        linkedEntryType: BRAIN_ENTRY_TYPES[lesson.id] ?? null,
      });
      created++;
    }
  }
  return created;
}

export default withAuth('GET,POST,OPTIONS', async (req, res, { email, db }) => {
  // GET /api/tasks — the session user's tasks.
  if (req.method === 'GET') {
    const user = await db.query.users.findFirst({ where: eq(users.email, email) });
    if (!user) return res.status(200).json({ tasks: [] });

    // audit F46 — one parallel fetch reused by the sync; re-query only if it inserted anything.
    const [rows0, completed] = await Promise.all([
      db.query.tasks.findMany({ where: eq(tasks.userId, user.id) }),
      db.query.completedLessons.findMany({ where: eq(completedLessons.userId, user.id) }),
    ]);
    let created = 0;
    try {
      created = await syncProgramTasks(db, user.id, { existing: rows0, completed });
    } catch { /* sync failure must not break the task list */ }
    const rows = created > 0 ? await db.query.tasks.findMany({ where: eq(tasks.userId, user.id) }) : rows0;

    // Sort: active (todo/submitted) first, then by updatedAt desc
    const order = { todo: 0, submitted: 1, reviewed: 2, done: 3 } as Record<string, number>;
    rows.sort((a, b) => {
      const diff = (order[a.status ?? 'todo'] ?? 0) - (order[b.status ?? 'todo'] ?? 0);
      if (diff !== 0) return diff;
      return new Date(b.updatedAt ?? '').getTime() - new Date(a.updatedAt ?? '').getTime();
    });

    return res.status(200).json({ tasks: rows });
  }

  // POST /api/tasks — create self-task | action 'briefing' | action 'submit'
  if (req.method === 'POST') {
    // Task submission + AI review (was api/tasks/submit.ts, folded here — audit P8).
    if (req.body.action === 'submit') return handleSubmit(db, email, req, res);

    // §4b — generate & cache the Mission Briefing for a program field task
    if (req.body.action === 'briefing') {
      const { taskId } = req.body;
      if (!taskId) return res.status(400).json({ error: 'taskId required' });

      const user = await db.query.users.findFirst({ where: eq(users.email, email) });
      if (!user) return res.status(404).json({ error: 'user not found' });
      const task = await db.query.tasks.findFirst({
        where: and(eq(tasks.id, Number(taskId)), eq(tasks.userId, user.id)),
      });
      if (!task) return res.status(404).json({ error: 'task not found' });
      // Server-side paywall (audit P1) — briefings are an AI call on a paid-module
      // mission; a non-subscriber can't spend tokens on M5–M12 content.
      if (!requireEntitlement(res, task.sourceRef, user.subscribed)) return;
      if (task.briefing) return res.status(200).json({ briefing: task.briefing });

      const entries = await db.query.brainEntries.findMany({ where: eq(brainEntries.userId, user.id) });
      const snap = user.snapshot as { sections: { title: string; content: string }[] } | null;
      const relevantTypes = ['persona', 'interview_script', 'sales_script', 'value_proposition', 'positioning', 'pipeline'];
      const relevant = entries
        .filter((e) => relevantTypes.includes(e.entryType))
        .map((e) => `[${e.entryType}] ${(e.content ?? '').slice(0, 700)}`)
        .join('\n\n');

      try {
        const msg = await callClaude({
          model: MODELS.standard,
          max_tokens: 500,
          system: BRIEFING_SYSTEM,
          messages: [{
            role: 'user',
            content: `Startup Snapshot:\n${snap ? snap.sections.map((s) => `## ${s.title}\n${s.content}`).join('\n') : '(none yet)'}\n\nRelevant Brain entries:\n${relevant || '(none yet)'}\n\nTHE MISSION — "${task.title}":\n${task.instruction}\n\nWrite her Mission Briefing.`,
          }],
        }, { endpoint: 'tasks', mode: 'briefing', email: user.email });
        const briefing = msg.content[0].type === 'text' ? msg.content[0].text.trim() : '';
        if (!briefing) throw new Error('empty');
        await db.update(tasks).set({ briefing, updatedAt: new Date() }).where(eq(tasks.id, task.id));
        return res.status(200).json({ briefing });
      } catch {
        return res.status(502).json({ error: 'ai_unavailable' });
      }
    }

    const { title, instruction } = req.body;
    if (!title?.trim() || !instruction?.trim()) {
      return res.status(400).json({ error: 'title and instruction required' });
    }

    const user = await db.query.users.findFirst({ where: eq(users.email, email) });
    if (!user) return res.status(404).json({ error: 'user not found' });

    const [task] = await db.insert(tasks).values({
      userId: user.id,
      source: 'self',
      sourceRef: null,
      title: title.trim().slice(0, 60),
      instruction: instruction.trim(),
    }).returning();

    return res.status(201).json({ task });
  }

  return res.status(405).json({ error: 'method not allowed' });
});
