import { Resend } from 'resend';

// Email layer (SPEC_EMAILS §0 / SPEC_RESEND_AUTH §3). Lives in src/server/ (not api/)
// — Vercel Hobby 12-function cap counts every .ts under /api. sendEmail NEVER throws
// into the request path: a failed send is caught + logged (fire-and-forget), so a
// broken Resend can't fail signup / login / a check-in. All copy is the final English
// from SPEC_EMAILS — that doc is the source of truth for content.

type Mail = { to: string; subject: string; html: string };

export async function sendEmail({ to, subject, html }: Mail): Promise<void> {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    console.error('[email] RESEND_API_KEY unset — skipping send:', subject, '→', to);
    return;
  }
  const from = process.env.EMAIL_FROM || 'Affina <hello@affina.space>';
  try {
    const resend = new Resend(key);
    const { error } = await resend.emails.send({ from, to, subject, html });
    if (error) console.error('[email] Resend returned an error:', error);
  } catch (err) {
    console.error('[email] send threw (swallowed, request continues):', err);
  }
}

// ── Shared brand wrapper — inline-styled HTML (email clients strip <style>).
// DESIGN.md brand hardcoded as hex. lifecycleNote adds a soft footer line on the
// cron/marketing emails (a real unsubscribe endpoint is Phase B / Broadcasts). ──────

const appUrl = () => process.env.APP_URL || 'https://affina-space.vercel.app';

const P = 'font-size:15px;line-height:1.6;color:#3f3f46;margin:0 0 16px 0;';

function wrap(bodyHtml: string, lifecycleNote?: string): string {
  const foot = lifecycleNote
    ? `<p style="font-family:-apple-system,'Segoe UI',Helvetica,Arial,sans-serif;font-size:12px;line-height:1.5;color:#9a9aa2;margin:16px 0 0 0;">${lifecycleNote}</p>`
    : '';
  return `<!doctype html><html><body style="margin:0;padding:0;background:#F4F4F5;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F4F4F5;padding:32px 12px;">
    <tr><td align="center">
      <table role="presentation" width="480" cellpadding="0" cellspacing="0" style="max-width:480px;width:100%;background:#ffffff;border-radius:16px;">
        <tr><td style="padding:28px 32px 6px 32px;">
          <span style="font-family:Georgia,'Times New Roman',serif;font-size:22px;font-weight:700;color:#7150EA;letter-spacing:-0.5px;">Affina<span style="color:#1F1F23;">Space</span></span>
        </td></tr>
        <tr><td style="padding:6px 32px 30px 32px;font-family:-apple-system,'Segoe UI',Helvetica,Arial,sans-serif;color:#1F1F23;">
          ${bodyHtml}
        </td></tr>
      </table>
      <p style="font-family:-apple-system,'Segoe UI',Helvetica,Arial,sans-serif;font-size:12px;color:#9a9aa2;margin:18px 0 0 0;">Affina — the AI incubator for early-stage founders.</p>
      ${foot}
    </td></tr>
  </table></body></html>`;
}

function button(href: string, label: string): string {
  return `<a href="${href}" style="display:inline-block;background:#7150EA;color:#ffffff;text-decoration:none;font-weight:600;font-size:15px;padding:13px 28px;border-radius:999px;">${label}</a>`;
}

