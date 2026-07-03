import { useEffect, useState } from 'react';
import type { Task, TaskSource } from '../types';
import { MODULES, COURSES, courseForLessonId } from '../data';

// lessonId → fieldTask config (for interview-log progress counters on program cards)
const FIELD_TASKS: Record<string, { artifactType: string; minEntries?: number }> = {};
for (const m of MODULES) for (const l of m.lessons) if (l.fieldTask) FIELD_TASKS[l.id] = l.fieldTask;

// Card pill = its course (via sourceRef → lesson → module); unlinked = neutral "Personal" (§6).
const PERSONAL_PILL = { name: 'Personal', color: 'bg-inset text-ink-soft' };
function taskPill(sourceRef: string | null) {
  const c = courseForLessonId(sourceRef);
  return c ? COURSES[c] : PERSONAL_PILL;
}

// §6 variant B (Shamil): two buckets. "Real World" = program field missions only;
// "Practice" = everything platform-generated or self-added (mentor/pulse/self/…).
type BucketId = 'realworld' | 'practice';
const BUCKETS: { id: BucketId; label: string; match: (s: TaskSource) => boolean }[] = [
  { id: 'realworld', label: 'Real World Tasks', match: (s) => s === 'program' },
  { id: 'practice', label: 'Practice Tasks', match: (s) => s !== 'program' },
];

const STATUS_DOT: Record<string, string> = {
  todo: 'bg-ink-mute',
  submitted: 'bg-amber-400',
  reviewed: 'bg-amber-400',
  done: 'bg-accent-600',
};

const STATUS_LABEL: Record<string, string> = {
  todo: 'to do',
  submitted: 'in review',
  reviewed: 'needs work',
  done: 'done',
};

interface Props {
  email: string;
  onGoToTask: (task: Task) => void;
  onGoToDashboard: () => void;
}

