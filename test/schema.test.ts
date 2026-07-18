import { describe, it, expect } from 'vitest';
import { ScoreSchema } from '../api/score.ts';

// Point 3 (tolerant LLM-output schemas): the exact "silent-502" class the codebase keeps
// hitting is strict .min()/.max() throwing on a plausible-but-off-count model response.
// ScoreSchema is representative — every LLM-output schema follows this coerce+catch
// pattern, so proving it here locks the invariant: parse NEVER throws on messy input.
// Schema is the v2 "Founder Readiness Snapshot" shape (SPEC_REPORT_V2): level +
// dimensions[4] + strengths[3] + risks[3] + roadmap[3] + summary + firstFocus.
describe('ScoreSchema tolerance (audit P3 / silent-502 class)', () => {
  it('accepts the full v2 snapshot shape unchanged', () => {
    const r = ScoreSchema.parse({
      score: 72,
      summary: 'Solid start.',
      level: { n: 2, name: 'Focus', why: 'w', unlocksNext: 'u' },
      dimensions: [
        { key: 'problem_customer', score: 70, read: 'r' },
        { key: 'market_timing', score: 60, read: 'r' },
        { key: 'business_model', score: 65, read: 'r' },
        { key: 'stage_momentum', score: 55, read: 'r' },
      ],
      strengths: [
        { dimension: 'problem_customer', text: 's1' },
        { dimension: 'market_timing', text: 's2' },
        { dimension: 'business_model', text: 's3' },
      ],
      risks: [
        { text: 'r1', whyNow: 'w1' },
        { text: 'r2', whyNow: 'w2' },
        { text: 'r3', whyNow: 'w3' },
      ],
      roadmap: [
        { horizon: 'w1_2', title: 't', body: 'b' },
        { horizon: 'w3_6', title: 't', body: 'b' },
        { horizon: 'w7_12', title: 't', body: 'b' },
      ],
      firstFocus: 'f',
    });
    expect(r.score).toBe(72);
    expect(r.level.n).toBe(2);
    expect(r.dimensions).toHaveLength(4);
    expect(r.strengths).toHaveLength(3);
  });

  it('does NOT throw on off-count dimensions/strengths arrays', () => {
    expect(() => ScoreSchema.parse({
      score: 60, summary: 'x',
      dimensions: [{ key: 'problem_customer', score: 50, read: 'r' }], // only 1
      strengths: [{ dimension: 'x', text: 's' }, { dimension: 'y', text: 's' }], // only 2
      risks: [], roadmap: [], firstFocus: 'f',
    })).not.toThrow();

    const many = ScoreSchema.parse({
      score: 60, summary: 'x',
      dimensions: [1, 2, 3, 4, 5].map((n) => ({ key: `k${n}`, score: n, read: `r${n}` })), // 5
      strengths: [], risks: [], roadmap: [], firstFocus: 'f',
    });
    expect(many.dimensions.length).toBe(5); // schema keeps all; the handler slices to 4
  });

  it('coerces a stringy score instead of throwing', () => {
    const r = ScoreSchema.parse({ score: '85', summary: 'x', firstFocus: '' });
    expect(r.score).toBe(85);
  });

  it('survives entirely garbage fields by falling back to safe defaults', () => {
    const r = ScoreSchema.parse({
      score: 'not-a-number',
      summary: 42,
      level: 'not-an-object',
      dimensions: 'not-an-array',
      strengths: null,
      risks: undefined,
      roadmap: 99,
      firstFocus: {},
    });
    // never throws; degrades to defaults
    expect(typeof r.score).toBe('number');
    expect(Array.isArray(r.dimensions)).toBe(true);
    expect(r.dimensions).toEqual([]);
    expect(Array.isArray(r.strengths)).toBe(true);
    expect(r.risks).toEqual([]);
    // the nested level object catches to a valid default rather than throwing
    expect(typeof r.level).toBe('object');
    expect(typeof r.level.n).toBe('number');
  });

  it('does not throw on a missing-fields object', () => {
    expect(() => ScoreSchema.parse({})).not.toThrow();
  });
});
