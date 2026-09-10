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
  const armed = inView || reduced;

  return (
    <div ref={ref} className="not-prose my-12">
      <div className="mb-5 flex items-baseline justify-between gap-4">
        <span className="font-(family-name:--font-mono) text-[0.65rem] tracking-[0.18em] text-[var(--text-muted)] uppercase">
          Scope
        </span>
        <span className="font-(family-name:--font-mono) text-[0.65rem] text-[var(--text-muted)]">
          728 pages → the consumer path
        </span>
      </div>

      <div className="flex flex-col items-center gap-0">
        {FUNNEL.map((stage, i) => (
          <div key={stage.id} className="flex w-full flex-col items-center">
            {i > 0 && (
              <motion.div
                aria-hidden="true"
                className="flex flex-col items-center py-1"
                variants={beatVariants(reduced, { y: 6 }, i * BEAT_DURATION * 0.6)}
                initial="hidden"
                animate={armed ? "visible" : "hidden"}
              >
                <span
                  className="block h-5 w-px origin-top"
                  style={{ background: LEDGER_TOKENS.accent, opacity: 0.55 }}
                />
              </motion.div>
            )}
            <motion.div
              variants={beatVariants(reduced, { y: 14 }, i * BEAT_DURATION * 0.6)}
              initial="hidden"
              animate={armed ? "visible" : "hidden"}
              className="w-full rounded-2xl border border-border bg-card px-5 py-5 shadow-[0_16px_48px_rgb(0_0_0_/_0.22)] sm:px-7 sm:py-6"
              style={{
                maxWidth: `${stage.width * 100}%`,
                minWidth: "min(100%, 20rem)",
              }}
            >
              <div className="flex items-baseline justify-between gap-3">
                <span
                  className="font-(family-name:--font-mono) text-[0.65rem] tracking-[0.16em] tabular-nums uppercase"
                  style={{ color: LEDGER_TOKENS.accent }}
                >
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span
                  className="h-px min-w-8 flex-1 origin-left"
                  style={{ background: "var(--border)" }}
                  aria-hidden="true"
                />
              </div>

              <h3 className="mt-3 font-(family-name:--font-display) text-lg font-semibold tracking-tight text-foreground sm:text-xl">
                {stage.headline}
              </h3>

              <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2">
                {stage.facts.map((fact) => (
                  <span key={fact.label} className="min-w-0">
                    <span
                      className="block font-(family-name:--font-display) text-2xl font-semibold tracking-tight tabular-nums sm:text-3xl"
                      style={{ color: LEDGER_TOKENS.accent }}
                    >
                      {fact.value}
                    </span>
                    <span className="mt-0.5 block font-(family-name:--font-mono) text-[0.65rem] tracking-wider text-[var(--text-muted)] uppercase">
                      {fact.label}
                    </span>
                  </span>
                ))}
              </div>

              <p className="mt-4 max-w-prose text-sm leading-relaxed text-[var(--text-secondary)]">
                {stage.detail}
              </p>
            </motion.div>
          </div>
        ))}
      </div>
    </div>
  );
}
