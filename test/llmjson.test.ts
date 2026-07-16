import { describe, it, expect } from 'vitest';
import { extractLlmJson, repairTruncatedJson } from '../src/server/llmjson';

describe('extractLlmJson', () => {
  it('parses a clean object', () => {
    expect(extractLlmJson('{"a":1,"b":"x"}')).toEqual({ a: 1, b: 'x' });
  });

  it('strips prose before/after the object', () => {
    expect(extractLlmJson('Here is your JSON:\n{"ok":true}\nHope that helps!')).toEqual({ ok: true });
  });

  it('returns null when there is no object at all', () => {
    expect(extractLlmJson('no json here')).toBeNull();
    expect(extractLlmJson('')).toBeNull();
  });

  it('salvages a report truncated MID-OBJECT inside the sections array', () => {
    // model hit max_tokens partway through the 2nd section
    const truncated = '{"headlineVerdict":"Strong niche","sections":[{"title":"Market","body":"big"},{"title":"Competit';
    const got = extractLlmJson(truncated) as { headlineVerdict: string; sections: { title: string; body?: string }[] };
    expect(got).not.toBeNull();
    expect(got.headlineVerdict).toBe('Strong niche');
    expect(got.sections).toHaveLength(1);           // the incomplete 2nd section is dropped
    expect(got.sections[0]).toEqual({ title: 'Market', body: 'big' });
  });

  it('salvages when truncated right after a complete element + trailing comma', () => {
    const truncated = '{"sections":[{"t":"a"},{"t":"b"},';
    const got = extractLlmJson(truncated) as { sections: { t: string }[] };
    expect(got.sections).toHaveLength(2);
    expect(got.sections.map((s) => s.t)).toEqual(['a', 'b']);
  });

  it('does NOT treat a brace inside a string as structure', () => {
    const truncated = '{"sections":[{"title":"a } b","body":"c"},{"title":"next once mo';
    const got = extractLlmJson(truncated) as { sections: { title: string; body?: string }[] };
    expect(got.sections).toHaveLength(1);
    expect(got.sections[0].title).toBe('a } b');     // the "}" inside the string is preserved, not used as a cut point
  });

  it('salvages a keyNumbers array when sections got cut before opening', () => {
    const truncated = '{"headlineVerdict":"v","keyNumbers":[{"label":"TAM","value":"$1M"}],"sections":[';
    const got = extractLlmJson(truncated) as { headlineVerdict: string; keyNumbers: unknown[]; sections?: unknown[] };
    expect(got.headlineVerdict).toBe('v');
    expect(got.keyNumbers).toHaveLength(1);
  });

  it('returns null when truncated before any structural close (unrecoverable)', () => {
    expect(extractLlmJson('{"headlineVerdict":"a very long verdict that got cut of')).toBeNull();
  });
});

describe('repairTruncatedJson', () => {
  it('closes an open root after a complete nested object', () => {
    expect(repairTruncatedJson('{"a":{"b":1}')).toBe('{"a":{"b":1}}');
  });
  it('cuts back to the last complete structural token', () => {
    expect(repairTruncatedJson('{"a":[{"x":1},{"x":2')).toBe('{"a":[{"x":1}]}');
  });
  it('returns null when there is no complete structural token (unsafe to guess)', () => {
    // truncated mid-number/value with no closed bracket — cutting here could corrupt a value
    expect(repairTruncatedJson('{"a":[1,2')).toBeNull();
  });
});
