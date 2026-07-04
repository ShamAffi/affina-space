import { useEffect, useState } from 'react';
import type { Task, TaskReview, TaskSource, TaskSubmissionData, InterviewLogEntry, FieldArtifactType } from '../types';
import { MODULES } from '../data';
import InterviewLog from '../components/InterviewLog';

// lessonId → fieldTask config (program field tasks reference their lesson via sourceRef)
const FIELD_TASKS: Record<string, { artifactType: FieldArtifactType; template?: string[]; minEntries?: number }> = {};
for (const m of MODULES) for (const l of m.lessons) if (l.fieldTask) FIELD_TASKS[l.id] = l.fieldTask;

const URL_RE = /^https?:\/\/\S+\.\S+/;

const SOURCE_LABEL: Record<TaskSource, string> = {
  program: 'Program',
  mentor: 'Mentor',
  lesson: 'Lesson',
  advisor: 'Advisor',
  self: 'You',
  system: 'System',
  pulse: 'Pulse',
};

const SOURCE_CHIP: Record<TaskSource, string> = {
  program: 'bg-brand-100 text-brand-800',
  mentor: 'bg-brand-50 text-brand',
  lesson: 'bg-inset text-ink-soft',
  advisor: 'bg-amber-50 text-amber-600',
  self: 'bg-brand-50 text-brand',
  system: 'bg-inset text-ink-mute',
  pulse: 'bg-accent-50 text-accent-600',
};

const VERDICT_STYLES: Record<string, { label: string; bg: string; text: string }> = {
  strong:     { label: 'Strong', bg: 'bg-accent-50', text: 'text-accent-600' },
  good:       { label: 'Good',   bg: 'bg-brand-50',  text: 'text-brand'  },
  needs_work: { label: 'Needs work', bg: 'bg-amber-50', text: 'text-amber-600' },
};

// ─── Compose readable submissionText from structured artifact data ────────────
function composeText(artifactType: FieldArtifactType, data: TaskSubmissionData): string {
  if (artifactType === 'interview_log') {
    return (data.interviewLog ?? [])
      .map((e, i) =>
        `Interview #${i + 1}\nWho: ${e.who}\nPain & current workaround: ${e.pain}\nKey quotes: ${e.quotes}\nPrice signal: ${e.priceSignal}\nVerdict: ${e.verdict}`)
      .join('\n\n');
  }
  const fields = Object.entries(data.templateFields ?? {})
    .map(([label, value]) => `${label}:\n${value}`)
    .join('\n\n');
  return data.url ? `Link: ${data.url}\n\n${fields}`.trim() : fields;
}

interface Props {
  task: Task;
  email: string;
  onBack: () => void;
}

