// First-party analytics tracker (SPEC_ANALYTICS §2).
// NOTE: scaffolded during the mentor/docs/phone work so event call sites resolve; the
// full tracker (UTM capture, auto page_view, sendBeacon, batching cadence) is completed
// in the SPEC_ANALYTICS step. The public API — `track(name, props)` + `getAnonId()` — is
// stable, so call sites written now keep working. Everything here is FAIL-SILENT: analytics
// must never break or slow the UX.

const AID_KEY = 'affina_aid';

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

type QueuedEvent = { name: string; props?: Record<string, unknown>; path: string; ts: number };
const queue: QueuedEvent[] = [];
let flushTimer: ReturnType<typeof setTimeout> | null = null;

function scheduleFlush() {
  if (flushTimer) return;
  flushTimer = setTimeout(() => { flushTimer = null; void flush(); }, 5000);
  if (queue.length >= 10) { if (flushTimer) { clearTimeout(flushTimer); flushTimer = null; } void flush(); }
}

export async function flush(useBeacon = false): Promise<void> {
  if (queue.length === 0) return;
  const batch = queue.splice(0, 20).map((e) => ({ name: e.name, props: e.props, path: e.path }));
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
    queue.push({ name, props, path, ts: Date.now() });
    scheduleFlush();
  } catch {
    /* fail-silent */
  }
}
