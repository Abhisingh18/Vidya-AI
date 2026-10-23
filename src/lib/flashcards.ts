// Student flashcard decks (StudentDoc type 'flashcards'): shapes, SM-2 style
// spaced repetition, validators and the generation prompt. Also the study
// inputs shared with revision notes (src/lib/notes.ts): class, language, and
// turning a library video's narration into source material.
// Pure module — used by the API routes and the client components alike.

import { LANGUAGES as LANGUAGE_OPTIONS } from './languages';
import { sourceBlock, type SourceFile } from './source';

// ── Shapes ───────────────────────────────────────────────────────────

export type CardKind = 'definition' | 'why' | 'how' | 'formula' | 'example' | 'fact';
export const CARD_KINDS: CardKind[] = ['definition', 'why', 'how', 'formula', 'example', 'fact'];
export const CARD_KIND_LABEL: Record<CardKind, string> = {
  definition: 'Definition', why: 'Why?', how: 'How?', formula: 'Formula', example: 'Example', fact: 'Key fact',
};

/** Spaced-repetition state of one card. Dates are local calendar days, "YYYY-MM-DD". */
export interface CardSrs {
  /** SM-2 ease factor, 1.3–3.0 (2.5 for a new card). */
  ease: number;
  /** Days until the next review after the last one; 0 = new or being relearned. */
  interval: number;
  /** Successful reviews in a row (reset by "Again"). */
  reps: number;
  /** Times the card was forgotten after it had been learned. */
  lapses: number;
  /** Next review day. New cards are due the day they are made. */
  due: string;
  /** Day of the last review; null = never studied (a "new" card). */
  last: string | null;
}

export interface Flashcard {
  /** Stable id within the deck (reviews and edits refer to it). */
  id: string;
  kind: CardKind;
  /** Question or term. */
  front: string;
  /** Answer. */
  back: string;
  /** Optional short example or mnemonic shown under the answer. */
  example: string;
  emoji: string;
  srs: CardSrs;
}

/** Where a deck or a set of notes came from. */
export interface StudySource {
  kind: 'topic' | 'upload' | 'video' | 'notes';
  /** Video topic, notes title or uploaded file names. */
  label: string;
  /** Video id or notes id. */
  refId: string;
}

export interface DeckContent {
  cards: Flashcard[];
  source: StudySource | null;
}

/** 1 = Again, 2 = Hard, 3 = Good, 4 = Easy. */
export type Grade = 1 | 2 | 3 | 4;
export const GRADE_LABEL: Record<Grade, string> = { 1: 'Again', 2: 'Hard', 3: 'Good', 4: 'Easy' };

export const CARD_COUNTS = [10, 15, 20, 30] as const;
export const MAX_DECK_CARDS = 200;

// ── Study inputs (shared with notes) ─────────────────────────────────

export const STUDY_GRADES = ['5', '6', '7', '8', '9', '10', '11', '12'];
export const STUDY_LANGUAGES = LANGUAGE_OPTIONS.map(l => l.name);

/** "9", "Class 9", "9-10" (library videos) → "9"; null when it isn't a class we support. */
export function normalizeGrade(value: unknown): string | null {
  const m = /\d{1,2}/.exec(String(value ?? ''));
  return m && STUDY_GRADES.includes(String(Number(m[0]))) ? String(Number(m[0])) : null;
}

export const gradeLabel = (g: string) => `Class ${g}`;

/** Text of a library video's narration: Video.script is a JSON `{time, text}[]` (old and new videos). */
export function videoNarration(script: string): string {
  let lines: unknown;
  try { lines = JSON.parse(script); } catch { return ''; }
  if (!Array.isArray(lines)) return '';
  return lines
    .map(l => (typeof l === 'string' ? l : typeof (l as { text?: unknown })?.text === 'string' ? (l as { text: string }).text : ''))
    .map(t => t.replace(/\s+/g, ' ').trim())
    .filter(Boolean)
    .join('\n');
}

