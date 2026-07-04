import Anthropic from '@anthropic-ai/sdk';

// Shared Anthropic client + call wrapper (SPEC_MODEL_STRATEGY §5). Replaces the
// `new Anthropic({...})` that used to live in all 8 endpoints. Lives in src/ (not
// api/lib) — every .ts under /api counts against the Vercel Hobby 12-function cap.

export const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export type CallMeta = {
  endpoint: string; // which api handler (e.g. 'ai', 'brain', 'score')
  mode: string;     // which feature within it (e.g. 'feedback', 'snapshot', 'name-gen')
  email?: string;   // only when already in scope; omit otherwise
};

/**
 * The single choke point every Claude call routes through: runs `messages.create`,
 * then logs one structured usage line (§5b) before returning. One place for
 * logging, future retries, and model routing without touching call sites again.
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

  const res = await anthropic.messages.create(finalParams);

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
    ...(meta.email ? { email: meta.email } : {}),
  }));

  return res;
}
