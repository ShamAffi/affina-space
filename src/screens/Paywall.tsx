import { useState, useEffect, type ReactNode } from 'react';
import { track } from '../lib/analytics';
import PhoneLeadModal from '../components/PhoneLeadModal';

// SPEC_COHORT_PAYWALL — the founding-cohort selling page. Full-page, dismissible overlay shown
// after the m0l5 Venture Report and on any locked M1+ click. Stripe checkout charges the €300/3mo
// founding price; `subscribed` is flipped by the webhook, never here. Photos/screenshots are
// labeled PLACEHOLDERS (§4 — Shamil supplies real assets later).

interface Props {
  onDismiss: () => void;            // back to Dashboard
  name?: string;                    // her first name (accepted-variant hero)
  phone?: string | null;            // skip the founder-call offer if on file
  seatsTotal?: number;
  seatsLeft?: number;
  calendlyUrl?: string | null;      // §3 — primary CTA opens this when set, else the phone modal
  accepted?: boolean;               // §3a — post-call acceptance state (personal "claim your seat")
  seatHeldUntil?: string | null;    // ISO — hold date shown in the accepted hero
}

// Placeholder visual frame — a labeled slot where a real screenshot/photo drops in later (§4).
function Slot({ label, className = '', children }: { label?: string; className?: string; children?: ReactNode }) {
  return (
    <div className={`relative rounded-control bg-inset border border-hairline overflow-hidden ${className}`}>
      {children}
      {label && (
        <span className="absolute bottom-1.5 right-2 text-[9px] uppercase tracking-wider text-ink-mute/70 font-semibold">{label}</span>
      )}
    </div>
  );
}

