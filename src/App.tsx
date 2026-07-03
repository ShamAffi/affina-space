import { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useParams, useLocation } from 'react-router-dom';
import type { UserData, Task } from './types';
import { loadUserData, updateUserData, defaultUserData, saveUserData } from './store';
import { MODULES } from './data';
import Welcome from './screens/Welcome';
import Onboarding from './screens/Onboarding';
import Dashboard from './screens/Dashboard';
import LMS from './screens/LMS';
import Tasks from './screens/Tasks';
import TaskDetail from './screens/TaskDetail';
import MetricPulse from './screens/MetricPulse';
import Paywall from './screens/Paywall';
import StartSession from './screens/StartSession';

// Single course for now; the URL keeps a course segment so parallel courses slot in later.
const COURSE_SLUG = 'launch';
const M5_FIRST = 'm5l1';

// SPEC_PAYWALL — a lesson is gated when its module is paid (M5+) and she isn't subscribed.
const PAID_LESSON_IDS = new Set(MODULES.filter((m) => m.paid).flatMap((m) => m.lessons.map((l) => l.id)));
export function isPaidLocked(lessonId: string | undefined, subscribed: boolean): boolean {
  return !!lessonId && !subscribed && PAID_LESSON_IDS.has(lessonId);
}

export default function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}

