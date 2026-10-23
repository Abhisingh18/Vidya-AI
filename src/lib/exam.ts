// Exam question papers (TeacherDoc type 'exam'): content shape, deterministic
// blueprints (CBSE-style school papers, Indian university semester papers),
// per-section prompt builders and validators. Shared by the API route and the
// client form/editor.
// NOTE: teacher-docs.ts imports parseExam from here, so this file must not
// import teacher-docs.ts (circular import) — the small helpers are copied.

// ── Shapes ───────────────────────────────────────────────────────────

export type ExamType = 'unit-test' | 'quarterly' | 'half-yearly' | 'annual' | 'mid-sem' | 'end-sem' | 'custom';
export type ExamPattern = 'school' | 'university';
export type ExamQuestionType = 'mcq' | 'assertion-reason' | 'very-short' | 'short' | 'long' | 'case-based';
export type Difficulty = 'easy' | 'medium' | 'hard';

export interface ExamHeader {
  institution: string;
  /** e.g. "Half-Yearly Examination 2026–27" */
  examName: string;
  examType: ExamType;
  pattern: ExamPattern;
  /** "Class 10" or e.g. "B.Tech CSE · Semester III" */
  className: string;
  subject: string;
  /** Subject / course code, e.g. "086" or "CS301" (may be empty). */
  subjectCode: string;
  /** Minutes. */
  duration: number;
  maxMarks: number;
  language: string;
}

/** One question (or its internal-choice alternative). */
export interface ExamItem {
  /** Question text; may span lines (case passages, sub-parts, assertion + reason). */
  text: string;
  /** Four options for objective questions, [] otherwise. */
  options: string[];
  /** Index of the correct option for objective questions, -1 otherwise. */
  correct: number;
  /** Model answer / value points (objective: why the option is right). */
  answer: string;
  /** Point-wise split of the marks, e.g. "Definition – 1; Example – 1". */
  markingScheme: string;
  chapter: string;
  difficulty: Difficulty;
}

export interface ExamQuestion extends ExamItem {
  type: ExamQuestionType;
  /** Internal choice: the "OR" question, with its own answer. */
  alternative: ExamItem | null;
}

export interface ExamSection {
  /** 'A', 'B', … (printed as "Section A" for schools, "Part A" for universities). */
  label: string;
  title: string;
  instructions: string;
  /** Default type for new questions in this section. */
  questionType: ExamQuestionType;
  marksEach: number;
  /** Students answer any N of the questions; null = all compulsory. */
  attempt: number | null;
  questions: ExamQuestion[];
}

export interface ExamContent {
  header: ExamHeader;
  /** Numbered general instructions. */
  instructions: string[];
  sections: ExamSection[];
}

export const EXAM_TYPES: Record<ExamType, {
  label: string; name: string; pattern: ExamPattern | null; description: string; marks: number[];
}> = {
  'unit-test':   { label: 'Unit Test',      name: 'Unit Test',                pattern: 'school',     description: '1–2 chapters · 20/25 marks · 40–60 min', marks: [20, 25] },
  quarterly:     { label: 'Quarterly',      name: 'Quarterly Examination',    pattern: 'school',     description: '3-month exam · 40/50 marks · 1½–2 h',   marks: [40, 50] },
  'half-yearly': { label: 'Half-Yearly',    name: 'Half-Yearly Examination',  pattern: 'school',     description: '6-month exam · 80/100 marks · 3 h',     marks: [80, 100] },
  annual:        { label: 'Annual / Final', name: 'Annual Examination',       pattern: 'school',     description: 'Full syllabus · 80/100 marks · 3 h',    marks: [80, 100] },
  'mid-sem':     { label: 'Mid-Semester',   name: 'Mid-Semester Examination', pattern: 'university', description: 'Internal test · 30/50 marks · 1½–2 h',  marks: [30, 50] },
  'end-sem':     { label: 'End-Semester',   name: 'End-Semester Examination', pattern: 'university', description: 'Semester exam · 70/100 marks · 3 h',    marks: [70, 100] },
  custom:        { label: 'Custom',         name: 'Class Test',               pattern: null,         description: 'Your own sections, marks & time',       marks: [] },
};
export const EXAM_TYPE_LIST = Object.keys(EXAM_TYPES) as ExamType[];

export const QUESTION_TYPES: Record<ExamQuestionType, { label: string; short: string; objective: boolean }> = {
  mcq:                { label: 'Multiple choice (MCQ)', short: 'MCQ',  objective: true },
  'assertion-reason': { label: 'Assertion–Reason',      short: 'A–R',  objective: true },
  'very-short':       { label: 'Very short answer',     short: 'VSA',  objective: false },
  short:              { label: 'Short answer',          short: 'SA',   objective: false },
  long:               { label: 'Long answer',           short: 'LA',   objective: false },
  'case-based':       { label: 'Case-based',            short: 'Case', objective: false },
};
export const QUESTION_TYPE_LIST = Object.keys(QUESTION_TYPES) as ExamQuestionType[];
export const isObjective = (t: ExamQuestionType) => QUESTION_TYPES[t].objective;

/** The four standard CBSE assertion–reason options, in order. */
export const AR_OPTIONS = [
  'Both Assertion (A) and Reason (R) are true, and Reason (R) is the correct explanation of Assertion (A).',
  'Both Assertion (A) and Reason (R) are true, but Reason (R) is not the correct explanation of Assertion (A).',
  'Assertion (A) is true, but Reason (R) is false.',
  'Assertion (A) is false, but Reason (R) is true.',
];

export const DIFFICULTY_PRESETS: { id: string; label: string; mix: DifficultyMix }[] = [
  { id: 'easy',     label: 'Easy-going',  mix: { easy: 50, medium: 35, hard: 15 } },
  { id: 'balanced', label: 'Balanced',    mix: { easy: 30, medium: 50, hard: 20 } },
  { id: 'hard',     label: 'Challenging', mix: { easy: 20, medium: 45, hard: 35 } },
];
export interface DifficultyMix { easy: number; medium: number; hard: number }

