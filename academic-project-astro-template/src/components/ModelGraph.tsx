/**
 * The model assembling itself, then the adversary attaching to it
 * (docs/storyboard.md §4b).
 *
 * Scrubbed: five participant nodes arrive one step at a time, then the two
 * channels light up as edges, then a red adversary node attaches and the four
 * capabilities are named. The point of the last beat is that nothing about the
 * adversary is exotic — every capability is a feature of consumer banking — so
 * the capability text is the payload and the red node is the illustration.
 *
 * Geometry lives in one SVG. Readable names sit as HTML overlays: SVG text at
 * this viewBox scale is a role badge, not a sentence.
 */

import StickyScene from "./StickyScene.tsx";
import { stepOpacity } from "./scroll-scene.ts";
import type { ScenePosition } from "./scroll-scene.ts";
import { LEDGER_TOKENS } from "./ledger-motion.ts";
import {
  CAPABILITIES,
  CHANNELS,
  MODEL_EDGES,
  MODEL_NODES,
} from "../data/method.ts";

/**
 * Un-arrived elements are ghosted rather than hidden.
 *
 * Hiding them outright left the first five steps looking like an empty frame
 * with one box in it. Ghosting keeps the shape of the model legible from step
 * zero, so what the scrub adds is *emphasis* — this one, now — rather than the
 * information that anything is there at all.
 */
const GHOST = 0.18;

/** Matches the SVG viewBox. Overlay percentages are computed against this. */
const VIEW_W = 100;
const VIEW_H = 56;

/** Steps: one per node, one per channel, one for the adversary. */
const STEP_CAPTIONS = [
  "You, the Originator. You start a payment.",
  "Your bank, the ODFI. It validates the entry and commits liquidity.",
  "The ACH Operator. It batches and routes; it does not adjudicate.",
  "Their bank, the RDFI. The only party that checks whether the debit is allowed.",
  "The Receiver, whose account is on the other end.",
  "C_info carries the instructions between them.",
  "C_$ is the channel that actually moves money, and it moves later.",
  "Now add an adversary — using nothing but ordinary consumer features.",
] as const;

const ADVERSARY_STEP = STEP_CAPTIONS.length - 1;

function pct(x: number, y: number): { left: string; top: string } {
  return { left: `${(x / VIEW_W) * 100}%`, top: `${(y / VIEW_H) * 100}%` };
}

