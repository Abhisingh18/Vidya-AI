// Visual explainer videos: a narrated sequence of animated scenes. Each scene's
// picture is a teacher-deck Slide (same renderer, images and diagrams), so the
// slide "Visual contract" in teacher-docs.ts applies to scene.slide too.
//
// Narration ↔ visuals: sentence 0 introduces the scene; sentence k (k ≥ 1)
// reveals reveal-item k (bullets, then diagram items). The last sentence
// reveals everything that is left. See revealForSentence().
//
// A scene may instead carry a `motion` (lib/motion.ts): an animation that shows
// the idea moving, with sentence k playing step k (see motionBeat()).

import { MOTION_KIND_LIST, parseMotion, type MotionKind, type SceneMotion } from './motion';
import { parseSlides, revealSteps, SLIDE_LAYOUTS, SLIDE_THEMES, type Slide, type SlideTheme } from './teacher-docs';

export const EXPLAINER_FORMAT = 'explainer-v1';

export type SceneTransition = 'swipe' | 'zoom' | 'fade' | 'rise';
export const SCENE_TRANSITIONS: SceneTransition[] = ['swipe', 'zoom', 'fade', 'rise'];

export interface ExplainerScene {
  slide: Slide;
  /** Spoken sentences, in the video's language. */
  narration: string[];
  /** How this scene enters. */
  transition: SceneTransition;
  /** Animated scene instead of the slide's picture (title and captions stay). */
  motion?: SceneMotion;
}

export interface ExplainerContent {
  format: typeof EXPLAINER_FORMAT;
  title: string;
  topic: string;
  grade: string;
  language: string;
  theme: SlideTheme;
  scenes: ExplainerScene[];
}

/** Planned scene from the outline step (before narration is written). */
export interface OutlineScene {
  layout: Slide['layout'];
  title: string;
  /** What this scene must teach, one line. */
  goal: string;
  emoji: string;
  imageQuery: string;
  diagramKind: '' | 'flow' | 'cycle' | 'cards';
  /** Motion template for the scene, '' for a still picture. */
  motion: MotionKind | '';
}

export interface ExplainerOutline {
  title: string;
  scenes: OutlineScene[];
}

export const TARGET_MINUTES = 5.5;

/** Reveal count to show while `sentence` (0-based) of `count` is being spoken. */
export function revealForSentence(slide: Slide, sentence: number, count: number): number {
  const steps = revealSteps(slide);
  if (steps === 0) return 0;
  if (sentence >= count - 1) return steps;
  return Math.min(steps, sentence);
}

/** Rough speaking time, used for durations, the progress bar and silent playback. */
export function estimateSeconds(text: string, language: string): number {
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  const wordsPerMinute = language === 'English' ? 150 : 130;
  return (words / wordsPerMinute) * 60 + 0.6;
}

export function explainerDuration(content: ExplainerContent): number {
  return Math.round(content.scenes.reduce(
    (t, s) => t + s.narration.reduce((u, line) => u + estimateSeconds(line, content.language), 0) + 1, 0));
}

/** Narration as the legacy {time, text}[] script used by quiz, doubt chat and Video.script. */
export function explainerToScript(content: ExplainerContent): { time: string; text: string }[] {
  let t = 0;
  const out: { time: string; text: string }[] = [];
  for (const scene of content.scenes) {
    for (const text of scene.narration) {
      out.push({ time: `${Math.floor(t / 60)}:${String(Math.floor(t % 60)).padStart(2, '0')}`, text });
      t += estimateSeconds(text, content.language);
    }
    t += 1;
  }
  return out;
}

export function isExplainer(value: unknown): value is ExplainerContent {
  return !!value && typeof value === 'object' && (value as { format?: unknown }).format === EXPLAINER_FORMAT;
}

// ── Validation ───────────────────────────────────────────────────────

const str = (v: unknown, max: number) => (typeof v === 'string' ? v.trim().slice(0, max) : '');
const obj = (v: unknown) => (v && typeof v === 'object' ? (v as Record<string, unknown>) : {});

export function parseOutline(value: unknown): ExplainerOutline | null {
  const raw = obj(value);
  const scenes = (Array.isArray(raw.scenes) ? raw.scenes : []).map((s): OutlineScene => {
    const o = obj(s);
    const kind = str(o.diagramKind, 10);
    const motion = str(o.motion, 20) as MotionKind;
    return {
      layout: SLIDE_LAYOUTS.includes(o.layout as Slide['layout']) ? (o.layout as Slide['layout']) : 'bullets',
      title: str(o.title, 200),
      goal: str(o.goal, 400),
      emoji: str(o.emoji, 16),
      imageQuery: str(o.imageQuery, 100),
      diagramKind: kind === 'flow' || kind === 'cycle' || kind === 'cards' ? kind : '',
      motion: MOTION_KIND_LIST.includes(motion) ? motion : '',
    };
  }).filter(s => s.title);
  if (scenes.length < 6) return null;
  return { title: str(raw.title, 200) || scenes[0].title, scenes: scenes.slice(0, 18) };
}

/** Scenes for one chunk. `strict` (AI output) requires real narration on every scene. */
export function parseScenes(value: unknown, strict = true): ExplainerScene[] | null {
  const raw = obj(value);
  const list = Array.isArray(raw.scenes) ? raw.scenes : Array.isArray(value) ? (value as unknown[]) : [];
  const slides = parseSlides({ slides: list.map(s => obj(s).slide ?? s) }, false)?.slides ?? [];
  if (slides.length !== list.length) return null;
  const scenes = list.map((s, i) => {
    const o = obj(s);
    const narration = (Array.isArray(o.narration) ? o.narration : [])
      .map(x => str(x, 600)).filter(Boolean).slice(0, 12);
    const transition = SCENE_TRANSITIONS.includes(o.transition as SceneTransition) ? (o.transition as SceneTransition) : 'swipe';
    const motion = parseMotion(o.motion);
    return { slide: slides[i], narration, transition, ...(motion ? { motion } : {}) };
  });
  if (strict && (!scenes.length || scenes.some(s => s.narration.length < 2))) return null;
  return scenes;
}

export function parseExplainer(value: unknown): ExplainerContent | null {
  const raw = obj(value);
  const scenes = parseScenes({ scenes: raw.scenes }, false);
  if (!scenes?.length) return null;
  const theme = (Object.keys(SLIDE_THEMES) as SlideTheme[]).includes(raw.theme as SlideTheme) ? (raw.theme as SlideTheme) : 'saffron';
  return {
    format: EXPLAINER_FORMAT,
    title: str(raw.title, 200) || scenes[0].slide.title,
    topic: str(raw.topic, 200),
    grade: str(raw.grade, 20),
    language: str(raw.language, 30) || 'English',
    theme,
    scenes: scenes.slice(0, 24),
  };
}
