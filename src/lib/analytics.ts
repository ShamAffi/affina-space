// First-party analytics tracker (SPEC_ANALYTICS §2). No cookies, no IP, no fingerprinting —
// just an anonId + the session cookie. Everything here is FAIL-SILENT: analytics must never
// break or slow the UX (no awaits in UI paths, catch-all everywhere).

const AID_KEY = 'affina_aid';
const UTM_FIRST_KEY = 'affina_utm_first';
const UTM_LAST_KEY = 'affina_utm_last';

function uuid(): string {
  try { return crypto.randomUUID(); } catch { return `a-${Date.now()}-${Math.random().toString(36).slice(2)}`; }
}

export function getAnonId(): string {
  try {
    let id = localStorage.getItem(AID_KEY);
    if (!id) { id = uuid(); localStorage.setItem(AID_KEY, id); }
    return id;
  } catch {
    return 'anon'; // storage blocked — degrade, never throw
  }
}

// ── UTM first/last-touch attribution ─────────────────────────────────────────────
function captureUtm(): void {
  try {
    const params = new URLSearchParams(location.search);
    const utm = {
      source: params.get('utm_source'),
      medium: params.get('utm_medium'),
      campaign: params.get('utm_campaign'),
      term: params.get('utm_term'),
      content: params.get('utm_content'),
    };
    if (!Object.values(utm).some(Boolean)) return; // no utm on this URL — leave stored touches
    const touch = { ...utm, referrer: document.referrer || null, landing: location.pathname, ts: new Date().toISOString() };
    localStorage.setItem(UTM_LAST_KEY, JSON.stringify(touch));
    if (!localStorage.getItem(UTM_FIRST_KEY)) localStorage.setItem(UTM_FIRST_KEY, JSON.stringify(touch));
  } catch { /* fail-silent */ }
}

// Stored touches — sent with the email-capture request so the server stamps utmFirst/utmLast.
export function getTouches(): { first: unknown; last: unknown } {
  const read = (k: string) => { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : null; } catch { return null; } };
  return { first: read(UTM_FIRST_KEY), last: read(UTM_LAST_KEY) };
}

// ── Event queue + flush ──────────────────────────────────────────────────────────
type QueuedEvent = { name: string; props?: Record<string, unknown>; path: string };
const queue: QueuedEvent[] = [];
let flushTimer: ReturnType<typeof setTimeout> | null = null;

function scheduleFlush(): void {
  if (queue.length >= 10) { if (flushTimer) { clearTimeout(flushTimer); flushTimer = null; } void flush(); return; }
  if (flushTimer) return;
  flushTimer = setTimeout(() => { flushTimer = null; void flush(); }, 5000);
}

export async function flush(useBeacon = false): Promise<void> {
  if (queue.length === 0) return;
  const batch = queue.splice(0, 20);
  const body = JSON.stringify({ anonId: getAnonId(), events: batch });
  try {
    if (useBeacon && typeof navigator !== 'undefined' && navigator.sendBeacon) {
      navigator.sendBeacon('/api/track', new Blob([body], { type: 'application/json' }));
      return;
    }
    await fetch('/api/track', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body, keepalive: true });
  } catch {
    /* fail-silent — drop the batch rather than retry-storm or throw */
  }
}

// Fire an event. Never throws, never awaits in the UI path.
export function track(name: string, props?: Record<string, unknown>): void {
  try {
    const path = typeof location !== 'undefined' ? location.pathname : '';
    queue.push({ name, props, path });
    scheduleFlush();
  } catch { /* fail-silent */ }
}

// One-time init (App mount): capture UTM + flush on tab hide via sendBeacon so the last
// batch isn't lost when the user leaves. page_view is fired from a router location effect.
let inited = false;
export function initAnalytics(): void {
  if (inited || typeof window === 'undefined') return;
  inited = true;
  captureUtm();
  try {
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') void flush(true);
    });
  } catch { /* ignore */ }
}
