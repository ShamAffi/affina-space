import { useEffect, useState } from 'react';
import type { BrainEntry } from '../types';

const ENTRY_TYPE_LABELS: Record<string, string> = {
  value_proposition: 'Value Proposition',
  target_customer: 'Target Customer',
  first_offer: 'First Offer',
};

interface Props {
  email: string;
  onClose: () => void;
}

export default function DocumentsPanel({ email, onClose }: Props) {
  const [entries, setEntries] = useState<BrainEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editDraft, setEditDraft] = useState('');
  const [savingId, setSavingId] = useState<number | null>(null);

  useEffect(() => {
    if (!email) { setLoading(false); return; }
    fetch(`/api/brain?email=${encodeURIComponent(email)}`)
      .then((r) => r.json())
      .then((data) => { setEntries(Array.isArray(data) ? data : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [email]);

  async function handleSave(entry: BrainEntry) {
    setSavingId(entry.id);
    try {
      await fetch('/api/lessons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'save-input',
          email,
          lessonId: entry.lessonId,
          content: editDraft,
        }),
      });
      setEntries((prev) =>
        prev.map((e) => (e.id === entry.id ? { ...e, content: editDraft } : e)),
      );
      setEditingId(null);
    } finally {
      setSavingId(null);
    }
  }

  return (
    <div className="fixed inset-0 z-40 flex items-start justify-end">
      <div className="absolute inset-0 bg-black/20" onClick={onClose} />

      <div className="relative z-10 w-full max-w-sm h-full bg-white shadow-2xl flex flex-col animate-panel-in">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
          <div>
            <h2 className="text-base font-bold text-gray-900">Documents</h2>
            <p className="text-xs text-gray-400 mt-0.5">Your Company Brain</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-500 transition">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-5 flex flex-col gap-4">
          {loading && (
            <div className="flex-1 flex items-center justify-center">
              <div className="w-6 h-6 border-2 border-purple-600 border-t-transparent rounded-full animate-spin" />
            </div>
          )}

          {!loading && entries.length === 0 && (
            <div className="flex-1 flex flex-col items-center justify-center text-center gap-3 py-16">
              <div className="w-12 h-12 rounded-full bg-purple-50 flex items-center justify-center">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#9333ea" strokeWidth="1.5">
                  <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                </svg>
              </div>
              <p className="text-sm text-gray-500 leading-relaxed">
                Complete exercises in the program<br />to build your Company Brain
              </p>
            </div>
          )}

          {!loading && entries.map((entry) => {
            const isEditing = editingId === entry.id;
            const isSaving = savingId === entry.id;

            return (
              <div key={entry.id} className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
                {/* Doc header */}
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div>
                    <span className="text-xs font-bold text-purple-500 uppercase tracking-wider">
                      {ENTRY_TYPE_LABELS[entry.entryType] ?? entry.entryType}
                    </span>
                    <p className="text-sm font-semibold text-gray-800 mt-0.5 leading-snug">
                      {entry.lessonTitle}
                    </p>
                  </div>
                  {!isEditing && (
                    <button
                      onClick={() => { setEditingId(entry.id); setEditDraft(entry.content); }}
                      className="flex-shrink-0 text-xs font-semibold text-purple-600 border border-purple-200 rounded-lg px-2.5 py-1 hover:bg-purple-50 transition"
                    >
                      Edit
                    </button>
                  )}
                </div>

                {/* Prompt */}
                <p className="text-xs text-gray-400 mb-2">{entry.prompt}</p>

                {/* Content or edit textarea */}
                {isEditing ? (
                  <div className="flex flex-col gap-2">
                    <textarea
                      value={editDraft}
                      onChange={(e) => setEditDraft(e.target.value)}
                      className="w-full rounded-xl border border-purple-200 bg-purple-50 focus:bg-white focus:border-purple-400 focus:ring-2 focus:ring-purple-100 outline-none px-3 py-2.5 text-sm text-gray-800 resize-none transition min-h-[80px]"
                      autoFocus
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleSave(entry)}
                        disabled={isSaving}
                        className="flex-1 bg-purple-600 hover:bg-purple-700 disabled:opacity-60 text-white text-xs font-semibold py-2 rounded-xl transition"
                      >
                        {isSaving ? 'Saving…' : 'Save'}
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        className="px-4 text-xs font-semibold text-gray-500 border border-gray-200 rounded-xl hover:bg-gray-50 transition"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-gray-700 leading-relaxed">{entry.content || '—'}</p>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
