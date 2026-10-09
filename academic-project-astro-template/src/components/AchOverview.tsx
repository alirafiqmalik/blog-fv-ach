/**
 * The ACH overview figure (docs/storyboard.md → "The recurring motif").
 *
 * Five parties in a row — you, your bank (the ODFI), the rails (the ACH
 * Operator), their bank (the RDFI), them (the Receiver) — with the entry
 * travelling forward along the top and the two money legs underneath: the
 * credit leg at your bank, the debit leg at their bank, and the gap between
 * them. It sits under the hero title and comes back in Act I, walked step by
 * step, which is why it is one component with a `mode` rather than two
 * drawings.
 *
 * Everything it says comes from `src/data/ach-pipeline.ts`: the participants,
 * the two legs, and (in `walk` mode) the step captions. The component owns
 * geometry and nothing else — `test/ach-pipeline.test.ts` fails if it names a
 * step, a day or a caption of its own.
 *
 * Version 1 renders it still, at its final state. Later versions animate the
 * entry along the rail; the still is what reduced motion and the server show.
 */

import { LEGS, PARTICIPANTS, PIPELINE_STEPS, stepOf } from "../data/ach-pipeline.ts";
import type { ParticipantId } from "../data/ach-pipeline.ts";
import { LEDGER_TOKENS, ledgerToken } from "./ledger-motion.ts";

export type OverviewMode = "hero" | "walk";

/** Horizontal position of each participant, as a percentage of the track. */
const LANE_X = [8, 29, 50, 71, 92];

/** The SVG viewBox. Overlay percentages are computed against this. */
const VIEW_W = 100;
const VIEW_H = 30;

/** Vertical centre of the instruction rail. */
const RAIL_Y = 8;

function laneOf(participantId: ParticipantId): number {
  const index = PARTICIPANTS.findIndex((p) => p.id === participantId);
  return LANE_X[index === -1 ? 0 : index];
}

/** A stylised party on the rail: a person, a bank, or the operator. */
function Node({
  x,
  kind,
  token,
}: {
  x: number;
  kind: "person" | "bank" | "operator";
  token: string;
}) {
  const common = {
    fill: "none",
    stroke: token,
    strokeWidth: 0.42,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };
  if (kind === "person") {
    return (
      <g transform={`translate(${x} ${RAIL_Y})`}>
        <circle cy="-1.6" r="1.35" {...common} />
        <path d="M -2.9 2.6 a 2.9 2.9 0 0 1 5.8 0" {...common} />
      </g>
    );
  }
  if (kind === "operator") {
    return (
      <g transform={`translate(${x} ${RAIL_Y})`}>
        <circle r="3.1" {...common} />
        <text
          y="1.15"
          textAnchor="middle"
          fontSize="3.2"
          fontWeight="600"
          fill={token}
          fontFamily="var(--font-mono)"
        >
          $
        </text>
      </g>
    );
  }
  return (
    <g transform={`translate(${x} ${RAIL_Y})`}>
      <path d="M -3.6 -1.2 L 0 -3.6 L 3.6 -1.2 Z" {...common} />
      {[-2.3, 0, 2.3].map((cx) => (
        <line key={cx} x1={cx} y1="-1.2" x2={cx} y2="2.4" {...common} />
      ))}
      <line x1="-3.8" y1="2.8" x2="3.8" y2="2.8" {...common} />
    </g>
  );
}

const KINDS: Record<ParticipantId, "person" | "bank" | "operator"> = {
  originator: "person",
  odfi: "bank",
  operator: "operator",
  rdfi: "bank",
  receiver: "person",
};

function pct(x: number, y: number): { left: string; top: string } {
  return { left: `${(x / VIEW_W) * 100}%`, top: `${(y / VIEW_H) * 100}%` };
}