/** A video's narration as source material for the prompt. */
export function videoSourceFile(topic: string, script: string): SourceFile | null {
  const text = videoNarration(script);
  return text ? { name: `Video lesson: ${topic}`.slice(0, 120), kind: 'text', text: text.slice(0, 60_000) } : null;
}

/** Prompt instructions for the language, in native script with textbook terminology. */
export function languageLine(language: string): string {
  return language === 'English'
    ? 'Write everything in clear, simple English (Indian English spellings, e.g. "colour", "centre").'
    : `Write ALL text in ${language}, in its native script (not transliterated in Latin letters). Use technical terms the way ${language}-medium Indian textbooks write them; where students also need the English term, add it once in brackets, e.g. "प्रकाश संश्लेषण (Photosynthesis)". Keep formulas, chemical symbols, units and numbers in standard notation.`;
}

/** Prompt guidance for a source, depending on where it came from. */
export function sourceGuidance(kind: StudySource['kind'] | undefined): string[] | undefined {
  if (kind === 'video') {
    return [
      'This is the narration of a video lesson the student watched. Base your output on what it teaches: its facts, definitions, examples, numbers and order.',
      'Add only closely related essentials the student needs for this topic at this class level if the narration is thin. Never contradict it; leave out anything in it that is clearly wrong.',
      'It may be in a different language from the one you must write in: keep its content, expressed in the output language.',
    ];
  }
  if (kind === 'notes') {
    return [
      "These are the student's own revision notes. Base your output strictly on them: their facts, terms, formulas, examples and mnemonics.",
      'Do not add new topics. If a statement is clearly a factual error, leave it out.',
      'They may be in a different language from the one you must write in: keep their content, expressed in the output language.',
    ];
  }
  return undefined;
}

// ── Dates ────────────────────────────────────────────────────────────

const DATE = /^\d{4}-\d{2}-\d{2}$/;

export function isIsoDate(value: unknown): value is string {
  if (typeof value !== 'string' || !DATE.test(value)) return false;
  const d = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === value;
}

