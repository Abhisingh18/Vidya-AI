// Shared OpenRouter helper for JSON-producing prompts (teacher tools).
// Tries each free model in turn and returns the first response that parses.

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
// OpenRouter's free-model lineup changes often; override without a code change
// via OPENROUTER_MODELS="model-a:free,model-b:free". Tried in order.
// Strongest first; later entries are fallbacks when a free provider is rate-limited.
const DEFAULT_MODELS = [
  'nvidia/nemotron-3-ultra-550b-a55b:free',
  'nvidia/nemotron-3-super-120b-a12b:free',
  'google/gemma-4-31b-it:free',
  'google/gemma-4-26b-a4b-it:free',
  'nvidia/nemotron-3.5-lightning:free',
];
const envModels = (process.env.OPENROUTER_MODELS ?? '').split(',').map(m => m.trim()).filter(Boolean);
export const MODELS = envModels.length ? envModels : DEFAULT_MODELS;
// One request must finish inside Vercel's 300s function limit, so all model
// attempts share a budget; a single model may use at most MODEL_TIMEOUT_MS of it.
const BUDGET_MS = 270_000;
const MODEL_TIMEOUT_MS = 150_000;
const MIN_ATTEMPT_MS = 15_000;

// Reasoning models spend minutes "thinking" before answering; for structured
// teaching content that roughly doubles latency without improving the JSON.
// Models without reasoning support ignore this.
export const NO_REASONING = { enabled: false } as const;

export type LlmFailure = 'busy' | 'not-configured' | 'daily-quota';

export class LlmUnavailableError extends Error {
  constructor(message: string, readonly reason: LlmFailure = 'busy') { super(message); }
}

/** User-facing message for an LlmUnavailableError. */
export function llmErrorMessage(err: LlmUnavailableError): string {
  switch (err.reason) {
    case 'not-configured':
      return 'AI generation is not set up on this server yet (missing OPENROUTER_API_KEY).';
    case 'daily-quota':
      // OpenRouter's free-model allowance resets at 00:00 UTC.
      return "Today's free AI limit has been used up. Please try again after 5:30 AM IST.";
    default:
      return 'The AI service is busy right now. Please try again in a minute.';
  }
}

/** All free models share one per-account daily allowance; once it's spent, stop trying. */
class DailyQuotaExceeded extends Error {}

/** True if an OpenRouter 429 body is the per-day free-model cap (not a per-minute/provider limit). */
export function isDailyQuotaError(body: string): boolean {
  return /free-models-per-day/i.test(body);
}

export function extractJson(raw: string): unknown {
  let s = raw.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();
  s = s.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/, '').trim();
  const starts = [s.indexOf('{'), s.indexOf('[')].filter(i => i !== -1);
  if (!starts.length) return null;
  const start = Math.min(...starts);
  const end = Math.max(s.lastIndexOf('}'), s.lastIndexOf(']'));
  if (end <= start) return null;
  try {
    return JSON.parse(s.slice(start, end + 1));
  } catch {
    return null;
  }
}

async function callModel(model: string, system: string, prompt: string, maxTokens: number, timeoutMs: number) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      signal: controller.signal,
      headers: {
        Authorization: `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://vidyaai.app',
        'X-Title': 'VidyaAI',
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: prompt },
        ],
        temperature: 0.5,
        max_tokens: maxTokens,
        reasoning: NO_REASONING,
      }),
    });
    if (!res.ok) {
      const body = res.status === 429 ? await res.text().catch(() => '') : '';
      if (isDailyQuotaError(body)) throw new DailyQuotaExceeded();
      console.warn(`[llm] ${model} → HTTP ${res.status}`);
      return null;
    }
    const data = await res.json();
    const parsed = extractJson(data.choices?.[0]?.message?.content ?? '');
    if (parsed === null) console.warn(`[llm] ${model} → response was not valid JSON`);
    return parsed;
  } catch (err) {
    if (err instanceof DailyQuotaExceeded) throw err;
    console.warn(`[llm] ${model} → ${(err as Error).name === 'AbortError' ? `timed out after ${Math.round(timeoutMs / 1000)}s` : (err as Error).message}`);
    return null;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Ask the LLM for JSON and validate it with `parse`, which returns the typed
 * value or null if the shape is wrong. Throws LlmUnavailableError when no key
 * is configured or every model fails.
 */
export async function generateJson<T>(
  prompt: string,
  parse: (value: unknown) => T | null,
  { system = 'You are an expert Indian school teacher and curriculum designer. Return ONLY valid JSON, no prose.', maxTokens = 6000 } = {},
): Promise<T> {
  if (!OPENROUTER_API_KEY) throw new LlmUnavailableError('OPENROUTER_API_KEY is not set', 'not-configured');
  const deadline = Date.now() + BUDGET_MS;
  for (const model of MODELS) {
    const remaining = deadline - Date.now();
    if (remaining < MIN_ATTEMPT_MS) break;
    let raw: unknown;
    try {
      raw = await callModel(model, system, prompt, maxTokens, Math.min(MODEL_TIMEOUT_MS, remaining));
    } catch (err) {
      if (err instanceof DailyQuotaExceeded) {
        console.warn('[llm] OpenRouter free-model daily limit reached');
        throw new LlmUnavailableError('Daily free-model quota exhausted', 'daily-quota');
      }
      throw err;
    }
    if (raw === null) continue;
    const parsed = parse(raw);
    if (parsed) return parsed;
    console.warn(`[llm] ${model} → JSON didn't match the expected shape, trying next model`);
  }
  throw new LlmUnavailableError('All models failed');
}