export default function TaskDetail({ task, email, onBack }: Props) {
  const [currentTask, setCurrentTask] = useState<Task>(task);
  const [submitText, setSubmitText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  // Structured artifact state (field tasks)
  const fieldConfig = currentTask.sourceRef ? FIELD_TASKS[currentTask.sourceRef] : undefined;
  const saved = currentTask.submissionData ?? null;
  const [entries, setEntries] = useState<InterviewLogEntry[]>(saved?.interviewLog ?? []);
  const [templateFields, setTemplateFields] = useState<Record<string, string>>(saved?.templateFields ?? {});
  const [url, setUrl] = useState(saved?.url ?? '');

  const source = currentTask.source as TaskSource;
  const status = currentTask.status ?? 'todo';

  // §4b Mission Briefing — replaces the static WHAT TO DO on program field tasks
  const [briefing, setBriefing] = useState<string | null>(currentTask.briefing ?? null);
  const [briefingLoading, setBriefingLoading] = useState(false);
  useEffect(() => {
    if (source !== 'program' || briefing || !email) return;
    setBriefingLoading(true);
    fetch('/api/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'briefing', email, taskId: currentTask.id }),
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (d?.briefing) setBriefing(d.briefing); })
      .catch(() => { /* static instruction stays as fallback */ })
      .finally(() => setBriefingLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const review: TaskReview | null = (() => {
    if (!currentTask.aiReview) return null;
    try { return JSON.parse(currentTask.aiReview) as TaskReview; } catch { return null; }
  })();

  function startEditing() {
    setSubmitText(currentTask.submissionText ?? '');
    const d = currentTask.submissionData ?? null;
    setEntries(d?.interviewLog ?? []);
    setTemplateFields(d?.templateFields ?? {});
    setUrl(d?.url ?? '');
    setError('');
    setIsEditing(true);
  }

  // §3.2 — artifact validation gates the submit button
  function artifactValid(): boolean {
    if (!fieldConfig) return !!submitText.trim();
    switch (fieldConfig.artifactType) {
      case 'interview_log':
        return entries.length >= (fieldConfig.minEntries ?? 1);
      case 'text_template':
      case 'outreach_log':
        return (fieldConfig.template ?? []).every((f) => (templateFields[f] ?? '').trim().length > 0);
      case 'url_with_numbers':
        return URL_RE.test(url.trim()) && (fieldConfig.template ?? []).every((f) => (templateFields[f] ?? '').trim().length > 0);
      case 'screenshot':
        return URL_RE.test(url.trim());
    }
  }

  async function handleSubmit() {
    let text = submitText.trim();
    let submissionData: TaskSubmissionData | undefined;

    if (fieldConfig) {
      submissionData = {
        ...(fieldConfig.artifactType === 'interview_log' ? { interviewLog: entries } : {}),
        ...(Object.keys(templateFields).length ? { templateFields } : {}),
        ...(url.trim() ? { url: url.trim() } : {}),
      };
      text = composeText(fieldConfig.artifactType, submissionData);
    }
    if (!text || !artifactValid()) return;

    setSubmitting(true);
    setError('');
    try {
      const r = await fetch('/api/tasks/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, taskId: currentTask.id, submissionText: text, submissionData }),
      });
      if (r.status === 429) {
        setError("You're going a bit fast — give it a moment, then try again.");
        return;
      }
      const data = await r.json();
      if (data.task) {
        setCurrentTask(data.task);
        setIsEditing(false);
      } else {
        setError(data.error ?? 'Something went wrong. Please try again.');
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-canvas">
      {/* Header */}
      <header className="bg-surface border-b border-hairline flex items-center gap-3 px-4 sm:px-6 py-4 sticky top-0 z-30">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-ink-soft hover:text-ink transition-colors"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          <span className="text-sm font-medium">Tasks</span>
        </button>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8">
        {/* Task header */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <span className={`text-[10px] font-bold rounded-pill px-2.5 py-0.5 ${SOURCE_CHIP[source] ?? 'bg-inset text-ink-soft'}`}>
              {SOURCE_LABEL[source] ?? source}
            </span>
            {fieldConfig && (
              <span className="text-[10px] font-bold bg-amber-50 text-amber-700 rounded-pill px-2.5 py-0.5">
                Field mission
              </span>
            )}
            {status === 'done' && (
              <span className="text-[10px] font-bold bg-accent-50 text-accent-600 rounded-pill px-2.5 py-0.5">
                ✓ Done
              </span>
            )}
            {status === 'reviewed' && (
              <span className="text-[10px] font-bold bg-amber-50 text-amber-600 rounded-pill px-2.5 py-0.5">
                Needs work
              </span>
            )}
            {status === 'submitted' && (
              <span className="text-[10px] font-bold bg-amber-50 text-amber-600 rounded-pill px-2.5 py-0.5">
                In review
              </span>
            )}
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-ink leading-snug">
            {currentTask.title}
          </h1>
        </div>

        {/* Instruction / Mission Briefing (§4b) */}
        <div className="bg-surface border border-hairline rounded-card p-6 shadow-sm mb-6">
          {briefing ? (
            <>
              <p className="text-xs font-bold text-brand-600 uppercase tracking-widest mb-3">🧭 Mission briefing</p>
              <p className="text-sm text-ink leading-relaxed whitespace-pre-wrap">{briefing}</p>
            </>
          ) : (
            <>
              <p className="text-xs font-bold text-ink-mute uppercase tracking-widest mb-3">What to do</p>
              <p className="text-sm text-ink leading-relaxed whitespace-pre-wrap">
                {currentTask.instruction}
              </p>
              {briefingLoading && (
                <div className="flex items-center gap-2 mt-4 pt-3 border-t border-hairline text-xs text-ink-mute">
                  <div className="w-3.5 h-3.5 rounded-pill border-2 border-brand-200 border-t-brand animate-spin" />
                  Preparing your personal mission briefing…
                </div>
              )}
            </>
          )}
        </div>

        {/* Submission / Review area */}
        {(status === 'todo' || isEditing) && (
          fieldConfig ? (
            <div className="bg-surface border border-hairline rounded-card p-6 shadow-sm">
              <p className="text-xs font-bold text-ink-mute uppercase tracking-widest mb-4">
                {isEditing ? 'Update your artifact' : 'Your artifact'}
              </p>

              {/* interview_log */}
              {fieldConfig.artifactType === 'interview_log' && (
                <InterviewLog
                  entries={entries}
                  onChange={setEntries}
                  minEntries={fieldConfig.minEntries ?? 1}
                  email={email}
                />
              )}

              {/* url inputs (screenshot / url_with_numbers) */}
              {(fieldConfig.artifactType === 'screenshot' || fieldConfig.artifactType === 'url_with_numbers') && (
                <div className="mb-4">
                  <label className="block text-[11px] font-bold text-ink-soft uppercase tracking-wider mb-1">
                    {fieldConfig.artifactType === 'screenshot' ? 'Link to your proof (screenshot / photo)' : 'Live URL'}
                  </label>
                  <input
                    type="url"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="https://…"
                    className="w-full text-sm bg-surface border border-hairline rounded-control px-3 py-2.5 outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100 placeholder-ink-mute transition"
                  />
                  {url.trim().length > 0 && !URL_RE.test(url.trim()) && (
                    <p className="text-[11px] text-red-500 mt-1">Enter a valid link starting with http(s)://</p>
                  )}
                  {fieldConfig.artifactType === 'screenshot' && (
                    <p className="text-[11px] text-ink-mute mt-1">
                      Upload your screenshot anywhere (Google Drive, Imgur…) and paste the link. Direct file upload is coming soon.
                    </p>
                  )}
                </div>
              )}

              {/* template fields (text_template / outreach_log / url_with_numbers) */}
              {(fieldConfig.template ?? []).map((f) => (
                <div key={f} className="mb-4">
                  <label className="block text-[11px] font-bold text-ink-soft uppercase tracking-wider mb-1">{f}</label>
                  <textarea
                    value={templateFields[f] ?? ''}
                    onChange={(e) => setTemplateFields((prev) => ({ ...prev, [f]: e.target.value }))}
                    rows={2}
                    className="w-full text-sm bg-surface border border-hairline rounded-control px-3 py-2 outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100 placeholder-ink-mute resize-none transition"
                  />
                </div>
              ))}

              {error && <p className="text-xs text-red-500 mb-2">{error}</p>}

              <div className="flex items-center justify-between mt-2">
                {isEditing ? (
                  <button onClick={() => setIsEditing(false)} className="text-sm text-ink-mute hover:text-ink-soft transition-colors">
                    Cancel
                  </button>
                ) : <span />}
                <button
                  onClick={handleSubmit}
                  disabled={submitting || !artifactValid()}
                  className="flex items-center gap-2 bg-brand hover:bg-brand-700 active:scale-95 text-white text-sm font-semibold px-6 py-2.5 rounded-pill transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? (
                    <>
                      <div className="w-4 h-4 rounded-pill border-2 border-white/30 border-t-white animate-spin" />
                      Reviewing…
                    </>
                  ) : isEditing ? 'Resubmit for AI review' : 'Submit for AI review'}
                </button>
              </div>
              {!artifactValid() && !submitting && (
                <p className="text-[11px] text-ink-mute text-right mt-2">
                  {fieldConfig.artifactType === 'interview_log'
                    ? `Log at least ${fieldConfig.minEntries ?? 1} interview${(fieldConfig.minEntries ?? 1) > 1 ? 's' : ''} to submit.`
                    : 'Complete the required artifact to submit.'}
                </p>
              )}
            </div>
          ) : (
            <SubmitForm
              value={submitText}
              onChange={setSubmitText}
              onSubmit={handleSubmit}
              submitting={submitting}
              error={error}
              isResubmit={isEditing}
              onCancel={isEditing ? () => setIsEditing(false) : undefined}
            />
          )
        )}

        {status === 'submitted' && !review && (
          <div className="bg-amber-50 border border-amber-100 rounded-card p-6 text-center">
            <div className="flex justify-center mb-3">
              <div className="w-8 h-8 rounded-pill border-2 border-amber-200 border-t-amber-500 animate-spin" />
            </div>
            <p className="text-sm font-semibold text-amber-700">Reviewing your submission…</p>
            <p className="text-xs text-amber-500 mt-1">Reload the page in a few moments if this persists.</p>
            {currentTask.submissionText && (
              <div className="mt-4 text-left bg-surface border border-amber-100 rounded-control p-4">
                <p className="text-[10px] font-bold text-ink-mute uppercase mb-1">Your submission</p>
                <p className="text-sm text-ink-soft leading-relaxed whitespace-pre-wrap">
                  {currentTask.submissionText}
                </p>
              </div>
            )}
          </div>
        )}

        {review && !isEditing && (
          <>
            <ReviewCard review={review} submissionText={currentTask.submissionText} />

            {status === 'done' && (
              <div className="mt-3 flex items-center gap-2 bg-accent-50 border border-accent-100 rounded-control px-4 py-3 text-sm text-accent-800">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
                <span className="font-semibold">Completed</span>
                <span className="text-accent-600">— saved to your Documents</span>
              </div>
            )}

            <button
              onClick={startEditing}
              className="mt-3 w-full flex items-center justify-center gap-2 border border-hairline text-sm font-semibold text-ink-soft hover:text-brand hover:border-brand-200 hover:bg-brand-50 py-3 rounded-control transition-all duration-150"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
              Edit & resubmit
            </button>
          </>
        )}
      </main>
    </div>
  );
}

// ─── Submit form (free-text tasks: mentor/self/pulse…) ───────────────────────
function SubmitForm({
  value, onChange, onSubmit, submitting, error, isResubmit, onCancel,
}: {
  value: string;
  onChange: (v: string) => void;
  onSubmit: () => void;
  submitting: boolean;
  error: string;
  isResubmit?: boolean;
  onCancel?: () => void;
}) {
  return (
    <div className="bg-surface border border-hairline rounded-card p-6 shadow-sm">
      <p className="text-xs font-bold text-ink-mute uppercase tracking-widest mb-3">
        {isResubmit ? 'Update your submission' : 'Submit your result'}
      </p>
      {isResubmit && (
        <p className="text-xs text-ink-mute mb-3 leading-relaxed">
          Edit your answer below and resubmit — you'll get a fresh AI review.
        </p>
      )}
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Describe what you did, what you learned, and what happened…"
        rows={6}
        disabled={submitting}
        className="w-full text-sm border border-hairline rounded-control px-4 py-3 outline-none focus:ring-2 focus:ring-brand-200 placeholder-ink-mute resize-none disabled:bg-inset disabled:text-ink-mute"
        autoFocus={isResubmit}
      />
      {error && (
        <p className="text-xs text-red-500 mt-2">{error}</p>
      )}
      <div className="flex items-center justify-between mt-4">
        {onCancel ? (
          <button
            onClick={onCancel}
            className="text-sm text-ink-mute hover:text-ink-soft transition-colors"
          >
            Cancel
          </button>
        ) : (
          <button
            disabled
            title="Coming soon"
            className="flex items-center gap-1.5 text-xs text-ink-mute cursor-not-allowed select-none"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48" />
            </svg>
            Attach files (coming soon)
          </button>
        )}
        <button
          onClick={onSubmit}
          disabled={submitting || !value.trim()}
          className="flex items-center gap-2 bg-brand hover:bg-brand-700 active:scale-95 text-white text-sm font-semibold px-6 py-2.5 rounded-pill transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {submitting ? (
            <>
              <div className="w-4 h-4 rounded-pill border-2 border-white/30 border-t-white animate-spin" />
              Reviewing…
            </>
          ) : isResubmit ? (
            'Resubmit for AI review'
          ) : (
            'Submit for AI review'
          )}
        </button>
      </div>
    </div>
  );
}

// ─── Review card ──────────────────────────────────────────────────────────────
function ReviewCard({ review, submissionText }: { review: TaskReview; submissionText: string | null }) {
  const v = VERDICT_STYLES[review.verdict] ?? VERDICT_STYLES.good;
  return (
    <div className="flex flex-col gap-4">
      {/* §4b Debrief — rendered on top of the review for field missions */}
      {review.debrief && (
        <div className="bg-brand-50 border border-brand-200 rounded-card p-5">
          <p className="text-xs font-bold text-brand-700 uppercase tracking-widest mb-2">🧭 Mission debrief</p>
          <p className="text-sm text-ink leading-relaxed mb-3">{review.debrief.meaning}</p>
          <div className="bg-surface border border-brand-100 rounded-control px-4 py-3">
            <p className="text-[10px] font-bold text-brand-600 uppercase tracking-widest mb-1">Adjust</p>
            <p className="text-sm text-ink-soft leading-relaxed">{review.debrief.adjust}</p>
          </div>
        </div>
      )}

      {/* Score */}
      <div className={`${v.bg} border border-hairline rounded-card p-6 flex items-center gap-5`}>
        <div className="text-center min-w-[60px]">
          <span className={`text-4xl font-extrabold tabular-nums ${v.text}`}>{review.score}</span>
          <p className="text-[10px] text-ink-mute mt-0.5">/ 100</p>
        </div>
        <div>
          <span className={`text-sm font-bold ${v.text}`}>{v.label}</span>
          {review.nextStep && (
            <p className="text-xs text-ink-soft mt-1 leading-relaxed">
              <span className="font-semibold text-ink-soft">Next: </span>
              {review.nextStep}
            </p>
          )}
        </div>
      </div>

      {/* Highlights */}
      {review.highlights.length > 0 && (
        <div className="bg-surface border border-hairline rounded-card p-5 shadow-sm">
          <p className="text-xs font-bold text-accent-600 uppercase tracking-widest mb-3">What you did well</p>
          <ul className="flex flex-col gap-2">
            {review.highlights.map((h, i) => (
              <li key={i} className="flex gap-2.5 text-sm text-ink-soft leading-relaxed">
                <span className="text-accent-400 mt-0.5 flex-shrink-0">✓</span>
                {h}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Improvements */}
      {review.improvements.length > 0 && (
        <div className="bg-surface border border-hairline rounded-card p-5 shadow-sm">
          <p className="text-xs font-bold text-amber-600 uppercase tracking-widest mb-3">To strengthen</p>
          <ul className="flex flex-col gap-2">
            {review.improvements.map((imp, i) => (
              <li key={i} className="flex gap-2.5 text-sm text-ink-soft leading-relaxed">
                <span className="text-amber-400 mt-0.5 flex-shrink-0">→</span>
                {imp}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Your submission */}
      {submissionText && (
        <div className="bg-inset border border-hairline rounded-card p-5">
          <p className="text-[10px] font-bold text-ink-mute uppercase tracking-widest mb-2">Your submission</p>
          <p className="text-sm text-ink-soft leading-relaxed whitespace-pre-wrap">{submissionText}</p>
        </div>
      )}
    </div>
  );
}