/** Section letter for position i: A, B, C, … */
export const sectionLabel = (i: number) => String.fromCharCode(65 + Math.min(25, i));
/** "Section A" (school) or "Part A" (university). */
export const sectionWord = (pattern: ExamPattern) => (pattern === 'university' ? 'Part' : 'Section');

export function defaultSectionTitle(type: ExamQuestionType, pattern: ExamPattern): string {
  if (pattern === 'university') {
    return type === 'long' || type === 'case-based' ? 'Descriptive Questions' : isObjective(type) ? 'Objective Questions' : 'Short Answer Questions';
  }
  return {
    mcq: 'Multiple Choice Questions',
    'assertion-reason': 'Assertion–Reason Questions',
    'very-short': 'Very Short Answer Questions',
    short: 'Short Answer Questions',
    long: 'Long Answer Questions',
    'case-based': 'Case-Based Questions',
  }[type];
}

export const formatDuration = (min: number) => {
  const h = Math.floor(min / 60), m = min % 60;
  if (!h) return `${m} minutes`;
  return `${h} hour${h > 1 ? 's' : ''}${m ? ` ${m} minutes` : ''}`;
};

// ── Marks ────────────────────────────────────────────────────────────

/** Questions a student actually answers in the section. */
export const answeredCount = (s: { attempt: number | null; questions: unknown[] }) =>
  s.attempt && s.attempt < s.questions.length ? s.attempt : s.questions.length;
export const sectionMarks = (s: ExamSection) => s.marksEach * answeredCount(s);
export const examTotal = (c: ExamContent) => c.sections.reduce((t, s) => t + sectionMarks(s), 0);

/** Paper-wide question number of the first question in each section (1-based, continuous). */
export function sectionStarts(c: ExamContent): number[] {
  let n = 1;
  return c.sections.map(s => { const start = n; n += s.questions.length; return start; });
}

// ── Blueprints (deterministic presets) ───────────────────────────────

/** One row of the blueprint table = one section of the paper. */
export interface SectionSpec {
  type: ExamQuestionType;
  /** Questions printed in the section. */
  count: number;
  marksEach: number;
  /** Students answer any N of `count`; null = all compulsory. */
  attempt: number | null;
  /** How many questions carry an internal choice ("OR"). */
  choices: number;
  /** MCQ sections only: how many of the questions (the last ones) are assertion–reason. */
  assertionReason: number;
}

export interface Blueprint { maxMarks: number; duration: number; sections: SectionSpec[] }

export const MAX_SECTIONS = 6;
export const MAX_SECTION_QUESTIONS = 40;
export const MAX_PAPER_QUESTIONS = 60;

const row = (type: ExamQuestionType, count: number, marksEach: number, choices = 0, extra: Partial<SectionSpec> = {}): SectionSpec =>
  ({ type, count, marksEach, attempt: null, choices, assertionReason: 0, ...extra });

// CBSE board pattern (A: objective incl. assertion–reason, B: VSA, C: SA, D: LA, E: case-based),
// scaled down for periodic tests. Internal choice follows CBSE: a couple of questions per section.
const SCHOOL_80: Blueprint = {
  maxMarks: 80, duration: 180,
  sections: [row('mcq', 20, 1, 0, { assertionReason: 2 }), row('very-short', 5, 2, 2), row('short', 6, 3, 2), row('long', 4, 5, 2), row('case-based', 3, 4)],
};
const SCHOOL_100: Blueprint = {
  maxMarks: 100, duration: 180,
  sections: [row('mcq', 20, 1, 0, { assertionReason: 4 }), row('very-short', 10, 2, 2), row('short', 8, 3, 2), row('long', 4, 5, 2), row('case-based', 4, 4)],
};

const PRESETS: Record<Exclude<ExamType, 'custom'>, Blueprint[]> = {
  'unit-test': [
    { maxMarks: 20, duration: 40, sections: [row('mcq', 5, 1), row('very-short', 3, 2, 1), row('short', 3, 3, 1)] },
    { maxMarks: 25, duration: 60, sections: [row('mcq', 5, 1), row('very-short', 3, 2, 1), row('short', 3, 3, 1), row('long', 1, 5, 1)] },
  ],
  quarterly: [
    { maxMarks: 40, duration: 90, sections: [row('mcq', 10, 1, 0, { assertionReason: 2 }), row('very-short', 4, 2, 1), row('short', 4, 3, 1), row('long', 2, 5, 1)] },
    { maxMarks: 50, duration: 120, sections: [row('mcq', 10, 1, 0, { assertionReason: 2 }), row('very-short', 5, 2, 1), row('short', 4, 3, 1), row('long', 2, 5, 1), row('case-based', 2, 4)] },
  ],
  'half-yearly': [SCHOOL_80, SCHOOL_100],
  annual: [SCHOOL_80, SCHOOL_100],
  // University: Part A short compulsory questions; Part B descriptive with choice.
  'mid-sem': [
    { maxMarks: 30, duration: 90, sections: [row('very-short', 5, 2), row('long', 5, 5, 0, { attempt: 4 })] },
    { maxMarks: 50, duration: 120, sections: [row('very-short', 5, 2), row('long', 4, 10, 4)] },
  ],
  'end-sem': [
    { maxMarks: 70, duration: 180, sections: [row('very-short', 10, 2), row('long', 5, 10, 5)] },
    { maxMarks: 100, duration: 180, sections: [row('very-short', 10, 2), row('long', 5, 16, 5)] },
  ],
};

const CUSTOM: Record<ExamPattern, Blueprint> = {
  school: { maxMarks: 50, duration: 120, sections: [row('mcq', 10, 1), row('very-short', 5, 2, 1), row('short', 5, 3, 1), row('long', 3, 5, 1)] },
  university: { maxMarks: 50, duration: 120, sections: [row('very-short', 5, 2), row('long', 4, 10, 4)] },
};

