import { describe, it, expect } from 'vitest';
import { safeEqual, requireSecret } from '../src/server/env.ts';

describe('safeEqual', () => {
  it('is true only for identical non-empty strings', () => {
    expect(safeEqual('abc', 'abc')).toBe(true);
    expect(safeEqual('a-longer-secret-value', 'a-longer-secret-value')).toBe(true);
    expect(safeEqual('abc', 'abd')).toBe(false);
    expect(safeEqual('abc', 'ab')).toBe(false); // different length must not throw, just false
  });

  it('fails closed for any missing side', () => {
    expect(safeEqual('', 'abc')).toBe(false);
    expect(safeEqual('abc', '')).toBe(false);
    expect(safeEqual(undefined, 'abc')).toBe(false);
    expect(safeEqual('abc', undefined)).toBe(false);
    expect(safeEqual(null, null)).toBe(false);
    expect(safeEqual(undefined, undefined)).toBe(false);
  });
});

describe('requireSecret', () => {
  it('returns the value when present and long enough', () => {
    process.env.__TEST_SECRET = 'x'.repeat(40);
    expect(requireSecret('__TEST_SECRET', 32)).toBe('x'.repeat(40));
    delete process.env.__TEST_SECRET;
  });

  it('throws when the var is missing (fail closed)', () => {
    delete process.env.__TEST_MISSING;
    expect(() => requireSecret('__TEST_MISSING', 16)).toThrow(/missing or shorter/i);
  });

  it('throws when the value is shorter than the minimum', () => {
    process.env.__TEST_SHORT = 'short';
    expect(() => requireSecret('__TEST_SHORT', 32)).toThrow();
    delete process.env.__TEST_SHORT;
  });
});
