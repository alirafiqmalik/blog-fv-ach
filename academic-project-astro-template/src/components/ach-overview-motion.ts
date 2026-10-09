/**
 * Motion for the ACH overview figure (docs/storyboard.md → Hero, Act I).
 *
 * Two things move: in the hero, the entry loops along the rail and the legs
 * light as it passes; in Act I, the same figure is scrubbed one step at a
 * time. Both are pure functions of a lane list here, so `node --test` can
 * assert the properties a headless machine cannot see:
 *
 *   - reduced motion arms no loop at all and shows the finished frame;
 *   - the loop ends on the finished frame too, so a reader who looks up at
 *     any moment sees a state that the Act I captions describe;
 *   - the backdrop never gets opaque enough to compete with the hero title.
 *
 * Only `x` and `opacity` are produced. Nothing here animates width, height,
 * margin or colour.
 */

import { heroLoop } from "./ledger-motion.ts";

/**
 * Opacity of the figure layer behind the hero masthead. The title and the
 * buttons sit on top of this layer, so it stays well under half: the figure
 * is the hero's background, not a competitor for the reader's eye.
 */
export const BACKDROP_OPACITY = 0.42;

/** The hard cap `test/ach-overview-motion.test.ts` holds the layer to. */
export const BACKDROP_OPACITY_MAX = 0.45;

/** An element that has not lit yet is ghosted, not hidden, so the figure's shape is legible from frame one. */
export const GHOST = 0.22;

export interface Keyframes<K extends string> {
  /** The animated values, one per keyframe. */
  values: number[];
  /** Keyframe times, 0 → 1, monotonic, same length as `values`. */
  times: number[];
  /** Which property the values drive. */
  property: K;
}

/**
 * The loop the hero token runs on. Null under reduced motion: the caller then
 * renders `finalFrame` and arms nothing. A slower loop would still be a loop.
 */
export function overviewLoop(reduced: boolean) {
  return heroLoop(reduced);
}

/**
 * When the token reaches lane `index`, as a fraction of the loop. Lanes are
 * evenly spaced and the token holds at the last lane for the final fifth of
 * the loop, so the finished frame is on screen long enough to read.
 */
export function arrivalTime(index: number, laneCount: number): number {
  if (laneCount < 2) throw new Error("a rail needs at least two lanes");
  if (index < 0 || index >= laneCount) throw new Error(`lane ${index} is off the rail`);
  const travel = 0.8;
  return (index / (laneCount - 1)) * travel;
}

/** The token's path: through every lane in order, then held at the last one. */
export function tokenKeyframes(lanes: readonly number[]): Keyframes<"x"> {
  if (lanes.length < 2) throw new Error("a rail needs at least two lanes");
  const values = [...lanes, lanes[lanes.length - 1]];
  const times = [...lanes.map((_, i) => arrivalTime(i, lanes.length)), 1];
  return { property: "x", values, times };
}

/**
 * Opacity of an element that lights when the token reaches lane `index`:
 * ghosted until just before arrival, then lit, and lit through the hold.
 */
export function litKeyframes(index: number, laneCount: number): Keyframes<"opacity"> {
  const at = arrivalTime(index, laneCount);
  const before = Math.max(0, at - 0.04);
  return { property: "opacity", values: [GHOST, GHOST, 1, 1], times: [0, before, at, 1] };
}

/** The finished frame: token at the last lane, everything lit. */
export function finalFrame(lanes: readonly number[]): { x: number; opacity: number } {
  if (lanes.length === 0) throw new Error("a rail needs at least one lane");
  return { x: lanes[lanes.length - 1], opacity: 1 };
}

/**
 * The transition for one scrubbed move in Act I: a short tween on the
 * transform, or nothing at all when motion is reduced or the scene is static.
 */
export function scrubTransition(still: boolean): { duration: number; ease?: "easeOut" } {
  return still ? { duration: 0 } : { duration: 0.32, ease: "easeOut" };
}