/** Pattern an exam type is written in (custom papers follow the teacher's choice). */
export const patternFor = (type: ExamType, chosen: ExamPattern): ExamPattern => EXAM_TYPES[type].pattern ?? chosen;

/** The preset blueprint for an exam type (nearest preset to `maxMarks`). Always a fresh copy. */
export function blueprintFor(type: ExamType, maxMarks?: number, pattern: ExamPattern = 'school'): Blueprint {
  const options = type === 'custom' ? [CUSTOM[pattern]] : PRESETS[type];
  const target = maxMarks ?? options[0].maxMarks;
  const best = options.reduce((a, b) => (Math.abs(b.maxMarks - target) < Math.abs(a.maxMarks - target) ? b : a));
  return { ...best, sections: best.sections.map(s => ({ ...s })) };
}

export const specMarks = (s: SectionSpec) => s.marksEach * (s.attempt && s.attempt < s.count ? s.attempt : s.count);
export const blueprintTotal = (sections: SectionSpec[]) => sections.reduce((t, s) => t + specMarks(s), 0);

/** Clamp one blueprint row to sane values (used by the form and the API). */
export function normalizeSpec(value: unknown): SectionSpec {
  const o = obj(value);
  const type = QUESTION_TYPE_LIST.includes(o.type as ExamQuestionType) ? (o.type as ExamQuestionType) : 'short';
  const count = num(o.count, 5, 1, MAX_SECTION_QUESTIONS);
  const attemptN = o.attempt === null || o.attempt === undefined || o.attempt === '' ? 0 : num(o.attempt, 0, 0, count);
  return {
    type,
    count,
    marksEach: num(o.marksEach, 1, 1, 20),
    attempt: attemptN > 0 && attemptN < count ? attemptN : null,
    choices: num(o.choices, 0, 0, count),
    assertionReason: type === 'mcq' ? num(o.assertionReason, 0, 0, count) : 0,
  };
}

/** Validates a blueprint from a request; null if unusable. */
export function parseBlueprint(value: unknown): SectionSpec[] | null {
  if (!Array.isArray(value) || !value.length || value.length > MAX_SECTIONS) return null;
  const sections = value.map(normalizeSpec);
  if (sections.reduce((t, s) => t + s.count, 0) > MAX_PAPER_QUESTIONS) return null;
  return sections;
}

// ── General / section instructions (deterministic, English) ──────────

/** The structural facts instructions are written from — works for blueprints and edited papers. */
export interface SectionShape {
  label: string; type: ExamQuestionType; count: number; marksEach: number;
  attempt: number | null; choices: number; assertionReason: number;
}

export const shapeOfSpec = (s: SectionSpec, i: number): SectionShape => ({ ...s, label: sectionLabel(i) });
export const shapeOfSection = (s: ExamSection): SectionShape => ({
  label: s.label,
  type: s.questionType,
  count: s.questions.length,
  marksEach: s.marksEach,
  attempt: s.attempt && s.attempt < s.questions.length ? s.attempt : null,
  choices: s.questions.filter(q => q.alternative).length,
  assertionReason: s.questions.filter(q => q.type === 'assertion-reason').length,
});

const WORDS = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten',
  'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen', 'twenty'];
const word = (n: number) => WORDS[n] ?? String(n);
const plural = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;
const TYPE_PHRASE: Record<ExamQuestionType, [string, string]> = {
  mcq: ['a multiple choice question (MCQ)', 'multiple choice questions (MCQs)'],
  'assertion-reason': ['an assertion–reason based question', 'assertion–reason based questions'],
  'very-short': ['a very short answer (VSA) type question', 'very short answer (VSA) type questions'],
  short: ['a short answer (SA) type question', 'short answer (SA) type questions'],
  long: ['a long answer (LA) type question', 'long answer (LA) type questions'],
  'case-based': ['a case-based question with sub-parts', 'case-based / source-based questions with sub-parts'],
};
const listJoin = (xs: string[]) => (xs.length <= 1 ? xs.join('') : `${xs.slice(0, -1).join(', ')} and ${xs[xs.length - 1]}`);

/** Instruction line printed under a section heading. */
export function sectionInstruction(s: SectionShape, pattern: ExamPattern): string {
  if (pattern === 'university') {
    const all = s.attempt === null;
    if (s.choices >= s.count && s.count > 0) return 'Answer ALL questions, choosing either (a) or (b) from each question.';
    const base = all ? 'Answer ALL questions.' : `Answer any ${word(s.attempt!).toUpperCase()} of the ${word(s.count)} questions.`;
    return s.choices ? `${base} Internal choice is provided in ${plural(s.choices, 'question')}.` : base;
  }
  const parts = [`This section has ${plural(s.count, 'question')} of ${plural(s.marksEach, 'mark')} each.`];
  if (s.attempt !== null) parts.push(`Answer any ${word(s.attempt)}.`);
  if (s.choices) parts.push(`Internal choice is provided in ${plural(s.choices, 'question')}.`);
  return parts.join(' ');
}

