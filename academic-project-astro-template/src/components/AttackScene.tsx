/**
 * The attack set-pieces (docs/storyboard.md §5).
 *
 * One component for all three attacks, deliberately: the storyboard asks for an
 * identical four-beat structure each time, and the cheapest way to guarantee
 * that is to make a fourth structure impossible to express. A1, A2 and A3 differ
 * only in the data they hand this component.
 *
 * The beats come from `src/data/attacks.ts`. Colour is chosen by
 * `ledgerToken(beat.effect)` and never from the prose, so a beat that says
 * "fails" but is tagged `credit` is a data bug rather than a silently wrong
 * green. `test/attacks.test.ts` holds that line.
 */

import StickyScene from "./StickyScene.tsx";
import { counterValue, formatCents, formatDollars, stepOpacity } from "./scroll-scene.ts";
import type { ScenePosition } from "./scroll-scene.ts";
import { LEDGER_TOKENS, ledgerLabel, ledgerToken } from "./ledger-motion.ts";
import { attackById } from "../data/attacks.ts";
import type { AttackId } from "../data/attacks.ts";

/** A2's counters are micro-deposits, which are cents, not dollars. */
function formatFor(id: AttackId, value: number): string {
  return id === "a2" ? formatCents(value) : formatDollars(value);
}

function Counter({
  label,
  value,
  token,
  moved,
}: {
  label: string;
  value: string;
  token: string;
  moved: boolean;
}) {
  return (
    <div className="flex-1 rounded-2xl border border-border bg-[var(--background)] px-5 py-5 sm:px-6 sm:py-6">
      <div className="font-(family-name:--font-mono) text-[0.65rem] tracking-[0.16em] text-[var(--text-muted)] uppercase">
        {label}
      </div>
      <div
        className="mt-3 font-(family-name:--font-display) text-4xl font-semibold tracking-tight tabular-nums sm:text-5xl"
        style={{ color: moved ? token : "var(--foreground)" }}
      >
        {value}
      </div>
    </div>
  );
}

