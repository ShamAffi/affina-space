import { useEffect, useRef, useState } from 'react';
import type { OnboardingScore } from '../types';

const PHRASES = [
  'Building your personalized plan',
  'Matching your mentor',
  'Scoring your idea',
  'Preparing your reveal',
];

const FALLBACK: OnboardingScore = {
  score: 62,
  percentileAheadOf: 60,
  strength: "You've identified a real problem with a clear target audience in mind.",
  threat: "A larger, funded player could move on this space before you build a loyal early base.",
  firstFocus: "Have 5 honest conversations with potential customers before building anything.",
  summary: "You're onto a real opportunity — there's a genuine problem here worth solving. Right now your idea is still broad, which makes it harder to validate and sell. With sharper focus on one customer and one offer, this can become a launch-ready business.",
  steps: [
    { title: 'Narrow your idea to one problem', body: 'Focus on one specific pain felt often and badly enough to pay for a fix. The narrower you go, the faster you can validate.' },
    { title: 'Name your first customer', body: "Don't say \"everyone\" — pick one type of person who suffers this problem most. Describe her life in one sentence." },
    { title: 'Define the result you deliver', body: 'What measurable change does your customer get? Time saved, money earned, stress removed — make it concrete.' },
  ],
};

interface Props {
  userData: { idea: string; customer: string; businessModel: string; stage: string; goal: string };
  onDone: (result: OnboardingScore) => void;
}

export default function Analyzing({ userData, onDone }: Props) {
  const [phraseIdx, setPhraseIdx] = useState(0);
  const [fading, setFading] = useState(true);
  const calledRef = useRef(false);

  useEffect(() => {
    // Phrase cycling
    const interval = setInterval(() => {
      setFading(false);
      setTimeout(() => {
        setPhraseIdx((i) => (i + 1) % PHRASES.length);
        setFading(true);
      }, 200);
    }, 900);

    // Fire AI score + minimum display time in parallel
    const minDelay = new Promise<void>((res) => setTimeout(res, 3000));
    const scoreCall = fetch('/api/score', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        idea: userData.idea,
        customer: userData.customer,
        businessModel: userData.businessModel,
        stage: userData.stage,
        goal: userData.goal,
      }),
    })
      .then((r) => (r.ok ? (r.json() as Promise<OnboardingScore>) : FALLBACK))
      .catch(() => FALLBACK);

    Promise.all([minDelay, scoreCall]).then(([, result]) => {
      clearInterval(interval);
      if (!calledRef.current) {
        calledRef.current = true;
        onDone(result ?? FALLBACK);
      }
    });

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-canvas flex flex-col items-center justify-center">
      <div
        className="w-28 h-28 rounded-pill animate-orb-pulse"
        style={{ background: 'radial-gradient(circle at 35% 35%, #9A5CE6, #6D28D9 60%, #4C1D95)' }}
      />
      <p
        className="mt-10 text-ink-soft text-lg font-medium transition-opacity duration-200"
        style={{ opacity: fading ? 1 : 0 }}
      >
        {PHRASES[phraseIdx]}
        <span className="inline-flex gap-0.5 ml-1">
          <span className="animate-bounce" style={{ animationDelay: '0ms' }}>.</span>
          <span className="animate-bounce" style={{ animationDelay: '150ms' }}>.</span>
          <span className="animate-bounce" style={{ animationDelay: '300ms' }}>.</span>
        </span>
      </p>
      <div className="flex gap-2 mt-8">
        {PHRASES.map((_, i) => (
          <div
            key={i}
            className={`w-2 h-2 rounded-pill transition-all duration-300 ${
              i === phraseIdx ? 'bg-brand scale-125' : 'bg-brand-200'
            }`}
          />
        ))}
      </div>
    </div>
  );
}