/** General instructions for the cover of the paper. */
export function buildGeneralInstructions(shapes: SectionShape[], pattern: ExamPattern): string[] {
  const total = shapes.reduce((t, s) => t + s.count, 0);
  const anyAttempt = shapes.some(s => s.attempt !== null);
  const word0 = sectionWord(pattern);
  const out: string[] = [];
  if (pattern === 'university') {
    let n = 1;
    for (const s of shapes) {
      const marks = s.marksEach * (s.attempt ?? s.count);
      const range = s.count > 1 ? `Questions ${n}–${n + s.count - 1}` : `Question ${n}`;
      out.push(`${word0} ${s.label} (${s.attempt ?? s.count} × ${s.marksEach} = ${marks} marks): ${range}. ${sectionInstruction(s, pattern)}`);
      n += s.count;
    }
    out.push('Assume suitable data wherever necessary and state your assumptions clearly.');
    out.push('Draw neat sketches and diagrams wherever necessary.');
    out.push('Figures in brackets on the right indicate full marks.');
    return out;
  }
  out.push(`This question paper contains ${total} questions. ${anyAttempt ? 'Answer as directed in each section.' : 'All questions are compulsory.'}`);
  if (shapes.length > 1) {
    out.push(`The question paper is divided into ${word(shapes.length)} sections — ${listJoin(shapes.map(s => s.label))}.`);
  }
  let n = 1;
  for (const s of shapes) {
    const range = s.count > 1 ? `Questions ${n} to ${n + s.count - 1} are` : `Question ${n} is`;
    let line = `${word0} ${s.label}: ${range} ${TYPE_PHRASE[s.type][s.count > 1 ? 1 : 0]} carrying ${plural(s.marksEach, 'mark')}${s.count > 1 ? ' each' : ''}.`;
    if (s.attempt !== null) line += ` Answer any ${word(s.attempt)} of them.`;
    if (s.type === 'mcq' && s.assertionReason > 0) {
      const first = n + s.count - s.assertionReason;
      const last = n + s.count - 1;
      line += first === last ? ` Question ${first} is assertion–reason based.`
        : ` Questions ${first} ${last === first + 1 ? 'and' : 'to'} ${last} are assertion–reason based.`;
    }
    out.push(line);
    n += s.count;
  }
  const withChoice = shapes.filter(s => s.choices > 0);
  if (withChoice.length) {
    out.push(`There is no overall choice. However, internal choice has been provided in ${listJoin(withChoice.map(s => `${plural(s.choices, 'question')} of ${word0} ${s.label}`))}.`);
  }
  out.push('Draw neat, labelled diagrams wherever necessary.');
  out.push('Use of calculators is not permitted.');
  return out;
}

// ── Validation (LLM output and edits are untrusted) ──────────────────

const str = (v: unknown, max = 2000) => (typeof v === 'string' ? v.trim().slice(0, max) : '');
// Editor text: keep inner/trailing whitespace the teacher is typing, just cap length.
const text = (v: unknown, max: number, strict: boolean) =>
  typeof v === 'string' ? (strict ? v.trim() : v).slice(0, max) : '';
const num = (v: unknown, fallback: number, min: number, max: number) => {
  const n = Number(v);
  return Number.isFinite(n) ? Math.max(min, Math.min(max, Math.round(n))) : fallback;
};
const obj = (v: unknown) => (v && typeof v === 'object' ? (v as Record<string, unknown>) : {});

const DIFFICULTIES: Difficulty[] = ['easy', 'medium', 'hard'];
const asDifficulty = (v: unknown): Difficulty => (DIFFICULTIES.includes(v as Difficulty) ? (v as Difficulty) : 'medium');

// Models like to number things themselves; the paper numbers questions and letters options.
const stripQNumber = (s: string) => s.replace(/^\s*(?:Q(?:uestion)?\s*)?\d{1,3}\s*[.):]\s+/i, '');
const stripOptionLabel = (s: string) => s.replace(/^\s*(?:\(?[a-dA-D]\)|[a-dA-D][.:])\s+/, '');

/** Correct option index from a model's `correct` (0-3, "b", "(b)") or its answer text. */
function correctIndex(raw: unknown, options: string[], answer: string): number {
  if (typeof raw === 'number' && Number.isInteger(raw) && raw >= 0 && raw < options.length) return raw;
  const s = typeof raw === 'string' ? raw.trim() : '';
  if (/^\d$/.test(s) && +s < options.length) return +s;
  const letter = (s.match(/^\(?([a-dA-D])\)?\.?$/) ?? answer.match(/^\s*(?:option\s*)?\(([a-dA-D])\)/i))?.[1];
  if (letter) {
    const i = letter.toLowerCase().charCodeAt(0) - 97;
    if (i < options.length) return i;
  }
  const byText = options.findIndex(o => o && (s === o || answer.startsWith(o)));
  return byText;
}

function parseItem(value: unknown, type: ExamQuestionType, strict: boolean, marks = 1): ExamItem | null {
  const o = obj(value);
  const qText = strict ? stripQNumber(str(o.text ?? o.question, 4000)) : text(o.text, 4000, false);
  const answer = text(o.answer, 4000, strict);
  let markingScheme = text(o.markingScheme, 2000, strict);
  let options: string[] = [];
  let correct = -1;
  if (isObjective(type)) {
    options = (Array.isArray(o.options) ? o.options : []).slice(0, 6).map(x => (strict ? stripOptionLabel(str(x, 500)) : text(x, 500, false)));
    if (strict) {
      options = options.filter(Boolean);
      if (type === 'assertion-reason' && options.length < 4) options = [...AR_OPTIONS];
      if (options.length < 4) return null;
      options = options.slice(0, 4);
    }
    correct = correctIndex(o.correct, options, answer);
    if (correct < 0) {
      if (strict) return null;
      correct = 0;
    }
    if (strict && !markingScheme) markingScheme = `${plural(marks, 'mark')} for the correct option.`;
  }
  if (strict) {
    if (qText.length < 8) return null;
    if (!isObjective(type) && !answer) return null;
    if (!markingScheme) markingScheme = `${plural(marks, 'mark')} for the value points in the answer.`;
  }
  return {
    text: qText, options, correct, answer, markingScheme,
    chapter: str(o.chapter, 150),
    difficulty: asDifficulty(o.difficulty),
  };
}

function parseQuestion(value: unknown, fallbackType: ExamQuestionType, strict: boolean, marks: number): ExamQuestion | null {
  const o = obj(value);
  const type = QUESTION_TYPE_LIST.includes(o.type as ExamQuestionType) ? (o.type as ExamQuestionType) : fallbackType;
  const item = parseItem(o, type, strict, marks);
  if (!item) return null;
  // An alternative is only kept if usable; a broken one doesn't sink the question.
  const alt = o.alternative ? parseItem(o.alternative, type, strict, marks) : null;
  return { ...item, type, alternative: alt ? { ...alt, chapter: alt.chapter || item.chapter } : null };
}

