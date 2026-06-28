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
          className={`w-2 h-2 rounded-full ${i <= value ? 'bg-purple-500' : 'bg-gray-200'}`}
        />
      ))}
    </div>
  );
}

export default function CompareCard({ lessonTitle, prompt, answer, result, onRefine, onContinue }: Props) {
  const winner = result.candidates.reduce((a, b) => (a.total >= b.total ? a : b));

  return (
    <div className="rounded-2xl border border-gray-100 shadow-sm bg-white overflow-hidden mb-8 animate-slide-up">

      {/* Answer recap */}
      <div className="px-5 pt-5 pb-4 border-b border-gray-100">
        <p className="text-xs font-bold text-purple-500 uppercase tracking-wider mb-1">{lessonTitle}</p>
        <p className="text-xs text-gray-400 mb-3">{prompt}</p>
        <p className="text-sm text-gray-800 leading-relaxed bg-gray-50 rounded-xl px-4 py-3 border border-gray-100 line-clamp-4">
          {answer}
        </p>
        <div className="flex items-center gap-3 mt-3">
          <button
            onClick={onRefine}
            className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 border border-gray-200 rounded-lg px-3 py-1.5 hover:bg-gray-50 transition"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
            Edit
          </button>
          <span className="flex items-center gap-1.5 text-xs font-semibold text-purple-600">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="20 6 9 17 4 12" />
            </svg>
            Saved to Company Brain
          </span>
        </div>
      </div>

      {/* Mentor analysis */}
      <div className="px-5 py-4">

        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-9 h-9 rounded-full bg-purple-600 flex items-center justify-center flex-shrink-0">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round">
              <path d="M12 3l1.5 4H18l-3.5 2.5 1.3 4.3L12 11.2l-3.8 2.6 1.3-4.3L6 7h4.5z" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-bold text-gray-900">Mentor analysis</p>
            <p className="text-xs text-gray-400">pain · reach · pay · word of mouth</p>
          </div>
        </div>

        {/* Scoring table */}
        <div className="rounded-xl border border-gray-100 overflow-hidden mb-4">
          {/* Column headers */}
          <div className="grid grid-cols-[1fr_repeat(5,40px)] bg-gray-50 border-b border-gray-100 px-3 py-2 gap-1">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Segment</span>
            {CRITERIA.map((c) => (
              <span key={c.key} className="text-xs font-bold text-gray-400 uppercase tracking-wider text-center leading-tight">
                {c.label}
              </span>
            ))}
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider text-center">/20</span>
          </div>

          {/* Candidate rows */}
          {result.candidates.map((c) => {
            const isWinner = c.label === winner.label;
            return (
              <div
                key={c.label}
                className={`grid grid-cols-[1fr_repeat(5,40px)] items-center px-3 py-2.5 gap-1 border-b last:border-b-0 border-gray-50 transition-colors ${
                  isWinner ? 'bg-purple-50' : 'bg-white'
                }`}
              >
                <div className="flex items-center gap-1.5 min-w-0">
                  {isWinner && (
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="#9333ea" stroke="none" className="flex-shrink-0">
                      <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z" />
                    </svg>
                  )}
                  <span className={`text-xs font-semibold truncate ${isWinner ? 'text-purple-700' : 'text-gray-700'}`}>
                    {c.label}
                  </span>
                </div>
                <ScoreDots value={c.painIntensity} />
                <ScoreDots value={c.reachability} />
                <ScoreDots value={c.abilityToPay} />
                <ScoreDots value={c.wordOfMouth} />
                <span className={`text-sm font-bold text-center ${isWinner ? 'text-purple-700' : 'text-gray-500'}`}>
                  {c.total}
                </span>
              </div>
            );
          })}
        </div>

        {/* Recommendation */}
        <div className="bg-green-50 border border-green-100 rounded-xl px-4 py-3 mb-3">
          <p className="text-xs font-bold text-green-700 mb-1 flex items-center gap-1.5">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="20 6 9 17 4 12" />
            </svg>
            Recommendation
          </p>
          <p className="text-sm text-green-800 leading-relaxed">{result.recommendation}</p>
        </div>

        {/* Runner-up */}
        <p className="text-xs text-gray-400 mb-4 px-1">
          <span className="font-semibold text-gray-500">Runner-up: </span>{result.runnerUp}
        </p>

        {/* Next step */}
        <div className="bg-purple-600 rounded-xl px-4 py-3 mb-5">
          <p className="text-xs font-bold text-purple-200 mb-1">→ Next step</p>
          <p className="text-sm text-white leading-relaxed">{result.nextStep}</p>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onRefine}
            className="flex items-center gap-2 text-sm font-semibold px-5 py-2.5 rounded-xl border-2 border-gray-200 text-gray-700 hover:border-purple-300 hover:text-purple-700 transition-all duration-150 active:scale-95"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="1 4 1 10 7 10" />
              <path d="M3.51 15a9 9 0 102.13-9.36L1 10" />
            </svg>
            Revise candidates
          </button>
          <button
            onClick={onContinue}
            className="flex-1 flex items-center justify-center gap-2 text-sm font-semibold px-5 py-2.5 rounded-xl bg-gray-900 text-white hover:bg-gray-800 active:scale-95 transition-all duration-150"
          >
            Continue →
          </button>
        </div>
      </div>
    </div>
  );
}