function bullets(items: string[]): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 0 16px 0;">${items
    .map((t) => `<tr><td style="padding:2px 0;${P.replace('margin:0 0 16px 0;', 'margin:0;')}">• ${t}</td></tr>`)
    .join('')}</table>`;
}

const sign = `<p style="${P}margin-top:20px;color:#71717a;">— Affina</p>`;
const LIFECYCLE_NOTE = "You're getting this because you're building your startup with Affina.";
const SESSION_LABEL: Record<string, string> = { S1: 'Start', S2: 'Mid', S3: 'Final' };
export function sessionLabel(id: string): string { return SESSION_LABEL[id] ?? 'Start'; }

// Ops alerts go to ADMIN_EMAIL (default sk@affina.space, decided 2026-07-06) — one inbox
// for all alpha sales/ops signals (mentor requests + hot-lead phone numbers).
export const adminEmail = () => process.env.ADMIN_EMAIL || 'sk@affina.space';

// Escape user-supplied text before it enters email HTML (a founder's topic / project).
function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// ── Personalization (we have users.name from onboarding). First name only (a founder may
// enter a full name), with a graceful fallback to the generic copy when we have no name. ──
function firstName(name?: string | null): string { return (name ?? '').trim().split(/\s+/)[0] || ''; }
// Standalone "Hey {name} 👋" greeting line (→ "Hey 👋" when nameless).
function heyLine(name?: string | null): string {
  const n = firstName(name);
  return `<p style="${P}">Hey${n ? ` ${escapeHtml(n)}` : ''} 👋</p>`;
}
// Personalize a subject: "{Name}, {lowercased base}" when we have a name, else the base as-is.
function subj(name: string | null | undefined, base: string): string {
  const n = firstName(name);
  return n ? `${n}, ${base.charAt(0).toLowerCase()}${base.slice(1)}` : base;
}

// ── 1. Magic link (§2.1) ──────────────────────────────────────────────────────
export function magicLinkEmail(to: string, link: string, name?: string | null): Mail {
  return {
    to,
    subject: subj(name, 'Your Affina sign-in link'),
    html: wrap(`
      ${heyLine(name)}
      <p style="${P}">Tap the button and you're in. No password needed.</p>
      <p style="margin:0 0 18px 0;">${button(link, 'Sign in to Affina')}</p>
      <p style="font-size:13px;line-height:1.5;color:#71717a;margin:0;">This link works once and expires in 15 minutes. If this wasn't you, just ignore this email — nothing will happen.</p>
      ${sign}
    `),
  };
}

// ── 2. Welcome (§2.2) ─────────────────────────────────────────────────────────
export function welcomeEmail(to: string, name?: string | null): Mail {
  return {
    to,
    subject: subj(name, "Welcome to Affina — let's build this"),
    html: wrap(`
      ${heyLine(name)}
      <p style="${P}">You're in. Affina takes you from an idea to your first paying customer — one small, real step at a time. Not a course to watch: a program to <em>do</em>.</p>
      <p style="${P}">You won't do it alone — you've got AI guidance, live mentors, and a community of women building right alongside you.</p>
      <p style="${P}">Start with Module 0. It's short, and it sets everything up.</p>
      <p style="margin:0;">${button(appUrl(), 'Start Module 0')}</p>
      ${sign}
    `),
  };
}

// ── 3. Subscription confirmed (§2.3) ──────────────────────────────────────────
export function subscriptionEmail(to: string, name?: string | null): Mail {
  return {
    to,
    subject: subj(name, "You're in — the full program is open"),
    html: wrap(`
      <p style="${P}">That's the hard part started — now you build the business.</p>
      <p style="${P}">You've just unlocked:</p>
      ${bullets([
        'All 12 modules — idea → first paying customer',
        '3 live 1:1 mentor sessions with real founders',
        'Specialized deep-dive programs',
        'Live events &amp; a community of women founders',
      ])}
      <p style="${P}">First thing: book your <strong>Start</strong> session with a mentor — the fastest way to make sure you're pointed at the right thing before Module 5.</p>
      <p style="margin:0;">${button(`${appUrl()}/start-session`, 'Book my Start session')}</p>
      ${sign}
    `),
  };
}

// ── 4. Mentor session booked (§2.4) ───────────────────────────────────────────
export function mentorBookedEmail(to: string, sessionId: string, dateTime?: string, name?: string | null): Mail {
  const label = sessionLabel(sessionId);
  const when = dateTime?.trim()
    ? `You're set for your <strong>${label}</strong> session on ${dateTime.trim()}.`
    : `You're set for your <strong>${label}</strong> session. We'll be in touch to confirm your time.`;
  return {
    to,
    subject: subj(name, `Your ${label} session is booked ✅`),
    html: wrap(`
      <p style="${P}">${when}</p>
      <p style="${P}">It's a 1:1 with a founder who's done this. Come with your Snapshot open and whatever's on your mind — this hour is yours.</p>
      <p style="${P}">See you there.</p>
      ${sign}
    `),
  };
}

// ── 5. Weekly tasks — Thursday (§2.5) ─────────────────────────────────────────
export function weeklyTasksEmail(to: string, taskTitles: string[], name?: string | null): Mail {
  return {
    to,
    subject: subj(name, 'Your tasks for this week'),
    html: wrap(`
      ${heyLine(name)}
      <p style="${P}">Here's what's waiting for you in Affina — small steps toward your first customer:</p>
      ${bullets(taskTitles)}
      <p style="${P}">Even one task done is momentum. Start with the easiest one.</p>
      <p style="margin:0;">${button(`${appUrl()}/tasks`, 'Open my tasks')}</p>
    `, LIFECYCLE_NOTE),
  };
}

// ── 6. Business-week reflection — Saturday (§2.6) ─────────────────────────────
export function reflectionEmail(to: string, name?: string | null): Mail {
  return {
    to,
    subject: subj(name, 'How did your week go? (2 min — and it\'s for you)'),
    html: wrap(`
      ${heyLine(name)}
      <p style="${P}">Saturday's a good moment to look back. Not to report to us — for yourself: what actually moved this week, and what got stuck.</p>
      <p style="${P}">This is the quiet habit of founders who go the distance — they <strong>notice their own progress</strong>. Heads-down in the day-to-day, it feels like you're standing still. But mark the week and you see it: <em>"oh — I talked to three customers and rewrote my offer."</em> That gives your energy back and shows you where to steer next.</p>
      <p style="${P}">Takes a couple of minutes:</p>
      <p style="margin:0 0 18px 0;">${button(`${appUrl()}/traction`, 'Share how your week went')}</p>
      ${sign}
      <p style="font-size:13px;line-height:1.5;color:#71717a;margin:14px 0 0 0;">P.S. A rough week is fine too. Stuck? Just say so — that's exactly why your mentor and the program are right here.</p>
    `, LIFECYCLE_NOTE),
  };
}

