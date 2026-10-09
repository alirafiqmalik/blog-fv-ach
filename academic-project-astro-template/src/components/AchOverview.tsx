/**
 * The ACH overview figure (docs/storyboard.md → "The recurring motif").
 *
 * Five parties in a row — you, your bank (the ODFI), the rails (the ACH
 * Operator), their bank (the RDFI), them (the Receiver) — with the entry
 * travelling forward along the top and the two money legs underneath: the
 * credit leg at your bank, the debit leg at their bank, and the gap between
 * them. One drawing, three placements, which is why it is one component with
 * a `mode` rather than three:
 *
 *   - `hero`     — a still in a stage card beneath the title (version 1).
 *   - `backdrop` — the hero's background: no card, the entry looping along
 *                  the rail, the parties lighting as it passes (version 2).
 *   - `walk`     — Act I. Static, or with `scrub` a sticky scene stepping
 *                  through the pipeline one caption at a time.
 *
 * With `interactive`, each party is a button: hover, focus or tap shows its
 * role and the step where it acts; in a scrubbed walk, a click scrolls the
 * scene to that step.
 *
 * Everything it says comes from `src/data/ach-pipeline.ts`: the participants,
 * the two legs, and the step captions. The component owns geometry and
 * nothing else — `test/ach-pipeline.test.ts` fails if it names a step, a day
 * or a caption of its own. The motion lives in `ach-overview-motion.ts` so
 * reduced motion and the finished frame can be asserted.
 */

import { useEffect, useId, useRef, useState } from "react";
import { motion, useReducedMotion } from "motion/react";

import StickyScene from "./StickyScene.tsx";
import { isLatched, stepOpacity } from "./scroll-scene.ts";
import type { ScenePosition } from "./scroll-scene.ts";
import { LEGS, PARTICIPANTS, PIPELINE_STEPS, stepOf } from "../data/ach-pipeline.ts";
import type { Leg, ParticipantId } from "../data/ach-pipeline.ts";
import { LEDGER_TOKENS, ledgerToken } from "./ledger-motion.ts";
import {
  BACKDROP_OPACITY,
  GHOST,
  finalFrame,
  litKeyframes,
  overviewLoop,
  scrubTransition,
  tokenKeyframes,
} from "./ach-overview-motion.ts";

export type OverviewMode = "hero" | "walk" | "backdrop";

/** Horizontal position of each participant, as a percentage of the track. */
const LANE_X = [8, 29, 50, 71, 92];

/** The SVG viewBox. Overlay percentages are computed against this. */
const VIEW_W = 100;
const VIEW_H = 30;

/** Vertical centre of the instruction rail. */
const RAIL_Y = 8;

/** Steps with the gap band open, by index, for the scrubbed walk. */
const GAP_FLAGS = PIPELINE_STEPS.map((s) => Boolean(s.gap));

function laneIndexOf(participantId: ParticipantId): number {
  const index = PARTICIPANTS.findIndex((p) => p.id === participantId);
  return index === -1 ? 0 : index;
}

function laneOf(participantId: ParticipantId): number {
  return LANE_X[laneIndexOf(participantId)];
}

/** The step a leg happens at, as a per-step flag list the scrub can latch. */
function legFlags(leg: Leg): boolean[] {
  const step = stepOf(leg);
  return PIPELINE_STEPS.map((s) => s === step);
}

