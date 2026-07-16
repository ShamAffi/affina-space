import type { UserData } from './types';
import { getAnonId, getTouches, track } from './lib/analytics';

const STORAGE_KEY = 'userData';

export const defaultUserData: UserData = {
  name: '',
  projectName: '',
  idea: '',
  customer: '',
  businessModel: '',
  stage: '',
  goal: '',
  country: '',
  city: '',
  timezone: '',
  email: '',
  score: 0,
  subscribed: false,
  onboardingReport: null,
  lessonInputs: {},
  completedLessons: [],
};

// --- localStorage (always used as local cache) ---

export function loadUserData(): UserData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...defaultUserData };
    return { ...defaultUserData, ...JSON.parse(raw) };
  } catch {
    return { ...defaultUserData };
  }
}

export function saveUserData(data: UserData): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function updateUserData(updates: Partial<UserData>): UserData {
  const current = loadUserData();
  const updated = { ...current, ...updates };
  saveUserData(updated);
  return updated;
}

// --- API ---
// Identity model (Auth Phase B): post-auth endpoints derive identity from the session
// cookie — the browser sends it automatically (same-origin), so authed calls pass NO email.
// The onboarding writes below (syncUserToDB / captureEmail) are the PRE-AUTH surface: no
// session yet, so they DO send the email — the server only lets them touch a pending row.

function userPayload(data: UserData): Record<string, unknown> {
  return {
    email: data.email,
    name: data.name,
    projectName: data.projectName,
    idea: data.idea,
    customer: data.customer,
    businessModel: data.businessModel,
    stage: data.stage,
    goal: data.goal,
    country: data.country,
    city: data.city,
    timezone: data.timezone,
    score: data.score,
    onboardingReport: data.onboardingReport ?? undefined,   // persist the report (funnel §3)
  };
}

// PRE-AUTH (onboarding) — writes intake/report onto the pending row before verification.
export async function syncUserToDB(data: UserData): Promise<void> {
  if (!data.email) return;
  try {
    await fetch('/api/user', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userPayload(data)),
    });
  } catch {
    // fail silently — localStorage is the fallback
  }
}

// POST-AUTH profile edits (Auth Phase B) — PATCH via the session cookie; NO email in the
// body (the server derives identity from the session). Used post-verification only.
export async function patchUserToDB(fields: Partial<UserData>): Promise<void> {
  const keys = ['name', 'projectName', 'idea', 'customer', 'businessModel', 'stage', 'goal', 'country', 'city', 'timezone'] as const;
  const body: Record<string, unknown> = {};
  for (const k of keys) if (fields[k] !== undefined) body[k] = fields[k];
  if (Object.keys(body).length === 0) return;
  try {
    await fetch('/api/user', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  } catch {
    // fail silently
  }
}

// Email capture (SPEC_ONBOARDING_FUNNEL §2/§2a) — creates the PENDING user + emailCapturedAt
// (starts the finish-sequence clock) and persists the intake. Returns the server's ownership
// verdict: `blocked` when the email belongs to a VERIFIED account (caller offers sign-in).
// `previousEmail` triggers the change-email relocate path. Network failure → proceed
// optimistically (ok:true) so the funnel isn't hard-blocked by a transient blip.
export async function captureEmail(
  data: UserData,
  previousEmail?: string,
): Promise<{ ok: boolean; blocked?: boolean; reason?: string }> {
  if (!data.email) return { ok: false };
  try {
    const res = await fetch('/api/user', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...userPayload(data),
        emailCapture: true,
        ...(previousEmail ? { previousEmail } : {}),
        // Analytics stitch (SPEC_ANALYTICS §4.1) — joins the pre-signup trail to this user.
        anonId: getAnonId(),
        touches: getTouches(),
      }),
    });
    const json = await res.json().catch(() => ({}));
    if (json?.blocked) return { ok: false, blocked: true, reason: json.reason };
    track('email_captured');
    return { ok: true };
  } catch {
    return { ok: true };
  }
}

export async function saveLessonInputToDB(
  email: string,
  lessonId: string,
  content: string,
  drafts?: { userDraft?: string; aiDraft?: string },
): Promise<void> {
  if (!email) return;   // `email` gates the call to logged-in users; identity is the cookie
  try {
    await fetch('/api/brain', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'save-input', lessonId, content, ...drafts }),
    });
  } catch {
    // fail silently
  }
}

export async function toggleLessonCompleteToDB(email: string, lessonId: string): Promise<void> {
  if (!email) return;
  try {
    await fetch('/api/brain', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'toggle-complete', lessonId }),
    });
  } catch {
    // fail silently
  }
}

export async function loadProgressFromDB(email: string): Promise<{
  completedLessons: string[];
  lessonInputs: Record<string, string>;
} | null> {
  if (!email) return null;
  try {
    const res = await fetch('/api/progress');   // identity from the session cookie
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export async function loadUserFromDB(email: string): Promise<UserData | null> {
  if (!email) return null;
  try {
    const res = await fetch('/api/user');   // identity from the session cookie
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}
