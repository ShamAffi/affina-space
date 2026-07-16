import { describe, it, expect } from 'vitest';
import { ScoreSchema } from '../api/score.ts';

// Point 3 (tolerant LLM-output schemas): the exact "silent-502" class the codebase keeps
// hitting is strict .min()/.max() throwing on a plausible-but-off-count model response.
// ScoreSchema is representative — every LLM-output schema now follows this coerce+catch
// pattern, so proving it here locks the invariant: parse NEVER throws on messy input.
describe('ScoreSchema tolerance (audit P3 / silent-502 class)', () => {
  it('accepts the happy 3-step shape unchanged', () => {
    const r = ScoreSchema.parse({
      score: 72,
      summary: 'Solid start.',
      steps: [
        { title: 'A', body: 'a' },
        { title: 'B', body: 'b' },
        { title: 'C', body: 'c' },
      ],
      strength: 's', threat: 't', firstFocus: 'f',
    });
    expect(r.score).toBe(72);
    expect(r.steps).toHaveLength(3);
  });

  it('does NOT throw on an off-count steps array (2 or 4 steps)', () => {
    expect(() => ScoreSchema.parse({
      score: 60, summary: 'x',
      steps: [{ title: 'only', body: 'one' }, { title: 'two', body: 'b' }],
      strength: 's', threat: 't', firstFocus: 'f',
    })).not.toThrow();

    const four = ScoreSchema.parse({
      score: 60, summary: 'x',
      steps: [1, 2, 3, 4].map((n) => ({ title: `t${n}`, body: `b${n}` })),
      strength: 's', threat: 't', firstFocus: 'f',
    });
    expect(four.steps.length).toBe(4); // schema keeps all; the handler slices to 3
  });

  it('coerces a stringy score instead of throwing', () => {
    const r = ScoreSchema.parse({
      score: '85', summary: 'x', steps: [], strength: '', threat: '', firstFocus: '',
    });
    expect(r.score).toBe(85);
  });

  it('survives entirely garbage fields by falling back to safe defaults', () => {
    const r = ScoreSchema.parse({
      score: 'not-a-number',
      summary: 42,
      steps: 'not-an-array',
      strength: null,
      threat: undefined,
      firstFocus: {},
    });
    // never throws; degrades to defaults
    expect(typeof r.score).toBe('number');
    expect(Array.isArray(r.steps)).toBe(true);
    expect(r.steps).toEqual([]);
  });

  it('does not throw on a missing-fields object', () => {
    expect(() => ScoreSchema.parse({})).not.toThrow();
  });
});
