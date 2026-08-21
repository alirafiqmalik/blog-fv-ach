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

  return (
    <div className="not-prose my-10 rounded-lg border border-border bg-card p-5 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h3 className="font-(family-name:--font-display) text-base font-semibold text-foreground">
          A1, replayed
        </h3>
        <div
          className="inline-flex rounded-full border border-border p-0.5"
          role="group"
          aria-label="Replay A1 before or after remediation"
        >
          {[
            { key: false, label: "April 2025" },
            { key: true, label: "Today" },
          ].map((option) => (
            <button
              key={String(option.key)}
              type="button"
              onClick={() => setAfter(option.key)}
              aria-pressed={after === option.key}
              className="rounded-full px-4 py-1.5 font-(family-name:--font-mono) text-xs transition-colors"
              style={{
                background:
                  after === option.key ? "var(--accent)" : "transparent",
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

      <ol className="mt-6 space-y-3">
        {attack.beats.map((beat) => {
          const suppressed = after && !SURVIVES.has(beat.id);
          const effect = suppressed ? "neutral" : beat.effect;
          return (
            <li
              key={beat.id}
              className="flex gap-4"
              style={{ opacity: suppressed ? 0.3 : 1 }}
            >
              <span
                className="mt-2 h-2 w-2 shrink-0 rounded-full"
                style={{ background: ledgerToken(effect) }}
                aria-label={ledgerLabel(effect)}
              />
              <span className="min-w-0">
                <span className="font-(family-name:--font-mono) text-xs text-[var(--text-muted)]">
                  {beat.day}
                </span>
                <span className="mt-0.5 block text-sm text-[var(--text-secondary)]">
                  {suppressed ? (
                    <s>{beat.text}</s>
                  ) : (
                    beat.text
                  )}
                </span>
              </span>
            </li>
          );
        })}
      </ol>

      <div className="mt-6 border-t border-border pt-4">
        <span className="font-(family-name:--font-mono) text-[0.7rem] tracking-wider text-[var(--text-muted)] uppercase">
          Spendable at Bank A, at the end
        </span>
        <div
          className="mt-1 font-(family-name:--font-display) text-2xl font-semibold tabular-nums"
          style={{
            color: after ? LEDGER_TOKENS.rail : LEDGER_TOKENS.credit,
          }}
        >
          {formatDollars(after ? 1401 : 3401)}
        </div>
        <p className="mt-2 text-sm text-[var(--text-secondary)]">
          {after
            ? "The credit never posts, so there is nothing to spend and nothing to claw back. The sequence stops where the receiving bank's check now sits."
            : "Three cycles of $1,000, spendable days before the receiving bank was ever asked whether the debit was allowed."}
        </p>
      </div>
    </div>
  );
}
