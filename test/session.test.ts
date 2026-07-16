import { describe, it, expect, beforeAll } from 'vitest';
import crypto from 'node:crypto';

// session.ts reads SESSION_SECRET at module load and throws if it's missing/short
// (audit F10). Set a valid secret, then import it dynamically so the module initializes
// against our test secret rather than crashing.
const SECRET = 'test-session-secret-long-enough-0123456789abcdef';
type SessionModule = typeof import('../src/server/session.ts');
let mod: SessionModule;

beforeAll(async () => {
  process.env.SESSION_SECRET = SECRET;
  mod = await import('../src/server/session.ts');
});

// Minimal VercelResponse stub that captures the Set-Cookie header.
function resStub() {
  const headers: Record<string, string> = {};
  return {
    res: { setHeader: (k: string, v: string) => { headers[k.toLowerCase()] = v; } } as never,
    cookieValue: () => (headers['set-cookie'] ?? '').split(';')[0], // "affina_session=<payload.sig>"
  };
}

describe('session cookie round-trip', () => {
  it('reads back the exact email it issued', () => {
    const { res, cookieValue } = resStub();
    mod.issueSession(res, 'Sk@Affina.Space');
    const email = mod.readSession({ headers: { cookie: cookieValue() } } as never);
    expect(email).toBe('Sk@Affina.Space');
  });

  it('returns null with no cookie or a malformed cookie', () => {
    expect(mod.readSession({ headers: {} } as never)).toBeNull();
    expect(mod.readSession({ headers: { cookie: 'affina_session=garbage' } } as never)).toBeNull();
    expect(mod.readSession({ headers: { cookie: 'other=1' } } as never)).toBeNull();
  });

  it('rejects a tampered signature', () => {
    const { res, cookieValue } = resStub();
    mod.issueSession(res, 'a@b.com');
    const cookie = cookieValue();
    const tampered = cookie.slice(0, -1) + (cookie.endsWith('A') ? 'B' : 'A');
    expect(mod.readSession({ headers: { cookie: tampered } } as never)).toBeNull();
  });

  it('rejects a cookie forged with the empty key — the F10 fix', () => {
    // Before the fix, a missing SESSION_SECRET made sign() use '' as the key, so anyone
    // could mint this. With a real secret, an empty-key forgery must NOT validate.
    const exp = Date.now() + 60_000;
    const payload = Buffer.from(`admin@affina.space|${exp}`).toString('base64url');
    const forgedSig = crypto.createHmac('sha256', '').update(payload).digest('base64url');
    const cookie = `affina_session=${payload}.${forgedSig}`;
    expect(mod.readSession({ headers: { cookie } } as never)).toBeNull();
  });

  it('rejects an expired but correctly-signed cookie', () => {
    const exp = Date.now() - 1000; // already expired
    const payload = Buffer.from(`a@b.com|${exp}`).toString('base64url');
    const sig = crypto.createHmac('sha256', SECRET).update(payload).digest('base64url');
    const cookie = `affina_session=${payload}.${sig}`;
    expect(mod.readSession({ headers: { cookie } } as never)).toBeNull();
  });

  it('accepts a valid, correctly-signed, unexpired cookie', () => {
    const exp = Date.now() + 60_000;
    const payload = Buffer.from(`real@user.com|${exp}`).toString('base64url');
    const sig = crypto.createHmac('sha256', SECRET).update(payload).digest('base64url');
    const cookie = `affina_session=${payload}.${sig}`;
    expect(mod.readSession({ headers: { cookie } } as never)).toBe('real@user.com');
  });
});