export default function ModelGraph() {
  return (
    <StickyScene
      steps={STEP_CAPTIONS.length}
      label="The formal model: five participant state machines, two channels, and an adversary built from ordinary consumer capabilities"
    >
      {(position: ScenePosition, isStatic: boolean) => {
        const shown = isStatic ? MODEL_NODES.length : position.index + 1;
        const channelsShown = isStatic
          ? CHANNELS.length
          : Math.max(0, position.index + 1 - MODEL_NODES.length);
        const adversary = isStatic || position.index >= ADVERSARY_STEP;

        return (
          <div className="mx-auto w-full max-w-4xl px-4 sm:px-6">
            <div className="scene-stage px-4 py-6 sm:px-8 sm:py-8">
              <div className="mb-4 flex items-baseline justify-between gap-4">
                <span className="font-(family-name:--font-mono) text-[0.65rem] tracking-[0.18em] text-[var(--text-muted)] uppercase">
                  The model
                </span>
                <span className="font-(family-name:--font-mono) text-[0.65rem] tabular-nums text-[var(--text-muted)]">
                  {isStatic
                    ? "complete"
                    : `${String(position.index + 1).padStart(2, "0")} / ${String(STEP_CAPTIONS.length).padStart(2, "0")}`}
                </span>
              </div>

              <div className="relative">
                <svg
                  viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
                  className="h-auto w-full"
                  aria-hidden="true"
                >
                  {/* edges: C_info along the row, C_$ arcing below it */}
                  {MODEL_EDGES.map((edge) => {
                    const from = MODEL_NODES.find((n) => n.id === edge.from)!;
                    const to = MODEL_NODES.find((n) => n.id === edge.to)!;
                    const channelIndex = CHANNELS.findIndex(
                      (c) => c.id === edge.channel,
                    );
                    const visible = channelsShown > channelIndex;
                    const money = edge.channel === "dollar";
                    return (
                      <path
                        key={`${edge.from}-${edge.to}-${edge.channel}`}
                        d={
                          money
                            ? `M ${from.x} ${from.y + 3.4} Q 50 31 ${to.x} ${to.y + 3.4}`
                            : `M ${from.x + 6.2} ${from.y} L ${to.x - 6.2} ${to.y}`
                        }
                        fill="none"
                        stroke={money ? LEDGER_TOKENS.credit : LEDGER_TOKENS.rail}
                        strokeWidth={money ? "0.55" : "0.38"}
                        strokeDasharray={money ? "1.4 1" : undefined}
                        opacity={visible ? 0.9 : GHOST}
                        style={{
                          transition: "opacity 260ms ease-out",
                          filter: visible && money
                            ? `drop-shadow(0 0 1.2px ${LEDGER_TOKENS.credit})`
                            : undefined,
                        }}
                      />
                    );
                  })}

                  {/* channel badges, once their edges are up */}
                  {CHANNELS.map((channel, i) => {
                    const at = channel.id === "dollar"
                      ? { x: 50, y: 28.6 }
                      : { x: 50, y: 10.6 };
                    const visible = channelsShown > i;
                    const money = channel.id === "dollar";
                    return (
                      <g
                        key={channel.id}
                        opacity={visible ? 1 : GHOST}
                        style={{ transition: "opacity 260ms ease-out" }}
                      >
                        <rect
                          x={at.x - 7}
                          y={at.y - 2.1}
                          width="14"
                          height="4.2"
                          rx="2.1"
                          fill="var(--card)"
                          stroke={money ? LEDGER_TOKENS.credit : LEDGER_TOKENS.rail}
                          strokeWidth="0.28"
                        />
                        <text
                          x={at.x}
                          y={at.y + 0.85}
                          textAnchor="middle"
                          fontSize="2.15"
                          fill={money ? LEDGER_TOKENS.credit : "var(--foreground)"}
                          fontFamily="var(--font-mono)"
                        >
                          {channel.symbol}
                        </text>
                      </g>
                    );
                  })}

                  {/* participant nodes — role badges; names overlay in HTML */}
                  {MODEL_NODES.map((node, i) => {
                    const visible = i < shown;
                    const active = i === shown - 1 && !isStatic;
                    return (
                      <g
                        key={node.id}
                        opacity={visible ? 1 : GHOST}
                        style={{
                          transition: "opacity 260ms ease-out, filter 260ms ease-out",
                          filter: active
                            ? `drop-shadow(0 0 1.6px ${LEDGER_TOKENS.accent})`
                            : undefined,
                        }}
                      >
                        <rect
                          x={node.x - 6.4}
                          y={node.y - 3.1}
                          width="12.8"
                          height="6.2"
                          rx="1.1"
                          fill="var(--background)"
                          stroke={
                            active ? LEDGER_TOKENS.accent : "var(--border)"
                          }
                          strokeWidth={active ? "0.45" : "0.32"}
                        />
                        <text
                          x={node.x}
                          y={node.y + 1.15}
                          textAnchor="middle"
                          fontSize="3.15"
                          fill="var(--foreground)"
                          fontFamily="var(--font-display)"
                          fontWeight="600"
                        >
                          {node.role}
                        </text>
                      </g>
                    );
                  })}

                  {/* the adversary, attaching to the Originator and the Receiver */}
                  <g
                    opacity={adversary ? 1 : 0}
                    style={{
                      transition: "opacity 320ms ease-out, filter 320ms ease-out",
                      filter: adversary
                        ? `drop-shadow(0 0 1.4px ${LEDGER_TOKENS.debit})`
                        : undefined,
                    }}
                  >
                    <path
                      d="M 10 24 L 10 41.2 L 33 41.2"
                      fill="none"
                      stroke={LEDGER_TOKENS.debit}
                      strokeWidth="0.38"
                      strokeDasharray="1.1 0.8"
                    />
                    <path
                      d="M 90 24 L 90 41.2 L 67 41.2"
                      fill="none"
                      stroke={LEDGER_TOKENS.debit}
                      strokeWidth="0.38"
                      strokeDasharray="1.1 0.8"
                    />
                    <rect
                      x="33"
                      y="37.8"
                      width="34"
                      height="7.4"
                      rx="1.1"
                      fill="var(--background)"
                      stroke={LEDGER_TOKENS.debit}
                      strokeWidth="0.42"
                    />
                    <text
                      x="50"
                      y="42.6"
                      textAnchor="middle"
                      fontSize="2.7"
                      fill={LEDGER_TOKENS.debit}
                      fontFamily="var(--font-display)"
                      fontWeight="600"
                    >
                      Adversary
                    </text>
                  </g>
                </svg>

                {/* HTML names — the readable layer the SVG badges cannot carry */}
                <div className="pointer-events-none absolute inset-0">
                  {MODEL_NODES.map((node, i) => {
                    const visible = i < shown;
                    const pos = pct(node.x, node.y + 6.6);
                    return (
                      <div
                        key={node.id}
                        className="absolute -translate-x-1/2 text-center"
                        style={{
                          left: pos.left,
                          top: pos.top,
                          opacity: visible ? 1 : GHOST,
                          transition: "opacity 260ms ease-out",
                          width: "18%",
                        }}
                      >
                        <span className="block font-(family-name:--font-display) text-[0.7rem] leading-tight font-semibold text-foreground sm:text-xs">
                          {node.label}
                        </span>
                      </div>
                    );
                  })}
                  <div
                    className="absolute left-1/2 w-[70%] -translate-x-1/2 text-center"
                    style={{
                      top: `${(49.6 / VIEW_H) * 100}%`,
                      opacity: adversary ? 1 : 0,
                      transition: "opacity 320ms ease-out",
                    }}
                  >
                    <span className="block font-(family-name:--font-mono) text-[0.65rem] leading-snug text-[var(--text-muted)] sm:text-xs">
                      instruments an Originator and a Receiver, non-deterministically
                    </span>
                  </div>
                </div>
              </div>

              {isStatic ? (
                <>
                  <dl className="mt-8 space-y-3 border-t border-border pt-5">
                    {CHANNELS.map((channel) => (
                      <div key={channel.id} className="flex gap-4">
                        <dt
                          className="w-16 shrink-0 font-(family-name:--font-mono) text-xs"
                          style={{
                            color:
                              channel.id === "dollar"
                                ? LEDGER_TOKENS.credit
                                : "var(--text-muted)",
                          }}
                        >
                          {channel.symbol}
                        </dt>
                        <dd className="text-sm text-[var(--text-secondary)]">
                          {channel.detail}
                        </dd>
                      </div>
                    ))}
                  </dl>
                  <ul className="mt-6 space-y-3">
                    {CAPABILITIES.map((c) => (
                      <li key={c.id} className="flex gap-4">
                        <span
                          className="w-10 shrink-0 font-(family-name:--font-mono) text-xs"
                          style={{ color: LEDGER_TOKENS.debit }}
                        >
                          {c.id}
                        </span>
                        <span className="text-sm text-[var(--text-secondary)]">
                          {c.text}
                        </span>
                      </li>
                    ))}
                  </ul>
                </>
              ) : (
                <div className="relative mt-8 min-h-40">
                  {STEP_CAPTIONS.map((caption, i) => (
                    <div
                      key={caption}
                      className="absolute inset-x-0 mx-auto max-w-2xl text-center"
                      style={{ opacity: stepOpacity(i, position) }}
                    >
                      <p className="text-lg leading-snug text-foreground sm:text-xl">
                        {caption}
                      </p>
                      {i === ADVERSARY_STEP && (
                        <ul className="mt-5 grid grid-cols-2 gap-x-6 gap-y-3 text-left sm:grid-cols-4">
                          {CAPABILITIES.map((c) => (
                            <li key={c.id}>
                              <span
                                className="font-(family-name:--font-mono) text-[0.65rem] tracking-wider"
                                style={{ color: LEDGER_TOKENS.debit }}
                              >
                                {c.id}
                              </span>
                              <span className="mt-0.5 block text-xs leading-snug text-[var(--text-secondary)]">
                                {c.short}
                              </span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        );
      }}
    </StickyScene>
  );
}
