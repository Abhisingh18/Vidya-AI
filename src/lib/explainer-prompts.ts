// Prompts (and the chunk validator) for visual explainer videos, see explainer.ts.
// Generation is split so every LLM call fits the ~270s budget even for Devanagari
// (which costs many tokens): one outline call plans the whole video, then chunks of
// ≤ MAX_CHUNK scenes are written in parallel, each seeing the full outline so the
// chunks join up. Every call counts against the free-tier daily request quota,
// so a video should take 1 outline + ~3 chunks (chunks of 4–5).

import {
  parseOutline, parseScenes, SCENE_TRANSITIONS, TARGET_MINUTES,
  type ExplainerOutline, type ExplainerScene, type OutlineScene,
} from './explainer';
import { MOTION_KINDS, motionGuide } from './motion';
import { deriveTopic, parseSources, sourceBlock, type SourceFile } from './source';

export const MAX_CHUNK = 5;

/** Prompt budget for uploaded notes: the outline sees a large excerpt, each scenes chunk the part about its scenes. */
const OUTLINE_SOURCE_CHARS = 22_000;
const SCENES_SOURCE_CHARS = 9_000;

export interface ExplainerInput {
  topic: string;
  grade: string;
  language: string;
  /** Uploaded notes / chapter / PPT (as text) the video must follow. */
  sources?: SourceFile[];
}

/** Validates and clamps {topic, grade, language, sources} from a request body; the topic may be empty when sources are given. */
export function readExplainerInput(body: unknown): ExplainerInput | { error: string } {
  const o = body && typeof body === 'object' ? (body as Record<string, unknown>) : {};
  const text = (v: unknown, max: number) => (typeof v === 'string' ? v.replace(/\s+/g, ' ').trim().slice(0, max) : '');
  const sources = parseSources(o.sources);
  const topic = text(o.topic, 200) || text(deriveTopic(sources), 200);
  if (!topic) return { error: 'Type a topic or upload your notes' };
  return { topic, grade: text(o.grade, 20) || '9-10', language: text(o.language, 30) || 'English', sources };
}

function context({ topic, grade, language }: ExplainerInput) {
  const lang = language === 'English'
    ? 'Language: English. Write the narration and all on-screen text in clear, simple spoken English.'
    : `Language: ${language}. Write the narration AND all on-screen text (titles, bullets, diagram labels and details) in ${language}, in native script, the way a friendly teacher really talks in an Indian classroom: everyday spoken ${language}, short sentences, never stiff bookish or word-for-word translated language. Use the scientific terms that Indian ${language}-medium textbooks use; English terms are fine where Indian teachers use them. Formulas, units and symbols stay in English form on screen (CO₂, F = ma, m/s²). "imageQuery" is ALWAYS in English.`;
  return `Topic: "${topic}"
Class/grade: ${grade} (Indian CBSE/NCERT level)
${lang}`;
}

// ── Outline ──────────────────────────────────────────────────────────

export function buildOutlinePrompt(o: ExplainerInput): string {
  const material = sourceBlock(o.sources ?? [], o.topic, OUTLINE_SOURCE_CHARS);
  return `Plan a narrated, highly VISUAL explainer video of about ${TARGET_MINUTES} minutes that makes a student truly understand the topic after watching it once. Each scene is one animated picture (a real photo or labelled diagram, or a flow/cycle/cards diagram, always with an emoji) while a warm, excellent teacher talks.
${context(o)}
${material ? `${material}The student uploaded this material from their class: plan the video to teach what it says about the topic, following its order of ideas and using its definitions, examples, numbers and terms (the teaching arc below is a guide; fit it to the material). Each scene "goal" names the specific fact, example or numbers from the material that the scene teaches.\n` : ''}
Plan 12-14 scenes (13 is ideal) following this teaching arc:
1. Hook ("title" layout): a curious question or a real-life Indian situation the student has seen (in the kitchen, on the farm, at a cricket match, on a train, in the monsoon...). Not "today we will learn".
2. Why it matters: where this shows up in the student's own life.
3. What you already know: the one or two earlier ideas this builds on.
4-8. Core ideas, ONE idea per scene, in a logical order, each with a strong visual (what it is, its parts, how it works, the law or formula in words).
9. Worked example or step-by-step process ("diagram" flow), with concrete numbers or steps.
10. Real-life Indian examples.
11. Common misconception ("two-column": the wrong idea vs the correct idea).
12. "Pause and think": one question that checks understanding; the answer is revealed after a pause.
13. Recap ("summary"): 3-4 key takeaways, and answer the hook question from scene 1.
(For 12 or 14 scenes, merge or split the core-idea scenes.)

For each scene:
- "layout": "title" | "image" | "diagram" | "bullets" | "two-column" | "quote" | "summary". At least 60% of the scenes (8 of 13) must be "image" or "diagram". "image" = a real thing the student should SEE (plants, organs, animals, apparatus, places, people, everyday objects, labelled science diagrams); "diagram" = processes, steps, cycles, cause and effect, a set of related ideas; "two-column" only for comparisons; "quote" for one key definition or law.
- "diagramKind": for diagram scenes "flow" (steps in order), "cycle" (repeats in a loop) or "cards" (a set of related ideas); otherwise "".
- "motion": an ANIMATION template when the idea involves something moving, acting or changing, so the student SEES it happen instead of a still picture; otherwise "". Use it generously: whenever the topic has forces, motion, orbits, waves, flow, cycles, particles, reactions, splitting or structure inside structure, 3-6 core-idea / worked-example scenes should have a motion (never the "title", "two-column", "Pause and think" or "summary" scenes). Templates:
${motionGuide()}
- "imageQuery": precise ENGLISH Wikimedia Commons search terms, 2-6 words, naming a concrete thing that can be photographed or a labelled diagram, e.g. "leaf cross section diagram", "chloroplast structure diagram", "rocket launch", "paddy field India". Never abstract ideas ("importance of energy"). Required for "title" and "image" scenes, optional for bullets/summary/quote, "" for diagram and two-column scenes. No two scenes share a query.
- "emoji": one emoji.
- "title": short scene title in ${o.language} (max 6 words).
- "goal": in English, max 30 words: the exact idea, fact, example or numbers this scene teaches, so that scenes never overlap.

Return ONLY JSON:
{"title":"<video title in ${o.language}>","scenes":[{"layout":"title","diagramKind":"","motion":"","title":"...","goal":"...","emoji":"🌱","imageQuery":"..."}]}`;
}

