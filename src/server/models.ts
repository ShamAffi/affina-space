// One place to change models app-wide. Tier by task, not by file. (SPEC_MODEL_STRATEGY §1.)
// Lives in src/ (not api/lib) — every .ts under /api counts against the Vercel Hobby
// 12-function cap. The api handlers import this.
export const MODELS = {
  // Default for all bounded Q&A: scoring, feedback, drafts, synthesis, AND name
  // generation (quality matters — Haiku names were too generic).
  standard: 'claude-sonnet-5',
  // Trivial/deterministic tasks. Currently UNUSED (name gen moved to standard).
  // Kept defined for future tiny classifications.
  cheap: 'claude-haiku-4-5',
  // Reserve for flagship generation where depth clearly matters (see §3 map).
  // Use sparingly — higher input cost than standard.
  deep: 'claude-opus-4-8',
} as const;