export default function Tasks({ email, onGoToTask, onGoToDashboard }: Props) {
  const [taskList, setTaskList] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [addTitle, setAddTitle] = useState('');
  const [addInstruction, setAddInstruction] = useState('');
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    if (!email) return;
    fetch(`/api/tasks?email=${encodeURIComponent(email)}`)
      .then((r) => r.json())
      .then((data) => {
        setTaskList(Array.isArray(data.tasks) ? data.tasks : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [email]);

  async function handleAddTask() {
    if (!addTitle.trim() || !addInstruction.trim()) return;
    setAdding(true);
    try {
      const r = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, title: addTitle.trim(), instruction: addInstruction.trim() }),
      });
      const data = await r.json();
      if (data.task) {
        setTaskList((prev) => [...prev, data.task]);
        setAddTitle('');
        setAddInstruction('');
        setShowAddForm(false);
      }
    } finally {
      setAdding(false);
    }
  }

  const active = taskList.filter((t) => t.status !== 'done');
  const bucketTasks: Record<BucketId, Task[]> = {
    realworld: active.filter((t) => BUCKETS[0].match(t.source as TaskSource)),
    practice: active.filter((t) => BUCKETS[1].match(t.source as TaskSource)),
  };

  const doneTasks = taskList.filter((t) => t.status === 'done');
  const totalActive = taskList.filter((t) => t.status !== 'done').length;

  return (
    <div className="min-h-screen bg-canvas">
      {/* Header */}
      <header className="bg-surface border-b border-hairline flex items-center gap-3 px-4 sm:px-6 py-4 sticky top-0 z-30">
        <button
          onClick={onGoToDashboard}
          className="flex items-center gap-1.5 text-ink-soft hover:text-ink transition-colors"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          <span className="text-sm font-medium">Dashboard</span>
        </button>

        <span className="text-ink-mute">|</span>
        <span className="text-sm font-bold text-ink">
          Tasks
          {totalActive > 0 && (
            <span className="ml-1.5 text-xs font-bold bg-brand-100 text-brand-700 rounded-pill px-1.5 py-0.5 tabular-nums">
              {totalActive}
            </span>
          )}
        </span>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8">
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 rounded-pill border-2 border-brand-200 border-t-brand-600 animate-spin" />
          </div>
        ) : (
          <div className="flex flex-col gap-8">
            {BUCKETS.filter((b) => b.id === 'practice' || bucketTasks[b.id].length > 0).map((bucket) => {
              const g = bucketTasks[bucket.id];
              const isPractice = bucket.id === 'practice';  // Add-task lives here (self tasks land in Practice)
              return (
                <section key={bucket.id}>
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="text-xs font-bold text-ink-mute uppercase tracking-widest">
                      {bucket.label}
                    </h2>
                    {isPractice && (
                      <button
                        onClick={() => setShowAddForm((v) => !v)}
                        className="flex items-center gap-1 text-xs font-semibold text-brand hover:text-brand-700 transition-colors"
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <line x1="12" y1="5" x2="12" y2="19" />
                          <line x1="5" y1="12" x2="19" y2="12" />
                        </svg>
                        Add task
                      </button>
                    )}
                  </div>

                  {/* Add task form */}
                  {isPractice && showAddForm && (
                    <div className="bg-surface border border-brand-100 rounded-card p-5 mb-3 shadow-sm">
                      <p className="text-sm font-bold text-ink mb-3">New task</p>
                      <input
                        type="text"
                        value={addTitle}
                        onChange={(e) => setAddTitle(e.target.value)}
                        placeholder="Task title (short)"
                        maxLength={60}
                        className="w-full text-sm border border-hairline rounded-control px-3 py-2 mb-3 outline-none focus:ring-2 focus:ring-brand-200 placeholder-ink-mute"
                      />
                      <textarea
                        value={addInstruction}
                        onChange={(e) => setAddInstruction(e.target.value)}
                        placeholder="What do you need to do? Include context and expected outcome…"
                        rows={3}
                        className="w-full text-sm border border-hairline rounded-control px-3 py-2 mb-3 outline-none focus:ring-2 focus:ring-brand-200 placeholder-ink-mute resize-none"
                      />
                      <div className="flex gap-2 justify-end">
                        <button
                          onClick={() => { setShowAddForm(false); setAddTitle(''); setAddInstruction(''); }}
                          className="text-sm text-ink-mute hover:text-ink-soft px-4 py-2 transition-colors"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleAddTask}
                          disabled={adding || !addTitle.trim() || !addInstruction.trim()}
                          className="text-sm font-semibold bg-brand hover:bg-brand-700 text-white px-5 py-2 rounded-pill transition-colors disabled:opacity-50"
                        >
                          {adding ? 'Adding…' : 'Add'}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Task cards */}
                  {g.length === 0 && isPractice ? (
                    <div className="bg-surface border border-dashed border-hairline rounded-card px-5 py-6 text-center">
                      <p className="text-xs text-ink-mute">
                        No practice tasks yet. Click "+ Add task" to create one.
                      </p>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-2">
                      {g.map((task) => (
                        <TaskCard key={task.id} task={task} onGoToTask={onGoToTask} />
                      ))}
                    </div>
                  )}
                </section>
              );
            })}
          {/* Completed tasks */}
          {doneTasks.length > 0 && (
            <section>
              <h2 className="text-xs font-bold text-ink-mute uppercase tracking-widest mb-3">
                Completed
              </h2>
              <div className="flex flex-col gap-2">
                {doneTasks.map((task) => (
                  <button
                    key={task.id}
                    onClick={() => onGoToTask(task)}
                    className="w-full text-left bg-surface border border-hairline rounded-card px-4 py-4 hover:border-accent-100 hover:bg-accent-50 transition-all duration-150 shadow-sm group"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      {(() => { const pill = taskPill(task.sourceRef); return (
                        <span className={`text-[10px] font-bold rounded-pill px-2.5 py-0.5 ${pill.color}`}>{pill.name}</span>
                      ); })()}
                      <div className="ml-auto flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-pill bg-accent-600" />
                        <span className="text-[10px] text-accent-600 font-semibold">done</span>
                      </div>
                    </div>
                    <p className="text-sm font-semibold text-ink-soft line-clamp-2 group-hover:text-accent-800 transition-colors leading-snug line-through decoration-gray-300">
                      {task.title}
                    </p>
                  </button>
                ))}
              </div>
            </section>
          )}
          </div>
        )}
      </main>
    </div>
  );
}

function TaskCard({ task, onGoToTask }: { task: Task; onGoToTask: (t: Task) => void }) {
  const status = task.status ?? 'todo';
  return (
    <button
      onClick={() => onGoToTask(task)}
      className="w-full text-left bg-surface border border-hairline rounded-card px-4 py-4 hover:border-brand-200 hover:bg-brand-50 transition-all duration-150 shadow-sm group"
    >
      <div className="flex items-center gap-2 mb-2">
        {(() => { const pill = taskPill(task.sourceRef); return (
          <span className={`text-[10px] font-bold rounded-pill px-2.5 py-0.5 ${pill.color}`}>{pill.name}</span>
        ); })()}
        {(() => {
          // Interview-log progress counter (§3.3), e.g. "3/10"
          const ft = task.sourceRef ? FIELD_TASKS[task.sourceRef] : undefined;
          if (ft?.artifactType !== 'interview_log') return null;
          const n = task.submissionData?.interviewLog?.length ?? 0;
          return (
            <span className={`text-[10px] font-bold rounded-pill px-2 py-0.5 ${n >= (ft.minEntries ?? 1) ? 'bg-accent-50 text-accent-800' : 'bg-inset text-ink-soft'}`}>
              🎙 {n}/10
            </span>
          );
        })()}
        <div className="ml-auto flex items-center gap-1.5">
          <span className={`w-1.5 h-1.5 rounded-pill ${STATUS_DOT[status] ?? 'bg-ink-mute'}`} />
          <span className="text-[10px] text-ink-mute font-medium">{STATUS_LABEL[status] ?? status}</span>
        </div>
      </div>
      <p className="text-sm font-semibold text-ink line-clamp-2 group-hover:text-brand-700 transition-colors leading-snug">
        {task.title}
      </p>
    </button>
  );
}