const PATTERNS: ExamPattern[] = ['school', 'university'];

function parseHeader(value: unknown, strict: boolean): ExamHeader {
  const o = obj(value);
  const examType = EXAM_TYPE_LIST.includes(o.examType as ExamType) ? (o.examType as ExamType) : 'custom';
  return {
    institution: text(o.institution, 150, strict),
    examName: text(o.examName, 150, strict),
    examType,
    pattern: PATTERNS.includes(o.pattern as ExamPattern) ? (o.pattern as ExamPattern) : EXAM_TYPES[examType].pattern ?? 'school',
    className: text(o.className, 100, strict),
    subject: text(o.subject, 100, strict),
    subjectCode: text(o.subjectCode, 30, strict),
    duration: num(o.duration, 180, 5, 600),
    maxMarks: num(o.maxMarks, 80, 1, 500),
    language: str(o.language, 40) || 'English',
  };
}

/**
 * Validates exam content. `strict` is for AI-assembled papers (every section
 * must have complete questions with answers); lenient is for teacher edits and
 * keeps half-typed questions so autosave never loses work.
 */
export function parseExam(value: unknown, strict = true): ExamContent | null {
  const raw = obj(value);
  if (!Array.isArray(raw.sections)) return null;
  const sections: ExamSection[] = [];
  const rawSections: unknown[] = raw.sections.slice(0, 10);
  for (let i = 0; i < rawSections.length; i++) {
    const o = obj(rawSections[i]);
    const questionType = QUESTION_TYPE_LIST.includes(o.questionType as ExamQuestionType) ? (o.questionType as ExamQuestionType) : 'short';
    const marksEach = num(o.marksEach, 1, strict ? 1 : 0, 50);
    const list = Array.isArray(o.questions) ? o.questions.slice(0, MAX_SECTION_QUESTIONS * 2) : [];
    const questions = list.map(q => parseQuestion(q, questionType, strict, marksEach));
    if (strict && (!questions.length || questions.some(q => !q))) return null;
    const valid = questions.filter((q): q is ExamQuestion => !!q);
    const attemptN = o.attempt === null || o.attempt === undefined ? 0 : num(o.attempt, 0, 0, 500);
    sections.push({
      label: text(o.label, 10, strict) || sectionLabel(i),
      title: text(o.title, 200, strict),
      instructions: text(o.instructions, 1000, strict),
      questionType,
      marksEach,
      attempt: attemptN > 0 ? attemptN : null,
      questions: valid,
    });
  }
  if (!sections.length) return null;
  const instructions = (Array.isArray(raw.instructions) ? raw.instructions : [])
    .map(x => text(x, 600, strict)).filter(x => !strict || x).slice(0, 25);
  const content: ExamContent = { header: parseHeader(raw.header, strict), instructions, sections };
  if (strict && examTotal(content) < 1) return null;
  return content;
}

// ── Editing helpers ──────────────────────────────────────────────────

export function emptyItem(type: ExamQuestionType, chapter = ''): ExamItem {
  return {
    text: '',
    options: type === 'assertion-reason' ? [...AR_OPTIONS] : type === 'mcq' ? ['', '', '', ''] : [],
    correct: isObjective(type) ? 0 : -1,
    answer: '', markingScheme: '', chapter, difficulty: 'medium',
  };
}

export const emptyQuestion = (type: ExamQuestionType, chapter = ''): ExamQuestion =>
  ({ ...emptyItem(type, chapter), type, alternative: null });

export function emptySection(i: number, pattern: ExamPattern, type: ExamQuestionType = 'short', marksEach = 3): ExamSection {
  const s: ExamSection = {
    label: sectionLabel(i), title: defaultSectionTitle(type, pattern), instructions: '',
    questionType: type, marksEach, attempt: null, questions: [emptyQuestion(type)],
  };
  s.instructions = sectionInstruction(shapeOfSection(s), pattern);
  return s;
}

/** Re-shape an item for a new question type (keeps options when both are objective). */
export function retypeItem<T extends ExamItem>(item: T, from: ExamQuestionType, to: ExamQuestionType): T {
  if (from === to || (!isObjective(from) && !isObjective(to))) return item;
  const fresh = emptyItem(to);
  return { ...item, options: fresh.options, correct: fresh.correct };
}

// ── Generation plan & prompts ────────────────────────────────────────

export interface PaperRequest {
  examType: ExamType;
  pattern: ExamPattern;
  className: string;
  subject: string;
  subjectCode: string;
  examName: string;
  institution: string;
  language: string;
  maxMarks: number;
  duration: number;
  /** Chapters/topics to cover, in syllabus order (may be empty when a syllabus file is uploaded). */
  chapters: string[];
  mix: DifficultyMix;
  sections: SectionSpec[];
}

/** What one question must be — decided here, not by the model. */
export interface PlannedQuestion {
  /** Paper-wide question number. */
  number: number;
  type: ExamQuestionType;
  /** '' = the model picks a unit of the syllabus. */
  chapter: string;
  difficulty: Difficulty;
  withChoice: boolean;
}

/** One LLM request: a whole section, or a slice of a big one. */
export interface GenerationCall {
  section: number;
  part: number;
  parts: number;
  plan: PlannedQuestion[];
  estTokens: number;
}

/** Most AI requests one paper may use (the free tier allows ~50 a day). */
export const MAX_CALLS = 6;
// Free models stream ≈25 tokens/s and one model attempt may take 150 s, so keep
// each request's expected output well under ~3,700 tokens.
const CALL_TOKEN_BUDGET = 2600;

