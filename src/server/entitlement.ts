import type { VercelResponse } from '@vercel/node';

// Server-side paywall — the trust boundary the audit (P1) said the server must own.
// The client also gates M5–M12 (src/App.tsx isPaidLocked), but the client is not
// trusted: every AI call / progress write / task action scoped to a paid-module
// lesson is independently re-checked here against users.subscribed.
//
// Source of truth is the lesson id itself. Program v2 ids are `m{module}l{block}`
// (SPEC_PROGRAM_V2 §3.5) and paid modules carry `paid: true` (src/data.ts). So a
// lesson is paid ⟺ its module index ≥ PAYWALL_BOUNDARY. Deriving it by parsing the
// id keeps this a pure string check — no endpoint has to import the 125 KB content
// module just to gate a lesson (that would worsen cold starts, audit F49).
//
// Founding-cohort funnel (2026-07): only Module 0 is free — the boundary moved M5 → M1.
// SINGLE SOURCE OF TRUTH: the client (src/App.tsx isPaidLocked) imports PAYWALL_BOUNDARY
// from here too, so the free/paid seam lives in exactly one place.
export const PAYWALL_BOUNDARY = 1;
export const FIRST_PAID_MODULE = PAYWALL_BOUNDARY; // alias kept for existing call sites

const LESSON_ID = /^m(\d+)l\d+$/;

// Module index for a lesson id, or null if it isn't a program lesson id
// (self-task refs like `task_42`, null/undefined, ad-hoc strings → null → free).
export function moduleIndexOf(lessonId: string | null | undefined): number | null {
  if (!lessonId) return null;
  const m = LESSON_ID.exec(lessonId);
  return m ? Number(m[1]) : null;
}

export function isPaidLesson(lessonId: string | null | undefined): boolean {
  const idx = moduleIndexOf(lessonId);
  return idx !== null && idx >= FIRST_PAID_MODULE;
}

// Guard mirroring requireAuth's ergonomics: returns true (may proceed) when the
// target lesson is free OR the user is subscribed; otherwise writes 402 and returns
// false. Callers: `if (!requireEntitlement(res, lessonId, user.subscribed)) return;`.
// 402 Payment Required is the honest status (distinct from 401/403 so the client can
// route to the paywall rather than to /login).
export function requireEntitlement(
  res: VercelResponse,
  lessonId: string | null | undefined,
  subscribed: boolean | null | undefined,
): boolean {
  if (isPaidLesson(lessonId) && !subscribed) {
    res.status(402).json({ error: 'subscription_required' });
    return false;
  }
  return true;
}
