import { useEffect, useState, useCallback } from 'react';
import { MODULES, COURSES, courseForLessonId } from '../data';
import type { UserData, BrainEntry, ProgressResponse, Task, MentorSessionId, MentorSessionsState } from '../types';
import ProfileButton from '../components/ProfileButton';
import AccountPanel from '../components/AccountPanel';
import DocumentsPanel from '../components/DocumentsPanel';
import MomentumCard from '../components/MomentumCard';
import MentorSessionModal from '../components/MentorSessionModal';

const TASK_STATUS_DOT: Record<string, string> = {
  todo: 'bg-ink-mute',
  submitted: 'bg-amber-400',
  reviewed: 'bg-amber-400',
  done: 'bg-accent-600',
};

// Task pill = its course (via sourceRef → lesson → module); unlinked = neutral "Personal".
const PERSONAL_PILL = { name: 'Personal', color: 'bg-inset text-ink-soft' };
function taskPill(sourceRef: string | null) {
  const c = courseForLessonId(sourceRef);
  return c ? COURSES[c] : PERSONAL_PILL;
}

const allLessons = MODULES.flatMap((m) => m.lessons);

interface Props {
  userData: UserData;
  onUpdateUserData: (updates: Partial<UserData>) => void;
  onGoToLMS: (lessonId?: string) => void;
  onGoToTasks: () => void;
  onGoToTask: (task: Task) => void;
  onGoToPulse: () => void;
  onLogout: () => void;
}

