/**
 * The hero's scale counters (docs/storyboard.md §1).
 *
 * Two numbers, counted up once when they scroll into view, then left alone.
 * Both come from `src/data/paper.ts`, which is also where the note lives
 * explaining which numbers this site is *not* allowed to claim.
 *
 * The count-up is decoration. The finished value is what the server renders
 * and what reduced motion shows, so the figure is never trapped inside an
 * animation.
 */

import { useEffect, useRef, useState } from "react";
import { useInView, useReducedMotion } from "motion/react";

import { SCALE } from "../data/paper.ts";
import { LEDGER_TOKENS } from "./ledger-motion.ts";

const COUNT_MS = 1100;

function useCountUp(target: number, armed: boolean): number {
  const [value, setValue] = useState(target);

  useEffect(() => {
    if (!armed) return;
    let frame = 0;
    const start = performance.now();
    setValue(0);
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / COUNT_MS);
      // easeOutCubic — arrives decisively rather than creeping.
      setValue(target * (1 - Math.pow(1 - t, 3)));
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target, armed]);

  return value;
}

function Counter({ figure }: { figure: (typeof SCALE)[number] }) {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion() ?? false;
  const inView = useInView(ref, { once: true, amount: 0.6 });
  const value = useCountUp(figure.value, inView && !reduced);

  return (
    <div ref={ref} className="flex-1 rounded-2xl border border-border bg-card px-5 py-6 sm:px-7 sm:py-7">
      <div
        className="font-(family-name:--font-display) text-5xl leading-none font-semibold tracking-tight tabular-nums sm:text-6xl"
        style={{ color: LEDGER_TOKENS.accent }}
      >
        ${Math.round(value)}
        <span className="ml-1.5 text-lg font-normal text-[var(--text-muted)] sm:text-2xl">
          trillion
        </span>
      </div>
      <p className="mt-4 max-w-sm text-sm leading-relaxed text-[var(--text-secondary)]">
        {figure.label}
      </p>
    </div>
  );
}

export default function ScaleCounters() {
  return (
    <div className="not-prose my-12 flex flex-col gap-4 sm:flex-row sm:gap-5">
      {SCALE.map((figure) => (
        <Counter key={figure.id} figure={figure} />
      ))}
    </div>
  );
}
