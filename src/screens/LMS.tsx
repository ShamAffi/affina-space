import { useState, useCallback, useEffect } from 'react';
import { MODULES } from '../data';
import type { UserData, Lesson } from '../types';
import { saveLessonInputToDB, toggleLessonCompleteToDB, syncUserToDB } from '../store';
import ProfileButton from '../components/ProfileButton';
import AccountPanel from '../components/AccountPanel';
import DocumentsPanel from '../components/DocumentsPanel';
import FeedbackCard from '../components/FeedbackCard';

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

  // Save animation + AI feedback flow
  const [saveAnimLesson, setSaveAnimLesson] = useState<string | null>(null);
  const [analyzingLesson, setAnalyzingLesson] = useState<string | null>(null);
  const [feedbackLesson, setFeedbackLesson] = useState<string | null>(null);

  // Ensure user exists in DB when LMS first loads (handles old sessions)
  useEffect(() => { syncUserToDB(userData); }, []);

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

    // doc-fly animation
    setSaveAnimLesson(lessonId);
    setTimeout(() => setSaveAnimLesson(null), 750);

    // avatar ping
    setAvatarPing(true);
    setTimeout(() => setAvatarPing(false), 1350);

    // after doc-fly → analyzing overlay → feedback card
    setTimeout(() => {
      setAnalyzingLesson(lessonId);
      setTimeout(() => {
        setAnalyzingLesson(null);
        setFeedbackLesson(lessonId);
      }, 2200);
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
    setAnalyzingLesson(null);
    setFeedbackLesson(null);
  }

  const handleToggleMenu = useCallback(() => setProfileMenuOpen((v) => !v), []);

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
              {activeLesson.type === 'input' && (
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

            {/* Input lesson — three states: input / analyzing / feedback */}
            {activeLesson.type === 'input' && (
              <>
                {/* 1. Analyzing overlay */}
                {analyzingLesson === activeLessonId && (
                  <div className="bg-white border border-purple-100 rounded-2xl mb-8 flex flex-col items-center justify-center gap-4 py-14 animate-fade-in">
                    <div className="w-12 h-12 rounded-full bg-purple-600 animate-orb-pulse" />
                    <p className="text-sm font-semibold text-gray-400 tracking-wide">Affina AI is analyzing…</p>
                  </div>
                )}

                {/* 2. Feedback card */}
                {feedbackLesson === activeLessonId && (
                  <FeedbackCard
                    lessonTitle={activeLesson.title}
                    prompt={activeLesson.inputPrompt ?? ''}
                    answer={getInputValue(activeLessonId)}
                    onRefine={() => setFeedbackLesson(null)}
                    onContinue={() => {
                      setFeedbackLesson(null);
                      if (!isCompleted) {
                        onUpdateUserData({ completedLessons: [...userData.completedLessons, activeLessonId] });
                        toggleLessonCompleteToDB(userData.email, activeLessonId);
                      }
                      if (nextLesson) openLesson(nextLesson.id);
                    }}
                  />
                )}

                {/* 3. Normal input form */}
                {analyzingLesson !== activeLessonId && feedbackLesson !== activeLessonId && (
                  <div className="bg-purple-50 border border-purple-100 rounded-2xl p-5 mb-8 relative">
                    {activeLesson.inputPrompt && (
                      <p className="text-sm font-semibold text-purple-700 mb-3">{activeLesson.inputPrompt}</p>
                    )}
                    <textarea
                      className="w-full bg-white border border-purple-200 focus:border-purple-400 focus:ring-2 focus:ring-purple-100 rounded-xl px-4 py-3 text-sm text-gray-800 placeholder-gray-400 outline-none resize-none transition min-h-[120px]"
                      placeholder="Write your answer here…"
                      value={getInputValue(activeLessonId)}
                      onChange={(e) =>
                        setInputDraft((d) => ({ ...d, [activeLessonId]: e.target.value }))
                      }
                    />
                    <div className="relative mt-3">
                      <button
                        onClick={() => handleSaveInput(activeLessonId)}
                        className="relative bg-purple-600 hover:bg-purple-700 active:scale-95 text-white text-sm font-semibold px-6 py-2.5 rounded-xl transition-all duration-150 disabled:opacity-50"
                        disabled={!getInputValue(activeLessonId).trim()}
                      >
                        Save
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
            )}

            {/* Action buttons — hidden while feedback card is open */}
            <div className={`flex flex-wrap items-center gap-3 pt-2 border-t border-gray-100 mt-2 ${feedbackLesson === activeLessonId || analyzingLesson === activeLessonId ? 'hidden' : ''}`}>
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
