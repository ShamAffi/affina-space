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