export default function Paywall({ onDismiss, name, phone, seatsTotal = 15, seatsLeft = 11, calendlyUrl, accepted = false, seatHeldUntil }: Props) {
  const [working, setWorking] = useState(false);
  const [error, setError] = useState('');
  const [offer, setOffer] = useState<null | 'dismiss' | 'book'>(null);
  const [cardIdx, setCardIdx] = useState(0);

  useEffect(() => {
    track('paywall_viewed');
    if (accepted) track('seat_claim_viewed');
  }, [accepted]);

  const soldOut = seatsLeft <= 0;
  const holdDate = seatHeldUntil ? new Date(seatHeldUntil).toLocaleDateString('en-US', { month: 'long', day: 'numeric' }) : '';

  // Dismiss → the founder-call offer once (skipped if a phone is on file); both paths → Dashboard.
  // Also records that she's seen & dismissed the paywall (drives the dashboard guide popup, §6).
  function dismiss() {
    track('paywall_dismissed');
    try { localStorage.setItem('affina_paywall_dismissed', '1'); } catch { /* ignore */ }
    if (phone) onDismiss();
    else setOffer('dismiss');
  }

  async function checkout() {
    setWorking(true);
    setError('');
    track('cohort_checkout_clicked');
    track('checkout_started');
    try {
      const r = await fetch('/api/stripe?action=checkout', { method: 'POST' });
      const d = await r.json().catch(() => ({}));
      if (d.url) { window.location.href = d.url; return; }
      throw new Error('no url');
    } catch {
      setWorking(false);
      setError('Could not start checkout — please try again.');
    }
  }

  function bookCall() {
    track('cohort_call_clicked');
    if (calendlyUrl) { window.open(calendlyUrl, '_blank', 'noopener'); return; }
    setOffer('book');
  }

  function joinWaitlist() {
    track('waitlist_joined');
    setOffer('book');
  }

  const CARDS: { title: string; body: string; visual: ReactNode }[] = [
    {
      title: 'The 12-Week Launch Sprint',
      body: 'Twelve weeks: from your project to real business results.',
      visual: (
        <Slot className="h-28 flex items-center justify-center px-4">
          <div className="flex items-center gap-1.5 w-full">
            {['Idea', 'Validated', 'Built', 'First sale'].map((s, i) => (
              <div key={s} className="flex items-center gap-1.5 flex-1 last:flex-none">
                <span className="text-[10px] font-semibold text-brand-700 whitespace-nowrap">{s}</span>
                {i < 3 && <span className="flex-1 h-px bg-brand-200" />}
              </div>
            ))}
          </div>
        </Slot>
      ),
    },
    {
      title: '3 Private Mentor Sessions',
      body: 'Real founders and operators, 1:1 — at the moments that matter most.',
      visual: (
        <Slot label="photos" className="h-28 flex items-center justify-center">
          <div className="flex -space-x-3">
            {[0, 1, 2, 3, 4].map((i) => (
              <div key={i} className="w-11 h-11 rounded-pill bg-gradient-to-br from-brand-200 to-brand-100 border-2 border-surface" />
            ))}
          </div>
        </Slot>
      ),
    },
    {
      title: 'Your Working Dashboard',
      body: 'Tasks, feedback, momentum — your whole build in one place.',
      visual: (
        <Slot label="screenshot" className="h-28 p-3">
          <div className="flex gap-2 h-full">
            <div className="w-1/3 rounded bg-brand-100/60" />
            <div className="flex-1 flex flex-col gap-1.5">
              <div className="h-2 rounded bg-hairline" />
              <div className="h-2 rounded bg-hairline w-3/4" />
              <div className="h-2 rounded bg-accent-100 w-1/2 mt-auto" />
            </div>
          </div>
        </Slot>
      ),
    },
    {
      title: 'Your Startup Brain (AI)',
      body: 'An AI that actually knows your project — every insight and fact, working for your decisions.',
      visual: (
        <Slot label="AI" className="h-28 p-3 flex flex-col justify-center gap-1.5">
          <p className="text-[10px] text-ink-mute font-semibold">AI review</p>
          <p className="text-[11px] text-ink-soft leading-snug italic">“Your 3 interviews all name price as the blocker — test a lower tier before building.”</p>
        </Slot>
      ),
    },
    {
      title: 'Deep-Dive Programs & Consults',
      body: 'From vibe-coding to marketing to B2B sales — go deep where your business needs it.',
      visual: (
        <Slot label="screenshot" className="h-28 p-3">
          <div className="grid grid-cols-2 gap-1.5 h-full">
            {['Marketing', 'AI build', 'B2B sales', 'Fundraising'].map((s) => (
              <div key={s} className="rounded bg-surface border border-hairline flex items-center justify-center text-[10px] font-semibold text-ink-soft">{s}</div>
            ))}
          </div>
        </Slot>
      ),
    },
    {
      title: 'Founding Status',
      body: 'Shape the product. A direct channel to the founders. Founding terms — forever.',
      visual: (
        <div className="h-28 rounded-control bg-brand flex flex-col items-center justify-center gap-1.5 text-white">
          <span className="text-2xl">✦</span>
          <span className="text-[11px] font-semibold uppercase tracking-widest">Founding member</span>
        </div>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-canvas">
      <div className="fixed inset-0 pointer-events-none overflow-hidden" aria-hidden>
        <div className="absolute -top-32 -right-32 w-96 h-96 rounded-pill bg-brand-100 opacity-40 blur-3xl" />
        <div className="absolute -bottom-40 -left-24 w-80 h-80 rounded-pill bg-accent-50 opacity-50 blur-3xl" />
      </div>

      <div className="relative z-10 max-w-xl mx-auto px-5 py-10 sm:py-14">
        {/* Dismiss */}
        <button
          onClick={dismiss}
          className="absolute right-4 top-4 w-9 h-9 flex items-center justify-center rounded-pill bg-surface border border-hairline text-ink-mute hover:text-ink transition shadow-sm"
          aria-label="Close"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12" /></svg>
        </button>

        {/* Hero — accepted variant swaps the copy (§3a) */}
        {accepted ? (
          <>
            <p className="text-xs font-bold text-accent-600 uppercase tracking-widest mb-3">You're accepted</p>
            <h1 className="font-display text-3xl sm:text-4xl font-medium tracking-tight text-ink leading-tight mb-4">
              Your seat in the founding cohort is reserved{name ? `, ${name}` : ''}.
            </h1>
            <p className="text-base text-ink-soft leading-relaxed mb-8">
              {holdDate ? <>We loved talking about your project. Your seat is held until <span className="font-semibold text-ink">{holdDate}</span> — claim it below and we start properly: your 12 weeks, your mentors, your cohort.</>
                : <>We loved talking about your project. Claim your seat below and we start properly: your 12 weeks, your mentors, your cohort.</>}
            </p>
          </>
        ) : (
          <>
            <p className="text-xs font-bold text-brand-600 uppercase tracking-widest mb-3">Founding cohort · {seatsTotal} seats</p>
            <h1 className="font-display text-3xl sm:text-4xl font-medium tracking-tight text-ink leading-tight mb-4">
              Be one of the {seatsTotal} we build this with.
            </h1>
            <p className="text-base text-ink-soft leading-relaxed mb-8">
              A founding cohort of {seatsTotal} women founders. Super-personal attention, a direct line to us, and a
              hand in shaping the platform that will help millions of women build — at half the price, as a one-time
              founding offer.
            </p>
          </>
        )}

        {/* Looped single-card carousel — one card centered, arrows either side, dots below */}
        <div className="mb-8">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCardIdx((i) => (i - 1 + CARDS.length) % CARDS.length)}
              aria-label="Previous"
              className="shrink-0 w-9 h-9 flex items-center justify-center rounded-pill bg-surface border border-hairline text-ink-mute hover:text-ink transition shadow-sm"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15 18 9 12 15 6" /></svg>
            </button>
            <div className="flex-1 min-w-0 bg-surface border border-hairline rounded-card p-5 shadow-sm">
              {CARDS[cardIdx].visual}
              <p className="text-base font-bold text-ink mt-4">{CARDS[cardIdx].title}</p>
              <p className="text-sm text-ink-soft leading-relaxed mt-1">{CARDS[cardIdx].body}</p>
            </div>
            <button
              onClick={() => setCardIdx((i) => (i + 1) % CARDS.length)}
              aria-label="Next"
              className="shrink-0 w-9 h-9 flex items-center justify-center rounded-pill bg-surface border border-hairline text-ink-mute hover:text-ink transition shadow-sm"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 18 15 12 9 6" /></svg>
            </button>
          </div>
          <div className="flex justify-center gap-1.5 mt-3">
            {CARDS.map((c, i) => (
              <button
                key={c.title}
                onClick={() => setCardIdx(i)}
                aria-label={`Card ${i + 1}`}
                className={`h-2 rounded-pill transition-all ${i === cardIdx ? 'w-5 bg-brand' : 'w-2 bg-inset'}`}
              />
            ))}
          </div>
        </div>

        {/* Price block */}
        <div className="bg-surface border border-hairline rounded-card p-5 shadow-sm mb-6 text-center">
          <p className="flex items-center justify-center gap-2 mb-1">
            <span className="text-lg text-ink-mute line-through">€600</span>
            <span className="font-display text-3xl font-medium text-brand-700">€300</span>
            <span className="text-sm font-semibold text-ink">founding price</span>
          </p>
          <p className="text-xs text-ink-mute mb-3">one-time price offer</p>
          {soldOut ? (
            <p className="text-sm font-bold text-amber-700">All {seatsTotal} founding seats are taken — join the waitlist below.</p>
          ) : (
            <p className="inline-block text-sm font-bold text-accent-700 bg-accent-50 border border-accent-100 rounded-pill px-3 py-1">{seatsLeft} of {seatsTotal} seats left</p>
          )}
          <p className="text-[11px] text-ink-mute leading-relaxed mt-3">3-month subscription · all updates · live mentor sessions · community</p>
          <p className="text-[11px] text-ink-mute mt-1">€600 regular price after the founding cohort.</p>
        </div>

        {/* CTA block */}
        {accepted ? (
          <button
            onClick={checkout}
            disabled={working}
            className="w-full bg-brand hover:bg-brand-700 active:scale-95 disabled:opacity-60 text-white text-base font-semibold py-4 rounded-pill transition-all duration-150"
          >
            {working ? 'Starting checkout…' : 'Claim my seat — €300'}
          </button>
        ) : soldOut ? (
          <button
            onClick={joinWaitlist}
            className="w-full bg-brand hover:bg-brand-700 active:scale-95 text-white text-base font-semibold py-4 rounded-pill transition-all duration-150"
          >
            Join the waitlist →
          </button>
        ) : (
          <>
            <button
              onClick={bookCall}
              className="w-full bg-brand hover:bg-brand-700 active:scale-95 text-white text-base font-semibold py-4 rounded-pill transition-all duration-150"
            >
              Book my seat — 20 minutes with a founder
            </button>
            <p className="text-center text-[11px] text-ink-mute leading-relaxed mt-2 mb-4">
              Not a sales call — we'll walk through your project together and decide if we're a fit.
            </p>
            <button
              onClick={checkout}
              disabled={working}
              className="w-full border border-hairline bg-surface hover:bg-inset disabled:opacity-60 text-ink-soft text-sm font-semibold py-3 rounded-pill transition"
            >
              {working ? 'Starting checkout…' : "I'm not waiting — start now"}
            </button>
          </>
        )}
        {error && <p className="text-center text-xs text-red-500 mt-3">{error}</p>}

        <button
          onClick={dismiss}
          className="w-full mt-3 text-sm font-semibold text-ink-mute hover:text-ink-soft transition text-center py-2"
        >
          Not now — I'll keep exploring
        </button>

        {/* Guarantee */}
        <div className="bg-inset border border-hairline rounded-card p-5 mt-8">
          <p className="text-sm font-bold text-ink mb-2">The Founding Cohort Guarantee</p>
          <p className="text-sm text-ink-soft leading-relaxed">
            Finish the program without your first customers — and we refund everything. We're here for business results, not subscriptions.
          </p>
          <p className="text-xs text-ink-mute mt-2">
            <a href="https://affina.space/terms" target="_blank" rel="noopener noreferrer" className="underline hover:text-ink-soft transition">Full conditions in our Terms (§9).</a>
          </p>
        </div>
      </div>

      {offer && (
        <PhoneLeadModal
          variant="paywall"
          onClose={() => { if (offer === 'dismiss') onDismiss(); else setOffer(null); }}
        />
      )}
    </div>
  );
}
