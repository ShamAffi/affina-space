import type { UserData } from './types';

const STORAGE_KEY = 'userData';

export const defaultUserData: UserData = {
  name: '',
  projectName: '',
  idea: '',
  customer: '',
  businessModel: '',
  stage: '',
  goal: '',
  email: '',
  score: 0,
  subscribed: false,
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

// --- API (syncs with Neon DB when email is known) ---

export async function syncUserToDB(data: UserData, opts?: { freshStart?: boolean }): Promise<void> {
  if (!data.email) return;
  try {
    await fetch('/api/user', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: data.email,
        name: data.name,
        projectName: data.projectName,
        idea: data.idea,
        customer: data.customer,
        businessModel: data.businessModel,
        stage: data.stage,
        goal: data.goal,
        score: data.score,
        // Register flow only: re-onboarding an existing email wipes its previous life server-side
        ...(opts?.freshStart ? { freshStart: true } : {}),
      }),
    });
  } catch {
    // fail silently — localStorage is the fallback
  }
}

export async function saveLessonInputToDB(
  email: string,
  lessonId: string,
  content: string,
  drafts?: { userDraft?: string; aiDraft?: string },
): Promise<void> {
  if (!email) return;
  try {
    await fetch('/api/brain', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'save-input', email, lessonId, content, ...drafts }),
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
      body: JSON.stringify({ action: 'toggle-complete', email, lessonId }),
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
    const res = await fetch(`/api/progress?email=${encodeURIComponent(email)}`);
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export async function loadUserFromDB(email: string): Promise<UserData | null> {
  try {
    const res = await fetch(`/api/user?email=${encodeURIComponent(email)}`);
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}
