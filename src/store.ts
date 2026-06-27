import type { UserData } from './types';

const STORAGE_KEY = 'userData';

export const defaultUserData: UserData = {
  idea: '',
  customer: '',
  businessModel: '',
  stage: '',
  email: '',
  score: 0,
  lessonInputs: {},
  completedLessons: [],
};

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
