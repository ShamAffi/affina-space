import Anthropic from '@anthropic-ai/sdk';

// Shared Anthropic client + call wrapper (SPEC_MODEL_STRATEGY §5). Replaces the
// `new Anthropic({...})` that used to live in all 8 endpoints. Lives in src/ (not
// api/lib) — every .ts under /api counts against the Vercel Hobby 12-function cap.

// timeout pinned (audit F23): the SDK default (10-min) would let a slow call blow past
// Vercel's 60s maxDuration into an opaque 504. We DISABLE the SDK's own retries and run the
// bounded loop in callClaude instead — Anthropic returns HTTP 529 'overloaded' in bursts and
// a single retry wasn't enough to ride through it (the "market research just didn't work"
// bug), but retries must stay inside the function budget, which the SDK's blind retry can't.
export const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY, timeout: 40_000, maxRetries: 0 });

export type CallMeta = {
  endpoint: string; // which api handler (e.g. 'ai', 'brain', 'score')
  mode: string;     // which feature within it (e.g. 'feedback', 'snapshot', 'name-gen')
  email?: string;   // only when already in scope; omit otherwise
};

// Anthropic's transient/overload signals — safe to retry (the request never ran).
const RETRYABLE_STATUS = new Set([429, 500, 503, 529]);
const MAX_ATTEMPTS = 5;
const MAX_TOTAL_MS = 50_000;   // all attempts finish here, leaving ~10s for the caller's DB writes + response < 60s maxDuration
const PER_ATTEMPT_MS = 40_000; // cap for a single generation
const MIN_ATTEMPT_MS = 9_000;  // don't START an attempt without at least this much budget left

/**
 * The single choke point every Claude call routes through: runs `messages.create` with a
 * BOUNDED retry loop for overload (529) / rate-limit (429) / transient 5xx, then logs one
 * structured usage line (§5b). One place for logging, retries, and model routing.
 */
export async function callClaude(
  params: Anthropic.MessageCreateParamsNonStreaming,
  meta: CallMeta,
): Promise<Anthropic.Message> {
  // Sonnet 5 runs ADAPTIVE thinking by default when `thinking` is omitted — that
  // spends tokens/latency we don't need on these short bounded generations, and
  // would eat the tiny name-gen budget and return an empty name (§2a). Default to
  // disabled; a caller can override by passing its own `thinking`. (`disabled` is
  // accepted on Sonnet 5 and Opus 4.8; we never use Fable, which rejects it.)
  const finalParams: Anthropic.MessageCreateParamsNonStreaming = params.thinking
    ? params
    : { ...params, thinking: { type: 'disabled' } };

  const start = Date.now();
  let attempt = 0;
  let lastErr: unknown;
  for (;;) {
    const remaining = MAX_TOTAL_MS - (Date.now() - start);
    // Never START an attempt that can't finish within budget — a late, slow attempt would
    // blow past Vercel's 60s maxDuration into a 504 (audit F23). Only fast-failing 529s ever
    // reach here with budget to spare (a real generation that times out has no status → no retry).
    if (attempt > 0 && remaining < MIN_ATTEMPT_MS) throw lastErr;
    attempt++;
    const timeout = Math.max(1_000, Math.min(PER_ATTEMPT_MS, remaining - 2_000));
    try {
      const res = await anthropic.messages.create(finalParams, { timeout, maxRetries: 0 });

      // §5b — one structured usage line per call, tagged by endpoint/mode, so cost can
      // be attributed per feature from Vercel logs. Prices live outside the code.
      const u = res.usage;
      console.log(JSON.stringify({
        ts: new Date().toISOString(),
        endpoint: meta.endpoint,
        mode: meta.mode,
        model: finalParams.model,
        input_tokens: u.input_tokens,
        output_tokens: u.output_tokens,
        cache_creation_input_tokens: u.cache_creation_input_tokens ?? 0,
        cache_read_input_tokens: u.cache_read_input_tokens ?? 0,
        ...(attempt > 1 ? { retries: attempt - 1 } : {}),
        ...(meta.email ? { email: meta.email } : {}),
      }));

      return res;
    } catch (err) {
      lastErr = err;
      const status = (err as { status?: number })?.status;
      const rem = MAX_TOTAL_MS - (Date.now() - start);
      // Retry only Anthropic's transient signals, only while budget remains for a full attempt.
      // A timeout (no status) has already eaten its budget; retrying it risks the 504 F23 guards.
      if (!status || !RETRYABLE_STATUS.has(status) || attempt >= MAX_ATTEMPTS || rem < MIN_ATTEMPT_MS) {
        console.log(JSON.stringify({
          ts: new Date().toISOString(), endpoint: meta.endpoint, mode: meta.mode,
          event: 'llm_error', status: status ?? null, attempts: attempt,
        }));
        throw err;
      }
      const backoff = Math.min(800 * 2 ** (attempt - 1), 5_000) * (0.7 + Math.random() * 0.6);
      await new Promise((r) => setTimeout(r, Math.min(backoff, Math.max(0, rem - MIN_ATTEMPT_MS))));
    }
  }
}