/** Split free text into chapters/topics: one per line, or comma/semicolon separated. */
export function chaptersFromText(input: string): string[] {
  const lines = input.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  const items = lines.length > 1 ? lines : (lines[0] ?? '').split(/[;,]/).map(l => l.trim()).filter(Boolean);
  return Array.from(new Set(items.map(l => l.replace(/^(?:[-•*]+|\d{1,2}[.)])\s+/, '').trim().slice(0, 120)).filter(Boolean))).slice(0, 30);
}

/** Largest-remainder split of n questions by the difficulty mix: [easy, medium, hard] counts. */
export function difficultyCounts(n: number, mix: DifficultyMix): [number, number, number] {
  const w = [mix.easy, mix.medium, mix.hard].map(x => Math.max(0, x));
  const sum = w[0] + w[1] + w[2] || 1;
  const exact = w.map(x => (x / sum) * n);
  const counts = exact.map(Math.floor);
  const order = exact.map((x, i) => [x - Math.floor(x), i] as const).sort((a, b) => b[0] - a[0] || a[1] - b[1]);
  for (let k = 0; counts[0] + counts[1] + counts[2] < n; k++) counts[order[k % 3][1]]++;
  return [counts[0], counts[1], counts[2]];
}

/** Spread k marked positions evenly over n slots. */
function spread(n: number, k: number): Set<number> {
  const out = new Set<number>();
  if (k >= n) for (let i = 0; i < n; i++) out.add(i);
  else for (let j = 0; j < k; j++) out.add(Math.min(n - 1, Math.floor(((j + 0.5) * n) / k)));
  return out;
}

const BASE_TOKENS: Record<ExamQuestionType, number> = {
  mcq: 100, 'assertion-reason': 120, 'very-short': 130, short: 170, long: 260, 'case-based': 340,
};

/** Rough output tokens for one planned question (Indic scripts take ~2× the tokens). */
export function estimateTokens(q: PlannedQuestion, marksEach: number, language: string): number {
  let t = BASE_TOKENS[q.type];
  if (q.type === 'long' && marksEach > 5) t += (marksEach - 5) * 25;
  return Math.round(t * (language === 'English' ? 1 : 2.2) * (q.withChoice ? 2 : 1));
}

/** Per-question plan for every section (chapters round-robin across the paper, easy → hard within a section). */
export function planQuestions(req: PaperRequest): PlannedQuestion[][] {
  let n = 1;
  let chapterIdx = 0;
  return req.sections.map(s => {
    const [e, m] = difficultyCounts(s.count, req.mix);
    const choice = spread(s.count, s.choices);
    const plan: PlannedQuestion[] = [];
    for (let i = 0; i < s.count; i++) {
      const type: ExamQuestionType = s.type === 'mcq' && i >= s.count - s.assertionReason ? 'assertion-reason' : s.type;
      plan.push({
        number: n++,
        type,
        chapter: req.chapters.length ? req.chapters[chapterIdx++ % req.chapters.length] : '',
        difficulty: i < e ? 'easy' : i < e + m ? 'medium' : 'hard',
        withChoice: choice.has(i),
      });
    }
    return plan;
  });
}

/** `plan` cut into `parts` contiguous slices whose sizes differ by at most one. */
function slicePlan(plan: PlannedQuestion[], parts: number): PlannedQuestion[][] {
  const out: PlannedQuestion[][] = [];
  for (let p = 0; p < parts; p++) out.push(plan.slice(Math.round((p * plan.length) / parts), Math.round(((p + 1) * plan.length) / parts)));
  return out.filter(x => x.length);
}

/** Split the paper into ≤ MAX_CALLS requests (one per section), splitting the heaviest sections first. */
export function planCalls(req: PaperRequest, plans = planQuestions(req)): GenerationCall[] {
  const cost = (i: number, slice: PlannedQuestion[]) =>
    slice.reduce((t, q) => t + estimateTokens(q, req.sections[i].marksEach, req.language), 0);
  const heaviest = (i: number, parts: number) => Math.max(...slicePlan(plans[i], parts).map(sl => cost(i, sl)));
  const parts = plans.map(() => 1);
  for (let calls = plans.length; calls < MAX_CALLS; calls++) {
    let best = -1;
    for (let i = 0; i < plans.length; i++) {
      if (parts[i] >= plans[i].length || heaviest(i, parts[i]) <= CALL_TOKEN_BUDGET) continue;
      if (best < 0 || heaviest(i, parts[i]) > heaviest(best, parts[best])) best = i;
    }
    if (best < 0) break;
    parts[best]++;
  }
  return plans.flatMap((plan, i) => {
    const slices = slicePlan(plan, parts[i]);
    return slices.map((slice, p) => ({ section: i, part: p, parts: slices.length, plan: slice, estTokens: cost(i, slice) }));
  });
}

const COVERAGE: Record<ExamType, string> = {
  'unit-test': 'A short periodic unit test on the chapters listed.',
  quarterly: 'Quarterly (first-term, 3-month) examination covering the chapters taught so far, as listed.',
  'half-yearly': 'Half-yearly (6-month / term-end) examination covering the chapters listed.',
  annual: 'Annual / final examination covering the full syllabus listed — spread questions across all chapters.',
  'mid-sem': 'University mid-semester examination covering the units listed.',
  'end-sem': 'University end-semester examination covering all units of the syllabus listed.',
  custom: 'Class test on the chapters listed.',
};

const DIFFICULTY_MEANING = 'easy = direct recall or understanding of a textbook idea; medium = application in a familiar situation; hard = analysis, multi-step reasoning or an unfamiliar context (HOTS)';

function answerWords(type: ExamQuestionType, marks: number, pattern: ExamPattern): number {
  if (type === 'very-short') return 40;
  if (type === 'short') return 60;
  if (type === 'case-based') return 80;
  if (pattern === 'university') return marks <= 5 ? 80 : marks <= 10 ? 120 : 160;
  return 100;
}

