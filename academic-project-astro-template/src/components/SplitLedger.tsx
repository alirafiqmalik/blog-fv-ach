/**
 * The thesis scene — "Credit without debit" (docs/storyboard.md §2).
 *
 * Two account cards. Scrolling ticks Bank A's available balance up by $1,000
 * while Bank B's balance does not move. That is the whole scene, and it is the
 * scene that teaches the title, so it stays under one screen of scroll and
 * grows no third column and no legend.
 *
 * The caption carries the point on its own. If the animation never runs — no
 * JavaScript, reduced motion, a narrow phone — the reader still sees two
 * balances that do not agree and the sentence that names why.
 */

import StickyScene from "./StickyScene.tsx";
import { counterValue, formatDollars, stepOpacity } from "./scroll-scene.ts";
import type { ScenePosition } from "./scroll-scene.ts";
import { LEDGER_TOKENS } from "./ledger-motion.ts";

/** The five beats, and the balances at each. */
const STEPS = [
  { note: "Two accounts, at two banks that do not talk to each other." },
  { note: "You ask Bank A to pull $1,000 out of the account at Bank B." },
  { note: "Bank A posts the credit. Your balance goes up." },
  { note: "Bank B never debits anything. Its balance has not moved." },
  { note: "Credit without debit." },
] as const;

const BANK_A = [1401, 1401, 2401, 2401, 2401];
const BANK_B = [1000, 1000, 1000, 1000, 1000];

function Card({
  bank,
  account,
  value,
  token,
  moved,
}: {
  bank: string;
  account: string;
  value: number;
  token: string;
  moved: boolean;
}) {
  return (
    <div
      className="flex-1 rounded-2xl border p-6 sm:p-8"
      style={{
        borderColor: moved ? token : "var(--border)",
        background: "var(--card)",
        boxShadow: moved ? `0 0 40px color-mix(in srgb, ${token} 18%, transparent)` : "none",
      }}
    >
      <div className="font-(family-name:--font-mono) text-xs tracking-[0.16em] text-[var(--text-muted)] uppercase">
        {bank}
      </div>
      <div className="mt-1 font-(family-name:--font-mono) text-xs text-[var(--text-muted)]">
        {account}
      </div>
      <div
        className="mt-8 font-(family-name:--font-display) text-4xl font-semibold tracking-tight tabular-nums sm:text-5xl"
        style={{ color: moved ? token : "var(--foreground)" }}
      >
        {formatDollars(value)}
      </div>
      <div
        className="mt-3 font-(family-name:--font-mono) text-xs tracking-wider uppercase"
        style={{ color: moved ? token : "var(--text-muted)" }}
      >
        {moved ? "available — and spendable" : "available"}
      </div>
    </div>
  );
}

export default function SplitLedger() {
  return (
    <StickyScene steps={STEPS.length} label="Credit without debit">
      {(position: ScenePosition, isStatic: boolean) => {
        const a = counterValue(BANK_A, position);
        const b = counterValue(BANK_B, position);
        const credited = position.index >= 2;
        const arrowShown = position.index >= 1;
        const refused = position.index >= 3;

        return (
          <div className="mx-auto w-full max-w-4xl px-4 sm:px-6">
            <div className="scene-stage px-4 py-8 sm:px-8 sm:py-10">
              <div className="flex flex-col items-stretch gap-5 sm:flex-row sm:items-center">
                <Card
                  bank="Bank A · yours"
                  account="checking ····9717"
                  value={a}
                  token={LEDGER_TOKENS.credit}
                  moved={credited}
                />

                <div
                  className="flex h-20 shrink-0 items-center justify-center sm:h-auto sm:w-36"
                  aria-hidden="true"
                >
                  <svg viewBox="0 0 120 72" className="h-20 w-32">
                    <line
                      x1="108"
                      y1="36"
                      x2="18"
                      y2="36"
                      stroke={refused ? LEDGER_TOKENS.debit : LEDGER_TOKENS.rail}
                      strokeWidth="1.8"
                      strokeDasharray="5 4"
                      opacity={arrowShown ? 1 : 0.22}
                    />
                    {refused && (
                      <>
                        <line
                          x1="14"
                          y1="16"
                          x2="14"
                          y2="56"
                          stroke={LEDGER_TOKENS.debit}
                          strokeWidth="3"
                        />
                        <circle
                          cx="14"
                          cy="36"
                          r="7"
                          fill="var(--background)"
                          stroke={LEDGER_TOKENS.debit}
                          strokeWidth="1.6"
                        />
                      </>
                    )}
                    <text
                      x="64"
                      y="24"
                      textAnchor="middle"
                      fontSize="11"
                      fill={refused ? LEDGER_TOKENS.debit : "var(--text-muted)"}
                      fontFamily="var(--font-mono)"
                    >
                      {refused ? "debit refused" : "debit $1,000"}
                    </text>
                  </svg>
                </div>

                <Card
                  bank="Bank B · theirs"
                  account="checking ····6788"
                  value={b}
                  token={LEDGER_TOKENS.rail}
                  moved={false}
                />
              </div>
            </div>

            {/* The caption. Static renders the whole list, so nothing that
                matters lives only inside the scrub. */}
            {isStatic ? (
              <ol className="mt-8 space-y-2 text-sm text-[var(--text-secondary)]">
                {STEPS.map((step, i) => (
                  <li key={step.note} className="flex gap-3">
                    <span className="font-(family-name:--font-mono) text-xs text-[var(--text-muted)]">
                      {i + 1}
                    </span>
                    <span
                      className={i === STEPS.length - 1 ? "text-foreground" : ""}
                    >
                      {step.note}
                    </span>
                  </li>
                ))}
              </ol>
            ) : (
              <div className="relative mt-10 h-20">
                {STEPS.map((step, i) => (
                  <p
                    key={step.note}
                    className="absolute inset-x-0 text-center text-lg text-[var(--text-secondary)]"
                    style={{ opacity: stepOpacity(i, position) }}
                  >
                    {i === STEPS.length - 1 ? (
                      <span className="font-(family-name:--font-display) text-3xl font-semibold tracking-tight text-foreground">
                        {step.note}
                      </span>
                    ) : (
                      step.note
                    )}
                  </p>
                ))}
              </div>
            )}
          </div>
        );
      }}
    </StickyScene>
  );
}
