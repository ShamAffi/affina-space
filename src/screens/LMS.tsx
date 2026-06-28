import { useState, useCallback, useEffect } from 'react';
import { MODULES } from '../data';
import type { UserData, Lesson, AiFeedback, CompareResult } from '../types';
import { saveLessonInputToDB, toggleLessonCompleteToDB, syncUserToDB, loadProgressFromDB } from '../store';
import ProfileButton from '../components/ProfileButton';
import AccountPanel from '../components/AccountPanel';
import DocumentsPanel from '../components/DocumentsPanel';
import FeedbackCard from '../components/FeedbackCard';
import CompareCard from '../components/CompareCard';

interface Props {
  userData: UserData;
  onUpdateUserData: (updates: Partial<UserData>) => void;
}

const allLessons: Lesson[] = MODULES.flatMap((m) => m.lessons);

export default function LMS({ userData, onUpdateUserData }: Props) {
  const [activeLessonId, setActiveLessonId] = useState<string>('m1l1');
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

  const [progressLoading, setProgressLoading] = useState(true);

  // On mount: sync user to DB and load progress from DB (cross-device sync)
  useEffect(() => {
    syncUserToDB(userData);
    if (!userData.email) { setProgressLoading(false); return; }

    loadProgressFromDB(userData.email).then((dbProgress) => {
      if (dbProgress) {
        // Merge: union completedLessons, DB wins on lessonInputs
        const merged = {
          completedLessons: [
            ...new Set([...userData.completedLessons, ...dbProgress.completedLessons]),
          ],
          lessonInputs: { ...userData.lessonInputs, ...dbProgress.lessonInputs },
        };
        onUpdateUserData(merged);
      }
      setProgressLoading(false);
    });
  }, []);

  const activeLesson = allLessons.find((l) => l.id === activeLessonId)!;
  const activeLessonIdx = allLessons.findIndex((l) => l.id === activeLessonId);
  const nextLesson = allLessons[activeLessonIdx + 1];
  const isCompleted = userData.completedLessons.includes(activeLessonId);
  const activeModule = MODULES.find((m) => m.lessons.some((l) => l.id === activeLessonId));

  function isModuleLocked(modIdx: number): boolean {
    if (modIdx === 0) return false;
    return !MODULES[modIdx - 1].lessons.every((l) =>
      userData.completedLessons.includes(l.id),
    );
  }

  function getInputValue(lessonId: string): string {
    return inputDraft[lessonId] ?? userData.lessonInputs[lessonId] ?? '';
  }

  function handleSaveInput(lessonId: string) {
    const val = getInputValue(lessonId);
    if (!val.trim()) return;

    onUpdateUserData({ lessonInputs: { ...userData.lessonInputs, [lessonId]: val } });
    saveLessonInputToDB(userData.email, lessonId, val);

    // doc-fly + avatar ping
    setSaveAnimLesson(lessonId);
    setAvatarPing(true);
    setTimeout(() => setSaveAnimLesson(null), 750);
    setTimeout(() => setAvatarPing(false), 1350);

    const oldScore = feedbackByLesson[lessonId]?.score;
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

  function toggleComplete() {
    const already = userData.completedLessons.includes(activeLessonId);
    onUpdateUserData({
      completedLessons: already
        ? userData.completedLessons.filter((id) => id !== activeLessonId)
        : [...userData.completedLessons, activeLessonId],
    });
    toggleLessonCompleteToDB(userData.email, activeLessonId);
  }

  function openLesson(id: string) {
    setActiveLessonId(id);
    setSidebarOpen(false);
    setSavingLesson(null);
    setRefiningLesson(null);
  }

  const handleToggleMenu = useCallback(() => setProfileMenuOpen((v) => !v), []);

  if (progressLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 rounded-full border-2 border-purple-600 border-t-transparent animate-spin" />
          <p className="text-sm text-gray-400 font-medium">Loading your progress…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Top bar */}
      <header className="bg-white border-b border-gray-100 flex items-center gap-3 px-4 sm:px-6 py-4 sticky top-0 z-30">
        <button
          onClick={() => setSidebarOpen((v) => !v)}
          className="md:hidden w-9 h-9 flex items-center justify-center rounded-xl hover:bg-gray-100 text-gray-600 transition"
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

        <span className="text-purple-700 font-bold text-lg tracking-tight">
          Affina<span className="text-gray-900">Space</span>
        </span>

        <div className="hidden sm:flex items-center gap-1.5 ml-2 text-sm text-gray-400">
          <span>/</span>
          <span className="text-gray-600 font-medium">{activeModule?.title}</span>
          <span>/</span>
          <span className="text-gray-500 truncate max-w-[180px]">{activeLesson.title}</span>
        </div>

        <div className="ml-auto flex items-center gap-3">
          {/* Progress chip */}
          <div className="flex items-center gap-2 text-xs text-gray-500 bg-gray-50 border border-gray-200 rounded-full px-3 py-1">
            <span className="text-purple-600 font-semibold">{userData.completedLessons.length}</span>
            <span>/</span>
            <span>{allLessons.length} completed</span>
          </div>

          {/* Profile avatar */}
          <ProfileButton
            avatarPing={avatarPing}
            menuOpen={profileMenuOpen}
            onToggleMenu={handleToggleMenu}
            onAccount={() => setPanel('account')}
            onDocuments={() => setPanel('documents')}
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
            w-72 md:w-72 bg-white border-r border-gray-100
            transform transition-transform duration-300
            ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
            overflow-y-auto flex-shrink-0 pt-16 md:pt-0
          `}
        >
          <div className="p-4">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest px-2 mb-4">Program</p>

            {MODULES.map((mod, modIdx) => {
              const locked = isModuleLocked(modIdx);
              const modCompleted = mod.lessons.filter((l) =>
                userData.completedLessons.includes(l.id),
              ).length;

              return (
                <div key={mod.id} className="mb-6">
                  <div className="flex items-center gap-2 px-2 mb-2">
                    <span className={`text-xs font-bold rounded-md px-1.5 py-0.5 ${locked ? 'text-gray-400 bg-gray-100' : 'text-purple-500 bg-purple-50'}`}>
                      {String(mod.order).padStart(2, '0')}
                    </span>
                    <span className={`text-sm font-semibold flex-1 ${locked ? 'text-gray-400' : 'text-gray-900'}`}>
                      {mod.title}
                    </span>
                    {locked ? (
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2">
                        <rect x="3" y="11" width="18" height="11" rx="2" />
                        <path d="M7 11V7a5 5 0 0110 0v4" />
                      </svg>
                    ) : (
                      <span className="text-xs text-gray-400">{modCompleted}/{mod.lessons.length}</span>
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
                          className={`w-full text-left flex items-start gap-2.5 px-3 py-2.5 rounded-xl text-sm transition-all duration-150 ${
                            locked
                              ? 'text-gray-300 cursor-not-allowed'
                              : active
                                ? 'bg-purple-50 text-purple-700 font-medium'
                                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                          }`}
                        >
                          <span className={`flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center mt-0.5 text-xs transition-all ${
                            done ? 'bg-purple-600 border-purple-600 text-white' :
                            active ? 'border-purple-500' :
                            locked ? 'border-gray-200' : 'border-gray-200'
                          }`}>
                            {done ? '✓' : ''}
                          </span>
                          <span className="leading-snug">{lesson.title}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </aside>

        {/* Lesson content */}
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-2xl mx-auto px-5 sm:px-8 py-10 animate-fade-in" key={activeLessonId}>
            <div className="flex items-center gap-2 mb-6">
              <span className="text-xs font-semibold text-purple-500 bg-purple-50 rounded-full px-3 py-1">
                {activeModule?.title}
              </span>
              {(activeLesson.type === 'input' || activeLesson.type === 'structured') && (
                <span className="text-xs font-semibold text-amber-600 bg-amber-50 rounded-full px-3 py-1">
                  Exercise
                </span>
              )}
            </div>

            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6 leading-snug">
              {activeLesson.title}
            </h1>

            {activeLesson.media && (
              <div className="w-full h-48 bg-gray-100 rounded-2xl flex items-center justify-center text-gray-400 mb-6 border border-gray-200">
                <span className="text-sm">{activeLesson.media.kind === 'video' ? '▶ Video' : '🖼 Image'}</span>
              </div>
            )}

            <p className="text-gray-700 text-base sm:text-lg leading-relaxed mb-8">
              {activeLesson.body}
            </p>

            {/* Exercise lesson — state machine: input → saving → feedback/compare ⟲ refine */}
            {(activeLesson.type === 'input' || activeLesson.type === 'structured') && (() => {
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

              return (
                <>
                  {/* 1. Saving / analyzing spinner */}
                  {isSaving && (
                    <div className="bg-white border border-purple-100 rounded-2xl mb-8 flex flex-col items-center justify-center gap-4 py-14 animate-fade-in">
                      <div className="w-12 h-12 rounded-full bg-purple-600 animate-orb-pulse" />
                      <p className="text-sm font-semibold text-gray-400 tracking-wide">Mentor is reviewing your answer…</p>
                    </div>
                  )}

                  {/* 2a. Feedback card (feedback mode) */}
                  {showResult && !isCompareMode && lessonFeedback && (
                    <FeedbackCard
                      lessonTitle={activeLesson.title}
                      prompt={activeLesson.inputPrompt ?? ''}
                      answer={getInputValue(activeLessonId)}
                      feedback={lessonFeedback}
                      previousScore={lessonFeedback.previousScore}
                      onRefine={() => setRefiningLesson(activeLessonId)}
                      onContinue={onContinue}
                    />
                  )}

                  {/* 2b. Compare card (compare mode) */}
                  {showResult && isCompareMode && lessonCompare && (
                    <CompareCard
                      lessonTitle={activeLesson.title}
                      prompt={activeLesson.inputPrompt ?? ''}
                      answer={getInputValue(activeLessonId)}
                      result={lessonCompare}
                      onRefine={() => setRefiningLesson(activeLessonId)}
                      onContinue={onContinue}
                    />
                  )}

                  {/* 3. Input form (idle or refining) */}
                  {showInput && (
                    <div className="bg-purple-50 border border-purple-100 rounded-2xl p-5 mb-8">
                      {activeLesson.inputPrompt && (
                        <p className="text-sm font-semibold text-purple-700 mb-3">{activeLesson.inputPrompt}</p>
                      )}
                      {isRefining && lessonFeedback && !isCompareMode && (
                        <div className="flex items-center gap-2 mb-3 text-xs text-gray-400">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="1 4 1 10 7 10" /><path d="M3.51 15a9 9 0 102.13-9.36L1 10" />
                          </svg>
                          Previous score: <span className="font-semibold text-amber-500">{lessonFeedback.score}/100</span> — refine and save to get a new score
                        </div>
                      )}
                      <textarea
                        className={`w-full bg-white border border-purple-200 focus:border-purple-400 focus:ring-2 focus:ring-purple-100 rounded-xl px-4 py-3 text-sm text-gray-800 placeholder-gray-400 outline-none resize-none transition ${
                          activeLesson.type === 'structured' ? 'min-h-[200px]' : 'min-h-[120px]'
                        }`}
                        placeholder={activeLesson.inputPlaceholder ?? 'Write your answer here…'}
                        value={getInputValue(activeLessonId)}
                        onChange={(e) => setInputDraft((d) => ({ ...d, [activeLessonId]: e.target.value }))}
                      />
                      <div className="mt-3">
                        <button
                          onClick={() => handleSaveInput(activeLessonId)}
                          disabled={!getInputValue(activeLessonId).trim()}
                          className="relative bg-purple-600 hover:bg-purple-700 active:scale-95 disabled:opacity-40 text-white text-sm font-semibold px-6 py-2.5 rounded-xl transition-all duration-150"
                        >
                          {isRefining ? (isCompareMode ? 'Revise & re-score' : 'Save & get new score') : 'Save'}
                          {saveAnimLesson === activeLessonId && (
                            <span className="absolute -top-1 -right-1 pointer-events-none animate-doc-fly" style={{ display: 'inline-flex' }}>
                              <svg width="20" height="20" viewBox="0 0 24 24" fill="white" stroke="#9333ea" strokeWidth="1.5">
                                <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                                <polyline points="14 2 14 8 20 8" />
                              </svg>
                            </span>
                          )}
                        </button>
                      </div>
                    </div>
                  )}
                </>
              );
            })()}

            {/* Action buttons — hidden while saving or showing feedback */}
            <div className={`flex flex-wrap items-center gap-3 pt-2 border-t border-gray-100 mt-2 ${
              (savingLesson === activeLessonId ||
               ((feedbackByLesson[activeLessonId] || compareByLesson[activeLessonId]) && refiningLesson !== activeLessonId)
              ) ? 'hidden' : ''
            }`}>
              <button
                onClick={toggleComplete}
                className={`flex items-center gap-2 text-sm font-semibold px-5 py-2.5 rounded-xl border-2 transition-all duration-150 ${
                  isCompleted
                    ? 'border-purple-600 bg-purple-600 text-white'
                    : 'border-gray-200 text-gray-600 hover:border-purple-300 hover:text-purple-600'
                }`}
              >
                <span>{isCompleted ? '✓' : '○'}</span>
                {isCompleted ? 'Completed' : 'Mark as complete'}
              </button>

              {nextLesson && (
                <button
                  onClick={() => openLesson(nextLesson.id)}
                  className="flex items-center gap-2 text-sm font-semibold px-5 py-2.5 rounded-xl bg-gray-900 text-white hover:bg-gray-800 active:scale-95 transition-all duration-150 ml-auto"
                >
                  Next lesson <span>→</span>
                </button>
              )}

              {!nextLesson && (
                <p className="ml-auto text-sm text-purple-600 font-medium">
                  🎉 You've completed all lessons!
                </p>
              )}
            </div>
          </div>
        </main>
      </div>

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
        />
      )}
    </div>
  );
}
