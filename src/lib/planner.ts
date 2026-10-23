// Study planner (StudentDoc type 'plan'): content shape, IST date helpers,
// request validation, the AI prompt + strict parser, and the scheduler that
// turns the AI's study order into a day-by-day plan. Pure (no server imports)
// — shared by the API routes, the client and the dashboard (todaysTasks).
//
// The AI decides WHAT to study and in which order (chapter order, how heavy
// each chapter is, specific "learn" / "practice" task titles, tips). The
// calendar maths — dates in IST, days off, hours per day, spaced revision
// (+1 day flashcards, +7 days revise), weekly tests, a final revision phase
// with subject mocks and a full mock on the last day — is done here,
// deterministically, so the plan always fits the student's time and dates.
// Relative imports (not '@/lib/…') so the module also compiles standalone for tests.

import { chaptersFromText } from './exam';
import { LANGUAGES } from './languages';

// ── Shapes ───────────────────────────────────────────────────────────

export type TaskType = 'learn' | 'practice' | 'revise' | 'flashcards' | 'mock';
/** Why the task exists: first study of a chapter, its practice, a revision, or a test. */
export type TaskStage = 'learn' | 'practice' | 'review' | 'mock';
export type Confidence = 'low' | 'medium' | 'high';

export interface PlanTask {
  id: string;
  type: TaskType;
  stage: TaskStage;
  subject: string;
  chapter: string;
  minutes: number;
  title: string;
  done: boolean;
  doneAt: string | null;
}

export interface PlanDay {
  /** YYYY-MM-DD (IST calendar date). */
  date: string;
  tasks: PlanTask[];
}

export interface PlanSubject {
  name: string;
  chapters: string[];
  confidence: Confidence;
}

/** One chapter in the AI's recommended study order. */
export interface PlanChapter {
  subject: string;
  chapter: string;
  /** 1 light · 2 average · 3 heavy. */
  difficulty: 1 | 2 | 3;
  learn: string;
  practice: string;
}

export interface PlanContent {
  examName: string;
  /** YYYY-MM-DD (IST). */
  examDate: string;
  hoursPerDay: number;
  /** Weekdays off: 0 = Sunday … 6 = Saturday. */
  daysOff: number[];
  language: string;
  subjects: PlanSubject[];
  chapters: PlanChapter[];
  tips: string[];
  /** First day of the plan (IST). */
  startDate: string;
  days: PlanDay[];
  /** Bumped on every re-plan; new task ids are prefixed with it. */
  rev: number;
  replannedAt: string | null;
}

export const TASK_TYPES: Record<TaskType, { label: string; action: string }> = {
  learn:      { label: 'Learn',      action: 'Watch a lesson' },
  practice:   { label: 'Practice',   action: 'Practise' },
  revise:     { label: 'Revise',     action: 'Revise' },
  flashcards: { label: 'Flashcards', action: 'Flashcards' },
  mock:       { label: 'Mock test',  action: 'Take the test' },
};
export const TASK_TYPE_LIST = Object.keys(TASK_TYPES) as TaskType[];
export const CONFIDENCE_LIST: Confidence[] = ['low', 'medium', 'high'];
export const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export const MAX_SUBJECTS = 8;
export const MAX_CHAPTERS_PER_SUBJECT = 25;
export const MAX_TOTAL_CHAPTERS = 60;
export const MAX_PLAN_DAYS = 366;
export const MAX_TASKS_PER_DAY = 4;
const MIN_TASK = 15;
/** A new chapter starts at least this often (study days) while there is learning left. */
const NEW_CHAPTER_GAP = 3;
export const FULL_SYLLABUS = 'Full syllabus';

// ── Dates (IST, Asia/Kolkata = UTC+05:30, no daylight saving) ────────

const IST_OFFSET_MS = 330 * 60_000;

/** Today's calendar date in India as YYYY-MM-DD. */
export const istDate = (now: Date = new Date()) => new Date(now.getTime() + IST_OFFSET_MS).toISOString().slice(0, 10);

const toUtc = (date: string) => {
  const [y, m, d] = date.split('-').map(Number);
  return Date.UTC(y, m - 1, d);
};

/** A real YYYY-MM-DD date. */
export function isDateStr(v: unknown): v is string {
  if (typeof v !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(v)) return false;
  const t = toUtc(v);
  return Number.isFinite(t) && new Date(t).toISOString().slice(0, 10) === v;
}

export const addDays = (date: string, n: number) => new Date(toUtc(date) + n * 86_400_000).toISOString().slice(0, 10);
/** b − a in whole days. */
export const daysBetween = (a: string, b: string) => Math.round((toUtc(b) - toUtc(a)) / 86_400_000);
/** 0 = Sunday … 6 = Saturday. */
export const weekday = (date: string) => new Date(toUtc(date)).getUTCDay();
/** Monday of the week containing `date`. */
export const weekStart = (date: string) => addDays(date, -((weekday(date) + 6) % 7));

/** Study dates from `from` (inclusive) up to the day before the exam, skipping days off. */
export function studyDates(from: string, examDate: string, daysOff: number[]): string[] {
  const out: string[] = [];
  const n = Math.min(MAX_PLAN_DAYS + 1, daysBetween(from, examDate));
  for (let i = 0; i < n; i++) {
    const d = addDays(from, i);
    if (!daysOff.includes(weekday(d))) out.push(d);
  }
  return out;
}

