import type { UserData } from './types';

const STORAGE_KEY = 'userData';

export const defaultUserData: UserData = {
  name: '',
  idea: '',
  customer: '',
  businessModel: '',
  stage: '',
  email: '',
  score: 0,
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

export async function syncUserToDB(data: UserData): Promise<void> {
  if (!data.email) return;
  try {
    await fetch('/api/user', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: data.email,
        idea: data.idea,
        customer: data.customer,
        businessModel: data.businessModel,
        stage: data.stage,
        score: data.score,
      }),
    });
  } catch {
    // fail silently — localStorage is the fallback
  }
}

export async function saveLessonInputToDB(email: string, lessonId: string, content: string): Promise<void> {
  if (!email) return;
  try {
    await fetch('/api/lessons', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'save-input', email, lessonId, content }),
    });
  } catch {
    // fail silently
  }
}

export async function toggleLessonCompleteToDB(email: string, lessonId: string): Promise<void> {
  if (!email) return;
  try {
    await fetch('/api/lessons', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'toggle-complete', email, lessonId }),
    });
  } catch {
    // fail silently
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
