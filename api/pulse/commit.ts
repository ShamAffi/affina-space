import type { VercelRequest, VercelResponse } from '@vercel/node';
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { eq, and, inArray } from 'drizzle-orm';
import { users, checkIns, tasks, brainEntries } from '../../src/db/schema.js';

function getDb() {
  const sql = neon(process.env.DATABASE_URL!);
  return drizzle(sql, { schema: { users, checkIns, tasks, brainEntries } });
}

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

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'method not allowed' });

  const { email, rawText, confirmedMetrics, draft } = req.body ?? {};
  if (!email || !draft) return res.status(400).json({ error: 'email and draft required' });

  const db = getDb();
  const user = await db.query.users.findFirst({ where: eq(users.email, email) });
  if (!user) return res.status(404).json({ error: 'user not found' });

  const weekOf = getWeekOf(new Date());
  const finalMetrics = confirmedMetrics ?? draft.metrics ?? [];

  // 1. Upsert check_in (same week = update, not duplicate)
  const existing = await db.query.checkIns.findFirst({
    where: and(eq(checkIns.userId, user.id), eq(checkIns.weekOf, weekOf)),
  });
  let checkInId: number;
  if (existing) {
    await db.update(checkIns).set({
      rawText: rawText ?? existing.rawText,
      headline: draft.headline,
      keyResults: draft.keyResults,
      metrics: finalMetrics,
      activity: draft.activity ?? [],
      sentiment: draft.sentiment,
      mentorNote: draft.mentorNote,
    }).where(eq(checkIns.id, existing.id));
    checkInId = existing.id;
  } else {
    const [created] = await db.insert(checkIns).values({
      userId: user.id,
      weekOf,
      rawText: rawText ?? '',
      headline: draft.headline,
      keyResults: draft.keyResults,
      metrics: finalMetrics,
      activity: draft.activity ?? [],
      sentiment: draft.sentiment,
      mentorNote: draft.mentorNote,
    }).returning({ id: checkIns.id });
    checkInId = created.id;
  }

  // 2. Create tasks (dedup against open ones)
  const openTasks = await db.query.tasks.findMany({
    where: and(eq(tasks.userId, user.id), inArray(tasks.status, ['todo', 'submitted'])),
  });

  const createdTasks: number[] = [];
  for (const t of (draft.tasks ?? []).slice(0, 3)) {
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
  const facts = (draft.snapshotFacts ?? []) as { section: string; fact: string }[];
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
    momentumCard: draft.momentumCard ?? null,
    ...snapshotPatch,
    updatedAt: now,
  }).where(eq(users.id, user.id));

  return res.status(200).json({
    checkInId,
    createdTasks,
    streak: newStreak,
    weekOf,
    momentumCard: draft.momentumCard ?? null,
  });
}
