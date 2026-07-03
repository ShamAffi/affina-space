import { useState, useCallback, useEffect, useRef } from 'react';
import { MODULES, QUESTIONS } from '../data';
import type { UserData, Lesson, AiFeedback, CompareResult, BrainEntry, NorthStarSuggestion, NorthStarCandidate, BlockKind, StartupSnapshot, MentorSessionId, MentorSessionsState, MarketResearchReport } from '../types';
import { blockKind } from '../types';
import MentorSessionModal from '../components/MentorSessionModal';
import MarketResearchView from '../components/MarketResearchView';
import { saveLessonInputToDB, toggleLessonCompleteToDB, syncUserToDB, loadProgressFromDB } from '../store';
import ProfileButton from '../components/ProfileButton';
import AccountPanel from '../components/AccountPanel';
import DocumentsPanel from '../components/DocumentsPanel';
import FeedbackCard from '../components/FeedbackCard';
import CompareCard from '../components/CompareCard';

// Block-kind chips (§5 LMS sidebar): label + tint per kind. Theory renders no chip.
const KIND_CHIP: Partial<Record<BlockKind, { label: string; cls: string }>> = {
  exercise:       { label: 'Exercise', cls: 'bg-brand-50 text-brand-700' },
  field:          { label: 'Field',    cls: 'bg-amber-50 text-amber-700' },
  premium:        { label: 'Premium',  cls: 'bg-accent-50 text-accent-800' },
  system:         { label: 'System',   cls: 'bg-inset text-ink-soft' },
  mentor_session: { label: 'Session',  cls: 'bg-brand-100 text-brand-800' },
};

interface Props {
  userData: UserData;
  onUpdateUserData: (updates: Partial<UserData>) => void;
  onGoToDashboard: () => void;
  onLogout: () => void;
  initialLessonId?: string;
  onActiveLessonChange?: (lessonId: string) => void;
  onGoToTasks?: () => void;
}

const allLessons: Lesson[] = MODULES.flatMap((m) => m.lessons);