// ── 7. Book your mentor (§2.7) ────────────────────────────────────────────────
export function bookMentorEmail(to: string, sessionId: string, name?: string | null): Mail {
  const label = sessionLabel(sessionId);
  return {
    to,
    subject: subj(name, 'Your mentor session is waiting'),
    html: wrap(`
      <p style="${P}">You've reached the point where one real conversation saves you weeks. Your <strong>${label}</strong> session is a 1:1 with a founder who's already walked this path — you'll talk through where you're headed and check your course.</p>
      <p style="margin:0;">${button(`${appUrl()}/dashboard`, 'Book my session')}</p>
    `, LIFECYCLE_NOTE),
  };
}

// ── 8. Re-engagement — 14 days no login (§2.8) ────────────────────────────────
export function reengagementEmail(to: string, moduleLabel: string, snapshotLine: string, name?: string | null): Mail {
  const n = firstName(name);
  return {
    to,
    subject: subj(name, 'Your idea is still here'),
    html: wrap(`
      <p style="${P}">Hey${n ? ` ${escapeHtml(n)}` : ''} 👋 We haven't seen you in a couple of weeks — everything okay?</p>
      <p style="${P}">You left off at <strong>${moduleLabel}</strong>, and your project — <em>"${snapshotLine}"</em> — hasn't gone anywhere. Picking back up is easy: just continue from where you stopped.</p>
      <p style="margin:0 0 18px 0;">${button(`${appUrl()}/dashboard`, 'Jump back in')}</p>
      <p style="font-size:13px;line-height:1.5;color:#71717a;margin:0;">Life gets busy — no pressure. But your first customer won't find itself 🙂</p>
    `, LIFECYCLE_NOTE),
  };
}

// ── Finish-registration sequence (AMENDMENT §D) — pending users (email not verified).
// CTA = a fresh magic link (one tap verifies + signs in). ──────────────────────────

// #9 — Day 1 · simple reminder
export function finish1Email(to: string, link: string, name?: string | null): Mail {
  return {
    to,
    subject: subj(name, 'Your project is waiting — one click to continue'),
    html: wrap(`
      ${heyLine(name)}
      <p style="${P}">You started with Affina but haven't confirmed your email yet — so your spot (and your project) is on pause. One tap and you're in for good, no password:</p>
      <p style="margin:0;">${button(link, 'Confirm my email &amp; continue')}</p>
      ${sign}
    `, LIFECYCLE_NOTE),
  };
}

// #10 — Day 3 · the odds. Source-verified (SPEC_EMAILS §D): SCORE (an SBA resource
// partner) — 5× more likely to START a business + higher revenues & growth. Framed as
// "the right support" (Affina = AI + mentors + community). Do NOT reframe to "with a
// mentor" or "start and succeed". Source: score.org mentorship-improves-odds-of-success.
export function finish2Email(to: string, link: string, name?: string | null): Mail {
  return {
    to,
    subject: subj(name, "With the right support, you're 5× more likely to start"),
    html: wrap(`
      ${heyLine(name)}
      <p style="${P}">Do you know: <strong>entrepreneurs with the right support are 5× more likely to start a business</strong> — and report higher revenues and increased business growth (SCORE, an SBA partner).</p>
      <p style="${P}">Most ideas never launch — not because they're bad, but because going it alone is overwhelming. With real guidance you stop guessing and just take the next step.</p>
      <p style="${P}">That's exactly Affina — AI incubation and real mentors guiding you the whole way, with honest feedback at each step. Your project's waiting:</p>
      <p style="margin:0;">${button(link, 'Confirm my email &amp; start')}</p>
      ${sign}
    `, LIFECYCLE_NOTE),
  };
}

// #11 — Day 7 · the dream + the right support (last one)
export function finish3Email(to: string, link: string, name?: string | null): Mail {
  return {
    to,
    subject: subj(name, "You had a reason to start. Don't let it fade."),
    html: wrap(`
      ${heyLine(name)}
      <p style="${P}">You came to Affina for a reason — a dream, an itch, a <em>"what if I actually did this?"</em> Don't let it quietly slip.</p>
      <p style="${P}">You don't have to do it alone. With Affina you get <strong>AI incubation</strong> guiding each step, <strong>live expert mentors</strong> when it matters, and a <strong>community of women founders</strong> building right alongside you.</p>
      <p style="${P}">Your idea deserves that. One tap and it's yours:</p>
      <p style="margin:0 0 16px 0;">${button(link, 'Confirm my email &amp; begin')}</p>
      <p style="font-size:13px;line-height:1.5;color:#71717a;margin:0;">(after this we'll stop reminding — no spam, promise)</p>
    `, LIFECYCLE_NOTE),
  };
}

