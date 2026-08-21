/**
 * The three invariant cards (docs/storyboard.md §4c and §8).
 *
 * Authored once, rendered twice. §4 introduces them as the properties being
 * checked; §8 snaps each remedy back onto the invariant it restores. The second
 * pass reads the same `src/data/invariants.ts`, so it cannot drift from the
 * first — which is the whole reason the finale rhymes instead of repeating.
 *
 * `variant`:
 *   - `"intro"`   — §4. Symbol, plain-language line, formula.
 *   - `"remedy"`  — §8. The same card, with the remedies that restore it snapped
 *                   on underneath.
 */

import { useRef } from "react";
import { motion, useInView, useReducedMotion } from "motion/react";

import { INVARIANTS } from "../data/invariants.ts";
import { REMEDIES } from "../data/disclosure.ts";
import { BEAT_DURATION, LEDGER_TOKENS, beatVariants } from "./ledger-motion.ts";

/** The three glyphs, drawn rather than imported, so they share one stroke. */
function Glyph({ icon, token }: { icon: string; token: string }) {
  const common = {
    fill: "none",
    stroke: token,
    strokeWidth: 1.5,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };
  return (
    <svg viewBox="0 0 32 32" className="h-8 w-8" aria-hidden="true">
      {icon === "shield" && (
        <>
          <path d="M16 3 L27 8 v9 c0 6-5 10-11 12 C10 27 5 23 5 17 V8 Z" {...common} />
          <path d="M11 16 l3.5 3.5 L21 12" {...common} />
        </>
      )}
      {icon === "scale" && (
        <>
          <path d="M16 5 v22 M7 27 h18 M6 11 h20 M16 8 v3" {...common} />
          <path d="M6 11 L2 20 a4.5 4.5 0 0 0 8 0 Z" {...common} />
          <path d="M26 11 L22 20 a4.5 4.5 0 0 0 8 0 Z" {...common} />
        </>
      )}
      {icon === "lock" && (
        <>
          <rect x="7" y="14" width="18" height="14" rx="2" {...common} />
          <path d="M11 14 v-4 a5 5 0 0 1 10 0 v4" {...common} />
          <circle cx="16" cy="21" r="1.6" {...common} />
        </>
      )}
    </svg>
  );
}

export default function InvariantCards({
  variant = "intro",
}: {
  variant?: "intro" | "remedy";
}) {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion() ?? false;
  const inView = useInView(ref, { once: true, amount: 0.2 });

  return (
    <div ref={ref} className="not-prose my-10 grid gap-4 sm:grid-cols-3">
      {INVARIANTS.map((inv, i) => {
        const remedies = REMEDIES.filter((r) => r.invariant === inv.id);
        return (
          <motion.div
            key={inv.id}
            variants={beatVariants(reduced, { y: 14 }, i * BEAT_DURATION * 0.5)}
            initial="hidden"
            animate={inView || reduced ? "visible" : "hidden"}
            className="flex flex-col rounded-lg border border-border bg-card p-5"
          >
            <Glyph icon={inv.icon} token={LEDGER_TOKENS.accent} />

            <div className="mt-4 flex items-baseline gap-2">
              <span
                className="font-(family-name:--font-mono) text-sm font-semibold"
                style={{ color: LEDGER_TOKENS.accent }}
              >
                {inv.symbol}
              </span>
              <h3 className="font-(family-name:--font-display) text-sm font-semibold text-foreground">
                {inv.name}
              </h3>
            </div>

            <p className="mt-3 text-sm leading-relaxed text-[var(--text-secondary)]">
              {inv.plain}
            </p>

            <code className="mt-4 block overflow-x-auto rounded border border-border bg-[#1f1f1f] px-2.5 py-2 font-(family-name:--font-mono) text-[0.68rem] leading-relaxed whitespace-pre text-[#c9c9c9]">
              {inv.formal}
            </code>

            {variant === "intro" ? (
              <p className="mt-4 border-t border-border pt-3 font-(family-name:--font-mono) text-xs text-[var(--text-muted)]">
                broken by{" "}
                <span style={{ color: LEDGER_TOKENS.debit }}>{inv.brokenBy}</span>
              </p>
            ) : (
              <ul className="mt-4 space-y-3 border-t border-border pt-3">
                {remedies.map((remedy) => (
                  <li key={remedy.id}>
                    <span
                      className="block text-xs font-semibold"
                      style={{ color: LEDGER_TOKENS.credit }}
                    >
                      {remedy.title}
                    </span>
                    <span className="mt-1 block text-xs leading-relaxed text-[var(--text-secondary)]">
                      {remedy.text}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </motion.div>
        );
      })}
    </div>
  );
}
