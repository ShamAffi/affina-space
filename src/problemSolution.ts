// m4l5 Problem–Solution check (SPEC_M4L5_THREE_BLOCK). Three blocks are entered
// separately but stored as ONE readable brain entry so the AI review, Documents,
// and the answer recap all work; parsed back into blocks for re-edit + labeled recap.

export const PSC_LABELS = {
  for: 'What my interviews confirm',
  against: 'What they contradict or surprised me',
  conclusion: "What I'm keeping, changing — and why",
} as const;

export type PscBlocks = { for: string; against: string; conclusion: string };

export function composePSC(b: PscBlocks): string {
  return `${PSC_LABELS.for}:\n${b.for.trim()}\n\n${PSC_LABELS.against}:\n${b.against.trim()}\n\n${PSC_LABELS.conclusion}:\n${b.conclusion.trim()}`;
}

export function splitPSC(text: string): PscBlocks {
  if (!text) return { for: '', against: '', conclusion: '' };
  const fIdx = text.indexOf(PSC_LABELS.for + ':');
  const aIdx = text.indexOf(PSC_LABELS.against + ':');
  const cIdx = text.indexOf(PSC_LABELS.conclusion + ':');
  // Not our format (e.g. a legacy free-text answer) → keep it all in the For block.
  if (fIdx < 0 || aIdx < 0 || cIdx < 0) return { for: text.trim(), against: '', conclusion: '' };
  const slice = (start: number, label: string, end: number) =>
    text.slice(start + label.length + 1, end).trim();
  return {
    for: slice(fIdx, PSC_LABELS.for, aIdx),
    against: slice(aIdx, PSC_LABELS.against, cIdx),
    conclusion: slice(cIdx, PSC_LABELS.conclusion, text.length),
  };
}

// Labeled sections for the FeedbackCard recap (§4b).
export function pscRecapBlocks(text: string): { label: string; text: string }[] {
  const b = splitPSC(text);
  return [
    { label: PSC_LABELS.for, text: b.for },
    { label: PSC_LABELS.against, text: b.against },
    { label: PSC_LABELS.conclusion, text: b.conclusion },
  ];
}