// #12 — Day 0, T+1h · report ready (SPEC_ONBOARDING_FUNNEL §4 / SPEC_EMAILS §D2).
// Elapsed-time trigger (now - emailCapturedAt ≥ 1h), before the +1/+3/+7 nudges. The
// CTA is a fresh magic link → verify + land on the interactive /report page.
export function reportReadyEmail(to: string, link: string, name?: string | null): Mail {
  return {
    to,
    subject: subj(name, 'Your Affina report is ready 📋'),
    html: wrap(`
      ${heyLine(name)}
      <p style="${P}">You started mapping out your idea on Affina — here's your report, saved and ready for you.</p>
      <p style="${P}">Open it to see where your idea stands and take the next step. It's all set up — one tap and you're in:</p>
      <p style="margin:0;">${button(link, 'Open my report &amp; continue')}</p>
      ${sign}
    `, LIFECYCLE_NOTE),
  };
}

// ── Ops alerts → ADMIN_EMAIL (internal; not user-facing) ──────────────────────────

// Mentor request (SPEC_MENTOR_REQUEST §4). Her topic verbatim so Shamil can prep.
export function mentorRequestAlertEmail(d: {
  name?: string | null; project?: string | null; email: string; phone?: string | null;
  session: string; topic: string; module?: string | null; subscribed?: boolean;
}): Mail {
  const label = sessionLabel(d.session);
  return {
    to: adminEmail(),
    subject: `🧑‍🏫 Mentor request: ${(d.name?.trim() || d.email)} (${label})`,
    html: wrap(`
      <p style="${P}"><strong>${escapeHtml(d.name?.trim() || '—')}</strong> requested a <strong>${label}</strong> mentor session.</p>
      <p style="${P}margin:0 0 8px 0;"><strong>Topic:</strong></p>
      <p style="${P}background:#F4F4F5;border-radius:10px;padding:12px 14px;"><em>${escapeHtml(d.topic)}</em></p>
      ${bullets([
        `Project: ${escapeHtml(d.project?.trim() || '—')}`,
        `Email: ${escapeHtml(d.email)}`,
        `Phone: ${escapeHtml(d.phone?.trim() || '—')}`,
        `Module: ${escapeHtml(d.module || '—')}`,
        `Subscribed: ${d.subscribed ? 'yes' : 'no'}`,
      ])}
      <p style="font-size:13px;color:#71717a;margin:0;">Reply to coordinate a time — no calendar in alpha.</p>
    `),
  };
}

// Hot-lead phone number (SPEC_PHONE_CAPTURE §4). Fires on every phone save.
export function hotLeadAlertEmail(d: {
  name?: string | null; project?: string | null; email: string; phone: string;
  source: string; module?: string | null; verified?: boolean; subscribed?: boolean;
}): Mail {
  return {
    to: adminEmail(),
    subject: `📞 New lead: ${(d.name?.trim() || d.email)} (${d.source})`,
    html: wrap(`
      <p style="${P}"><strong>${escapeHtml(d.name?.trim() || '—')}</strong> left a phone number (<strong>${escapeHtml(d.source)}</strong>).</p>
      ${bullets([
        `Phone: <strong>${escapeHtml(d.phone)}</strong>`,
        `Project: ${escapeHtml(d.project?.trim() || '—')}`,
        `Email: ${escapeHtml(d.email)}`,
        `Module: ${escapeHtml(d.module || '—')}`,
        `Status: ${d.verified ? 'verified' : 'pending'}${d.subscribed ? ' · subscribed' : ''}`,
      ])}
      <p style="font-size:13px;color:#71717a;margin:0;">Reach out while she's warm.</p>
    `),
  };
}

// Guide delivery (SPEC_PHONE_CAPTURE §2.3) — user-facing, durable copy of the lead magnet.
export function guideEmail(to: string, guideUrl: string): Mail {
  return {
    to,
    subject: 'Your AI-First Founder\'s Guide 🎁',
    html: wrap(`
      <p style="${P}">Here it is — your copy to keep 🎁</p>
      <p style="${P}">The AI-First Founder's Guide: how to build your business with AI doing the heavy lifting — the playbook we use inside Affina.</p>
      <p style="margin:0 0 18px 0;">${button(guideUrl, 'Open the guide')}</p>
      ${sign}
    `),
  };
}