function typeRules(type: ExamQuestionType, marks: number, pattern: ExamPattern, language: string): string {
  switch (type) {
    case 'mcq':
      return `- MCQ: exactly 4 options (plain text, no "(a)" labels), exactly one correct; "correct" is its 0-based index. Distractors must be plausible common mistakes. Never use "all of the above" or "none of the above".`;
    case 'assertion-reason':
      return `- Assertion–Reason: "text" is two lines: "Assertion (A): …" and "Reason (R): …". "options" are the 4 standard options in this order${language === 'English' ? '' : ` (translated into ${language})`}: ${AR_OPTIONS.map((o, i) => `(${String.fromCharCode(97 + i)}) ${o}`).join(' ')} "correct" is the 0-based index of the right option.`;
    case 'very-short':
      return `- Very short answer (${marks} marks): answerable in 2–3 sentences (about 30–50 words).`;
    case 'short':
      return `- Short answer (${marks} marks): answerable in about 50–80 words; may be a small numerical or a reason/explain question.`;
    case 'long':
      return pattern === 'university'
        ? `- Descriptive question (${marks} marks): explain/derive/analyse/design/solve, worth about ${Math.round(marks * 1.8)} minutes of writing. It may be split into sub-parts on new lines like "(i) … (${Math.ceil(marks / 2)})" and "(ii) … (${Math.floor(marks / 2)})" whose marks add up to ${marks}.`
        : `- Long answer (${marks} marks): answerable in about 80–120 words, or a worked numerical / derivation / labelled-diagram question. May have sub-parts "(a) … (b) …" with marks in brackets adding up to ${marks}.`;
    case 'case-based':
      return `- Case-based (${marks} marks): "text" = a real-life case, passage or data set (80–120 words, data written out in words or a small text table), then sub-questions on new lines like "(i) … (1)", "(ii) … (1)", "(iii) … (2)" whose marks add up to ${marks}. "answer" answers every sub-part.`;
  }
}

/** System prompt for exam requests. */
export const examSystemPrompt = (pattern: ExamPattern) =>
  pattern === 'university'
    ? 'You are an experienced Indian university professor who sets semester examination question papers. Return ONLY valid JSON, no prose.'
    : 'You are an experienced CBSE paper setter and senior Indian school teacher. Return ONLY valid JSON, no prose.';

function structureLine(req: PaperRequest): string {
  const word0 = sectionWord(req.pattern);
  return req.sections.map((s, i) => {
    const extras = [
      s.assertionReason ? `${s.assertionReason} assertion–reason` : '',
      s.attempt ? `answer any ${s.attempt}` : '',
      s.choices ? `${s.choices} with internal choice` : '',
    ].filter(Boolean).join(', ');
    return `  ${word0} ${sectionLabel(i)}: ${s.count} × ${plural(s.marksEach, 'mark')} — ${QUESTION_TYPES[s.type].label}${extras ? ` (${extras})` : ''}`;
  }).join('\n');
}

/**
 * Prompt for one GenerationCall. `source` is the uploaded-material block from
 * sourceBlock() ('' if none). Non-English first parts also translate the section
 * heading (and, for the very first call, the general instructions).
 */
export function buildSectionPrompt(req: PaperRequest, call: GenerationCall, source = ''): string {
  const spec = req.sections[call.section];
  const label = sectionLabel(call.section);
  const word0 = sectionWord(req.pattern);
  const title = defaultSectionTitle(spec.type, req.pattern);
  const k = call.plan.length;
  const english = req.language === 'English';
  const objective = isObjective(spec.type);
  const pickChapter = call.plan.some(q => !q.chapter);
  const translateHeading = !english && call.part === 0;
  const translateGeneral = !english && call.section === 0 && call.part === 0;
  const general = translateGeneral ? buildGeneralInstructions(req.sections.map(shapeOfSpec), req.pattern) : [];
  const types = Array.from(new Set(call.plan.map(q => q.type)));

  const planLines = call.plan.map(q => [
    `Q${q.number}`,
    q.type !== spec.type ? QUESTION_TYPES[q.type].label : '',
    q.chapter ? `chapter "${q.chapter}"` : 'a unit of the syllabus not used by the other questions here (return it in "chapter")',
    q.difficulty,
    q.withChoice ? 'WITH INTERNAL CHOICE → also write "alternative": a different question (OR) of the same type, marks, chapter and difficulty that tests another concept' : '',
  ].filter(Boolean).join(' · ')).join('\n');

  const example = objective
    ? `{"text":"…","options":["…","…","…","…"],"correct":0,"answer":"…"${pickChapter ? ',"chapter":"…"' : ''},"alternative":null}`
    : `{"text":"…","answer":"…","markingScheme":"…"${pickChapter ? ',"chapter":"…"' : ''},"alternative":null}`;
  const meta = [
    translateHeading ? '"title":"…","instructions":"…"' : '',
    translateGeneral ? `"generalInstructions":["…"]` : '',
  ].filter(Boolean).join(',');

  return `Write ${plural(k, 'question')} for an Indian ${req.pattern === 'university' ? 'university' : 'school'} examination question paper.

PAPER
- Exam: ${req.examName || EXAM_TYPES[req.examType].name}. ${COVERAGE[req.examType]}
- ${req.pattern === 'university' ? 'Course / semester' : 'Class'}: ${req.className}
- Subject: ${req.subject}${req.subjectCode ? ` (${req.subjectCode})` : ''}
- Maximum marks: ${req.maxMarks} · Time: ${formatDuration(req.duration)}
- Style: ${req.pattern === 'university'
    ? 'Indian university semester paper (AICTE/UGC style, as in Anna University, VTU, Mumbai or Delhi University papers)'
    : 'CBSE / NCERT board-exam style (also used by state boards)'}
- Syllabus: ${req.chapters.length ? req.chapters.join('; ') : 'as given in the SOURCE MATERIAL below — spread questions across its units'}
- Whole paper (you only write your part):
${structureLine(req)}

YOUR PART: ${word0} ${label} — ${title}${call.parts > 1 ? ` (part ${call.part + 1} of ${call.parts}; the other questions of this ${word0.toLowerCase()} are written separately, so stick to the planned chapter and pick a distinct concept for each question)` : ''}: ${plural(k, 'question')} of ${plural(spec.marksEach, 'mark')} each.
${types.map(t => typeRules(t, spec.marksEach, req.pattern, req.language)).join('\n')}

QUESTION PLAN — write exactly these ${k}, in this order (${DIFFICULTY_MEANING}):
${planLines}

QUALITY
- Clear, unambiguous wording with exactly one defensible answer. Do not give the answer away in the question.
- ${req.pattern === 'university'
    ? 'Test concepts, derivations, problem solving, analysis and application — not only definitions.'
    : `Pitch it at ${req.className} level, NCERT-aligned; mix knowledge, understanding, application and competency-based questions as in recent CBSE papers.`}
- Use Indian context where natural (Indian names, places, ₹, everyday situations).
- Each question tests a different concept. Numericals must work out cleanly and state units. No pictures: describe any figure or data in words or as a small text table.
- Do not number the questions or label the options yourself.
- ${english ? 'Write in clear, formal English.' : `Write the questions, options, answers and marking scheme in ${req.language} (native script). Keep technical terms, formulas, symbols and units as Indian ${req.language}-medium textbooks write them (English terms in brackets where that is the norm).`}

ANSWER KEY (examiner's marking scheme)
- "answer": ${objective ? 'the correct option followed by a one-line reason.' : `the expected answer as concise value points (at most ${answerWords(spec.type, spec.marksEach, req.pattern)} words).`}
${objective ? '' : `- "markingScheme": how the ${plural(spec.marksEach, 'mark')} are awarded, point-wise, e.g. "Definition – 1; Correct formula – 1; Calculation with unit – 1". The split must add up to ${spec.marksEach}.\n`}${source}
${translateGeneral ? `Also return "generalInstructions": these general instructions translated into ${req.language}, same order and meaning:\n${general.map((g, i) => `${i + 1}. ${g}`).join('\n')}\n` : ''}${translateHeading ? `Also return "title" and "instructions": the section heading "${title}" and the line "${sectionInstruction(shapeOfSpec(spec, call.section), req.pattern)}" translated into ${req.language}.\n` : ''}
Return ONLY JSON:
{${meta ? `${meta},` : ''}"questions":[${example}]}`;
}

