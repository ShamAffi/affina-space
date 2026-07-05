import { useState } from 'react';
import ConsentLine from './ConsentLine';

interface Props {
  initialEmail: string;
  // Creates the pending user + emailCapturedAt server-side. Resolves with the ownership
  // verdict: { blocked } when the email is a VERIFIED account (offer sign-in instead).
  onSubmit: (email: string) => Promise<{ blocked?: boolean; reason?: string }>;
  onSignIn: () => void;   // → /login (magic-link); typing an email no longer authenticates
}

// Step 2 (SPEC_ONBOARDING_FUNNEL §1) — email capture BEFORE the report, framed as value:
// "we'll email you your report". On submit we create the pending user (starts the recovery
// clock) and move on to generate the report.
export default function EmailCapture({ initialEmail, onSubmit, onSignIn }: Props) {
  const [email, setEmail] = useState(initialEmail);
  const [submitting, setSubmitting] = useState(false);
  const [blocked, setBlocked] = useState(false);
  const valid = email.trim().includes('@') && email.trim().includes('.');

  async function submit() {
    if (!valid || submitting) return;
    setSubmitting(true);
    setBlocked(false);
    const r = await onSubmit(email.trim().toLowerCase());
    setSubmitting(false);
    if (r.blocked) setBlocked(true);
    // on success the parent advances to the report — nothing more to do here
  }

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
          <div className="inline-flex items-center gap-2 bg-brand-50 border border-brand-100 text-brand-700 text-xs font-semibold px-3 py-1.5 rounded-pill mb-5">
            <span className="w-1.5 h-1.5 rounded-pill bg-brand-600" />
            Your report is almost ready
          </div>
          <h1 className="text-2xl font-extrabold text-ink mb-2">Where should we send your report?</h1>
          <p className="text-sm text-ink-soft mb-6">We'll build your personalized report and email you a copy — so it's always saved and you can pick up any time.</p>

          <input
            type="email"
            autoFocus
            placeholder="you@email.com"
            value={email}
            onChange={(e) => { setEmail(e.target.value); setBlocked(false); }}
            onKeyDown={(e) => { if (e.key === 'Enter') submit(); }}
            className="w-full rounded-card border-2 border-hairline focus:border-brand-400 focus:ring-4 focus:ring-brand-100 outline-none px-5 py-4 text-base text-ink placeholder-ink-mute transition mb-3"
          />

          {blocked ? (
            <div className="bg-amber-50 border border-amber-200 rounded-card p-4 mb-3">
              <p className="text-sm font-semibold text-amber-800 mb-1">Looks like you already have an account</p>
              <p className="text-xs text-amber-600 mb-3">Sign in to pick up where you left off, or use a different email.</p>
              <div className="flex gap-2">
                <button
                  onClick={onSignIn}
                  className="flex-1 bg-brand hover:bg-brand-700 text-white text-sm font-semibold py-2.5 rounded-pill transition active:scale-95"
                >
                  Sign in →
                </button>
                <button
                  onClick={() => { setEmail(''); setBlocked(false); }}
                  className="flex-1 border border-hairline text-ink-soft hover:bg-inset text-sm font-semibold py-2.5 rounded-control transition"
                >
                  Different email
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={submit}
              disabled={!valid || submitting}
              className="w-full bg-brand hover:bg-brand-700 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed text-white text-base font-semibold py-4 rounded-pill transition-all duration-150 mb-4"
            >
              {submitting ? 'Building your report…' : 'Show me my report →'}
            </button>
          )}

          <ConsentLine />
        </div>
      </main>
    </div>
  );
}