const isVisual = (s: OutlineScene) => s.layout === 'image' || s.layout === 'diagram';

/**
 * Validates the AI's outline: 10–14 scenes (null otherwise, so the next model is tried).
 * When fewer than 60% are image/diagram scenes, "bullets" scenes that have a picture
 * query become "image" scenes; diagram scenes without a kind get "cards".
 */
export function parseOutlineAnswer(value: unknown): ExplainerOutline | null {
  const outline = parseOutline(value);
  if (!outline || outline.scenes.length < 10) return null;
  const scenes = outline.scenes.slice(0, 14).map(s => (
    s.layout === 'diagram' && !s.diagramKind ? { ...s, diagramKind: 'cards' as const } : s));
  const needed = Math.ceil(scenes.length * 0.6) - scenes.filter(isVisual).length;
  scenes
    .map((s, i) => ({ s, i }))
    .filter(({ s, i }) => i > 0 && s.imageQuery && s.layout === 'bullets')
    .slice(0, Math.max(0, needed))
    .forEach(({ s, i }) => { scenes[i] = { ...s, layout: 'image' }; });
  return { ...outline, scenes };
}

// ── Scenes ───────────────────────────────────────────────────────────

/**
 * Narration words per scene so the video lasts about TARGET_MINUTES, using the same
 * speaking rates as estimateSeconds(); ~4.5s per scene go to the 1s scene gap and
 * the per-sentence pause.
 */
export function wordsPerScene(sceneCount: number, language: string) {
  // Models overshoot word targets (a 14-scene Hindi video ran 7:00 against 5:30),
  // so aim ~15% below the speaking rate.
  const wordsPerMinute = (language === 'English' ? 150 : 130) * 0.85;
  const seconds = (TARGET_MINUTES * 60) / Math.max(1, sceneCount) - 4.5;
  return Math.max(30, Math.round((seconds * wordsPerMinute) / 60));
}

const EXAMPLE_SCENE = JSON.stringify({
  slide: {
    layout: 'diagram', emoji: '💧', title: 'The Water Cycle', bullets: ['Water keeps moving'],
    diagram: {
      kind: 'cycle',
      items: [
        { emoji: '☀️', label: 'Evaporation', detail: 'Sun turns water into vapour' },
        { emoji: '☁️', label: 'Condensation', detail: 'Vapour cools into cloud droplets' },
        { emoji: '🌧️', label: 'Rain', detail: 'Heavy droplets fall back down' },
      ],
    },
    visual: 'Loop: sea, rising vapour, cloud, rain',
  },
  narration: [
    'So where does the July rain really come from?',
    'The secret is that water on Earth never gets used up; it just keeps moving.',
    'First, the hot sun warms ponds and the sea, and some water turns into invisible vapour.',
    'High in the cool sky, that vapour becomes tiny droplets, and together they make a cloud.',
    'When the droplets grow too heavy, they fall as rain and fill our wells again.',
  ],
  transition: 'zoom',
});

