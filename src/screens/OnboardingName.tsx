import { useState } from 'react';

interface Props {
  initialValue: string;
  onNext: (name: string) => void;
}

// Step 4 (SPEC_ONBOARDING_FUNNEL §1) — YOUR name → users.name. The name half of the old
// Register, split out so it sits after the report and before the project name.
export default function OnboardingName({ initialValue, onNext }: Props) {
  const [name, setName] = useState(initialValue);
  const valid = name.trim().length > 0;

  return (
    <div className="min-h-screen bg-canvas flex flex-col">
      <div className="fixed inset-0 pointer-events-none overflow-hidden" aria-hidden>
        <div className="absolute -top-32 -right-32 w-96 h-96 rounded-pill bg-brand-100 opacity-40 blur-3xl" />
        <div className="absolute -bottom-32 -left-32 w-80 h-80 rounded-pill bg-brand-50 opacity-60 blur-3xl" />
      </div>

      <header className="relative z-10 flex items-center px-5 py-4">
        <span className="text-brand-700 font-bold text-lg tracking-tight">
          Affina<span className="text-ink">Space</span>
        </span>
      </header>

      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-5 py-8">
        <div className="w-full max-w-sm">
          <h1 className="text-2xl font-extrabold text-ink mb-2">First — what's your name?</h1>
          <p className="text-sm text-ink-soft mb-6">So your mentor knows what to call you.</p>
          <input
            type="text"
            autoFocus
            placeholder="Your first name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && valid) onNext(name.trim()); }}
            maxLength={40}
            className="w-full rounded-card border-2 border-hairline focus:border-brand-400 focus:ring-4 focus:ring-brand-100 outline-none px-5 py-4 text-base text-ink placeholder-ink-mute transition mb-3"
          />
          <button
            onClick={() => { if (valid) onNext(name.trim()); }}
            disabled={!valid}
            className="w-full bg-brand hover:bg-brand-700 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed text-white text-base font-semibold py-4 rounded-pill transition-all duration-150"
          >
            Continue →
          </button>
        </div>
      </main>
    </div>
  );
}