export default function AchOverview({ mode = "hero" }: { mode?: OverviewMode }) {
  const markerId = `ach-overview-arrow-${mode}`;
  const creditX = laneOf(LEGS[0].at);
  const debitX = laneOf(LEGS[1].at);

  return (
    <figure
      className="not-prose mx-auto my-0 w-full max-w-4xl"
      role="figure"
      aria-label={
        mode === "walk"
          ? "The five parties to an ACH transfer, walked step by step from submission to the close of the return window"
          : "The five parties to an ACH transfer: the credit posts at your bank on day one, the debit is first checked at their bank on day three, and the gap between them is where the attacks live"
      }
    >
      {/* `.scene-stage` is unlayered CSS, so its sticky-scene minimum height
          outranks a utility class; the figure is not a scrubbed scene and
          takes only the height it draws. */}
      <div
        className="scene-stage px-4 pt-5 pb-4 sm:px-8 sm:pt-7 sm:pb-6"
        style={{ minHeight: "auto" }}
      >
        <div className="mb-4 flex items-baseline justify-between gap-4">
          <span className="font-(family-name:--font-mono) text-[0.65rem] tracking-[0.18em] text-[var(--text-muted)] uppercase">
            {mode === "walk" ? "One transfer, step by step" : "How an ACH debit moves"}
          </span>
          <span className="font-(family-name:--font-mono) text-[0.65rem] tracking-wider text-[var(--text-muted)]">
            five parties · up to five banking days
          </span>
        </div>

        <div className="relative">
          <svg
            viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
            className="h-auto w-full"
            preserveAspectRatio="xMidYMid meet"
            aria-hidden="true"
          >
            <defs>
              <marker
                id={markerId}
                viewBox="0 0 6 6"
                refX="5"
                refY="3"
                markerWidth="3"
                markerHeight="3"
                orient="auto"
              >
                <path d="M 0 0 L 6 3 L 0 6 Z" fill={LEDGER_TOKENS.rail} />
              </marker>
            </defs>

            {/* the gap band: credit leg → debit leg */}
            <rect
              x={creditX}
              y={RAIL_Y + 6}
              width={debitX - creditX}
              height="14"
              fill={LEDGER_TOKENS.gap}
              stroke={LEDGER_TOKENS.provisional}
              strokeWidth="0.18"
              strokeDasharray="1.5 1.5"
            />

            {/* the instruction rail, hop by hop */}
            {PARTICIPANTS.slice(0, -1).map((p, i) => (
              <line
                key={p.id}
                x1={LANE_X[i] + 4.6}
                y1={RAIL_Y}
                x2={LANE_X[i + 1] - 4.8}
                y2={RAIL_Y}
                stroke={LEDGER_TOKENS.rail}
                strokeWidth="0.3"
                opacity="0.7"
                markerEnd={`url(#${markerId})`}
              />
            ))}

            {/* the two legs drop from their party into the band */}
            {LEGS.map((leg) => {
              const x = laneOf(leg.at);
              const token = ledgerToken(leg.effect);
              return (
                <g key={leg.id}>
                  <line
                    x1={x}
                    y1={RAIL_Y + 3.4}
                    x2={x}
                    y2={RAIL_Y + 8.6}
                    stroke={token}
                    strokeWidth="0.32"
                    strokeDasharray={leg.effect === "credit" ? undefined : "0.9 0.7"}
                  />
                  <circle
                    cx={x}
                    cy={RAIL_Y + 9.4}
                    r="0.9"
                    fill={leg.effect === "credit" ? token : "var(--background)"}
                    stroke={token}
                    strokeWidth="0.32"
                  />
                </g>
              );
            })}

            {/* the parties */}
            {PARTICIPANTS.map((p, i) => (
              <Node
                key={p.id}
                x={LANE_X[i]}
                kind={KINDS[p.id]}
                token={LEDGER_TOKENS.rail}
              />
            ))}
          </svg>

          {/* leg pills, laid over the band at their lane; stacked below `sm` */}
          {LEGS.map((leg) => {
            const step = stepOf(leg);
            const token = ledgerToken(leg.effect);
            return (
              <div
                key={leg.id}
                className="absolute hidden w-[30%] -translate-x-1/2 sm:block"
                style={pct(laneOf(leg.at), RAIL_Y + 11)}
              >
                <div
                  className="rounded-lg border bg-[var(--background)] px-2.5 py-1.5 text-center"
                  style={{ borderColor: token }}
                >
                  <div
                    className="font-(family-name:--font-mono) text-[0.6rem] tracking-[0.14em] uppercase"
                    style={{ color: token }}
                  >
                    {leg.label} · {step.day}
                  </div>
                  <div className="mt-0.5 text-[0.7rem] leading-snug text-[var(--text-secondary)]">
                    {leg.note}
                  </div>
                </div>
              </div>
            );
          })}
          <span
            className="absolute hidden -translate-x-1/2 font-(family-name:--font-mono) text-[0.6rem] tracking-[0.14em] uppercase sm:block"
            style={{ ...pct((creditX + debitX) / 2, RAIL_Y + 17.2), color: LEDGER_TOKENS.provisional }}
          >
            the gap · credited, not settled
          </span>
        </div>

        {/* HTML labels so the five roles stay readable at any viewport */}
        <div className="mt-2 grid grid-cols-5 gap-1 sm:mt-3">
          {PARTICIPANTS.map((p) => (
            <div key={p.id} className="min-w-0 text-center">
              <div className="truncate font-(family-name:--font-display) text-[0.7rem] font-semibold text-foreground sm:text-sm">
                {p.label}
              </div>
              <div className="truncate font-(family-name:--font-mono) text-[0.6rem] text-[var(--text-muted)] sm:text-xs">
                {p.short}
              </div>
            </div>
          ))}
        </div>

        {/* the legs again, as a list, for viewports too narrow for the pills */}
        <ul className="mt-4 grid gap-2 sm:hidden">
          {LEGS.map((leg) => {
            const step = stepOf(leg);
            const token = ledgerToken(leg.effect);
            return (
              <li
                key={leg.id}
                className="rounded-lg border px-3 py-2"
                style={{ borderColor: token }}
              >
                <span
                  className="font-(family-name:--font-mono) text-[0.6rem] tracking-[0.14em] uppercase"
                  style={{ color: token }}
                >
                  {leg.label} · {step.day}
                </span>
                <span className="mt-0.5 block text-xs text-[var(--text-secondary)]">
                  {leg.note}
                </span>
              </li>
            );
          })}
          <li
            className="px-1 font-(family-name:--font-mono) text-[0.6rem] tracking-[0.14em] uppercase"
            style={{ color: LEDGER_TOKENS.provisional }}
          >
            the gap · credited, not settled
          </li>
        </ul>
      </div>

      {mode === "walk" && (
        <ol className="mt-8 space-y-4">
          {PIPELINE_STEPS.map((s) => (
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
      )}
    </figure>
  );
}
