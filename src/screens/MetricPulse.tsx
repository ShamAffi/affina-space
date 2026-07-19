import { useEffect, useState } from 'react';
import { track } from '../lib/analytics';
import type { CheckIn, CheckInDraft, CheckInKeyResult, CheckInMetric, NorthStarValue } from '../types';

const SENTIMENT_CONFIG = {
  energized: { label: 'Energized', dot: 'bg-accent-400', text: 'text-accent-800', bg: 'bg-accent-50 border-accent-100' },
  steady:    { label: 'Steady',    dot: 'bg-brand-400',  text: 'text-brand-700',  bg: 'bg-brand-50 border-brand-100'   },
  struggling:{ label: 'Struggling',dot: 'bg-amber-400', text: 'text-amber-700', bg: 'bg-amber-50 border-amber-100' },
};

const KR_ICON: Record<string, string> = { win: '▲', setback: '✕', milestone: '◆' };
const KR_COLOR: Record<string, string> = {
  win:       'text-accent-600',
  setback:   'text-red-500',
  milestone: 'text-brand',
};

const CHIPS = ['📊 share a metric', '🏆 a win', '🤔 stuck on something'];

interface Props {
  email: string;
  projectName: string;
  onBack: () => void;
}

type Step = 'share' | 'loading' | 'confirm' | 'committing' | 'done';

function getRichestSeries(checkIns: CheckIn[]): { name: string; values: number[] } | null {
  const seriesMap: Record<string, number[]> = {};
  for (const ci of [...checkIns].reverse()) {
    if (!Array.isArray(ci.metrics)) continue;
    for (const m of ci.metrics as CheckInMetric[]) {
      if (!seriesMap[m.name]) seriesMap[m.name] = [];
      seriesMap[m.name].push(m.value);
    }
  }
  const entries = Object.entries(seriesMap);
  if (entries.length === 0) return null;
  const [name, values] = entries.sort((a, b) => b[1].length - a[1].length)[0];
  return { name, values };
}

