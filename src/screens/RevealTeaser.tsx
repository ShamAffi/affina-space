import { useState, useEffect } from 'react';
import type { OnboardingScore } from '../types';

const CIRCUMFERENCE = 2 * Math.PI * 54;

interface Props {
  projectName: string;
  goal: string;
  result: OnboardingScore;
  onRegister: () => void;
  ctaLabel?: string;   // funnel: default in onboarding; "Continue…" on /report
}

const DIMENSION_LABELS: Record<string, string> = {
  problem_customer: 'Problem & Customer',
  market_timing: 'Market & Timing',
  business_model: 'Business Model',
  stage_momentum: 'Stage & Momentum',
};

const LADDER = ['Spark', 'Focus', 'Validated', 'Built', 'Selling'];

const HORIZON_LABELS: Record<string, string> = {
  w1_2: 'Weeks 1–2',
  w3_6: 'Weeks 3–6',
  w7_12: 'Weeks 7–12',
};

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
    return () => clearInterval(t);
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

// SPEC_REPORT_V2 §3 — readiness ladder: 5 steps, hers lit violet + "unlocks next".
function LevelLadder({ level }: { level: NonNullable<OnboardingScore['level']> }) {
  return (
    <div className="w-full mb-6">
      <p className="text-xs text-ink-mute font-semibold uppercase tracking-wider mb-2.5">Your readiness level</p>
      <div className="flex gap-1.5 mb-3">
        {LADDER.map((name, i) => {
          const reached = i + 1 <= level.n;
          const current = i + 1 === level.n;
          return (
            <div key={name} className="flex-1 flex flex-col items-center gap-1.5">
              <div className={`w-full h-1.5 rounded-pill ${reached ? 'bg-brand' : 'bg-brand-100'}`} />
              <span className={`text-[10px] leading-none font-semibold text-center ${current ? 'text-brand-700' : reached ? 'text-ink-soft' : 'text-ink-mute'}`}>{name}</span>
            </div>
          );
        })}
      </div>
      <div className="bg-brand-50 border border-brand-100 rounded-card p-4">
        <p className="text-sm text-ink leading-relaxed">
          <span className="font-bold text-brand-700">Level {level.n} · {level.name}</span>
          {level.why ? ` — ${level.why}` : ''}
        </p>
        {level.unlocksNext && (
          <p className="text-xs text-brand-700 mt-2 flex gap-1.5">
            <span aria-hidden>→</span>
            <span><span className="font-semibold">Unlocks next:</span> {level.unlocksNext}</span>
          </p>
        )}
      </div>
    </div>
  );
}

