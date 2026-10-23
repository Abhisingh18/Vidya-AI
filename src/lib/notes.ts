// Student revision notes (StudentDoc type 'notes'): a one-page revision sheet
// with a mind map. Shapes, validators, the generation prompt, and the notes as
// plain text (source material for "Make flashcards from these notes").
// Pure module — used by the API routes and the client components alike.

import { languageLine, sourceGuidance, type StudySource } from './flashcards';
import { sourceBlock, type SourceFile } from './source';

// ── Shapes ───────────────────────────────────────────────────────────

export interface MindLeaf { label: string }
export interface MindBranch { label: string; emoji: string; children: MindLeaf[] }
/** 1 root, 3–6 branches (one emoji each), ≤ 4 leaves per branch. */
export interface MindMap { label: string; emoji: string; children: MindBranch[] }

export interface NoteTerm { term: string; meaning: string }
export interface NoteFormula { name: string; formula: string; note: string }
export interface NoteMnemonic { title: string; text: string }
export interface NoteMistake { wrong: string; right: string }
export interface NoteQuestion { q: string; a: string }

export interface NotesContent {
  /** The whole topic in one sentence. */
  oneLine: string;
  keyPoints: string[];
  terms: NoteTerm[];
  /** Empty for topics without formulas (e.g. history). */
  formulas: NoteFormula[];
  mindMap: MindMap;
  /** "Remember this" memory tricks. */
  mnemonics: NoteMnemonic[];
  mistakes: NoteMistake[];
  /** Quick self-check: 5 questions with short answers. */
  selfCheck: NoteQuestion[];
  source: StudySource | null;
}

export const MIND_MAP_LIMITS = { minBranches: 3, maxBranches: 6, maxLeaves: 4 } as const;
export const NOTE_LIMITS = {
  oneLine: 300, point: 300, term: 80, meaning: 300, formulaName: 80, formula: 160, formulaNote: 240,
  mnemonicTitle: 80, mnemonic: 300, mistake: 240, question: 240, answer: 300, mapRoot: 60, mapBranch: 50, mapLeaf: 60,
  keyPoints: 12, terms: 12, formulas: 8, mnemonics: 4, mistakes: 6, selfCheck: 5,
} as const;

// ── Validation ───────────────────────────────────────────────────────

const str = (v: unknown, max: number) => (typeof v === 'string' ? v.replace(/\s+/g, ' ').trim().slice(0, max) : '');
const obj = (v: unknown) => (v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : {});
const arr = (v: unknown) => (Array.isArray(v) ? v : []);
// Built with `new RegExp`: `u` regex literals need an ES2015+ compile target.
const LETTER_OR_DIGIT = new RegExp('[\\p{L}\\p{N}]', 'u');
const emojiOf = (v: unknown) => {
  const s = str(v, 16);
  return s && !LETTER_OR_DIGIT.test(s) ? s : '';
};

/**
 * Pairs from a list of objects (`keys` give the field names, with aliases);
 * `strict` drops pairs missing either side, lenient keeps half-typed ones.
 */
function pairs<K extends string>(
  v: unknown, fields: { key: K; alias: string[]; max: number }[], maxItems: number, strict: boolean,
): Record<K, string>[] {
  const out: Record<K, string>[] = [];
  for (const item of arr(v)) {
    const o = obj(item);
    const row = {} as Record<K, string>;
    for (const f of fields) row[f.key] = str([f.key, ...f.alias].map(k => o[k]).find(x => typeof x === 'string'), f.max);
    const filled = fields.filter(f => row[f.key]).length;
    if (strict ? filled === fields.length || (fields.length === 3 && row[fields[1].key] && filled >= 2) : filled > 0) out.push(row);
    if (out.length >= maxItems) break;
  }
  return out;
}

const list = (v: unknown, max: number, maxItems: number, strict: boolean) =>
  arr(v).map(x => str(typeof x === 'string' ? x : obj(x).text, max)).filter(x => (strict ? x : true)).slice(0, maxItems);

export function parseMindMap(value: unknown, strict: boolean, fallbackRoot = ''): MindMap | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const o = obj(value);
  const branches: MindBranch[] = [];
  for (const b of arr(o.children ?? o.branches)) {
    const bo = obj(b);
    const label = str(bo.label ?? bo.name, NOTE_LIMITS.mapBranch);
    if (strict && !label) continue;
    const children = arr(bo.children ?? bo.leaves)
      .map(l => ({ label: str(typeof l === 'string' ? l : obj(l).label ?? obj(l).name, NOTE_LIMITS.mapLeaf) }))
      .filter(l => (strict ? l.label : true))
      .slice(0, MIND_MAP_LIMITS.maxLeaves);
    branches.push({ label, emoji: emojiOf(bo.emoji), children });
    if (branches.length >= MIND_MAP_LIMITS.maxBranches) break;
  }
  if (strict && branches.length < MIND_MAP_LIMITS.minBranches) return null;
  const label = str(o.label ?? o.name, NOTE_LIMITS.mapRoot) || fallbackRoot.slice(0, NOTE_LIMITS.mapRoot);
  if (strict && !label) return null;
  return { label, emoji: emojiOf(o.emoji), children: branches };
}