export default function MetricPulse({ email, projectName, onBack }: Props) {
  const [step, setStep] = useState<Step>('share');
  const [checkIns, setCheckIns] = useState<CheckIn[]>([]);
  const [northStar, setNorthStar] = useState<NorthStarValue | null>(null);
  const [streak, setStreak] = useState(0);
  const [loading, setLoading] = useState(true);
  const [rawText, setRawText] = useState('');
  const [draft, setDraft] = useState<CheckInDraft | null>(null);
  const [editedMetrics, setEditedMetrics] = useState<CheckInMetric[]>([]);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [error, setError] = useState('');
  const [newStreak, setNewStreak] = useState(0);
  const [newTasks, setNewTasks] = useState<{ title: string }[]>([]);

  useEffect(() => {
    if (!email) return;   // gates to logged-in users; identity is the session cookie
    fetch('/api/pulse')
      .then((r) => r.json())
      .then((data) => {
        setCheckIns(Array.isArray(data.checkIns) ? data.checkIns : []);
        setNorthStar(data.northStar ?? null);
        setStreak(data.streak ?? 0);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [email]);

  const latest = checkIns[0] ?? null;

  function appendChip(chip: string) {
    const text = chip.replace(/^[^\s]+ /, '');
    setRawText((v) => (v ? v + ' ' + text + ': ' : text + ': '));
  }

  async function handleDraft() {
    if (!rawText.trim()) return;
    setStep('loading');
    setError('');
    try {
      const r = await fetch('/api/pulse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'draft', rawText }),
      });
      if (r.status === 429) {
        setError("You're going a bit fast — give it a moment, then try again.");
        setStep('share');
        return;
      }
      if (!r.ok) throw new Error('draft failed');
      const data: CheckInDraft = await r.json();
      setDraft(data);
      setEditedMetrics(data.metrics ?? []);
      setStep('confirm');
    } catch {
      setError('Something went wrong — please try again.');
      setStep('share');
    }
  }

  async function handleCommit() {
    if (!draft) return;
    setStep('committing');
    try {
      const r = await fetch('/api/pulse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'commit', rawText, confirmedMetrics: editedMetrics, draft }),
      });
      const data = await r.json();
      track('checkin_committed');
      setNewStreak(data.streak ?? 0);
      setNewTasks(draft.tasks?.slice(0, 3) ?? []);
      fetch('/api/pulse')
        .then((r) => r.json())
        .then((d) => {
          setCheckIns(Array.isArray(d.checkIns) ? d.checkIns : []);
          setNorthStar(d.northStar ?? null);
        })
        .catch(() => {});
      setStep('done');
    } catch {
      setError('Failed to save — please try again.');
      setStep('confirm');
    }
  }

  // Sparkline data
  const sparkInfo = (() => {
    if (northStar) {
      const values = [...checkIns].reverse().map((c) => {
        if (!Array.isArray(c.metrics)) return null;
        const m = (c.metrics as CheckInMetric[]).find(
          (m) => m.name.toLowerCase().includes(northStar.key.toLowerCase()) ||
                 m.name.toLowerCase().includes(northStar.label.toLowerCase()),
        );
        return m ? m.value : null;
      }).filter((v): v is number => v !== null);
      return values.length >= 2 ? { name: northStar.label, values } : null;
    }
    const richest = getRichestSeries(checkIns);
    return richest && richest.values.length >= 2 ? richest : null;
  })();

  return (
    <div className="min-h-screen bg-canvas">
      <header className="bg-surface border-b border-hairline flex items-center gap-3 px-4 sm:px-6 py-4 sticky top-0 z-30">
        <button
          onClick={step === 'confirm' ? () => setStep('share') : onBack}
          className="flex items-center gap-1.5 text-ink-soft hover:text-ink transition-colors"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          <span className="text-sm font-medium">{step === 'confirm' ? 'Edit' : 'Dashboard'}</span>
        </button>
        <span className="text-ink-mute">|</span>
        <span className="text-sm font-bold text-ink">Metric Pulse</span>
        {streak > 0 && (
          <span className="ml-auto flex items-center gap-1 text-xs font-bold text-amber-600 bg-amber-50 border border-amber-100 rounded-pill px-2.5 py-1">
            🔥 {streak} week{streak !== 1 ? 's' : ''}
          </span>
        )}
      </header>

      <main className="max-w-xl mx-auto px-4 py-8">
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 rounded-pill border-2 border-brand-200 border-t-brand-600 animate-spin" />
          </div>
        ) : (
          <>
            {/* ── SHARE step ──────────────────────────────────────── */}
            {(step === 'share' || step === 'loading') && (
              <div className="space-y-5">
                {/* North Star status banner */}
                {!northStar && (
                  <div className="bg-brand-50 border border-brand-100 rounded-card px-5 py-4 flex items-start gap-3">
                    <span className="text-lg mt-0.5">⭐</span>
                    <div>
                      <p className="text-sm font-bold text-brand-700">Your North Star comes later in the course</p>
                      <p className="text-xs text-brand-600 mt-0.5 leading-relaxed">
                        For now I track everything you mention. You'll choose your one key metric in Module 5.
                      </p>
                    </div>
                  </div>
                )}

                {/* Share card */}
                <div className="bg-surface border border-hairline rounded-card p-6 shadow-sm">
                  <p className="text-[11px] font-bold text-ink-mute uppercase tracking-widest mb-1">
                    Week check-in
                  </p>
                  <h2 className="text-xl font-bold text-ink mb-1">
                    How was your week{projectName ? `, ${projectName}` : ''}?
                  </h2>
                  {northStar && (
                    <p className="text-xs text-ink-mute mb-2">
                      North Star: <span className="font-semibold text-brand">{northStar.label}</span>
                    </p>
                  )}
                  {latest && (
                    <p className="text-xs text-ink-mute mb-4">
                      Last week: <span className="text-ink-soft">"{latest.headline}"</span>
                    </p>
                  )}

                  <textarea
                    value={rawText}
                    onChange={(e) => setRawText(e.target.value)}
                    placeholder={northStar
                      ? `How did ${northStar.label} move this week? Any wins or blockers?`
                      : 'What happened this week? Wins, numbers, blockers — whatever\'s on your mind.'}
                    rows={5}
                    className="w-full text-sm border border-hairline focus:border-brand-200 focus:ring-2 focus:ring-brand-50 rounded-control px-4 py-3 outline-none resize-none transition placeholder-ink-mute"
                  />

                  <div className="flex flex-wrap gap-2 mt-3 mb-4">
                    {CHIPS.map((chip) => (
                      <button
                        key={chip}
                        onClick={() => appendChip(chip)}
                        className="text-xs bg-inset border border-hairline text-ink-soft hover:bg-brand-50 hover:border-brand-200 hover:text-brand rounded-pill px-3 py-1 transition-colors"
                      >
                        {chip}
                      </button>
                    ))}
                  </div>

                  {error && <p className="text-xs text-red-500 mb-3">{error}</p>}

                  <button
                    onClick={handleDraft}
                    disabled={!rawText.trim() || step === 'loading'}
                    className="w-full bg-brand hover:bg-brand-700 disabled:opacity-40 text-white text-sm font-semibold py-3 rounded-pill transition-all active:scale-95"
                  >
                    {step === 'loading' ? 'Analyzing…' : 'Analyze with AI →'}
                  </button>
                </div>
              </div>
            )}

            {/* ── CONFIRM step ────────────────────────────────────── */}
            {step === 'confirm' && draft && (
              <div className="space-y-4">
                <div className={`border rounded-card p-6 shadow-sm ${SENTIMENT_CONFIG[draft.sentiment]?.bg ?? 'bg-surface border-hairline'}`}>
                  <div className="flex items-center gap-2 mb-3">
                    <span className={`text-[10px] font-bold uppercase tracking-widest ${SENTIMENT_CONFIG[draft.sentiment]?.text ?? 'text-ink-soft'}`}>
                      {SENTIMENT_CONFIG[draft.sentiment]?.label ?? draft.sentiment}
                    </span>
                    <span className={`w-2 h-2 rounded-pill ${SENTIMENT_CONFIG[draft.sentiment]?.dot ?? 'bg-ink-mute'}`} />
                  </div>
                  <h2 className="text-lg font-bold text-ink mb-4 leading-snug">{draft.headline}</h2>

                  <div className="space-y-2">
                    {draft.keyResults.map((kr, i) => (
                      <div key={i} className="flex items-start gap-2">
                        <span className={`text-xs font-bold mt-0.5 flex-shrink-0 ${KR_COLOR[kr.type]}`}>
                          {KR_ICON[kr.type]}
                        </span>
                        <div>
                          <span className="text-sm text-ink">{kr.text}</span>
                          {kr.metric && (
                            <span className="ml-2 text-xs font-mono text-ink-mute">{kr.metric}</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-brand-50 border border-brand-100 rounded-card px-5 py-4">
                  <p className="text-[10px] font-bold text-brand-600 uppercase tracking-widest mb-1">Mentor note</p>
                  <p className="text-sm text-brand-800 leading-relaxed">{draft.mentorNote}</p>
                </div>

                {editedMetrics.length > 0 && (
                  <div className="bg-surface border border-hairline rounded-card p-5 shadow-sm">
                    <p className="text-[11px] font-bold text-ink-mute uppercase tracking-widest mb-3">
                      Confirm numbers
                      {northStar && (
                        <span className="ml-2 text-brand-600 normal-case">· {northStar.label} highlighted</span>
                      )}
                    </p>
                    <div className="space-y-2">
                      {editedMetrics.map((m, i) => {
                        const isNorthStar = northStar &&
                          (m.name.toLowerCase().includes(northStar.key.toLowerCase()) ||
                           m.name.toLowerCase().includes(northStar.label.toLowerCase()));
                        return (
                          <div key={i} className={`flex items-center gap-3 rounded-control px-3 py-1.5 -mx-3 ${isNorthStar ? 'bg-brand-50' : ''}`}>
                            <span className={`text-sm flex-1 min-w-0 truncate ${isNorthStar ? 'font-semibold text-brand-700' : 'text-ink-soft'}`}>
                              {m.name}{isNorthStar ? ' ⭐' : ''}
                            </span>
                            <input
                              type="number"
                              value={m.value}
                              onChange={(e) => {
                                const val = Number(e.target.value);
                                setEditedMetrics((prev) =>
                                  prev.map((x, j) =>
                                    j === i
                                      ? { ...x, value: val, delta: checkIns[0]?.metrics
                                          ? val - ((checkIns[0].metrics as CheckInMetric[]).find((p) => p.name === x.name)?.value ?? val)
                                          : x.delta }
                                      : x,
                                  ),
                                );
                              }}
                              className="w-24 text-sm text-right border border-hairline rounded-control px-3 py-1.5 outline-none focus:ring-2 focus:ring-brand-200"
                            />
                            <span className={`text-xs font-semibold w-16 text-right ${m.delta > 0 ? 'text-accent-600' : m.delta < 0 ? 'text-red-500' : 'text-ink-mute'}`}>
                              {m.delta > 0 ? `+${m.delta}` : m.delta < 0 ? `${m.delta}` : '—'}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {error && <p className="text-xs text-red-500">{error}</p>}

                <button
                  onClick={handleCommit}
                  className="w-full bg-ink hover:bg-ink text-white text-sm font-semibold py-3.5 rounded-pill transition-all active:scale-95"
                >
                  Looks good — log this week →
                </button>
              </div>
            )}

            {/* ── DONE step ───────────────────────────────────────── */}
            {step === 'done' && (
              <div className="space-y-4 text-center">
                <div className="bg-surface border border-hairline rounded-card p-8 shadow-sm">
                  <div className="w-12 h-12 rounded-pill bg-accent-100 flex items-center justify-center mx-auto mb-4">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#0F9D74" strokeWidth="2.5">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </div>
                  <h2 className="text-xl font-bold text-ink mb-1">Week logged</h2>
                  {newStreak > 0 && (
                    <p className="text-sm text-amber-600 font-semibold mb-4">
                      🔥 {newStreak} week{newStreak !== 1 ? 's' : ''} in a row
                    </p>
                  )}
                  {newTasks.length > 0 && (
                    <div className="text-left mt-4">
                      <p className="text-[11px] font-bold text-ink-mute uppercase tracking-widest mb-2">
                        Tasks created
                      </p>
                      <div className="space-y-1">
                        {newTasks.map((t, i) => (
                          <div key={i} className="flex items-center gap-2 text-sm text-ink-soft">
                            <span className="w-1.5 h-1.5 rounded-pill bg-brand-600 flex-shrink-0" />
                            {t.title}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                <button
                  onClick={onBack}
                  className="w-full bg-brand hover:bg-brand-700 text-white text-sm font-semibold py-3 rounded-pill transition-all active:scale-95"
                >
                  Back to Dashboard
                </button>
              </div>
            )}

            {/* ── Loading overlay ──────────────────────────────────── */}
            {(step === 'loading' || step === 'committing') && (
              <div className="fixed inset-0 z-50 bg-canvas/90 backdrop-blur-sm flex flex-col items-center justify-center gap-6">
                <div className="w-16 h-16 rounded-pill bg-brand animate-orb-pulse" />
                <p className="text-sm font-semibold text-ink-soft tracking-wide">
                  {step === 'loading' ? 'Analyzing your week…' : 'Saving your check-in…'}
                </p>
              </div>
            )}

            {/* ── Sparkline ───────────────────────────────────────── */}
            {sparkInfo && (
              <div className="mt-6 bg-surface border border-hairline rounded-card p-5 shadow-sm">
                <p className="text-[11px] font-bold text-ink-mute uppercase tracking-widest mb-3">
                  {northStar ? `${sparkInfo.name} — north star` : `${sparkInfo.name} — trending`}
                </p>
                <Sparkline values={sparkInfo.values} />
                <div className="flex justify-between mt-1">
                  <span className="text-xs text-ink-mute">{sparkInfo.values[0]}</span>
                  <span className="text-xs font-bold text-ink-soft">{sparkInfo.values[sparkInfo.values.length - 1]}</span>
                </div>
              </div>
            )}

            {/* ── Past check-ins ───────────────────────────────────── */}
            {checkIns.length > 0 && step !== 'loading' && step !== 'committing' && (
              <div className="mt-6">
                <h3 className="text-[11px] font-bold text-ink-mute uppercase tracking-widest mb-3">
                  Past check-ins
                </h3>
                <div className="flex flex-col gap-2">
                  {checkIns.map((ci) => (
                    <CheckInCard
                      key={ci.id}
                      checkIn={ci}
                      expanded={expandedId === ci.id}
                      onToggle={() => setExpandedId((v) => (v === ci.id ? null : ci.id))}
                    />
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}

// ── Sparkline ────────────────────────────────────────────────────────────────
function Sparkline({ values }: { values: number[] }) {
  const w = 280, h = 48, pad = 4;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const pts = values.map((v, i) => {
    const x = pad + (i / (values.length - 1)) * (w - pad * 2);
    const y = h - pad - ((v - min) / range) * (h - pad * 2);
    return `${x},${y}`;
  });
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full" style={{ height: h }}>
      <polyline points={pts.join(' ')} fill="none" stroke="#6D28D9" strokeWidth="2" strokeLinejoin="round" />
      {pts.map((pt, i) => {
        const [x, y] = pt.split(',').map(Number);
        return <circle key={i} cx={x} cy={y} r="3" fill="#6D28D9" />;
      })}
    </svg>
  );
}

// ── CheckIn card ─────────────────────────────────────────────────────────────
function CheckInCard({
  checkIn: ci,
  expanded,
  onToggle,
}: {
  checkIn: CheckIn;
  expanded: boolean;
  onToggle: () => void;
}) {
  const sc = ci.sentiment ? SENTIMENT_CONFIG[ci.sentiment] : null;
  const krs = (ci.keyResults as CheckInKeyResult[] | null) ?? [];
  const metrics = (ci.metrics as CheckInMetric[] | null) ?? [];

  return (
    <div className="bg-surface border border-hairline rounded-card shadow-sm overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full text-left px-5 py-4 hover:bg-inset transition-colors"
      >
        <div className="flex items-start gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-bold text-ink-mute">
                {formatWeekOf(ci.weekOf)}
              </span>
              {sc && (
                <span className={`flex items-center gap-1 text-[10px] font-bold ${sc.text}`}>
                  <span className={`w-1.5 h-1.5 rounded-pill ${sc.dot}`} />
                  {sc.label}
                </span>
              )}
            </div>
            <p className="text-sm font-semibold text-ink leading-snug">{ci.headline}</p>
            {metrics.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-1.5">
                {metrics.slice(0, 3).map((m, i) => (
                  <span key={i} className="text-[10px] font-mono text-ink-soft">
                    {m.name} {m.value}{m.delta !== 0 ? ` (${m.delta > 0 ? '+' : ''}${m.delta})` : ''}
                  </span>
                ))}
              </div>
            )}
          </div>
          <svg
            width="14" height="14"
            viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
            className={`flex-shrink-0 mt-1 text-ink-mute transition-transform ${expanded ? 'rotate-180' : ''}`}
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </div>
      </button>

      {expanded && (
        <div className="px-5 pb-5 border-t border-hairline pt-4 space-y-3">
          {krs.length > 0 && (
            <div className="space-y-1.5">
              {krs.map((kr, i) => (
                <div key={i} className="flex items-start gap-2">
                  <span className={`text-xs font-bold mt-0.5 flex-shrink-0 ${KR_COLOR[kr.type]}`}>
                    {KR_ICON[kr.type]}
                  </span>
                  <span className="text-sm text-ink-soft">{kr.text}</span>
                </div>
              ))}
            </div>
          )}
          {ci.mentorNote && (
            <div className="bg-brand-50 rounded-control px-4 py-3">
              <p className="text-xs text-brand-700 leading-relaxed">{ci.mentorNote}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function formatWeekOf(weekOf: string): string {
  try {
    const d = new Date(weekOf + 'T00:00:00');
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  } catch {
    return weekOf;
  }
}