/** What one GenerationCall's response is parsed into. */
export interface CallResult {
  questions: ExamQuestion[];
  title?: string;
  instructions?: string;
  generalInstructions?: string[];
}

/**
 * Strict parser for one call's AI output: exactly the planned questions, each
 * complete; type, chapter and difficulty come from the plan. Tolerates a few
 * missing "OR" alternatives (the teacher can add them) but not most of them.
 */
export function parseCallResult(value: unknown, call: GenerationCall, marksEach: number): CallResult | null {
  const raw = obj(value);
  const list = Array.isArray(raw.questions) ? raw.questions : Array.isArray(value) ? (value as unknown[]) : [];
  if (list.length < call.plan.length) return null;
  const questions: ExamQuestion[] = [];
  let planned = 0, missing = 0;
  for (let i = 0; i < call.plan.length; i++) {
    const p = call.plan[i];
    const o = obj(list[i]);
    const item = parseItem(o, p.type, true, marksEach);
    if (!item) return null;
    const chapter = p.chapter || item.chapter;
    let alternative: ExamItem | null = null;
    if (p.withChoice) {
      planned++;
      const alt = o.alternative ? parseItem(o.alternative, p.type, true, marksEach) : null;
      if (alt) alternative = { ...alt, chapter: p.chapter || alt.chapter || chapter, difficulty: p.difficulty };
      else missing++;
    }
    questions.push({ ...item, type: p.type, chapter, difficulty: p.difficulty, alternative });
  }
  if (missing > Math.floor(planned / 2)) return null;
  const general = Array.isArray(raw.generalInstructions) ? raw.generalInstructions.map(x => str(x, 600)).filter(Boolean) : [];
  return {
    questions,
    title: str(raw.title, 200) || undefined,
    instructions: str(raw.instructions, 1000) || undefined,
    generalInstructions: general.length ? general.slice(0, 25) : undefined,
  };
}

/** Put the generated parts back together into a paper (in call order). */
export function assemblePaper(req: PaperRequest, calls: GenerationCall[], results: CallResult[]): ExamContent {
  const sections: ExamSection[] = req.sections.map((spec, i) => {
    const mine = calls.map((c, j) => [c, results[j]] as const).filter(([c]) => c.section === i).sort((a, b) => a[0].part - b[0].part);
    const first = mine[0]?.[1];
    return {
      label: sectionLabel(i),
      title: (req.language !== 'English' && first?.title) || defaultSectionTitle(spec.type, req.pattern),
      instructions: (req.language !== 'English' && first?.instructions) || sectionInstruction(shapeOfSpec(spec, i), req.pattern),
      questionType: spec.type,
      marksEach: spec.marksEach,
      attempt: spec.attempt,
      questions: mine.flatMap(([, r]) => r.questions),
    };
  });
  const english = buildGeneralInstructions(req.sections.map(shapeOfSpec), req.pattern);
  const translated = results[0]?.generalInstructions;
  return {
    header: {
      institution: req.institution,
      examName: req.examName || EXAM_TYPES[req.examType].name,
      examType: req.examType,
      pattern: req.pattern,
      className: req.className,
      subject: req.subject,
      subjectCode: req.subjectCode,
      duration: req.duration,
      maxMarks: req.maxMarks,
      language: req.language,
    },
    instructions: translated && translated.length >= english.length - 1 ? translated : english,
    sections,
  };
}
