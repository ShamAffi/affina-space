import { describe, it, expect } from 'vitest';
import { clamp, clampInt, LIMITS } from '../src/server/limits.ts';

describe('clamp (audit F11/F21/F24 length caps)', () => {
  it('truncates a string to the cap', () => {
    const long = 'x'.repeat(10_000);
    expect(clamp(long, 600)).toHaveLength(600);
    expect(clamp(long, LIMITS.answer)).toHaveLength(LIMITS.answer);
  });

  it('leaves a short string untouched', () => {
    expect(clamp('hello', 600)).toBe('hello');
  });

  it('coerces non-strings to empty (never returns non-string)', () => {
    expect(clamp(undefined, 600)).toBe('');
    expect(clamp(null, 600)).toBe('');
    expect(clamp(42, 600)).toBe('');
    expect(clamp({}, 600)).toBe('');
    expect(clamp(['a'], 600)).toBe('');
  });

  it('exposes sane, ordered caps', () => {
    expect(LIMITS.preAuthField).toBeLessThanOrEqual(LIMITS.shortField);
    expect(LIMITS.shortField).toBeLessThan(LIMITS.answer);
    expect(LIMITS.answer).toBeLessThan(LIMITS.longText);
    // pre-auth (no session) is the tightest bound
    expect(LIMITS.preAuthField).toBeLessThanOrEqual(600);
  });
});

describe('clampInt (audit F14 — never trust a client-supplied score)', () => {
  it('keeps an in-range integer', () => {
    expect(clampInt(72, 0, 100)).toBe(72);
    expect(clampInt('85', 0, 100)).toBe(85); // coerces numeric strings
  });
  it('clamps out-of-range values to the bounds', () => {
    expect(clampInt(100000, 0, 100)).toBe(100); // the "attacker sends 100" case → capped
    expect(clampInt(-5, 0, 100)).toBe(0);
  });
  it('rounds and falls back to min for junk', () => {
    expect(clampInt(72.6, 0, 100)).toBe(73);
    expect(clampInt('not-a-number', 0, 100)).toBe(0);
    expect(clampInt(undefined, 0, 100)).toBe(0);
    expect(clampInt(NaN, 0, 100)).toBe(0);
    expect(clampInt(Infinity, 0, 100)).toBe(0);
  });
});
