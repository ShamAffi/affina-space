import { useEffect, useState } from 'react';
import type { BrainEntry, AiFeedback, CompareResult, Lesson, StartupSnapshot, MarketResearchReport } from '../types';
import MarketResearchView from './MarketResearchView';
import { MODULES } from '../data';
import { splitMissionVision, composeMissionVision } from '../missionVision';

// Lesson lookup, so Documents edits respect the course's char caps and can re-run the AI mentor.
const LESSON_BY_ID: Record<string, Lesson> = {};
for (const m of MODULES) for (const l of m.lessons) LESSON_BY_ID[l.id] = l;

export interface DocContext { name: string; idea: string; customer: string; stage: string }

const ENTRY_TYPE_LABELS: Record<string, string> = {
  value_proposition: 'Value Proposition',
  target_customer: 'Target Customer',
  first_offer: 'First Offer',
  task_result: 'Task Result',
};

const ENTRY_TYPE_COLOR: Record<string, string> = {
  task_result: 'text-accent-600',
};

const VERDICT_CONFIG: Record<string, { label: string; dot: string; bg: string; text: string }> = {
  strong:           { label: 'Strong',         dot: 'bg-accent-400',  bg: 'bg-accent-50',  text: 'text-accent-800'  },
  ok:               { label: 'Good',            dot: 'bg-brand-400',   bg: 'bg-brand-50',   text: 'text-brand-700'   },
  can_be_stronger:  { label: 'Can be stronger', dot: 'bg-amber-400',  bg: 'bg-amber-50',  text: 'text-amber-700'  },
};

interface Props {
  email: string;
  onClose: () => void;
  onLessonInputSaved?: (lessonId: string, content: string) => void;
  context?: DocContext;
}

