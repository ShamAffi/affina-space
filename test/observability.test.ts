import { describe, it, expect, vi, beforeEach } from 'vitest';
import { captureError } from '../src/server/observability.ts';

describe('captureError (audit P7)', () => {
  beforeEach(() => {
    delete process.env.ALERT_WEBHOOK_URL;
    delete process.env.SENTRY_DSN;
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('always emits one structured error line and never throws', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => captureError(new Error('boom'), { endpoint: 'ai', mode: 'feedback' })).not.toThrow();
    expect(spy).toHaveBeenCalledOnce();
    const line = JSON.parse(spy.mock.calls[0][0] as string);
    expect(line).toMatchObject({ level: 'error', endpoint: 'ai', mode: 'feedback', message: 'boom' });
    expect(typeof line.ts).toBe('string');
  });

  it('handles non-Error throwables (string + object)', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    captureError('string failure', { endpoint: 'x' });
    captureError({ weird: true }, { endpoint: 'y' });
    expect(JSON.parse(spy.mock.calls[0][0] as string).message).toBe('string failure');
    expect(JSON.parse(spy.mock.calls[1][0] as string).message).toContain('weird');
  });

  it('POSTs a Slack/Discord-compatible message when ALERT_WEBHOOK_URL is set', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    process.env.ALERT_WEBHOOK_URL = 'https://hooks.slack.com/services/x/y/z';
    const fetchMock = vi.fn().mockResolvedValue({ ok: true });
    vi.stubGlobal('fetch', fetchMock);

    captureError(new Error('paid webhook down'), { endpoint: 'stripe', mode: 'webhook' });
    await vi.waitFor(() => expect(fetchMock).toHaveBeenCalled());

    const [url, opts] = fetchMock.mock.calls[0];
    expect(url).toBe('https://hooks.slack.com/services/x/y/z');
    const body = JSON.parse((opts as { body: string }).body);
    expect(body.text).toContain('stripe/webhook');
    expect(body.text).toContain('paid webhook down');
  });

  it('POSTs a Sentry envelope to the right endpoint when SENTRY_DSN is set', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    process.env.SENTRY_DSN = 'https://pub123@o1.ingest.sentry.io/456';
    const fetchMock = vi.fn().mockResolvedValue({ ok: true });
    vi.stubGlobal('fetch', fetchMock);

    captureError(new Error('kaboom'), { endpoint: 'cron' });
    await vi.waitFor(() => expect(fetchMock).toHaveBeenCalled());

    const [url, opts] = fetchMock.mock.calls[0] as [string, { headers: Record<string, string>; body: string }];
    expect(url).toBe('https://o1.ingest.sentry.io/api/456/envelope/');
    expect(opts.headers['X-Sentry-Auth']).toContain('sentry_key=pub123');
    const lines = opts.body.trim().split('\n'); // envelope header + item header + payload
    expect(lines).toHaveLength(3);
    expect(JSON.parse(lines[2]).exception.values[0].value).toBe('kaboom');
  });

  it('never throws even if the forwarder fetch rejects', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    process.env.ALERT_WEBHOOK_URL = 'https://x';
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network')));
    expect(() => captureError(new Error('e'), { endpoint: 'x' })).not.toThrow();
    await new Promise((r) => setTimeout(r, 5)); // let the rejected forward settle
  });
});
