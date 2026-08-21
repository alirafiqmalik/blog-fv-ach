/**
 * Scroll-scrubbed sticky scenes — the shared primitive under every set-piece
 * on this site (docs/storyboard.md → Non-negotiables).
 *
 * A scene is a tall outer track with a sticky inner viewport. Scrolling the
 * track scrubs the scene; it does not autoplay. Everything here is a pure
 * function of scroll progress precisely so `node --test` can assert the two
 * properties that matter and cannot be checked by looking at a headless
 * machine:
 *
 *   1. `prefers-reduced-motion` freezes the scene at its **final** keyframe —
 *      not a faster scrub, and never a blank first frame.
 *   2. Step 0 is showing before the reader has scrolled at all, and the last
 *      step is still showing when the track runs out. No dead frames at either
 *      end, which is what makes a sticky scene feel stuck rather than broken.
 *
 * The component's job is to own refs and hand the progress value in. It must
 * not re-derive any of the arithmetic below — `test/scroll-scene.test.ts`
 * fails if it does.
 */

/** Clamp to the unit interval. Scroll progress can overshoot on rubber-band. */
export function clamp01(value: number): number {
  if (Number.isNaN(value)) return 0;
  return Math.min(1, Math.max(0, value));
}

/** Where a scene is: which step is showing, and how far through it we are. */
export interface ScenePosition {
  /** Index into the step list. Always in [0, count - 1]. */
  index: number;
  /** Progress within the current step, 0 → 1. */
  local: number;
  /** Progress across the whole scene, 0 → 1. Useful for continuous elements. */
  overall: number;
}

/**
 * Map scroll progress onto a step.
 *
 * The track is divided evenly. `progress === 1` resolves to the *last* step
 * complete rather than to a nonexistent step `count`, which is the difference
 * between a scene that ends on its payoff and one that flashes empty as the
 * reader scrolls out.
 */
export function scenePosition(
  progress: number,
  count: number,
  reduced = false,
): ScenePosition {
  if (count <= 0) throw new Error("a scene needs at least one step");
  if (reduced) return { index: count - 1, local: 1, overall: 1 };

  const overall = clamp01(progress);
  const scaled = overall * count;
  const index = Math.min(count - 1, Math.floor(scaled));
  return { index, local: clamp01(scaled - index), overall };
}

/**
 * Height of the scroll track that scrubs a scene, as a CSS length.
 *
 * One viewport per step, plus one so the sticky viewport has somewhere to sit
 * still at the end before it releases. Under reduced motion the track collapses
 * to a single viewport: there is nothing to scrub, so making the reader scroll
 * past six empty screens would be a bug, not an accommodation.
 */
export function trackHeight(count: number, reduced = false): string {
  if (count <= 0) throw new Error("a scene needs at least one step");
  return reduced ? "100vh" : `${(count + 1) * 100}vh`;
}

/**
 * Opacity of step `step` when the scene is at `position`.
 *
 * Steps cross-fade over the first `FADE` of each step so a scrubbed scene
 * reads continuously rather than as a slideshow, and the outgoing step is
 * fully gone before the next is fully arrived.
 */
const FADE = 0.35;

export function stepOpacity(step: number, position: ScenePosition): number {
  if (step === position.index) {
    return position.local < FADE ? position.local / FADE : 1;
  }
  if (step === position.index - 1) {
    return position.local < FADE ? 1 - position.local / FADE : 0;
  }
  return 0;
}

/**
 * Whether a cumulative element (a posted credit, an open gap band) should be
 * drawn. Cumulative state latches: once the credit has posted at step 3 it
 * stays posted at step 4, because that is what the ledger did.
 */
export function isLatched(
  flags: readonly boolean[],
  position: ScenePosition,
): boolean {
  return flags.slice(0, position.index + 1).some(Boolean);
}

/**
 * Interpolate a running counter towards its value at the current step.
 *
 * Counters tween across the step boundary so a balance visibly *moves* rather
 * than cutting. Values are read from the step list, so the component never
 * holds a number of its own.
 */
export function counterValue(
  values: readonly number[],
  position: ScenePosition,
): number {
  if (values.length === 0) return 0;
  const from = values[Math.min(position.index, values.length - 1)];
  const to = values[Math.min(position.index + 1, values.length - 1)];
  // Only tween in the back half of a step, so the number settles and is
  // readable for most of the time the step is on screen.
  const t = position.local < 1 - FADE ? 0 : (position.local - (1 - FADE)) / FADE;
  return from + (to - from) * clamp01(t);
}

/** US dollars, no cents — every amount on this site is a whole dollar. */
export function formatDollars(value: number): string {
  return `$${Math.round(value).toLocaleString("en-US")}`;
}

/** US cents, for the micro-deposit counters, which are all under a dollar. */
export function formatCents(value: number): string {
  return `$${(Math.round(value) / 100).toFixed(2)}`;
}
