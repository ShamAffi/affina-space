import type { VercelRequest, VercelResponse } from '@vercel/node';
import { applyCors } from '../src/server/http.js';
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { eq } from 'drizzle-orm';
import { users, lessonInputs, completedLessons, brainEntries, tasks, checkIns, achievements, delegations } from '../src/db/schema.js';
import { GROWTH_SEED_XP } from '../src/server/progressUtils.js';
import { sendEmail, subscriptionEmail, mentorBookedEmail } from '../src/server/email.js';
import { logEmail } from '../src/server/emailLog.js';

function getDb() {
  const sql = neon(process.env.DATABASE_URL!);
  return drizzle(sql, { schema: { users, lessonInputs, completedLessons, brainEntries, tasks, checkIns, achievements, delegations } });
}

// Re-onboarding with an existing email (freshStart) must not inherit the previous
// life of that account: wipe all child rows and reset derived state, otherwise old
// tasks/brain/progress leak into the new project (root cause of the ghost-tasks bug).
async function wipeUserChildren(db: ReturnType<typeof getDb>, userId: number) {
  await Promise.all([
    db.delete(lessonInputs).where(eq(lessonInputs.userId, userId)),
    db.delete(completedLessons).where(eq(completedLessons.userId, userId)),
    db.delete(brainEntries).where(eq(brainEntries.userId, userId)),
    db.delete(tasks).where(eq(tasks.userId, userId)),
    db.delete(checkIns).where(eq(checkIns.userId, userId)),
    db.delete(achievements).where(eq(achievements.userId, userId)),
    db.delete(delegations).where(eq(delegations.userId, userId)),
  ]);
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (applyCors(req, res, 'GET,POST,PATCH,OPTIONS')) return;

  const db = getDb();

  // GET /api/user?email=... — load user data
  if (req.method === 'GET') {
    const email = ((req.query.email as string) ?? '').trim().toLowerCase();
    if (!email) return res.status(400).json({ error: 'email required' });

    const user = await db.query.users.findFirst({ where: eq(users.email, email) });
    if (!user) return res.status(404).json({ error: 'not found' });

    const inputs = await db.query.lessonInputs.findMany({
      where: eq(lessonInputs.userId, user.id),
    });
    const completed = await db.query.completedLessons.findMany({
      where: eq(completedLessons.userId, user.id),
    });

    return res.status(200).json({
      name: user.name ?? '',
      projectName: user.projectName ?? '',
      idea: user.idea ?? '',
      customer: user.customer ?? '',
      businessModel: user.businessModel ?? '',
      stage: user.stage ?? '',
      goal: user.goal ?? '',
      country: user.country ?? '',
      city: user.city ?? '',
      timezone: user.timezone ?? '',
      email: user.email,
      score: user.score ?? 0,
      subscribed: user.subscribed ?? false,
      mentorSessions: user.mentorSessions ?? null,
      // Funnel (SPEC_ONBOARDING_FUNNEL): verification state + persisted report for /report.
      verifiedAt: user.verifiedAt ? new Date(user.verifiedAt).toISOString() : null,
      onboardingReport: user.onboardingReport ?? null,
      lessonInputs: Object.fromEntries(inputs.map((i) => [i.lessonId, i.content ?? ''])),
      completedLessons: completed.map((c) => c.lessonId),
    });
  }

  // POST /api/user — upsert user with onboarding data.
  //   emailCapture=true (SPEC_ONBOARDING_FUNNEL §2a) = the email-capture / change-email
  //     step: block ONLY on a verified account (ownership); pending rows reuse (overwrite),
  //     never block. Sets emailCapturedAt (starts the finish-sequence clock).
  //   freshStart=true = this email starts a new project: wipe child rows + reset derived.
  //   Plain sync calls (LMS mount etc.) never send a flag and never touch children.
  if (req.method === 'POST') {
    const body = req.body ?? {};
    const email = String(body.email ?? '').trim().toLowerCase();
    if (!email) return res.status(400).json({ error: 'email required' });
    const { name, projectName, idea, customer, businessModel, stage, goal, score, country, city, timezone, freshStart, onboardingReport, emailCapture, previousEmail } = body;

    // Profile fields written on every path. drizzle .set()/.values() skips `undefined`,
    // so an omitted field (e.g. name at capture time) never clobbers an existing value.
    const profile = { name, projectName, idea, customer, businessModel, stage, goal, score, country, city, timezone };
    // freshStart + email-capture reuse both wipe the previous life of a reused row.
    const derivedReset = {
      phase: 'launch', launchValidatedAt: null, growthXp: 0, northStar: null,
      pulseStreak: 0, lastCheckInAt: null, momentumCard: null, lastReadinessGain: null,
      snapshot: null, snapshotHistory: null, mentorSessions: null, subscribed: false,
    };

    // ── EMAIL CAPTURE (§2a) — verification = ownership; block only on verified ────────
    if (emailCapture === true) {
      const capturedAt = new Date();
      const target = await db.query.users.findFirst({ where: eq(users.email, email) });
      if (target?.verifiedAt) return res.status(200).json({ blocked: true, reason: 'already_registered' });

      // Change-email: relocate the current pending row to the new address (child rows key
      // on userId, so they follow automatically). Same three-way check on the target email.
      const from = String(previousEmail ?? '').trim().toLowerCase();
      if (from && from !== email) {
        const prevRow = await db.query.users.findFirst({ where: eq(users.email, from) });
        if (prevRow && !prevRow.verifiedAt) {
          if (target && target.id !== prevRow.id) return res.status(200).json({ blocked: true, reason: 'in_use' });
          await db.update(users)
            .set({ email, ...profile, onboardingReport, emailCapturedAt: capturedAt, updatedAt: capturedAt })
            .where(eq(users.id, prevRow.id));
          return res.status(200).json({ id: prevRow.id, reused: true, moved: true });
        }
        // no pending source row → fall through and capture fresh on the new email
      }

      if (target) {
        // Reuse the pending row: overwrite intake/report with this run, refresh the clock.
        await wipeUserChildren(db, target.id);
        await db.update(users)
          .set({ ...profile, ...derivedReset, onboardingReport, emailCapturedAt: capturedAt, updatedAt: capturedAt })
          .where(eq(users.id, target.id));
        return res.status(200).json({ id: target.id, reused: true });
      }
      const [created] = await db.insert(users)
        .values({ email, ...profile, onboardingReport, emailCapturedAt: capturedAt })
        .returning({ id: users.id });
      return res.status(201).json({ id: created.id, created: true });
    }

    const existing = await db.query.users.findFirst({ where: eq(users.email, email) });

    if (existing) {
      if (freshStart === true) {
        await wipeUserChildren(db, existing.id);
        await db.update(users)
          .set({ ...profile, ...derivedReset, onboardingReport, updatedAt: new Date() })
          .where(eq(users.email, email));
        return res.status(200).json({ id: existing.id, freshStart: true });
      }

      await db.update(users)
        .set({ ...profile, onboardingReport, updatedAt: new Date() })
        .where(eq(users.email, email));
      return res.status(200).json({ id: existing.id });
    } else {
      const [created] = await db.insert(users)
        .values({ email, ...profile, onboardingReport })
        .returning({ id: users.id });
      // AMENDMENT: Welcome no longer fires here — entering email/saving profile isn't
      // "registration". Welcome fires on magic-link verification (api/auth.ts verify-link).
      return res.status(201).json({ id: created.id });
    }
  }

  // PATCH /api/user — update account fields (name, projectName, mentorSessions, subscribed)
  if (req.method === 'PATCH') {
    const { email, name, projectName, mentorSessions, subscribed } = req.body;
    if (!email) return res.status(400).json({ error: 'email required' });
    const existingUser = await db.query.users.findFirst({ where: eq(users.email, email) });
    const patchFields: Record<string, unknown> = { updatedAt: new Date() };
    if (name !== undefined) patchFields.name = name;
    if (projectName !== undefined) patchFields.projectName = projectName;
    if (subscribed !== undefined) patchFields.subscribed = subscribed;
    // Merge mentorSessions (partial patch per session) — never clobber other sessions.
    const newlyBooked: string[] = [];
    if (mentorSessions !== undefined) {
      const prev = (existingUser?.mentorSessions ?? {}) as Record<string, unknown>;
      const merged: Record<string, unknown> = { ...prev };
      for (const [k, v] of Object.entries(mentorSessions as Record<string, unknown>)) {
        const before = prev[k] as { booked?: boolean } | undefined;
        const after = v as { booked?: boolean };
        if (after?.booked === true && before?.booked !== true) newlyBooked.push(k);
        merged[k] = { ...(prev[k] as object ?? {}), ...(v as object) };
      }
      patchFields.mentorSessions = merged;
    }

    // Graduation (решение Шамиля): completing mentor session S3 IS the launch→growth
    // moment — the post-program Growth/XP phase starts here with its seed points.
    if (mentorSessions?.S3?.completed === true) {
      if (existingUser && (existingUser.phase ?? 'launch') === 'launch') {
        patchFields.phase = 'growth';
        patchFields.launchValidatedAt = new Date();
        patchFields.growthXp = GROWTH_SEED_XP;
      }
    }

    await db.update(users).set(patchFields).where(eq(users.email, email));
    // §2.3 — subscription-confirmed email when `subscribed` flips false→true (the /unlock path)
    if (subscribed === true && existingUser?.subscribed !== true) {
      await sendEmail(subscriptionEmail(email));
      if (existingUser) await logEmail(existingUser.id, 'subscription');
    }
    // §2.4 — mentor-session-booked email when a session's `booked` flips true (once per session)
    for (const sid of newlyBooked) {
      await sendEmail(mentorBookedEmail(email, sid));
      if (existingUser) await logEmail(existingUser.id, 'mentor_booked', sid);
    }
    return res.status(200).json({ ok: true });
  }

  return res.status(405).json({ error: 'method not allowed' });
}