export default function LMS({ userData, onUpdateUserData, onGoToDashboard, onLogout, initialLessonId, onActiveLessonChange, onGoToTasks }: Props) {
  const [activeLessonId, setActiveLessonId] = useState<string>(() => {
    if (initialLessonId) return initialLessonId;
    const first = allLessons.find((l) => !userData.completedLessons.includes(l.id));
    return first?.id ?? allLessons[0].id;
  });
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [inputDraft, setInputDraft] = useState<Record<string, string>>({});

  // Profile
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [panel, setPanel] = useState<'none' | 'account' | 'documents'>('none');
  const [avatarPing, setAvatarPing] = useState(false);

  // Save animation
  const [saveAnimLesson, setSaveAnimLesson] = useState<string | null>(null);
  // AI feedback state machine
  const [savingLesson, setSavingLesson] = useState<string | null>(null);
  const [feedbackByLesson, setFeedbackByLesson] = useState<Record<string, AiFeedback & { previousScore?: number }>>({});
  const [compareByLesson, setCompareByLesson] = useState<Record<string, CompareResult>>({});
  const [refiningLesson, setRefiningLesson] = useState<string | null>(null);
  // §6.5 mentor sessions
  const [openSession, setOpenSession] = useState<MentorSessionId | null>(null);
  const [sessionsState, setSessionsState] = useState<MentorSessionsState>({});
  // §4 Delegate — Try → Review → Delegate
  const [delegating, setDelegating] = useState<string | null>(null);
  const [delegateOpen, setDelegateOpen] = useState<string | null>(null);
  const [pendingDrafts, setPendingDrafts] = useState<Record<string, { userDraft: string; aiDraft: string }>>({});
  // Mode B: variant cards to pick from · Mode C: read-only analysis (never touches her field)
  const [pendingVariants, setPendingVariants] = useState<Record<string, { userDraft: string; variants: { label: string; text: string }[] }>>({});
  const [analysisByLesson, setAnalysisByLesson] = useState<Record<string, { for: string[]; against: string[]; recommendation: string }>>({});
  const [clarifyByLesson, setClarifyByLesson] = useState<Record<string, string>>({});
  // 🟢 m2l6 Market Research (test mode)
  const [researchReport, setResearchReport] = useState<MarketResearchReport | null>(null);
  const [researchQuestions, setResearchQuestions] = useState<{ id: string; q: string }[] | null>(null);
  const [researchAnswers, setResearchAnswers] = useState<Record<string, string>>({});
  const [researchLoading, setResearchLoading] = useState(false);
  const [researchOpen, setResearchOpen] = useState(false);
  const [researchError, setResearchError] = useState('');
  // M0 redesign: после квиза Step 4 снапшот стартует сам (§2 "Generating your Snapshot…")
  const [autoSnapshot, setAutoSnapshot] = useState(false);

  const [progressLoading, setProgressLoading] = useState(true);
  const mainRef = useRef<HTMLElement>(null);

  // On lesson change: sync the URL and scroll the lesson pane back to the top
  // (long lessons / mentor reviews otherwise leave you mid-page on the next one).
  useEffect(() => {
    onActiveLessonChange?.(activeLessonId);
    mainRef.current?.scrollTo({ top: 0 });
    window.scrollTo(0, 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeLessonId]);

  // On mount: sync user to DB, load progress, and restore AI feedback from brain entries
  useEffect(() => {
    syncUserToDB(userData);
    if (!userData.email) { setProgressLoading(false); return; }

    const enc = encodeURIComponent(userData.email);

    Promise.all([
      loadProgressFromDB(userData.email),
      fetch(`/api/brain?email=${enc}`).then((r) => r.json()).catch(() => []),
    ]).then(([dbProgress, brainData]) => {
      if (dbProgress) {
        const ms = (dbProgress as { mentorSessions?: MentorSessionsState }).mentorSessions;
        if (ms) setSessionsState(ms);
        const merged = {
          completedLessons: [
            ...new Set([...userData.completedLessons, ...dbProgress.completedLessons]),
          ],
          lessonInputs: { ...userData.lessonInputs, ...dbProgress.lessonInputs },
        };
        onUpdateUserData(merged);
        if (!initialLessonId) {
          const first = allLessons.find((l) => !merged.completedLessons.includes(l.id));
          if (first) setActiveLessonId(first.id);
        }
      }

      // Restore AI feedback cards from persisted brain entries
      if (Array.isArray(brainData)) {
        const feedbackMap: Record<string, AiFeedback & { previousScore?: number }> = {};
        const compareMap: Record<string, CompareResult> = {};
        for (const entry of brainData as BrainEntry[]) {
          if (entry.entryType === 'market_research') {
            try { setResearchReport(JSON.parse(entry.content) as MarketResearchReport); } catch { /* skip */ }
            continue;
          }
          if (!entry.aiFeedback) continue;
          try {
            const parsed = JSON.parse(entry.aiFeedback);
            if (Array.isArray(parsed.candidates)) {
              compareMap[entry.lessonId] = parsed as CompareResult;
            } else if ('good' in parsed || typeof parsed.score === 'number') {
              feedbackMap[entry.lessonId] = parsed as AiFeedback;
            }
          } catch { /* malformed JSON — skip */ }
        }
        if (Object.keys(feedbackMap).length > 0) setFeedbackByLesson(feedbackMap);
        if (Object.keys(compareMap).length > 0) setCompareByLesson(compareMap);
      }

      setProgressLoading(false);
    });
  }, []);

  // Fallback to the first lesson for stale deep-links (old lesson IDs from before Program v2).
  const activeLesson = allLessons.find((l) => l.id === activeLessonId) ?? allLessons[0];
  const activeLessonIdx = allLessons.findIndex((l) => l.id === activeLesson.id);
  const nextLesson = allLessons[activeLessonIdx + 1];
  const isCompleted = userData.completedLessons.includes(activeLessonId);
  const activeModule = MODULES.find((m) => m.lessons.some((l) => l.id === activeLesson.id));
  const activeKind = blockKind(activeLesson);

  function isModuleLocked(modIdx: number): boolean {
    if (modIdx === 0) return false;
    return !MODULES[modIdx - 1].lessons.every((l) =>
      userData.completedLessons.includes(l.id),
    );
  }

  function getInputValue(lessonId: string): string {
    const stored = inputDraft[lessonId] ?? userData.lessonInputs[lessonId];
    if (stored !== undefined && stored !== '') return stored;
    // M0 intake (§6.1): prefill the draft from onboarding answers.
    const lesson = allLessons.find((l) => l.id === lessonId);
    if (lesson?.prefillFrom === 'onboarding') {
      return `What I'm building: ${userData.idea || '…'}
Customer: ${userData.customer || '…'}
Business model: ${userData.businessModel || '…'}
Stage today: ${userData.stage || '…'}
Big goal: ${userData.goal || '…'}

What I've already done: …
Hours per week I can commit: …
My motivation & 12-week goal: …`;
    }
    return '';
  }

  function handleSaveInput(lessonId: string, contentOverride?: string) {
    const val = contentOverride ?? getInputValue(lessonId);
    if (!val.trim()) return;
    if (contentOverride !== undefined) {
      setInputDraft((d) => ({ ...d, [lessonId]: contentOverride }));
    }

    // §4 — if this save came out of a Delegate choice, persist both drafts alongside
    const drafts = pendingDrafts[lessonId];
    onUpdateUserData({ lessonInputs: { ...userData.lessonInputs, [lessonId]: val } });
    saveLessonInputToDB(userData.email, lessonId, val, drafts);
    if (drafts) setPendingDrafts((p) => { const n = { ...p }; delete n[lessonId]; return n; });

    // doc-fly + avatar ping
    setSaveAnimLesson(lessonId);
    setAvatarPing(true);
    setTimeout(() => setSaveAnimLesson(null), 750);
    setTimeout(() => setAvatarPing(false), 1350);

    const oldScore = feedbackByLesson[lessonId]?.score ?? undefined;
    setRefiningLesson(null);

    // After doc-fly: show spinner, call Claude
    setTimeout(() => {
      setSavingLesson(lessonId);

      const lesson = allLessons.find((l) => l.id === lessonId)!;
      const isCompare = lesson.aiMode === 'compare';
      fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: userData.email,
          lessonId,
          lessonTitle: lesson.title,
          prompt: lesson.inputPrompt ?? '',
          answer: val,
          aiMode: lesson.aiMode ?? 'feedback',
          context: {
            name: userData.name,
            idea: userData.idea,
            customer: userData.customer,
            stage: userData.stage,
          },
        }),
      })
        .then((r) => {
          if (!r.ok) throw new Error('api error');
          return r.json();
        })
        .then((data) => {
          setSavingLesson(null);
          if (isCompare) {
            setCompareByLesson((prev) => ({ ...prev, [lessonId]: data as CompareResult }));
          } else {
            setFeedbackByLesson((prev) => ({
              ...prev,
              [lessonId]: { ...(data as AiFeedback), previousScore: oldScore },
            }));
          }
        })
        .catch(() => setSavingLesson(null));
    }, 750);
  }

  // 🟢 m2l6 — generate the test-mode research (or receive clarifying questions §1.2a)
  function handleGenerateResearch(answers?: Record<string, string>) {
    setResearchLoading(true);
    setResearchError('');
    fetch('/api/brain', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'market-research', email: userData.email, ...(answers ? { answers } : {}) }),
    })
      .then((r) => { if (!r.ok) throw new Error('api'); return r.json(); })
      .then((d: { report?: MarketResearchReport; questions?: { id: string; q: string }[] }) => {
        if (d.report) {
          setResearchReport(d.report);
          setResearchQuestions(null);
          setResearchAnswers({});
          setResearchOpen(true);
        } else if (d.questions) {
          setResearchQuestions(d.questions);
        }
      })
      .catch(() => setResearchError('Something went wrong — try again.'))
      .finally(() => setResearchLoading(false));
  }

  // §4 Delegate — RULES §2.2 modes: A one draft (gate: ≥1 attempt) · B variants (gate: ≥1 attempt)
  // · C analysis-only (no gate — it exists to inform the decision BEFORE she writes it).
  function handleDelegate(lessonId: string) {
    const lesson = allLessons.find((l) => l.id === lessonId)!;
    const dMode = lesson.delegateMode ?? 'A';
    const userText = getInputValue(lessonId);
    setDelegating(lessonId);
    fetch('/api/ai', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        mode: 'delegate',
        delegateMode: dMode,
        email: userData.email,
        lessonId,
        lessonTitle: lesson.title,
        prompt: lesson.inputPrompt ?? '',
      }),
    })
      .then((r) => { if (!r.ok) throw new Error('api'); return r.json(); })
      .then((data: { aiDraft?: string; variants?: { label: string; text: string }[]; analysis?: { for: string[]; against: string[]; recommendation: string }; question?: string }) => {
        if (data.question) {
          // §2.1 no-fabrication: the AI needs one answer from her before drafting
          setClarifyByLesson((p) => ({ ...p, [lessonId]: data.question! }));
        } else if (dMode === 'C' && data.analysis) {
          // Mode C: analysis panel only — her decision field is NEVER pre-filled
          setAnalysisByLesson((p) => ({ ...p, [lessonId]: data.analysis! }));
        } else if (dMode === 'B' && data.variants) {
          setPendingVariants((p) => ({ ...p, [lessonId]: { userDraft: userText, variants: data.variants! } }));
          setDelegateOpen(lessonId);
        } else if (data.aiDraft) {
          setPendingDrafts((p) => ({ ...p, [lessonId]: { userDraft: userText, aiDraft: data.aiDraft! } }));
          setDelegateOpen(lessonId);
        }
      })
      .catch(() => { /* silent — button stays available */ })
      .finally(() => setDelegating(null));
  }

  function openLesson(id: string) {
    setActiveLessonId(id);
    setSidebarOpen(false);
    setSavingLesson(null);
    setRefiningLesson(null);
    setDelegateOpen(null);
    setDelegating(null);
  }

  const handleToggleMenu = useCallback(() => setProfileMenuOpen((v) => !v), []);

  if (progressLoading) {
    return (
      <div className="min-h-screen bg-canvas flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 rounded-pill border-2 border-brand border-t-transparent animate-spin" />
          <p className="text-sm text-ink-mute font-medium">Loading your progress…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-canvas flex flex-col">
      {/* Top bar */}
      <header className="bg-surface border-b border-hairline flex items-center gap-3 px-4 sm:px-6 py-4 sticky top-0 z-30">
        <button
          onClick={() => setSidebarOpen((v) => !v)}
          className="md:hidden w-9 h-9 flex items-center justify-center rounded-control hover:bg-inset text-ink-soft transition"
          aria-label="Toggle menu"
        >
          {sidebarOpen ? (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          )}
        </button>

        <button
          onClick={onGoToDashboard}
          className="text-brand-700 font-bold text-lg tracking-tight hover:opacity-70 transition-opacity"
        >
          Affina<span className="text-ink">Space</span>
        </button>

        <div className="hidden sm:flex items-center gap-1.5 ml-2 text-sm text-ink-mute">
          <span>/</span>
          <span className="text-ink-soft font-medium">{activeModule?.title}</span>
          <span>/</span>
          <span className="text-ink-soft truncate max-w-[180px]">{activeLesson.title}</span>
        </div>

        <div className="ml-auto flex items-center gap-3">
          {/* Profile avatar */}
          <ProfileButton
            avatarPing={avatarPing}
            menuOpen={profileMenuOpen}
            onToggleMenu={handleToggleMenu}
            onAccount={() => setPanel('account')}
            onDocuments={() => setPanel('documents')}
            onLogout={onLogout}
          />
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden relative">
        {/* Mobile overlay */}
        {sidebarOpen && (
          <div className="fixed inset-0 bg-black/30 z-20 md:hidden" onClick={() => setSidebarOpen(false)} />
        )}

        {/* Sidebar */}
        <aside
          className={`
            fixed md:static top-0 left-0 h-full md:h-auto z-20 md:z-auto
            w-72 md:w-72 bg-surface border-r border-hairline
            transform transition-transform duration-300
            ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
            overflow-y-auto flex-shrink-0 pt-16 md:pt-0
          `}
        >
          <div className="p-4">
            <p className="text-xs font-bold text-ink-mute uppercase tracking-widest px-2 mb-4">Program</p>

            {MODULES.map((mod, modIdx) => {
              const locked = isModuleLocked(modIdx);
              const modCompleted = mod.lessons.filter((l) =>
                userData.completedLessons.includes(l.id),
              ).length;

              return (
                <div key={mod.id} className="mb-6">
                  <div className="flex items-center gap-2 px-2 mb-2">
                    <span className={`text-xs font-bold rounded-md px-1.5 py-0.5 ${locked ? 'text-ink-mute bg-inset' : 'text-brand-600 bg-brand-50'}`}>
                      {String(mod.order).padStart(2, '0')}
                    </span>
                    <span className={`text-sm font-semibold flex-1 ${locked ? 'text-ink-mute' : 'text-ink'}`}>
                      {mod.title}
                    </span>
                    {mod.paid && (
                      <span className="text-[9px] font-bold bg-accent-50 text-accent-800 rounded-pill px-1.5 py-0.5" title="Premium module (not enforced yet)">
                        ✦
                      </span>
                    )}
                    {locked ? (
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#9D9DA6" strokeWidth="2">
                        <rect x="3" y="11" width="18" height="11" rx="2" />
                        <path d="M7 11V7a5 5 0 0110 0v4" />
                      </svg>
                    ) : (
                      <span className="text-xs text-ink-mute">{modCompleted}/{mod.lessons.length}</span>
                    )}
                  </div>

                  <div className="flex flex-col gap-0.5">
                    {mod.lessons.map((lesson) => {
                      const done = userData.completedLessons.includes(lesson.id);
                      const active = lesson.id === activeLessonId;

                      return (
                        <button
                          key={lesson.id}
                          onClick={() => !locked && openLesson(lesson.id)}
                          disabled={locked}
                          className={`w-full text-left flex items-start gap-2.5 px-3 py-2.5 rounded-control text-sm transition-all duration-150 ${
                            locked
                              ? 'text-ink-mute cursor-not-allowed'
                              : active
                                ? 'bg-brand-50 text-brand-700 font-medium'
                                : 'text-ink-soft hover:bg-inset hover:text-ink'
                          }`}
                        >
                          <span className={`flex-shrink-0 w-5 h-5 rounded-pill border-2 flex items-center justify-center mt-0.5 text-xs transition-all ${
                            done ? 'bg-brand border-brand text-white' :
                            active ? 'border-brand-600' :
                            locked ? 'border-hairline' : 'border-hairline'
                          }`}>
                            {done ? '✓' : ''}
                          </span>
                          <span className="leading-snug flex-1">
                            {lesson.title}
                            {(() => {
                              const chip = KIND_CHIP[blockKind(lesson)];
                              return chip ? (
                                <span className={`ml-1.5 inline-block align-middle text-[9px] font-bold rounded-pill px-1.5 py-px ${chip.cls}`}>
                                  {chip.label}
                                </span>
                              ) : null;
                            })()}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  {/* 📅 §6.5 — mentor session marker after M4/M9/M12; locked until its module is complete */}
                  {mod.mentorSessionAfter && (() => {
                    const sessionUnlocked = mod.lessons.every((l) => userData.completedLessons.includes(l.id));
                    return (
                      <button
                        onClick={() => sessionUnlocked && setOpenSession(mod.mentorSessionAfter!)}
                        disabled={!sessionUnlocked}
                        title={sessionUnlocked ? undefined : `Unlocks after Module ${mod.order} is complete`}
                        className={`mt-1 w-full flex items-center gap-2 px-3 py-2 rounded-control text-xs font-semibold transition-colors ${
                          sessionUnlocked
                            ? 'text-brand-700 bg-brand-50 hover:bg-brand-100'
                            : 'text-ink-mute bg-inset cursor-not-allowed'
                        }`}
                      >
                        <span>📅</span>
                        Mentor Session {mod.mentorSessionAfter}
                        {sessionUnlocked ? (
                          sessionsState[mod.mentorSessionAfter!]?.completed && <span className="ml-auto text-accent-600">✓ done</span>
                        ) : (
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#9D9DA6" strokeWidth="2.5" className="ml-auto flex-shrink-0">
                            <rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0110 0v4" />
                          </svg>
                        )}
                      </button>
                    );
                  })()}
                </div>
              );
            })}
          </div>
        </aside>

        {/* Lesson content */}
        <main ref={mainRef} className="flex-1 overflow-y-auto">
          <div className="max-w-2xl mx-auto px-5 sm:px-8 py-10 animate-fade-in" key={activeLessonId}>
            <div className="flex items-center gap-2 mb-6">
              <span className="text-xs font-semibold text-brand-600 bg-brand-50 rounded-pill px-3 py-1">
                {activeModule?.title}
              </span>
              {(() => {
                const chip = KIND_CHIP[activeKind];
                return chip ? (
                  <span className={`text-xs font-semibold rounded-pill px-3 py-1 ${chip.cls}`}>
                    {activeKind === 'field' ? 'Field mission' : chip.label}
                  </span>
                ) : null;
              })()}
            </div>

            <h1 className="text-2xl sm:text-3xl font-bold text-ink mb-6 leading-snug">
              {activeLesson.title}
            </h1>

            {activeLesson.media && (
              <div className="w-full h-48 bg-inset rounded-card flex items-center justify-center text-ink-mute mb-6 border border-hairline">
                <span className="text-sm">{activeLesson.media.kind === 'video' ? '▶ Video' : '🖼 Image'}</span>
              </div>
            )}

            <p className="text-ink-soft text-base sm:text-lg leading-relaxed mb-8">
              {activeLesson.body}
            </p>

            {/* Field mission (🟡) — the artifact lives in the Tasks hub (§5) */}
            {activeKind === 'field' && (
              <div className="bg-amber-50 border border-amber-100 rounded-card p-5 mb-8">
                <p className="text-sm font-bold text-amber-800 mb-1">🟡 This is a real-world mission</p>
                <p className="text-xs text-amber-700 leading-relaxed mb-4">
                  You do this one out in the world — the platform gives you the mission card, the artifact
                  form, and an AI debrief. It only counts when you submit the artifact.
                </p>
                {onGoToTasks && (
                  <button
                    onClick={onGoToTasks}
                    className="bg-brand hover:bg-brand-700 active:scale-95 text-white text-sm font-semibold px-5 py-2.5 rounded-pill transition-all duration-150"
                  >
                    Open in Tasks →
                  </button>
                )}
              </div>
            )}

            {/* 🟢 Premium m2l6 — done-for-you Market Research, test mode (RULES §1) */}
            {activeKind === 'premium' && (
              <div className="bg-accent-50 border border-accent-100 rounded-card p-5 mb-8">
                <p className="text-sm font-bold text-accent-800 mb-2">✦ Done-for-you service</p>
                <ul className="text-xs text-accent-800/80 leading-relaxed mb-4 space-y-1">
                  <li>· Market size & trends for your exact niche (bottom-up, logic shown)</li>
                  <li>· Competitor map + gap analysis — checked against YOUR positioning</li>
                  <li>· "Where your window is" — delivered into your Brain & Snapshot</li>
                </ul>

                {researchLoading ? (
                  <div className="flex items-center gap-3 py-2">
                    <div className="w-8 h-8 rounded-pill bg-accent animate-orb-pulse" />
                    <p className="text-xs font-semibold text-accent-800">Researching your market… ~1 minute</p>
                  </div>
                ) : researchQuestions ? (
                  <div className="bg-surface border border-accent-100 rounded-control p-4 space-y-3">
                    <p className="text-xs font-bold text-accent-800">A few details first — the research gets a lot sharper:</p>
                    {researchQuestions.map((q) => (
                      <div key={q.id}>
                        <label className="block text-[11px] font-semibold text-ink-soft mb-1">{q.q}</label>
                        <input
                          type="text"
                          value={researchAnswers[q.id] ?? ''}
                          onChange={(e) => setResearchAnswers((a) => ({ ...a, [q.id]: e.target.value }))}
                          className="w-full text-sm border border-hairline rounded-control px-3 py-2 outline-none focus:border-accent-400 focus:ring-2 focus:ring-accent-100 transition"
                        />
                      </div>
                    ))}
                    <button
                      onClick={() => handleGenerateResearch(researchAnswers)}
                      disabled={researchQuestions.some((q) => !(researchAnswers[q.id] ?? '').trim())}
                      className="bg-accent hover:opacity-90 disabled:opacity-40 text-white text-sm font-semibold px-5 py-2.5 rounded-pill transition"
                    >
                      Generate my research →
                    </button>
                  </div>
                ) : researchReport ? (
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      onClick={() => setResearchOpen(true)}
                      className="bg-accent hover:opacity-90 text-white text-sm font-semibold px-5 py-2.5 rounded-pill transition active:scale-95"
                    >
                      📄 Open your research report
                    </button>
                    <button
                      onClick={() => handleGenerateResearch()}
                      className="text-xs font-semibold text-accent-800 hover:underline px-2"
                    >
                      Re-run with my latest Brain
                    </button>
                  </div>
                ) : (
                  <>
                    <button
                      onClick={() => handleGenerateResearch()}
                      className="bg-accent hover:opacity-90 text-white text-sm font-semibold px-5 py-2.5 rounded-pill transition active:scale-95"
                    >
                      ✦ Generate my research — free in test mode
                    </button>
                    <p className="text-[10px] text-accent-800/60 mt-2">Test mode: model estimates only, no live web data — clearly labeled in the report.</p>
                  </>
                )}
                {researchError && <p className="text-xs text-red-500 mt-2">{researchError}</p>}
              </div>
            )}

            {/* 🧾 M0.3 — Your Project Today (SPEC_M0_INTAKE_REDESIGN §1) */}
            {activeLesson.id === 'm0l3' && (
              <ProjectTodayBlock
                key={activeLessonId}
                userData={userData}
                onSave={(fields, links) => {
                  onUpdateUserData(fields);
                  syncUserToDB({ ...userData, ...fields });
                  if (links.trim()) {
                    onUpdateUserData({ lessonInputs: { ...userData.lessonInputs, m0l3: links } });
                    saveLessonInputToDB(userData.email, 'm0l3', links);
                  }
                  if (!isCompleted) {
                    onUpdateUserData({ completedLessons: [...userData.completedLessons, 'm0l3'] });
                    toggleLessonCompleteToDB(userData.email, 'm0l3');
                  }
                  if (nextLesson) openLesson(nextLesson.id);
                }}
                initialLinks={userData.lessonInputs['m0l3'] ?? ''}
              />
            )}

            {/* ❓ M0.4 — A few quick questions, Typeform-style (SPEC_M0_INTAKE_REDESIGN §2) */}
            {activeLesson.id === 'm0l4' && (
              <IntakeQuizBlock
                key={activeLessonId}
                initialJson={userData.lessonInputs['m0l4'] ?? ''}
                onComplete={(json) => {
                  const inputsPatch: Record<string, string> = { m0l4: json };
                  // §2 note: URLs pasted into Q1 land in imported_assets too — don't lose
                  // the signal just because it hit the wrong box.
                  try {
                    const dsf: string = JSON.parse(json).doneSoFar ?? '';
                    const urls = dsf.match(/https?:\/\/[^\s)"',]+/g) ?? [];
                    const existing = userData.lessonInputs['m0l3'] ?? '';
                    const fresh = urls.filter((u) => !existing.includes(u));
                    if (fresh.length > 0) {
                      const merged = `${existing}\n${fresh.map((u) => `${u} — from your "done so far" answer`).join('\n')}`.trim();
                      inputsPatch.m0l3 = merged;
                      saveLessonInputToDB(userData.email, 'm0l3', merged);
                    }
                  } catch { /* malformed json — skip extraction */ }
                  onUpdateUserData({ lessonInputs: { ...userData.lessonInputs, ...inputsPatch } });
                  saveLessonInputToDB(userData.email, 'm0l4', json);
                  if (!isCompleted) {
                    onUpdateUserData({ completedLessons: [...userData.completedLessons, 'm0l4'] });
                    toggleLessonCompleteToDB(userData.email, 'm0l4');
                  }
                  setAutoSnapshot(true);
                  if (nextLesson) openLesson(nextLesson.id);
                }}
              />
            )}

            {/* ⚙️ M0.5 — Startup Snapshot generation (§6.1, wow moment №1) */}
            {activeLesson.id === 'm0l5' && (
              <SnapshotBlock
                key={activeLessonId}
                email={userData.email}
                autoStart={autoSnapshot}
                onComplete={() => {
                  if (!isCompleted) {
                    onUpdateUserData({ completedLessons: [...userData.completedLessons, activeLessonId] });
                    toggleLessonCompleteToDB(userData.email, activeLessonId);
                  }
                  if (nextLesson) openLesson(nextLesson.id);
                }}
              />
            )}

            {/* Exercise lesson — state machine: input → saving → feedback/compare ⟲ refine */}
            {(activeLesson.type === 'input' || activeLesson.type === 'structured') && (() => {
              // M0 redesign: Step 3/4 have dedicated components above — no generic exercise flow
              if (activeLesson.id === 'm0l3' || activeLesson.id === 'm0l4') return null;
              if (activeLesson.aiMode === 'north-star') {
                const onContinue = () => {
                  if (!isCompleted) {
                    onUpdateUserData({ completedLessons: [...userData.completedLessons, activeLessonId] });
                    toggleLessonCompleteToDB(userData.email, activeLessonId);
                  }
                  if (nextLesson) openLesson(nextLesson.id);
                };
                return (
                  <NorthStarExercise
                    key={activeLessonId}
                    email={userData.email}
                    lessonId={activeLessonId}
                    alreadySubmitted={!!userData.lessonInputs[activeLessonId]}
                    onComplete={onContinue}
                    onSaveInput={(id, content) => {
                      onUpdateUserData({ lessonInputs: { ...userData.lessonInputs, [id]: content } });
                      saveLessonInputToDB(userData.email, id, content);
                    }}
                  />
                );
              }

              const isCompareMode = activeLesson.aiMode === 'compare';
              const lessonFeedback = feedbackByLesson[activeLessonId];
              const lessonCompare = compareByLesson[activeLessonId];
              const isSaving = savingLesson === activeLessonId;
              const isRefining = refiningLesson === activeLessonId;
              const hasResult = isCompareMode ? !!lessonCompare : !!lessonFeedback;
              const showResult = hasResult && !isRefining && !isSaving;
              const showInput = !isSaving && !showResult;

              const onContinue = () => {
                setRefiningLesson(null);
                if (!isCompleted) {
                  onUpdateUserData({ completedLessons: [...userData.completedLessons, activeLessonId] });
                  toggleLessonCompleteToDB(userData.email, activeLessonId);
                }
                if (nextLesson) openLesson(nextLesson.id);
              };

              // §4 Delegate — A/B gated on ≥1 own attempt; C has its own button above the field
              const dMode = activeLesson.delegateMode ?? 'A';
              const hasAttempted = !!userData.lessonInputs[activeLessonId] || hasResult;
              const canDelegate = activeLesson.delegatable !== false && dMode !== 'C' && hasAttempted;
              const drafts = pendingDrafts[activeLessonId];
              const variantsPack = pendingVariants[activeLessonId];
              const analysis = analysisByLesson[activeLessonId];

              const delegateButton = canDelegate ? (
                <button
                  onClick={() => handleDelegate(activeLessonId)}
                  disabled={delegating !== null}
                  className="mt-3 w-full flex items-center justify-center gap-2 border-[1.5px] border-brand text-brand text-sm font-semibold py-2.5 rounded-pill hover:bg-brand-50 disabled:opacity-50 transition-all duration-150"
                >
                  {dMode === 'B' ? '🪄 Show me 2–3 AI variants' : '🪄 Let AI mentor draft this for me'}
                </button>
              ) : null;

              // Delegating spinner
              if (delegating === activeLessonId) {
                return (
                  <div className="bg-surface border border-brand-100 rounded-card mb-8 flex flex-col items-center justify-center gap-4 py-14 animate-fade-in">
                    <div className="w-12 h-12 rounded-pill bg-brand animate-orb-pulse" />
                    <p className="text-sm font-semibold text-ink-mute tracking-wide">Mentor is drafting from your Brain…</p>
                  </div>
                );
              }

              // Mode B: variant cards — she picks one INTO her field for editing (never auto-saved)
              if (delegateOpen === activeLessonId && variantsPack) {
                return (
                  <div className="mb-8 animate-fade-in">
                    <p className="text-sm font-bold text-ink mb-1">🪄 Pick a starting point</p>
                    <p className="text-xs text-ink-mute mb-3">Each takes a different angle. Your pick lands in your answer field — edit it until every word is true for you.</p>
                    <div className="flex flex-col gap-3 mb-4">
                      {variantsPack.variants.map((v, i) => (
                        <div key={i} className="bg-surface border border-hairline rounded-card p-4 hover:border-brand-200 transition-colors">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-[10px] font-bold bg-brand-50 text-brand-700 rounded-pill px-2 py-0.5 uppercase tracking-wider">
                              {v.label}
                            </span>
                          </div>
                          <p className="text-sm text-ink-soft whitespace-pre-wrap leading-relaxed mb-3">{v.text}</p>
                          <button
                            onClick={() => {
                              setDelegateOpen(null);
                              setInputDraft((d) => ({ ...d, [activeLessonId]: v.text }));
                              setPendingDrafts((pd) => ({ ...pd, [activeLessonId]: { userDraft: variantsPack.userDraft, aiDraft: v.text } }));
                              setRefiningLesson(activeLessonId);
                            }}
                            className="text-xs font-semibold text-brand border-[1.5px] border-brand rounded-pill px-4 py-1.5 hover:bg-brand-50 transition-colors"
                          >
                            Use as my draft →
                          </button>
                        </div>
                      ))}
                    </div>
                    <button
                      onClick={() => setDelegateOpen(null)}
                      className="text-sm font-semibold text-ink-mute hover:text-ink-soft px-2 py-1 transition"
                    >
                      Keep mine
                    </button>
                  </div>
                );
              }

              // Mode A: compare view — your draft vs AI draft → Use / Merge / Keep
              if (delegateOpen === activeLessonId && drafts) {
                return (
                  <div className="mb-8 animate-fade-in">
                    <p className="text-sm font-bold text-ink mb-3">🪄 Two versions — use the AI draft, merge, or keep yours</p>
                    <div className="grid md:grid-cols-2 gap-3 mb-4">
                      <div className="bg-surface border border-hairline rounded-card p-4">
                        <p className="text-[10px] font-bold text-ink-mute uppercase tracking-widest mb-2">Your draft</p>
                        <p className="text-sm text-ink-soft whitespace-pre-wrap leading-relaxed">{drafts.userDraft || '— (empty)'}</p>
                      </div>
                      <div className="bg-brand-50 border border-brand-200 rounded-card p-4">
                        <p className="text-[10px] font-bold text-brand-700 uppercase tracking-widest mb-2">AI mentor's draft</p>
                        <p className="text-sm text-ink whitespace-pre-wrap leading-relaxed">{drafts.aiDraft}</p>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => { setDelegateOpen(null); handleSaveInput(activeLessonId, drafts.aiDraft); }}
                        className="flex-1 bg-brand hover:bg-brand-700 active:scale-95 text-white text-sm font-semibold px-5 py-2.5 rounded-pill transition-all duration-150"
                      >
                        Use AI version
                      </button>
                      <button
                        onClick={() => {
                          setDelegateOpen(null);
                          setInputDraft((d) => ({ ...d, [activeLessonId]: `${drafts.userDraft}\n\n— AI version —\n${drafts.aiDraft}` }));
                          setRefiningLesson(activeLessonId);
                        }}
                        className="flex-1 border-[1.5px] border-brand text-brand text-sm font-semibold px-5 py-2.5 rounded-pill hover:bg-brand-50 transition-all duration-150"
                      >
                        Merge & edit
                      </button>
                      <button
                        onClick={() => {
                          setDelegateOpen(null);
                          setPendingDrafts((p) => { const n = { ...p }; delete n[activeLessonId]; return n; });
                        }}
                        className="text-sm font-semibold text-ink-mute hover:text-ink-soft px-4 py-2.5 transition"
                      >
                        Keep mine
                      </button>
                    </div>
                  </div>
                );
              }

              return (
                <>
                  {/* 1. Saving / analyzing spinner */}
                  {isSaving && (
                    <div className="bg-surface border border-brand-100 rounded-card mb-8 flex flex-col items-center justify-center gap-4 py-14 animate-fade-in">
                      <div className="w-12 h-12 rounded-pill bg-brand animate-orb-pulse" />
                      <p className="text-sm font-semibold text-ink-mute tracking-wide">Mentor is reviewing your answer…</p>
                    </div>
                  )}

                  {/* 2a. Feedback card (feedback mode) + Delegate */}
                  {showResult && !isCompareMode && lessonFeedback && (
                    <>
                      <FeedbackCard
                        lessonTitle={activeLesson.title}
                        prompt={activeLesson.inputPrompt ?? ''}
                        answer={getInputValue(activeLessonId)}
                        feedback={lessonFeedback}
                        previousScore={lessonFeedback.previousScore}
                        onRefine={() => setRefiningLesson(activeLessonId)}
                        onContinue={onContinue}
                      />
                      {delegateButton && <div className="-mt-5 mb-8">{delegateButton}</div>}
                    </>
                  )}

                  {/* 2b. Compare card (compare mode) + Delegate */}
                  {showResult && isCompareMode && lessonCompare && (
                    <>
                      <CompareCard
                        lessonTitle={activeLesson.title}
                        prompt={activeLesson.inputPrompt ?? ''}
                        answer={getInputValue(activeLessonId)}
                        result={lessonCompare}
                        onRefine={() => setRefiningLesson(activeLessonId)}
                        onContinue={onContinue}
                      />
                      {delegateButton && <div className="-mt-5 mb-8">{delegateButton}</div>}
                    </>
                  )}

                  {/* §2.1 clarify: the AI asked one question before drafting — she answers in her field */}
                  {showInput && clarifyByLesson[activeLessonId] && (
                    <div className="bg-amber-50 border border-amber-200 rounded-card p-4 mb-4 animate-fade-in">
                      <p className="text-xs font-bold text-amber-700 uppercase tracking-widest mb-1.5">🪄 One thing first</p>
                      <p className="text-sm text-ink-soft leading-relaxed whitespace-pre-wrap">{clarifyByLesson[activeLessonId]}</p>
                      <p className="text-[11px] text-ink-mute mt-2">Add the answer to your draft below, then try Delegate again.</p>
                    </div>
                  )}

                  {/* Mode C (RULES §2.2): read-only AI analysis ABOVE her field — the decision field is never pre-filled */}
                  {showInput && dMode === 'C' && activeLesson.delegatable !== false && (
                    analysis ? (
                      <div className="bg-surface border border-brand-200 rounded-card p-5 mb-4 animate-fade-in">
                        <p className="text-xs font-bold text-brand-700 uppercase tracking-widest mb-3">🧠 AI case file — for your decision</p>
                        <div className="grid md:grid-cols-2 gap-3 mb-3">
                          <div className="bg-accent-50 border border-accent-100 rounded-control p-3">
                            <p className="text-[10px] font-bold text-accent-800 uppercase tracking-wider mb-1.5">For</p>
                            <ul className="space-y-1">
                              {analysis.for.map((x, i) => <li key={i} className="text-xs text-ink-soft leading-relaxed">▲ {x}</li>)}
                            </ul>
                          </div>
                          <div className="bg-amber-50 border border-amber-100 rounded-control p-3">
                            <p className="text-[10px] font-bold text-amber-700 uppercase tracking-wider mb-1.5">Against</p>
                            <ul className="space-y-1">
                              {analysis.against.map((x, i) => <li key={i} className="text-xs text-ink-soft leading-relaxed">△ {x}</li>)}
                            </ul>
                          </div>
                        </div>
                        <div className="bg-brand-50 border border-brand-100 rounded-control px-4 py-3 mb-2">
                          <p className="text-[10px] font-bold text-brand-700 uppercase tracking-wider mb-1">Recommendation</p>
                          <p className="text-sm text-ink leading-relaxed">{analysis.recommendation}</p>
                        </div>
                        <p className="text-[11px] text-ink-mute">This is analysis, not a decision. The field below is yours — the AI never fills it.</p>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleDelegate(activeLessonId)}
                        disabled={delegating !== null}
                        className="w-full mb-4 flex items-center justify-center gap-2 border-[1.5px] border-brand text-brand text-sm font-semibold py-2.5 rounded-pill hover:bg-brand-50 disabled:opacity-50 transition-all duration-150"
                      >
                        {delegating === activeLessonId ? 'Analyzing your Brain…' : '🧠 Get the AI case file (for & against)'}
                      </button>
                    )
                  )}

                  {/* 3. Input form (idle or refining) */}
                  {showInput && (
                    <div className="bg-brand-50 border border-brand-100 rounded-card p-5 mb-8">
                      {activeLesson.inputPrompt && (
                        <p className="text-sm font-semibold text-brand-700 mb-3">{activeLesson.inputPrompt}</p>
                      )}
                      {isRefining && lessonFeedback && lessonFeedback.score !== null && !isCompareMode && (
                        <div className="flex items-center gap-2 mb-3 text-xs text-ink-mute">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="1 4 1 10 7 10" /><path d="M3.51 15a9 9 0 102.13-9.36L1 10" />
                          </svg>
                          Previous score: <span className="font-semibold text-amber-500">{lessonFeedback.score}/100</span> — refine and save to get a new score
                        </div>
                      )}
                      <textarea
                        className={`w-full bg-surface border border-brand-200 focus:border-brand-400 focus:ring-2 focus:ring-brand-100 rounded-control px-4 py-3 text-sm text-ink placeholder-ink-mute outline-none resize-none transition ${
                          activeLesson.type === 'structured' ? 'min-h-[200px]' : 'min-h-[120px]'
                        }`}
                        placeholder={activeLesson.inputPlaceholder ?? 'Write your answer here…'}
                        value={getInputValue(activeLessonId)}
                        maxLength={activeLesson.inputMaxLength}
                        onChange={(e) => setInputDraft((d) => ({ ...d, [activeLessonId]: e.target.value }))}
                      />
                      {activeLesson.inputMaxLength && (() => {
                        const len = getInputValue(activeLessonId).length;
                        const max = activeLesson.inputMaxLength;
                        return (
                          <p className={`mt-1 text-xs text-right transition-colors ${len >= max ? 'text-red-400 font-semibold' : len >= max * 0.9 ? 'text-amber-500' : 'text-ink-mute'}`}>
                            {len} / {max}
                          </p>
                        );
                      })()}
                      <div className="mt-3">
                        <button
                          onClick={() => handleSaveInput(activeLessonId)}
                          disabled={!getInputValue(activeLessonId).trim()}
                          className="relative bg-brand hover:bg-brand-700 active:scale-95 disabled:opacity-40 text-white text-sm font-semibold px-6 py-2.5 rounded-pill transition-all duration-150"
                        >
                          {isRefining ? (isCompareMode ? 'Revise & re-score' : 'Save & get new score') : 'Save'}
                          {saveAnimLesson === activeLessonId && (
                            <span className="absolute -top-1 -right-1 pointer-events-none animate-doc-fly" style={{ display: 'inline-flex' }}>
                              <svg width="20" height="20" viewBox="0 0 24 24" fill="white" stroke="#7150EA" strokeWidth="1.5">
                                <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                                <polyline points="14 2 14 8 20 8" />
                              </svg>
                            </span>
                          )}
                        </button>
                      </div>
                      {delegateButton}
                    </div>
                  )}
                </>
              );
            })()}

            {/* Action buttons — hidden while saving or showing feedback */}
            {(() => {
              const isExercise = activeLesson.type === 'input' || activeLesson.type === 'structured';
              // north-star exercise manages its own navigation
              if (isExercise && activeLesson.aiMode === 'north-star') return null;
              // snapshot block manages its own Continue until generated once
              if (activeLesson.id === 'm0l5' && !isCompleted) return null;
              // M0.3/M0.4 custom blocks provide their own CTAs until completed
              if ((activeLesson.id === 'm0l3' || activeLesson.id === 'm0l4') && !isCompleted) return null;
              // delegate views manage their own actions
              if (delegateOpen === activeLessonId || delegating === activeLessonId) return null;
              const hasFeedback = !!(feedbackByLesson[activeLessonId] || compareByLesson[activeLessonId]);
              const isRefining = refiningLesson === activeLessonId;
              const isSaving = savingLesson === activeLessonId;
              // Hide when saving or when feedback is showing (FeedbackCard handles Continue)
              if (isSaving || (hasFeedback && !isRefining)) return null;
              // For exercises, only show Next when user has submitted at least once
              const hasSubmitted = !!userData.lessonInputs[activeLessonId];
              if (isExercise && !hasSubmitted) return null;

              function handleNext() {
                if (!isCompleted) {
                  onUpdateUserData({ completedLessons: [...userData.completedLessons, activeLessonId] });
                  toggleLessonCompleteToDB(userData.email, activeLessonId);
                }
                if (nextLesson) openLesson(nextLesson.id);
              }

              return (
                <div className="flex items-center pt-2 border-t border-hairline mt-2">
                  {nextLesson ? (
                    <button
                      onClick={handleNext}
                      className="flex items-center gap-2 text-sm font-semibold px-5 py-2.5 rounded-pill bg-ink text-white hover:bg-ink active:scale-95 transition-all duration-150 ml-auto"
                    >
                      Next lesson <span>→</span>
                    </button>
                  ) : (
                    <p className="ml-auto text-sm text-brand font-medium">
                      🎉 You've completed all lessons!
                    </p>
                  )}
                </div>
              );
            })()}
          </div>
        </main>
      </div>

      {researchOpen && researchReport && (
        <MarketResearchView
          report={researchReport}
          projectName={userData.projectName}
          onClose={() => setResearchOpen(false)}
        />
      )}

      {openSession && (
        <MentorSessionModal
          session={openSession}
          email={userData.email}
          completed={!!sessionsState[openSession]?.completed}
          onClose={() => setOpenSession(null)}
          onCompletedChange={(completed) =>
            setSessionsState((st) => ({ ...st, [openSession]: { completed } }))
          }
        />
      )}

      {/* Panels */}
      {panel === 'account' && (
        <AccountPanel
          userData={userData}
          onClose={() => setPanel('none')}
          onSave={onUpdateUserData}
        />
      )}
      {panel === 'documents' && (
        <DocumentsPanel
          email={userData.email}
          onClose={() => setPanel('none')}
          context={{ name: userData.name, idea: userData.idea, customer: userData.customer, stage: userData.stage }}
        />
      )}
    </div>
  );
}

// ─── NorthStarExercise ────────────────────────────────────────────────────────
const UNIT_LABELS: Record<string, string> = { people: 'people', '$': '$', '%': '%', count: 'count' };

interface NorthStarExerciseProps {
  email: string;
  lessonId: string;
  alreadySubmitted: boolean;
  onComplete: () => void;
  onSaveInput: (lessonId: string, content: string) => void;
}

function NorthStarExercise({ email, lessonId, alreadySubmitted, onComplete, onSaveInput }: NorthStarExerciseProps) {
  type Status = 'suggesting' | 'idle' | 'committing' | 'done' | 'redo';
  const [status, setStatus] = useState<Status>(alreadySubmitted ? 'done' : 'suggesting');
  const [suggestion, setSuggestion] = useState<NorthStarSuggestion | null>(null);
  const [picked, setPicked] = useState<NorthStarCandidate | null>(null);
  const [customMode, setCustomMode] = useState(false);
  const [customLabel, setCustomLabel] = useState('');
  const [customUnit, setCustomUnit] = useState<'people' | '$' | '%' | 'count'>('people');
  const [rationale, setRationale] = useState('');
  const [result, setResult] = useState<{ score: number; verdict: string; mentorNote: string; isVanity: boolean; betterAlternative?: string | null } | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (status !== 'suggesting') return;
    fetch('/api/northstar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'suggest', email }),
    })
      .then((r) => r.json())
      .then((data: NorthStarSuggestion) => {
        setSuggestion(data);
        setStatus('idle');
      })
      .catch(() => setStatus('idle'));
  }, [status]);

  async function handleCommit() {
    const key = customMode ? customLabel.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '') : picked?.key;
    const label = customMode ? customLabel : picked?.label;
    const unit = customMode ? customUnit : picked?.unit;
    if (!key || !label || !unit) return;
    setStatus('committing');
    setError('');
    try {
      const r = await fetch('/api/northstar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'commit', email, key, label, unit, rationale }),
      });
      if (!r.ok) throw new Error('commit failed');
      const data = await r.json();
      setResult(data);
      onSaveInput(lessonId, `North Star: ${label} (${unit}). ${rationale}`);
      setStatus('done');
    } catch {
      setError('Something went wrong — please try again.');
      setStatus('idle');
    }
  }

  const canCommit = customMode ? customLabel.trim().length > 0 : !!picked;

  // ── Suggesting spinner ──
  if (status === 'suggesting' || status === 'committing') {
    return (
      <div className="bg-surface border border-brand-100 rounded-card mb-8 flex flex-col items-center justify-center gap-4 py-14 animate-fade-in">
        <div className="w-12 h-12 rounded-pill bg-brand animate-orb-pulse" />
        <p className="text-sm font-semibold text-ink-mute tracking-wide">
          {status === 'suggesting' ? 'Mentor is analyzing your Brain…' : 'Setting your North Star…'}
        </p>
      </div>
    );
  }

  // ── Done / already submitted ──
  if (status === 'done') {
    return (
      <div className="space-y-4 mb-8 animate-fade-in">
        {result ? (
          <>
            <div className={`border rounded-card p-5 ${result.verdict === 'strong' ? 'bg-accent-50 border-accent-100' : result.verdict === 'ok' ? 'bg-brand-50 border-brand-100' : 'bg-amber-50 border-amber-100'}`}>
              <div className="flex items-center gap-2 mb-2">
                <span className={`text-xs font-bold uppercase tracking-widest ${result.verdict === 'strong' ? 'text-accent-800' : result.verdict === 'ok' ? 'text-brand-700' : 'text-amber-700'}`}>
                  {result.verdict === 'strong' ? 'Strong choice' : result.verdict === 'ok' ? 'Good start' : 'Needs refinement'}
                </span>
                <span className="ml-auto text-xs font-bold text-ink-soft">{result.score}/100</span>
              </div>
              <p className="text-sm text-ink leading-relaxed">{result.mentorNote}</p>
              {result.isVanity && result.betterAlternative && (
                <p className="mt-2 text-xs font-semibold text-amber-600">
                  Consider instead: {result.betterAlternative}
                </p>
              )}
            </div>
            <div className="bg-brand-50 border border-brand-100 rounded-card px-5 py-3 flex items-center gap-3">
              <span className="text-lg">⭐</span>
              <p className="text-sm font-semibold text-brand-700">North Star set! Track it weekly in Metric Pulse.</p>
            </div>
          </>
        ) : (
          <div className="bg-brand-50 border border-brand-100 rounded-card px-5 py-4 flex items-center gap-3">
            <span className="text-lg">⭐</span>
            <div>
              <p className="text-sm font-bold text-brand-700">North Star already set</p>
              <p className="text-xs text-brand-600 mt-0.5">You can update it anytime.</p>
            </div>
          </div>
        )}
        <div className="flex gap-2">
          <button
            onClick={() => { setStatus('suggesting'); setSuggestion(null); setPicked(null); setResult(null); setCustomMode(false); setRationale(''); }}
            className="text-xs text-ink-soft hover:text-ink-soft px-4 py-2 rounded-control border border-hairline hover:border-hairline transition-colors"
          >
            Change North Star
          </button>
          <button
            onClick={onComplete}
            className="flex-1 flex items-center justify-center gap-2 text-sm font-semibold px-5 py-2.5 rounded-pill bg-ink text-white hover:bg-ink active:scale-95 transition-all duration-150"
          >
            Next lesson →
          </button>
        </div>
      </div>
    );
  }

  // ── Pick / custom ──
  return (
    <div className="space-y-4 mb-8 animate-fade-in">
      {suggestion && suggestion.candidates.map((c) => {
        const isRec = c.key === suggestion.recommended;
        const isSelected = picked?.key === c.key && !customMode;
        return (
          <button
            key={c.key}
            onClick={() => { setPicked(c); setCustomMode(false); }}
            className={`w-full text-left rounded-card border p-5 transition-all duration-150 ${
              isSelected
                ? 'bg-brand-50 border-brand-200 ring-2 ring-brand-200'
                : 'bg-surface border-hairline hover:border-brand-200 hover:bg-brand-50/40'
            }`}
          >
            <div className="flex items-center gap-2 mb-2">
              <span className="text-sm font-bold text-ink">{c.label}</span>
              <span className="text-xs text-ink-mute font-mono">/{UNIT_LABELS[c.unit] ?? c.unit}</span>
              {isRec && (
                <span className="ml-auto text-[10px] font-bold bg-brand-100 text-brand rounded-pill px-2 py-0.5">
                  Recommended
                </span>
              )}
              {isSelected && (
                <span className="ml-auto w-5 h-5 rounded-pill bg-brand flex items-center justify-center">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </span>
              )}
            </div>
            <p className="text-xs text-ink-soft leading-relaxed mb-1">{c.why}</p>
            <p className="text-xs text-ink-mute">{c.howToMeasure}</p>
            {c.currentValue !== undefined && (
              <p className="text-xs font-semibold text-accent-600 mt-1">Current: {c.currentValue}</p>
            )}
          </button>
        );
      })}

      {/* Write your own */}
      <div
        className={`rounded-card border p-5 transition-all duration-150 ${
          customMode ? 'bg-brand-50 border-brand-200 ring-2 ring-brand-200' : 'bg-surface border-hairline hover:border-brand-200 cursor-pointer'
        }`}
        onClick={() => !customMode && setCustomMode(true)}
      >
        {!customMode ? (
          <p className="text-sm font-semibold text-ink-soft">+ Define my own metric</p>
        ) : (
          <div className="space-y-3" onClick={(e) => e.stopPropagation()}>
            <p className="text-sm font-bold text-brand-700">Define your own North Star</p>
            <div>
              <input
                type="text"
                value={customLabel}
                onChange={(e) => setCustomLabel(e.target.value)}
                placeholder="e.g. Weekly sessions per active user"
                className="w-full text-sm border border-brand-200 rounded-control px-3 py-2 outline-none focus:ring-2 focus:ring-brand-200"
              />
            </div>
            <div className="flex gap-2">
              {(['people', '$', '%', 'count'] as const).map((u) => (
                <button
                  key={u}
                  onClick={() => setCustomUnit(u)}
                  className={`text-xs font-semibold px-3 py-1.5 rounded-pill border transition-colors ${
                    customUnit === u ? 'bg-brand text-white border-brand' : 'bg-surface text-ink-soft border-hairline hover:border-brand-200'
                  }`}
                >
                  {u}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Rationale */}
      {(picked || customMode) && (
        <div className="bg-surface border border-hairline rounded-card p-5">
          <p className="text-xs font-bold text-ink-soft mb-2 uppercase tracking-widest">Why this metric? (optional)</p>
          <textarea
            value={rationale}
            onChange={(e) => setRationale(e.target.value)}
            placeholder="How does it reflect the real value you deliver to your customer?"
            rows={3}
            className="w-full text-sm border border-hairline rounded-control px-3 py-2 outline-none focus:ring-2 focus:ring-brand-100 resize-none placeholder-ink-mute"
          />
        </div>
      )}

      {error && <p className="text-xs text-red-500">{error}</p>}

      <button
        onClick={handleCommit}
        disabled={!canCommit}
        className="w-full bg-brand hover:bg-brand-700 disabled:opacity-40 text-white text-sm font-semibold py-3 rounded-pill transition-all active:scale-95"
      >
        Set as my North Star ⭐
      </button>
    </div>
  );
}

// ─── SnapshotBlock (⚙️ M0.5, §6.1) — generate & present the Startup Snapshot ──
function SnapshotBlock({ email, onComplete, autoStart = false }: { email: string; onComplete: () => void; autoStart?: boolean }) {
  type Status = 'checking' | 'idle' | 'generating' | 'ready' | 'error';
  const [status, setStatus] = useState<Status>('checking');
  const [snapshot, setSnapshot] = useState<StartupSnapshot | null>(null);

  useEffect(() => {
    if (!email) { setStatus('idle'); return; }
    fetch(`/api/brain?email=${encodeURIComponent(email)}&with=snapshot`)
      .then((r) => r.json())
      .then((d) => {
        if (d.snapshot) { setSnapshot(d.snapshot); setStatus('ready'); }
        else setStatus('idle');
      })
      .catch(() => setStatus('idle'));
  }, [email]);

  // M0 redesign §2: arriving from the quiz auto-starts generation ("Generating your Snapshot…")
  useEffect(() => {
    if (autoStart && status === 'idle') generate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoStart, status]);

  function generate() {
    setStatus('generating');
    fetch('/api/brain', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'generate-snapshot', email }),
    })
      .then((r) => { if (!r.ok) throw new Error('api'); return r.json(); })
      .then((d) => { setSnapshot(d.snapshot); setStatus('ready'); })
      .catch(() => setStatus('error'));
  }

  if (status === 'checking') {
    return (
      <div className="bg-surface border border-hairline rounded-card mb-8 flex justify-center py-10">
        <div className="w-8 h-8 rounded-pill border-2 border-brand-200 border-t-brand animate-spin" />
      </div>
    );
  }

  if (status === 'generating') {
    return (
      <div className="bg-surface border border-brand-100 rounded-card mb-8 flex flex-col items-center justify-center gap-4 py-16 animate-fade-in">
        <div className="w-14 h-14 rounded-pill bg-brand animate-orb-pulse" />
        <p className="text-sm font-semibold text-ink-soft tracking-wide">Reading everything you've shared…</p>
        <p className="text-xs text-ink-mute">Building your startup on one page</p>
      </div>
    );
  }

  if (status === 'ready' && snapshot) {
    return (
      <div className="mb-8 animate-slide-up">
        <div className="flex items-center gap-2 mb-4">
          <p className="font-display text-2xl font-medium tracking-tight text-ink flex-1">Your Startup Snapshot</p>
          <span className="text-[10px] font-bold bg-brand-50 text-brand-700 rounded-pill px-2.5 py-1">
            v{snapshot.version} · {snapshot.source}
          </span>
        </div>
        <div className="flex flex-col gap-3 mb-4">
          {snapshot.sections.filter((s) => s.title !== 'Next focus').map((s) => (
            <div key={s.title} className="bg-surface border border-hairline rounded-card p-4">
              <p className="text-[10px] font-bold text-brand-600 uppercase tracking-widest mb-1.5">{s.title}</p>
              <p className="text-sm text-ink-soft leading-relaxed whitespace-pre-wrap">{s.content}</p>
            </div>
          ))}
        </div>
        <button
          onClick={onComplete}
          className="w-full bg-brand hover:bg-brand-700 active:scale-95 text-white text-sm font-semibold py-3.5 rounded-pill transition-all duration-150"
        >
          This looks right — let's start Module 1 →
        </button>
        <p className="text-sm font-semibold text-brand leading-relaxed mt-3 text-center">
          Something looks off? Tell us in your weekly check-in — your Snapshot updates itself.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-brand-50 border border-brand-100 rounded-card p-6 mb-8 text-center">
      <p className="text-3xl mb-3">✨</p>
      <p className="text-sm font-bold text-brand-800 mb-1">Ready to see your startup on one page?</p>
      <p className="text-xs text-brand-700/70 leading-relaxed max-w-sm mx-auto mb-5">
        The AI mentor will read your intake, links, and onboarding answers and assemble your Startup
        Snapshot — the living document the whole program builds on.
      </p>
      {status === 'error' && (
        <p className="text-xs text-red-500 mb-3">Something went wrong — try again.</p>
      )}
      <button
        onClick={generate}
        className="bg-brand hover:bg-brand-700 active:scale-95 text-white text-sm font-semibold px-8 py-3 rounded-pill transition-all duration-150"
      >
        ✨ Generate my Startup Snapshot
      </button>
    </div>
  );
}

// ─── M0.3 "Your Project Today" (SPEC_M0_INTAKE_REDESIGN §1) ───────────────────
// Section A: five separate editable fields prefilled from users columns (source
// of truth — writes back). Section B: optional "+ Add links" (imported_assets).
function ProjectTodayBlock({ userData, onSave, initialLinks }: {
  userData: UserData;
  onSave: (fields: Partial<UserData>, links: string) => void;
  initialLinks: string;
}) {
  const [idea, setIdea] = useState(userData.idea);
  const [customer, setCustomer] = useState(userData.customer);
  const [businessModel, setBusinessModel] = useState(userData.businessModel);
  const [stage, setStage] = useState(userData.stage);
  const [goal, setGoal] = useState(userData.goal);
  const [linksOpen, setLinksOpen] = useState(!!initialLinks);
  const [links, setLinks] = useState(initialLinks);

  const stageOptions = QUESTIONS.find((q) => q.id === 'stage')?.options ?? [];
  const goalOptions = QUESTIONS.find((q) => q.id === 'goal')?.options ?? [];
  const inputCls = 'w-full text-sm bg-surface border border-hairline rounded-control px-3 py-2.5 outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100 placeholder-ink-mute transition';

  function SelectField({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: string[] }) {
    const opts = value && !options.includes(value) ? [value, ...options] : options;
    return (
      <select value={value} onChange={(e) => onChange(e.target.value)} className={inputCls}>
        <option value="" disabled>Choose…</option>
        {opts.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
    );
  }

  return (
    <div className="mb-8 flex flex-col gap-4 animate-fade-in">
      <div className="bg-surface border border-hairline rounded-card p-5">
        <p className="text-xs font-bold text-ink-mute uppercase tracking-widest mb-4">What we already know — check & correct</p>
        <div className="flex flex-col gap-4">
          <div>
            <label className="block text-[11px] font-bold text-ink-soft uppercase tracking-wider mb-1">What you're building</label>
            <textarea value={idea} onChange={(e) => setIdea(e.target.value)} rows={3} maxLength={250} className={`${inputCls} resize-none`} />
          </div>
          <div>
            <label className="block text-[11px] font-bold text-ink-soft uppercase tracking-wider mb-1">Who it's for</label>
            <input type="text" value={customer} onChange={(e) => setCustomer(e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className="block text-[11px] font-bold text-ink-soft uppercase tracking-wider mb-1">How it makes money</label>
            <input type="text" value={businessModel} onChange={(e) => setBusinessModel(e.target.value)} className={inputCls} />
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-bold text-ink-soft uppercase tracking-wider mb-1">Stage today</label>
              <SelectField value={stage} onChange={setStage} options={stageOptions} />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-ink-soft uppercase tracking-wider mb-1">Big goal</label>
              <SelectField value={goal} onChange={setGoal} options={goalOptions} />
            </div>
          </div>
        </div>
      </div>

      {/* Section B — optional links, collapsed by default */}
      <div className="bg-surface border border-hairline rounded-card p-5">
        <button
          type="button"
          onClick={() => setLinksOpen((v) => !v)}
          className="w-full flex items-center gap-2 text-left"
        >
          <span className="text-sm font-semibold text-ink">＋ Add links</span>
          <span className="text-xs text-ink-mute">— anything live already? (optional)</span>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
            className={`ml-auto text-ink-mute transition-transform ${linksOpen ? 'rotate-180' : ''}`}>
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>
        {linksOpen && (
          <div className="mt-3">
            <textarea
              value={links}
              onChange={(e) => setLinks(e.target.value)}
              rows={4}
              placeholder={`https://… — landing page\nhttps://… — Instagram\nhttps://… — pitch deck (Google Slides)`}
              className={`${inputCls} resize-none`}
            />
            <p className="text-[11px] text-ink-mute mt-1">Up to 5 links, one per line, with a word on what each is. They sharpen every AI review.</p>
          </div>
        )}
      </div>

      <button
        onClick={() => onSave({ idea, customer, businessModel, stage, goal }, links)}
        disabled={!idea.trim()}
        className="w-full bg-brand hover:bg-brand-700 active:scale-95 disabled:opacity-40 text-white text-sm font-semibold py-3.5 rounded-pill transition-all duration-150"
      >
        Continue to a few quick questions →
      </button>
    </div>
  );
}

// ─── M0.4 "A few quick questions" — Typeform-style quiz (SPEC_M0_INTAKE_REDESIGN §2) ──
type IntakeAnswers = {
  doneSoFar: string;   // open text per approved spec (was chip-select in the draft)
  stuckPoint: string;
  capacity: string;
  whyMe: string;
  goal12w: string;
};

const Q3_OPTIONS: { label: string; value: string }[] = [
  { label: 'Under 5', value: 'under5' },
  { label: '5–10', value: '5to10' },
  { label: '10–20', value: '10to20' },
  { label: '20+ (full focus)', value: '20plus' },
];

function IntakeQuizBlock({ initialJson, onComplete }: {
  initialJson: string;
  onComplete: (json: string) => void;
}) {
  const initial: IntakeAnswers = (() => {
    const empty: IntakeAnswers = { doneSoFar: '', stuckPoint: '', capacity: '', whyMe: '', goal12w: '' };
    try {
      const parsed = { ...empty, ...JSON.parse(initialJson) };
      // pre-approval drafts stored doneSoFar as a chip array — flatten
      if (Array.isArray(parsed.doneSoFar)) parsed.doneSoFar = parsed.doneSoFar.join('; ');
      return parsed;
    } catch { return empty; }
  })();
  const [a, setA] = useState<IntakeAnswers>(initial);
  const [step, setStep] = useState(0);
  const [nudged, setNudged] = useState<Record<number, boolean>>({});
  const [finishing, setFinishing] = useState(false);

  const TOTAL = 5;
  const textCls = 'w-full text-base bg-surface border-2 border-hairline rounded-card px-4 py-3.5 outline-none focus:border-brand-400 focus:ring-4 focus:ring-brand-100 placeholder-ink-mute resize-none transition';

  // Soft validation (§2 approved): only Q3 (chip-select) gates; all free-text
  // questions (Q1, Q2, Q4, Q5) get ONE gentle nudge if empty, never a hard block.
  const TEXT_VALUE: Record<number, () => string> = {
    0: () => a.doneSoFar, 1: () => a.stuckPoint, 3: () => a.whyMe, 4: () => a.goal12w,
  };
  function tryNext() {
    if (step === 2 && !a.capacity) return;
    if (step !== 2 && !TEXT_VALUE[step]().trim() && !nudged[step]) {
      setNudged((n) => ({ ...n, [step]: true }));
      return;
    }
    if (step < TOTAL - 1) {
      setStep(step + 1);
    } else {
      setFinishing(true);
      setTimeout(() => onComplete(JSON.stringify(a)), 1400);
    }
  }

  const chipOk = step === 2 ? !!a.capacity : true;

  function onTextKey(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); tryNext(); }
  }

  if (finishing) {
    return (
      <div className="bg-surface border border-brand-100 rounded-card mb-8 flex flex-col items-center justify-center gap-4 py-16 animate-fade-in">
        <div className="w-14 h-14 rounded-pill bg-brand animate-orb-pulse" />
        <p className="text-sm font-semibold text-ink-soft tracking-wide">Generating your Snapshot…</p>
      </div>
    );
  }

  return (
    <div className="mb-8 animate-fade-in">
      {/* progress dots + back arrow */}
      <div className="flex items-center gap-3 mb-6">
        {step > 0 ? (
          <button onClick={() => setStep(step - 1)} className="w-8 h-8 flex items-center justify-center rounded-pill hover:bg-inset text-ink-soft transition" aria-label="Back">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15 18 9 12 15 6" /></svg>
          </button>
        ) : <span className="w-8" />}
        <div className="flex gap-2 mx-auto">
          {Array.from({ length: TOTAL }).map((_, i) => (
            <span key={i} className={`w-2 h-2 rounded-pill transition-all ${i === step ? 'bg-brand scale-125' : i < step ? 'bg-brand-200' : 'bg-inset'}`} />
          ))}
        </div>
        <span className="w-8 text-right text-xs text-ink-mute">{step + 1}/5</span>
      </div>

      <div className="min-h-[260px]">
        {step === 0 && (
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-ink mb-2">What have you done so far?</h2>
            <p className="text-sm text-ink-soft mb-4 leading-relaxed">
              Write it all down — even the small stuff. And if anything's live (a site, an Instagram, a doc, a prototype), drop the links right here.
            </p>
            <textarea
              autoFocus
              value={a.doneSoFar}
              onKeyDown={onTextKey}
              onChange={(e) => setA((p) => ({ ...p, doneSoFar: e.target.value }))}
              rows={5}
              placeholder="e.g. Talked to 5 people about this, built a rough landing page (link below), got 3 people to say they'd try it…"
              className={textCls}
            />
          </div>
        )}

        {step === 1 && (
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-ink mb-5">Where do you feel stuck or unsure right now?</h2>
            <textarea
              autoFocus
              value={a.stuckPoint}
              onKeyDown={onTextKey}
              onChange={(e) => setA((p) => ({ ...p, stuckPoint: e.target.value }))}
              rows={4}
              placeholder="e.g. I don't know if people would actually pay, I can't pick between two ideas, I launched but nobody came…"
              className={textCls}
            />
          </div>
        )}

        {step === 2 && (
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-ink mb-5">How many hours a week can you realistically give this?</h2>
            <div className="flex flex-wrap gap-2">
              {Q3_OPTIONS.map((o) => (
                <button
                  key={o.value}
                  onClick={() => setA((p) => ({ ...p, capacity: o.value }))}
                  className={`text-sm font-semibold rounded-pill px-5 py-3 border-2 transition-all ${a.capacity === o.value ? 'bg-brand-50 border-brand text-brand-800' : 'bg-surface border-hairline text-ink-soft hover:border-brand-200'}`}
                >
                  {o.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 3 && (
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-ink mb-5">Why does this matter to you — really?</h2>
            <textarea
              autoFocus
              value={a.whyMe}
              onKeyDown={onTextKey}
              onChange={(e) => setA((p) => ({ ...p, whyMe: e.target.value }))}
              rows={4}
              placeholder="Not the elevator pitch — the real reason. What happens if you don't do this?"
              className={textCls}
            />
          </div>
        )}

        {step === 4 && (
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-ink mb-5">What would make the next 12 weeks feel like a win?</h2>
            <textarea
              autoFocus
              value={a.goal12w}
              onKeyDown={onTextKey}
              onChange={(e) => setA((p) => ({ ...p, goal12w: e.target.value }))}
              rows={4}
              placeholder="e.g. I have a paying customer. I know this idea is right. I've launched, even if small."
              className={textCls}
            />
          </div>
        )}
      </div>

      {nudged[step] && step !== 2 && !TEXT_VALUE[step]().trim() && (
        <p className="text-xs text-amber-600 mt-2">This one really helps your mentor understand you — sure you want to skip it?</p>
      )}

      <button
        onClick={tryNext}
        disabled={!chipOk}
        className="mt-5 w-full bg-brand hover:bg-brand-700 active:scale-95 disabled:opacity-40 text-white text-sm font-semibold py-3.5 rounded-pill transition-all duration-150"
      >
        {step === TOTAL - 1 ? 'Finish →' : 'Next →'}
      </button>
      <p className="text-[11px] text-ink-mute text-center mt-2">Enter ↵ works too{step === 2 ? '' : ' · you can skip this one'}</p>
    </div>
  );
}