function planLine(s: OutlineScene, i: number) {
  const kind = s.layout === 'diagram' && s.diagramKind ? ` ${s.diagramKind}` : '';
  const motion = s.motion ? ` | MOTION "${s.motion}"` : '';
  const query = s.imageQuery ? ` | imageQuery "${s.imageQuery}"` : '';
  return `${i + 1}. [${s.layout}${kind}] ${s.emoji} ${s.title}: ${s.goal}${motion}${query}`;
}

/** Rules for the scenes the plan marks with a MOTION template. */
function motionRules(outline: ExplainerOutline, from: number, to: number, language: string): string {
  const kinds = Array.from(new Set(outline.scenes.slice(from, to).map(s => s.motion).filter(Boolean)));
  if (!kinds.length) return '';
  return `
MOTION SCENES (plan marks "MOTION"): the picture is an animation that SHOWS the idea moving, step by step, in time with the narration. Add "motion":{"kind":"<the plan's template>","items":[{"emoji":"...","label":"..."}]} beside "slide" (keep "slide" with its title, emoji and 0-2 caption bullets; no diagram, imageQuery may stay). Labels in ${language}, max 4 words. narration[0] sets the scene up (what the student sees); then exactly one sentence per animation step, describing what is moving at that moment; optionally one closing sentence. Templates used here:
${kinds.map(k => `- "${k}": ${MOTION_KINDS[k as keyof typeof MOTION_KINDS].guide}`).join('\n')}
EXAMPLE motion scene (English, Newton's third law): {"slide":{"layout":"image","emoji":"🚀","title":"Action and reaction","bullets":["Equal and opposite"]},"motion":{"kind":"force-pair","axis":"y","items":[{"emoji":"🚀","label":"Rocket"},{"emoji":"🔥","label":"Hot gas"},{"emoji":"⬇️","label":"Rocket pushes gas down"},{"emoji":"⬆️","label":"Gas pushes rocket up"}]},"narration":["Look at this rocket standing on its launch pad, with hot gas beneath it.","When the engine fires, the rocket pushes the hot gas downwards with a huge force.","At the same moment, the gas pushes the rocket upwards with an equal force.","These two forces never cancel, because they act on two different things, so the rocket shoots up."],"transition":"rise"}
`;
}