// SPEC_REPORT_V2 §3 — 4 dimension bars (simple divs, no chart lib).
function DimensionBars({ dimensions }: { dimensions: NonNullable<OnboardingScore['dimensions']> }) {
  return (
    <div className="w-full mb-6">
      <p className="text-xs text-ink-mute font-semibold uppercase tracking-wider mb-3">How your thinking scores</p>
      <div className="flex flex-col gap-3.5">
        {dimensions.map((d, i) => (
          <div key={d.key || i}>
            <div className="flex items-baseline justify-between mb-1.5">
              <span className="text-sm font-semibold text-ink">{DIMENSION_LABELS[d.key] ?? d.key}</span>
              <span className="text-sm font-bold text-brand-700 tabular-nums">{d.score}</span>
            </div>
            <div className="w-full h-2 bg-brand-100 rounded-pill overflow-hidden">
              <div className="h-full bg-brand rounded-pill transition-[width] duration-700 ease-out" style={{ width: `${Math.max(2, Math.min(100, d.score))}%` }} />
            </div>
            {d.read && <p className="text-xs text-ink-soft leading-relaxed mt-1.5">{d.read}</p>}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function RevealTeaser({ projectName, goal, result, onRegister, ctaLabel = 'Start Your AI Incubation Program for FREE' }: Props) {
  const [visible, setVisible] = useState(false);
  const topPercent = 100 - result.percentileAheadOf;

  // SPEC_REPORT_V2 §3 back-compat guard: v1 stored reports have no level/dimensions →
  // fall back to the v1 SWOT layout instead of crashing.
  const isV2 = !!result.level && Array.isArray(result.dimensions) && result.dimensions.length > 0;
  const strengths = result.strengths ?? [];
  const risks = result.risks ?? [];
  const roadmap = result.roadmap ?? [];

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 50);
    return () => clearTimeout(t);
  }, []);

  const goalLine = goal ? `Your goal: ${goal}` : 'Your personalized plan starts today';

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
        <p className="text-sm text-ink-soft font-medium mt-2 mb-5">Readiness score</p>

        {/* Project name badge */}
        {projectName && (
          <div className="flex items-center gap-2 bg-inset border border-hairline rounded-card px-4 py-2.5 mb-5">
            <div className="w-8 h-8 rounded-pill bg-brand-100 flex items-center justify-center flex-shrink-0">
              <span className="text-sm font-bold text-brand">{projectName.charAt(0).toUpperCase()}</span>
            </div>
            <div>
              <p className="text-xs text-ink-mute leading-none">Your project</p>
              <p className="text-sm font-semibold text-ink">{projectName}</p>
            </div>
          </div>
        )}

        {/* Honest verdict */}
        {result.summary && (
          <p className="w-full text-sm text-ink leading-relaxed text-center mb-6">{result.summary}</p>
        )}

        {isV2 ? (
          <>
            <LevelLadder level={result.level!} />
            <DimensionBars dimensions={result.dimensions!} />

            {/* Strengths */}
            {strengths.length > 0 && (
              <div className="w-full bg-accent-50 border border-accent-100 rounded-card p-4 mb-3">
                <div className="flex items-center gap-1.5 mb-2.5">
                  <span className="text-accent-600 text-xs">▲</span>
                  <p className="text-xs text-accent-800 font-bold uppercase tracking-wider">What's working for you</p>
                </div>
                <ul className="flex flex-col gap-2.5">
                  {strengths.map((s, i) => (
                    <li key={i} className="flex gap-2 text-sm text-ink leading-relaxed">
                      <span className="text-accent-600 flex-shrink-0" aria-hidden>✓</span>
                      <span>{s.text}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Risks — each with why-now */}
            {risks.length > 0 && (
              <div className="w-full bg-amber-50 border border-amber-200 rounded-card p-4 mb-6">
                <div className="flex items-center gap-1.5 mb-2.5">
                  <span className="text-amber-600 text-xs">⚠</span>
                  <p className="text-xs text-amber-700 font-bold uppercase tracking-wider">Watch-outs at your stage</p>
                </div>
                <ul className="flex flex-col gap-3">
                  {risks.map((r, i) => (
                    <li key={i} className="text-sm text-ink leading-relaxed">
                      {r.text}
                      {r.whyNow && <span className="block text-xs text-amber-700 mt-1"><span className="font-semibold">Why now:</span> {r.whyNow}</span>}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* 90-day roadmap — 3 paragraphs */}
            {roadmap.length > 0 && (
              <div className="w-full mb-6">
                <p className="text-xs text-ink-mute font-semibold uppercase tracking-wider mb-3">Your next 90 days</p>
                <div className="flex flex-col gap-3">
                  {roadmap.map((r, i) => (
                    <div key={i} className="bg-surface border border-hairline rounded-card p-4">
                      <p className="text-[11px] font-bold text-brand-700 uppercase tracking-wider mb-1.5">
                        {HORIZON_LABELS[r.horizon] ?? `Phase ${i + 1}`}{r.title ? ` · ${r.title}` : ''}
                      </p>
                      <p className="text-sm text-ink-soft leading-relaxed">{r.body}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* This week's first move */}
            {result.firstFocus && (
              <div className="w-full bg-brand-50 border border-brand-100 rounded-card p-4 mb-6">
                <div className="flex items-center gap-1.5 mb-1">
                  <span className="text-brand text-xs">◎</span>
                  <p className="text-xs text-brand font-bold uppercase tracking-wider">This week's first move</p>
                </div>
                <p className="text-sm text-ink leading-relaxed">{result.firstFocus}</p>
              </div>
            )}
          </>
        ) : (
          /* ── v1 back-compat layout (SWOT cards) ── */
          <div className="w-full flex flex-col gap-3 mb-6">
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
                  <p className="text-xs text-brand font-bold uppercase tracking-wider">This week's first move</p>
                </div>
                <p className="text-sm text-ink leading-relaxed">{result.firstFocus}</p>
              </div>
            )}
          </div>
        )}

        {/* Goal echo */}
        <div className="flex items-center gap-2 text-sm text-ink-soft mb-6">
          <span className="text-brand-600">◈</span>
          <span>{goalLine}</span>
        </div>

        {/* Top {n}% highlight — gray card + violet border/number (not a solid-violet block that reads as a button) */}
        <div className="w-full bg-inset border-2 border-brand rounded-card p-4 mb-6 text-center">
          <p className="text-ink-soft text-xs font-medium mb-0.5">You're in the top</p>
          <p className="text-brand-700 text-3xl font-extrabold">{topPercent}%</p>
          <p className="text-ink-mute text-xs mt-0.5">of founders who made it this far</p>
        </div>

        {/* Let's build a real business */}
        <div className="w-full mb-6">
          <p className="font-display text-2xl font-medium tracking-tight text-ink mb-1">Let's build a real business.</p>
          <p className="text-sm text-ink-soft mb-4">Your snapshot is step one — here's what's waiting inside:</p>
          <div className="flex flex-col gap-3">
            {[
              'A step-by-step, personalized incubation program',
              'Live mentorship & advisory sessions with market and industry experts',
              'Your Startup Brain — every insight and fact in one place to decide with',
              'Extra programs + a global community of founders behind you',
            ].map((item) => (
              <div key={item} className="flex items-start gap-2.5 text-sm text-ink">
                <div className="mt-0.5 w-5 h-5 rounded-pill bg-brand-100 flex items-center justify-center flex-shrink-0">
                  <svg className="w-3 h-3 text-brand" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>

        <p className="text-xs text-ink-soft text-center mb-3 leading-relaxed">
          From here, every step builds <span className="font-semibold text-ink">Your Startup Brain</span> — every insight and fact in one place, working for your decisions.
        </p>
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