/** The first step where a party acts: what its tooltip describes. */
function stepFor(participantId: ParticipantId) {
  return PIPELINE_STEPS.find((s) => s.at === participantId);
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

/** What the drawing shows at one moment. */
interface Frame {
  /** Lane x of the entry, or null to draw no token (the version 1 still). */
  tokenX: number | null;
  /** Per leg, lit or ghosted. */
  legLit: boolean[];
  gapOpen: boolean;
  /** The party acting, drawn in the accent. */
  activeParty: ParticipantId | null;
  /** True when nothing may move: reduced motion, a static scene, the server. */
  still: boolean;
}

export interface AchOverviewProps {
  mode?: OverviewMode;
  /** Parties become buttons with a role tooltip; in a scrubbed walk a click jumps to the step. */
  interactive?: boolean;
  /** Walk mode only: scrub the pipeline in a sticky scene instead of listing it. */
  scrub?: boolean;
}

export default function AchOverview({
  mode = "hero",
  interactive = false,
  scrub = false,
}: AchOverviewProps) {
  const reduced = useReducedMotion() ?? false;
  const loop = overviewLoop(reduced);
  const baseId = useId();
  const rootRef = useRef<HTMLElement>(null);

  // The loop is armed only after hydration, on the next frame: the server,
  // a reader with no JavaScript, and the first client paint all get the
  // finished frame, which is what the captions describe.
  const [armed, setArmed] = useState(false);
  useEffect(() => {
    const frame = requestAnimationFrame(() => setArmed(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  const [hovered, setHovered] = useState<ParticipantId | null>(null);
  useEffect(() => {
    if (!hovered) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setHovered(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [hovered]);

  const markerId = `ach-overview-arrow-${mode}`;
  const creditX = laneOf(LEGS[0].at);
  const debitX = laneOf(LEGS[1].at);
  const finished = finalFrame(LANE_X);
  const looping = mode === "backdrop" && armed && loop !== null;
  const token = tokenKeyframes(LANE_X);

  /** Scroll a scrubbed walk to the step where a party acts. */
  function jumpTo(participantId: ParticipantId) {
    const step = stepFor(participantId);
    const track = rootRef.current?.closest<HTMLElement>("[data-scene-track]");
    if (!step || !track) return;
    const index = PIPELINE_STEPS.indexOf(step);
    const top = track.getBoundingClientRect().top + window.scrollY;
    const progress = (index + 0.6) / PIPELINE_STEPS.length;
    window.scrollTo({
      top: top + progress * track.offsetHeight,
      behavior: reduced ? "auto" : "smooth",
    });
  }

  /** The one drawing, in whichever state the mode asks for. */
  function figure(frame: Frame) {
    const transition = scrubTransition(frame.still);
    return (
      <div className="relative">
        <svg
          viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
          className="h-auto w-full"
          preserveAspectRatio="xMidYMid meet"
          aria-hidden="true"
          style={mode === "backdrop" ? { opacity: BACKDROP_OPACITY } : undefined}
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
          <motion.rect
            x={creditX}
            y={RAIL_Y + 6}
            width={debitX - creditX}
            height="14"
            fill={LEDGER_TOKENS.gap}
            stroke={LEDGER_TOKENS.provisional}
            strokeWidth="0.18"
            strokeDasharray="1.5 1.5"
            animate={
              looping
                ? { opacity: litKeyframes(laneIndexOf(LEGS[0].at), LANE_X.length).values }
                : { opacity: frame.gapOpen ? finished.opacity : GHOST }
            }
            transition={
              looping
                ? { ...loop, times: litKeyframes(laneIndexOf(LEGS[0].at), LANE_X.length).times }
                : transition
            }
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
          {LEGS.map((leg, legIndex) => {
            const x = laneOf(leg.at);
            const tokenColour = ledgerToken(leg.effect);
            const lit = litKeyframes(laneIndexOf(leg.at), LANE_X.length);
            return (
              <motion.g
                key={leg.id}
                animate={
                  looping
                    ? { opacity: lit.values }
                    : { opacity: frame.legLit[legIndex] ? finished.opacity : GHOST }
                }
                transition={looping ? { ...loop, times: lit.times } : transition}
              >
                <line
                  x1={x}
                  y1={RAIL_Y + 3.4}
                  x2={x}
                  y2={RAIL_Y + 8.6}
                  stroke={tokenColour}
                  strokeWidth="0.32"
                  strokeDasharray={leg.effect === "credit" ? undefined : "0.9 0.7"}
                />
                <circle
                  cx={x}
                  cy={RAIL_Y + 9.4}
                  r="0.9"
                  fill={leg.effect === "credit" ? tokenColour : "var(--background)"}
                  stroke={tokenColour}
                  strokeWidth="0.32"
                />
              </motion.g>
            );
          })}

          {/* the parties; the one acting, or hovered, in the accent */}
          {PARTICIPANTS.map((p, i) => {
            const active = p.id === frame.activeParty || p.id === hovered;
            return (
              <Node
                key={p.id}
                x={LANE_X[i]}
                kind={KINDS[p.id]}
                token={active ? LEDGER_TOKENS.accent : LEDGER_TOKENS.rail}
              />
            );
          })}

          {/* the entry, travelling the rail — SVG user units, not pixels */}
          {(looping || frame.tokenX !== null) && (
            <motion.g
              animate={looping ? { x: token.values } : { x: frame.tokenX ?? finished.x }}
              transition={looping ? { ...loop, times: token.times } : transition}
            >
              {/* the entry: a small amber token riding just above the rail */}
              <circle
                cy={RAIL_Y - 4.3}
                r="1"
                fill={LEDGER_TOKENS.provisional}
                stroke="var(--background)"
                strokeWidth="0.3"
              />
              <line
                x1="0"
                y1={RAIL_Y - 3.2}
                x2="0"
                y2={RAIL_Y - 1.9}
                stroke={LEDGER_TOKENS.provisional}
                strokeWidth="0.25"
                opacity="0.7"
              />
            </motion.g>
          )}
        </svg>

        {/* leg pills, laid over the band at their lane; stacked below `sm` */}
        {mode !== "backdrop" &&
          LEGS.map((leg, legIndex) => {
            const step = stepOf(leg);
            const tokenColour = ledgerToken(leg.effect);
            return (
              <div
                key={leg.id}
                className="absolute hidden w-[30%] -translate-x-1/2 sm:block"
                style={{
                  ...pct(laneOf(leg.at), RAIL_Y + 11),
                  opacity: frame.legLit[legIndex] ? 1 : GHOST + 0.2,
                  transition: frame.still ? undefined : "opacity 240ms ease-out",
                }}
              >
                <div
                  className="rounded-lg border bg-[var(--background)] px-2.5 py-1.5 text-center"
                  style={{ borderColor: tokenColour }}
                >
                  <div
                    className="font-(family-name:--font-mono) text-[0.6rem] tracking-[0.14em] uppercase"
                    style={{ color: tokenColour }}
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
        {mode !== "backdrop" && (
          <span
            className="absolute hidden -translate-x-1/2 font-(family-name:--font-mono) text-[0.6rem] tracking-[0.14em] uppercase sm:block"
            style={{
              ...pct((creditX + debitX) / 2, RAIL_Y + 17.2),
              color: LEDGER_TOKENS.provisional,
              opacity: frame.gapOpen ? 1 : 0,
              transition: frame.still ? undefined : "opacity 240ms ease-out",
            }}
          >
            the gap · credited, not settled
          </span>
        )}
      </div>
    );
  }

  /** The five roles, readable at any viewport; buttons with tooltips when interactive. */
  function parties(frame: Frame) {
    return (
      <div className="relative mt-2 grid grid-cols-5 gap-1 sm:mt-3">
        {PARTICIPANTS.map((p) => {
          const active = p.id === frame.activeParty;
          const open = interactive && hovered === p.id;
          const step = stepFor(p.id);
          const leg = LEGS.find((l) => l.at === p.id);
          const tooltipId = `${baseId}-${p.id}`;
          const label = (
            <>
              <span
                className="block truncate font-(family-name:--font-display) text-[0.7rem] font-semibold sm:text-sm"
                style={{ color: active || open ? "var(--foreground)" : "var(--text-secondary)" }}
              >
                {p.label}
              </span>
              <span className="block truncate font-(family-name:--font-mono) text-[0.6rem] text-[var(--text-muted)] sm:text-xs">
                {p.short}
              </span>
            </>
          );
          if (!interactive) {
            return (
              <div key={p.id} className="min-w-0 text-center">
                {label}
              </div>
            );
          }
          return (
            <div key={p.id} className="relative min-w-0 text-center">
              <button
                type="button"
                className="w-full cursor-pointer rounded-lg px-1 py-1 text-center outline-none hover:bg-[var(--accent)]/60 focus-visible:ring-2 focus-visible:ring-[var(--ach-accent)]"
                aria-describedby={open ? tooltipId : undefined}
                aria-expanded={open}
                onMouseEnter={() => setHovered(p.id)}
                onMouseLeave={() => setHovered((current) => (current === p.id ? null : current))}
                onFocus={() => setHovered(p.id)}
                onBlur={() => setHovered((current) => (current === p.id ? null : current))}
                onClick={() => {
                  if (mode === "walk" && scrub) jumpTo(p.id);
                  else setHovered((current) => (current === p.id ? null : p.id));
                }}
              >
                {label}
              </button>
              {open && step && (
                <div
                  id={tooltipId}
                  role="tooltip"
                  className="absolute bottom-full left-1/2 z-20 mb-2 w-[min(18rem,80vw)] -translate-x-1/2 rounded-xl border border-border bg-[var(--popover)] p-3 text-left shadow-[0_16px_40px_rgb(0_0_0_/_0.45)]"
                >
                  <div className="font-(family-name:--font-mono) text-[0.6rem] tracking-[0.16em] text-[var(--ach-accent)] uppercase">
                    {p.label} · {p.short}
                  </div>
                  <div className="mt-1.5 font-(family-name:--font-display) text-sm font-semibold text-foreground">
                    {step.day} · {step.title}
                  </div>
                  <p className="mt-1 text-xs leading-relaxed text-[var(--text-secondary)]">
                    {step.caption}
                  </p>
                  {leg && (
                    <p
                      className="mt-2 border-t border-border pt-2 font-(family-name:--font-mono) text-[0.6rem] tracking-[0.12em] uppercase"
                      style={{ color: ledgerToken(leg.effect) }}
                    >
                      {leg.label} · {stepOf(leg).day} · {leg.note}
                    </p>
                  )}
                  {mode === "walk" && scrub && (
                    <p className="mt-2 font-(family-name:--font-mono) text-[0.6rem] tracking-[0.12em] text-[var(--text-muted)] uppercase">
                      click to jump to this step
                    </p>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  }

  /** The legs again, as a list, for viewports too narrow for the pills. */
  function legList() {
    return (
      <ul className="mt-4 grid gap-2 sm:hidden">
        {LEGS.map((leg) => {
          const step = stepOf(leg);
          const tokenColour = ledgerToken(leg.effect);
          return (
            <li key={leg.id} className="rounded-lg border px-3 py-2" style={{ borderColor: tokenColour }}>
              <span
                className="font-(family-name:--font-mono) text-[0.6rem] tracking-[0.14em] uppercase"
                style={{ color: tokenColour }}
              >
                {leg.label} · {step.day}
              </span>
              <span className="mt-0.5 block text-xs text-[var(--text-secondary)]">{leg.note}</span>
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
    );
  }

  /** The step captions, listed: the static branch and the version 1 walk. */
  function captionList() {
    return (
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
              <span className="mt-1 block text-sm text-[var(--text-secondary)]">{s.caption}</span>
            </span>
          </li>
        ))}
      </ol>
    );
  }

  // ------------------------------------------------------------ backdrop

  if (mode === "backdrop") {
    const frame: Frame = {
      tokenX: finished.x,
      legLit: LEGS.map(() => true),
      gapOpen: true,
      activeParty: null,
      still: !looping,
    };
    return (
      <figure
        ref={rootRef}
        className="not-prose mx-auto my-0 w-full max-w-6xl px-4 sm:px-8"
        role="figure"
        aria-label="How an ACH debit moves: the entry travels from you through your bank and the rails to their bank; the credit posts at your bank on day one and the debit is first checked at their bank on day three"
      >
        {figure(frame)}
        {parties(frame)}
      </figure>
    );
  }

  // ----------------------------------------------------------- scrubbed walk

  if (mode === "walk" && scrub) {
    return (
      <StickyScene
        steps={PIPELINE_STEPS.length}
        label="The five parties to an ACH transfer, walked step by step from submission to the close of the return window"
      >
        {(position: ScenePosition, isStatic: boolean) => {
          const step = PIPELINE_STEPS[position.index];
          const frame: Frame = {
            tokenX: laneOf(step.at),
            legLit: LEGS.map((leg) => isLatched(legFlags(leg), position)),
            gapOpen: isLatched(GAP_FLAGS, position),
            activeParty: step.at,
            still: isStatic || reduced,
          };
          return (
            <figure ref={rootRef} className="not-prose mx-auto my-0 w-full max-w-5xl px-4 sm:px-6">
              <div className="scene-stage px-4 py-6 sm:px-8 sm:py-8" style={{ minHeight: "auto" }}>
                <div className="mb-4 flex items-baseline justify-between gap-4">
                  <span className="font-(family-name:--font-mono) text-sm tracking-[0.18em] text-[var(--ach-provisional)] uppercase">
                    {isStatic ? "One transfer, step by step" : step.day}
                  </span>
                  <span className="font-(family-name:--font-mono) text-[0.65rem] tracking-wider text-[var(--text-muted)]">
                    {isStatic
                      ? "five parties · up to five banking days"
                      : `${position.index + 1} / ${PIPELINE_STEPS.length}`}
                  </span>
                </div>
                {figure(frame)}
                {parties(frame)}
                {legList()}
              </div>

              {isStatic ? (
                captionList()
              ) : (
                <div className="relative mt-8 min-h-28">
                  {PIPELINE_STEPS.map((s, i) => (
                    <div
                      key={s.id}
                      className="absolute inset-x-0 mx-auto max-w-2xl text-center"
                      style={{ opacity: stepOpacity(i, position) }}
                    >
                      <h3 className="font-(family-name:--font-display) text-2xl font-semibold tracking-tight text-foreground">
                        {s.title}
                      </h3>
                      <p className="mt-2 text-base leading-relaxed text-[var(--text-secondary)]">{s.caption}</p>
                    </div>
                  ))}
                  <p className="sr-only" aria-live="polite">
                    {s(step)}
                  </p>
                </div>
              )}
            </figure>
          );
        }}
      </StickyScene>
    );
  }

  // --------------------------------------------------- hero still, static walk

  const frame: Frame = {
    tokenX: null,
    legLit: LEGS.map(() => true),
    gapOpen: true,
    activeParty: null,
    still: true,
  };

  return (
    <figure
      ref={rootRef}
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
      <div className="scene-stage px-4 pt-5 pb-4 sm:px-8 sm:pt-7 sm:pb-6" style={{ minHeight: "auto" }}>
        <div className="mb-4 flex items-baseline justify-between gap-4">
          <span className="font-(family-name:--font-mono) text-[0.65rem] tracking-[0.18em] text-[var(--text-muted)] uppercase">
            {mode === "walk" ? "One transfer, step by step" : "How an ACH debit moves"}
          </span>
          <span className="font-(family-name:--font-mono) text-[0.65rem] tracking-wider text-[var(--text-muted)]">
            five parties · up to five banking days
          </span>
        </div>
        {figure(frame)}
        {parties(frame)}
        {legList()}
      </div>

      {mode === "walk" && captionList()}
    </figure>
  );
}

/** Screen-reader text for the current step: the day and the caption. */
function s(step: (typeof PIPELINE_STEPS)[number]): string {
  return `${step.day}. ${step.title}. ${step.caption}`;
}
