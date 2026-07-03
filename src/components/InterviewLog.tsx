import { useState } from 'react';
import type { InterviewLogEntry } from '../types';

const MAX_ENTRIES = 10;

const EMPTY: InterviewLogEntry = { who: '', pain: '', quotes: '', priceSignal: '', verdict: '' };

type FieldKey = 'who' | 'pain' | 'quotes' | 'priceSignal' | 'verdict';

const FIELDS: { key: FieldKey; label: string; placeholder: string; rows: number }[] = [
  { key: 'who', label: 'Who', placeholder: 'Name / role / segment — e.g. "Maria, mom of 2, works part-time"', rows: 1 },
  { key: 'pain', label: 'Main pain + how they solve it today', placeholder: 'What hurts most, and their current workaround…', rows: 2 },
  { key: 'quotes', label: 'Key quotes / insights', placeholder: 'Their exact words that stuck with you…', rows: 2 },
  { key: 'priceSignal', label: 'Price signal', placeholder: 'What they pay today / reaction to your price range…', rows: 2 },
  { key: 'verdict', label: 'Verdict: confirms / contradicts hypothesis', placeholder: 'Confirms or contradicts — and what you\'re changing because of it…', rows: 2 },
];

interface Props {
  entries: InterviewLogEntry[];
  onChange: (entries: InterviewLogEntry[]) => void;
  minEntries: number;
  readOnly?: boolean;
  email?: string;   // for the "Add Transcript" AI extraction call
}

