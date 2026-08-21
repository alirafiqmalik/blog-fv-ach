/**
 * The sticky scroll-scrubbed scene shell every set-piece on this site is built
 * on (docs/storyboard.md → Non-negotiables).
 *
 * A tall track holds a sticky viewport. Scrolling the track scrubs the scene.
 * All the arithmetic lives in `scroll-scene.ts` so it can be tested; this
 * component owns the refs, the reduced-motion branch, and the narrow-viewport
 * fallback, and nothing else.
 *
 * Three things it guarantees, in order of how easy they are to break:
 *
 *   - **The server renders the finished scene.** `progress` starts at 1, not 0,
 *     so a reader with no JavaScript gets the last keyframe rather than an
 *     empty first frame. Hydration is what *lowers* it to 0 and arms scrubbing.
 *   - **Reduced motion never scrubs.** The track collapses to one viewport and
 *     the scene is pinned to its final keyframe.
 *   - **Narrow viewports never scrub either.** Sticky horizontal scenes are
 *     miserable on a phone, so below the breakpoint the scene renders as its
 *     final keyframe in normal document flow and the captions stack beneath it.
 */

import { useEffect, useRef, useState } from "react";
import { useReducedMotion, useScroll, useMotionValueEvent } from "motion/react";

import { scenePosition, trackHeight } from "./scroll-scene.ts";
import type { ScenePosition } from "./scroll-scene.ts";

/** Below this width a scene is a static figure, not a scrubbed one. */
const SCRUB_MIN_WIDTH = 768;

export interface StickySceneProps {
  /** Number of steps the scene scrubs through. */
  steps: number;
  /** Accessible name for the figure region. */
  label: string;
  /** Draws the scene at a given position. */
  children: (position: ScenePosition, isStatic: boolean) => React.ReactNode;
  /** Extra classes on the sticky viewport. */
  className?: string;
}

/**
 * True when the scene should be drawn complete and still: reduced motion, a
 * narrow viewport, or the server / pre-hydration render.
 */
function useIsStatic(): boolean {
  const reduced = useReducedMotion() ?? false;
  // Starts true so SSR and the first client render agree, then narrows to the
  // real answer after mount. Getting this backwards produces a hydration
  // mismatch *and* a blank first paint.
  const [narrow, setNarrow] = useState(true);

  useEffect(() => {
    const query = window.matchMedia(`(min-width: ${SCRUB_MIN_WIDTH}px)`);
    const sync = () => setNarrow(!query.matches);
    sync();
    query.addEventListener("change", sync);
    return () => query.removeEventListener("change", sync);
  }, []);

  return reduced || narrow;
}

export default function StickyScene({
  steps,
  label,
  children,
  className = "",
}: StickySceneProps) {
  const track = useRef<HTMLDivElement>(null);
  const isStatic = useIsStatic();

  const { scrollYProgress } = useScroll({
    target: track,
    // Scrub from the moment the scene's top reaches the top of the viewport
    // until its bottom does — i.e. exactly while it is stuck.
    offset: ["start start", "end start"],
  });

  const [progress, setProgress] = useState(1);
  useMotionValueEvent(scrollYProgress, "change", (value) => {
    if (!isStatic) setProgress(value);
  });

  // Hand scrubbing over only once we know we are scrubbing. Until then the
  // finished keyframe stands.
  useEffect(() => {
    if (isStatic) setProgress(1);
    else setProgress(scrollYProgress.get());
  }, [isStatic, scrollYProgress]);

  const position = scenePosition(progress, steps, isStatic);

  return (
    <div
      ref={track}
      className="not-prose relative w-full"
      style={{ height: trackHeight(steps, isStatic) }}
    >
      <div
        className={`sticky top-0 flex min-h-[100svh] w-full flex-col justify-center py-16 ${className}`}
        role="figure"
        aria-label={label}
      >
        {children(position, isStatic)}
      </div>
    </div>
  );
}
