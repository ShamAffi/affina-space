import { useState } from 'react';

// SPEC_PAYWALL + SPEC_STRIPE — full-page blocking-but-dismissible overlay gating M5–M12.
// "Unlock" now starts a real Stripe Checkout (subscription; €360 first 3 months → €1,200/yr).
// `subscribed` is flipped by the Stripe webhook, never here — on return the success page
// polls the server for it. Gating logic (M5–M12 on users.subscribed) is unchanged.
const PRICE = '€360 for your first 3 months, then €1,200/year · cancel anytime';

const VALUE_STACK = [
  { title: 'The full Launch Program', sub: 'all 12 modules, idea → first paying customer (you’ve done 4)' },
  { title: '3 live 1:1 mentor sessions', sub: 'real founders, at the moments that matter' },
  { title: 'Specialized deep-dive programs', sub: 'Marketing, AI, Fundraising' },
  { title: 'Live online events & workshops', sub: '' },
  { title: 'A community of women founders', sub: 'building alongside you' },
];

interface Props {
  onDismiss: () => void;      // back to Dashboard
}

export default function Paywall({ onDismiss }: Props) {
  const [working, setWorking] = useState(false);
  const [error, setError] = useState('');

  async function unlock() {
    setWorking(true);
    setError('');
    try {
      // Start Stripe Checkout (session-authed server-side). The webhook flips `subscribed`.
      const r = await fetch('/api/stripe?action=checkout', { method: 'POST' });
      const d = await r.json().catch(() => ({}));
      if (d.url) { window.location.href = d.url; return; }
      throw new Error('no url');
    } catch {
      setWorking(false);
      setError('Could not start checkout — please try again.');
    }
  }

  return (
    <div className="min-h-screen bg-canvas">
      <div className="fixed inset-0 pointer-events-none overflow-hidden" aria-hidden>
        <div className="absolute -top-32 -right-32 w-96 h-96 rounded-pill bg-brand-100 opacity-40 blur-3xl" />
        <div className="absolute -bottom-40 -left-24 w-80 h-80 rounded-pill bg-accent-50 opacity-50 blur-3xl" />
      </div>

      <div className="relative z-10 max-w-lg mx-auto px-5 py-10 sm:py-16">
        {/* Dismiss */}
        <button
          onClick={onDismiss}
          className="absolute right-4 top-4 w-9 h-9 flex items-center justify-center rounded-pill bg-surface border border-hairline text-ink-mute hover:text-ink transition shadow-sm"
          aria-label="Close"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12" /></svg>
        </button>

        <p className="text-xs font-bold text-accent-600 uppercase tracking-widest mb-3">You've made it further than most.</p>
        <h1 className="font-display text-3xl sm:text-4xl font-medium tracking-tight text-ink leading-tight mb-5">
          The problem is real. Now build the business.
        </h1>

        <p className="text-base text-ink leading-relaxed mb-3">
          In four modules you've sharpened your idea, sized your market, talked to real people, and tested
          your hypothesis against what they actually said — the hard part most founders skip.
        </p>
        <p className="text-base text-ink leading-relaxed mb-7">
          What comes next is where it becomes a company: your business model, your first MVP, your first sale.
          <span className="font-semibold"> This is the part you came for.</span>
        </p>

        <div className="bg-surface border border-hairline rounded-card p-5 shadow-sm mb-6">
          <p className="text-[11px] font-bold text-ink-mute uppercase tracking-widest mb-3">What you unlock</p>
          <ul className="flex flex-col gap-3">
            {VALUE_STACK.map((v) => (
              <li key={v.title} className="flex gap-3">
                <span className="mt-0.5 flex-shrink-0 w-5 h-5 rounded-pill bg-accent-50 flex items-center justify-center">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#119C74" strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg>
                </span>
                <span className="min-w-0">
                  <span className="text-sm font-semibold text-ink">{v.title}</span>
                  {v.sub && <span className="block text-xs text-ink-soft leading-relaxed">{v.sub}</span>}
                </span>
              </li>
            ))}
          </ul>
        </div>

        <p className="text-center text-sm font-bold text-ink mb-1">{PRICE}</p>
        <p className="text-center text-[11px] text-ink-mute leading-relaxed mb-4">
          Cancel anytime — your first 3 months are yours; cancel before renewal to stop the annual plan.
        </p>

        <button
          onClick={unlock}
          disabled={working}
          className="w-full bg-brand hover:bg-brand-700 active:scale-95 disabled:opacity-60 text-white text-base font-semibold py-4 rounded-pill transition-all duration-150"
        >
          {working ? 'Starting checkout…' : 'Unlock the full program →'}
        </button>
        {error && <p className="text-center text-xs text-red-500 mt-3">{error}</p>}
        <button
          onClick={onDismiss}
          className="w-full mt-3 text-sm font-semibold text-ink-mute hover:text-ink-soft transition text-center py-2"
        >
          Not now — I'll keep exploring
        </button>

        <p className="text-[11px] text-ink-mute text-center mt-6">Built by founders who've been where you are.</p>
      </div>
    </div>
  );
}
