/**
 * The rules funnel (docs/storyboard.md §4a): 728 pages → the consumer path →
 * five participant state machines.
 *
 * Three stages, each narrower than the last. Not scrubbed — it is a figure, and
 * a figure that made the reader scroll three screens to read three lines would
 * be spending the reader's attention on nothing. It fades its stages in as it
 * enters view, once, and is complete before and after.
 */

import { useRef } from "react";
import { motion, useInView, useReducedMotion } from "motion/react";

import { FUNNEL } from "../data/method.ts";
import { BEAT_DURATION, LEDGER_TOKENS, beatVariants } from "./ledger-motion.ts";

export default function RulesFunnel() {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion() ?? false;
  const inView = useInView(ref, { once: true, amount: 0.25 });

  return (
    <div ref={ref} className="not-prose my-10 space-y-3">
      {FUNNEL.map((stage, i) => (
        <motion.div
          key={stage.id}
          variants={beatVariants(reduced, { y: 12 }, i * BEAT_DURATION * 0.6)}
          initial="hidden"
          animate={inView || reduced ? "visible" : "hidden"}
          className="mx-auto rounded-lg border border-border bg-card p-5 sm:p-6"
          style={{ width: `${stage.width * 100}%`, minWidth: "min(100%, 18rem)" }}
        >
          <div className="flex flex-wrap items-baseline gap-x-6 gap-y-2">
            <h3 className="font-(family-name:--font-display) text-base font-semibold text-foreground">
              {stage.headline}
            </h3>
            <div className="flex flex-wrap gap-x-5 gap-y-1">
              {stage.facts.map((fact) => (
                <span key={fact.label} className="whitespace-nowrap">
                  <span
                    className="font-(family-name:--font-mono) text-sm font-semibold tabular-nums"
                    style={{ color: LEDGER_TOKENS.accent }}
                  >
                    {fact.value}
                  </span>
                  <span className="ml-1.5 text-xs text-[var(--text-muted)]">
                    {fact.label}
                  </span>
                </span>
              ))}
            </div>
          </div>
          <p className="mt-3 text-sm leading-relaxed text-[var(--text-secondary)]">
            {stage.detail}
          </p>
        </motion.div>
      ))}
    </div>
  );
}
