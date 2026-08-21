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
    <div className="flex-1">
      <div className="font-(family-name:--font-mono) text-[0.7rem] tracking-wider text-[var(--text-muted)] uppercase">
        {label}
      </div>
      <div
        className="mt-1 font-(family-name:--font-display) text-2xl font-semibold tabular-nums sm:text-3xl"
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

        return (
          <div className="mx-auto w-full max-w-3xl px-6">
            <div className="mb-6 flex items-baseline gap-3">
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
                counterexample {attack.counterexample}
              </span>
            </div>

            {/* the two running counters */}
            <div className="flex gap-8 border-y border-border py-5">
              <Counter
                label={attack.counters.attacker}
                value={formatFor(id, counterValue(attackerValues, position))}
                token={LEDGER_TOKENS.credit}
                moved={attackerValues[position.index] !== attackerValues[0]}
              />
              <Counter
                label={attack.counters.target}
                value={formatFor(id, counterValue(targetValues, position))}
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
                      }}
                    />
                  ))}
                </div>

                <div className="relative mt-8 h-40">
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
                        <span className="font-(family-name:--font-mono) text-xs tracking-wider text-[var(--text-muted)] uppercase">
                          {b.day}
                        </span>
                        {b.loop && (
                          <span className="font-(family-name:--font-mono) text-xs text-[var(--ach-provisional)]">
                            ↻ and again
                          </span>
                        )}
                      </div>
                      <p className="mt-3 text-lg leading-relaxed text-foreground">
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

                {/* live region so the beat text reaches a screen reader too */}
                <p className="sr-only" aria-live="polite">
                  {beat.day}. {beat.text} {ledgerLabel(beat.effect)}.
                </p>
              </>
            )}
          </div>
        );
      }}
    </StickyScene>
  );
}
