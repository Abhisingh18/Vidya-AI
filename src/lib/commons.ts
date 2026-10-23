// Free-licensed image search on Wikimedia Commons, used to illustrate slide decks.
// Server-only: Wikimedia asks API clients for a descriptive User-Agent, and the
// vision check uses the OpenRouter key.

import type { Slide, SlideImage, SlideLayout } from '@/lib/teacher-docs';
import { extractJson, NO_REASONING } from '@/lib/llm';

const API = 'https://commons.wikimedia.org/w/api.php';
const USER_AGENT = 'VidyaAI/1.0 (https://vidya-ai-pied.vercel.app; education app)';
const MIMES = new Set(['image/jpeg', 'image/png', 'image/svg+xml', 'image/webp']);
const IMAGE_HOST = /^https:\/\/(upload|thumb)\.wikimedia\.org\//; // same rule as parseSlides
const FETCH_TIMEOUT_MS = 8_000;
const CACHE_TTL_MS = 60 * 60 * 1000;
const CACHE_MAX = 200;

// ── Child safety ─────────────────────────────────────────────────────
// These pictures are shown to school children. A query, or a result whose title,
// description or categories match, is dropped. Kept narrow enough that school
// topics ("sexual reproduction", "blood cells", "anal fin", "digestive system
// anus", "Jallianwala Bagh massacre", "violent eruption") still find pictures.
// Keyword lists leak (a nude photo may only be in "Human torsos"), so generated
// decks also get a vision-model check below. Text is lower-cased, apostrophes
// removed and other punctuation turned into spaces before matching.
const UNSAFE = new RegExp(`\\b(?:${[
  // nudity / sexual
  'nud(?:e|es|ity|ist|ists|ism)', 'naked', 'naturis[mt]s?', 'topless', 'bottomless', 'bare breast\\w*', 'breasts',
  'nipples?', 'buttocks', 'genital\\w*', 'penis(?:es)?', 'penile', 'vagina\\w*', 'vulva\\w*', 'clitor\\w*',
  'testicles?', 'scrotum', 'porn\\w*', 'erotic\\w*', 'sexy', 'xxx', 'nsfw', 'hentai', 'playboy',
  '(?:oral|anal|group|having|explicit|hardcore) sex',
  'sex(?:ual(?:ly)?)? (?:acts?|intercourse|activit(?:y|ies)|positions?|toys?|workers?|work|scenes?|abuse|assault|explicit|content|organs?)',
  'intercourse', 'coitus', 'copulat\\w*', 'masturbat\\w*', 'orgasm\\w*', 'fetish\\w*', 'bdsm', 'bondage',
  'lingerie', 'underwear', 'bikinis?', 'strip(?:per|pers|tease|club)', 'prostitut\\w*', 'brothels?', 'condoms?',
  'rape', 'raped', 'rapists?', 'molest\\w*', 'p(?:a)?edophil\\w*', 'incest', 'pubic', 'torsos?',
  // nude figures that are rarely tagged as such
  'michelangelos? david', 'david (?:by |of )?michelangelo', 'venus de milo', 'birth of venus',
  'anatomical position', '3d shaded human', '(?:male|female) shadow diagrams?',
  // gore / death / violence
  'gore', 'gory', 'gruesome', 'corpses?', 'cadavers?', 'carcass(?:es)?', 'dead bod(?:y|ies)',
  'dead (?:man|men|woman|women|child|children|people|soldiers?)', 'post ?mortem', 'autops(?:y|ies)',
  'decapitat\\w*', 'behead\\w*', 'dismember\\w*', 'mutilat\\w*', 'disembowel\\w*', 'severed', 'roadkill',
  'slaughter\\w*', 'butcher\\w*', 'gangren\\w*', 'dissections?', 'gunshot', 'bullet wounds?', 'wounded',
  'bloodied', 'blood ?soaked', 'bloodbath', 'bloodshed', 'suicid\\w*', 'self harm', 'self immolat\\w*',
  'hanged', 'lynch\\w*', 'noose', 'executions?', 'tortur\\w*', 'murder\\w*', 'killings', 'atrocit(?:y|ies)',
  'genocide', 'holocaust', 'war crimes?', 'terroris[mt]s?', 'violence',
  // drugs / intoxication
  'cocaine', 'heroin', 'meth', 'methamphetamine', 'marijuana', 'cannabis', 'hashish', 'ganja', 'mdma', 'lsd',
  'narcotics?', 'drug (?:abuse|use|users?|addicts?|addiction|dealers?|paraphernalia)', 'overdos\\w*',
  'cigarettes?', 'cigars?', 'smoking', 'vaping', 'hookah', 'drunk\\w*', 'liquor', 'vodka', 'whiske?y',
  // profanity
  'fuck\\w*', 'shit', 'cunts?', 'whores?', 'sluts?',
].join('|')})\\b`, 'i');