export default function DocumentsPanel({ email, onClose, onLessonInputSaved, context }: Props) {
  const [entries, setEntries] = useState<BrainEntry[]>([]);
  const [snapshot, setSnapshot] = useState<StartupSnapshot | null>(null);
  const [snapshotOpen, setSnapshotOpen] = useState(false);
  const [research, setResearch] = useState<MarketResearchReport | null>(null);
  const [researchOpen, setResearchOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [modalEntry, setModalEntry] = useState<BrainEntry | null>(null);

  useEffect(() => {
    if (!email) { setLoading(false); return; }   // gates to logged-in users; identity is the cookie
    fetch('/api/brain?with=snapshot')
      .then((r) => r.json())
      .then((data) => {
        // Snapshot is pinned separately (§3.4) — keep it out of the regular doc list
        const list: BrainEntry[] = Array.isArray(data.entries) ? data.entries : [];
        const researchEntry = list.find((e) => e.entryType === 'market_research');
        if (researchEntry) {
          try { setResearch(JSON.parse(researchEntry.content) as MarketResearchReport); } catch { /* skip */ }
        }
        setEntries(list.filter((e) => e.entryType !== 'startup_snapshot' && e.entryType !== 'market_research'));
        setSnapshot(data.snapshot ?? null);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [email]);

  function handleSaved(updated: BrainEntry) {
    setEntries((prev) => prev.map((e) => (e.id === updated.id ? updated : e)));
    setModalEntry(updated);
    onLessonInputSaved?.(updated.lessonId, updated.content);
  }

  return (
    <>
      {/* Side panel */}
      <div className="fixed inset-0 z-40 flex items-start justify-end">
        <div className="absolute inset-0 bg-black/20" onClick={onClose} />

        <div className="relative z-10 w-full max-w-sm h-full bg-surface shadow-2xl flex flex-col animate-panel-in">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-5 border-b border-hairline">
            <div>
              <h2 className="text-base font-bold text-ink">Documents</h2>
              <p className="text-xs text-ink-mute mt-0.5">Your Company Brain</p>
            </div>
            <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-control hover:bg-inset text-ink-soft transition">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto px-5 py-5 flex flex-col gap-3">
            {loading && (
              <div className="flex-1 flex items-center justify-center">
                <div className="w-6 h-6 border-2 border-brand border-t-transparent rounded-pill animate-spin" />
              </div>
            )}

            {/* 📌 Startup Snapshot — pinned first (§3.4) */}
            {!loading && snapshot && (
              <button
                onClick={() => setSnapshotOpen(true)}
                className="w-full text-left bg-brand-50 border border-brand-200 rounded-card p-4 hover:border-brand-400 transition-colors"
              >
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-brand-700">📌 Startup Snapshot</span>
                  <span className="ml-auto text-[10px] font-bold bg-surface text-brand-700 rounded-pill px-2 py-0.5 border border-brand-200">
                    v{snapshot.version}
                  </span>
                </div>
                <p className="text-sm font-semibold text-ink leading-snug mb-1">Your startup on one page</p>
                <p className="text-[11px] text-brand-700/70">updated after {snapshot.source}</p>
              </button>
            )}

            {/* 📄 Market research — opens the PDF-style viewer */}
            {!loading && research && (
              <button
                onClick={() => setResearchOpen(true)}
                className="w-full text-left bg-accent-50 border border-accent-100 rounded-card p-4 hover:border-accent-400 transition-colors"
              >
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-accent-800">📄 Market Research</span>
                  <span className="ml-auto text-[10px] font-bold bg-surface text-amber-700 rounded-pill px-2 py-0.5 border border-amber-200">test mode</span>
                </div>
                <p className="text-sm font-semibold text-ink leading-snug mb-1">9-section research report</p>
                <p className="text-[11px] text-accent-800/70 line-clamp-2">{research.headlineVerdict}</p>
              </button>
            )}

            {!loading && entries.length === 0 && !snapshot && (
              <div className="flex-1 flex flex-col items-center justify-center text-center gap-3 py-16">
                <div className="w-12 h-12 rounded-pill bg-brand-50 flex items-center justify-center">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#7150EA" strokeWidth="1.5">
                    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                  </svg>
                </div>
                <p className="text-sm text-ink-soft leading-relaxed">
                  Complete exercises in the program<br />to build your Company Brain
                </p>
              </div>
            )}

            {!loading && entries.map((entry) => (
              <DocCard
                key={entry.id}
                entry={entry}
                onOpen={() => setModalEntry(entry)}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Edit modal */}
      {modalEntry && (
        <EditModal
          entry={modalEntry}
          onClose={() => setModalEntry(null)}
          onSaved={handleSaved}
          context={context}
        />
      )}

      {researchOpen && research && (
        <MarketResearchView report={research} projectName="" onClose={() => setResearchOpen(false)} />
      )}

      {/* Snapshot modal — read-only (§3.4): updates flow through the weekly check-in */}
      {snapshotOpen && snapshot && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setSnapshotOpen(false)} />
          <div className="relative z-10 w-full max-w-lg bg-surface rounded-card shadow-2xl flex flex-col max-h-[90vh]">
            <div className="flex items-start justify-between gap-3 px-6 pt-6 pb-4 border-b border-hairline">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-brand-700">📌 Startup Snapshot</span>
                <h3 className="text-base font-bold text-ink mt-0.5">Your startup on one page</h3>
                <span className="inline-block mt-1.5 text-xs font-bold bg-brand-50 text-brand-700 rounded-pill px-2.5 py-0.5">
                  v{snapshot.version} · updated after {snapshot.source}
                </span>
              </div>
              <button onClick={() => setSnapshotOpen(false)} className="mt-0.5 w-8 h-8 flex items-center justify-center rounded-control hover:bg-inset text-ink-mute transition flex-shrink-0">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-3">
              {snapshot.sections.filter((s) => s.title !== 'Next focus').map((s) => (
                <div key={s.title}>
                  <p className="text-[10px] font-bold text-brand-600 uppercase tracking-widest mb-1">{s.title}</p>
                  <p className="text-sm text-ink-soft leading-relaxed whitespace-pre-wrap">{s.content}</p>
                </div>
              ))}
            </div>
            <div className="px-6 pb-5 pt-4 border-t border-hairline">
              <p className="text-[11px] text-ink-mute leading-relaxed">
                Something changed or looks off? Tell us in your weekly check-in — your Snapshot updates itself.
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ─── Compact doc card ─────────────────────────────────────────────────────────
function DocCard({ entry, onOpen }: { entry: BrainEntry; onOpen: () => void }) {
  return (
    <div className="bg-surface border border-hairline rounded-card p-4 shadow-sm">
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex-1 min-w-0">
          <span className={`text-[10px] font-bold uppercase tracking-wider ${ENTRY_TYPE_COLOR[entry.entryType] ?? 'text-brand-600'}`}>
            {ENTRY_TYPE_LABELS[entry.entryType] ?? entry.entryType}
          </span>
          <div className="flex items-center gap-2 mt-0.5">
            <p className="text-sm font-semibold text-ink leading-snug truncate">{entry.lessonTitle}</p>
            {entry.aiScore !== null && entry.aiScore !== undefined && (
              <span className={`flex-shrink-0 text-[10px] font-bold rounded-pill px-2 py-0.5 ${
                entry.aiScore >= 80 ? 'bg-accent-50 text-accent-800' :
                entry.aiScore >= 55 ? 'bg-brand-50 text-brand-700' :
                'bg-amber-50 text-amber-700'
              }`}>
                {entry.aiScore}/100
              </span>
            )}
          </div>
        </div>
        <button
          onClick={onOpen}
          className="flex-shrink-0 text-xs font-semibold text-brand border border-brand-200 rounded-pill px-3 py-1 hover:bg-brand-50 transition"
        >
          Open
        </button>
      </div>
      {entry.entryType === 'mission_vision' ? (() => {
        // Stored as one combined text — show mission & vision as two labeled blocks (§1).
        const mv = splitMissionVision(entry.content);
        return (
          <div className="flex flex-col gap-2">
            <div>
              <p className="text-[10px] font-bold text-brand-600 uppercase tracking-wider">Mission</p>
              <p className="text-sm text-ink-soft leading-relaxed line-clamp-2">{mv.mission || '—'}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-brand-600 uppercase tracking-wider">Vision</p>
              <p className="text-sm text-ink-soft leading-relaxed line-clamp-2">{mv.vision || '—'}</p>
            </div>
          </div>
        );
      })() : (
        <p className="text-sm text-ink-soft leading-relaxed line-clamp-3">
          {entry.content || '—'}
        </p>
      )}
    </div>
  );
}

// ─── Edit modal ───────────────────────────────────────────────────────────────
function EditModal({
  entry, onClose, onSaved, context,
}: {
  entry: BrainEntry;
  onClose: () => void;
  onSaved: (updated: BrainEntry) => void;
  context?: DocContext;
}) {
  const [draft, setDraft] = useState(entry.content);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const lesson = LESSON_BY_ID[entry.lessonId];
  const maxLen = lesson?.inputMaxLength;
  // Lesson exercises get a fresh mentor review on save (same as editing in the exercise itself).
  // North Star and non-lesson docs (e.g. task results) just save.
  const reEvaluatable = !!lesson && (lesson.type === 'input' || lesson.type === 'structured') && lesson.aiMode !== 'north-star';
  const aiMode = lesson?.aiMode === 'compare' ? 'compare' : 'feedback';

  async function handleSave() {
    setSaving(true);
    setError('');
    try {
      // 1. Persist the edited text. audit F40 — check the status: a failed save must NOT be
      // reported to the user (and to parent state) as a success.
      const saveRes = await fetch('/api/brain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'save-input', lessonId: entry.lessonId, content: draft }),
      }).catch(() => null);
      if (!saveRes || !saveRes.ok) { setError("Couldn't save — please try again."); return; }

      // 2. Re-run the AI mentor for exercise docs and refresh the score + feedback.
      if (reEvaluatable && draft.trim()) {
        try {
          const r = await fetch('/api/ai', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              lessonId: entry.lessonId,
              lessonTitle: entry.lessonTitle,
              prompt: entry.prompt,
              answer: draft,
              aiMode,
              context,
            }),
          });
          if (r.ok) {
            const feedback = await r.json();
            const isCompare = Array.isArray(feedback?.candidates);
            onSaved({
              ...entry,
              content: draft,
              aiScore: isCompare ? null : (typeof feedback?.score === 'number' ? feedback.score : entry.aiScore),
              aiFeedback: JSON.stringify(feedback),
              processedByAi: true,
            });
            return;
          }
        } catch { /* fall through to plain save below */ }
      }

      onSaved({ ...entry, content: draft });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative z-10 w-full max-w-lg bg-surface rounded-card shadow-2xl flex flex-col max-h-[90vh]">
        {/* Modal header */}
        <div className="flex items-start justify-between gap-3 px-6 pt-6 pb-4 border-b border-hairline">
          <div>
            <span className={`text-[10px] font-bold uppercase tracking-wider ${ENTRY_TYPE_COLOR[entry.entryType] ?? 'text-brand-600'}`}>
              {ENTRY_TYPE_LABELS[entry.entryType] ?? entry.entryType}
            </span>
            <h3 className="text-base font-bold text-ink mt-0.5 leading-snug">{entry.lessonTitle}</h3>
            {entry.aiScore !== null && entry.aiScore !== undefined && (
              <span className={`inline-block mt-1.5 text-xs font-bold rounded-pill px-2.5 py-0.5 ${
                entry.aiScore >= 80 ? 'bg-accent-50 text-accent-800' :
                entry.aiScore >= 55 ? 'bg-brand-50 text-brand-700' :
                'bg-amber-50 text-amber-700'
              }`}>
                {entry.aiScore}/100
              </span>
            )}
          </div>
          <button onClick={onClose} className="mt-0.5 w-8 h-8 flex items-center justify-center rounded-control hover:bg-inset text-ink-mute transition flex-shrink-0">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-5">
          {/* Editable text — mission_vision splits into two labeled fields (§1) */}
          {entry.entryType === 'mission_vision' ? (() => {
            const mv = splitMissionVision(draft);
            const fieldCls = 'w-full rounded-control border border-hairline focus:border-brand-400 focus:ring-2 focus:ring-brand-100 outline-none px-4 py-3 text-sm text-ink resize-none transition leading-relaxed';
            return (
              <div className="flex flex-col gap-4">
                <div>
                  <p className="text-xs font-bold text-brand-700 uppercase tracking-widest mb-2">Mission</p>
                  <textarea
                    value={mv.mission}
                    onChange={(e) => setDraft(composeMissionVision(e.target.value, mv.vision))}
                    rows={2}
                    className={fieldCls}
                    autoFocus
                  />
                </div>
                <div>
                  <p className="text-xs font-bold text-brand-700 uppercase tracking-widest mb-2">Vision</p>
                  <textarea
                    value={mv.vision}
                    onChange={(e) => setDraft(composeMissionVision(mv.mission, e.target.value))}
                    rows={3}
                    className={fieldCls}
                  />
                </div>
              </div>
            );
          })() : (
            <div>
              <p className="text-xs font-bold text-ink-mute uppercase tracking-widest mb-2">Your answer</p>
              <textarea
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                rows={6}
                maxLength={maxLen}
                className="w-full rounded-control border border-hairline focus:border-brand-400 focus:ring-2 focus:ring-brand-100 outline-none px-4 py-3 text-sm text-ink resize-none transition leading-relaxed"
                autoFocus
              />
              {maxLen && (
                <p className={`mt-1 text-xs text-right ${draft.length >= maxLen ? 'text-red-400 font-semibold' : draft.length >= maxLen * 0.9 ? 'text-amber-500' : 'text-ink-mute'}`}>
                  {draft.length} / {maxLen}
                </p>
              )}
            </div>
          )}

          {/* AI mentor feedback */}
          {entry.aiFeedback && (
            <FeedbackSection aiFeedback={entry.aiFeedback} />
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-2 px-6 pb-6 pt-4 border-t border-hairline">
          <button
            onClick={onClose}
            className="px-4 py-2.5 text-sm font-semibold text-ink-soft border border-hairline rounded-control hover:bg-inset transition"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving || draft === entry.content || !draft.trim()}
            className="flex-1 bg-brand hover:bg-brand-700 disabled:opacity-50 text-white text-sm font-semibold py-2.5 rounded-pill transition"
          >
            {saving
              ? (reEvaluatable ? 'Updating…' : 'Saving…')
              : (reEvaluatable ? 'Update & Save' : 'Save changes')}
          </button>
        </div>
        {error && <p className="text-xs text-red-500 text-center mt-2">{error}</p>}
      </div>
    </div>
  );
}

// ─── Feedback section inside modal ────────────────────────────────────────────
function FeedbackSection({ aiFeedback }: { aiFeedback: string }) {
  let parsed: AiFeedback | (CompareResult & { recommendation?: string }) | null = null;
  try { parsed = JSON.parse(aiFeedback); } catch { return null; }
  if (!parsed) return null;

  const isCompare = 'candidates' in parsed && Array.isArray((parsed as CompareResult).candidates);

  return (
    <div>
      <p className="text-xs font-bold text-ink-mute uppercase tracking-widest mb-3">Mentor feedback</p>

      {isCompare ? (
        <CompareSection result={parsed as CompareResult} />
      ) : (
        <StandardSection feedback={parsed as AiFeedback} />
      )}
    </div>
  );
}

function StandardSection({ feedback }: { feedback: AiFeedback }) {
  const vc = VERDICT_CONFIG[feedback.verdict] ?? VERDICT_CONFIG.ok;
  return (
    <div className="flex flex-col gap-3">
      {/* Score row */}
      <div className={`flex items-center gap-3 ${vc.bg} rounded-control px-4 py-3`}>
        <span className={`text-2xl font-extrabold tabular-nums ${vc.text}`}>{feedback.score}</span>
        <span className="text-ink-mute text-lg">/</span>
        <span className="text-sm text-ink-mute font-medium">100</span>
        <div className="ml-auto flex items-center gap-1.5">
          <span className={`w-2 h-2 rounded-pill ${vc.dot}`} />
          <span className={`text-xs font-bold ${vc.text}`}>{vc.label}</span>
        </div>
      </div>

      {/* Good */}
      {feedback.good?.length > 0 && (
        <div className="bg-accent-50 rounded-control px-4 py-3">
          <p className="text-[10px] font-bold text-accent-600 uppercase tracking-widest mb-2">What worked</p>
          <ul className="flex flex-col gap-1.5">
            {feedback.good.map((g, i) => (
              <li key={i} className="flex gap-2 text-sm text-ink-soft leading-relaxed">
                <span className="text-accent-600 flex-shrink-0 mt-0.5">✓</span>
                {g}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Missing */}
      {feedback.missing?.length > 0 && (
        <div className="bg-amber-50 rounded-control px-4 py-3">
          <p className="text-[10px] font-bold text-amber-600 uppercase tracking-widest mb-2">To strengthen</p>
          <ul className="flex flex-col gap-1.5">
            {feedback.missing.map((m, i) => (
              <li key={i} className="flex gap-2 text-sm text-ink-soft leading-relaxed">
                <span className="text-amber-500 flex-shrink-0 mt-0.5">→</span>
                {m}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Next step */}
      {feedback.nextStep && (
        <div className="bg-brand-50 border border-brand-100 rounded-control px-4 py-3">
          <p className="text-[10px] font-bold text-brand uppercase tracking-widest mb-1">Next step</p>
          <p className="text-sm text-ink-soft leading-relaxed">{feedback.nextStep}</p>
        </div>
      )}
    </div>
  );
}

function CompareSection({ result }: { result: CompareResult }) {
  return (
    <div className="flex flex-col gap-3">
      {result.recommendation && (
        <div className="bg-brand-50 border border-brand-100 rounded-control px-4 py-3">
          <p className="text-[10px] font-bold text-brand uppercase tracking-widest mb-1">Recommendation</p>
          <p className="text-sm text-ink-soft leading-relaxed">{result.recommendation}</p>
        </div>
      )}
      {result.runnerUp && (
        <div className="bg-inset rounded-control px-4 py-3">
          <p className="text-[10px] font-bold text-ink-mute uppercase tracking-widest mb-1">Runner-up</p>
          <p className="text-sm text-ink-soft leading-relaxed">{result.runnerUp}</p>
        </div>
      )}
      {result.nextStep && (
        <div className="bg-accent-50 rounded-control px-4 py-3">
          <p className="text-[10px] font-bold text-accent-600 uppercase tracking-widest mb-1">Next step</p>
          <p className="text-sm text-ink-soft leading-relaxed">{result.nextStep}</p>
        </div>
      )}
    </div>
  );
}
