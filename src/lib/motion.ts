// Motion scenes for explainer videos: instead of a still picture, the scene plays
// a small animation that SHOWS the idea moving — forces pushing, a planet orbiting,
// a wave travelling, current flowing, particles speeding up — drawn by
// components/motion/motion-stage.tsx from a template and its items (emoji + label).
//
// Narration ↔ motion: sentence 0 sets the scene up (objects visible, still);
// sentence k (k ≥ 1) starts step k of the template; the last sentence shows every
// step. See motionBeat().

export type MotionKind =
  | 'force-pair' | 'orbit' | 'wave' | 'flow' | 'cycle'
  | 'particles' | 'reaction' | 'fall' | 'split' | 'zoom';

export interface MotionItem { emoji: string; label: string }

export interface SceneMotion {
  kind: MotionKind;
  items: MotionItem[];
  /** force-pair only: 'y' puts A above B (rocket over its exhaust, a jump off the ground). */
  axis?: 'x' | 'y';
}

interface KindInfo {
  /** Items the template uses: [min, max]. */
  items: [number, number];
  /** Number of steps after the set-up (sentence 0), given the item count. */
  steps: (n: number) => number;
  /** For the AI: when to use it, what each item is, what each step shows. */
  guide: string;
}

export const MOTION_KINDS: Record<MotionKind, KindInfo> = {
  'force-pair': {
    items: [4, 4], steps: () => 3,
    guide: 'action and reaction / any push between two things (Newton\'s third law, rocket and exhaust gas, a swimmer and water, a gun\'s recoil, walking on the ground). items: [A = the thing that pushes, B = the thing pushed, action label ("A pushes B"), reaction label ("B pushes A back")]. Steps: 1 A pushes B and the action arrow grows on B, 2 the equal and opposite reaction arrow grows on A, 3 both move apart again and again. Add "axis":"y" when A is above B (rocket over its exhaust).',
  },
  orbit: {
    items: [2, 4], steps: n => Math.min(3, n),
    guide: 'one body going round another (Earth round the Sun, Moon round Earth, electron round the nucleus, satellite). items: [centre, the moving body, optional pull label ("Gravity"), optional motion label ("Moves forward")]. Steps: 1 the body starts orbiting with a trail, 2 the pull arrow towards the centre, 3 the forward-motion arrow.',
  },
  wave: {
    items: [3, 4], steps: n => n,
    guide: 'a wave travelling (sound, light, water ripples, vibration). items: [source, "wavelength" label, "amplitude" label, optional receiver (ear, eye)]. Steps: 1 the wave travels out of the source, 2 the wavelength marker, 3 the amplitude marker, 4 the receiver reacts.',
  },
  flow: {
    items: [3, 5], steps: n => n,
    guide: 'something flowing round a loop through parts (electric current in a circuit, blood through heart, lungs and body, water in a pipe system). items: the parts in flow order. Steps: step k lights up part k while dots keep flowing round the loop.',
  },
  cycle: {
    items: [3, 6], steps: n => n,
    guide: 'stages that repeat forever (water cycle, life cycle of a butterfly, day and night, rock cycle). items: the stages in order. Steps: step k adds stage k; a glowing dot keeps travelling round.',
  },
  particles: {
    items: [2, 3], steps: n => n,
    guide: 'particles of matter moving (solid, liquid, gas; melting and boiling; heating makes particles move faster; diffusion). items: the states in order, e.g. [Solid, Liquid, Gas]. Steps: step k shows the particles of state k (vibrating in place, sliding past each other, flying freely) while a flame heats the box.',
  },
  reaction: {
    items: [3, 4], steps: () => 2,
    guide: 'things combining into something new (chemical reaction, photosynthesis inputs to outputs, acid + base). items: [reactant 1, reactant 2, product 1, optional product 2]. Steps: 1 the reactants move together, 2 they collide and the products appear.',
  },
  fall: {
    items: [2, 4], steps: n => n - 1,
    guide: 'something falling or speeding up under gravity (free fall, an apple falling, acceleration). items: [falling object, ground label, optional force label ("Gravity"), optional "speed increases" label]. Steps: 1 it falls again and again, 2 the gravity arrow, 3 snapshots at equal times that get further apart.',
  },
  split: {
    items: [3, 7], steps: () => 2,
    guide: 'one thing splitting into several (white light into colours, a cell dividing, a big idea into its types). items: [the input, then each output]. Steps: 1 the input bursts into the outputs, 2 the outputs glow with their labels.',
  },
  zoom: {
    items: [2, 5], steps: n => n - 1,
    guide: 'zooming into smaller and smaller parts (tree → leaf → cell → chloroplast; body → organ → tissue → cell; matter → molecule → atom). items: the levels from biggest to smallest. Steps: step k zooms into level k.',
  },
};

export const MOTION_KIND_LIST = Object.keys(MOTION_KINDS) as MotionKind[];

export function motionSteps(m: SceneMotion): number {
  return MOTION_KINDS[m.kind].steps(m.items.length);
}

/** Step to show while `sentence` (0-based) of `count` is spoken; the last sentence shows all. */
export function motionBeat(m: SceneMotion, sentence: number, count: number): number {
  const steps = motionSteps(m);
  if (sentence < 0) return 0;
  if (sentence >= count - 1) return steps;
  return Math.min(steps, sentence);
}

const str = (v: unknown, max: number) => (typeof v === 'string' ? v.trim().slice(0, max) : '');

/** A valid motion spec, or null (unknown kind, too few items). */
export function parseMotion(value: unknown): SceneMotion | null {
  if (!value || typeof value !== 'object') return null;
  const o = value as Record<string, unknown>;
  const kind = str(o.kind, 20) as MotionKind;
  const info = MOTION_KINDS[kind];
  if (!info) return null;
  const items = (Array.isArray(o.items) ? o.items : [])
    .map(x => {
      const i = x && typeof x === 'object' ? (x as Record<string, unknown>) : {};
      return { emoji: str(i.emoji, 16), label: str(i.label, 60) };
    })
    .filter(i => i.emoji || i.label)
    .slice(0, info.items[1]);
  if (items.length < info.items[0]) return null;
  const motion: SceneMotion = { kind, items };
  if (kind === 'force-pair' && o.axis === 'y') motion.axis = 'y';
  return motion;
}

/** The template list for the outline/scene prompts. */
export function motionGuide(): string {
  return MOTION_KIND_LIST.map(k => `- "${k}": ${MOTION_KINDS[k].guide}`).join('\n');
}