const forMatching = (s: string) => s.toLowerCase().replace(/['\u2019]/g, '').replace(/[^a-z0-9\u00c0-\uffff]+/g, ' ');
const isUnsafe = (s: string) => UNSAFE.test(forMatching(s));

// ── Ranking hints ────────────────────────────────────────────────────
// Commons has many translations of the same diagram ("Water cycle-vi.svg",
// "Photosynthesis ru.svg"); labels in another language are useless to the class.
const FOREIGN_SCRIPT = /[\u0370-\u03FF\u0400-\u052F\u0530-\u058F\u0590-\u05FF\u0600-\u06FF\u0750-\u077F\u0E00-\u0E7F\u10A0-\u10FF\u3040-\u30FF\u3400-\u9FFF\uAC00-\uD7AF]/;
const FOREIGN_CODE = /(?:^|[\s_(-])(?:af|ar|az|be|bg|br|bs|ca|cs|cy|da|de|el|eo|es|et|eu|fa|fi|fr|ga|gl|he|hr|hu|hy|id|is|it|ja|ka|kk|ko|ku|lb|ln|lt|lv|mk|mn|ms|mt|nl|nn|no|pl|pt|ro|ru|sk|sl|slo|sq|sr|sv|sw|th|tl|tr|uk|uz|vi|zh)\)?$/i;
const FOREIGN_NAME = /\b(?:arabic|armenian|catalan|chinese|czech|dutch|french|german|deutsch|greek|hebrew|hungarian|indonesian|italian|japanese|korean|latin|persian|polish|portuguese|romanian|russian|serbian|spanish|swedish|thai|turkish|ukrainian|vietnamese)\b/i;

// Words that describe the kind of picture, or filler, rather than the subject.
const NOISE_WORDS = new Set([
  'diagram', 'diagrams', 'labelled', 'labeled', 'label', 'labels', 'illustration', 'illustrations',
  'picture', 'pictures', 'image', 'images', 'photo', 'photos', 'photograph', 'photographs',
  'drawing', 'drawings', 'sketch', 'chart', 'schematic', 'infographic', 'poster', 'cartoon', 'clipart',
  'icon', 'simple', 'colorful', 'colourful', 'kids', 'children', 'hindi', 'english', 'showing',
  'the', 'and', 'of', 'a', 'an', 'in', 'on', 'to', 'with', 'for', 'vs',
  'class', 'chapter', 'lesson', 'ncert', 'cbse', 'introduction',
]);

const words = (q: string) => q.toLowerCase().split(/[^a-z0-9\u00c0-\uffff]+/).filter(Boolean);

/** "human heart anatomy diagram" → "human heart anatomy" (for a second, broader search). */
export function simplifyQuery(q: string) {
  return words(q).filter(w => !NOISE_WORDS.has(w)).slice(0, 3).join(' ');
}

/** True when the title names nothing from the query (Commons also matches on descriptions). */
function offTopic(title: string, query: string) {
  const t = title.toLowerCase();
  const stems = words(query).filter(w => w.length >= 3 && !NOISE_WORDS.has(w)).map(w => w.slice(0, 5));
  return stems.length > 0 && !stems.some(s => t.includes(s));
}

/** How many distinct subject words of the query the file title mentions (5-letter stems). */
function titleMatches(title: string, query: string) {
  const t = title.toLowerCase();
  const stems = Array.from(new Set(words(query).filter(w => w.length >= 3 && !NOISE_WORDS.has(w)).map(w => w.slice(0, 5))));
  return { hits: stems.filter(st => t.includes(st)).length, of: stems.length };
}

/** 0 = best. One point for labels in another language, one for a title unrelated to the query. */
function demerits(title: string, query: string) {
  const name = title.toLowerCase().match(FOREIGN_NAME)?.[0];
  const foreign = FOREIGN_SCRIPT.test(title) || FOREIGN_CODE.test(title)
    || (!!name && !query.toLowerCase().includes(name));
  return Number(foreign) + Number(offTopic(title, query));
}

// ── Text cleanup ─────────────────────────────────────────────────────

const ENTITIES: Record<string, string> = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ' };

/** Commons metadata is HTML; reduce it to one line of plain text. */
function plainText(html: string) {
  return html
    .replace(/<[^>]*>/g, ' ')
    .replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (m, e: string) => {
      if (e[0] !== '#') return ENTITIES[e.toLowerCase()] ?? m;
      const code = e[1] === 'x' || e[1] === 'X' ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10);
      return code > 0 && code < 0x110000 ? String.fromCodePoint(code) : m;
    })
    .replace(/\s+/g, ' ')
    .trim();
}

