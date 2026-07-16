import { useState, useEffect, useRef, lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useParams, useLocation } from 'react-router-dom';
import type { UserData, Task } from './types';
import { loadUserData, updateUserData, defaultUserData, saveUserData } from './store';
import { setSessionExpiredHandler, triggerSessionExpired, resetSessionExpired } from './rateLimit';
import { initAnalytics, track } from './lib/analytics';
import Welcome from './screens/Welcome'; // eager — the landing/first paint
// Code-split (audit F43): everything past the landing loads on demand, so the initial
// bundle (the conversion funnel entry) is small. data.ts lives in these chunks, not main.
const Onboarding = lazy(() => import('./screens/Onboarding'));
const Dashboard = lazy(() => import('./screens/Dashboard'));
const LMS = lazy(() => import('./screens/LMS'));
const Tasks = lazy(() => import('./screens/Tasks'));
const TaskDetail = lazy(() => import('./screens/TaskDetail'));
const MetricPulse = lazy(() => import('./screens/MetricPulse'));
const Paywall = lazy(() => import('./screens/Paywall'));
const StartSession = lazy(() => import('./screens/StartSession'));
const Programs = lazy(() => import('./screens/Programs'));
const ReportPage = lazy(() => import('./screens/ReportPage'));
const WelcomeZone = lazy(() => import('./screens/WelcomeZone'));

// Lightweight fallback while a route chunk loads.
function RouteFallback() {
  return (
    <div className="min-h-screen bg-canvas flex items-center justify-center">
      <div className="w-8 h-8 rounded-pill bg-brand animate-orb-pulse" />
    </div>
  );
}

const M0_FIRST = 'm0l1';

// Single course for now; the URL keeps a course segment so parallel courses slot in later.
const COURSE_SLUG = 'launch';
const M5_FIRST = 'm5l1';