export function addDays(day: string, days: number): string {
  const d = new Date(`${day}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/** Whole days from `a` to `b` (positive when b is later). */
export function daysBetween(a: string, b: string): number {
  return Math.round((Date.parse(`${b}T00:00:00Z`) - Date.parse(`${a}T00:00:00Z`)) / 86_400_000);
}

/** The browser's calendar day. */
export function localToday(now = new Date()): string {
  const p = (n: number) => String(n).padStart(2, '0');
  return `${now.getFullYear()}-${p(now.getMonth() + 1)}-${p(now.getDate())}`;
}

/** Today in India (the server's default when the client doesn't say). */
export function indiaToday(now = new Date()): string {
  return new Date(now.getTime() + 330 * 60_000).toISOString().slice(0, 10);
}

/**
 * The day to schedule against: the client's local day when it is plausible
 * (UTC−12 … UTC+14 around now), else India's.
 */
export function resolveToday(value: unknown, now = new Date()): string {
  if (isIsoDate(value)) {
    const earliest = new Date(now.getTime() - 12 * 3_600_000).toISOString().slice(0, 10);
    const latest = new Date(now.getTime() + 14 * 3_600_000).toISOString().slice(0, 10);
    if (value >= earliest && value <= latest) return value;
  }
  return indiaToday(now);
}

// ── Spaced repetition (SM-2 style, Anki-like grades) ─────────────────

export const EASE_START = 2.5;
export const EASE_MIN = 1.3;
export const EASE_MAX = 3.0;
export const MAX_INTERVAL = 365;
const EASE_DELTA: Record<Grade, number> = { 1: -0.2, 2: -0.15, 3: 0, 4: 0.15 };
/** First successful recall of a new (or relearned) card, in days. */
const FIRST_INTERVAL: Record<Exclude<Grade, 1>, number> = { 2: 1, 3: 2, 4: 4 };

export function newSrs(today: string): CardSrs {
  return { ease: EASE_START, interval: 0, reps: 0, lapses: 0, due: today, last: null };
}

const round2 = (n: number) => Math.round(n * 100) / 100;

/**
 * Next state after grading a card on `today`.
 * - Again: back to relearning — shown again this session, due today, ease −0.20,
 *   and a lapse if the card had been learned.
 * - New/relearning card: Hard 1 day, Good 2 days, Easy 4 days.
 * - Learned card (interval I, ease E): Hard max(I+1, 1.2·I), Good I·E, Easy I·E·1.3,
 *   always Hard < Good < Easy; ease Hard −0.15, Easy +0.15 (kept within 1.3–3.0).
 * Intervals are capped at a year; due = today + interval.
 */
export function schedule(srs: CardSrs, grade: Grade, today: string): CardSrs {
  const ease = round2(Math.min(EASE_MAX, Math.max(EASE_MIN, srs.ease + EASE_DELTA[grade])));
  if (grade === 1) {
    return { ease, interval: 0, reps: 0, lapses: srs.lapses + (srs.reps > 0 ? 1 : 0), due: today, last: today };
  }
  let interval: number;
  if (srs.reps === 0 || srs.interval < 1) {
    interval = FIRST_INTERVAL[grade];
  } else {
    const I = srs.interval;
    const hard = Math.max(I + 1, Math.round(I * 1.2));
    const good = Math.max(hard + 1, Math.round(I * srs.ease));
    const easy = Math.max(good + 1, Math.round(I * srs.ease * 1.3));
    interval = grade === 2 ? hard : grade === 3 ? good : easy;
  }
  interval = Math.min(MAX_INTERVAL, interval);
  return { ease, interval, reps: srs.reps + 1, lapses: srs.lapses, due: addDays(today, interval), last: today };
}

/** Days until the next review for each grade (index 0 = Again … 3 = Easy). */
export function previewIntervals(srs: CardSrs, today: string): [number, number, number, number] {
  return [1, 2, 3, 4].map(g => schedule(srs, g as Grade, today).interval) as [number, number, number, number];
}

/** "< 10 min", "1 day", "5 days", "3 weeks", "4 months", "1 year". */
export function formatInterval(days: number): string {
  if (days <= 0) return '< 10 min';
  if (days === 1) return '1 day';
  if (days < 14) return `${days} days`;
  if (days < 60) return `${Math.round(days / 7)} weeks`;
  if (days < 365) return `${Math.round(days / 30)} months`;
  const years = Math.round((days / 365) * 10) / 10;
  return years === 1 ? '1 year' : `${years} years`;
}

export const isNewCard = (c: Flashcard) => c.srs.last === null;
export const isDue = (c: Flashcard, today: string) => c.srs.due <= today;

export interface DueSummary {
  /** Cards to study today: due reviews + new cards. */
  due: number;
  /** Of which never studied. */
  fresh: number;
  /** Earliest future due day when nothing is due. */
  next: string | null;
  total: number;
}

export function dueSummary(cards: Flashcard[], today: string): DueSummary {
  let due = 0;
  let fresh = 0;
  let next: string | null = null;
  for (const c of cards) {
    if (isNewCard(c)) { fresh++; due++; } else if (isDue(c, today)) due++;
    else if (!next || c.srs.due < next) next = c.srs.due;
  }
  return { due, fresh, next: due ? null : next, total: cards.length };
}

/** Today's session: due reviews first (most overdue first), then new cards in deck order. */
export function studyQueue(cards: Flashcard[], today: string): Flashcard[] {
  const reviews = cards.filter(c => !isNewCard(c) && isDue(c, today))
    .map((c, i) => ({ c, i }))
    .sort((a, b) => (a.c.srs.due < b.c.srs.due ? -1 : a.c.srs.due > b.c.srs.due ? 1 : a.i - b.i))
    .map(x => x.c);
  return [...reviews, ...cards.filter(isNewCard)];
}

/** Fisher–Yates; `random` is injectable for tests. */
export function shuffled<T>(items: T[], random = Math.random): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/** Shuffles due reviews and new cards separately, so reviews still come first. */
export function shuffleQueue(queue: Flashcard[], random = Math.random): Flashcard[] {
  return [...shuffled(queue.filter(c => !isNewCard(c)), random), ...shuffled(queue.filter(isNewCard), random)];
}

// ── Validation (LLM output and edits are untrusted) ──────────────────

const str = (v: unknown, max: number) => (typeof v === 'string' ? v.replace(/\s+/g, ' ').trim().slice(0, max) : '');
const obj = (v: unknown) => (v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : {});

export const LIMITS = { front: 300, back: 600, example: 300, emoji: 16, title: 200 } as const;
const CARD_ID = /^[A-Za-z0-9_-]{1,40}$/;
// Built with `new RegExp`: `u` regex literals need an ES2015+ compile target.
const LETTER_OR_DIGIT = new RegExp('[\\p{L}\\p{N}]', 'u');
const NON_WORD = new RegExp('[^\\p{L}\\p{N}]+', 'gu');

export function newCardId(): string {
  return `c${Date.now().toString(36).slice(-4)}${Math.random().toString(36).slice(2, 8)}`;
}

/** One emoji-ish token (no letters/digits), else ''. */
function emojiOf(v: unknown): string {
  const s = str(v, LIMITS.emoji);
  return s && !LETTER_OR_DIGIT.test(s) ? s : '';
}

function parseSrs(v: unknown, today: string): CardSrs {
  const o = obj(v);
  const n = (x: unknown, lo: number, hi: number, d: number) => {
    const k = Number(x);
    return Number.isFinite(k) ? Math.max(lo, Math.min(hi, k)) : d;
  };
  return {
    ease: round2(n(o.ease, EASE_MIN, EASE_MAX, EASE_START)),
    interval: Math.round(n(o.interval, 0, MAX_INTERVAL, 0)),
    reps: Math.round(n(o.reps, 0, 10_000, 0)),
    lapses: Math.round(n(o.lapses, 0, 10_000, 0)),
    due: isIsoDate(o.due) ? o.due : today,
    last: isIsoDate(o.last) ? o.last : null,
  };
}

// "All of the above", "both A and B", true/false and yes/no fronts are not real flashcards.
const BAD_FRONT = /\b(all|none) of the (above|these)\b|\btrue or false\b|^(true|false)[:.!]?$|सभी उपरोक्त|उपरोक्त सभी|इनमें से (सभी|कोई नहीं)/i;

/** The card's text fields; null when it lacks a front or a back. */
export function parseCardText(v: unknown): Omit<Flashcard, 'id' | 'srs'> | null {
  const o = obj(v);
  const front = str(o.front ?? o.question ?? o.term, LIMITS.front);
  const back = str(o.back ?? o.answer ?? o.definition, LIMITS.back);
  if (!front || !back) return null;
  const kind = CARD_KINDS.includes(o.kind as CardKind) ? (o.kind as CardKind) : 'fact';
  return { kind, front, back, example: str(o.example ?? o.mnemonic, LIMITS.example), emoji: emojiOf(o.emoji) };
}

function parseSource(v: unknown): StudySource | null {
  const o = obj(v);
  const kinds: StudySource['kind'][] = ['topic', 'upload', 'video', 'notes'];
  if (!kinds.includes(o.kind as StudySource['kind'])) return null;
  return { kind: o.kind as StudySource['kind'], label: str(o.label, 300), refId: str(o.refId, 60) };
}

/**
 * Validates a deck.
 * - strict (AI output): needs `minCards` good cards; drops "all of the above"/true-false
 *   fronts and duplicate fronts; every card gets a fresh id and new-card SRS state.
 * - lenient (stored decks): keeps ids and SRS state (clamped), needs at least one card.
 */
export function parseDeck(value: unknown, { strict = false, today = indiaToday(), minCards = 1, maxCards = MAX_DECK_CARDS } = {}): DeckContent | null {
  const raw = obj(value);
  const list = Array.isArray(raw.cards) ? raw.cards : Array.isArray(value) ? (value as unknown[]) : [];
  const cards: Flashcard[] = [];
  const fronts = new Set<string>();
  const ids = new Set<string>();
  for (const item of list) {
    if (cards.length >= maxCards) break;
    const text = parseCardText(item);
    if (!text) continue;
    const key = text.front.toLowerCase().replace(NON_WORD, '');
    if (strict && (BAD_FRONT.test(text.front) || fronts.has(key) || text.front === text.back)) continue;
    fronts.add(key);
    const o = obj(item);
    let id = !strict && typeof o.id === 'string' && CARD_ID.test(o.id) && !ids.has(o.id) ? o.id : newCardId();
    while (ids.has(id)) id = newCardId();
    ids.add(id);
    cards.push({ id, ...text, srs: strict ? newSrs(today) : parseSrs(o.srs, today) });
  }
  if (cards.length < Math.max(1, strict ? minCards : 1)) return null;
  return { cards, source: parseSource(raw.source) };
}

/** AI output → deck: at least 60% of the requested cards (and ≥ 5), trimmed to the count. */
export function parseGeneratedDeck(value: unknown, count: number, today: string): (DeckContent & { title: string }) | null {
  const deck = parseDeck(value, { strict: true, today, minCards: Math.max(5, Math.ceil(count * 0.6)), maxCards: count });
  if (!deck) return null;
  return { ...deck, title: str(obj(value).title, LIMITS.title) };
}

// ── Review / edit requests (PATCH /api/student/flashcards/[id]) ──────

export interface ReviewInput { id: string; grade: Grade }

/** `[{id, grade}]` → reviews, or an error message. */
export function parseReviews(value: unknown): ReviewInput[] | string {
  if (value === undefined) return [];
  if (!Array.isArray(value)) return 'reviews must be a list';
  if (value.length > 500) return 'Too many reviews at once';
  const out: ReviewInput[] = [];
  for (const r of value) {
    const o = obj(r);
    const grade = Number(o.grade);
    if (typeof o.id !== 'string' || !CARD_ID.test(o.id)) return 'Each review needs a card id';
    if (!Number.isInteger(grade) || grade < 1 || grade > 4) return 'Grade must be 1 (Again) to 4 (Easy)';
    out.push({ id: o.id, grade: grade as Grade });
  }
  return out;
}

export interface DeckPatch {
  reviews: ReviewInput[];
  /** Edited or added cards (text only — SRS state is the server's). */
  cards: (Omit<Flashcard, 'srs'>)[];
  deleted: string[];
  /** Forget all progress. */
  reset: boolean;
}

export function parseDeckPatch(body: Record<string, unknown>): DeckPatch | string {
  const reviews = parseReviews(body.reviews);
  if (typeof reviews === 'string') return reviews;
  const cards: DeckPatch['cards'] = [];
  if (body.cards !== undefined) {
    if (!Array.isArray(body.cards) || body.cards.length > MAX_DECK_CARDS) return 'cards must be a list of up to 200 cards';
    for (const c of body.cards) {
      const text = parseCardText(c);
      if (!text) return 'Each card needs a front and a back';
      const id = obj(c).id;
      if (id !== undefined && (typeof id !== 'string' || !CARD_ID.test(id))) return 'Invalid card id';
      cards.push({ id: typeof id === 'string' ? id : '', ...text });
    }
  }
  let deleted: string[] = [];
  if (body.deleted !== undefined) {
    if (!Array.isArray(body.deleted) || !body.deleted.every(d => typeof d === 'string' && CARD_ID.test(d))) return 'deleted must be a list of card ids';
    deleted = body.deleted as string[];
  }
  return { reviews, cards, deleted, reset: body.reset === true };
}

/**
 * Applies a patch: deletions, then edits/additions (new ids → new cards at the
 * end), then reviews in order. Returns the new deck and the ids it changed, or
 * an error for unknown card ids / an emptied deck.
 */
export function applyDeckPatch(deck: DeckContent, patch: DeckPatch, today: string): { deck: DeckContent; changed: string[] } | string {
  let cards = deck.cards.map(c => ({ ...c, srs: { ...c.srs } }));
  const changed = new Set<string>();
  const index = () => new Map(cards.map((c, i) => [c.id, i]));

  if (patch.reset) {
    cards = cards.map(c => ({ ...c, srs: newSrs(today) }));
    cards.forEach(c => changed.add(c.id));
  }
  if (patch.deleted.length) {
    const del = new Set(patch.deleted);
    cards = cards.filter(c => !del.has(c.id));
  }
  for (const edit of patch.cards) {
    const at = edit.id ? index().get(edit.id) : undefined;
    if (at !== undefined) {
      cards[at] = { ...cards[at], ...edit, id: cards[at].id };
      changed.add(cards[at].id);
    } else {
      if (cards.length >= MAX_DECK_CARDS) return `A deck can have at most ${MAX_DECK_CARDS} cards`;
      let id = edit.id && CARD_ID.test(edit.id) ? edit.id : newCardId();
      while (index().has(id)) id = newCardId();
      cards.push({ ...edit, id, srs: newSrs(today) });
      changed.add(id);
    }
  }
  for (const r of patch.reviews) {
    const at = index().get(r.id);
    if (at === undefined) return 'That card is no longer in this deck — reload the page';
    cards[at] = { ...cards[at], srs: schedule(cards[at].srs, r.grade, today) };
    changed.add(r.id);
  }
  if (!cards.length) return 'A deck needs at least one card — delete the deck instead';
  return { deck: { ...deck, cards }, changed: Array.from(changed).filter(id => cards.some(c => c.id === id)) };
}

// ── Prompt ───────────────────────────────────────────────────────────

export interface FlashcardPromptOptions {
  topic: string;
  grade: string;
  language: string;
  count: number;
  sources?: SourceFile[];
  /** Where the sources came from (changes how the model is told to use them). */
  sourceKind?: StudySource['kind'];
}

/** Prompt budget for uploaded material / video narration / notes (characters). */
const SOURCE_CHARS = 20_000;

export function buildFlashcardsPrompt(o: FlashcardPromptOptions): string {
  const material = sourceBlock(o.sources ?? [], o.topic, SOURCE_CHARS, { guidance: sourceGuidance(o.sourceKind) });
  const n = o.count;
  return `Create exactly ${n} revision flashcards for a student.
Topic: "${o.topic}"
Class: ${o.grade} (Indian CBSE/NCERT syllabus — content, depth and vocabulary exactly at this class level)
${languageLine(o.language)}
${material ? `${material}Make every card from the SOURCE MATERIAL above (its facts, terms, examples and numbers).\n` : ''}
RULES for every card:
- ATOMIC: one fact, idea or step per card. Never pack two questions or a list of many items into one card.
- TESTABLE: the front is a clear question or a single term; the back is the exact answer a student can check themselves against, in 1–2 short sentences (max 30 words). The front must not give the answer away.
- No "all of the above", "none of these", true/false, yes/no or multiple-choice cards. No duplicate or near-duplicate cards.
- Exam-relevant: the facts, definitions, reasons and formulas that CBSE/NCERT questions ask about.
- Mix the "kind" across the deck (when the topic allows):
  "definition" — What is …? / term → meaning
  "why" — Why does/is …? (reason, cause)
  "how" — How does … work? / How do we …? (process, method, steps in brief)
  "formula" — a formula, equation, chemical equation or unit with what each symbol means (only if the topic really has them; use Unicode like x², H₂O, →, √, π)
  "example" — Give an example of … (prefer real-life Indian examples)
  "fact" — a key fact, number, name, date or property
- "example": an OPTIONAL short real-life example OR a memory trick (mnemonic) that helps remember the back, max 20 words; "" if nothing useful.
- "emoji": exactly one emoji that fits the card.
- Order the cards from basic to advanced.

Return ONLY JSON:
{"title":"short deck title (max 6 words)","cards":[{"kind":"definition|why|how|formula|example|fact","front":"...","back":"...","example":"...","emoji":"🌱"}]}`;
}

/** Room for the answer: Indic scripts take ~3× the tokens of English. */
export function flashcardsMaxTokens(count: number, language: string): number {
  return Math.min(14_000, 2000 + count * (language === 'English' ? 160 : 400));
}