/**
 * Validates notes.
 * - strict (AI output): needs the one-liner, ≥ 4 key points, ≥ 2 terms, a mind map
 *   with 3–6 branches and ≥ 3 self-check questions; incomplete items are dropped.
 * - lenient (edits): keeps half-typed items so the editor doesn't lose them; still
 *   needs an object with a `mindMap` object, so a stray value can't wipe the notes.
 */
export function parseNotes(value: unknown, strict = false, topic = ''): NotesContent | null {
  const raw = obj(value);
  const L = NOTE_LIMITS;
  const oneLine = str(raw.oneLine ?? raw.summary, L.oneLine);
  const keyPoints = list(raw.keyPoints, L.point, L.keyPoints, strict);
  const terms = pairs(raw.terms, [
    { key: 'term', alias: ['name', 'word'], max: L.term },
    { key: 'meaning', alias: ['definition', 'meaningText'], max: L.meaning },
  ], L.terms, strict);
  const formulas = pairs(raw.formulas, [
    { key: 'name', alias: ['title', 'label'], max: L.formulaName },
    { key: 'formula', alias: ['equation', 'expression'], max: L.formula },
    { key: 'note', alias: ['meaning', 'explanation'], max: L.formulaNote },
  ], L.formulas, strict);
  const mnemonics = pairs(raw.mnemonics ?? raw.rememberThis, [
    { key: 'title', alias: ['name', 'for'], max: L.mnemonicTitle },
    { key: 'text', alias: ['mnemonic', 'trick'], max: L.mnemonic },
  ], L.mnemonics, false).filter(m => !strict || m.text);
  const mistakes = arr(raw.mistakes ?? raw.commonMistakes).map(m => {
    if (typeof m === 'string') return { wrong: str(m, L.mistake), right: '' };
    const o = obj(m);
    return { wrong: str(o.wrong ?? o.mistake, L.mistake), right: str(o.right ?? o.fix ?? o.correct, L.mistake) };
  }).filter(m => (strict ? m.wrong : true)).slice(0, L.mistakes);
  const selfCheck = pairs(raw.selfCheck ?? raw.questions, [
    { key: 'q', alias: ['question'], max: L.question },
    { key: 'a', alias: ['answer'], max: L.answer },
  ], L.selfCheck, strict);
  const mindMap = parseMindMap(raw.mindMap, strict, topic);

  if (strict && (!oneLine || keyPoints.length < 4 || terms.length < 2 || !mindMap || selfCheck.length < 3)) return null;
  if (!mindMap) return null;
  return {
    oneLine, keyPoints, terms, formulas, mindMap, mnemonics, mistakes, selfCheck,
    source: parseStudySource(raw.source),
  };
}

export function parseStudySource(v: unknown): StudySource | null {
  const o = obj(v);
  if (!['topic', 'upload', 'video', 'notes'].includes(o.kind as string)) return null;
  return { kind: o.kind as StudySource['kind'], label: str(o.label, 300), refId: str(o.refId, 60) };
}

/** Blank notes (only used to show a damaged record instead of failing). */
export function emptyNotes(topic: string): NotesContent {
  return {
    oneLine: '', keyPoints: [], terms: [], formulas: [], mindMap: { label: topic.slice(0, NOTE_LIMITS.mapRoot), emoji: '', children: [] },
    mnemonics: [], mistakes: [], selfCheck: [], source: null,
  };
}

/** AI output → notes and a title (the model's, else the topic). */
export function parseGeneratedNotes(value: unknown, topic: string): (NotesContent & { title: string }) | null {
  const notes = parseNotes(value, true, topic);
  if (!notes) return null;
  return { ...notes, title: str(obj(value).title, 200) || topic };
}

// ── Notes as text (source material for flashcards) ───────────────────