// SPEC_PAYWALL — a lesson is gated when its module is paid (M5+) and she isn't subscribed.
// Parsed from the id (m{N}l{block}, paid ⟺ N≥5) so App doesn't import the 125KB data.ts into
// the initial bundle (audit F43 code-splitting). The server independently enforces this.
export function isPaidLocked(lessonId: string | undefined, subscribed: boolean): boolean {
  if (!lessonId || subscribed) return false;
  const m = /^m(\d+)l\d+$/.exec(lessonId);
  return m ? Number(m[1]) >= 5 : false;
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
  const location = useLocation();
  const [userData, setUserData] = useState<UserData>(loadUserData);
  // audit F39 — "authed" means a real verified session, not just a typed email. A user
  // mid-onboarding (email captured, not yet verified) is verified:false → not authed, so a
  // refresh/return doesn't bounce her to /dashboard → 401 → wiped state. Legacy localStorage
  // has no `verified` field (undefined) → treated as authed, so existing sessions aren't logged out.
  const authed = !!userData.email && userData.verified !== false;

  function update(updates: Partial<UserData>): UserData {
    const merged = updateUserData(updates);
    setUserData(merged);
    return merged;
  }

  // Analytics (SPEC_ANALYTICS §2): capture UTM + arm the beacon flush once, then fire an
  // auto page_view on every route change. Fail-silent — never blocks routing.
  useEffect(() => { initAnalytics(); }, []);
  useEffect(() => { track('page_view'); }, [location.pathname]);

  // Auth Phase B (§5) — session expiry is handled centrally: a 401 from any guarded /api
  // call clears local state and bounces to /login. Register the action here; rateLimit's
  // checkRes AND the fetch interceptor below both route through triggerSessionExpired, so
  // every call site behaves identically (never a fake "server hiccup").
  useEffect(() => {
    setSessionExpiredHandler(() => {
      saveUserData(defaultUserData);
      setUserData(defaultUserData);
      navigate('/login');
    });
  }, [navigate]);

  // Catch 401s from raw fetches that don't go through checkRes (GET progress/brain/tasks,
  // PATCH user, …). /api/auth 401s are token errors (handled by Verify), not session expiry.
  useEffect(() => {
    const orig = window.fetch;
    window.fetch = async (...args: Parameters<typeof fetch>) => {
      const res = await orig(...args);
      try {
        const first = args[0];
        const url = typeof first === 'string' ? first : first instanceof Request ? first.url : String(first);
        if (res.status === 401 && url.includes('/api/') && !url.includes('/api/auth')) triggerSessionExpired();
      } catch { /* the interceptor must never break a fetch */ }
      return res;
    };
    return () => { window.fetch = orig; };
  }, []);

  async function logout() {
    // §5 — clear the server cookie, then the local state, then land on /login.
    try {
      await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'logout' }),
      });
    } catch { /* clear locally regardless */ }
    saveUserData(defaultUserData);
    setUserData(defaultUserData);
    navigate('/login');
  }

  // Loads the SESSION user's profile (identity from the cookie). Called after a verified
  // magic link — the only way to authenticate in Phase B. `email` seeds localStorage; the
  // GET itself resolves the session user regardless.
  async function signIn(rawEmail: string, dest: string = '/dashboard') {
    resetSessionExpired(); // fresh session — re-arm so a later expiry redirects again
    const email = rawEmail.trim().toLowerCase();
    // audit F38 — if a DIFFERENT account signs in on this browser, drop the previous user's
    // cached localStorage first so their name/idea/report can't bleed into this session.
    if (userData.email && userData.email.toLowerCase() !== email) {
      saveUserData(defaultUserData);
      setUserData(defaultUserData);
    }
    const withEmail = update({ email, verified: true }); // real session (post magic-link)
    navigate(dest);
    try {
      const res = await fetch('/api/user'); // identity from the session cookie
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
          country: db.country || withEmail.country,
          city: db.city || withEmail.city,
          timezone: db.timezone || withEmail.timezone,
          score: db.score || withEmail.score,
          subscribed: db.subscribed ?? false,
          phone: db.phone ?? null,
          guideUrl: db.guideUrl ?? null,
          onboardingReport: db.onboardingReport ?? withEmail.onboardingReport ?? null,
        });
      }
    } catch { /* fail silently — localStorage is the fallback */ }
  }

  // After a verified magic link:
  //   • recovery emails carry ?next=/report → land on the report + continue
  //   • brand-new (no onboarding, created at verify) → onboarding
  //   • FIRST verification of an onboarded account → the welcome zone (once)
  //   • returning (already verified) → dashboard
  function onVerified(email: string, isNew: boolean, next?: string | null, firstLogin?: boolean) {
    if (next) { signIn(email, next); }
    else if (isNew) { update({ email, verified: true }); navigate('/start'); } // verified session, just no onboarding yet
    else if (firstLogin) { signIn(email, '/welcome'); }
    else { signIn(email); }
  }

  const toLanding = <Navigate to="/" replace />;

  return (
    <Suspense fallback={<RouteFallback />}>
    <Routes>
      {/* Public — / is the (future) landing; for now reuse the hero with a Start CTA */}
      <Route
        path="/"
        element={authed ? <Navigate to="/dashboard" replace /> : <Welcome onStart={() => navigate('/start')} onSignIn={() => navigate('/login')} />}
      />
      <Route
        path="/start"
        element={<Onboarding userData={userData} update={update} onSignIn={() => navigate('/login')} />}
      />
      <Route path="/login" element={<Login />} />
      <Route path="/auth/verify" element={<Verify onVerified={onVerified} />} />
      {/* Welcome zone — shown once, on the first verification of a freshly-onboarded account */}
      <Route
        path="/welcome"
        element={authed ? <WelcomeZone onStart={() => navigate(`/learning/${COURSE_SLUG}/${M0_FIRST}`)} /> : toLanding}
      />
      {/* Interactive report (SPEC_ONBOARDING_FUNNEL §3) — recovery-email magic links land here */}
      <Route
        path="/report"
        element={authed ? <ReportPage userData={userData} onContinue={() => navigate(`/learning/${COURSE_SLUG}/${M0_FIRST}`)} /> : toLanding}
      />

      {/* App */}
      <Route
        path="/dashboard"
        element={authed ? (
          <Dashboard
            userData={userData}
            onUpdateUserData={update}
            onGoToLMS={(id) => navigate(id ? `/learning/${COURSE_SLUG}/${id}` : '/learning')}
            onGoToPrograms={() => navigate('/programs')}
            onGoToTasks={() => navigate('/tasks')}
            onGoToTask={(task) => navigate('/tasks', { state: { task } })}
            onGoToPulse={() => navigate('/traction')}
            onGoToPaywall={() => navigate('/unlock')}
            onLogout={logout}
          />
        ) : toLanding}
      />

      <Route path="/learning/*" element={authed ? <LMSRoute userData={userData} update={update} logout={logout} onGoToPaywall={() => navigate('/unlock')} /> : toLanding} />

      {/* Programs catalog (SPEC_PROGRAMS_PAGE) — Dashboard "View all lessons" lands here */}
      <Route path="/programs" element={authed ? <Programs onGoToLMS={() => navigate('/learning')} onBack={() => navigate('/dashboard')} /> : toLanding} />

      <Route path="/tasks" element={authed ? <TasksRoute email={userData.email} /> : toLanding} />

      {/* SPEC_PAYWALL + SPEC_STRIPE — full-page overlay gating M5–M12 (→ Stripe Checkout) */}
      <Route
        path="/unlock"
        element={authed ? <Paywall onDismiss={() => navigate('/dashboard')} phone={userData.phone} /> : toLanding}
      />
      {/* Stripe success return — the webhook flips `subscribed`; this polls for it then continues */}
      <Route
        path="/unlock/success"
        element={authed ? (
          <PaymentSuccess
            // Reached ONLY after the poll read subscribed=true from the server (webhook = truth).
            onConfirmed={() => { update({ subscribed: true }); navigate('/start-session'); }}
            // Slow webhook: never grant locally (audit F37). Re-read the server truth and go
            // to the dashboard — access self-unlocks on the next load once the webhook lands.
            onDefer={async () => {
              try {
                const r = await fetch('/api/user');
                if (r.ok) { const d = await r.json(); update({ subscribed: !!d.subscribed }); }
              } catch { /* fall through to dashboard regardless */ }
              navigate('/dashboard');
            }}
          />
        ) : toLanding}
      />
      {/* Post-paywall S1 booking — required step, both CTAs advance to M5 */}
      <Route
        path="/start-session"
        element={authed ? (
          <StartSession onContinue={() => navigate(`/learning/${COURSE_SLUG}/${M5_FIRST}`)} />
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
    </Suspense>
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

// ─── Magic-link auth (SPEC_RESEND_AUTH §7) — real /login + /auth/verify ────────
function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const valid = email.trim().includes('@') && email.trim().includes('.');

  async function requestLink() {
    if (!valid || status === 'sending') return;
    setStatus('sending');
    try {
      const r = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'request-link', email: email.trim() }),
      });
      if (r.ok) track('magic_link_requested');
      setStatus(r.ok ? 'sent' : 'error');
    } catch {
      setStatus('error');
    }
  }

  if (status === 'sent') {
    return (
      <div className="min-h-screen bg-canvas flex flex-col items-center justify-center px-5 text-center">
        <div className="w-full max-w-sm">
          <span className="text-brand-700 font-bold text-xl tracking-tight">Affina<span className="text-ink">Space</span></span>
          <div className="mt-8 text-4xl">📬</div>
          <h1 className="mt-4 text-2xl font-extrabold text-ink mb-2">Check your inbox</h1>
          <p className="text-sm text-ink-soft">We sent a magic link to <span className="font-semibold text-ink">{email.trim()}</span>. Click it to sign in — it expires in 15 minutes.</p>
          <button onClick={() => setStatus('idle')} className="mt-6 text-sm text-ink-mute hover:text-ink-soft transition">Use a different email</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-canvas flex flex-col items-center justify-center px-5">
      <div className="w-full max-w-sm text-center">
        <span className="text-brand-700 font-bold text-xl tracking-tight">Affina<span className="text-ink">Space</span></span>
        <h1 className="mt-6 text-2xl font-extrabold text-ink mb-2">Sign in</h1>
        <p className="text-sm text-ink-soft mb-6">Enter your email — we'll send you a magic link. No password.</p>
        <input
          type="email"
          autoFocus
          placeholder="you@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') requestLink(); }}
          className="w-full rounded-card border-2 border-hairline focus:border-brand-400 focus:ring-4 focus:ring-brand-100 outline-none px-5 py-4 text-base text-ink placeholder-ink-mute transition mb-3"
        />
        <button
          onClick={requestLink}
          disabled={!valid || status === 'sending'}
          className="w-full bg-brand hover:bg-brand-700 active:scale-95 disabled:opacity-40 text-white text-base font-semibold py-4 rounded-pill transition mb-3"
        >
          {status === 'sending' ? 'Sending…' : 'Send magic link →'}
        </button>
        {status === 'error' && <p className="text-xs text-red-500 mb-3">Something went wrong — please try again.</p>}
        <button onClick={() => navigate('/')} className="text-sm text-ink-mute hover:text-ink-soft transition">New here? Start free</button>
      </div>
    </div>
  );
}