export default function InterviewLog({ entries, onChange, minEntries, readOnly = false, email }: Props) {
  const [draft, setDraft] = useState<InterviewLogEntry | null>(null);
  const [editIdx, setEditIdx] = useState<number | null>(null);
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null);

  // "Add Transcript" (SPEC_INTERVIEW_LOG_TRANSCRIPT). NOT a Delegate mode (§6):
  // AI only restructures her own pasted real data into the 5 fields.
  const [transcriptMode, setTranscriptMode] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [extracting, setExtracting] = useState(false);
  const [extractError, setExtractError] = useState(false);

  // §4 — manual entry requires who/pain/verdict; the transcript path (aiExtracted
  // set) never blocks submit, whatever the confidence.
  const isTranscriptPath = !!draft?.aiExtracted;
  const draftValid = !!draft && (
    isTranscriptPath || (draft.who.trim().length > 0 && draft.pain.trim().length > 0 && draft.verdict.trim().length > 0)
  );
  const lowConf = new Set(draft?.aiExtracted?.lowConfidence ?? []);

  function openDraft() {
    setDraft({ ...EMPTY });
    setEditIdx(null);
    setTranscriptMode(false);
    setTranscript('');
    setExtractError(false);
  }

  function closeDraft() {
    setDraft(null);
    setEditIdx(null);
    setTranscriptMode(false);
    setTranscript('');
    setExtractError(false);
  }

  function setField(key: FieldKey, value: string) {
    if (!draft) return;
    // Editing an amber field means she's checked it — clear the flag.
    const ai = draft.aiExtracted;
    const nextAi = ai && ai.lowConfidence.includes(key)
      ? { ...ai, lowConfidence: ai.lowConfidence.filter((k) => k !== key) }
      : ai;
    setDraft({ ...draft, [key]: value, aiExtracted: nextAi });
  }

  function runExtraction() {
    if (!draft || !transcript.trim()) return;
    setExtracting(true);
    setExtractError(false);
    fetch('/api/ai', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mode: 'extract-interview', email, text: transcript }),
    })
      .then((r) => { if (!r.ok) throw new Error('api'); return r.json(); })
      .then((d: { fields: Record<FieldKey, string>; confidence: Record<FieldKey, 'found' | 'unclear'> }) => {
        const fields = (Object.keys(d.confidence) as FieldKey[]).filter((k) => (d.fields[k] ?? '').trim().length > 0);
        const lowConfidence = (Object.keys(d.confidence) as FieldKey[]).filter((k) => d.confidence[k] === 'unclear');
        setDraft({
          who: d.fields.who ?? '', pain: d.fields.pain ?? '', quotes: d.fields.quotes ?? '',
          priceSignal: d.fields.priceSignal ?? '', verdict: d.fields.verdict ?? '',
          rawTranscript: transcript,
          aiExtracted: { fields, lowConfidence },
        });
        setTranscriptMode(false);  // back to the 5 fields, now populated + amber-flagged
      })
      .catch(() => setExtractError(true))
      .finally(() => setExtracting(false));
  }

  function saveDraft() {
    if (!draft || !draftValid) return;
    const next = [...entries];
    if (editIdx !== null) next[editIdx] = draft;
    else next.push(draft);
    onChange(next);
    closeDraft();
  }

  function removeEntry(idx: number) {
    onChange(entries.filter((_, i) => i !== idx));
    setExpandedIdx(null);
  }

  const verdictTone = (v: string) =>
    /contradict/i.test(v) ? 'bg-amber-50 text-amber-700' : 'bg-accent-50 text-accent-800';

  return (
    <div className="flex flex-col gap-3">
      {/* Progress */}
      <div className="flex items-center justify-between">
        <p className="text-xs font-bold text-ink-mute uppercase tracking-widest">Interview log</p>
        <span className={`text-xs font-bold rounded-pill px-2.5 py-1 ${entries.length >= minEntries ? 'bg-accent-50 text-accent-800' : 'bg-inset text-ink-soft'}`}>
          {entries.length}/{MAX_ENTRIES} logged · {minEntries} required
        </span>
      </div>

      {/* Saved entries */}
      {entries.map((e, i) => (
        <div key={i} className="bg-surface border border-hairline rounded-control overflow-hidden">
          <button
            type="button"
            onClick={() => setExpandedIdx((v) => (v === i ? null : i))}
            className="w-full text-left px-4 py-3 hover:bg-inset transition-colors flex items-center gap-2"
          >
            <span className="text-xs font-bold text-ink-mute flex-shrink-0">#{i + 1}</span>
            <span className="text-sm font-semibold text-ink truncate flex-1">{e.who || '(no name)'}</span>
            {e.aiExtracted && (
              <span className="text-[10px] font-bold rounded-pill px-2 py-0.5 flex-shrink-0 bg-inset text-ink-soft" title="Filled from a pasted transcript">📄</span>
            )}
            {e.verdict && (
              <span className={`text-[10px] font-bold rounded-pill px-2 py-0.5 flex-shrink-0 ${verdictTone(e.verdict)}`}>
                {/contradict/i.test(e.verdict) ? 'contradicts' : 'confirms'}
              </span>
            )}
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
              className={`flex-shrink-0 text-ink-mute transition-transform ${expandedIdx === i ? 'rotate-180' : ''}`}>
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>
          {expandedIdx === i && (
            <div className="px-4 pb-3 pt-1 border-t border-hairline space-y-2">
              {FIELDS.slice(1).map((f) =>
                e[f.key] ? (
                  <div key={f.key}>
                    <p className="text-[10px] font-bold text-ink-mute uppercase tracking-wider">{f.label}</p>
                    <p className="text-sm text-ink-soft leading-relaxed whitespace-pre-wrap">{e[f.key]}</p>
                  </div>
                ) : null,
              )}
              {!readOnly && (
                <div className="flex gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => { setDraft(e); setEditIdx(i); setExpandedIdx(null); setTranscriptMode(false); }}
                    className="text-xs font-semibold text-brand hover:text-brand-700 transition"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => removeEntry(i)}
                    className="text-xs font-semibold text-ink-mute hover:text-red-500 transition"
                  >
                    Delete
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      ))}

      {/* Add / edit form */}
      {!readOnly && draft && (
        <div className="bg-brand-50 border border-brand-100 rounded-control p-4 space-y-3">
          <p className="text-sm font-bold text-brand-800">
            {editIdx !== null ? `Edit interview #${editIdx + 1}` : `Interview #${entries.length + 1}`}
          </p>

          {transcriptMode ? (
            /* ── Transcript paste view (§2) ── */
            <div className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-ink-soft uppercase tracking-wider mb-1">
                  Paste your notes or transcript — as messy as it actually is
                </label>
                <textarea
                  value={transcript}
                  onChange={(ev) => setTranscript(ev.target.value)}
                  placeholder="e.g. raw notes from the call, a copy-pasted chat transcript, voice-memo notes…"
                  rows={7}
                  autoFocus
                  className="w-full text-sm bg-surface border border-hairline rounded-control px-3 py-2 outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100 placeholder-ink-mute resize-none transition"
                />
              </div>
              {extractError && (
                <p className="text-xs text-amber-700">Couldn't read that just now — try again.</p>
              )}
              <div className="flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => setTranscriptMode(false)}
                  className="text-xs font-semibold text-ink-mute hover:text-ink-soft transition"
                >
                  ← back to manual fields
                </button>
                <button
                  type="button"
                  onClick={runExtraction}
                  disabled={extracting || !transcript.trim()}
                  className="bg-brand hover:bg-brand-700 disabled:opacity-40 text-white text-sm font-semibold px-5 py-2 rounded-pill transition active:scale-95"
                >
                  {extracting ? 'Reading your notes…' : '✨ Fill in fields with AI'}
                </button>
              </div>
            </div>
          ) : (
            /* ── The 5 fields (manual, or populated from transcript) ── */
            <>
              {isTranscriptPath && (
                <p className="text-[11px] text-ink-mute -mt-1">
                  Filled from your transcript — check each field and edit anything that's off.
                </p>
              )}
              {FIELDS.map((f) => {
                const amber = lowConf.has(f.key);
                const base = 'w-full text-sm bg-surface border rounded-control px-3 py-2 outline-none focus:ring-2 transition';
                const cls = amber
                  ? `${base} border-l-4 border-l-amber-400 border-hairline focus:border-brand-400 focus:ring-brand-100`
                  : `${base} border-hairline focus:border-brand-400 focus:ring-brand-100`;
                return (
                  <div key={f.key}>
                    <label className="block text-[11px] font-bold text-ink-soft uppercase tracking-wider mb-1">{f.label}</label>
                    {f.rows === 1 ? (
                      <input
                        type="text"
                        value={draft[f.key]}
                        onChange={(ev) => setField(f.key, ev.target.value)}
                        placeholder={f.placeholder}
                        className={`${cls} placeholder-ink-mute`}
                      />
                    ) : (
                      <textarea
                        value={draft[f.key]}
                        onChange={(ev) => setField(f.key, ev.target.value)}
                        placeholder={f.placeholder}
                        rows={f.rows}
                        className={`${cls} placeholder-ink-mute resize-none`}
                      />
                    )}
                    {amber && (
                      <p className="text-[11px] text-amber-600 mt-1">AI wasn't sure — check this</p>
                    )}
                  </div>
                );
              })}
            </>
          )}

          {/* Action row: Add Transcript (left) · Cancel / Add interview (right) (§1) */}
          {!transcriptMode && (
            <div className="flex items-center justify-between gap-2 pt-1">
              <button
                type="button"
                onClick={() => { setTranscriptMode(true); setExtractError(false); }}
                className="text-sm font-semibold text-brand hover:text-brand-700 transition"
              >
                📄 Add Transcript
              </button>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={closeDraft}
                  className="text-sm text-ink-mute hover:text-ink-soft px-4 py-2 transition"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={saveDraft}
                  disabled={!draftValid}
                  className="bg-brand hover:bg-brand-700 disabled:opacity-40 text-white text-sm font-semibold px-5 py-2 rounded-pill transition active:scale-95"
                >
                  {editIdx !== null ? 'Save changes' : 'Add interview'}
                </button>
              </div>
            </div>
          )}
          {!transcriptMode && !draftValid && !isTranscriptPath && (
            <p className="text-[11px] text-ink-mute text-right">Who, pain, and verdict are required.</p>
          )}
        </div>
      )}

      {!readOnly && !draft && entries.length < MAX_ENTRIES && (
        <button
          type="button"
          onClick={openDraft}
          className="w-full border-2 border-dashed border-hairline hover:border-brand-200 hover:bg-brand-50/40 text-sm font-semibold text-ink-soft hover:text-brand rounded-control py-3 transition-all"
        >
          + Log an interview
        </button>
      )}
    </div>
  );
}
