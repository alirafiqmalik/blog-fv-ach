/**
 * The before/after replay that closes the impact section (docs/storyboard.md §7).
 *
 * Replays A1's beats twice, side by side: as they ran in April 2025, and as they
 * run now. In "after", the credit step never posts — the sequence stops at the
 * routing check, which is precisely what "A1 was no longer reproducible" means
 * in terms the reader has already been taught.
 *
 * A toggle rather than a scrub: the comparison is the point, and a reader
 * flipping back and forth is doing exactly the right thing.
 */

import { useState } from "react";
import { motion, useReducedMotion } from "motion/react";

import { attackById } from "../data/attacks.ts";
import { LEDGER_TOKENS, ledgerLabel, ledgerToken } from "./ledger-motion.ts";
import { formatDollars } from "./scroll-scene.ts";

/**
 * Which beats survive remediation. The routing check still happens — the ODFI
 * still validates the entry — but nothing after the access-control check posts,
 * because the credit now waits for it.
 */
const SURVIVES = new Set(["link", "submit", "blocked"]);

export default function BeforeAfter() {
  const attack = attackById("a1");
  const [after, setAfter] = useState(false);
  const reduced = useReducedMotion() ?? false;

  return (
    <div className="not-prose scene-stage my-10 overflow-hidden p-5 sm:p-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <span className="font-(family-name:--font-mono) text-[0.65rem] tracking-[0.18em] text-[var(--text-muted)] uppercase">
            Replay
          </span>
          <h3 className="mt-1 font-(family-name:--font-display) text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
            A1, before and after
          </h3>
        </div>
        <div
          className="relative inline-flex rounded-full border border-border p-1"
          role="group"
          aria-label="Replay A1 before or after remediation"
        >
          <motion.span
            aria-hidden="true"
            className="absolute top-1 bottom-1 left-1 rounded-full"
            style={{
              width: "calc(50% - 0.25rem)",
              background: "var(--accent)",
            }}
            animate={{ x: after ? "100%" : "0%" }}
            transition={
              reduced
                ? { duration: 0 }
                : { duration: 0.28, ease: "easeOut" }
            }
          />
          {[
            { key: false, label: "April 2025" },
            { key: true, label: "Today" },
          ].map((option) => (
            <button
              key={String(option.key)}
              type="button"
              onClick={() => setAfter(option.key)}
              aria-pressed={after === option.key}
              className="relative z-10 min-w-28 rounded-full px-4 py-1.5 font-(family-name:--font-mono) text-xs tracking-wider uppercase"
              style={{
                color:
                  after === option.key
                    ? "var(--foreground)"
                    : "var(--text-muted)",
              }}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1.4fr_1fr] lg:items-start">
        <ol className="space-y-3">
          {attack.beats.map((beat, i) => {
            const suppressed = after && !SURVIVES.has(beat.id);
            const effect = suppressed ? "neutral" : beat.effect;
            return (
              <motion.li
                key={beat.id}
                className="flex gap-4"
                animate={{
                  opacity: suppressed ? 0.28 : 1,
                  filter: suppressed ? "grayscale(0.7)" : "grayscale(0)",
                }}
                transition={
                  reduced
                    ? { duration: 0 }
                    : { duration: 0.28, delay: i * 0.03, ease: "easeOut" }
                }
              >
                <span
                  className="mt-2 h-2 w-2 shrink-0 rounded-full"
                  style={{ background: ledgerToken(effect) }}
                  aria-label={ledgerLabel(effect)}
                />
                <span className="min-w-0">
                  <span className="font-(family-name:--font-mono) text-[0.65rem] tracking-wider text-[var(--text-muted)] uppercase">
                    {beat.day}
                  </span>
                  <span className="mt-0.5 block text-sm leading-relaxed text-[var(--text-secondary)]">
                    {suppressed ? <s>{beat.text}</s> : beat.text}
                  </span>
                </span>
              </motion.li>
            );
          })}
        </ol>

        <div className="rounded-2xl border border-border bg-[var(--background)] px-5 py-5 sm:px-6 sm:py-6">
          <span className="font-(family-name:--font-mono) text-[0.65rem] tracking-[0.16em] text-[var(--text-muted)] uppercase">
            Spendable at Bank A, at the end
          </span>
          <motion.div
            className="mt-3 font-(family-name:--font-display) text-4xl font-semibold tracking-tight tabular-nums sm:text-5xl"
            style={{
              color: after ? LEDGER_TOKENS.rail : LEDGER_TOKENS.credit,
            }}
            key={after ? "after" : "before"}
            initial={reduced ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={reduced ? { duration: 0 } : { duration: 0.32, ease: "easeOut" }}
          >
            {formatDollars(after ? 1401 : 3401)}
          </motion.div>
          <p className="mt-4 text-sm leading-relaxed text-[var(--text-secondary)]">
            {after
              ? "The credit never posts, so there is nothing to spend and nothing to claw back. The sequence stops where the receiving bank's check now sits."
              : "Three cycles of $1,000, spendable days before the receiving bank was ever asked whether the debit was allowed."}
          </p>
          <p
            className="mt-4 font-(family-name:--font-mono) text-[0.65rem] tracking-[0.16em] uppercase"
            style={{ color: after ? LEDGER_TOKENS.credit : LEDGER_TOKENS.debit }}
          >
            {after ? "No longer reproducible" : "As disclosed, April 2025"}
          </p>
        </div>
      </div>
    </div>
  );
}
