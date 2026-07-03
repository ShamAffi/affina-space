import { useState } from 'react';

// SPEC_PAYWALL §4 — full-page S1 mentor-booking step (not a modal). Required step
// between payment and M5: both CTAs advance to M5; booking is optional and never
// blocks continuing. Marks S1 state in the existing mentorSessions model.
interface Props {
  email: string;
  onContinue: () => void;   // → Module 5 (both CTAs call this)
}

async function markS1(email: string, patch: { booked?: boolean; seen?: boolean }) {
  try {
    await fetch('/api/user', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, mentorSessions: { S1: patch } }),
    });
  } catch { /* non-blocking */ }
}

export default function StartSession({ email, onContinue }: Props) {
  const [advancing, setAdvancing] = useState(false);

  async function book() {
    setAdvancing(true);
    await markS1(email, { booked: true, seen: true });
    window.location.href = `mailto:sk@affina.space?subject=Book my Start session (S1)`;
    onContinue();
  }
  async function later() {
    setAdvancing(true);
    await markS1(email, { seen: true });   // seen but not booked → Dashboard nudge still applies
    onContinue();
  }

  return (
    <div className="min-h-screen bg-canvas">
      <div className="fixed inset-0 pointer-events-none overflow-hidden" aria-hidden>
        <div className="absolute -top-32 -left-32 w-96 h-96 rounded-pill bg-accent-50 opacity-50 blur-3xl" />
        <div className="absolute -bottom-32 -right-24 w-80 h-80 rounded-pill bg-brand-100 opacity-40 blur-3xl" />
      </div>

      <div className="relative z-10 max-w-lg mx-auto px-5 py-12 sm:py-20">
        <p className="text-xs font-bold text-accent-600 uppercase tracking-widest mb-3">You're in 🎉</p>
        <h1 className="font-display text-3xl sm:text-4xl font-medium tracking-tight text-ink leading-tight mb-5">
          First — let's get you a real mentor.
        </h1>

        <div className="bg-surface border border-hairline rounded-card p-6 shadow-sm mb-6">
          <p className="text-base text-ink leading-relaxed">
            Your Start session is a 1:1 with a founder who's done this. We'll talk through your 12-week goal,
            look at your Snapshot together, and set your rhythm — the fastest way to make sure you're pointed
            at the right thing before Module 5.
          </p>
        </div>

        <button
          onClick={book}
          disabled={advancing}
          className="w-full bg-brand hover:bg-brand-700 active:scale-95 disabled:opacity-60 text-white text-base font-semibold py-4 rounded-pill transition-all duration-150"
        >
          Book my Start session
        </button>
        <button
          onClick={later}
          disabled={advancing}
          className="w-full mt-3 border border-hairline text-ink-soft hover:text-ink hover:bg-inset text-base font-semibold py-3.5 rounded-pill transition-all duration-150"
        >
          I'll book later — continue to Module 5 →
        </button>

        <p className="text-xs text-ink-mute text-center mt-5 leading-relaxed">
          You don't have to wait for the session to keep going — book it, then dive straight into Module 5.
        </p>
      </div>
    </div>
  );
}
