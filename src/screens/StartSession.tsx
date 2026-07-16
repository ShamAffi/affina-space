import { useState } from 'react';
import MentorRequestForm from '../components/MentorRequestForm';

// SPEC_PAYWALL §4 — full-page S1 mentor step (not a modal). Required step between payment
// and M5: continuing is optional and never blocks. SPEC_MENTOR_REQUEST §1 — the topic form
// replaces the old mailto; sending it records the request + flips S1 to booked server-side.
interface Props {
  onContinue: () => void;   // → Module 5
}

// PATCH via the session cookie (Auth Phase B) — no email in the body.
async function markS1(patch: { seen?: boolean }) {
  try {
    await fetch('/api/user', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mentorSessions: { S1: patch } }),
    });
  } catch { /* non-blocking */ }
}

export default function StartSession({ onContinue }: Props) {
  const [advancing, setAdvancing] = useState(false);
  const [sent, setSent] = useState(false);

  async function later() {
    setAdvancing(true);
    await markS1({ seen: true });   // seen (nudge logic); a sent request already booked S1 server-side
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
          <p className="text-base text-ink leading-relaxed mb-5">
            Your Start session is a 1:1 with a founder who's done this. We'll talk through your 12-week goal,
            look at your Snapshot together, and set your rhythm — the fastest way to make sure you're pointed
            at the right thing before Module 5.
          </p>
          <MentorRequestForm session="S1" onSent={() => setSent(true)} />
        </div>

        <button
          onClick={later}
          disabled={advancing}
          className="w-full border border-hairline text-ink-soft hover:text-ink hover:bg-inset text-base font-semibold py-3.5 rounded-pill transition-all duration-150"
        >
          {sent ? 'Continue to Module 5 →' : "I'll book later — continue to Module 5 →"}
        </button>

        <p className="text-xs text-ink-mute text-center mt-5 leading-relaxed">
          You don't have to wait for the session to keep going — send your request, then dive straight into Module 5.
        </p>
      </div>
    </div>
  );
}