export function notesToText(title: string, n: NotesContent): string {
  const lines: string[] = [`# ${title}`];
  if (n.oneLine) lines.push(n.oneLine);
  if (n.keyPoints.length) lines.push('', '## Key points', ...n.keyPoints.map(p => `- ${p}`));
  if (n.terms.length) lines.push('', '## Important terms', ...n.terms.map(t => `- ${t.term}: ${t.meaning}`));
  if (n.formulas.length) lines.push('', '## Formulas', ...n.formulas.map(f => `- ${f.name}: ${f.formula}${f.note ? ` (${f.note})` : ''}`));
  if (n.mindMap.children.length) {
    lines.push('', `## Mind map: ${n.mindMap.label}`);
    for (const b of n.mindMap.children) lines.push(`- ${b.label}${b.children.length ? `: ${b.children.map(l => l.label).filter(Boolean).join('; ')}` : ''}`);
  }
  if (n.mnemonics.length) lines.push('', '## Remember this', ...n.mnemonics.map(m => `- ${m.title ? `${m.title}: ` : ''}${m.text}`));
  if (n.mistakes.length) lines.push('', '## Common mistakes', ...n.mistakes.map(m => `- Wrong: ${m.wrong}${m.right ? ` — Right: ${m.right}` : ''}`));
  if (n.selfCheck.length) lines.push('', '## Self-check', ...n.selfCheck.map(q => `- Q: ${q.q} A: ${q.a}`));
  return lines.join('\n');
}

export function notesSourceFile(title: string, n: NotesContent): SourceFile {
  return { name: `My notes: ${title}`.slice(0, 120), kind: 'text', text: notesToText(title, n) };
}

// ── Prompt ───────────────────────────────────────────────────────────

export interface NotesPromptOptions {
  topic: string;
  grade: string;
  language: string;
  sources?: SourceFile[];
  sourceKind?: StudySource['kind'];
}

const SOURCE_CHARS = 22_000;

export function buildNotesPrompt(o: NotesPromptOptions): string {
  const material = sourceBlock(o.sources ?? [], o.topic, SOURCE_CHARS, { guidance: sourceGuidance(o.sourceKind) });
  return `Write a ONE-PAGE revision sheet that a student reads the night before the exam.
Topic: "${o.topic}"
Class: ${o.grade} (Indian CBSE/NCERT syllabus — content, depth and vocabulary exactly at this class level)
${languageLine(o.language)}
${material ? `${material}Build the sheet from the SOURCE MATERIAL above: its points, terms, formulas and examples.\n` : ''}
Sections (keep everything short, crisp and exam-ready — this must fit on one page):
- "title": the topic as a short title (max 6 words).
- "oneLine": the whole topic in ONE simple sentence (max 25 words).
- "keyPoints": 6–9 key points, each one fact or idea, max 20 words, in a logical order.
- "terms": 4–8 important terms with their exact textbook meaning (max 20 words each).
- "formulas": every important formula, equation, chemical equation or law of this topic with "name", "formula" (plain text with Unicode, e.g. v = u + at, 6CO₂ + 6H₂O → C₆H₁₂O₆ + 6O₂, a² + b² = c²) and "note" (what the symbols mean / units, max 15 words). Use [] if the topic has none (e.g. history, civics).
- "mindMap": the topic as a mind map — "label" (the topic, max 4 words) with one "emoji", and 3–6 "children" branches (main sub-topics, max 3 words each, one fitting "emoji" each), each with 2–4 "children" leaves (max 5 words each).
- "mnemonics": 1–3 "Remember this" memory tricks (an acronym, rhyme, story or comparison), "title" = what it helps remember.
- "mistakes": 3–5 common mistakes students make in exams on this topic: "wrong" (the mistake) and "right" (the correct idea), max 18 words each.
- "selfCheck": exactly 5 quick self-check questions (mix recall, reasoning and application) with 1-line answers "a".

Return ONLY JSON:
{"title":"...","oneLine":"...","keyPoints":["..."],"terms":[{"term":"...","meaning":"..."}],"formulas":[{"name":"...","formula":"...","note":"..."}],"mindMap":{"label":"...","emoji":"🌱","children":[{"label":"...","emoji":"☀️","children":[{"label":"..."}]}]},"mnemonics":[{"title":"...","text":"..."}],"mistakes":[{"wrong":"...","right":"..."}],"selfCheck":[{"q":"...","a":"..."}]}`;
}

export function notesMaxTokens(language: string): number {
  return language === 'English' ? 5000 : 9000;
}

/** A fresh, empty item of each list (editor "Add" buttons). */
export const EMPTY = {
  term: (): NoteTerm => ({ term: '', meaning: '' }),
  formula: (): NoteFormula => ({ name: '', formula: '', note: '' }),
  mnemonic: (): NoteMnemonic => ({ title: '', text: '' }),
  mistake: (): NoteMistake => ({ wrong: '', right: '' }),
  question: (): NoteQuestion => ({ q: '', a: '' }),
  branch: (): MindBranch => ({ label: '', emoji: '', children: [] }),
};
