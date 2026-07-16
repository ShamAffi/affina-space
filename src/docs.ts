import { track } from './lib/analytics';

// Docs library registry (SPEC_DOCS_LIBRARY §2) — single source of truth for the guide
// popup, the Programs "Resources" section, emails, and the future admin panel. Docs are
// downloadable branded files served statically at /downloads/<slug>.pdf (public by design:
// they're marketing artifacts). Replacing a doc = overwrite the same path + deploy.
export type Doc = {
  slug: string;          // file at /downloads/<slug>.pdf
  title: string;
  description: string;   // one-liner for cards
  kind: 'file';          // reserved: 'page' (in-app rendered docs, later)
  gate?: 'phone';        // DISPLAY gate (amendment 2026-07-16): show the card only once the user
                         // has a phone on file (any source). File URL stays public — not security.
};

export const DOCS: Doc[] = [
  {
    slug: 'ai-first-founders-guide',
    title: "The AI-First Founder's Guide",
    description: 'How to build your business with AI doing the heavy lifting.',
    kind: 'file',
    gate: 'phone',       // lead magnet — hidden in Resources until she gives a number
  },
];

export function docUrl(slug: string): string {
  return `/downloads/${slug}.pdf`;
}

// Open a doc in a new tab + record the click (SPEC_DOCS_LIBRARY §4 → doc_downloaded {slug}).
// Used by the Resources section and the guide popup. No auth, no ?next — files are public.
export function openDoc(slug: string): void {
  track('doc_downloaded', { slug });
  try { window.open(docUrl(slug), '_blank', 'noopener,noreferrer'); } catch { /* popup blocked — ignore */ }
}
