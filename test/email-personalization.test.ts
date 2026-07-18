import { describe, it, expect } from 'vitest';
import { reflectionEmail, reengagementEmail, welcomeEmail, subscriptionEmail, weeklyTasksEmail } from '../src/server/email';

describe('email personalization', () => {
  it('greeting + subject carry the name', () => {
    const m = reflectionEmail('a@b.com', 'Nadia');
    expect(m.subject).toBe("Nadia, how did your week go? (2 min — and it's for you)");
    expect(m.html).toContain('Hey Nadia 👋');
  });

  it('graceful fallback with no name (no double space, generic subject)', () => {
    const m = reflectionEmail('a@b.com');
    expect(m.subject).toBe("How did your week go? (2 min — and it's for you)");
    expect(m.html).toContain('Hey 👋');
    expect(m.html).not.toContain('Hey  👋');
  });

  it('uses first name only', () => {
    const m = welcomeEmail('a@b.com', 'Nadia Smith');
    expect(m.html).toContain('Hey Nadia 👋');
    expect(m.html).not.toContain('Nadia Smith');
    expect(m.subject).toBe("Nadia, welcome to Affina — let's build this");
  });

  it('inline greeting (re-engagement) personalizes', () => {
    const m = reengagementEmail('a@b.com', 'M3', 'meal box', 'Léa');
    expect(m.subject).toBe('Léa, your idea is still here');
    expect(m.html).toContain('Hey Léa 👋 We haven');
  });

  it('subject-only email personalizes just the subject', () => {
    expect(subscriptionEmail('a@b.com', 'Nadia').subject).toBe("Nadia, you're in — the full program is open");
    expect(subscriptionEmail('a@b.com').subject).toBe("You're in — the full program is open");
  });

  it('escapes an HTML-y name in the greeting', () => {
    const m = weeklyTasksEmail('a@b.com', ['t1'], '<b>x</b>');
    expect(m.html).toContain('Hey &lt;b&gt;x&lt;/b&gt; 👋');
    expect(m.html).not.toContain('<b>x</b>');
  });
});
