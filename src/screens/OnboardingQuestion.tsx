import { useState, useEffect, useRef } from 'react';
import type { Question } from '../types';

const PROGRESS_PCT = [15, 35, 55, 75, 95];
const METER_TARGETS = [30, 50, 70, 88, 100];
const CIRCUMFERENCE = 2 * Math.PI * 38;
const OTHER_OPTION = 'Other';
const AFFIRMATION_MS = 4000;

const AFFIRMATIONS = [
  "Love it. The best consumer companies start exactly here — one clear idea.",
  "Naming a specific customer already puts you ahead of 72% of first-time founders.",
  "Knowing your model this early is rare — it's one of the first things investors check.",
  "Perfect starting point. 9 of 10 founders here just need structure — that's exactly what Affina gives.",
  "Great — a clear goal is your compass. We'll shape every step of your plan around it.",
];

interface Props {
  question: Question;
  questionIndex: number;
  totalQuestions: number;
  initialValue: string;
  onNext: (value: string) => void;
}

function ScoreMeter({ target }: { target: number }) {
  const [current, setCurrent] = useState(Math.max(0, target - 22));

  useEffect(() => {
    const start = Math.max(0, target - 22);
    const steps = 24;
    const increment = (target - start) / steps;
    let frame = 0;
    const t = setInterval(() => {
      frame++;
      const next = Math.min(target, Math.round(start + frame * increment));
      setCurrent(next);
      if (next >= target) clearInterval(t);
    }, 35);
    return () => clearInterval(t);
  }, [target]);

  const offset = CIRCUMFERENCE * (1 - current / 100);

  return (
    <div className="flex flex-col items-center gap-0.5">
      <div className="relative w-14 h-14">
        <svg className="w-14 h-14 -rotate-90" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="38" fill="none" stroke="#EFEBFD" strokeWidth="13" />
          <circle
            cx="50" cy="50" r="38" fill="none"
            stroke="#7150EA"
            strokeWidth="13"
            strokeLinecap="round"
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={offset}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-[11px] font-bold text-brand-700">{current}%</span>
        </div>
      </div>
      <span className="text-[10px] text-ink-mute font-medium uppercase tracking-wider">Profile</span>
    </div>
  );
}