const clip = (s: string, max: number) => (s.length > max ? `${s.slice(0, max - 1).trimEnd()}…` : s);

/** Artist field → short plain-text credit. */
function credit(html: string) {
  const s = plainText(html)
    .replace(/\(\s*talk(?:\s*·\s*contribs)?\s*\)|[·✉✍]/gi, ' ') // user-page link noise
    .replace(/\s+([.,;:])/g, '$1')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/^(.+?) \1$/, '$1'); // "Unknown author Unknown author"
  return clip(s, 120) || 'Wikimedia Commons';
}

// ── Search ───────────────────────────────────────────────────────────

interface ApiImageInfo {
  mime?: string;
  width?: number;
  height?: number;
  thumburl?: string;
  thumbwidth?: number;
  thumbheight?: number;
  descriptionurl?: string;
  extmetadata?: Record<string, { value?: unknown } | undefined>;
}

interface ApiPage {
  title?: string;
  index?: number;
  imageinfo?: ApiImageInfo[];
}

// Commons only renders thumbnails at standard widths; other sizes are refused.
const THUMB_BUCKETS = [960, 500, 330];
const ORIGINAL = /^https:\/\/upload\.wikimedia\.org\/wikipedia\/commons\/([0-9a-f])\/([0-9a-f]{2})\/([^/?#]+)/;

/**
 * A scaled thumbnail URL with its size. Files narrower than the requested 1024px come
 * back as the original file, which Commons rate-limits when browsers hotlink it, so
 * those are rewritten to the largest standard thumbnail width below the original.
 */
function thumbOf(info: ApiImageInfo): { url: string; width: number; height: number } | null {
  const url = info.thumburl ?? '';
  if (/\/thumb\/.+\/\d+px-/.test(url) && !url.includes('thumbnail_unscaled')) {
    return { url, width: info.thumbwidth ?? 0, height: info.thumbheight ?? 0 };
  }
  const m = url.match(ORIGINAL);
  const w = info.width ?? 0;
  const bucket = THUMB_BUCKETS.find(b => b < w);
  if (!m || !bucket || !info.height) return null;
  return {
    url: `https://thumb.wikimedia.org/wikipedia/commons/thumb/${m[1]}/${m[2]}/${m[3]}/${bucket}px-${m[3]}`,
    width: bucket,
    height: Math.round((info.height * bucket) / w),
  };
}

function toImage(page: ApiPage): SlideImage | null {
  const info = page.imageinfo?.[0];
  if (!info || !MIMES.has(info.mime ?? '')) return null;
  const thumb = thumbOf(info);
  if (!thumb || !IMAGE_HOST.test(thumb.url)) return null;
  const { width, height } = thumb;
  if (width < 300 || !height || width / height < 0.4 || width / height > 2.6) return null;

  const meta = (key: string) => {
    const v = info.extmetadata?.[key]?.value;
    return typeof v === 'string' ? v : '';
  };
  const fileTitle = (page.title ?? '').replace(/^File:/, '');
  if (isUnsafe(`${fileTitle} ${plainText(meta('ImageDescription'))} ${meta('Categories')}`)) return null;

  return {
    url: thumb.url,
    width,
    height,
    title: fileTitle.replace(/\.(jpe?g|png|svg|webp)$/i, '').trim(),
    credit: credit(meta('Artist')),
    license: plainText(meta('LicenseShortName')) || 'See source',
    page: info.descriptionurl ?? '',
  };
}

/** One API call. Returns null on failure so failures are not cached. */
async function fetchCommons(query: string, limit: number): Promise<SlideImage[] | null> {
  const params = new URLSearchParams({
    action: 'query',
    format: 'json',
    generator: 'search',
    gsrnamespace: '6',
    gsrlimit: String(Math.min(20, limit * 2)), // over-fetch: filtering drops some
    gsrsearch: `${query} filetype:bitmap|drawing`, // skip PDFs, scans, audio and video
    prop: 'imageinfo',
    iiprop: 'url|size|mime|extmetadata',
    iiurlwidth: '1024',
    iiextmetadatafilter: 'LicenseShortName|Artist|Categories|ImageDescription',
    iiextmetadatalanguage: 'en',
  });
  try {
    const res = await fetch(`${API}?${params}`, {
      headers: { 'User-Agent': USER_AGENT, Accept: 'application/json' },
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      cache: 'no-store',
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json() as { error?: { info?: string }; query?: { pages?: Record<string, ApiPage> } };
    if (data.error) throw new Error(data.error.info ?? 'API error');

    const pages = Object.values(data.query?.pages ?? {}).sort((a, b) => (a.index ?? 0) - (b.index ?? 0));
    const images = new Map<string, SlideImage>(); // by url: drops duplicates
    for (const page of pages) {
      const img = toImage(page);
      if (img && !images.has(img.url)) images.set(img.url, img);
    }
    return Array.from(images.values())
      .map(img => ({ img, score: demerits(img.title, query) }))
      .sort((a, b) => a.score - b.score) // stable: keeps search order within a score
      .slice(0, limit)
      .map(r => r.img);
  } catch (err) {
    console.warn(`[commons] search "${query}" failed: ${err instanceof Error ? err.message : err}`);
    return null;
  }
}

// Small per-instance cache; also shares an in-flight request between identical searches.
const cache = new Map<string, { at: number; images: Promise<SlideImage[]> }>();

function remember(key: string, entry: { at: number; images: Promise<SlideImage[]> }) {
  cache.delete(key);
  cache.set(key, entry);
  if (cache.size <= CACHE_MAX) return;
  const now = Date.now();
  cache.forEach((v, k) => { if (now - v.at > CACHE_TTL_MS) cache.delete(k); });
  const oldestFirst = Array.from(cache.keys());
  while (cache.size > CACHE_MAX) cache.delete(oldestFirst.shift()!);
}

/** Child-safe, free-licensed images from Wikimedia Commons, best first. Never throws. */
export async function searchCommons(query: string, limit = 8): Promise<SlideImage[]> {
  try {
    const q = String(query ?? '').replace(/\s+/g, ' ').trim().slice(0, 150);
    const n = Math.max(1, Math.min(20, Math.floor(limit) || 8));
    if (!q || isUnsafe(q)) return [];

    const key = `${n}:${q.toLowerCase()}`;
    const hit = cache.get(key);
    if (!hit || Date.now() - hit.at > CACHE_TTL_MS) {
      const entry: { at: number; images: Promise<SlideImage[]> } = {
        at: Date.now(),
        images: fetchCommons(q, n).then(images => {
          if (!images && cache.get(key) === entry) cache.delete(key); // retry next time
          return images ?? [];
        }),
      };
      remember(key, entry);
      return (await entry.images).map(img => ({ ...img }));
    }
    return (await hit.images).map(img => ({ ...img }));
  } catch (err) {
    console.warn('[commons] search failed:', err);
    return [];
  }
}

// ── Attaching images to generated slides ─────────────────────────────
// Search gives each slide a text-ranked shortlist; a free vision model then looks
// at the pictures and picks the one that best helps a child understand the slide,
// or none. If vision is unavailable or slow, the top text-ranked picture is used.

const IMAGE_LAYOUTS: SlideLayout[] = ['title', 'image', 'bullets', 'summary', 'quote'];
const ATTACH_CONCURRENCY = 4;
const DEFAULT_ATTACH_MS = 40_000;
const VISION_CANDIDATES = 5;
const VISION_THUMB_PX = 500; // a Commons thumbnail size bucket
const VISION_MAX_BYTES = 1_500_000;
const MIN_SCORE = 5; // out of 10; below this a picture doesn't help the slide (see prompt)

// [model, timeout] in order: fast first. Override with OPENROUTER_VISION_MODELS="a:free,b:free".
const DEFAULT_VISION_MODELS: [string, number][] = [
  ['nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free', 20_000],
  ['nvidia/nemotron-3.5-super-vl:free', 45_000],
  ['google/gemma-4-31b-it:free', 30_000],
];
const envVision = (process.env.OPENROUTER_VISION_MODELS ?? '').split(',').map(m => m.trim()).filter(Boolean);
const VISION_MODELS: [string, number][] = envVision.length
  ? envVision.map((m): [string, number] => [m, 40_000])
  : DEFAULT_VISION_MODELS;

export interface AttachOptions {
  topic?: string;
  grade?: string;
  language?: string;
  /** The whole stage (search + vision) finishes within this. Default 40s. */
  deadlineMs?: number;
}

/** A ~500px copy of a candidate as a data URL: the free vision models only take inline images. */
async function thumbDataUrl(url: string, timeoutMs: number): Promise<string | null> {
  if (timeoutMs < 500) return null;
  try {
    // Smaller bucket for the model; never ask for a size above the stored thumbnail.
    const small = url.replace(/\/(\d+)px-/, (m, px: string) => (Number(px) > VISION_THUMB_PX ? `/${VISION_THUMB_PX}px-` : m));
    const res = await fetch(small, {
      headers: { 'User-Agent': USER_AGENT },
      signal: AbortSignal.timeout(timeoutMs),
      cache: 'no-store',
    });
    const type = res.headers.get('content-type')?.split(';')[0].trim() ?? '';
    if (!res.ok || !/^image\/(jpeg|png|webp)$/.test(type)) return null;
    if (Number(res.headers.get('content-length')) > VISION_MAX_BYTES) return null;
    const bytes = Buffer.from(await res.arrayBuffer());
    return bytes.length > VISION_MAX_BYTES ? null : `data:${type};base64,${bytes.toString('base64')}`;
  } catch {
    return null;
  }
}

function visionPrompt(slide: Slide, n: number, opts: AttachOptions) {
  const points = slide.bullets.filter(Boolean).slice(0, 2);
  return [
    `You are choosing a picture for one classroom slide for Indian school children${opts.grade ? ` (Class ${opts.grade})` : ''}.`,
    opts.topic ? `Lesson topic: "${opts.topic}".` : '',
    `Slide title: "${slide.title}".`,
    slide.subtitle ? `Subtitle: "${clip(slide.subtitle, 200)}".` : '',
    points.length ? `Slide points: ${points.map(p => `"${clip(p, 160)}"`).join('; ')}.` : '',
    `The picture should show: ${slide.imageQuery}.`,
    opts.language && opts.language !== 'English' ? `(The slide text is in ${opts.language}.)` : '',
    `Below are ${n} candidate images, labelled Image 1 to Image ${n}. Pick the ONE that best helps a child understand this slide.`,
    'First look at what each image really shows. Then score it 0-10:',
    '- 8-10: clearly shows this slide\'s subject, simple enough for this class, labels (if any) readable and in English.',
    '- 5-7: related and usable, but cluttered, too technical for this class, or only partly on topic.',
    '- 0-4: about something else, unreadable, labels in another language, or not suitable for children (nudity, gore, violence, frightening).',
    `Be strict: most search results are only loosely related. If none scores ${MIN_SCORE} or more, answer best = 0.`,
    `Return ONLY JSON: {"seen": [<${n} phrases of at most 6 words: what each image shows>], "scores": [<${n} numbers, 0-10, in order>], "best": <1-${n}, or 0 if none fits>, "reason": "<one short sentence>"}`,
  ].filter(Boolean).join('\n');
}

interface Verdict {
  /** 0-based index into the images shown, or -1 when none fits. */
  pick: number;
  scores: number[] | null;
  reason: string;
}

/** Validates the model's answer (images are 1-based in the prompt); null if unusable. */
function readVerdict(raw: unknown, n: number): Verdict | null {
  const o = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {};
  const list = Array.isArray(o.scores) ? o.scores.map(Number) : [];
  const scores = list.length === n && list.every(Number.isFinite) ? list : null;
  const top = scores ? scores.indexOf(Math.max(...scores)) : -1;
  const digits = String(o.best ?? '').match(/-?\d+/);
  const best = digits ? Number(digits[0]) : NaN;
  const reason = typeof o.reason === 'string' ? clip(o.reason.replace(/\s+/g, ' ').trim(), 200) : '';
  // Identical scores for 3+ different pictures mean the model didn't really look.
  if (scores && n >= 3 && scores.every(x => x === scores[0])) return null;
  if (best === 0 || (scores && scores[top] < MIN_SCORE)) return { pick: -1, scores, reason };
  // Small models are sometimes off by one with `best`; when it disagrees with the
  // per-image scores (or is out of range), trust the scores.
  let pick = Number.isInteger(best) && best >= 1 && best <= n ? best - 1 : top;
  if (pick < 0) return null;
  if (scores && scores[pick] < scores[top]) pick = top;
  return { pick, scores, reason };
}

// Models that answered 429 are skipped for a minute instead of being retried for every slide.
const coolingUntil = new Map<string, number>();

/** Asks each vision model in turn; null when none answered usefully before the deadline. */
async function askVision(prompt: string, images: string[], deadline: number) {
  const key = process.env.OPENROUTER_API_KEY;
  if (!key || !images.length) return null;
  const content = [
    { type: 'text', text: prompt },
    ...images.flatMap((url, i) => [
      { type: 'text', text: `Image ${i + 1}:` },
      { type: 'image_url', image_url: { url } },
    ]),
  ];
  for (const [model, cap] of VISION_MODELS) {
    if ((coolingUntil.get(model) ?? 0) > Date.now()) continue;
    const ms = Math.min(cap, deadline - Date.now());
    if (ms < 2_000) break;
    try {
      const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        signal: AbortSignal.timeout(ms),
        cache: 'no-store',
        headers: {
          Authorization: `Bearer ${key}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://vidyaai.app',
          'X-Title': 'VidyaAI',
        },
        body: JSON.stringify({
          model,
          messages: [{ role: 'user', content }],
          temperature: 0.2,
          max_tokens: 500,
          reasoning: NO_REASONING,
        }),
      });
      if (res.status === 429) coolingUntil.set(model, Date.now() + 60_000);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const message = data.choices?.[0]?.message;
      // Reasoning models sometimes leave `content` empty and answer in `reasoning`.
      const answer = String(message?.content || message?.reasoning || '');
      const verdict = readVerdict(extractJson(answer), images.length);
      if (verdict) return { ...verdict, model };
      throw new Error(`unusable answer: ${clip(answer.replace(/\s+/g, ' '), 200) || '(empty)'}`);
    } catch (err) {
      const why = err instanceof Error ? (err.name === 'TimeoutError' ? `timed out after ${Math.round(ms / 1000)}s` : err.message) : String(err);
      console.warn(`[commons] vision ${model}: ${why}`);
    }
  }
  return null;
}

/** Up to VISION_CANDIDATES unused candidates: the slide's own query first, then broader searches. */
async function shortlistFor(query: string, topic: string, unused: (img: SlideImage) => boolean) {
  const own = (await searchCommons(query, 8)).filter(unused);
  if (own.length >= VISION_CANDIDATES) return own.slice(0, VISION_CANDIDATES);

  // AI queries are often long and match few files ("food chain diagram sun grass deer lion").
  // Widen with shorter queries, taking their results in turn. Shorter queries drift
  // ("food chain sun" → restaurant chains), so keep only files whose title names
  // something from the slide's own query.
  const subject = words(query).filter(w => !NOISE_WORDS.has(w));
  const wider = [
    simplifyQuery(query),
    subject.slice(0, 2).join(' ') + (/\bdiagrams?\b/i.test(query) ? ' diagram' : ''),
    simplifyQuery(topic),
  ].filter((q, i, all) => q && q !== query.toLowerCase() && all.indexOf(q) === i);
  const lists = await Promise.all(wider.map(q => searchCommons(q, 8)));
  const list = own.slice();
  const add = (img?: SlideImage) => {
    if (img && list.length < VISION_CANDIDATES && unused(img) && !offTopic(img.title, query)
      && !list.some(x => x.url === img.url)) list.push(img);
  };
  for (let i = 0; i < 8 && list.length < VISION_CANDIDATES; i++) lists.forEach(l => add(l[i]));
  return list;
}

/**
 * Fills `image` on slides that have an `imageQuery` and no image yet (mutates in place).
 * Finishes within `deadlineMs`: slides whose vision check is still running get their top
 * text-ranked picture; slides not searched yet keep `image: null`.
 * Never throws, and never puts the same picture on two slides.
 */
export async function attachImages(slides: Slide[], opts: AttachOptions = {}): Promise<void> {
  const deadline = Date.now() + Math.max(0, opts.deadlineMs ?? DEFAULT_ATTACH_MS);
  const used = new Set(slides.map(s => s.image?.url).filter(Boolean));
  const unused = (img: SlideImage) => !used.has(img.url);
  const shortlists = new Map<Slide, SlideImage[]>(); // text-ranked, best first
  const decided = new Set<Slide>();
  let open = true; // false once finished: late results are discarded
  let timer: ReturnType<typeof setTimeout> | undefined;

  const assign = (slide: Slide, image: SlideImage | null) => {
    if (!open || decided.has(slide)) return;
    decided.add(slide);
    if (image) {
      used.add(image.url);
      slide.image = image;
    }
  };
  const label = (slide: Slide) => `slide ${slides.indexOf(slide) + 1} "${clip(slide.title, 40)}"`;
  // Without vision: the first candidate whose title best matches the slide's own query.
  // Without a vision verdict, only trust a title that clearly names the subject
  // (2+ of its words, or its only word); otherwise show the emoji/diagram instead
  // of a random search hit ("soap dispenser" for "action reaction force pair").
  const textPick = (slide: Slide, list: SlideImage[]) => list.filter(unused)
    .filter(img => {
      const { hits, of } = titleMatches(img.title, slide.imageQuery);
      return hits >= Math.min(2, of) && hits > 0;
    })
    .sort((a, b) => demerits(a.title, slide.imageQuery) - demerits(b.title, slide.imageQuery))[0] ?? null;

  try {
    const queue = slides
      .filter(s => !s.image && s.imageQuery?.trim() && IMAGE_LAYOUTS.includes(s.layout))
      // 'image' slides use the picture as their hero, so they get first pick
      .sort((a, b) => Number(b.layout === 'image') - Number(a.layout === 'image'));
    if (!queue.length) return;

    const worker = async () => {
      for (let slide = queue.shift(); slide && open; slide = queue.shift()) {
        const started = Date.now();
        const query = slide.imageQuery.trim();
        const shortlist = await shortlistFor(query, opts.topic ?? '', unused);
        if (!open) return;
        if (!shortlist.length) {
          console.info(`[commons] ${label(slide)}: no pictures for "${query}"`);
          continue;
        }
        shortlists.set(slide, shortlist);

        // The model only sees candidates whose thumbnail downloaded.
        const thumbs = await Promise.all(
          shortlist.map(img => thumbDataUrl(img.url, Math.min(FETCH_TIMEOUT_MS, deadline - Date.now()))),
        );
        const shown = shortlist.filter((_, i) => thumbs[i]);
        const images = thumbs.filter((t): t is string => !!t);
        const verdict = open ? await askVision(visionPrompt(slide, images.length, opts), images, deadline) : null;
        if (!open) return;
        const secs = `${((Date.now() - started) / 1000).toFixed(1)}s`;

        if (!verdict) {
          const image = textPick(slide, shortlist);
          assign(slide, image);
          console.info(`[commons] ${label(slide)}: "${image?.title ?? '-'}" (text-ranked, vision unavailable) ${secs}`);
        } else if (verdict.pick < 0) {
          assign(slide, null);
          console.info(`[commons] ${label(slide)}: none fits per ${verdict.model} (${verdict.reason}) ${secs}`);
        } else {
          // The model's pick, or if another slide took it meanwhile, the next best by score.
          const { pick, scores } = verdict;
          const rest = shown.map((_, i) => i).filter(i => i !== pick && (!scores || scores[i] >= MIN_SCORE));
          if (scores) rest.sort((a, b) => scores[b] - scores[a]);
          const image = [pick, ...rest].map(i => shown[i]).find(unused) ?? null;
          assign(slide, image);
          const what = image ? `"${image.title}"` : 'none (its picks were taken by other slides)';
          console.info(`[commons] ${label(slide)}: ${what} via ${verdict.model} [${scores?.join(',') ?? '?'}] ${secs}`);
        }
      }
    };

    const workers = Array.from({ length: Math.min(ATTACH_CONCURRENCY, queue.length) }, worker);
    const outOfTime = new Promise<void>(resolve => { timer = setTimeout(resolve, Math.max(0, deadline - Date.now())); });
    await Promise.race([Promise.all(workers), outOfTime]);
  } catch (err) {
    console.warn('[commons] attachImages failed:', err);
  } finally {
    // Out of time mid-check: use the top text-ranked picture.
    shortlists.forEach((list, slide) => {
      if (decided.has(slide)) return;
      const image = textPick(slide, list);
      assign(slide, image);
      console.info(`[commons] ${label(slide)}: "${image?.title ?? '-'}" (text-ranked, out of time)`);
    });
    open = false;
    clearTimeout(timer);
  }
}