function AppRoutes() {
  const navigate = useNavigate();
  const [userData, setUserData] = useState<UserData>(loadUserData);
  const authed = !!userData.email;

  function update(updates: Partial<UserData>): UserData {
    const merged = updateUserData(updates);
    setUserData(merged);
    return merged;
  }

  function logout() {
    saveUserData(defaultUserData);
    setUserData(defaultUserData);
    navigate('/');
  }

  async function signIn(email: string) {
    const withEmail = update({ email });
    navigate('/dashboard');
    try {
      const res = await fetch(`/api/user?email=${encodeURIComponent(email)}`);
      if (res.ok) {
        const db = await res.json();
        update({
          name: db.name || withEmail.name,
          projectName: db.projectName || withEmail.projectName,
          idea: db.idea || withEmail.idea,
          customer: db.customer || withEmail.customer,
          businessModel: db.businessModel || withEmail.businessModel,
          stage: db.stage || withEmail.stage,
          goal: db.goal || withEmail.goal,
          score: db.score || withEmail.score,
          subscribed: db.subscribed ?? false,
        });
      }
    } catch { /* fail silently — localStorage is the fallback */ }
  }

  const toLanding = <Navigate to="/" replace />;

  return (
    <Routes>
      {/* Public — / is the (future) landing; for now reuse the hero with a Start CTA */}
      <Route
        path="/"
        element={authed ? <Navigate to="/dashboard" replace /> : <Welcome onStart={() => navigate('/start')} onSignIn={signIn} />}
      />
      <Route
        path="/start"
        element={<Onboarding userData={userData} update={update} signIn={signIn} onComplete={() => navigate(`/learning/${COURSE_SLUG}/m0l1`)} />}
      />
      <Route path="/login" element={<LoginPlaceholder onSignIn={signIn} />} />
      <Route path="/auth/verify" element={<VerifyPlaceholder />} />

      {/* App */}
      <Route
        path="/dashboard"
        element={authed ? (
          <Dashboard
            userData={userData}
            onUpdateUserData={update}
            onGoToLMS={(id) => navigate(id ? `/learning/${COURSE_SLUG}/${id}` : '/learning')}
            onGoToTasks={() => navigate('/tasks')}
            onGoToTask={(task) => navigate('/tasks', { state: { task } })}
            onGoToPulse={() => navigate('/traction')}
            onGoToPaywall={() => navigate('/unlock')}
            onLogout={logout}
          />
        ) : toLanding}
      />

      <Route path="/learning/*" element={authed ? <LMSRoute userData={userData} update={update} logout={logout} onGoToPaywall={() => navigate('/unlock')} /> : toLanding} />

      <Route path="/tasks" element={authed ? <TasksRoute email={userData.email} /> : toLanding} />

      {/* SPEC_PAYWALL — full-page overlay gating M5–M12 (dismissible → Dashboard) */}
      <Route
        path="/unlock"
        element={authed ? (
          <Paywall
            email={userData.email}
            onSubscribed={() => { update({ subscribed: true }); navigate('/start-session'); }}
            onDismiss={() => navigate('/dashboard')}
          />
        ) : toLanding}
      />
      {/* Post-paywall S1 booking — required step, both CTAs advance to M5 */}
      <Route
        path="/start-session"
        element={authed ? (
          <StartSession email={userData.email} onContinue={() => navigate(`/learning/${COURSE_SLUG}/${M5_FIRST}`)} />
        ) : toLanding}
      />

      <Route
        path="/traction"
        element={authed ? <MetricPulse email={userData.email} projectName={userData.projectName} onBack={() => navigate('/dashboard')} /> : toLanding}
      />
      <Route
        path="/traction/check-in"
        element={authed ? <MetricPulse email={userData.email} projectName={userData.projectName} onBack={() => navigate('/dashboard')} /> : toLanding}
      />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

// ─── Route wrappers (screen components stay unchanged) ─────────────────────────
function LMSRoute({ userData, update, logout, onGoToPaywall }: {
  userData: UserData;
  update: (updates: Partial<UserData>) => UserData;
  logout: () => void;
  onGoToPaywall: () => void;
}) {
  const navigate = useNavigate();
  const params = useParams();
  // Splat "/learning/*" → e.g. "launch/m1l3"; lessonId is the 2nd segment (undefined for bare /learning).
  const lessonId = (params['*'] ?? '').split('/')[1] || undefined;
  // Re-trigger: direct entry to a gated M5+ lesson while unsubscribed reopens the paywall.
  if (isPaidLocked(lessonId, userData.subscribed)) {
    return <Navigate to="/unlock" replace />;
  }
  return (
    <LMS
      userData={userData}
      onUpdateUserData={update}
      onGoToDashboard={() => navigate('/dashboard')}
      onLogout={logout}
      initialLessonId={lessonId}
      onActiveLessonChange={(id) => navigate(`/learning/${COURSE_SLUG}/${id}`, { replace: true })}
      onGoToTasks={() => navigate('/tasks')}
      onGoToPaywall={onGoToPaywall}
    />
  );
}

// Tasks are unique & unbounded per user → no /tasks/:id. Detail opens as in-page state.
function TasksRoute({ email }: { email: string }) {
  const navigate = useNavigate();
  const location = useLocation();
  const initial = (location.state as { task?: Task } | null)?.task ?? null;
  const [selected, setSelected] = useState<Task | null>(initial);

  if (selected) {
    return <TaskDetail task={selected} email={email} onBack={() => setSelected(null)} />;
  }
  return (
    <Tasks
      email={email}
      onGoToTask={(task) => setSelected(task)}
      onGoToDashboard={() => navigate('/dashboard')}
    />
  );
}

// ─── Placeholders for /login and /auth/verify (magic-link auth ships later) ────
function LoginPlaceholder({ onSignIn }: { onSignIn: (email: string) => void }) {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const valid = email.trim().includes('@') && email.trim().includes('.');
  return (
    <div className="min-h-screen bg-canvas flex flex-col items-center justify-center px-5">
      <div className="w-full max-w-sm text-center">
        <span className="text-brand-700 font-bold text-xl tracking-tight">
          Affina<span className="text-ink">Space</span>
        </span>
        <h1 className="mt-6 text-2xl font-extrabold text-ink mb-2">Welcome back</h1>
        <p className="text-sm text-ink-soft mb-6">Enter your email to load your account.</p>
        <input
          type="email"
          autoFocus
          placeholder="you@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && valid) onSignIn(email.trim()); }}
          className="w-full rounded-card border-2 border-hairline focus:border-brand-400 focus:ring-4 focus:ring-brand-100 outline-none px-5 py-4 text-base text-ink placeholder-ink-mute transition mb-3"
        />
        <button
          onClick={() => { if (valid) onSignIn(email.trim()); }}
          disabled={!valid}
          className="w-full bg-brand hover:bg-brand-700 active:scale-95 disabled:opacity-40 text-white text-base font-semibold py-4 rounded-pill transition mb-3"
        >
          Continue →
        </button>
        <button onClick={() => navigate('/')} className="text-sm text-ink-mute hover:text-ink-soft transition">
          New here? Start free
        </button>
      </div>
    </div>
  );
}

function VerifyPlaceholder() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-canvas flex flex-col items-center justify-center px-5 text-center">
      <span className="text-brand-700 font-bold text-xl tracking-tight">
        Affina<span className="text-ink">Space</span>
      </span>
      <p className="mt-6 text-ink-soft text-sm">Email verification is coming soon.</p>
      <button
        onClick={() => navigate('/')}
        className="mt-6 bg-brand hover:bg-brand-700 text-white text-sm font-semibold px-8 py-3 rounded-pill transition"
      >
        Continue →
      </button>
    </div>
  );
}
