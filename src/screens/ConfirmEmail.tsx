import { useState } from 'react';
import ConsentLine from './ConsentLine';

interface Props {
  email: string;
  // Re-captures the onboarding intake+report onto the new address (§2a ownership check).
  // Post-F06 there is NO cross-email relocate: the old pending row is abandoned to expire and
  // the client re-sends the full data under the new email. Resolves { blocked } only when the
  // new email already belongs to a VERIFIED account (the caller then offers sign-in).
  onChangeEmail: (newEmail: string) => Promise<{ blocked?: boolean; reason?: string }>;
  // Sends the magic link (auth request-link). Resolves true on success.
  onSendLink: (email: string) => Promise<boolean>;
}

// Step 6 (SPEC_ONBOARDING_FUNNEL §1) — confirm email → create the account via magic link.
// Prefilled email, editable (change-email), consent shown regardless, then a check-inbox state.
export default function ConfirmEmail({ email, onChangeEmail, onSendLink }: Props) {
  const [current, setCurrent] = useState(email);
  const [mode, setMode] = useState<'confirm' | 'editing' | 'sent'>('confirm');
  const [editValue, setEditValue] = useState(email);
  const [saving, setSaving] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

  const editValid = editValue.trim().includes('@') && editValue.trim().includes('.');

  async function saveEmail() {
    const next = editValue.trim().toLowerCase();
    if (!editValid || saving) return;
    if (next === current) { setMode('confirm'); return; }
    setSaving(true);
    setError('');
    const r = await onChangeEmail(next);
    setSaving(false);
    if (r.blocked) {
      // Server blocks change-email only when the new address is a VERIFIED account.
      setError('That email already has an account. Sign in instead, or use another.');
      return;
    }
    setCurrent(next);
    setMode('confirm');
  }

  async function sendLink() {
    if (sending) return;
    setSending(true);
    setError('');
    const ok = await onSendLink(current);
    setSending(false);
    if (ok) setMode('sent');
    else setError('Something went wrong sending your link — please try again.');
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
          {mode === 'sent' ? (
            <div className="text-center">
              <div className="text-4xl mb-3">📬</div>
              <h1 className="text-2xl font-extrabold text-ink mb-2">Check your inbox</h1>
              <p className="text-sm text-ink-soft">
                We sent a magic link to <span className="font-semibold text-ink">{current}</span>. Click it to confirm your account and start the program — it expires in 15 minutes.
              </p>
              <button
                onClick={() => { setMode('confirm'); }}
                className="mt-6 text-sm text-ink-mute hover:text-ink-soft transition"
              >
                Didn't get it? Change email or resend
              </button>
            </div>
          ) : (
            <>
              <h1 className="text-2xl font-extrabold text-ink mb-2">Almost there</h1>
              <p className="text-sm text-ink-soft mb-6">Confirm your email to create your account and start the program — free.</p>

              {mode === 'editing' ? (
                <>
                  <input
                    type="email"
                    autoFocus
                    placeholder="you@email.com"
                    value={editValue}
                    onChange={(e) => { setEditValue(e.target.value); setError(''); }}
                    onKeyDown={(e) => { if (e.key === 'Enter') saveEmail(); }}
                    className="w-full rounded-card border-2 border-hairline focus:border-brand-400 focus:ring-4 focus:ring-brand-100 outline-none px-5 py-4 text-base text-ink placeholder-ink-mute transition mb-3"
                  />
                  <div className="flex gap-2 mb-4">
                    <button
                      onClick={saveEmail}
                      disabled={!editValid || saving}
                      className="flex-1 bg-brand hover:bg-brand-700 active:scale-95 disabled:opacity-40 text-white text-sm font-semibold py-3 rounded-pill transition"
                    >
                      {saving ? 'Saving…' : 'Save email'}
                    </button>
                    <button
                      onClick={() => { setEditValue(current); setMode('confirm'); setError(''); }}
                      className="flex-1 border border-hairline text-ink-soft hover:bg-inset text-sm font-semibold py-3 rounded-control transition"
                    >
                      Cancel
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-center justify-between gap-3 bg-inset border border-hairline rounded-card px-4 py-3.5 mb-3">
                    <span className="text-sm font-semibold text-ink truncate">{current}</span>
                    <button
                      onClick={() => { setEditValue(current); setMode('editing'); setError(''); }}
                      className="text-xs font-semibold text-brand hover:text-brand-700 transition flex-shrink-0"
                    >
                      Change email
                    </button>
                  </div>
                  <button
                    onClick={sendLink}
                    disabled={sending}
                    className="w-full bg-brand hover:bg-brand-700 active:scale-95 disabled:opacity-40 text-white text-base font-semibold py-4 rounded-pill transition-all duration-150 mb-4"
                  >
                    {sending ? 'Sending…' : 'Send me a magic link →'}
                  </button>
                </>
              )}

              {error && <p className="text-xs text-red-500 mb-3">{error}</p>}
              <ConsentLine />
            </>
          )}
        </div>
      </main>
    </div>
  );
}
