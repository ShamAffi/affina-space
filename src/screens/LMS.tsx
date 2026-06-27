import { useState } from 'react';
import { MODULES } from '../data';
import type { UserData, Lesson } from '../types';
import { saveLessonInputToDB, toggleLessonCompleteToDB } from '../store';

interface Props {
  userData: UserData;
  onUpdateUserData: (updates: Partial<UserData>) => void;
}

const allLessons: Lesson[] = MODULES.flatMap((m) => m.lessons);

export default function LMS({ userData, onUpdateUserData }: Props) {
  const [activeLessonId, setActiveLessonId] = useState<string>('m1l1');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [inputDraft, setInputDraft] = useState<Record<string, string>>({});

  const activeLesson = allLessons.find((l) => l.id === activeLessonId)!;
  const activeLessonIdx = allLessons.findIndex((l) => l.id === activeLessonId);
  const nextLesson = allLessons[activeLessonIdx + 1];
  const isCompleted = userData.completedLessons.includes(activeLessonId);

  const activeModule = MODULES.find((m) =>
    m.lessons.some((l) => l.id === activeLessonId),
  );

  function getInputValue(lessonId: string): string {
    return inputDraft[lessonId] ?? userData.lessonInputs[lessonId] ?? '';
  }

  function handleSaveInput(lessonId: string) {
    const val = getInputValue(lessonId);
    onUpdateUserData({
      lessonInputs: { ...userData.lessonInputs, [lessonId]: val },
    });
    saveLessonInputToDB(userData.email, lessonId, val);
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
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Top bar */}
      <header className="bg-white border-b border-gray-100 flex items-center gap-3 px-4 sm:px-6 py-4 sticky top-0 z-30">
        {/* Mobile menu toggle */}
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

        {/* Progress chip */}
        <div className="ml-auto flex items-center gap-2 text-xs text-gray-500 bg-gray-50 border border-gray-200 rounded-full px-3 py-1">
          <span className="text-purple-600 font-semibold">
            {userData.completedLessons.length}
          </span>
          <span>/</span>
          <span>{allLessons.length} completed</span>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden relative">
        {/* Mobile overlay */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/30 z-20 md:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Sidebar */}
        <aside
          className={`
            fixed md:static top-0 left-0 h-full md:h-auto z-20 md:z-auto
            w-72 md:w-72 bg-white border-r border-gray-100
            transform transition-transform duration-300
            ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
            overflow-y-auto flex-shrink-0
            pt-16 md:pt-0
          `}
        >
          <div className="p-4">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest px-2 mb-4">
              Program
            </p>

            {MODULES.map((mod) => {
              const modCompleted = mod.lessons.filter((l) =>
                userData.completedLessons.includes(l.id),
              ).length;

              return (
                <div key={mod.id} className="mb-6">
                  {/* Module header */}
                  <div className="flex items-center gap-2 px-2 mb-2">
                    <span className="text-xs font-bold text-purple-500 bg-purple-50 rounded-md px-1.5 py-0.5">
                      {String(mod.order).padStart(2, '0')}
                    </span>
                    <span className="text-sm font-semibold text-gray-900 flex-1">
                      {mod.title}
                    </span>
                    <span className="text-xs text-gray-400">
                      {modCompleted}/{mod.lessons.length}
                    </span>
                  </div>

                  {/* Lessons */}
                  <div className="flex flex-col gap-0.5">
                    {mod.lessons.map((lesson) => {
                      const done = userData.completedLessons.includes(lesson.id);
                      const active = lesson.id === activeLessonId;

                      return (
                        <button
                          key={lesson.id}
                          onClick={() => openLesson(lesson.id)}
                          className={`w-full text-left flex items-start gap-2.5 px-3 py-2.5 rounded-xl text-sm transition-all duration-150 ${
                            active
                              ? 'bg-purple-50 text-purple-700 font-medium'
                              : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                          }`}
                        >
                          <span
                            className={`flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center mt-0.5 text-xs transition-all ${
                              done
                                ? 'bg-purple-600 border-purple-600 text-white'
                                : active
                                  ? 'border-purple-500'
                                  : 'border-gray-200'
                            }`}
                          >
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
            {/* Lesson meta */}
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

            {/* Optional media placeholder */}
            {activeLesson.media && (
              <div className="w-full h-48 bg-gray-100 rounded-2xl flex items-center justify-center text-gray-400 mb-6 border border-gray-200">
                <span className="text-sm">
                  {activeLesson.media.kind === 'video' ? '▶ Video' : '🖼 Image'}
                </span>
              </div>
            )}

            <div className="prose prose-gray max-w-none mb-8">
              <p className="text-gray-700 text-base sm:text-lg leading-relaxed">
                {activeLesson.body}
              </p>
            </div>

            {/* Input lesson */}
            {activeLesson.type === 'input' && (
              <div className="bg-purple-50 border border-purple-100 rounded-2xl p-5 mb-8">
                {activeLesson.inputPrompt && (
                  <p className="text-sm font-semibold text-purple-700 mb-3">
                    {activeLesson.inputPrompt}
                  </p>
                )}
                <textarea
                  className="w-full bg-white border border-purple-200 focus:border-purple-400 focus:ring-2 focus:ring-purple-100 rounded-xl px-4 py-3 text-sm text-gray-800 placeholder-gray-400 outline-none resize-none transition min-h-[120px]"
                  placeholder="Write your answer here…"
                  value={getInputValue(activeLessonId)}
                  onChange={(e) =>
                    setInputDraft((d) => ({ ...d, [activeLessonId]: e.target.value }))
                  }
                />
                <button
                  onClick={() => handleSaveInput(activeLessonId)}
                  className="mt-3 bg-purple-600 hover:bg-purple-700 active:scale-95 text-white text-sm font-semibold px-6 py-2.5 rounded-xl transition-all duration-150"
                >
                  Save
                </button>
                {userData.lessonInputs[activeLessonId] && !inputDraft[activeLessonId] && (
                  <p className="mt-2 text-xs text-purple-500">Saved ✓</p>
                )}
              </div>
            )}

            {/* Action buttons */}
            <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-gray-100 mt-2">
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
    </div>
  );
}
