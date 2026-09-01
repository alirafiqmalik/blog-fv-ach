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
import type { AttackBeat, AttackId } from "../data/attacks.ts";

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
    <div className="flex-1 rounded-2xl border border-border bg-[var(--background)] px-5 py-4">
      <div className="font-(family-name:--font-mono) text-[0.65rem] tracking-[0.16em] text-[var(--text-muted)] uppercase">
        {label}
      </div>
      <div
        className="mt-2 font-(family-name:--font-display) text-3xl font-semibold tracking-tight tabular-nums sm:text-4xl"
        style={{ color: moved ? token : "var(--foreground)" }}
      >
        {value}
      </div>
    </div>
  );
}

function BeatVisual({
  beat,
  attackerLabel,
  targetLabel,
  attackerValue,
  targetValue,
  attackerToken,
}: {
  beat: AttackBeat;
  attackerLabel: string;
  targetLabel: string;
  attackerValue: string;
  targetValue: string;
  attackerToken: string;
}) {
  const credit = beat.effect === "credit";
  const debit = beat.effect === "debit";
  const token = ledgerToken(beat.effect);

  return (
    <div className="mt-6 grid grid-cols-[1fr_auto_1fr] items-center gap-3 sm:gap-5">
      <div
        className="rounded-xl border px-4 py-3"
        style={{
          borderColor: credit ? attackerToken : "var(--border)",
        }}
      >
        <div className="truncate font-(family-name:--font-mono) text-[0.6rem] tracking-wider text-[var(--text-muted)] uppercase">
          {attackerLabel}
        </div>
        <div
          className="mt-1 font-(family-name:--font-display) text-lg font-semibold tabular-nums sm:text-xl"
          style={{ color: credit ? attackerToken : "var(--foreground)" }}
        >
          {attackerValue}
        </div>
      </div>

      <svg viewBox="0 0 88 48" className="h-12 w-16 sm:h-14 sm:w-20" aria-hidden="true">
        <line
          x1="8"
          y1="24"
          x2="80"
          y2="24"
          stroke={token}
          strokeWidth="1.6"
          strokeDasharray={debit ? "4 3" : "0"}
          opacity={beat.effect === "neutral" ? 0.35 : 1}
        />
        {debit && (
          <line
            x1="80"
            y1="8"
            x2="80"
            y2="40"
            stroke={LEDGER_TOKENS.debit}
            strokeWidth="2.4"
          />
        )}
        <circle
          cx={debit ? 64 : credit ? 72 : 44}
          cy="24"
          r="5"
          fill="var(--background)"
          stroke={token}
          strokeWidth="1.5"
        />
      </svg>

      <div className="rounded-xl border border-border px-4 py-3">
        <div className="truncate font-(family-name:--font-mono) text-[0.6rem] tracking-wider text-[var(--text-muted)] uppercase">
          {targetLabel}
        </div>
        <div className="mt-1 font-(family-name:--font-display) text-lg font-semibold tabular-nums text-[var(--text-muted)] sm:text-xl">
          {targetValue}
        </div>
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

            <div className="scene-stage px-4 py-6 sm:px-8 sm:py-8">
              {/* the two running counters */}
              <div className="flex flex-col gap-3 sm:flex-row sm:gap-5">
                <Counter
                  label={attack.counters.attacker}
                  value={attackerNow}
                  token={LEDGER_TOKENS.credit}
                  moved={attackerValues[position.index] !== attackerValues[0]}
                />
                <Counter
                  label={attack.counters.target}
                  value={targetNow}
                  token={LEDGER_TOKENS.rail}
                  moved={false}
                />
              </div>

              {!isStatic && (
                <BeatVisual
                  beat={beat}
                  attackerLabel={attack.counters.attacker}
                  targetLabel={attack.counters.target}
                  attackerValue={attackerNow}
                  targetValue={targetNow}
                  attackerToken={LEDGER_TOKENS.credit}
                />
              )}

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
