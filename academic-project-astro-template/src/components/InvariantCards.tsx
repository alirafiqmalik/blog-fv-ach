/**
 * The three invariant cards (docs/storyboard.md §4c and §8).
 *
 * Authored once, rendered twice. §4 introduces them as the properties being
 * checked; §8 snaps each remedy back onto the invariant it restores. The second
 * pass reads the same `src/data/invariants.ts`, so it cannot drift from the
 * first — which is the whole reason the finale rhymes instead of repeating.
 *
 * `variant`:
 *   - `"intro"`   — the three things that should always be true.
 *   - `"remedy"`  — the same card, with the remedies that restore it snapped
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
    strokeWidth: 1.6,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };
  return (
    <svg viewBox="0 0 32 32" className="h-9 w-9" aria-hidden="true">
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
    <div ref={ref} className="not-prose my-12 grid gap-5 sm:grid-cols-3">
      {INVARIANTS.map((inv, i) => {
        const remedies = REMEDIES.filter((r) => r.invariant === inv.id);
        const token =
          variant === "remedy" ? LEDGER_TOKENS.credit : LEDGER_TOKENS.accent;
        return (
          <motion.div
            key={inv.id}
            variants={beatVariants(reduced, { y: 16 }, i * BEAT_DURATION * 0.5)}
            initial="hidden"
            animate={inView || reduced ? "visible" : "hidden"}
            className="flex flex-col rounded-2xl border border-border bg-card p-5 shadow-[0_16px_48px_rgb(0_0_0_/_0.22)] sm:p-6"
          >
            <div className="flex items-center justify-between gap-3">
              <div
                className="flex h-14 w-14 items-center justify-center rounded-2xl border border-border"
                style={{
                  boxShadow: `0 0 24px color-mix(in srgb, ${token} 16%, transparent)`,
                }}
              >
                <Glyph icon={inv.icon} token={token} />
              </div>
              <span
                className="font-(family-name:--font-display) text-2xl font-semibold tracking-tight"
                style={{ color: token }}
              >
                {inv.symbol}
              </span>
            </div>

            <h3 className="mt-5 font-(family-name:--font-display) text-base font-semibold tracking-tight text-foreground sm:text-lg">
              {inv.name}
            </h3>

            <p className="mt-3 text-[0.95rem] leading-relaxed text-[var(--text-secondary)]">
              {inv.plain}
            </p>

            {variant === "intro" ? (
              <p className="mt-5 border-t border-border pt-4 font-(family-name:--font-mono) text-[0.65rem] tracking-[0.14em] text-[var(--text-muted)] uppercase">
                broken by{" "}
                <span style={{ color: LEDGER_TOKENS.debit }}>{inv.brokenBy}</span>
              </p>
            ) : (
              <ul className="mt-5 space-y-3 border-t border-border pt-4">
                {remedies.map((remedy) => (
                  <li key={remedy.id}>
                    <span
                      className="block text-xs font-semibold tracking-tight"
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
