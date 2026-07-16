import { useEffect, useState } from 'react';
import type { MentorSessionId, StartupSnapshot } from '../types';
import MentorRequestForm from './MentorRequestForm';
import { track } from '../lib/analytics';

// §6.5 — mentor session block (v2: booking is a placeholder; completion is manual)
const SESSION_META: Record<MentorSessionId, { title: string; when: string; purpose: string; agenda: string[] }> = {
  S1: {
    title: 'Session 1 · Start',
    when: 'after Module 4',
    purpose: 'Meet your mentor, say your 12-week goal out loud, and lock in the working rhythm.',
    agenda: [
      'Introductions — you, your startup, your edge',
      'Your 12-week goal, said out loud',
      'How the program rhythm works from here',
    ],
  },
  S2: {
    title: 'Session 2 · Midpoint',
    when: 'after Module 9',
    purpose: 'Review your traction dashboard with a human mentor and pressure-test the pivot-or-scale question.',
    agenda: [
      'Walk through your progress report + 3 numbers',
      'Honest judgement: pivot signals vs scale signals',
      'Priorities for the second half',
    ],
  },
  S3: {
    title: 'Session 3 · Graduation',
    when: 'after Module 12',
    purpose: 'Results vs the goal from Session 1, your plan for the year — and what Affina can keep doing for you.',
    agenda: [
      'Results vs your Session 1 goal',
      'Your 12-month plan review',
      'Next: subscription, feedback, referrals',
    ],
  },
};

interface Props {
  session: MentorSessionId;
  email: string;
  completed: boolean;
  booked?: boolean;   // a request is already on file → show the sent state, not the form
  onPaywall?: () => void; // if a write 403s (subscription lapsed) → open the paywall instead of erroring
  onClose: () => void;
  onCompletedChange: (completed: boolean) => void;
}

export default function MentorSessionModal({ session, email, completed, booked, onPaywall, onClose, onCompletedChange }: Props) {
  const meta = SESSION_META[session];
  const [snapshotBullets, setSnapshotBullets] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => { track('mentor_book_clicked', { session }); }, [session]);

  // Personal agenda points pulled from the Snapshot (Next focus / Risk flags)
  useEffect(() => {
    if (!email) return;   // gates to logged-in users; identity is the session cookie
    fetch('/api/brain?with=snapshot')
      .then((r) => r.json())
      .then((d) => {
        const snap = d.snapshot as StartupSnapshot | null;
        if (!snap) return;
        const picks = snap.sections
          .filter((s) => ['Next focus', 'Risk flags', 'Traction'].includes(s.title))
          .map((s) => `${s.title}: ${s.content.split('\n')[0]}`);
        setSnapshotBullets(picks.slice(0, 3));
      })
      .catch(() => {});
  }, [email]);

  async function toggleCompleted() {
    const next = !completed;
    setSaving(true);
    try {
      // v2: manual flag (§6.5) — set by the account owner acting as mentor
      const res = await fetch('/api/user', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mentorSessions: { [session]: { completed: next } } }),
      });
      if (res.ok) onCompletedChange(next);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative z-10 w-full max-w-lg bg-surface rounded-card shadow-2xl flex flex-col max-h-[90vh]">
        <div className="flex items-start justify-between gap-3 px-6 pt-6 pb-4 border-b border-hairline">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-brand-700">📅 Mentor session · {meta.when}</span>
            <h3 className="text-lg font-bold text-ink mt-0.5">{meta.title}</h3>
          </div>
          <button onClick={onClose} className="mt-0.5 w-8 h-8 flex items-center justify-center rounded-control hover:bg-inset text-ink-mute transition flex-shrink-0">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-5">
          <div>
            <p className="text-xs font-bold text-ink-mute uppercase tracking-widest mb-1.5">Why this session</p>
            <p className="text-sm text-ink-soft leading-relaxed">{meta.purpose}</p>
          </div>

          <div>
            <p className="text-xs font-bold text-ink-mute uppercase tracking-widest mb-1.5">Agenda</p>
            <ul className="space-y-1.5">
              {meta.agenda.map((a) => (
                <li key={a} className="flex gap-2 text-sm text-ink-soft leading-relaxed">
                  <span className="text-brand flex-shrink-0">·</span>{a}
                </li>
              ))}
            </ul>
          </div>

          {snapshotBullets.length > 0 && (
            <div className="bg-brand-50 border border-brand-100 rounded-control px-4 py-3">
              <p className="text-[10px] font-bold text-brand-700 uppercase tracking-widest mb-1.5">From your Snapshot — bring these up</p>
              <ul className="space-y-1">
                {snapshotBullets.map((b) => (
                  <li key={b} className="text-xs text-ink-soft leading-relaxed">• {b}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className="px-6 pb-6 pt-4 border-t border-hairline flex flex-col gap-3">
          <MentorRequestForm session={session} alreadyBooked={booked} onPaywall={onPaywall} />
          <label className="flex items-center gap-2 justify-center text-xs text-ink-soft cursor-pointer select-none">
            <input type="checkbox" checked={completed} disabled={saving} onChange={toggleCompleted} className="accent-[#7150EA]" />
            Session completed <span className="text-ink-mute">(set manually in v2)</span>
          </label>
        </div>
      </div>
    </div>
  );
}