/** Formats a YYYY-MM-DD date without shifting it through the viewer's timezone. */
export const formatDate = (date: string, opts: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short' }) =>
  new Date(toUtc(date)).toLocaleDateString('en-IN', { ...opts, timeZone: 'UTC' });

// ── Request validation ───────────────────────────────────────────────

export interface PlanRequest {
  examName: string;
  examDate: string;
  hoursPerDay: number;
  daysOff: number[];
  language: string;
  /** "1"–"12", or '' when not given. */
  grade: string;
  /** Typed chapters; [] = take them from the uploaded syllabus. */
  subjects: PlanSubject[];
}

export const PLAN_CLASSES = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'];

const LANGUAGE_NAMES = LANGUAGES.map(l => l.name);
const clean = (v: unknown, max: number) => (typeof v === 'string' ? v.trim().replace(/\s+/g, ' ').slice(0, max) : '');
const asConfidence = (v: unknown): Confidence => (CONFIDENCE_LIST.includes(v as Confidence) ? (v as Confidence) : 'medium');

export function parseDaysOff(v: unknown): number[] {
  if (!Array.isArray(v)) return [];
  return Array.from(new Set(v.map(Number).filter(n => Number.isInteger(n) && n >= 0 && n <= 6))).sort();
}

/** Hours per day rounded to half hours, or null if outside 0.5–12. */
export function parseHours(v: unknown): number | null {
  const n = Number(v);
  if (!Number.isFinite(n) || n < 0.5 || n > 12) return null;
  return Math.round(n * 2) / 2;
}

/**
 * Validates a new-plan request (before any AI call). `hasSources` = a syllabus
 * was uploaded, so subjects may come without typed chapters.
 */
export function parsePlanRequest(body: unknown, today: string, hasSources: boolean): { req: PlanRequest } | { error: string } {
  const b = (body && typeof body === 'object' ? body : {}) as Record<string, unknown>;
  const examName = clean(b.examName, 120);
  if (!examName) return { error: 'Enter the name of your exam.' };
  if (!isDateStr(b.examDate)) return { error: 'Pick a valid exam date.' };
  const examDate = b.examDate;
  if (examDate <= today) return { error: 'The exam date must be after today.' };
  if (daysBetween(today, examDate) > MAX_PLAN_DAYS) return { error: 'Pick an exam date within the next year.' };
  const hoursPerDay = parseHours(b.hoursPerDay);
  if (hoursPerDay === null) return { error: 'Hours per day must be between 0.5 and 12.' };
  const daysOff = parseDaysOff(b.daysOff);
  if (daysOff.length >= 7) return { error: 'Keep at least one study day in the week.' };
  const language = LANGUAGE_NAMES.includes(b.language as string) ? (b.language as string) : 'English';
  const grade = PLAN_CLASSES.includes(String(b.grade)) ? String(b.grade) : '';

  const raw = Array.isArray(b.subjects) ? b.subjects : [];
  if (!raw.length) return { error: 'Add at least one subject.' };
  if (raw.length > MAX_SUBJECTS) return { error: `Add at most ${MAX_SUBJECTS} subjects.` };
  const subjects: PlanSubject[] = [];
  for (let i = 0; i < raw.length; i++) {
    const o = (raw[i] && typeof raw[i] === 'object' ? raw[i] : {}) as Record<string, unknown>;
    const name = clean(o.name, 60);
    if (!name) return { error: `Subject ${i + 1} needs a name.` };
    if (subjects.some(s => s.name.toLowerCase() === name.toLowerCase())) return { error: `“${name}” is listed twice.` };
    const text = Array.isArray(o.chapters) ? o.chapters.filter(x => typeof x === 'string').join('\n') : String(o.chapters ?? '');
    const chapters = chaptersFromText(text.slice(0, 6000));
    if (chapters.length > MAX_CHAPTERS_PER_SUBJECT) return { error: `${name}: keep it to ${MAX_CHAPTERS_PER_SUBJECT} chapters or fewer.` };
    if (!chapters.length && !hasSources) return { error: `Add the chapters for ${name}, or upload your syllabus.` };
    subjects.push({ name, chapters, confidence: asConfidence(o.confidence) });
  }
  const total = subjects.reduce((n, s) => n + s.chapters.length, 0);
  if (total > MAX_TOTAL_CHAPTERS) return { error: `That's ${total} chapters — keep it to ${MAX_TOTAL_CHAPTERS} or fewer (combine small ones).` };
  if (!studyDates(today, examDate, daysOff).length) return { error: 'There are no study days left before the exam with these days off.' };
  return { req: { examName, examDate, hoursPerDay, daysOff, language, grade, subjects } };
}

// ── AI prompt + strict parser ────────────────────────────────────────

export type ChapterStatus = 'done' | 'started' | 'todo';

export const plannerSystemPrompt =
  'You are an expert Indian school teacher and exam coach who plans revision timetables for students. Return ONLY valid JSON, no prose.';

const norm = (s: string) => s.normalize('NFC').toLowerCase().replace(/\s+/g, ' ').trim();
export const chapterKey = (subject: string, chapter: string) => `${norm(subject)}::${norm(chapter)}`;

/**
 * The single planning prompt (new plan or re-plan). `status` marks chapters
 * already studied when re-planning (key: chapterKey).
 */
export function buildPlanPrompt(
  req: Pick<PlanRequest, 'examName' | 'examDate' | 'hoursPerDay' | 'language' | 'subjects'> & { grade?: string },
  ctx: { today: string; studyDays: number; status?: Map<string, ChapterStatus> },
  source = '',
): string {
  const lines: string[] = [];
  const fromSource: string[] = [];
  req.subjects.forEach((s, si) => {
    if (!s.chapters.length) {
      fromSource.push(`- ${si + 1}. ${s.name} (confidence: ${s.confidence}): chapters not listed — take them from the SOURCE MATERIAL (only this subject's syllabus, at most ${MAX_CHAPTERS_PER_SUBJECT}, in syllabus order) and give them ids ${si + 1}.1, ${si + 1}.2, …`);
      return;
    }
    s.chapters.forEach((c, ci) => {
      const st = ctx.status?.get(chapterKey(s.name, c));
      lines.push(`${si + 1}.${ci + 1} · ${s.name} · ${c} · confidence: ${s.confidence}${st && st !== 'todo' ? ` · ${st === 'done' ? 'already studied' : 'partly studied'}` : ''}`);
    });
  });
  const english = req.language === 'English';
  const replanning = !!ctx.status;

  return `${replanning ? 'Re-plan' : 'Plan'} the study order for an Indian ${req.grade ? `Class ${req.grade} ` : ''}school student preparing for "${req.examName}" on ${formatDate(req.examDate, { day: 'numeric', month: 'long', year: 'numeric' })}.
Today is ${formatDate(ctx.today, { weekday: 'long', day: 'numeric', month: 'long' })}; there are ${ctx.studyDays} study day${ctx.studyDays === 1 ? '' : 's'} left, about ${req.hoursPerDay} hour${req.hoursPerDay === 1 ? '' : 's'} a day. A timetable is built from your answer automatically (spaced revision, weekly tests and a final full mock test are added for you).

CHAPTERS (id · subject · chapter · how confident the student feels${replanning ? ' · progress' : ''}):
${lines.join('\n') || '(none typed)'}
${fromSource.length ? `\nSUBJECTS WITHOUT A CHAPTER LIST:\n${fromSource.join('\n')}\n` : ''}
For EVERY chapter return one entry, in the order the student should study them:
- Interleave subjects so none is left untouched for long; prerequisites first; weak (low-confidence) and high-weightage chapters start earlier.${replanning ? '\n- Chapters already studied go last (they only need revision now).' : ''}
- "difficulty": 1 (light), 2 (average) or 3 (heavy / long) — how much study time it needs.
- "learn": what exactly to study, at most 10 words, specific (e.g. "Mirror formula, magnification and sign convention").
- "practice": what exactly to practise, at most 10 words (e.g. "10 numericals on the lens formula").
Also give "tips": 2–3 short, specific exam-preparation tips for this student (at most 20 words each).
${english ? 'Write "learn", "practice" and "tips" in simple English.' : `Write "learn", "practice" and "tips" in ${req.language} (native script); keep technical terms as ${req.language}-medium textbooks write them.`}
${fromSource.length ? 'For chapters taken from the source material, also return "chapter" (its name, at most 8 words).\n' : ''}${source}
Return ONLY JSON:
{"chapters":[{"id":"1.1",${fromSource.length ? '"chapter":"…",' : ''}"difficulty":2,"learn":"…","practice":"…"}],"tips":["…"]}`;
}

export interface PlanAi {
  chapters: PlanChapter[];
  tips: string[];
}

const obj = (v: unknown) => (v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : {});
const str = (v: unknown, max: number) => (typeof v === 'string' ? v.trim().replace(/\s+/g, ' ').slice(0, max) : '');
const asDifficulty = (v: unknown): 1 | 2 | 3 => {
  const n = Math.round(Number(v));
  return n === 1 || n === 3 ? n : 2;
};

/**
 * Strict parser for the planning call. Typed chapters are matched by id (or by
 * name); at least 60% of them must come back with titles, the rest are added
 * with plain titles. Subjects without typed chapters need ≥ 1 chapter from the AI.
 */
export function parsePlanAi(value: unknown, subjects: PlanSubject[]): PlanAi | null {
  const raw = obj(value);
  const list = (Array.isArray(raw.chapters) ? raw.chapters : Array.isArray(value) ? (value as unknown[]) : []).map(obj);
  const known = new Map<string, { si: number; chapter: string }>();
  const byName = new Map<string, string>();
  subjects.forEach((s, si) => s.chapters.forEach((c, ci) => {
    known.set(`${si + 1}.${ci + 1}`, { si, chapter: c });
    byName.set(norm(c), `${si + 1}.${ci + 1}`);
  }));
  const out: PlanChapter[] = [];
  const seen = new Set<string>();
  const perSubject = subjects.map(() => 0);
  let matchedTyped = 0;

  for (const o of list) {
    const id = str(String(o.id ?? ''), 10);
    const name = str(o.chapter ?? o.name, 120);
    let si = -1;
    let chapter = '';
    const k = known.get(id) ?? (name ? known.get(byName.get(norm(name)) ?? '') : undefined);
    if (k) {
      si = k.si;
      chapter = k.chapter;
    } else {
      // A chapter the AI took from the uploaded syllabus, for a subject without a typed list.
      const fromId = /^(\d{1,2})\./.exec(id)?.[1];
      const bySubject = subjects.findIndex(s => norm(s.name) === norm(str(o.subject, 60)));
      si = fromId ? Number(fromId) - 1 : bySubject;
      if (!subjects[si] || subjects[si].chapters.length || !name) continue;
      if (perSubject[si] >= MAX_CHAPTERS_PER_SUBJECT) continue;
      chapter = name;
    }
    const key = chapterKey(subjects[si].name, chapter);
    if (seen.has(key)) continue;
    const learn = str(o.learn, 120);
    const practice = str(o.practice, 120);
    if (!learn && !practice) continue;
    seen.add(key);
    perSubject[si]++;
    if (k) matchedTyped++;
    out.push({
      subject: subjects[si].name,
      chapter,
      difficulty: asDifficulty(o.difficulty),
      learn: learn || chapter,
      practice: practice || `Practice questions: ${chapter}`,
    });
  }

  const typed = known.size;
  if (typed && matchedTyped < Math.ceil(typed * 0.6)) return null;
  if (subjects.some((s, si) => !s.chapters.length && !perSubject[si])) return null;
  if (!out.length) return null;
  // Typed chapters the AI skipped still get studied.
  subjects.forEach(s => s.chapters.forEach(c => {
    if (!seen.has(chapterKey(s.name, c))) {
      out.push({ subject: s.name, chapter: c, difficulty: 2, learn: c, practice: `Practice questions: ${c}` });
    }
  }));
  const tips = (Array.isArray(raw.tips) ? raw.tips : []).map(t => str(t, 200)).filter(Boolean).slice(0, 3);
  return { chapters: out, tips };
}

// ── Scheduler ────────────────────────────────────────────────────────

export interface ChapterProgress { learned: boolean; learnStarted: boolean; practiced: boolean }

export interface ScheduleInput {
  /** First date to fill (IST), usually today. */
  from: string;
  examDate: string;
  daysOff: number[];
  minutesPerDay: number;
  examName: string;
  subjects: PlanSubject[];
  /** Study order from the AI. */
  chapters: PlanChapter[];
  /** Tasks that stay on their days (done tasks when re-planning); they use up those days' time. */
  kept?: PlanDay[];
  /** Work already done per chapter (chapterKey) when re-planning. */
  progress?: Map<string, ChapterProgress>;
  /** Prefix for new task ids (unique per plan revision). */
  idPrefix: string;
}

const LEARN_BASE = { 1: 35, 2: 50, 3: 70 } as const;
const PRACTICE_BASE = { 1: 20, 2: 30, 3: 40 } as const;
const CONF_LEARN: Record<Confidence, number> = { low: 1.3, medium: 1, high: 0.5 };
const CONF_PRACTICE: Record<Confidence, number> = { low: 1.2, medium: 1, high: 0.8 };
const CONF_RANK: Record<Confidence, number> = { low: 0, medium: 1, high: 2 };
const round5 = (n: number) => Math.max(5, Math.round(n / 5) * 5);
const floor5 = (n: number) => Math.floor(n / 5) * 5;

type NewTask = Omit<PlanTask, 'id' | 'done' | 'doneAt'>;
/**
 * A task to place, with its chapter (index into `chapters`, -1 for grouped),
 * whether it ends that chapter's learning, and its session split.
 */
interface WorkItem { task: NewTask; chapterIdx: number; lastPart: boolean; base: string; part: number; parts: number }

/** Turns the AI's study order into dated tasks from `from` to the day before the exam. */
export function schedulePlan(input: ScheduleInput): PlanDay[] {
  const { minutesPerDay: mpd, chapters, subjects } = input;
  const kept = input.kept ?? [];
  const dates = studyDates(input.from, input.examDate, input.daysOff);
  const keptBy = new Map(kept.map(d => [d.date, d.tasks]));
  const caps = dates.map(date => {
    const k = keptBy.get(date) ?? [];
    return { minutes: Math.max(0, mpd - k.reduce((t, x) => t + x.minutes, 0)), slots: Math.max(0, MAX_TASKS_PER_DAY - k.length) };
  });
  const out: NewTask[][] = dates.map(() => []);
  const N = dates.length;
  const confOf = (subject: string) => subjects.find(s => s.name === subject)?.confidence ?? 'medium';

  if (N) {
    const nonFinal = N - 1;
    const capSum = (a: number, b: number) => caps.slice(a, b).reduce((t, c) => t + c.minutes, 0);
    const slotSum = (a: number, b: number) => caps.slice(a, b).reduce((t, c) => t + c.slots, 0);

    // 1. Work: learn + practice per chapter (skipping what is already done).
    let work: WorkItem[] = [];
    const introduced = new Set<number>();
    // No study day before the final one: there is only time for the mock and a recap.
    const skipWork = nonFinal === 0;
    chapters.forEach((ch, idx) => {
      const conf = confOf(ch.subject);
      const p = input.progress?.get(chapterKey(ch.subject, ch.chapter));
      const base = { subject: ch.subject, chapter: ch.chapter };
      if (skipWork) return;
      if (p?.learned) introduced.add(idx);
      else {
        work.push(item(idx, {
          ...base, stage: 'learn', type: conf === 'high' ? 'revise' : 'learn',
          minutes: LEARN_BASE[ch.difficulty] * CONF_LEARN[conf] * (p?.learnStarted ? 0.5 : 1),
          title: `${conf === 'high' ? 'Revise: ' : ''}${ch.learn}${p?.learnStarted ? ' (finish)' : ''}`,
        }));
      }
      if (!p?.practiced) {
        work.push(item(idx, { ...base, stage: 'practice', type: 'practice', minutes: PRACTICE_BASE[ch.difficulty] * CONF_PRACTICE[conf], title: ch.practice }));
      }
    });

    // 2. Phases: learning, then a revision phase (~20% of the days), then the final mock day.
    let R = nonFinal >= 5 ? Math.max(1, Math.min(14, Math.round(nonFinal * 0.2))) : 0;
    let spaced = true;
    const learnCount = work.filter(w => w.task.stage === 'learn').length;
    const reviewMin = () => (spaced ? learnCount * 35 : 0);
    const Q = minutesOf(work);
    let capLearn = capSum(0, nonFinal - R);
    let f = 1;
    if (Q > 0) {
      if (Q + reviewMin() <= capLearn * 0.6) f = Math.min(1.5, (capLearn * 0.6 - reviewMin()) / Q);
      else if (Q + reviewMin() > capLearn * 0.9) {
        // Tight: use every day for learning, drop the spaced reviews if needed, shrink tasks.
        R = 0;
        capLearn = capSum(0, nonFinal);
        if (Q + reviewMin() > capLearn * 0.9) spaced = false;
        f = Math.max(0.05, Math.min(1, (capLearn * 0.9 - reviewMin()) / Q));
      }
    }
    work.forEach(w => { w.task.minutes = Math.max(MIN_TASK, round5(w.task.minutes * f)); });
    const learnDays = nonFinal - R;
    const fits = (list: WorkItem[]) => minutesOf(list) <= capLearn && list.length <= slotSum(0, learnDays);

    // 3. Still too much: merge each chapter's learn + practice, then group chapters.
    if (!fits(work)) work = mergePairs(work);
    if (!fits(work)) work = groupChapters(work, capLearn, slotSum(0, learnDays));

    // 4. Long tasks become sessions of at most `chunk` minutes.
    const chunk = Math.min(mpd, Math.max(30, Math.min(90, round5(mpd / 2.5))));
    work = work.flatMap(w => {
      if (w.task.minutes <= chunk) return [w];
      const k = Math.ceil(w.task.minutes / chunk);
      const each = Math.max(MIN_TASK, round5(w.task.minutes / k));
      return Array.from({ length: k }, (_, i) => ({
        ...w, lastPart: i === k - 1, part: i + 1, parts: k, task: { ...w.task, minutes: each, title: `${w.base} (part ${i + 1}/${k})` },
      }));
    });

    // 5. Place day by day.
    const totalWork = minutesOf(work);
    // New chapters start at an even pace over the learning phase (and at least every
    // NEW_CHAPTER_GAP study days); once started, a chapter's sessions and its practice
    // follow on the next days without waiting.
    const pace = learnDays > 0 ? totalWork / learnDays : Infinity;
    let lastStart = -Infinity;
    const rotMinutes = Math.max(MIN_TASK, Math.min(60, round5(mpd / 3)));
    const revCount = chapters.map(() => 0);
    const sinceTest = new Map<string, number[]>();
    const reviews: { due: number; task: NewTask }[] = [];
    let placed = 0;
    let wi = 0;

    // Subject mocks spread over the revision phase (weakest subjects first).
    const mockDays = new Map<number, string[]>();
    if (R > 0) {
      const order = [...subjects].sort((a, b) => CONF_RANK[a.confidence] - CONF_RANK[b.confidence]).map(s => s.name);
      const m = Math.min(order.length, R * 2);
      for (let k = 0; k < m; k++) {
        const d = learnDays + Math.min(R - 1, Math.floor(((k + 0.5) * R) / m));
        mockDays.set(d, [...(mockDays.get(d) ?? []), order[k]]);
      }
    }
    const chaptersOf = (subject: string, idxs?: number[]) =>
      (idxs ?? chapters.map((_, i) => i)).filter(i => chapters[i].subject === subject).map(i => chapters[i].chapter);
    const joinChapters = (list: string[]) => {
      const s = list.join(', ');
      return s.length > 150 ? `${s.slice(0, 147)}…` : s;
    };

    for (let d = 0; d < nonFinal; d++) {
      let rem = caps[d].minutes;
      let slots = caps[d].slots;
      const day = out[d];
      const put = (t: NewTask) => { day.push(t); rem -= t.minutes; slots--; };
      const inRevision = d >= learnDays;

      // a) Tests: subject mocks in the revision phase, a weekly test while learning.
      if (inRevision) {
        for (const subject of mockDays.get(d) ?? []) {
          const minutes = Math.min(rem, Math.max(20, Math.min(60, round5(mpd * 0.6))));
          if (slots < 1 || minutes < MIN_TASK) break;
          put({ type: 'mock', stage: 'mock', subject, chapter: FULL_SYLLABUS, minutes, title: `Mock test: ${subject} (full syllabus)` });
        }
      } else if ((d + 1) % 7 === 0 && slots > 1 && rem >= 30) {
        const best = Array.from(sinceTest.entries()).sort((a, b) => b[1].length - a[1].length)[0];
        if (best && best[1].length >= 2) {
          const minutes = Math.min(30, floor5(rem / 2));
          put({ type: 'mock', stage: 'mock', subject: best[0], chapter: joinChapters(chaptersOf(best[0], best[1])), minutes, title: `Weekly test: ${best[0]} — this week's chapters` });
          sinceTest.delete(best[0]);
        }
      }

      // b) Spaced reviews that are due (at most 2 a day; the rest wait a day).
      let r = 0;
      for (let k = 0; k < reviews.length && r < 2 && slots > 0;) {
        const rv = reviews[k];
        if (rv.due <= d && rv.task.minutes <= rem) {
          put(rv.task);
          reviews.splice(k, 1);
          r++;
        } else k++;
      }

      // c) New work, paced so learning finishes by the revision phase.
      let newToday = 0;
      while (wi < work.length && slots > 0) {
        const w = work[wi];
        const starts = wi === 0 || w.chapterIdx < 0 || work[wi - 1].chapterIdx !== w.chapterIdx;
        // (Until a chapter is finished there is nothing to revise, so the first days may start more.)
        if (starts && !inRevision && introduced.size && placed >= pace * (d + 1) && d - lastStart < NEW_CHAPTER_GAP) break;
        const { task, chapterIdx, lastPart } = w;
        let minutes = task.minutes;
        if (minutes > rem) {
          if (newToday || rem < MIN_TASK) break;
          minutes = floor5(rem);
        }
        // The next session of the task placed just before it today: one longer task instead of two.
        const prev = day[day.length - 1];
        const prevWork = newToday ? work[wi - 1] : undefined;
        if (prev && prevWork && w.part > 1 && prevWork.base === w.base && prevWork.task.stage === task.stage
          && prevWork.chapterIdx === chapterIdx && prev.minutes + minutes <= 90) {
          const first = Number(/\(parts? (\d+)/.exec(prev.title)?.[1] ?? w.part - 1);
          prev.minutes += minutes;
          prev.title = first === 1 && w.part === w.parts ? w.base : `${w.base} (parts ${first}–${w.part}/${w.parts})`;
          rem -= minutes;
        } else put({ ...task, minutes });
        placed += task.minutes;
        if (starts) lastStart = d;
        newToday++;
        wi++;
        if (task.stage === 'learn' && lastPart) {
          if (chapterIdx >= 0) {
            introduced.add(chapterIdx);
            sinceTest.set(task.subject, [...(sinceTest.get(task.subject) ?? []), chapterIdx]);
          }
          if (spaced) {
            const at = { subject: task.subject, chapter: task.chapter, stage: 'review' as const };
            reviews.push({ due: d + 1, task: { ...at, type: 'flashcards', minutes: MIN_TASK, title: `Flashcards: ${task.chapter}` } });
            if (d + 7 < nonFinal) reviews.push({ due: d + 7, task: { ...at, type: 'revise', minutes: 20, title: `Revise: ${task.chapter} — key points` } });
          }
        }
      }

      // d) Revision cycles fill the rest: revise → mixed practice → flashcards, weakest chapters first.
      const learning = !inRevision && wi < work.length;
      const maxRot = learning ? (rem >= 30 ? 2 : 0) : 3;
      for (let k = 0; k < maxRot && slots > 0 && rem >= MIN_TASK; k++) {
        const pool = (learning ? Array.from(introduced) : chapters.map((_, i) => i))
          .filter(i => !day.some(t => t.chapter === chapters[i].chapter && t.subject === chapters[i].subject));
        if (!pool.length) break;
        pool.sort((a, b) => revCount[a] - revCount[b]
          || CONF_RANK[confOf(chapters[a].subject)] - CONF_RANK[confOf(chapters[b].subject)]
          || chapters[b].difficulty - chapters[a].difficulty || a - b);
        const i = pool[0];
        const ch = chapters[i];
        const kind = revCount[i] % 3;
        revCount[i]++;
        const minutes = Math.min(floor5(rem), kind === 2 ? 20 : rotMinutes);
        if (minutes < MIN_TASK) break;
        put(kind === 0
          ? { type: 'revise', stage: 'review', subject: ch.subject, chapter: ch.chapter, minutes, title: `Revise: ${ch.learn}` }
          : kind === 1
            ? { type: 'practice', stage: 'review', subject: ch.subject, chapter: ch.chapter, minutes, title: `Mixed practice: ${ch.chapter}` }
            : { type: 'flashcards', stage: 'review', subject: ch.subject, chapter: ch.chapter, minutes, title: `Flashcards: ${ch.chapter}` });
      }
    }

    // Work that did not fit anywhere goes to the emptiest days, so every chapter is covered.
    for (; wi < work.length; wi++) {
      const { task } = work[wi];
      let best = -1;
      for (let d = 0; d < nonFinal; d++) {
        if (out[d].length + (keptBy.get(dates[d])?.length ?? 0) >= MAX_TASKS_PER_DAY + 1) continue;
        if (best < 0 || load(out[d]) < load(out[best])) best = d;
      }
      if (best >= 0) out[best].push({ ...task, minutes: Math.min(task.minutes, Math.max(MIN_TASK, mpd)) });
    }

    // 6. Final day: a full mock test, then a light recap.
    const fin = caps[N - 1];
    let rem = fin.minutes;
    let slots = fin.slots;
    if (slots > 0 && rem >= MIN_TASK) {
      const minutes = rem >= 90 ? Math.min(120, floor5(rem - 30)) : floor5(rem);
      const names = subjects.map(s => s.name);
      out[N - 1].unshift({
        type: 'mock', stage: 'mock', subject: names.length > 3 ? 'All subjects' : names.join(' + '), chapter: FULL_SYLLABUS,
        minutes, title: `Full mock test — ${input.examName}`,
      });
      rem -= minutes;
      slots--;
    }
    if (slots > 0 && rem >= MIN_TASK) {
      const weakest = [...subjects].sort((a, b) => CONF_RANK[a.confidence] - CONF_RANK[b.confidence])[0];
      if (weakest) {
        out[N - 1].push({ type: 'flashcards', stage: 'review', subject: weakest.name, chapter: FULL_SYLLABUS, minutes: Math.min(30, floor5(rem)), title: `Quick recap: ${weakest.name} formulas & key points` });
      }
    }
  }

  // Number the new tasks and merge them with the kept ones.
  let n = 0;
  const days = new Map<string, PlanTask[]>();
  for (const d of kept) days.set(d.date, [...d.tasks]);
  dates.forEach((date, i) => {
    if (!out[i].length) return;
    const fresh = out[i].map(t => ({ ...t, id: `${input.idPrefix}${++n}`, done: false, doneAt: null }));
    days.set(date, [...(days.get(date) ?? []), ...fresh]);
  });
  return Array.from(days.entries())
    .filter(([, tasks]) => tasks.length)
    .sort((a, b) => (a[0] < b[0] ? -1 : 1))
    .map(([date, tasks]) => ({ date, tasks }));
}

function load(tasks: NewTask[]) { return tasks.reduce((t, x) => t + x.minutes, 0); }
function item(chapterIdx: number, task: NewTask): WorkItem {
  return { task, chapterIdx, lastPart: true, base: task.title, part: 1, parts: 1 };
}
function minutesOf(work: WorkItem[]) { return work.reduce((t, w) => t + w.task.minutes, 0); }

/** One "learn & practise" task per chapter instead of two. */
function mergePairs(work: WorkItem[]): WorkItem[] {
  const out: WorkItem[] = [];
  for (const w of work) {
    const prev = out[out.length - 1];
    if (prev && w.task.stage === 'practice' && prev.task.stage === 'learn' && prev.chapterIdx === w.chapterIdx) {
      prev.task.minutes = Math.max(MIN_TASK, round5((prev.task.minutes + w.task.minutes) * 0.6));
      prev.task.title = `${prev.task.title} + ${w.task.title}`.slice(0, 200);
      prev.base = prev.task.title;
      continue;
    }
    out.push({ ...w, task: { ...w.task } });
  }
  return out;
}

/** Crunch mode: several chapters of a subject per quick-revision task. */
function groupChapters(work: WorkItem[], capMinutes: number, slots: number): WorkItem[] {
  const g = Math.max(2, Math.ceil(Math.max((work.length * MIN_TASK) / Math.max(1, capMinutes), work.length / Math.max(1, slots))));
  const bySubject = new Map<string, string[]>();
  for (const w of work) {
    if (w.task.stage !== 'learn') continue;
    bySubject.set(w.task.subject, [...(bySubject.get(w.task.subject) ?? []), w.task.chapter]);
  }
  const groups: WorkItem[] = [];
  for (const [subject, names] of Array.from(bySubject.entries())) {
    for (let i = 0; i < names.length; i += g) {
      const chapter = names.slice(i, i + g).join(', ').slice(0, 150);
      groups.push(item(-1, { type: 'revise', stage: 'learn', subject, chapter, minutes: MIN_TASK, title: `Quick revision: ${chapter}`.slice(0, 200) }));
    }
  }
  const each = Math.max(MIN_TASK, floor5((capMinutes * 0.95) / Math.max(1, groups.length)));
  groups.forEach(w => { w.task.minutes = Math.min(60, each); });
  return groups;
}

// ── Building and re-planning ─────────────────────────────────────────

/** Subjects with the chapters the AI took from the syllabus filled in. */
function withAiChapters(subjects: PlanSubject[], ai: PlanAi): PlanSubject[] {
  return subjects.map(s => (s.chapters.length ? s : { ...s, chapters: ai.chapters.filter(c => c.subject === s.name).map(c => c.chapter) }));
}

export function createPlanContent(req: PlanRequest, ai: PlanAi, now: Date): PlanContent {
  const today = istDate(now);
  const subjects = withAiChapters(req.subjects, ai);
  return {
    examName: req.examName,
    examDate: req.examDate,
    hoursPerDay: req.hoursPerDay,
    daysOff: req.daysOff,
    language: req.language,
    subjects,
    chapters: ai.chapters,
    tips: ai.tips,
    startDate: today,
    days: schedulePlan({
      from: today, examDate: req.examDate, daysOff: req.daysOff, minutesPerDay: Math.round(req.hoursPerDay * 60),
      examName: req.examName, subjects, chapters: ai.chapters, idPrefix: 't0-',
    }),
    rev: 0,
    replannedAt: null,
  };
}

/** What has been done per chapter, from the ticked tasks. */
export function chapterProgress(content: PlanContent): Map<string, ChapterProgress> {
  const map = new Map<string, { learnDone: number; learnTodo: number; practiceDone: number; practiceTodo: number }>();
  for (const d of content.days) {
    for (const t of d.tasks) {
      if (t.stage !== 'learn' && t.stage !== 'practice') continue;
      const key = chapterKey(t.subject, t.chapter);
      const p = map.get(key) ?? { learnDone: 0, learnTodo: 0, practiceDone: 0, practiceTodo: 0 };
      if (t.stage === 'learn') { if (t.done) p.learnDone++; else p.learnTodo++; }
      else if (t.done) p.practiceDone++; else p.practiceTodo++;
      map.set(key, p);
    }
  }
  const out = new Map<string, ChapterProgress>();
  map.forEach((p, key) => out.set(key, {
    learned: p.learnDone > 0 && p.learnTodo === 0,
    learnStarted: p.learnDone > 0,
    practiced: p.practiceDone > 0 && p.practiceTodo === 0,
  }));
  return out;
}

export function chapterStatuses(content: PlanContent): Map<string, ChapterStatus> {
  const out = new Map<string, ChapterStatus>();
  chapterProgress(content).forEach((p, key) => out.set(key, p.learned && p.practiced ? 'done' : p.learnStarted || p.learned ? 'started' : 'todo'));
  return out;
}

/**
 * Re-plan from today: every done task stays where it is, everything not done
 * is dropped and the remaining work is scheduled again from today with the
 * (re-ordered) chapters from one AI call. Hours/days off may change.
 */
export function replanContent(
  content: PlanContent, ai: PlanAi, now: Date, opts: { hoursPerDay?: number; daysOff?: number[] } = {},
): PlanContent {
  const today = istDate(now);
  const hoursPerDay = opts.hoursPerDay ?? content.hoursPerDay;
  const daysOff = opts.daysOff ?? content.daysOff;
  const progress = chapterProgress(content);
  const kept = content.days
    .map(d => ({ date: d.date, tasks: d.tasks.filter(t => t.done) }))
    .filter(d => d.tasks.length);
  // Keep chapters the AI dropped (it should return all of them).
  const seen = new Set(ai.chapters.map(c => chapterKey(c.subject, c.chapter)));
  const chapters = [...ai.chapters, ...content.chapters.filter(c => !seen.has(chapterKey(c.subject, c.chapter)))];
  const rev = content.rev + 1;
  return {
    ...content,
    hoursPerDay,
    daysOff,
    chapters,
    tips: ai.tips.length ? ai.tips : content.tips,
    days: schedulePlan({
      from: today, examDate: content.examDate, daysOff, minutesPerDay: Math.round(hoursPerDay * 60),
      examName: content.examName, subjects: content.subjects, chapters, kept, progress, idPrefix: `t${rev}-`,
    }),
    rev,
    replannedAt: now.toISOString(),
  };
}

// ── Stored content (lenient: keeps whatever is usable) ───────────────

function parseTask(value: unknown): PlanTask | null {
  const o = obj(value);
  const id = str(o.id, 40);
  const type = TASK_TYPE_LIST.includes(o.type as TaskType) ? (o.type as TaskType) : null;
  const title = str(o.title, 200);
  if (!id || !type || !title) return null;
  const stages: TaskStage[] = ['learn', 'practice', 'review', 'mock'];
  const minutes = Math.round(Number(o.minutes));
  return {
    id, type, title,
    stage: stages.includes(o.stage as TaskStage) ? (o.stage as TaskStage) : type === 'mock' ? 'mock' : type === 'learn' ? 'learn' : type === 'practice' ? 'practice' : 'review',
    subject: str(o.subject, 80),
    chapter: str(o.chapter, 160),
    minutes: Number.isFinite(minutes) ? Math.max(5, Math.min(600, minutes)) : 30,
    done: o.done === true,
    doneAt: o.done === true ? str(o.doneAt, 40) || null : null,
  };
}

/** Validates stored or edited plan content (lenient); null if unusable. */
export function parsePlanContent(value: unknown): PlanContent | null {
  let v = value;
  if (typeof v === 'string') { try { v = JSON.parse(v); } catch { return null; } }
  const raw = obj(v);
  if (!isDateStr(raw.examDate) || !Array.isArray(raw.days)) return null;
  const ids = new Set<string>();
  const days: PlanDay[] = [];
  for (const d of raw.days.slice(0, MAX_PLAN_DAYS + 30)) {
    const o = obj(d);
    if (!isDateStr(o.date)) continue;
    const tasks = (Array.isArray(o.tasks) ? o.tasks : []).slice(0, 12).map(parseTask)
      .filter((t): t is PlanTask => !!t && !ids.has(t.id) && !!ids.add(t.id));
    days.push({ date: o.date, tasks });
  }
  days.sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
  const subjects: PlanSubject[] = (Array.isArray(raw.subjects) ? raw.subjects : []).slice(0, MAX_SUBJECTS).map(s => {
    const o = obj(s);
    return {
      name: str(o.name, 60),
      chapters: (Array.isArray(o.chapters) ? o.chapters : []).map(c => str(c, 120)).filter(Boolean).slice(0, MAX_CHAPTERS_PER_SUBJECT),
      confidence: asConfidence(o.confidence),
    };
  }).filter(s => s.name);
  const chapters: PlanChapter[] = (Array.isArray(raw.chapters) ? raw.chapters : []).slice(0, MAX_TOTAL_CHAPTERS * 2).map(c => {
    const o = obj(c);
    return { subject: str(o.subject, 60), chapter: str(o.chapter, 150), difficulty: asDifficulty(o.difficulty), learn: str(o.learn, 120), practice: str(o.practice, 120) };
  }).filter(c => c.subject && c.chapter);
  const hours = parseHours(raw.hoursPerDay) ?? 2;
  const startDate = isDateStr(raw.startDate) ? raw.startDate : days[0]?.date ?? raw.examDate;
  return {
    examName: str(raw.examName, 120) || 'Exam',
    examDate: raw.examDate,
    hoursPerDay: hours,
    daysOff: parseDaysOff(raw.daysOff),
    language: LANGUAGE_NAMES.includes(raw.language as string) ? (raw.language as string) : 'English',
    subjects,
    chapters: chapters.map(c => ({ ...c, learn: c.learn || c.chapter, practice: c.practice || `Practice questions: ${c.chapter}` })),
    tips: (Array.isArray(raw.tips) ? raw.tips : []).map(t => str(t, 200)).filter(Boolean).slice(0, 3),
    startDate,
    days,
    rev: Math.max(0, Math.round(Number(raw.rev)) || 0),
    replannedAt: str(raw.replannedAt, 40) || null,
  };
}

/**
 * Ticks / unticks tasks by id. Returns the new content and the ids that went
 * from not-done to done (for XP).
 */
export function applyToggles(content: PlanContent, toggles: Record<string, unknown>, now: Date): { content: PlanContent; newlyDone: string[] } {
  const newlyDone: string[] = [];
  const days = content.days.map(d => ({
    ...d,
    tasks: d.tasks.map(t => {
      const v = toggles[t.id];
      if (typeof v !== 'boolean' || v === t.done) return t;
      if (v) newlyDone.push(t.id);
      return { ...t, done: v, doneAt: v ? now.toISOString() : null };
    }),
  }));
  return { content: { ...content, days }, newlyDone };
}

// ── Progress, status and links ───────────────────────────────────────

export const allTasks = (content: Pick<PlanContent, 'days'>) => content.days.flatMap(d => d.tasks);

export function planProgress(content: Pick<PlanContent, 'days'>) {
  const tasks = allTasks(content);
  const done = tasks.filter(t => t.done);
  const total = tasks.length;
  return {
    done: done.length,
    total,
    pct: total ? Math.round((done.length / total) * 100) : 0,
    doneMinutes: done.reduce((t, x) => t + x.minutes, 0),
    totalMinutes: tasks.reduce((t, x) => t + x.minutes, 0),
  };
}

export type PlanState = 'on-track' | 'behind' | 'ahead' | 'exam-over';

/** On track / behind (tasks from earlier days not done) / ahead (later days' tasks already done). */
export function planStatus(content: Pick<PlanContent, 'days' | 'examDate'>, now: Date = new Date()) {
  const today = istDate(now);
  let overdue = 0, overdueMinutes = 0, ahead = 0;
  for (const d of content.days) {
    for (const t of d.tasks) {
      if (d.date < today && !t.done) { overdue++; overdueMinutes += t.minutes; }
      if (d.date > today && t.done) ahead++;
    }
  }
  const state: PlanState = today >= content.examDate ? 'exam-over' : overdue > 0 ? 'behind' : ahead > 0 ? 'ahead' : 'on-track';
  return { state, overdue, overdueMinutes, ahead, daysLeft: daysBetween(today, content.examDate) };
}

/**
 * Today's tasks (IST) of a plan — for the dashboard's "today's plan" card.
 * Accepts the stored JSON string or parsed content; [] when there are none.
 */
export function todaysTasks(planContent: unknown, now: Date = new Date()): PlanTask[] {
  const content = parsePlanContent(planContent);
  if (!content) return [];
  const today = istDate(now);
  return content.days.find(d => d.date === today)?.tasks ?? [];
}

/** All chapters of a subject ('A + B' / 'All subjects' → every subject's chapters). */
function chaptersForMock(task: Pick<PlanTask, 'subject' | 'chapter'>, subjects?: PlanSubject[]): string[] {
  if (task.chapter !== FULL_SYLLABUS) return [task.chapter];
  if (!subjects?.length) return [];
  const names = task.subject.split(' + ');
  const list = subjects.filter(s => task.subject === 'All subjects' || names.includes(s.name));
  return list.flatMap(s => s.chapters).slice(0, 30);
}

/**
 * Where a task's action button goes: learn → lesson video, revise/flashcards →
 * flashcards, practice/mock → a mock test prefilled with the chapter(s).
 * Pass the plan's subjects so full-syllabus mocks list their chapters.
 */
export function taskHref(task: Pick<PlanTask, 'type' | 'subject' | 'chapter' | 'minutes'>, subjects?: PlanSubject[]): string {
  const topic = task.chapter === FULL_SYLLABUS ? task.subject : task.chapter;
  const q = (params: Record<string, string>) => new URLSearchParams(params).toString();
  switch (task.type) {
    case 'learn':
      return `/generate?${q({ topic })}`;
    case 'revise':
    case 'flashcards':
      return `/flashcards?${q({ topic })}`;
    default: {
      const chapters = chaptersForMock(task, subjects);
      const length = task.type === 'mock' ? (task.minutes >= 50 ? 'full' : 'standard') : task.minutes >= 30 ? 'standard' : 'quick';
      return `/practice?${q({ topic: chapters.length ? chapters.join('\n') : topic, subject: task.subject, length })}`;
    }
  }
}
