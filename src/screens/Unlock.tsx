import { useEffect, useState } from 'react';

interface Props {
  onDone: () => void;
}

const STEPS = [
  'Saving your score…',
  'Building your 12-week roadmap…',
  'Personalizing Module 1…',
];

export default function Unlock({ onDone }: Props) {
  const [stepIdx, setStepIdx] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setStepIdx(1), 600),
      setTimeout(() => setStepIdx(2), 1200),
      setTimeout(() => onDone(), 1900),
    ];
    return () => timers.forEach(clearTimeout);
  }, [onDone]);

  return (
    <div className="min-h-screen bg-canvas flex flex-col items-center justify-center px-5">
      <div className="fixed inset-0 pointer-events-none overflow-hidden" aria-hidden>
        <div className="absolute inset-0 bg-gradient-to-br from-brand-50 via-white to-white" />
      </div>

      <div className="relative z-10 flex flex-col items-center text-center">
        <div
          className="w-24 h-24 rounded-pill mb-8 animate-orb-pulse"
          style={{ background: 'radial-gradient(circle at 35% 35%, #9070EE, #7150EA 60%, #422A92)' }}
        />

        <h2 className="text-2xl font-extrabold text-ink mb-2">Unlocking your plan</h2>

        <div className="flex flex-col gap-2 mt-4 min-h-[80px]">
          {STEPS.slice(0, stepIdx + 1).map((step, i) => (
            <div
              key={step}
              className="flex items-center gap-2 text-sm transition-all"
              style={{ opacity: i === stepIdx ? 1 : 0.4 }}
            >
              {i < stepIdx ? (
                <svg className="w-4 h-4 text-brand-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <div className="w-4 h-4 rounded-pill border-2 border-brand-400 border-t-transparent animate-spin flex-shrink-0" />
              )}
              <span className={i < stepIdx ? 'text-ink-mute line-through' : 'text-ink-soft font-medium'}>
                {step}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
