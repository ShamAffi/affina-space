import { useState, useEffect } from 'react';
import type { OnboardingScore } from '../types';

const CIRCUMFERENCE = 2 * Math.PI * 54;

interface Props {
  projectName: string;
  goal: string;
  result: OnboardingScore;
  onRegister: () => void;
  ctaLabel?: string;   // funnel: "Start the program for free" in onboarding; "Continue…" on /report
}

function ScoreRing({ score }: { score: number }) {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const steps = 40;
    const increment = score / steps;
    let frame = 0;
    const t = setInterval(() => {
      frame++;
      const next = Math.min(score, Math.round(frame * increment));
      setCurrent(next);
      if (next >= score) clearInterval(t);
    }, 35);
    return () => clearTimeout(t);
  }, [score]);

  const offset = CIRCUMFERENCE * (1 - current / 100);

  return (
    <div className="relative w-36 h-36 mx-auto">
      <svg className="w-36 h-36 -rotate-90" viewBox="0 0 140 140">
        <circle cx="70" cy="70" r="54" fill="none" stroke="#EFEBFD" strokeWidth="12" />
        <circle
          cx="70" cy="70" r="54" fill="none"
          stroke="#7150EA"
          strokeWidth="12"
          strokeLinecap="round"
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={offset}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-display text-5xl font-medium tracking-tight text-brand-700 leading-none">{current}</span>
        <span className="text-xs text-ink-mute font-medium mt-1">/ 100</span>
      </div>
    </div>
  );
}

export default function RevealTeaser({ projectName, goal, result, onRegister, ctaLabel = 'Start the program for free →' }: Props) {
  const [visible, setVisible] = useState(false);
  const topPercent = 100 - result.percentileAheadOf;

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 50);
    return () => clearTimeout(t);
  }, []);

  const goalLine = goal
    ? `Your goal: ${goal}`
    : 'Your personalized plan starts today';

  return (
    <div className="min-h-screen bg-canvas flex flex-col">
      <div className="fixed inset-0 pointer-events-none overflow-hidden" aria-hidden>
        <div className="absolute -top-40 -right-40 w-[500px] h-[500px] rounded-pill bg-brand-100 opacity-50 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-[500px] h-[500px] rounded-pill bg-brand-50 opacity-70 blur-3xl" />
      </div>

      <header className="relative z-10 flex items-center px-5 py-4">
        <span className="text-brand-700 font-bold text-lg tracking-tight">
          Affina<span className="text-ink">Space</span>
        </span>
      </header>

      <main
        className="relative z-10 flex-1 flex flex-col items-center px-5 py-6 max-w-lg mx-auto w-full"
        style={{ opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(12px)', transition: 'opacity 0.5s ease, transform 0.5s ease' }}
      >
        {/* Social proof badge */}
        <div className="inline-flex items-center gap-2 bg-brand-50 border border-brand-200 text-brand-700 text-sm font-semibold px-4 py-2 rounded-pill mb-6">
          <span className="w-2 h-2 rounded-pill bg-brand-600" />
          You're ahead of {result.percentileAheadOf}% of first-time founders
        </div>

        {/* Score ring */}
        <ScoreRing score={result.score} />
        <p className="text-sm text-ink-soft font-medium mt-2 mb-6">Idea Score</p>

        {/* Project name badge */}
        {projectName && (
          <div className="flex items-center gap-2 bg-inset border border-hairline rounded-card px-4 py-2.5 mb-5">
            <div className="w-8 h-8 rounded-pill bg-brand-100 flex items-center justify-center flex-shrink-0">
              <span className="text-sm font-bold text-brand">
                {projectName.charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <p className="text-xs text-ink-mute leading-none">Your project</p>
              <p className="text-sm font-semibold text-ink">{projectName}</p>
            </div>
          </div>
        )}

        {/* AI Insights — SWOT-style, colour-coded */}
        <div className="w-full flex flex-col gap-3 mb-4">
          {result.strength && (
            <div className="bg-accent-50 border border-accent-100 rounded-card p-4">
              <div className="flex items-center gap-1.5 mb-1">
                <span className="text-accent-600 text-xs">▲</span>
                <p className="text-xs text-accent-800 font-bold uppercase tracking-wider">Your strength</p>
              </div>
              <p className="text-sm text-ink leading-relaxed">{result.strength}</p>
            </div>
          )}
          {result.threat && (
            <div className="bg-red-50 border border-red-100 rounded-card p-4">
              <div className="flex items-center gap-1.5 mb-1">
                <span className="text-red-500 text-xs">⚠</span>
                <p className="text-xs text-red-600 font-bold uppercase tracking-wider">Your threat</p>
              </div>
              <p className="text-sm text-ink leading-relaxed">{result.threat}</p>
            </div>
          )}
          {result.firstFocus && (
            <div className="bg-brand-50 border border-brand-100 rounded-card p-4">
              <div className="flex items-center gap-1.5 mb-1">
                <span className="text-brand text-xs">◎</span>
                <p className="text-xs text-brand font-bold uppercase tracking-wider">Month 1 focus</p>
              </div>
              <p className="text-sm text-ink leading-relaxed">{result.firstFocus}</p>
            </div>
          )}
        </div>

        {/* Goal echo */}
        <div className="flex items-center gap-2 text-sm text-ink-soft mb-6">
          <span className="text-brand-600">◈</span>
          <span>{goalLine}</span>
        </div>

        {/* Top {n}% highlight */}
        <div className="w-full bg-brand rounded-card p-4 mb-6 text-center">
          <p className="text-white/80 text-xs font-medium mb-0.5">You're in the top</p>
          <p className="text-white text-3xl font-extrabold">{topPercent}%</p>
          <p className="text-white/70 text-xs mt-0.5">of founders who made it this far</p>
        </div>

        {/* What's inside */}
        <div className="w-full mb-6">
          <p className="text-xs text-ink-mute font-semibold uppercase tracking-wider mb-3">
            What unlocks next
          </p>
          <div className="flex flex-col gap-2">
            {[
              'Your 12-week launch roadmap',
              'AI mentor · weekly plan updates',
              'Expert community of founders',
            ].map((item) => (
              <div key={item} className="flex items-center gap-2.5 text-sm text-ink-soft">
                <div className="w-5 h-5 rounded-pill bg-brand-100 flex items-center justify-center flex-shrink-0">
                  <svg className="w-3 h-3 text-brand" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                {item}
              </div>
            ))}
          </div>
        </div>

        <button
          onClick={onRegister}
          className="w-full bg-brand hover:bg-brand-700 active:scale-95 text-white text-base font-semibold py-4 rounded-pill transition-all duration-150"
        >
          {ctaLabel}
        </button>
        <p className="text-xs text-ink-mute mt-3">No credit card · Cancel anytime</p>
      </main>
    </div>
  );
}
