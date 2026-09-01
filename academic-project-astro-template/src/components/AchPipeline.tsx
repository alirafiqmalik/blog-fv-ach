/**
 * The five-day life of a transfer — the main scrollytelling set-piece
 * (docs/storyboard.md §3), and the spine the rest of the site rhymes with.
 *
 * A sticky horizontal pipeline: Originator → ODFI → ACH Operator → RDFI →
 * Receiver. Scrolling scrubs a payment token along it while the day counter
 * advances, the provisional credit posts green, the debit arrow behind it stays
 * grey, and the shaded **gap band** opens between the two.
 *
 * The steps, the participants and the captions all come from
 * `src/data/ach-pipeline.ts`. This component owns geometry and nothing else —
 * `test/ach-pipeline.test.ts` fails if it names a step, a day or a caption of
 * its own, because A3 and the remedies finale replay this same track and a
 * second copy of the timeline is exactly how they would drift apart.
 *
 * `mode` is a variant, not a second diagram:
 *   - `"story"`  — §3, the full scrub with captions.
 *   - `"closed"` — §8's finale, where the gap band closes as the reader scrolls.
 */

import StickyScene from "./StickyScene.tsx";
import { PARTICIPANTS, PIPELINE_STEPS } from "../data/ach-pipeline.ts";
import { isLatched, stepOpacity } from "./scroll-scene.ts";
import type { ScenePosition } from "./scroll-scene.ts";
import { LEDGER_TOKENS } from "./ledger-motion.ts";

export type PipelineMode = "story" | "closed";

/** Horizontal position of each participant, as a percentage of the track. */
const LANE_X = [8, 29, 50, 71, 92];

const GAP_FLAGS = PIPELINE_STEPS.map((s) => Boolean(s.gap));
const CREDIT_FLAGS = PIPELINE_STEPS.map((s) => Boolean(s.credited));
const CHECK_FLAGS = PIPELINE_STEPS.map((s) => Boolean(s.checked));

function laneOf(participantId: string): number {
  const index = PARTICIPANTS.findIndex((p) => p.id === participantId);
  return LANE_X[index === -1 ? 0 : index];
}

