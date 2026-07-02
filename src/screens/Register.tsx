import { useState } from 'react';

interface Props {
  score: number;
  onRegistered: (name: string, email: string) => void;
  onSignIn: (email: string) => void;
}

type Step = 'name' | 'email' | 'signin';

export default function Register({ score, onRegistered, onSignIn }: Props) {
  const [step, setStep] = useState<Step>('name');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [checking, setChecking] = useState(false);
  const [emailExists, setEmailExists] = useState(false);
  const [error, setError] = useState('');

  const emailValid = email.trim().includes('@') && email.trim().includes('.');

  async function handleEmailSubmit() {
    if (!emailValid || checking) return;
    setChecking(true);
    setError('');
    try {
      const res = await fetch(`/api/user?email=${encodeURIComponent(email.trim())}`);
      if (res.ok) {
        // Account already exists for this email
        setEmailExists(true);
        setChecking(false);
        return;
      }
    } catch {
      /* check failed — proceed as a new account */
    }
    onRegistered(name.trim(), email.trim());
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
          {/* Readiness card */}
          <div className="flex items-center gap-3 bg-brand-50 border border-brand-100 rounded-card px-4 py-3 mb-7">
            <div className="w-10 h-10 rounded-control bg-brand-100 flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-brand" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="min-w-0">
              <p className="text-xs text-ink-soft leading-none mb-0.5">Idea score {score} · plan ready</p>
              <p className="text-sm font-semibold text-brand-800 truncate">
                Your 12-week roadmap is ready
              </p>
            </div>
          </div>

          {/* ── NAME step ─────────────────────────────────────── */}
          {step === 'name' && (
            <>
              <h1 className="text-2xl font-extrabold text-ink mb-2">First — what's your name?</h1>
              <p className="text-sm text-ink-soft mb-6">So your mentor knows what to call you.</p>
              <input
                type="text"
                autoFocus
                placeholder="Your first name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' && name.trim()) setStep('email'); }}
                maxLength={40}
                className="w-full rounded-card border-2 border-hairline focus:border-brand-400 focus:ring-4 focus:ring-brand-100 outline-none px-5 py-4 text-base text-ink placeholder-ink-mute transition mb-3"
              />
              <button
                onClick={() => { if (name.trim()) setStep('email'); }}
                disabled={!name.trim()}
                className="w-full bg-brand hover:bg-brand-700 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed text-white text-base font-semibold py-4 rounded-pill transition-all duration-150 mb-4"
              >
                Continue →
              </button>
              <button
                onClick={() => { setStep('signin'); setError(''); }}
                className="w-full text-sm text-ink-mute hover:text-brand transition text-center"
              >
                Already have an account? Sign in
              </button>
            </>
          )}

          {/* ── EMAIL step (register) ─────────────────────────── */}
          {step === 'email' && (
            <>
              <h1 className="text-2xl font-extrabold text-ink mb-2">
                Nice to meet you{name.trim() ? `, ${name.trim()}` : ''} 👋
              </h1>
              <p className="text-sm text-ink-soft mb-6">Add your email to save your plan and start Module 1.</p>
              <input
                type="email"
                autoFocus
                placeholder="you@email.com"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setEmailExists(false); setError(''); }}
                onKeyDown={(e) => { if (e.key === 'Enter') handleEmailSubmit(); }}
                className="w-full rounded-card border-2 border-hairline focus:border-brand-400 focus:ring-4 focus:ring-brand-100 outline-none px-5 py-4 text-base text-ink placeholder-ink-mute transition mb-3"
              />

              {emailExists ? (
                <div className="bg-amber-50 border border-amber-200 rounded-card p-4 mb-3">
                  <p className="text-sm font-semibold text-amber-800 mb-1">This email already has an account</p>
                  <p className="text-xs text-amber-600 mb-3">Log in to pick up where you left off, or use a different email.</p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => onSignIn(email.trim())}
                      className="flex-1 bg-brand hover:bg-brand-700 text-white text-sm font-semibold py-2.5 rounded-pill transition active:scale-95"
                    >
                      Log in →
                    </button>
                    <button
                      onClick={() => { setEmail(''); setEmailExists(false); }}
                      className="flex-1 border border-hairline text-ink-soft hover:bg-inset text-sm font-semibold py-2.5 rounded-control transition"
                    >
                      Different email
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <button
                    onClick={handleEmailSubmit}
                    disabled={!emailValid || checking}
                    className="w-full bg-brand hover:bg-brand-700 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed text-white text-base font-semibold py-4 rounded-pill transition-all duration-150 mb-3"
                  >
                    {checking ? 'Checking…' : 'Create my account →'}
                  </button>
                  {error && <p className="text-xs text-red-500 mb-2">{error}</p>}
                  <button
                    onClick={() => setStep('name')}
                    className="w-full text-sm text-ink-mute hover:text-ink-soft transition text-center"
                  >
                    ← Back
                  </button>
                </>
              )}
              <p className="text-xs text-center text-ink-mute mt-4">No credit card · Cancel anytime</p>
            </>
          )}

          {/* ── SIGN-IN step ──────────────────────────────────── */}
          {step === 'signin' && (
            <>
              <h1 className="text-2xl font-extrabold text-ink mb-2">Welcome back</h1>
              <p className="text-sm text-ink-soft mb-6">Enter your email to load your account.</p>
              <input
                type="email"
                autoFocus
                placeholder="you@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' && emailValid) onSignIn(email.trim()); }}
                className="w-full rounded-card border-2 border-hairline focus:border-brand-400 focus:ring-4 focus:ring-brand-100 outline-none px-5 py-4 text-base text-ink placeholder-ink-mute transition mb-3"
              />
              <button
                onClick={() => { if (emailValid) onSignIn(email.trim()); }}
                disabled={!emailValid}
                className="w-full bg-brand hover:bg-brand-700 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed text-white text-base font-semibold py-4 rounded-pill transition mb-3"
              >
                Sign in →
              </button>
              <button
                onClick={() => { setStep('name'); setEmail(''); }}
                className="w-full text-sm text-ink-mute hover:text-ink-soft transition text-center"
              >
                ← Back to sign up
              </button>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
