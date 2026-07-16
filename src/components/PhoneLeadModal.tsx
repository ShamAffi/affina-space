import { useState, useEffect } from 'react';
import ConsentLine from '../screens/ConsentLine';
import { track } from '../lib/analytics';

// Phone lead capture (SPEC_PHONE_CAPTURE) — two placements share this modal:
//   'guide'   — after Module 1 completion; free guide in exchange for a number.
//   'paywall' — on paywall dismiss; "talk to a founder" offer.
// Onboarding is never gated on a phone. Saves via the session-authed PATCH.
interface Props {
  variant: 'guide' | 'paywall';
  guideUrl?: string | null;      // guide deliverable (GUIDE_URL); required for 'guide'
  onClose: () => void;           // dismiss / done → parent hides + continues
  onSubmitted?: (phone: string) => void;
}

const COPY = {
  guide: {
    eyebrow: 'You finished your first module 🎉',
    headline: "The AI-First Founder's Guide — our gift",
    sub: 'How to build your business with AI doing the heavy lifting — the playbook we use inside Affina.',
    price: true,
    cta: 'Get my free guide',
    dismiss: 'No thanks',
  },
  paywall: {
    eyebrow: 'Not sure yet?',
    headline: 'Talk it through with a founder',
    sub: "15 minutes, honest answers about whether the full program fits your stage. Leave your number — we'll reach out.",
    price: false,
    cta: 'Have someone call me',
    dismiss: 'Just take me back',
  },
} as const;

export default function PhoneLeadModal({ variant, guideUrl, onClose, onSubmitted }: Props) {
  const [phone, setPhone] = useState('');
  const [status, setStatus] = useState<'form' | 'sending' | 'delivered' | 'error'>('form');
  const copy = COPY[variant];
  const valid = phone.trim().replace(/[^\d+]/g, '').length >= 6;

  useEffect(() => { track('guide_offer_shown', { source: variant }); }, [variant]);

  async function submit() {
    if (!valid || status === 'sending') return;
    setStatus('sending');
    try {
      const r = await fetch('/api/user', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: { number: phone.trim(), source: variant } }),
      });
      if (!r.ok) throw new Error('failed');
      track('phone_submitted', { source: variant });
      onSubmitted?.(phone.trim());
      setStatus('delivered');
    } catch {
      setStatus('error');
    }
  }

  function skip() {
    track('phone_skipped', { source: variant });
    onClose();
  }

  function openGuide() {
    track('guide_opened');
    try { if (guideUrl) window.open(guideUrl, '_blank', 'noopener,noreferrer'); } catch { /* ignore */ }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={skip} />
      <div className="relative z-10 w-full max-w-sm bg-surface rounded-card shadow-2xl p-6 text-center">
        {status === 'delivered' && variant === 'guide' ? (
          <>
            <div className="text-4xl mb-2">🎁</div>
            <h3 className="text-lg font-bold text-ink mb-1">It's yours</h3>
            <p className="text-sm text-ink-soft mb-5">Also sent to your inbox — a copy to keep.</p>
            <button onClick={openGuide} className="w-full bg-brand hover:bg-brand-700 active:scale-95 text-white text-sm font-semibold py-3 rounded-pill transition">Open the guide →</button>
            <button onClick={onClose} className="w-full mt-2 text-xs text-ink-mute hover:text-ink-soft py-2">Close</button>
          </>
        ) : status === 'delivered' ? (
          <>
            <div className="text-4xl mb-2">📞</div>
            <h3 className="text-lg font-bold text-ink mb-1">Got it — we'll reach out</h3>
            <p className="text-sm text-ink-soft mb-5">A founder will call you within a day or two.</p>
            <button onClick={onClose} className="w-full bg-brand hover:bg-brand-700 active:scale-95 text-white text-sm font-semibold py-3 rounded-pill transition">Back to my dashboard</button>
          </>
        ) : (
          <>
            <p className="text-xs font-bold text-accent-600 uppercase tracking-widest mb-2">{copy.eyebrow}</p>
            <h3 className="text-xl font-extrabold text-ink mb-2 leading-tight">{copy.headline}</h3>
            <p className="text-sm text-ink-soft leading-relaxed mb-3">{copy.sub}</p>
            {copy.price && (
              <p className="text-sm font-bold text-ink mb-4"><span className="line-through text-ink-mute">€49</span> Free for alpha founders</p>
            )}
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+34 600 000 000 · WhatsApp is fine"
              className="w-full rounded-control border border-hairline focus:border-brand-400 focus:ring-2 focus:ring-brand-100 outline-none px-4 py-3 text-sm text-ink placeholder-ink-mute transition mb-2"
            />
            <button
              onClick={submit}
              disabled={!valid || status === 'sending'}
              className="w-full bg-brand hover:bg-brand-700 active:scale-95 disabled:opacity-40 text-white text-sm font-semibold py-3 rounded-pill transition"
            >
              {status === 'sending' ? 'Saving…' : copy.cta}
            </button>
            {status === 'error' && <p className="text-xs text-red-500 mt-2">Couldn't save — please try again.</p>}
            <button onClick={skip} className="w-full mt-2 text-xs text-ink-mute hover:text-ink-soft py-2">{copy.dismiss}</button>
            <ConsentLine className="mt-2" />
          </>
        )}
      </div>
    </div>
  );
}