export default function Dashboard({ userData, onUpdateUserData, onGoToLMS, onGoToTasks, onGoToTask, onGoToPulse, onLogout }: Props) {
  const [progressData, setProgressData] = useState<ProgressResponse | null>(null);
  const [brainEntries, setBrainEntries] = useState<BrainEntry[]>([]);
  const [taskList, setTaskList] = useState<Task[]>([]);
  const [panel, setPanel] = useState<'none' | 'account' | 'documents'>('none');
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);

  useEffect(() => {
    if (!userData.email) return;
    const enc = encodeURIComponent(userData.email);

    // Progress: phase + readiness/growth (server-computed)
    fetch(`/api/progress?email=${enc}`)
      .then((r) => r.json())
      .then((data: ProgressResponse) => {
        setProgressData(data);
        if (data.completedLessons || data.lessonInputs) {
          onUpdateUserData({
            completedLessons: [
              ...new Set([...userData.completedLessons, ...(data.completedLessons ?? [])]),
            ],
            lessonInputs: { ...userData.lessonInputs, ...(data.lessonInputs ?? {}) },
          });
        }
      })
      .catch(() => {});

    // Brain entries: for exercisesCount stat
    fetch(`/api/brain?email=${enc}`)
      .then((r) => r.json())
      .then((data) => setBrainEntries(Array.isArray(data) ? data : []))
      .catch(() => {});

    // Tasks: real-world tasks column
    fetch(`/api/tasks?email=${enc}`)
      .then((r) => r.json())
      .then((data) => setTaskList(Array.isArray(data.tasks) ? data.tasks : []))
      .catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userData.email]);

  const handleToggleMenu = useCallback(() => setProfileMenuOpen((v) => !v), []);

  const displayName = userData.name || userData.email.split('@')[0];

  const phase = progressData?.phase ?? 'launch';

  // One card = the current lesson of each active course. Today there's a single course → 1 card.
  // When parallel courses ship, show one card per course capped at 4 (more behind "View all lessons").
  const nextLessons = allLessons.filter((l) => !userData.completedLessons.includes(l.id)).slice(0, 1);

  const completedCount = userData.completedLessons.length;
  const exercisesCount = brainEntries.filter((e) => e.aiScore !== null).length;
  const modulesCompleted = MODULES.filter((m) => m.lessons.every((l) => userData.completedLessons.includes(l.id))).length;
  const momentumCard = progressData?.momentumCard ?? null;
  const streak = progressData?.streak ?? 0;
  const northStar = progressData?.northStar ?? null;

  // §6.5 mentor sessions — due when the trigger module is complete and the session isn't marked done
  const [sessionsState, setSessionsState] = useState<MentorSessionsState>({});
  const [openSession, setOpenSession] = useState<MentorSessionId | null>(null);
  useEffect(() => {
    if (progressData?.mentorSessions) setSessionsState(progressData.mentorSessions);
  }, [progressData]);
  const doneSet = new Set(userData.completedLessons);
  const dueSession: MentorSessionId | null = (() => {
    for (const m of MODULES) {
      if (!m.mentorSessionAfter) continue;
      const complete = m.lessons.every((l) => doneSet.has(l.id));
      if (complete && !sessionsState[m.mentorSessionAfter]?.completed) return m.mentorSessionAfter;
    }
    return null;
  })();

  return (
    <div className="min-h-screen bg-canvas">
      {/* Header */}
      <header className="bg-surface border-b border-hairline flex items-center gap-3 px-4 sm:px-6 py-4 sticky top-0 z-30">
        <span className="text-brand-700 font-bold text-lg tracking-tight select-none">
          Affina<span className="text-ink">Space</span>
        </span>
        <div className="ml-auto flex items-center gap-3">
          <ProfileButton
            avatarPing={false}
            menuOpen={profileMenuOpen}
            onToggleMenu={handleToggleMenu}
            onAccount={() => setPanel('account')}
            onDocuments={() => setPanel('documents')}
            onLogout={onLogout}
          />
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        {/* Greeting */}
        <div className="mb-7">
          <h1 className="font-display text-3xl sm:text-4xl font-medium tracking-tight text-ink">Hello, {displayName}</h1>
          <p className="text-ink-soft mt-1 text-sm sm:text-base">
            Today is a great day to take one more step toward your business goal.
          </p>
        </div>

        {/* Hero: project card + readiness/growth card */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-6">
          {/* Project card */}
          <div className="sm:col-span-2 bg-surface border border-hairline rounded-card p-6 shadow-sm flex flex-col justify-between">
            <div>
              <p className="text-[11px] font-bold text-ink-mute uppercase tracking-widest mb-2">
                Your project
              </p>
              {(() => {
                // Value proposition (m1l5 in Program v2) upgrades the raw onboarding idea once written — same slot, no extra field.
                const description = userData.lessonInputs['m1l5'] || userData.idea;
                if (userData.projectName) {
                  return (
                    <>
                      <p className="text-xl sm:text-2xl font-bold text-ink leading-snug">
                        {userData.projectName}
                      </p>
                      {description && (
                        <p className="text-sm text-ink-soft mt-2 leading-relaxed line-clamp-3">
                          {description}
                        </p>
                      )}
                    </>
                  );
                }
                return (
                  <p className="text-xl sm:text-2xl font-bold text-ink leading-snug line-clamp-3">
                    {description || 'Describe your startup idea to see it here'}
                  </p>
                );
              })()}
            </div>
          </div>

          {/* Phase card — launch or growth */}
          {phase === 'launch' ? (
            <LaunchCard progressData={progressData} />
          ) : (
            <GrowthCard progressData={progressData} />
          )}
        </div>

        {/* 📅 Mentor session due (§6.5) */}
        {dueSession && (
          <div className="flex items-center gap-3 bg-brand-50 border border-brand-200 rounded-card px-5 py-4 mb-6">
            <span className="text-2xl flex-shrink-0">📅</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-brand-800">
                Mentor session {dueSession} is due
              </p>
              <p className="text-xs text-brand-700/70 mt-0.5">
                {dueSession === 'S1' ? 'You finished Module 4 — time for your Start session with a real mentor.'
                  : dueSession === 'S2' ? 'You finished Module 9 — book your Midpoint review.'
                  : 'You finished the program — book your Graduation session.'}
              </p>
            </div>
            <button
              onClick={() => setOpenSession(dueSession)}
              className="flex-shrink-0 bg-brand hover:bg-brand-700 active:scale-95 text-white text-sm font-semibold px-5 py-2.5 rounded-pill transition-all duration-150"
            >
              View & book →
            </button>
          </div>
        )}

        {/* Three columns */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Learning path */}
          <div className="bg-surface border border-hairline rounded-card p-5 shadow-sm flex flex-col md:h-[500px]">
            <div className="mb-4">
              <p className="text-sm font-bold text-ink">Learning path</p>
              <p className="text-xs text-ink-mute mt-0.5">Your courses</p>
            </div>

            <div className="flex flex-col gap-3 flex-1 overflow-y-auto">
              {nextLessons.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center py-6 text-center">
                  <div className="text-2xl mb-2">🎉</div>
                  <p className="text-sm font-semibold text-ink-soft">All lessons complete!</p>
                  <p className="text-xs text-ink-mute mt-1">You've finished the full program.</p>
                </div>
              ) : (
                nextLessons.map((lesson) => {
                  const mod = MODULES.find((m) => m.lessons.some((l) => l.id === lesson.id))!;
                  const modIdx = MODULES.indexOf(mod);
                  const isLocked =
                    modIdx > 0 &&
                    !MODULES[modIdx - 1].lessons.every((l) =>
                      userData.completedLessons.includes(l.id),
                    );
                  return (
                    <button
                      key={lesson.id}
                      onClick={() => !isLocked && onGoToLMS(lesson.id)}
                      disabled={isLocked}
                      className={`w-full text-left bg-inset border border-hairline rounded-control p-4 transition-all duration-150 group ${
                        isLocked
                          ? 'opacity-50 cursor-not-allowed'
                          : 'hover:bg-brand-50 hover:border-brand-200 cursor-pointer'
                      }`}
                    >
                      <span
                        className={`inline-block text-[10px] font-bold rounded-pill px-2.5 py-0.5 mb-2 ${COURSES[mod.courseId].color}`}
                      >
                        {COURSES[mod.courseId].name}
                      </span>
                      <p className="text-sm font-semibold text-ink leading-snug group-hover:text-brand-700 transition-colors">
                        {lesson.title}
                      </p>
                      <p className="text-xs text-ink-mute mt-1">
                        {isLocked
                          ? `Module ${mod.order} · locked`
                          : `Module ${mod.order} · ${lesson.type !== 'text' ? 'exercise' : 'lesson'}`}
                      </p>
                    </button>
                  );
                })
              )}
            </div>

            <button
              onClick={() => onGoToLMS()}
              className="mt-4 w-full text-xs font-semibold text-brand hover:text-brand-700 py-2 text-center transition-colors"
            >
              View all lessons →
            </button>
          </div>

          {/* Your tasks */}
          <div className="bg-surface border border-hairline rounded-card p-5 shadow-sm flex flex-col md:h-[500px]">
            <div className="mb-4">
              <p className="text-sm font-bold text-ink">Your tasks</p>
              <p className="text-xs text-ink-mute mt-0.5">Real-world steps</p>
            </div>

            <div className="flex flex-col gap-2 flex-1 overflow-y-auto">
              {(() => {
                // §5 — dashboard preview only: real-world program tasks that still need
                // action (todo/reviewed) float to the top slots. Full Tasks page keeps its order.
                const needsAction = (t: Task) => t.status === 'todo' || t.status === 'reviewed';
                const isProgramActive = (t: Task) => t.source === 'program' && needsAction(t);
                const activeTasks = taskList
                  .filter((t) => t.status !== 'done')
                  .slice()
                  .sort((a, b) => (isProgramActive(b) ? 1 : 0) - (isProgramActive(a) ? 1 : 0));
                if (activeTasks.length === 0) {
                  return (
                    <div className="flex-1 flex items-center justify-center">
                      <div className="bg-inset border border-dashed border-hairline rounded-control p-4 text-center w-full">
                        <p className="text-xs text-ink-mute leading-relaxed">
                          {taskList.length > 0
                            ? 'All tasks completed! 🎉'
                            : 'Complete an exercise with the AI mentor to get your first real-world task.'}
                        </p>
                      </div>
                    </div>
                  );
                }
                return activeTasks.slice(0, 4).map((task) => {
                  const status = task.status ?? 'todo';
                  return (
                    <button
                      key={task.id}
                      onClick={() => onGoToTask(task)}
                      className="w-full text-left bg-inset border border-hairline rounded-control px-3 py-3 hover:bg-brand-50 hover:border-brand-200 transition-all duration-150 group"
                    >
                      <div className="flex items-center gap-1.5 mb-1.5">
                        {(() => { const pill = taskPill(task.sourceRef); return (
                          <span className={`text-[10px] font-bold rounded-pill px-2 py-0.5 ${pill.color}`}>{pill.name}</span>
                        ); })()}
                        <span className={`ml-auto w-1.5 h-1.5 rounded-pill flex-shrink-0 ${TASK_STATUS_DOT[status] ?? 'bg-ink-mute'}`} />
                      </div>
                      <p className="text-sm font-semibold text-ink line-clamp-2 group-hover:text-brand-700 transition-colors leading-snug">
                        {task.title}
                      </p>
                    </button>
                  );
                });
              })()}
            </div>

            <button
              onClick={onGoToTasks}
              className="mt-4 w-full text-xs font-semibold text-brand hover:text-brand-700 py-2 text-center transition-colors"
            >
              {taskList.filter((t) => t.status !== 'done').length > 4
                ? `Show all ${taskList.filter((t) => t.status !== 'done').length} tasks →`
                : 'All tasks →'}
            </button>
          </div>

          {/* Momentum — AI-composed dynamic card */}
          <MomentumCard
            card={momentumCard}
            northStar={northStar}
            lessonsDone={completedCount}
            exercisesScored={exercisesCount}
            modulesCompleted={modulesCompleted}
            streak={streak}
            lastCheckInAt={progressData?.lastCheckInAt ?? null}
            onGoToPulse={onGoToPulse}
          />
        </div>
      </main>

      {openSession && (
        <MentorSessionModal
          session={openSession}
          email={userData.email}
          completed={!!sessionsState[openSession]?.completed}
          onClose={() => setOpenSession(null)}
          onCompletedChange={(completed) =>
            setSessionsState((s) => ({ ...s, [openSession]: { completed } }))
          }
        />
      )}

      {panel === 'account' && (
        <AccountPanel userData={userData} onClose={() => setPanel('none')} onSave={onUpdateUserData} />
      )}
      {panel === 'documents' && (
        <DocumentsPanel
          email={userData.email}
          onClose={() => setPanel('none')}
          onLessonInputSaved={(lessonId, content) =>
            onUpdateUserData({ lessonInputs: { ...userData.lessonInputs, [lessonId]: content } })
          }
          context={{ name: userData.name, idea: userData.idea, customer: userData.customer, stage: userData.stage }}
        />
      )}
    </div>
  );
}

