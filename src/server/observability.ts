import crypto from 'node:crypto';

// Structured error capture (audit P7). Before this, server errors either vanished into
// swallowing catches or went to scattered console.error lines nobody queried — so a
// broken webhook / silent 502 / dead cron was invisible until a user complained.
//
// captureError does two things, both best-effort and NEVER throwing into the request:
//   1. Always emits ONE structured JSON line (level:"error") to the function logs, so
//      every error is consistently shaped and greppable in Vercel logs.
//   2. If SENTRY_DSN and/or ALERT_WEBHOOK_URL is set, forwards the error for real
//      alerting/dashboards. Dependency-free (no SDK) → zero cold-start/bundle cost on
//      Hobby when unset; add either env var later with no code change.
//
// Slack/Discord "Incoming Webhook" URLs both accept { text } — set ALERT_WEBHOOK_URL to
// one for instant "something broke in prod" pings. SENTRY_DSN uses Sentry's envelope API.

export type ErrorContext = {
  endpoint: string;          // which handler, e.g. 'stripe', 'ai', 'cron'
  mode?: string;             // feature within it, e.g. 'webhook', 'feedback'
  email?: string;            // when in scope
  [key: string]: unknown;    // any extra structured context
};

function describe(err: unknown): { message: string; stack?: string } {
  if (err instanceof Error) return { message: err.message, stack: err.stack };
  if (typeof err === 'string') return { message: err };
  try { return { message: JSON.stringify(err).slice(0, 1000) }; }
  catch { return { message: String(err) }; }
}

export function captureError(err: unknown, ctx: ErrorContext): void {
  const { message, stack } = describe(err);

  // 1) always: one structured, queryable log line
  console.error(JSON.stringify({
    level: 'error',
    ts: new Date().toISOString(),
    ...ctx,
    message,
    stack: stack?.split('\n').slice(0, 6).join('\n'),
  }));

  // 2) best-effort forward — fire-and-forget, its own failures are swallowed so
  //    observability can never break the request it is observing.
  void forward(message, stack, ctx);
}

async function forward(message: string, stack: string | undefined, ctx: ErrorContext): Promise<void> {
  const webhook = process.env.ALERT_WEBHOOK_URL;
  const dsn = process.env.SENTRY_DSN;
  const tag = [ctx.endpoint, ctx.mode].filter(Boolean).join('/');

  try {
    if (webhook) {
      await fetch(webhook, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: `🔴 Affina error [${tag}]: ${message}` }),
      });
    }
  } catch { /* alerting must never throw */ }

  try {
    if (dsn) await sendToSentry(dsn, message, stack, ctx);
  } catch { /* alerting must never throw */ }
}

// Minimal Sentry ingestion via the envelope endpoint — no SDK, so no cold-start cost.
// DSN shape: https://<publicKey>@<host>/<projectId>
async function sendToSentry(dsn: string, message: string, stack: string | undefined, ctx: ErrorContext): Promise<void> {
  const m = /^https:\/\/([^@]+)@([^/]+)\/(.+)$/.exec(dsn.trim());
  if (!m) return;
  const [, publicKey, host, projectId] = m;
  const eventId = crypto.randomUUID().replace(/-/g, '');
  const sentAt = new Date().toISOString();

  const event = {
    event_id: eventId,
    timestamp: sentAt,
    platform: 'node',
    level: 'error',
    logger: ctx.endpoint,
    exception: { values: [{ type: 'Error', value: message, stacktrace: stack ? { frames: [] } : undefined }] },
    tags: { endpoint: ctx.endpoint, ...(ctx.mode ? { mode: ctx.mode } : {}) },
    extra: { stack, ...ctx },
  };

  const envelope =
    JSON.stringify({ event_id: eventId, sent_at: sentAt, dsn }) + '\n' +
    JSON.stringify({ type: 'event' }) + '\n' +
    JSON.stringify(event) + '\n';

  await fetch(`https://${host}/api/${projectId}/envelope/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-sentry-envelope',
      'X-Sentry-Auth': `Sentry sentry_version=7, sentry_key=${publicKey}, sentry_client=affina-lite/1.0`,
    },
    body: envelope,
  });
}