export default function AchPipeline({
  mode = "story",
}: {
  mode?: PipelineMode;
}) {
  const steps = PIPELINE_STEPS;

  return (
    <StickyScene
      steps={steps.length}
      label={
        mode === "closed"
          ? "The same five-day pipeline with the gap between provisional credit and settlement closed"
          : "The five-day life of an ACH transfer, from submission to the close of the return window"
      }
    >
      {(position: ScenePosition, isStatic: boolean) => {
        const step = steps[position.index];
        const gapOpen = mode === "closed" ? false : isLatched(GAP_FLAGS, position);
        const credited = isLatched(CREDIT_FLAGS, position);
        const checked = isLatched(CHECK_FLAGS, position);
        const tokenX = laneOf(step.at);
        // In the closed variant the credit only ever posts once the RDFI has
        // checked — which is the remedy, drawn.
        const creditPosted = mode === "closed" ? checked : credited;

        return (
          <div className="mx-auto w-full max-w-5xl px-4 sm:px-6">
            <div className="scene-stage px-4 py-6 sm:px-8 sm:py-8">
              {/* day counter */}
              <div className="mb-5 flex items-baseline justify-between gap-4">
                <span className="font-(family-name:--font-mono) text-sm tracking-[0.18em] text-[var(--ach-provisional)] uppercase">
                  {isStatic ? "Day 0 → Day 5" : step.day}
                </span>
                <span className="font-(family-name:--font-mono) text-xs text-[var(--text-muted)]">
                  {mode === "closed" ? "with the remedies applied" : "one ACH debit"}
                </span>
              </div>

              <svg
                viewBox="0 0 100 38"
                className="h-auto w-full"
                preserveAspectRatio="xMidYMid meet"
                aria-hidden="true"
              >
                {/* the gap band: provisional credit → settlement */}
                <rect
                  x={LANE_X[1]}
                  y="3"
                  width={LANE_X[4] - LANE_X[1]}
                  height="22"
                  fill={LEDGER_TOKENS.gap}
                  stroke={LEDGER_TOKENS.provisional}
                  strokeWidth="0.18"
                  strokeDasharray="1.5 1.5"
                  opacity={gapOpen ? 1 : 0}
                  style={{
                    transition: "opacity 240ms ease-out",
                    filter: gapOpen
                      ? "drop-shadow(0 0 1.2px var(--ach-provisional))"
                      : "none",
                  }}
                />
                {gapOpen && (
                  <text
                    x={(LANE_X[1] + LANE_X[4]) / 2}
                    y="7.2"
                    textAnchor="middle"
                    fontSize="2.2"
                    fill={LEDGER_TOKENS.provisional}
                    fontFamily="var(--font-mono)"
                    letterSpacing="0.14"
                  >
                    THE GAP — CREDITED, NOT SETTLED
                  </text>
                )}

                {/* the rail */}
                <line
                  x1={LANE_X[0]}
                  y1="16"
                  x2={LANE_X[4]}
                  y2="16"
                  stroke={LEDGER_TOKENS.rail}
                  strokeWidth="0.35"
                  opacity="0.55"
                />

                {/* the debit arrow, running the other way, behind everything */}
                <line
                  x1={LANE_X[3]}
                  y1="23.5"
                  x2={LANE_X[1]}
                  y2="23.5"
                  stroke={checked ? LEDGER_TOKENS.debit : LEDGER_TOKENS.rail}
                  strokeWidth="0.28"
                  strokeDasharray="1 0.8"
                  opacity={checked ? 0.95 : 0.32}
                />
                <text
                  x={(LANE_X[1] + LANE_X[3]) / 2}
                  y="27.2"
                  textAnchor="middle"
                  fontSize="2.1"
                  fill={checked ? LEDGER_TOKENS.debit : "var(--text-muted)"}
                  fontFamily="var(--font-mono)"
                >
                  {checked ? "debit attempted — R16" : "debit not yet attempted"}
                </text>

                {/* participants */}
                {PARTICIPANTS.map((p, i) => {
                  const active = p.id === step.at;
                  const token = active
                    ? LEDGER_TOKENS.accent
                    : LEDGER_TOKENS.rail;
                  return (
                    <g key={p.id}>
                      <circle
                        cx={LANE_X[i]}
                        cy="16"
                        r={active ? 2.6 : 1.7}
                        fill="var(--background)"
                        stroke={token}
                        strokeWidth="0.4"
                      />
                    </g>
                  );
                })}

                {/* the payment token — SVG user units, not CSS pixels */}
                <g transform={`translate(${tokenX} 16)`}>
                  <circle
                    r="1.35"
                    fill={
                      creditPosted
                        ? LEDGER_TOKENS.credit
                        : LEDGER_TOKENS.provisional
                    }
                  />
                </g>

                {/* the balance readout at the ODFI */}
                <text
                  x={LANE_X[1]}
                  y="12.2"
                  textAnchor="middle"
                  fontSize="2.4"
                  fill={creditPosted ? LEDGER_TOKENS.credit : "var(--text-muted)"}
                  fontFamily="var(--font-mono)"
                  fontWeight="600"
                >
                  {creditPosted ? "+$1,000 spendable" : "—"}
                </text>

                {/* the return window marker */}
                {step.returnWindow && (
                  <>
                    <line
                      x1={LANE_X[2]}
                      y1="32.4"
                      x2={LANE_X[4]}
                      y2="32.4"
                      stroke={LEDGER_TOKENS.provisional}
                      strokeWidth="0.3"
                    />
                    <text
                      x={(LANE_X[2] + LANE_X[4]) / 2}
                      y="36.2"
                      textAnchor="middle"
                      fontSize="2.05"
                      fill={LEDGER_TOKENS.provisional}
                      fontFamily="var(--font-mono)"
                    >
                      return window — settlement is this closing empty
                    </text>
                  </>
                )}
              </svg>

              {/* HTML labels so the five roles stay readable at any viewport */}
              <div className="mt-3 grid grid-cols-5 gap-1">
                {PARTICIPANTS.map((p) => {
                  const active = p.id === step.at;
                  return (
                    <div key={p.id} className="min-w-0 text-center">
                      <div
                        className="truncate font-(family-name:--font-display) text-[0.7rem] font-semibold sm:text-sm"
                        style={{
                          color: active
                            ? "var(--foreground)"
                            : "var(--text-muted)",
                        }}
                      >
                        {p.label}
                      </div>
                      <div className="truncate font-(family-name:--font-mono) text-[0.6rem] text-[var(--text-muted)] sm:text-xs">
                        {p.short}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* captions */}
            {isStatic ? (
              <ol className="mt-8 space-y-4">
                {steps.map((s) => (
                  <li key={s.id} className="flex gap-4">
                    <span className="w-16 shrink-0 pt-0.5 font-(family-name:--font-mono) text-xs text-[var(--ach-provisional)]">
                      {s.day}
                    </span>
                    <span>
                      <span className="block font-(family-name:--font-display) text-sm font-semibold text-foreground">
                        {s.title}
                      </span>
                      <span className="mt-1 block text-sm text-[var(--text-secondary)]">
                        {s.caption}
                      </span>
                    </span>
                  </li>
                ))}
              </ol>
            ) : (
              <div className="relative mt-10 min-h-28">
                {steps.map((s, i) => (
                  <div
                    key={s.id}
                    className="absolute inset-x-0 mx-auto max-w-2xl text-center"
                    style={{ opacity: stepOpacity(i, position) }}
                  >
                    <h3 className="font-(family-name:--font-display) text-2xl font-semibold tracking-tight text-foreground">
                      {s.title}
                    </h3>
                    <p className="mt-2 text-base leading-relaxed text-[var(--text-secondary)]">
                      {s.caption}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      }}
    </StickyScene>
  );
}