// ─── Launch readiness card ────────────────────────────────────────────────────
function LaunchCard({ progressData }: { progressData: ProgressResponse | null }) {
  const launch = progressData?.phase === 'launch' ? progressData.launch : null;
  const readiness = launch?.readiness ?? 0;
  const seed = launch?.seed ?? 0;
  const gain = progressData?.lastReadinessGain ?? null;
  const loading = progressData === null;

  return (
    <div className="bg-surface border border-hairline rounded-card p-6 shadow-sm flex flex-col">
      <p className="text-[11px] font-bold text-ink-mute uppercase tracking-widest mb-3">
        Launch readiness
      </p>

      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="w-8 h-8 rounded-pill border-2 border-brand-200 border-t-brand-600 animate-spin" />
        </div>
      ) : (
        <>
          <div className="flex items-end gap-1 mb-3">
            <span className="text-5xl font-extrabold text-brand leading-none tabular-nums">
              {readiness}
            </span>
            <span className="text-xl text-brand-200 mb-1">/100</span>
          </div>

          <div className="w-full h-2 bg-inset rounded-pill overflow-hidden mb-2">
            <div
              className="h-2 bg-brand rounded-pill transition-all duration-700"
              style={{ width: `${readiness}%` }}
            />
          </div>

          {/* Last earned gain — falls back to the idea-score head-start until the first exercise is scored */}
          {gain && gain.delta > 0 ? (
            <p className="text-[11px] text-ink-mute">
              🌱 <span className="font-semibold text-accent-600">+{gain.delta}</span> from your {gain.sourceLabel}
            </p>
          ) : seed > 0 ? (
            <p className="text-[11px] text-ink-mute">
              🌱 <span className="font-semibold text-brand-600">+{seed}</span> head-start from your idea score
            </p>
          ) : null}

          {readiness >= 90 && (
            <p className="mt-3 text-xs text-amber-700 leading-relaxed bg-amber-50 border border-amber-100 rounded-control px-3 py-2">
              🎉 You've taken this as far as the program goes. Book a session with a real mentor to validate your plan and map your next phase.
            </p>
          )}
        </>
      )}
    </div>
  );
}

