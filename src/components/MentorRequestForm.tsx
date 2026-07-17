import { useState } from 'react';
import { track } from '../lib/analytics';
import { COUNTRIES, flag, defaultIso } from '../lib/countries';

// SPEC_MENTOR_REQUEST §1 — the topic form shown on both mentor surfaces (S1 page +
// S2/S3 modal). On send it PATCHes the session-authed /api/user with { mentorRequest }
// (records the row, flips the session to booked, alerts ADMIN_EMAIL). AMENDMENT: it also
// captures a REQUIRED phone (country picker) so we never lose contact for the paid call —
// sent alongside as { phone: {number, source:'mentor'} }, prefilled from any number on file.
interface Props {
  session: 'S1' | 'S2' | 'S3';
  onSent?: () => void; // parent marks the session booked locally / stops nudges
  alreadyBooked?: boolean; // a request is already on file (prior visit) — show the sent state, not the form
  onPaywall?: () => void;  // server 403 subscription_required (paid feature) → open the paywall
  initialPhone?: string | null; // prefill the phone field if we already have a number on file
}

// Split a stored "+34 600123456" back into { iso, local number } for prefill (best-effort —
// same-dial-code countries just pick the first; the composed number is identical either way).
function parseStored(p?: string | null): { iso?: string; number: string } {
  if (!p) return { number: '' };
  const m = p.trim().match(/^\+(\d+)\s+(.*)$/);
  if (m) return { iso: COUNTRIES.find((c) => c.dial === m[1])?.iso, number: m[2] };
  return { number: p.replace(/^\+/, '') };
}

export default function MentorRequestForm({ session, onSent, alreadyBooked, onPaywall, initialPhone }: Props) {
  const [topic, setTopic] = useState('');
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const pre = parseStored(initialPhone);
  const [iso, setIso] = useState(pre.iso ?? defaultIso());
  const [phone, setPhone] = useState(pre.number);

  const trimmed = topic.trim();
  const dial = COUNTRIES.find((c) => c.iso === iso)?.dial ?? '';
  const phoneValid = phone.replace(/\D/g, '').length >= 6;
  const canSend = !!trimmed && phoneValid && status !== 'sending';

  async function send() {
    if (!canSend) return;
    setStatus('sending');
    try {
      const r = await fetch('/api/user', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mentorRequest: { session, topic: trimmed.slice(0, 500) },
          phone: { number: `+${dial} ${phone.trim()}`.trim(), source: 'mentor' },
        }),
      });
      // Paid feature (SPEC_MENTOR_REQUEST amendment): server rejects an unsubscribed write → paywall.
      if (r.status === 403) { setStatus('idle'); onPaywall?.(); return; }
      if (!r.ok) throw new Error('failed');
      track('mentor_request_submitted', { session });
      setStatus('sent');
      onSent?.();
    } catch {
      setStatus('error');
    }
  }

  // Show the sent state after a fresh submit OR when a request is already on file (return visit) —
  // so coming back to a booked session never re-opens an empty form (SPEC_MENTOR_REQUEST).
  if (status === 'sent' || alreadyBooked) {
    return (
      <div className="rounded-control bg-accent-50 border border-accent-100 px-4 py-4 text-center">
        <p className="text-sm font-semibold text-accent-800">Your request is in 🎉</p>
        <p className="text-xs text-ink-soft mt-1 leading-relaxed">
          We'll reach out within 24–48h to set a time. Haven't heard back within 24 hours?{' '}
          <a href="mailto:hello@affina.space" className="text-brand font-semibold hover:underline">hello@affina.space</a>
        </p>
      </div>
    );
  }

  return (
    <div>
      <label className="block text-sm font-semibold text-ink mb-2">What's on your mind most right now?</label>
      <textarea
        value={topic}
        onChange={(e) => setTopic(e.target.value.slice(0, 500))}
        maxLength={500}
        rows={3}
        placeholder="e.g. I'm not sure my pricing is right · I keep stalling on talking to customers · I don't know what to focus on next"
        className="w-full rounded-control border border-hairline focus:border-brand-400 focus:ring-2 focus:ring-brand-100 outline-none px-4 py-3 text-sm text-ink placeholder-ink-mute resize-none transition"
      />

      <label className="block text-sm font-semibold text-ink mb-2 mt-4">Your phone number <span className="text-ink-mute font-normal">— so your mentor can reach you</span></label>
      <select
        value={iso}
        onChange={(e) => setIso(e.target.value)}
        aria-label="Country"
        className="w-full rounded-control border border-hairline focus:border-brand-400 focus:ring-2 focus:ring-brand-100 outline-none px-3 py-2.5 text-sm text-ink bg-surface transition mb-2"
      >
        {COUNTRIES.map((c) => (
          <option key={c.iso} value={c.iso}>{flag(c.iso)}  {c.name} (+{c.dial})</option>
        ))}
      </select>
      <div className="flex items-stretch gap-2">
        <span className="inline-flex items-center px-3 rounded-control border border-hairline bg-inset text-sm font-semibold text-ink-soft shrink-0">+{dial}</span>
        <input
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="600 000 000 · WhatsApp is fine"
          className="flex-1 min-w-0 rounded-control border border-hairline focus:border-brand-400 focus:ring-2 focus:ring-brand-100 outline-none px-4 py-2.5 text-sm text-ink placeholder-ink-mute transition"
        />
      </div>

      <button
        onClick={send}
        disabled={!canSend}
        className="w-full mt-4 bg-brand hover:bg-brand-700 active:scale-95 disabled:opacity-40 text-white text-sm font-semibold py-3 rounded-pill transition"
      >
        {status === 'sending' ? 'Sending…' : 'Send request'}
      </button>
      {status === 'error' && <p className="text-xs text-red-500 mt-2 text-center">Couldn't send — please try again.</p>}
    </div>
  );
}
