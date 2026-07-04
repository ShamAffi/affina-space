import { Resend } from 'resend';

// Email layer (SPEC_RESEND_AUTH §3). Lives in src/server/ (not api/) — Vercel Hobby
// 12-function cap counts every .ts under /api. One integration serves transactional
// email AND magic-link auth. sendEmail NEVER throws into the request path: a failed
// send is caught + logged, so a broken Resend can't fail user creation / login.

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

// ── Templates: inline-styled HTML (email clients strip <style>). DESIGN.md brand
// hardcoded as hex. Small functions returning strings — no template engine. ────────

const appUrl = () => process.env.APP_URL || 'https://affina-space.vercel.app';

function wrap(bodyHtml: string): string {
  return `<!doctype html><html><body style="margin:0;padding:0;background:#F4F4F5;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F4F4F5;padding:32px 12px;">
    <tr><td align="center">
      <table role="presentation" width="480" cellpadding="0" cellspacing="0" style="max-width:480px;width:100%;background:#ffffff;border-radius:16px;">
        <tr><td style="padding:28px 32px 6px 32px;">
          <span style="font-family:Georgia,'Times New Roman',serif;font-size:22px;font-weight:700;color:#7150EA;letter-spacing:-0.5px;">Affina<span style="color:#1F1F23;">Space</span></span>
        </td></tr>
        <tr><td style="padding:6px 32px 32px 32px;font-family:-apple-system,'Segoe UI',Helvetica,Arial,sans-serif;color:#1F1F23;">
          ${bodyHtml}
        </td></tr>
      </table>
      <p style="font-family:-apple-system,'Segoe UI',Helvetica,Arial,sans-serif;font-size:12px;color:#9a9aa2;margin:18px 0 0 0;">Affina — the AI incubator for early-stage founders.</p>
    </td></tr>
  </table></body></html>`;
}

function button(href: string, label: string): string {
  return `<a href="${href}" style="display:inline-block;background:#7150EA;color:#ffffff;text-decoration:none;font-weight:600;font-size:15px;padding:13px 28px;border-radius:999px;">${label}</a>`;
}

const P = 'font-size:15px;line-height:1.55;color:#3f3f46;margin:0 0 16px 0;';
const H = 'font-size:20px;font-weight:700;margin:10px 0 10px 0;color:#1F1F23;';

export function magicLinkEmail(to: string, link: string): Mail {
  return {
    to,
    subject: 'Your Affina sign-in link',
    html: wrap(`
      <h1 style="${H}">Sign in to Affina</h1>
      <p style="${P}">Click below to sign in. This link works once and expires in 15 minutes.</p>
      <p style="margin:0 0 18px 0;">${button(link, 'Sign in →')}</p>
      <p style="font-size:13px;line-height:1.5;color:#71717a;margin:0;">If you didn't request this, you can safely ignore this email — no one can sign in without the link above.</p>
    `),
  };
}

export function welcomeEmail(to: string): Mail {
  return {
    to,
    subject: 'Welcome to Affina 💜',
    html: wrap(`
      <h1 style="${H}">Welcome to Affina</h1>
      <p style="${P}">Affina is your AI incubator — it walks you from idea to your first paying customer, one module at a time, with a mentor in your corner the whole way.</p>
      <p style="${P}">Start with Module 0. It takes about 10 minutes and sets everything up.</p>
      <p style="margin:0;">${button(appUrl(), 'Start Module 0 →')}</p>
    `),
  };
}

export function subscriptionEmail(to: string): Mail {
  return {
    to,
    subject: "You're in — Affina unlocked 🎉",
    html: wrap(`
      <h1 style="${H}">You're in 🎉</h1>
      <p style="${P}">Your subscription is active — Modules 5–12 are unlocked: the full path to launch and your first customers.</p>
      <p style="${P}">Next up: book your Strategy Session (S1) with a mentor to map your next 90 days.</p>
      <p style="margin:0;">${button(`${appUrl()}/start-session`, 'Book your session →')}</p>
    `),
  };
}