// ─── Growth card ─────────────────────────────────────────────────────────────
function GrowthCard({ progressData }: { progressData: ProgressResponse | null }) {
  const growth = progressData?.phase === 'growth' ? progressData.growth : null;

  return (
    <div className="bg-surface border border-hairline rounded-card p-6 shadow-sm flex flex-col">
      <p className="text-[11px] font-bold text-ink-mute uppercase tracking-widest mb-3">
        Growth
      </p>

      {!growth ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="w-8 h-8 rounded-pill border-2 border-accent-100 border-t-accent-600 animate-spin" />
        </div>
      ) : (
        <>
          <p className="text-2xl font-extrabold text-accent-600 leading-none mb-1">{growth.tierName}</p>
          <p className="text-sm text-ink-soft mb-4 tabular-nums">{growth.xp} XP</p>

          <div className="w-full h-2 bg-inset rounded-pill overflow-hidden mb-2">
            <div
              className="h-2 bg-accent rounded-pill transition-all duration-700"
              style={{ width: `${growth.progressToNext}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-xs text-ink-mute mb-4">
            <span className="font-semibold text-accent-600">{growth.progressToNext}%</span>
            {growth.nextTierName && (
              <span>
                → <span className="font-semibold text-ink-soft">{growth.nextTierName}</span>
              </span>
            )}
          </div>

          <span className="inline-flex items-center gap-1.5 text-xs font-bold bg-accent-50 text-accent-800 rounded-pill px-3 py-1.5 self-start">
            Tier {growth.tier} of 5
          </span>
        </>
      )}
    </div>
  );
}