export function buildScenesPrompt(o: ExplainerInput & { outline: ExplainerOutline; from: number; to: number }): string {
  const { outline, from, to, language, grade } = o;
  const total = outline.scenes.length;
  // The excerpt is picked for THESE scenes, so the narration uses what the notes say about them.
  const mine = outline.scenes.slice(from, to).map(s => `${s.title} ${s.goal}`).join('\n');
  const material = sourceBlock(o.sources ?? [], o.topic, SCENES_SOURCE_CHARS, { query: mine });
  const count = to - from;
  const words = wordsPerScene(total, language);
  const range = count === 1 ? `scene ${from + 1}` : `scenes ${from + 1}-${to}`;
  const plan = outline.scenes
    .map((s, i) => `${i >= from && i < to ? '>> ' : ''}${planLine(s, i)}`)
    .join('\n');
  const position = [
    from === 0
      ? 'Scene 1 opens straight with the hook (a one-line warm greeting at most).'
      : `The student has just watched scenes 1-${from}: do NOT greet or introduce the topic again; continue naturally from scene ${from}, and refer back to earlier scenes when it helps.`,
    to === total
      ? `Scene ${total} is the last one: end the video with a short, warm closing line.`
      : `Scenes ${to + 1}-${total} come later: do not teach their content yet.`,
  ].join(' ');

  return `You are writing part of a narrated, highly VISUAL explainer video (about ${TARGET_MINUTES} minutes, ${total} scenes) for Indian school students. Other writers are writing the other scenes at the same time from the same plan, so stick closely to each scene's goal.
${context(o)}

VIDEO PLAN: "${outline.title}" (>> marks your scenes)
${plan}
${material ? `${material}The student uploaded this material from their class: write your scenes from it, using its explanations, examples, numbers and terms (in ${language}), and never contradict it.\n` : ''}
Write ${range} (${count} scene${count === 1 ? '' : 's'}), following the plan's layout, title, emoji and goal for each. ${position}

HOW A SCENE PLAYS: the slide appears with its title, emoji and picture; then its items appear one at a time in REVEAL ORDER: bullets first, then "right" (two-column), then diagram items. narration[0] is spoken as the slide appears and narration[k] (k >= 1) as reveal item k appears; the last sentence reveals anything left. So:
- narration[0] sets up the scene (links to the previous scene, says what to look at);
- then exactly ONE sentence per reveal item, in reveal order, explaining THAT item (what it is, why, an example), never an item that has not appeared yet;
- then optionally one closing sentence (a link to the next idea, or a quick question).
So narration has (reveal items + 1) or (reveal items + 2) sentences; "title" and "quote" scenes have no reveal items and get 3-4 sentences.

ON SCREEN = short keywords; the narration does the explaining:
- "title" max 6 words. "subtitle" optional, max 10 words: the hook question on the "title" scene, the definition or law itself on a "quote" scene.
- "bullets": 2-4 short phrases of max 6 words, never full sentences. "image" scenes: 2-3 bullets as captions beside the picture.
- "imageQuery": ENGLISH, 2-6 words, a concrete photographable thing or a labelled diagram; keep the plan's query unless you can make it more precise. Use it on "title", "image" and, when a picture helps, "bullets"/"summary"/"quote" scenes.
- "diagram" scenes: "diagram" = {"kind": "flow" | "cycle" | "cards" (from the plan), "items": 3-5 (max 6) x {"emoji", "label" (max 4 words), "detail" (max 10 words)}}, 0-1 caption bullets (max 2), no imageQuery.
- "two-column": "bullets" = left column, "right" = right column, 1-2 items each (misconception: wrong idea left, starting with ❌; correct idea right, starting with ✅).
- "summary": 3-4 takeaways. "Pause and think" scene: the question is the title or subtitle, and the answer is the LAST bullet, so it appears only after the pause.
- "emoji" on every scene. "visual": max 10 English words describing the picture or diagram.

NARRATION = what a warm, excellent teacher SAYS out loud:
- About ${words} words per scene (sentences of 6-14 words), in simple words a Class ${grade} student knows. Conversational and encouraging; talk to the student ("you"${language === 'Hindi' ? '; in Hindi use "आप"' : ''}).
- Explain WHY, not just what, with relatable Indian examples (roti on a tawa, a cricket ball, a crowded local train, a tulsi plant, Diwali diyas, monsoon rain...).
- Never say "in this slide", "this scene" or "as the bullet says"; say "look at...", "see how...".
- It is read aloud by a ${language} text-to-speech voice: plain words only, no emoji, symbols, brackets or abbreviations; say formulas in words ("force equals mass times acceleration").
- "transition": "swipe" | "zoom" | "fade" | "rise"; vary them, never the same twice in a row.

EXAMPLE of one diagram scene (English, Class 7, "The water cycle"; write yours in ${language}). Its narration: [0] sets up, [1] the caption bullet, [2]-[4] the three diagram items:
${EXAMPLE_SCENE}
${motionRules(outline, from, to, language)}
Omit keys that would be empty. Return ONLY JSON with exactly ${count} scene${count === 1 ? '' : 's'}, in plan order:
{"scenes":[{"slide":{"layout":"...","emoji":"...","title":"...","subtitle":"...","bullets":["..."],"right":["..."],"imageQuery":"...","diagram":{"kind":"...","items":[{"emoji":"...","label":"...","detail":"..."}]},"visual":"..."},"motion":{"kind":"...","items":[{"emoji":"...","label":"..."}]},"narration":["..."],"transition":"..."}]}`;
}

/** Output budget for a chunk: Devanagari and other Indic scripts cost several tokens per word. */
export function scenesMaxTokens(count: number, language: string) {
  return Math.min(8000, (language === 'English' ? 700 : 1300) * count + 800);
}

/**
 * Validates the AI's scenes for outline scenes [from, to): null (so the next model is
 * tried) unless there is exactly one valid scene per requested outline scene. Light
 * repairs keep the slides renderable: plan emoji/imageQuery when missing, a layout that
 * matches the content, ≤ 2 diagram captions, and no transition twice in a row.
 */
export function parseSceneChunk(value: unknown, outline: ExplainerOutline, from: number, to: number): ExplainerScene[] | null {
  const scenes = parseScenes(value);
  if (!scenes || scenes.length !== to - from) return null;
  let previous: ExplainerScene['transition'] | undefined;
  return scenes.map((scene, i) => {
    const plan = outline.scenes[from + i];
    const slide = { ...scene.slide };
    if (!slide.emoji) slide.emoji = plan.emoji;
    if (slide.diagram && plan.layout === 'diagram') slide.layout = 'diagram';
    if (slide.layout === 'diagram' && !slide.diagram) slide.layout = slide.imageQuery || plan.imageQuery ? 'image' : 'bullets';
    if (slide.layout === 'diagram') {
      slide.bullets = slide.bullets.slice(0, 2); // only two captions are drawn
      slide.imageQuery = '';
    } else if (!slide.imageQuery && slide.layout !== 'two-column') {
      slide.imageQuery = plan.imageQuery;
    }
    // An animated scene shows no picture, so don't spend an image search on it.
    if (scene.motion) slide.imageQuery = '';
    let { transition } = scene;
    for (let k = 0; transition === previous; k++) transition = SCENE_TRANSITIONS[(from + i + k) % SCENE_TRANSITIONS.length];
    previous = transition;
    return { ...scene, slide, transition };
  });
}
