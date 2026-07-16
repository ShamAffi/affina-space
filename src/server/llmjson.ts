// Robust JSON extraction for LLM responses.
//
// Every AI endpoint used to do `JSON.parse(raw.match(/\{[\s\S]*\}/)[0])`. That throws
// whenever the model TRUNCATES its output at `max_tokens` (stop_reason 'max_tokens') —
// the JSON is cut mid-object, so parse fails and the caller returns a hard 502 even
// though most of the object (e.g. 7 of 9 report sections) was perfectly usable. Because
// output length varies run to run, this made market-research / snapshot fail
// INTERMITTENTLY (the exact "sometimes it just doesn't work" bug).
//
// extractLlmJson() first tries a clean parse, then SALVAGES a truncated object by cutting
// back to the last complete structural token and closing the still-open brackets. Paired
// with the tolerant Zod schemas (every field .catch()'d), a salvaged partial object still
// validates into a shorter-but-valid report/snapshot — a graceful degrade, not a 502.

// Cut `s` back to the last structural `}`/`]` (ignoring braces inside strings) and append
// the brackets needed to balance it. Returns a parseable string, or null if there's no
// complete structural token to salvage from.
export function repairTruncatedJson(s: string): string | null {
  // 1) last structural close bracket that is NOT inside a string
  let inStr = false, esc = false, lastClose = -1;
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (inStr) {
      if (esc) esc = false;
      else if (c === '\\') esc = true;
      else if (c === '"') inStr = false;
      continue;
    }
    if (c === '"') inStr = true;
    else if (c === '}' || c === ']') lastClose = i;
  }
  if (lastClose < 0) return null;
  const head = s.slice(0, lastClose + 1);

  // 2) which openers are still unclosed in `head` (string-aware)
  const stack: string[] = [];
  inStr = false; esc = false;
  for (let i = 0; i < head.length; i++) {
    const c = head[i];
    if (inStr) {
      if (esc) esc = false;
      else if (c === '\\') esc = true;
      else if (c === '"') inStr = false;
      continue;
    }
    if (c === '"') inStr = true;
    else if (c === '{') stack.push('}');
    else if (c === '[') stack.push(']');
    else if (c === '}' || c === ']') stack.pop();
  }
  let out = head;
  while (stack.length) out += stack.pop();
  return out;
}

// Extract the first JSON object from an LLM response (prose-wrapped or truncated).
// Returns the parsed value, or null if nothing usable can be recovered.
export function extractLlmJson(raw: string): unknown | null {
  if (!raw) return null;
  const start = raw.indexOf('{');
  if (start < 0) return null;
  const body = raw.slice(start);

  // fast path — a complete object (greedy to the last '}')
  const greedy = body.match(/^[\s\S]*\}/);
  if (greedy) {
    try { return JSON.parse(greedy[0]); } catch { /* truncated or malformed — salvage below */ }
  }
  // salvage a truncated object
  const repaired = repairTruncatedJson(body);
  if (repaired) {
    try { return JSON.parse(repaired); } catch { /* unrecoverable */ }
  }
  return null;
}
