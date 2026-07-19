import type { CompareResult } from '../types.js';

interface Props {
  lessonTitle: string;
  prompt: string;
  answer: string;
  result: CompareResult;
  onRefine: () => void;
  onContinue: () => void;
}

const CRITERIA = [
  { key: 'painIntensity' as const, label: 'Pain', desc: 'How intense & frequent' },
  { key: 'reachability' as const, label: 'Reach', desc: 'Can founder find her' },
  { key: 'abilityToPay' as const, label: 'Pay', desc: 'Willingness & means' },
  { key: 'wordOfMouth' as const, label: 'WoM', desc: 'Will she tell others' },
];

function ScoreDots({ value }: { value: number }) {
  return (
    <div className="flex gap-0.5 justify-center">
      {[1, 2, 3, 4, 5].map((i) => (
        <span
          key={i}
          className={`w-2 h-2 rounded-pill ${i <= value ? 'bg-brand-600' : 'bg-inset'}`}
        />
      ))}
    </div>
  );
}

export default function CompareCard({ lessonTitle, prompt, answer, result, onRefine, onContinue }: Props) {
  const winner = result.candidates.reduce((a, b) => (a.total >= b.total ? a : b));

  return (
    <div className="rounded-card border border-hairline shadow-sm bg-surface overflow-hidden mb-8 animate-slide-up">

      {/* Answer recap */}
      <div className="px-5 pt-5 pb-4 border-b border-hairline">
        <p className="text-xs font-bold text-brand-600 uppercase tracking-wider mb-1">{lessonTitle}</p>
        <p className="text-xs text-ink-mute mb-3">{prompt}</p>
        <p className="text-sm text-ink leading-relaxed bg-inset rounded-control px-4 py-3 border border-hairline line-clamp-4">
          {answer}
        </p>
        <div className="flex items-center gap-3 mt-3">
          <button
            onClick={onRefine}
            className="flex items-center gap-1.5 text-xs font-semibold text-ink-soft border border-hairline rounded-control px-3 py-1.5 hover:bg-inset transition"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
            Edit
          </button>
          <span className="flex items-center gap-1.5 text-xs font-semibold text-brand">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="20 6 9 17 4 12" />
            </svg>
            Saved to Startup Brain
          </span>
        </div>
      </div>

      {/* Mentor analysis */}
      <div className="px-5 py-4">

        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-9 h-9 rounded-pill bg-brand flex items-center justify-center flex-shrink-0">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round">
              <path d="M12 3l1.5 4H18l-3.5 2.5 1.3 4.3L12 11.2l-3.8 2.6 1.3-4.3L6 7h4.5z" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-bold text-ink">Mentor analysis</p>
            <p className="text-xs text-ink-mute">pain · reach · pay · word of mouth</p>
          </div>
        </div>

        {/* Scoring table */}
        <div className="rounded-control border border-hairline overflow-hidden mb-4">
          {/* Column headers */}
          <div className="grid grid-cols-[1fr_repeat(5,40px)] bg-inset border-b border-hairline px-3 py-2 gap-1">
            <span className="text-xs font-bold text-ink-mute uppercase tracking-wider">Segment</span>
            {CRITERIA.map((c) => (
              <span key={c.key} className="text-xs font-bold text-ink-mute uppercase tracking-wider text-center leading-tight">
                {c.label}
              </span>
            ))}
            <span className="text-xs font-bold text-ink-mute uppercase tracking-wider text-center">/20</span>
          </div>

          {/* Candidate rows */}
          {result.candidates.map((c) => {
            const isWinner = c.label === winner.label;
            return (
              <div
                key={c.label}
                className={`grid grid-cols-[1fr_repeat(5,40px)] items-center px-3 py-2.5 gap-1 border-b last:border-b-0 border-hairline transition-colors ${
                  isWinner ? 'bg-brand-50' : 'bg-surface'
                }`}
              >
                <div className="flex items-center gap-1.5 min-w-0">
                  {isWinner && (
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="#6D28D9" stroke="none" className="flex-shrink-0">
                      <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z" />
                    </svg>
                  )}
                  <span className={`text-xs font-semibold truncate ${isWinner ? 'text-brand-700' : 'text-ink-soft'}`}>
                    {c.label}
                  </span>
                </div>
                <ScoreDots value={c.painIntensity} />
                <ScoreDots value={c.reachability} />
                <ScoreDots value={c.abilityToPay} />
                <ScoreDots value={c.wordOfMouth} />
                <span className={`text-sm font-bold text-center ${isWinner ? 'text-brand-700' : 'text-ink-soft'}`}>
                  {c.total}
                </span>
              </div>
            );
          })}
        </div>

        {/* Recommendation */}
        <div className="bg-accent-50 border border-accent-100 rounded-control px-4 py-3 mb-3">
          <p className="text-xs font-bold text-accent-800 mb-1 flex items-center gap-1.5">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="20 6 9 17 4 12" />
            </svg>
            Recommendation
          </p>
          <p className="text-sm text-accent-800 leading-relaxed">{result.recommendation}</p>
        </div>

        {/* Runner-up */}
        <p className="text-xs text-ink-mute mb-4 px-1">
          <span className="font-semibold text-ink-soft">Runner-up: </span>{result.runnerUp}
        </p>

        {/* Next step */}
        <div className="bg-brand rounded-control px-4 py-3 mb-5">
          <p className="text-xs font-bold text-brand-200 mb-1">→ Next step</p>
          <p className="text-sm text-white leading-relaxed">{result.nextStep}</p>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onRefine}
            className="flex items-center gap-2 text-sm font-semibold px-5 py-2.5 rounded-pill border-2 border-hairline text-ink-soft hover:border-brand-200 hover:text-brand-700 transition-all duration-150 active:scale-95"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="1 4 1 10 7 10" />
              <path d="M3.51 15a9 9 0 102.13-9.36L1 10" />
            </svg>
            Revise candidates
          </button>
          <button
            onClick={onContinue}
            className="flex-1 flex items-center justify-center gap-2 text-sm font-semibold px-5 py-2.5 rounded-pill bg-ink text-white hover:bg-ink active:scale-95 transition-all duration-150"
          >
            Continue →
          </button>
        </div>
      </div>
    </div>
  );
}