function Verify({ onVerified }: { onVerified: (email: string, isNew: boolean, next?: string | null, firstLogin?: boolean) => void }) {
  const navigate = useNavigate();
  const [status, setStatus] = useState<'checking' | 'error'>('checking');
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    // Only honor safe in-app paths (single leading slash) — never an external redirect.
    const rawNext = params.get('next');
    const next = rawNext && /^\/[A-Za-z0-9/_-]*$/.test(rawNext) ? rawNext : null;
    if (!token) { setStatus('error'); return; }
    fetch('/api/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'verify-link', token }),
    })
      .then(async (r) => {
        if (!r.ok) throw new Error('invalid');
        const d = await r.json();
        onVerified(d.email, !!d.isNew, next, !!d.firstLogin);
      })
      .catch(() => setStatus('error'));
  }, [onVerified]);

  if (status === 'error') {
    return (
      <div className="min-h-screen bg-canvas flex flex-col items-center justify-center px-5 text-center">
        <div className="w-full max-w-sm">
          <span className="text-brand-700 font-bold text-xl tracking-tight">Affina<span className="text-ink">Space</span></span>
          <h1 className="mt-8 text-2xl font-extrabold text-ink mb-2">This link didn't work</h1>
          <p className="text-sm text-ink-soft mb-6">It may have expired or already been used. Request a fresh one — it only takes a moment.</p>
          <button onClick={() => navigate('/login')} className="bg-brand hover:bg-brand-700 active:scale-95 text-white text-sm font-semibold px-8 py-3 rounded-pill transition">
            Request a new link →
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-canvas flex flex-col items-center justify-center px-5 text-center">
      <span className="text-brand-700 font-bold text-xl tracking-tight">Affina<span className="text-ink">Space</span></span>
      <div className="mt-8 w-10 h-10 rounded-pill bg-brand animate-orb-pulse" />
      <p className="mt-4 text-ink-soft text-sm">Signing you in…</p>
    </div>
  );
}

