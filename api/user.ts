import type { VercelRequest, VercelResponse } from '@vercel/node';
import { applyCors } from '../src/server/http.js';
import { requireAuth } from '../src/server/requireAuth.js';
import { checkRateLimit } from '../src/server/ratelimit.js';
import { getDb } from '../src/server/db.js';
import { clampInt } from '../src/server/limits.js';
import { captureError } from '../src/server/observability.js';
import { eq, and, isNull } from 'drizzle-orm';
import { users, lessonInputs, completedLessons, brainEntries, tasks, checkIns, achievements, delegations, mentorRequests, events } from '../src/db/schema.js';
import { MODULES } from '../src/data.js';
import { GROWTH_SEED_XP } from '../src/server/progressUtils.js';
import { sendEmail, mentorBookedEmail, mentorRequestAlertEmail, hotLeadAlertEmail, guideEmail } from '../src/server/email.js';
import { sendOnce } from '../src/server/emailLog.js';

// Auth Phase B (SPEC_AUTH_PHASE_B): GET + PATCH derive identity from the session cookie
// (requireAuth) — the client email param is ignored. POST is the PRE-AUTH onboarding
// surface (§7): no session, IP rate-limited, and it may ONLY create/update a PENDING row
// (verifiedAt IS NULL) — it refuses to touch a verified account. Post-verify profile
// edits go through PATCH.

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

  // GET /api/user — load the SESSION user's data (identity from the cookie, not a param).
  if (req.method === 'GET') {
    const email = requireAuth(req, res);
    if (!email) return;

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
      phone: user.phone ?? null,                       // SPEC_PHONE_CAPTURE — client gates the popups on this
      guideUrl: process.env.GUIDE_URL || null,         // runtime feature gate for the guide popup
      // Founding-cohort config (SPEC_COHORT_PAYWALL §2/§3) — read from env per request so seat
      // counts + Calendly change without a rebuild. Manual only; never auto-decremented.
      calendlyUrl: process.env.CALENDLY_URL || null,
      cohortSeatsTotal: Number(process.env.COHORT_SEATS_TOTAL) || 15,
      cohortSeatsLeft: process.env.COHORT_SEATS_LEFT != null && process.env.COHORT_SEATS_LEFT !== ''
        ? Number(process.env.COHORT_SEATS_LEFT) : 11,
      // §3a post-call acceptance — drives the "claim your seat" paywall variant.
      cohortAcceptedAt: user.cohortAcceptedAt ? new Date(user.cohortAcceptedAt).toISOString() : null,
      seatHeldUntil: user.seatHeldUntil ? new Date(user.seatHeldUntil).toISOString() : null,
      mentorSessions: user.mentorSessions ?? null,
      // Funnel (SPEC_ONBOARDING_FUNNEL): verification state + persisted report for /report.
      verifiedAt: user.verifiedAt ? new Date(user.verifiedAt).toISOString() : null,
      onboardingReport: user.onboardingReport ?? null,
      lessonInputs: Object.fromEntries(inputs.map((i) => [i.lessonId, i.content ?? ''])),
      completedLessons: completed.map((c) => c.lessonId),
    });
  }

  // POST /api/user — PRE-AUTH onboarding surface (SPEC_AUTH_PHASE_B §7). No session:
  // it may ONLY create/update a PENDING row (verifiedAt IS NULL) and refuses to touch a
  // verified account (a pre-auth caller must never overwrite / read a real user's data).
  // IP rate-limited. Post-verify profile edits go through PATCH (session-guarded).
  //   emailCapture=true (SPEC_ONBOARDING_FUNNEL §2a): email-capture / change-email — blocks
  //     on a verified account, else creates/reuses the pending row FOR `email` only, sets
  //     emailCapturedAt. (No cross-email relocate — see F06 note below.)
  //   plain sync: name/project/report onto the pending row during onboarding.
  if (req.method === 'POST') {
    const rl = await checkRateLimit(req); // pre-auth → IP-based only (no session email)
    if (!rl.ok) {
      if (rl.retryAfter) res.setHeader('Retry-After', String(rl.retryAfter));
      return res.status(429).json({ error: 'rate_limited', retryAfter: rl.retryAfter });
    }

    const body = req.body ?? {};
    const email = String(body.email ?? '').trim().toLowerCase();
    if (!email) return res.status(400).json({ error: 'email required' });
    const { name, projectName, idea, customer, businessModel, stage, goal, country, city, timezone, onboardingReport, emailCapture } = body;
    // audit F14 — never trust the client-supplied onboarding score; clamp to [0,100].
    // It's a display/motivation number (from the pre-auth /api/score compute), never an
    // entitlement, so clamping — not recomputing — is the proportionate fix.
    const score = clampInt(body.score, 0, 100);

    // Profile fields written on every path. drizzle .set()/.values() skips `undefined`,
    // so an omitted field (e.g. name at capture time) never clobbers an existing value.
    const profile = { name, projectName, idea, customer, businessModel, stage, goal, score, country, city, timezone };
    // email-capture reuse wipes the previous life of a reused pending row.
    const derivedReset = {
      phase: 'launch', launchValidatedAt: null, growthXp: 0, northStar: null,
      pulseStreak: 0, lastCheckInAt: null, momentumCard: null, lastReadinessGain: null,
      snapshot: null, snapshotHistory: null, mentorSessions: null, subscribed: false,
    };

    // ── EMAIL CAPTURE (§2a) — verification = ownership; block only on verified ────────
    // audit F06: the previousEmail "relocate" branch was REMOVED. It let an anonymous
    // caller move ANY pending row (keyed by a client-supplied previousEmail) onto an
    // address the caller controls, then verify it and steal the victim's onboarding data
    // (and deny the victim their signup). A pre-auth caller may now only ever touch the
    // row for the email it is capturing — never a row keyed by some other address, and
    // never a verified one. Change-email simply captures onto the new address; the client
    // re-sends the full onboarding data, and the old pending row is left to expire.
    if (emailCapture === true) {
      const capturedAt = new Date();
      // Analytics stitch (SPEC_ANALYTICS §4.1) — anonId + UTM touches from the tracker.
      const anonId = typeof body.anonId === 'string' && body.anonId.trim() ? body.anonId.trim().slice(0, 80) : undefined;
      const touches = body.touches as { first?: unknown; last?: unknown } | undefined;
      const analyticsSet: Record<string, unknown> = {};
      if (anonId) analyticsSet.anonId = anonId;
      if (touches?.first) analyticsSet.utmFirst = touches.first;
      if (touches?.last) analyticsSet.utmLast = touches.last;

      const target = await db.query.users.findFirst({ where: eq(users.email, email) });
      // The one intentional signal the funnel UX needs (EmailCapture/ConfirmEmail show
      // "you already have an account — sign in"). Bounded by the IP rate limit above.
      if (target?.verifiedAt) return res.status(200).json({ blocked: true, reason: 'already_registered' });

      let uid: number;
      if (target) {
        // Reuse the pending row: overwrite intake/report with this run, refresh the clock.
        await wipeUserChildren(db, target.id);
        await db.update(users)
          .set({ ...profile, ...derivedReset, ...analyticsSet, onboardingReport, emailCapturedAt: capturedAt, updatedAt: capturedAt })
          .where(eq(users.id, target.id));
        uid = target.id;
      } else {
        const [created] = await db.insert(users)
          .values({ email, ...profile, ...analyticsSet, onboardingReport, emailCapturedAt: capturedAt })
          .returning({ id: users.id });
        uid = created.id;
      }
      // Backfill the pre-signup event trail onto this user (same-device events by anonId).
      if (anonId) {
        try { await db.update(events).set({ userId: uid }).where(and(eq(events.anonId, anonId), isNull(events.userId))); }
        catch (err) { captureError(err, { endpoint: 'user', mode: 'events-backfill', email }); }
      }
      // Uniform success shape (no id / reused / created leak) — the only distinguishable
      // response is the verified-account block above, which the UX requires.
      return res.status(200).json({ ok: true });
    }

    // Plain onboarding sync (syncUserToDB — fire-and-forget; the client ignores the body).
    // Refuse a VERIFIED row (§7: pre-auth touches pending only). audit F14: return a
    // UNIFORM response for verified / pending / new, so this path is not an email-
    // registration enumeration oracle (a prober can't tell the three cases apart).
    const existing = await db.query.users.findFirst({ where: eq(users.email, email) });
    if (existing?.verifiedAt) {
      return res.status(200).json({ ok: true }); // silently no-op — never touch a verified row, never reveal it
    }
    if (existing) {
      await db.update(users)
        .set({ ...profile, onboardingReport, updatedAt: new Date() })
        .where(eq(users.id, existing.id));
    } else {
      // Welcome fires on magic-link verification (api/auth.ts verify-link), not here.
      await db.insert(users).values({ email, ...profile, onboardingReport });
    }
    return res.status(200).json({ ok: true });
  }

  // PATCH /api/user — post-auth profile/account edits. Identity from the SESSION cookie;
  // the client email param is ignored (§2). Handles the full profile so post-verify edits
  // (m0l3 "Your Project Today", AccountPanel) go through the session, never the pre-auth POST.
  if (req.method === 'PATCH') {
    const email = requireAuth(req, res);
    if (!email) return;
    // Rate limit (audit F07) — PATCH can trigger mentor-booked emails; without this a
    // session could fan out unbounded Resend sends by toggling mentorSessions keys.
    const rl = await checkRateLimit(req, { email });
    if (!rl.ok) {
      if (rl.retryAfter) res.setHeader('Retry-After', String(rl.retryAfter));
      return res.status(429).json({ error: 'rate_limited', retryAfter: rl.retryAfter });
    }
    // NOTE: `subscribed` is NOT accepted here — it's driven ONLY by the Stripe webhook
    // (SPEC_STRIPE §3), never from the browser. The paywall now redirects to Checkout.
    const { name, projectName, idea, customer, businessModel, stage, goal, country, city, timezone, mentorSessions, mentorRequest, phone } = req.body ?? {};
    const existingUser = await db.query.users.findFirst({ where: eq(users.email, email) });
    if (!existingUser) return res.status(404).json({ error: 'user not found' });

    // Mentor sessions are a PAID feature (SPEC_MENTOR_REQUEST amendment 2026-07-16). Reject any
    // mentorRequest / mentorSessions write from an unsubscribed user BEFORE any row is inserted
    // or any email is sent — UI gates are bypassable, this is the real enforcement. Profile and
    // phone-lead edits stay ungated. The client maps this 403 to opening the paywall.
    if ((mentorRequest !== undefined || mentorSessions !== undefined) && !existingUser.subscribed) {
      return res.status(403).json({ error: 'subscription_required' });
    }

    const patchFields: Record<string, unknown> = { updatedAt: new Date() };
    for (const [k, v] of Object.entries({ name, projectName, idea, customer, businessModel, stage, goal, country, city, timezone })) {
      if (v !== undefined) patchFields[k] = v;
    }

    // Phone capture (SPEC_PHONE_CAPTURE §1) — light validation; phoneSource is FIRST-wins.
    // 'mentor' (amendment): the REQUIRED phone on the mentor booking form — always saved so we
    // never lose contact for the paid call (number updated even if a lead source came first).
    let phoneSave: { number: string; source: 'guide' | 'paywall' | 'mentor' } | null = null;
    if (phone !== undefined) {
      const number = String(phone?.number ?? '').trim().slice(0, 40);
      const source = phone?.source;
      if (number.length >= 5 && (source === 'guide' || source === 'paywall' || source === 'mentor')) {
        phoneSave = { number, source };
        patchFields.phone = number;
        patchFields.phoneSource = (existingUser as { phoneSource?: string | null }).phoneSource ?? source; // first source wins
        patchFields.phoneAt = new Date();
      } else {
        return res.status(400).json({ error: 'invalid phone (number ≥5 chars, source guide/paywall/mentor)' });
      }
    }

    // Mentor request (SPEC_MENTOR_REQUEST §3) — validate; then fold into mentorSessions as a
    // booked flip so the existing #4 confirmation email + nudge-suppression run unchanged
    // (do NOT add a second user-facing email). The row + admin alert are added after the write.
    let mentorReq: { session: 'S1' | 'S2' | 'S3'; topic: string } | null = null;
    if (mentorRequest !== undefined) {
      const s = mentorRequest?.session;
      const topic = String(mentorRequest?.topic ?? '').trim().slice(0, 500);
      if ((s === 'S1' || s === 'S2' || s === 'S3') && topic) mentorReq = { session: s, topic };
      else return res.status(400).json({ error: 'invalid mentorRequest (session S1/S2/S3, topic 1-500 chars)' });
    }

    // Merge mentorSessions (partial patch per session) — never clobber other sessions.
    const sessionsIn: Record<string, unknown> = {
      ...(mentorSessions && typeof mentorSessions === 'object' ? mentorSessions as Record<string, unknown> : {}),
      ...(mentorReq ? { [mentorReq.session]: { ...(((mentorSessions as Record<string, unknown>)?.[mentorReq.session]) as object ?? {}), booked: true } } : {}),
    };
    const newlyBooked: string[] = [];
    if (Object.keys(sessionsIn).length > 0) {
      const prev = (existingUser.mentorSessions ?? {}) as Record<string, unknown>;
      const merged: Record<string, unknown> = { ...prev };
      for (const [k, v] of Object.entries(sessionsIn)) {
        // audit F07 — only the 3 real sessions exist; ignoring unknown keys bounds the
        // email fan-out to ≤3 per request (a hostile client can't invent S4…S999).
        if (k !== 'S1' && k !== 'S2' && k !== 'S3') continue;
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
    // §2.4 — mentor-session-booked email when a session's `booked` flips true. sendOnce
    // dedups by (user, 'mentor_booked', sid) so a false→true→false→true toggle can't
    // re-send (audit F07); combined with the ≤3-key bound + rate limit, fan-out is capped.
    for (const sid of newlyBooked) {
      await sendOnce(existingUser.id, 'mentor_booked', sid, mentorBookedEmail(email, sid, undefined, existingUser.name));
    }

    // Mentor request row (feeds the future admin panel) + admin alert (SPEC_MENTOR_REQUEST §3.4/§4).
    if (mentorReq) {
      try {
        await db.insert(mentorRequests).values({ userId: existingUser.id, session: mentorReq.session, topic: mentorReq.topic });
      } catch (err) {
        captureError(err, { endpoint: 'user', mode: 'mentor-request-insert', email });
      }
      // Best-effort "current module" for the alert (furthest module with any completion).
      let moduleLabel: string | undefined;
      try {
        const done = await db.query.completedLessons.findMany({ where: eq(completedLessons.userId, existingUser.id) });
        const doneSet = new Set(done.map((c) => c.lessonId));
        let furthest = 0;
        for (const m of MODULES) if (m.lessons.some((l) => doneSet.has(l.id))) furthest = Math.max(furthest, m.order);
        moduleLabel = `M${furthest}`;
      } catch { /* best-effort */ }
      void sendEmail(mentorRequestAlertEmail({
        name: existingUser.name, project: existingUser.projectName, email,
        // Prefer the number just submitted with the booking (amendment) over any older one on file.
        phone: phoneSave?.number ?? (existingUser as { phone?: string | null }).phone ?? null,
        session: mentorReq.session, topic: mentorReq.topic,
        module: moduleLabel, subscribed: !!existingUser.subscribed,
      }));
    }

    // Phone lead: hot-lead alert to ADMIN_EMAIL (every save) + guide delivery (guide surface
    // only, deduped) — SPEC_PHONE_CAPTURE §2.3/§4. A 'mentor' phone is a paying customer's
    // contact for the call (not a lead) and the mentor alert above already carries it — skip.
    if (phoneSave && phoneSave.source !== 'mentor') {
      let moduleLabel: string | undefined;
      try {
        const done = await db.query.completedLessons.findMany({ where: eq(completedLessons.userId, existingUser.id) });
        const doneSet = new Set(done.map((c) => c.lessonId));
        let furthest = 0;
        for (const m of MODULES) if (m.lessons.some((l) => doneSet.has(l.id))) furthest = Math.max(furthest, m.order);
        moduleLabel = `M${furthest}`;
      } catch { /* best-effort */ }
      void sendEmail(hotLeadAlertEmail({
        name: existingUser.name, project: existingUser.projectName, email,
        phone: phoneSave.number, source: phoneSave.source, module: moduleLabel,
        verified: !!existingUser.verifiedAt, subscribed: !!existingUser.subscribed,
      }));
      if (phoneSave.source === 'guide' && process.env.GUIDE_URL) {
        const base = process.env.APP_URL || 'https://affina-space.vercel.app';
        void sendOnce(existingUser.id, 'guide', 'once', guideEmail(email, base + process.env.GUIDE_URL));
      }
    }
    return res.status(200).json({ ok: true });
  }

  return res.status(405).json({ error: 'method not allowed' });
}
