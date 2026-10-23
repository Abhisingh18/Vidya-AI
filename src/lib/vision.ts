// OpenRouter helper for prompts that include a photo (vision models), e.g. the
// student photo doubt solver. Same contract as generateJson in llm.ts: tries
// each free vision model in turn and returns the first reply that `parse` accepts.
//
// Images MUST be base64 data URLs — the free vision endpoints reject plain URLs.

import { extractJson, isDailyQuotaError, LlmUnavailableError, NO_REASONING } from '@/lib/llm';

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

// Best first. Override without a code change via OPENROUTER_VISION_MODELS="a:free,b:free".
const DEFAULT_VISION_MODELS = [
  'nvidia/nemotron-3.5-super-vl:free',
  'google/gemma-4-31b-it:free',
  'nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free',
];
const envModels = (process.env.OPENROUTER_VISION_MODELS ?? '').split(',').map(m => m.trim()).filter(Boolean);
export const VISION_MODELS = envModels.length ? envModels : DEFAULT_VISION_MODELS;

// Routes using this run with maxDuration = 120, so every attempt shares a budget.
const BUDGET_MS = 100_000;
const MODEL_TIMEOUT_MS = 60_000;
const MIN_ATTEMPT_MS = 10_000;

/** A prompt part: plain text, or an image as a base64 data URL (data:image/jpeg;base64,…). */
export type VisionPart = string;

const IMAGE_DATA_URL = /^data:image\/(?:jpeg|jpg|png|webp|gif);base64,/i;
export const isImageDataUrl = (part: string) => IMAGE_DATA_URL.test(part);

type ContentPart = { type: 'text'; text: string } | { type: 'image_url'; image_url: { url: string } };

/** Chat-completions content array for the parts (images as image_url data URLs). */
export function toContent(parts: VisionPart[]): ContentPart[] {
  return parts
    .filter(p => typeof p === 'string' && p.trim().length > 0)
    .map(p => (isImageDataUrl(p) ? { type: 'image_url', image_url: { url: p } } : { type: 'text', text: p }));
}

export interface VisionOptions {
  system?: string;
  maxTokens?: number;
  temperature?: number;
  models?: string[];
  budgetMs?: number;
  modelTimeoutMs?: number;
}

class DailyQuotaExceeded extends Error {}

/** Text of a chat completion message (content may be a string or an array of parts). */
function messageText(message: unknown): string {
  const m = message as { content?: unknown; reasoning?: unknown } | undefined;
  const c = m?.content;
  if (typeof c === 'string' && c.trim()) return c;
  if (Array.isArray(c)) {
    const joined = c.map(p => (typeof p === 'string' ? p : typeof (p as { text?: unknown })?.text === 'string' ? (p as { text: string }).text : '')).join('');
    if (joined.trim()) return joined;
  }
  // Some reasoning models leave content empty and put everything in `reasoning`.
  return typeof m?.reasoning === 'string' ? m.reasoning : '';
}

async function callVisionModel(model: string, system: string, content: ContentPart[], opts: Required<Pick<VisionOptions, 'maxTokens' | 'temperature'>>, timeoutMs: number): Promise<unknown> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  // Gemma endpoints may reject a system role ("developer instruction"); fold it into the user turn.
  const foldSystem = /gemma/i.test(model);
  const messages = foldSystem
    ? [{ role: 'user', content: [{ type: 'text', text: system } as ContentPart, ...content] }]
    : [{ role: 'system', content: system }, { role: 'user', content }];
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
        messages,
        temperature: opts.temperature,
        max_tokens: opts.maxTokens,
        reasoning: NO_REASONING,
      }),
    });
    if (!res.ok) {
      const body = res.status === 429 ? await res.text().catch(() => '') : '';
      if (isDailyQuotaError(body)) throw new DailyQuotaExceeded();
      console.warn(`[vision] ${model} → HTTP ${res.status}`);
      return null;
    }
    const data = await res.json();
    if (data?.error) {
      const msg = typeof data.error?.message === 'string' ? data.error.message : JSON.stringify(data.error);
      if (isDailyQuotaError(msg)) throw new DailyQuotaExceeded();
      console.warn(`[vision] ${model} → ${msg.slice(0, 200)}`);
      return null;
    }
    const parsed = extractJson(messageText(data?.choices?.[0]?.message));
    if (parsed === null) console.warn(`[vision] ${model} → response was not valid JSON`);
    return parsed;
  } catch (err) {
    if (err instanceof DailyQuotaExceeded) throw err;
    console.warn(`[vision] ${model} → ${(err as Error).name === 'AbortError' ? `timed out after ${Math.round(timeoutMs / 1000)}s` : (err as Error).message}`);
    return null;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Ask a vision model for JSON about text + image parts and validate it with
 * `parse` (typed value, or null if the shape is wrong → next model).
 * Throws LlmUnavailableError when no key is configured, the shared daily free
 * quota is spent ('daily-quota', no further models tried), or every model fails.
 */
export async function generateVisionJson<T>(
  parts: VisionPart[],
  parse: (value: unknown) => T | null,
  {
    system = 'You are an expert Indian school teacher. Return ONLY valid JSON, no prose.',
    maxTokens = 4000,
    temperature = 0.3,
    models = VISION_MODELS,
    budgetMs = BUDGET_MS,
    modelTimeoutMs = MODEL_TIMEOUT_MS,
  }: VisionOptions = {},
): Promise<T> {
  if (!OPENROUTER_API_KEY) throw new LlmUnavailableError('OPENROUTER_API_KEY is not set', 'not-configured');
  const content = toContent(parts);
  if (!content.length) throw new Error('generateVisionJson: no prompt parts');
  const deadline = Date.now() + budgetMs;
  for (const model of models) {
    const remaining = deadline - Date.now();
    if (remaining < Math.min(MIN_ATTEMPT_MS, budgetMs)) break;
    let raw: unknown;
    try {
      raw = await callVisionModel(model, system, content, { maxTokens, temperature }, Math.min(modelTimeoutMs, remaining));
    } catch (err) {
      if (err instanceof DailyQuotaExceeded) {
        console.warn('[vision] OpenRouter free-model daily limit reached');
        throw new LlmUnavailableError('Daily free-model quota exhausted', 'daily-quota');
      }
      throw err;
    }
    if (raw === null) continue;
    const parsed = parse(raw);
    if (parsed !== null) return parsed;
    console.warn(`[vision] ${model} → JSON didn't match the expected shape, trying next model`);
  }
  throw new LlmUnavailableError('All vision models failed');
}