export default function OnboardingQuestion({
  question,
  questionIndex,
  totalQuestions,
  initialValue,
  onNext,
}: Props) {
  const isChoice = question.type === 'choice';
  const presetMatch = isChoice && question.options?.includes(initialValue);
  // If a stored choice value isn't one of the presets, it was a custom "Other" answer.
  const startedOther = isChoice && !!initialValue && !presetMatch;

  const [value, setValue] = useState(startedOther ? OTHER_OPTION : initialValue);
  const [otherText, setOtherText] = useState(startedOther ? initialValue : '');
  const [showAffirmation, setShowAffirmation] = useState(false);
  const [progressWidth, setProgressWidth] = useState(
    questionIndex > 0 ? PROGRESS_PCT[questionIndex - 1] : 0,
  );

  const meterTarget = METER_TARGETS[questionIndex];
  const targetProgress = PROGRESS_PCT[questionIndex];
  const affirmation = AFFIRMATIONS[questionIndex];
  const isMidpoint = questionIndex === 2;
  const isOther = isChoice && value === OTHER_OPTION;

  useEffect(() => {
    const t = setTimeout(() => setProgressWidth(targetProgress), 80);
    return () => clearTimeout(t);
  }, [targetProgress]);

  // Single-fire guard so the tap-through button and the auto-advance timer can't both fire.
  const advancedRef = useRef(false);
  function advanceNow() {
    if (advancedRef.current) return;
    advancedRef.current = true;
    const out = isChoice ? (isOther ? otherText.trim() : value) : value.trim();
    onNext(out);
  }

  useEffect(() => {
    if (!showAffirmation) return;
    const t = setTimeout(advanceNow, AFFIRMATION_MS);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showAffirmation]);

  const canContinue = isChoice
    ? (isOther ? otherText.trim().length > 0 : !!value)
    : value.trim().length > 0;

  return (
    <div className="min-h-screen bg-canvas flex flex-col">
      <div className="fixed inset-0 pointer-events-none overflow-hidden" aria-hidden>
        <div className="absolute -top-32 -right-32 w-96 h-96 rounded-pill bg-brand-100 opacity-40 blur-3xl" />
        <div className="absolute -bottom-32 -left-32 w-80 h-80 rounded-pill bg-brand-50 opacity-60 blur-3xl" />
      </div>

      {/* Header */}
      <header className="relative z-10 flex items-center justify-between px-5 py-4">
        <span className="text-brand-700 font-bold text-lg tracking-tight">
          Affina<span className="text-ink">Space</span>
        </span>
        <div className="flex items-center gap-3">
          <span className="text-sm text-ink-mute">
            {questionIndex + 1} of {totalQuestions}
          </span>
          <ScoreMeter target={meterTarget} />
        </div>
      </header>

      {/* Progress bar */}
      <div className="relative z-10 h-1 bg-inset">
        <div
          className="h-full bg-brand-600 transition-all duration-700 ease-out"
          style={{ width: `${progressWidth}%` }}
        />
      </div>

      {/* Content */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-5 py-8">
        <div className="w-full max-w-lg">
          {showAffirmation ? (
            <div className="flex flex-col items-center text-center py-10 animate-fade-in">
              <div className="w-16 h-16 rounded-pill bg-brand-100 flex items-center justify-center mb-5">
                <svg className="w-8 h-8 text-brand" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>

              {isMidpoint && (
                <div className="inline-flex items-center gap-1.5 bg-amber-50 border border-amber-200 text-amber-700 text-xs font-semibold px-3 py-1.5 rounded-pill mb-4">
                  ✦ Halfway there
                </div>
              )}

              <p className="font-display text-2xl text-ink font-medium tracking-tight max-w-md leading-snug">
                {affirmation}
              </p>

              <button
                onClick={advanceNow}
                className="mt-10 inline-flex items-center gap-1.5 bg-brand hover:bg-brand-700 active:scale-95 text-white text-sm font-semibold px-6 py-2.5 rounded-pill transition-all duration-150"
              >
                Next →
              </button>
              <p className="mt-3 text-[11px] text-ink-mute">or just wait — continues automatically</p>
            </div>
          ) : (
            <>
              <h2 className="text-2xl sm:text-3xl font-bold text-ink mb-6 leading-tight">
                {question.label}
              </h2>

              {isChoice ? (
                <div className="flex flex-col gap-2.5 mb-6">
                  {question.options?.map((option) => (
                    <button
                      key={option}
                      onClick={() => setValue(option)}
                      className={`w-full text-left px-5 py-4 rounded-card border-2 font-medium transition-all duration-150 ${
                        value === option
                          ? 'border-brand-600 bg-brand-50 text-brand-800'
                          : 'border-hairline bg-surface text-ink-soft hover:border-brand-200 hover:bg-brand-50/40'
                      }`}
                    >
                      {option}
                    </button>
                  ))}

                  {isOther && (
                    <input
                      type="text"
                      autoFocus
                      value={otherText}
                      onChange={(e) => setOtherText(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter' && canContinue) setShowAffirmation(true); }}
                      placeholder="Describe your goal…"
                      maxLength={120}
                      className="w-full rounded-card border-2 border-brand-200 focus:border-brand-400 focus:ring-4 focus:ring-brand-100 outline-none px-5 py-3.5 text-base text-ink placeholder-ink-mute transition"
                    />
                  )}
                </div>
              ) : (
                <div className="flex flex-col gap-3 mb-6">
                  <textarea
                    autoFocus
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    placeholder={question.placeholder ?? ''}
                    maxLength={question.maxLength ?? 500}
                    rows={3}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && e.metaKey && canContinue) setShowAffirmation(true);
                    }}
                    className="w-full rounded-card border-2 border-hairline focus:border-brand-400 focus:ring-4 focus:ring-brand-100 outline-none px-5 py-4 text-base text-ink placeholder-ink-mute resize-none transition"
                  />
                  {question.maxLength && (
                    <p className="text-[11px] text-ink-mute text-right pr-1">
                      {value.length} / {question.maxLength}
                    </p>
                  )}
                </div>
              )}

              <button
                onClick={() => setShowAffirmation(true)}
                disabled={!canContinue}
                className="w-full bg-brand hover:bg-brand-700 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed text-white text-base font-semibold py-4 rounded-pill transition-all duration-150"
              >
                Continue →
              </button>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
