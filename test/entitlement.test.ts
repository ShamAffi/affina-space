import { describe, it, expect } from 'vitest';
import { isPaidLesson, moduleIndexOf, requireEntitlement, FIRST_PAID_MODULE } from '../src/server/entitlement.ts';

describe('moduleIndexOf', () => {
  it('parses the module index from a program lesson id', () => {
    expect(moduleIndexOf('m0l1')).toBe(0);
    expect(moduleIndexOf('m4l10')).toBe(4);
    expect(moduleIndexOf('m5l1')).toBe(5);
    expect(moduleIndexOf('m12l6')).toBe(12);
  });
  it('returns null for non-lesson ids', () => {
    expect(moduleIndexOf('task_42')).toBeNull();
    expect(moduleIndexOf('m2l6_inputs')).toBeNull();
    expect(moduleIndexOf('')).toBeNull();
    expect(moduleIndexOf(undefined)).toBeNull();
    expect(moduleIndexOf(null)).toBeNull();
  });
});

describe('isPaidLesson', () => {
  it('gates exactly modules M1..M12 (only M0 is free — founding-cohort funnel)', () => {
    // free — Module 0 only
    for (const id of ['m0l1', 'm0l3', 'm0l4', 'm0l5']) {
      expect(isPaidLesson(id), `${id} should be free`).toBe(false);
    }
    // paid — every M1+ lesson (incl. m4l10, now a subscriber milestone)
    for (const id of ['m1l1', 'm1l4', 'm2l6', 'm3l6', 'm4l5', 'm4l10', 'm5l1', 'm9l4', 'm12l6']) {
      expect(isPaidLesson(id), `${id} should be paid`).toBe(true);
    }
  });
  it('treats non-lesson ids and empties as free (never gates them)', () => {
    expect(isPaidLesson('task_42')).toBe(false);
    expect(isPaidLesson(undefined)).toBe(false);
    expect(isPaidLesson(null)).toBe(false);
    expect(isPaidLesson('')).toBe(false);
  });
  it('the boundary is FIRST_PAID_MODULE (M1 — only M0 free)', () => {
    expect(FIRST_PAID_MODULE).toBe(1);
    expect(isPaidLesson(`m${FIRST_PAID_MODULE - 1}l1`)).toBe(false); // m0l1 free
    expect(isPaidLesson(`m${FIRST_PAID_MODULE}l1`)).toBe(true);      // m1l1 paid
  });
});

// Minimal VercelResponse stub capturing status()/json().
function mockRes() {
  const state: { code?: number; body?: unknown } = {};
  const res = {
    status(c: number) { state.code = c; return res; },
    json(b: unknown) { state.body = b; return res; },
  };
  return { res: res as never, state };
}

describe('requireEntitlement', () => {
  it('allows a free lesson regardless of subscription', () => {
    const { res, state } = mockRes();
    expect(requireEntitlement(res, 'm0l1', false)).toBe(true); // M0 is the only free module now
    expect(state.code).toBeUndefined(); // nothing written
  });

  it('allows a paid lesson for a subscriber', () => {
    const { res, state } = mockRes();
    expect(requireEntitlement(res, 'm5l4', true)).toBe(true);
    expect(state.code).toBeUndefined();
  });

  it('BLOCKS a paid lesson for a non-subscriber with 402', () => {
    const { res, state } = mockRes();
    expect(requireEntitlement(res, 'm5l4', false)).toBe(false);
    expect(state.code).toBe(402);
    expect(state.body).toEqual({ error: 'subscription_required' });
  });

  it('blocks when subscribed is null/undefined on a paid lesson', () => {
    for (const sub of [null, undefined]) {
      const { res, state } = mockRes();
      expect(requireEntitlement(res, 'm7l2', sub)).toBe(false);
      expect(state.code).toBe(402);
    }
  });

  it('does not gate a non-lesson id (self task) even when unsubscribed', () => {
    const { res, state } = mockRes();
    expect(requireEntitlement(res, 'task_99', false)).toBe(true);
    expect(state.code).toBeUndefined();
  });
});
