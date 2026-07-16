import { useState } from 'react';
import { track } from '../lib/analytics';

// SPEC_MENTOR_REQUEST §1 — the topic form shown on both mentor surfaces (S1 page +
// S2/S3 modal). Replaces the old mailto stubs. On send it PATCHes the session-authed
// /api/user with { mentorRequest } — the server records the row, flips the session to
// booked (stops nudges + fires the existing #4 email), and alerts ADMIN_EMAIL.
interface Props {
  session: 'S1' | 'S2' | 'S3';
  onSent?: () => void; // parent marks the session booked locally / stops nudges
}

export default function MentorRequestForm({ session, onSent }: Props) {
  const [topic, setTopic] = useState('');
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const trimmed = topic.trim();

  async function send() {
    if (!trimmed || status === 'sending') return;
    setStatus('sending');
    try {
      const r = await fetch('/api/user', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mentorRequest: { session, topic: trimmed.slice(0, 500) } }),
      });
      if (!r.ok) throw new Error('failed');
      track('mentor_request_submitted', { session });
      setStatus('sent');
      onSent?.();
    } catch {
      setStatus('error');
    }
  }

  if (status === 'sent') {
    return (
      <div className="rounded-control bg-accent-50 border border-accent-100 px-4 py-4 text-center">
        <p className="text-sm font-semibold text-accent-800">Request sent 🎉</p>
        <p className="text-xs text-ink-soft mt-1">We'll reach out within 24–48h to set a time.</p>
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
      <button
        onClick={send}
        disabled={!trimmed || status === 'sending'}
        className="w-full mt-2 bg-brand hover:bg-brand-700 active:scale-95 disabled:opacity-40 text-white text-sm font-semibold py-3 rounded-pill transition"
      >
        {status === 'sending' ? 'Sending…' : 'Send request'}
      </button>
      {status === 'error' && <p className="text-xs text-red-500 mt-2 text-center">Couldn't send — please try again.</p>}
    </div>
  );
}
