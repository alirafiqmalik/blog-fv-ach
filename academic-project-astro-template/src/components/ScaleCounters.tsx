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

const COUNT_MS = 900;

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
    <div ref={ref} className="flex-1 border-t border-border pt-4">
      <div
        className="font-(family-name:--font-display) text-4xl leading-none font-semibold tabular-nums sm:text-5xl"
        style={{ color: LEDGER_TOKENS.accent }}
      >
        {figure.decimals > 0 ? value.toFixed(figure.decimals) : Math.round(value)}
        <span className="ml-2 text-lg font-normal sm:text-xl">{figure.suffix}</span>
      </div>
      <p className="mt-3 text-sm text-[var(--text-secondary)]">{figure.label}</p>
    </div>
  );
}

export default function ScaleCounters() {
  return (
    <div className="not-prose my-10 flex flex-col gap-8 sm:flex-row sm:gap-12">
      {SCALE.map((figure) => (
        <Counter key={figure.id} figure={figure} />
      ))}
    </div>
  );
}
