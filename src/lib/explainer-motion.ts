// Adds motion scenes (lib/motion.ts) to an explainer video that was made before
// animations existed: one AI call picks the scenes where something moves or
// changes, writes a motion spec for each, and rewrites those scenes' narration so
// sentence k describes animation step k. Everything else stays as it was.

import { generateJson } from './llm';
import { motionGuide, motionSteps, parseMotion, type SceneMotion } from './motion';
import type { ExplainerContent } from './explainer';

interface MotionPatch { scene: number; motion: SceneMotion; narration: string[] }

function buildPrompt(c: ExplainerContent): string {
  const scenes = c.scenes.map((s, i) => ({
    i, layout: s.slide.layout, title: s.slide.title, bullets: s.slide.bullets.filter(Boolean),
    narration: s.narration,
  }));
  return `This narrated explainer video ("${c.title}", topic "${c.topic}", Class ${c.grade}, language ${c.language}) shows a still picture in every scene. Make it come alive: pick the 3-5 scenes where something MOVES, ACTS or CHANGES (forces, motion, orbits, waves, flows, cycles, particles, reactions, splitting, zooming into structure) and give each an animation template, so the student SEES it happen. Never pick the first scene, "two-column", "summary" or "pause and think" scenes.

Templates:
${motionGuide()}

For each chosen scene return:
- "scene": its index;
- "motion": {"kind": "<template>", "items": [{"emoji": "...", "label": "<${c.language}, max 4 words>"}]} (+ "axis": "y" for a force-pair where A is above B);
- "narration": that scene's narration REWRITTEN in ${c.language} (same warm teacher voice and facts, plain words for text-to-speech): sentence 0 sets the scene up (what the student sees), then exactly ONE sentence per animation step describing what is moving at that moment, then optionally one closing sentence.

SCENES (JSON): ${JSON.stringify(scenes)}

Return ONLY JSON: {"scenes":[{"scene":3,"motion":{"kind":"force-pair","items":[...]},"narration":["..."]}]}`;
}

function parsePatches(value: unknown, c: ExplainerContent): MotionPatch[] | null {
  const raw = value && typeof value === 'object' ? (value as { scenes?: unknown }).scenes : null;
  if (!Array.isArray(raw)) return null;
  const used = new Set<number>();
  const patches = raw.flatMap((x): MotionPatch[] => {
    const o = x && typeof x === 'object' ? (x as Record<string, unknown>) : {};
    const i = Number(o.scene);
    const motion = parseMotion(o.motion);
    const scene = c.scenes[i];
    // never the opening, the last two (pause-and-think, recap) or comparison/summary scenes
    const blocked = !scene || i >= c.scenes.length - 2 || ['title', 'two-column', 'summary'].includes(scene.slide.layout);
    if (!Number.isInteger(i) || i <= 0 || blocked || !motion || used.has(i)) return [];
    const narration = (Array.isArray(o.narration) ? o.narration : [])
      .map(t => (typeof t === 'string' ? t.trim().slice(0, 600) : '')).filter(Boolean).slice(0, 12);
    // keep the old narration when the rewrite can't cover the animation's steps
    const fits = narration.length >= Math.min(motionSteps(motion) + 1, 3);
    used.add(i);
    return [{ scene: i, motion, narration: fits ? narration : scene.narration }];
  });
  return patches.length ? patches.slice(0, 6) : null;
}

/** The video with motion scenes added (throws LlmUnavailableError when the AI can't be reached). */
export async function addMotionToExplainer(content: ExplainerContent): Promise<{ content: ExplainerContent; added: number }> {
  if (content.scenes.some(s => s.motion)) return { content, added: 0 };
  const patches = await generateJson(buildPrompt(content), v => parsePatches(v, content), {
    maxTokens: content.language === 'English' ? 3500 : 6000,
  });
  const scenes = content.scenes.map((s, i) => {
    const p = patches.find(x => x.scene === i);
    return p ? { ...s, motion: p.motion, narration: p.narration } : s;
  });
  return { content: { ...content, scenes }, added: patches.length };
}