export default function AttackScene({ attack: id }: { attack: AttackId }) {
  const attack = attackById(id);
  const beats = attack.beats;
  const attackerValues = beats.map((b) => b.attacker ?? 0);
  const targetValues = beats.map((b) => b.target ?? 0);

  return (
    <StickyScene
      steps={beats.length}
      label={`${attack.tag}: ${attack.name} — step by step`}
    >
      {(position: ScenePosition, isStatic: boolean) => {
        const beat = beats[position.index];
        const attackerNow = formatFor(id, counterValue(attackerValues, position));
        const targetNow = formatFor(id, counterValue(targetValues, position));

        return (
          <div className="mx-auto w-full max-w-3xl px-4 sm:px-6">
            <div className="mb-5 flex items-baseline gap-3">
              <span
                className="font-(family-name:--font-mono) text-sm font-semibold"
                style={{ color: LEDGER_TOKENS.accent }}
              >
                {attack.tag}
              </span>
              <span className="font-(family-name:--font-display) text-sm text-[var(--text-secondary)]">
                {attack.name}
              </span>
              <span className="ml-auto font-(family-name:--font-mono) text-xs text-[var(--text-muted)]">
                {isStatic
                  ? `counterexample ${attack.counterexample}`
                  : `${position.index + 1} / ${beats.length}`}
              </span>
            </div>

            <div className="scene-stage flex min-h-[min(38rem,72svh)] flex-col justify-center px-4 py-6 sm:px-8 sm:py-8">
              {/* the two running counters with the flow between them */}
              <div className="flex flex-col items-stretch gap-4 sm:flex-row sm:items-center sm:gap-5">
                <Counter
                  label={attack.counters.attacker}
                  value={attackerNow}
                  token={LEDGER_TOKENS.credit}
                  moved={attackerValues[position.index] !== attackerValues[0]}
                />
                {!isStatic && (
                  <svg
                    viewBox="0 0 88 48"
                    className="mx-auto h-12 w-16 shrink-0 sm:h-16 sm:w-24"
                    aria-hidden="true"
                  >
                    <line
                      x1="8"
                      y1="24"
                      x2="80"
                      y2="24"
                      stroke={ledgerToken(beat.effect)}
                      strokeWidth="1.8"
                      strokeDasharray={beat.effect === "debit" ? "4 3" : "0"}
                      opacity={beat.effect === "neutral" ? 0.35 : 1}
                    />
                    {beat.effect === "debit" && (
                      <line
                        x1="80"
                        y1="8"
                        x2="80"
                        y2="40"
                        stroke={LEDGER_TOKENS.debit}
                        strokeWidth="2.6"
                      />
                    )}
                    <circle
                      cx={
                        beat.effect === "debit"
                          ? 64
                          : beat.effect === "credit"
                            ? 72
                            : 44
                      }
                      cy="24"
                      r="6"
                      fill="var(--background)"
                      stroke={ledgerToken(beat.effect)}
                      strokeWidth="1.6"
                    />
                  </svg>
                )}
                <Counter
                  label={attack.counters.target}
                  value={targetNow}
                  token={LEDGER_TOKENS.rail}
                  moved={false}
                />
              </div>

              {/* the sequence, as a ladder of beats */}
              {isStatic ? (
                <ol className="mt-8 space-y-4">
                  {beats.map((b) => (
                    <li key={b.id} className="flex gap-4">
                      <span
                        className="mt-2 h-2 w-2 shrink-0 rounded-full"
                        style={{ background: ledgerToken(b.effect) }}
                        aria-label={ledgerLabel(b.effect)}
                      />
                      <span>
                        <span className="font-(family-name:--font-mono) text-xs text-[var(--text-muted)]">
                          {b.day}
                        </span>
                        <span className="mt-1 block text-sm text-[var(--text-secondary)]">
                          {b.text}
                        </span>
                        {b.stamp && (
                          <span
                            className="mt-2 inline-block border px-2 py-1 font-(family-name:--font-mono) text-xs"
                            style={{
                              color: LEDGER_TOKENS.debit,
                              borderColor: LEDGER_TOKENS.debit,
                            }}
                          >
                            {b.stamp}
                          </span>
                        )}
                      </span>
                    </li>
                  ))}
                </ol>
              ) : (
                <>
                  {/* the beat rail: every beat visible, the current one lit */}
                  <div className="mt-8 flex gap-1.5" aria-hidden="true">
                    {beats.map((b, i) => (
                      <span
                        key={b.id}
                        className="h-1 flex-1 rounded-full"
                        style={{
                          background:
                            i <= position.index
                              ? ledgerToken(b.effect)
                              : "var(--border)",
                          opacity: i === position.index ? 1 : 0.55,
                        }}
                      />
                    ))}
                  </div>

                  <div className="relative mt-8 min-h-36">
                    {beats.map((b, i) => (
                      <div
                        key={b.id}
                        className="absolute inset-x-0"
                        style={{ opacity: stepOpacity(i, position) }}
                      >
                        <div className="flex items-center gap-3">
                          <span
                            className="h-2 w-2 rounded-full"
                            style={{ background: ledgerToken(b.effect) }}
                          />
                          <span className="font-(family-name:--font-mono) text-xs tracking-[0.16em] text-[var(--text-muted)] uppercase">
                            {b.day}
                          </span>
                          {b.loop && (
                            <span className="font-(family-name:--font-mono) text-xs text-[var(--ach-provisional)]">
                              ↻ and again
                            </span>
                          )}
                        </div>
                        <p className="mt-3 text-xl leading-snug text-foreground sm:text-2xl">
                          {b.text}
                        </p>
                        {b.stamp && (
                          <span
                            className="mt-4 inline-block border px-3 py-1.5 font-(family-name:--font-mono) text-sm"
                            style={{
                              color: LEDGER_TOKENS.debit,
                              borderColor: LEDGER_TOKENS.debit,
                            }}
                          >
                            {b.stamp}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* live region so the beat text reaches a screen reader too */}
            {!isStatic && (
              <p className="sr-only" aria-live="polite">
                {beat.day}. {beat.text} {ledgerLabel(beat.effect)}.
              </p>
            )}
          </div>
        );
      }}
    </StickyScene>
  );
}
