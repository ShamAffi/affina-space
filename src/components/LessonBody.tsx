import { memo, type ReactNode } from 'react';

// Lecture-body mini-markup (CONTENT_M0-M4_LECTURES_V2.md "Formatting legend"):
//   **Para** alone on its line  → subheading (bold, brand accent, larger, spaced)
//   inline **b** / *i*          → <strong> / <em>
//   ==text==                    → <mark>, ONE accent color, max 2 per lecture
//   *Full italic para — Name*   → quote block (left border, no new component)
// Plain paragraphs and lessons without markup render exactly as before.

export type LessonBlock =
  | { kind: 'subheading'; text: string }
  | { kind: 'quote'; text: string }
  | { kind: 'para'; text: string };

export function parseLessonBlocks(body: string): LessonBlock[] {
  return body
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p): LessonBlock => {
      const sub = p.match(/^\*\*(.+)\*\*$/s);
      if (sub && !sub[1].includes('**')) return { kind: 'subheading', text: sub[1].trim() };
      const quote = p.match(/^\*(?!\*)([\s\S]+)\*$/);
      if (quote && /—\s*[^—*]{2,}$/.test(quote[1].trim())) return { kind: 'quote', text: quote[1].trim() };
      return { kind: 'para', text: p };
    });
}

// Inline pass: ==highlight== (budgeted), **bold**, *italic*.
function renderInline(text: string, budget: { highlights: number }): ReactNode[] {
  const parts = text.split(/(\*\*[^*]+\*\*|==[^=]+==|\*[^*\n]+\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i} className="font-semibold text-ink">{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith('==') && part.endsWith('==')) {
      const inner = part.slice(2, -2);
      // Legend: at most 1–2 highlights per lecture — extras render as plain text.
      if (budget.highlights >= 2) return inner;
      budget.highlights += 1;
      return (
        <mark key={i} className="bg-accent-100 text-ink rounded px-1 py-0.5 box-decoration-clone">
          {inner}
        </mark>
      );
    }
    if (part.startsWith('*') && part.endsWith('*') && part.length > 2) {
      return <em key={i}>{part.slice(1, -1)}</em>;
    }
    return part;
  });
}

// memo'd (audit F45): the lecture body is stable per lesson, so this skips the markup
// re-parse on every keystroke in the exercise textarea (which re-renders the parent LMS).
function LessonBody({ body }: { body: string }) {
  const blocks = parseLessonBlocks(body);
  const budget = { highlights: 0 };

  return (
    <div>
      {blocks.map((b, i) => {
        if (b.kind === 'subheading') {
          return (
            <p key={i} className="font-bold text-brand-700 text-lg sm:text-xl leading-snug mt-7 mb-3 first:mt-0">
              {b.text}
            </p>
          );
        }
        if (b.kind === 'quote') {
          return (
            <p key={i} className="border-l-2 border-brand-300 pl-4 italic text-ink text-base sm:text-lg leading-relaxed my-5">
              {renderInline(b.text, budget)}
            </p>
          );
        }
        return (
          <p key={i} className="text-ink text-base sm:text-lg leading-relaxed mb-5 whitespace-pre-wrap">
            {renderInline(b.text, budget)}
          </p>
        );
      })}
    </div>
  );
}

export default memo(LessonBody);
