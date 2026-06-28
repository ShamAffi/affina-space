import type { AiFeedback } from '../types.js';

interface Props {
  lessonTitle: string;
  prompt: string;
  answer: string;
  feedback: AiFeedback;
  previousScore?: number;
  onRefine: () => void;
  onContinue: () => void;
}

const VERDICT_CONFIG = {
  strong:           { label: 'Strong!',           bg: 'bg-green-50',  text: 'text-green-700',  score: 'text-green-600' },
  ok:               { label: 'Good start',         bg: 'bg-blue-50',   text: 'text-blue-700',   score: 'text-blue-600'  },
  can_be_stronger:  { label: 'Can be stronger',    bg: 'bg-amber-50',  text: 'text-amber-700',  score: 'text-amber-500' },
};

export default function FeedbackCard({ lessonTitle, prompt, answer, feedback, previousScore, onRefine, onContinue }: Props) {
  const cfg = VERDICT_CONFIG[feedback.verdict];
  const improved = previousScore !== undefined && feedback.score > previousScore;

  return (
    <div className="rounded-2xl border border-gray-100 shadow-sm bg-white overflow-hidden mb-8 animate-slide-up">

      {/* Answer recap */}
      <div className="px-5 pt-5 pb-4 border-b border-gray-100">
        <p className="text-xs font-bold text-purple-500 uppercase tracking-wider mb-1">{lessonTitle}</p>
        <p className="text-xs text-gray-400 mb-3">{prompt}</p>
        <p className="text-sm text-gray-800 leading-relaxed bg-gray-50 rounded-xl px-4 py-3 border border-gray-100">
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

      {/* Feedback */}
      <div className="px-5 py-4">

        {/* Header: avatar + score */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-purple-600 flex items-center justify-center flex-shrink-0">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round">
                <path d="M12 3l1.5 4H18l-3.5 2.5 1.3 4.3L12 11.2l-3.8 2.6 1.3-4.3L6 7h4.5z" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-bold text-gray-900">Mentor feedback</p>
              <p className="text-xs text-gray-400">problem · segment · result</p>
            </div>
          </div>

          {/* Score + optional improvement */}
          <div className="flex items-center gap-2">
            {improved && previousScore !== undefined && (
              <span className="text-xs text-gray-400 line-through">{previousScore}</span>
            )}
            <span className={`text-lg font-bold ${cfg.score}`}>
              {feedback.score}
              <span className="text-sm font-normal text-gray-400">/100</span>
            </span>
            <span className={`text-xs font-semibold rounded-full px-2.5 py-1 ${cfg.bg} ${cfg.text}`}>
              {improved ? '↑ ' : ''}{cfg.label}
            </span>
          </div>
        </div>

        {/* What's good */}
        <div className="mb-3">
          <p className="flex items-center gap-1.5 text-xs font-bold text-green-600 mb-1.5">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <circle cx="12" cy="12" r="10" />
              <polyline points="9 12 11 14 15 10" />
            </svg>
            What's working well
          </p>
          <ul className="pl-5 space-y-1">
            {feedback.good.map((item, i) => (
              <li key={i} className="text-sm text-gray-700 leading-relaxed">{item}</li>
            ))}
          </ul>
        </div>

        {/* What's missing */}
        <div className="mb-3">
          <p className="flex items-center gap-1.5 text-xs font-bold text-amber-600 mb-1.5">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            What's missing
          </p>
          <ul className="pl-5 space-y-1">
            {feedback.missing.map((item, i) => (
              <li key={i} className="flex gap-2 text-sm text-gray-700 leading-relaxed">
                <span className="text-amber-400 flex-shrink-0">•</span>{item}
              </li>
            ))}
          </ul>
        </div>

        {/* Next step */}
        <div className="bg-purple-600 rounded-xl px-4 py-3 mb-5">
          <p className="text-xs font-bold text-purple-200 mb-1">→ Next step</p>
          <p className="text-sm text-white leading-relaxed">{feedback.nextStep}</p>
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
            Refine my answer
          </button>
          <button
            onClick={onContinue}
            className="flex-1 flex items-center justify-center gap-2 text-sm font-semibold px-5 py-2.5 rounded-xl bg-gray-900 text-white hover:bg-gray-800 active:scale-95 transition-all duration-150"
          >
            Leave as is, continue →
          </button>
        </div>
      </div>
    </div>
  );
}