// SPEC_STRIPE §3/§4 — Stripe redirects here after payment. `subscribed` is set by the
// webhook (the source of truth), never the redirect — so poll the server for it, then
// continue into the program. The redirect alone never grants access.
function PaymentSuccess({ onConfirmed, onDefer }: { onConfirmed: () => void; onDefer: () => void }) {
  const [slow, setSlow] = useState(false);
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;
    let alive = true;
    let tries = 0;
    const poll = async () => {
      if (!alive) return;
      tries++;
      try {
        const r = await fetch('/api/user'); // session cookie
        if (r.ok) { const d = await r.json(); if (d.subscribed) { onConfirmed(); return; } }
      } catch { /* keep polling */ }
      if (tries >= 12) { setSlow(true); return; } // ~18s
      setTimeout(poll, 1500);
    };
    poll();
    return () => { alive = false; };
  }, [onConfirmed]);

  return (
    <div className="min-h-screen bg-canvas flex flex-col items-center justify-center px-5 text-center">
      <span className="text-brand-700 font-bold text-xl tracking-tight">Affina<span className="text-ink">Space</span></span>
      <div className="mt-8 text-4xl">🎉</div>
      <h1 className="mt-4 text-2xl font-extrabold text-ink mb-2">Payment received</h1>
      {slow ? (
        <p className="text-sm text-ink-soft max-w-sm">
          Payment received — your access unlocks automatically the moment it settles (usually under a minute).{' '}
          <button onClick={onDefer} className="text-brand font-semibold underline">Go to your dashboard →</button>
        </p>
      ) : (
        <>
          <div className="mt-2 w-8 h-8 rounded-pill bg-brand animate-orb-pulse" />
          <p className="mt-4 text-ink-soft text-sm">Unlocking the full program…</p>
        </>
      )}
    </div>
  );
}
