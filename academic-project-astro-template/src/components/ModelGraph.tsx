/**
 * The model assembling itself, then the adversary attaching to it
 * (docs/storyboard.md §4b).
 *
 * Scrubbed: five participant nodes arrive one step at a time, then the two
 * channels light up as edges, then a red adversary node attaches and the four
 * capabilities are named. The point of the last beat is that nothing about the
 * adversary is exotic — every capability is a feature of consumer banking — so
 * the capability text is the payload and the red node is the illustration.
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
const GHOST = 0.16;

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
          <div className="mx-auto w-full max-w-3xl px-6">
            <svg viewBox="0 0 100 56" className="h-auto w-full" aria-hidden="true">
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
                        ? `M ${from.x} ${from.y + 3} Q 50 30 ${to.x} ${to.y + 3}`
                        : `M ${from.x + 7} ${from.y} L ${to.x - 7} ${to.y}`
                    }
                    fill="none"
                    stroke={money ? LEDGER_TOKENS.credit : LEDGER_TOKENS.rail}
                    strokeWidth={money ? "0.35" : "0.25"}
                    strokeDasharray={money ? "1.2 0.9" : undefined}
                    opacity={visible ? 0.85 : GHOST}
                    style={{ transition: "opacity 260ms ease-out" }}
                  />
                );
              })}

              {/* channel labels, once their edges are up */}
              {CHANNELS.map((channel, i) => (
                <text
                  key={channel.id}
                  x={channel.id === "dollar" ? 50 : 50}
                  y={channel.id === "dollar" ? 27.5 : 12.4}
                  textAnchor="middle"
                  fontSize="1.4"
                  fill={
                    channel.id === "dollar"
                      ? LEDGER_TOKENS.credit
                      : "var(--text-muted)"
                  }
                  fontFamily="var(--font-mono)"
                  opacity={channelsShown > i ? 1 : GHOST}
                  style={{ transition: "opacity 260ms ease-out" }}
                >
                  {channel.symbol}
                </text>
              ))}

              {/* participant nodes */}
              {MODEL_NODES.map((node, i) => {
                const visible = i < shown;
                return (
                  <g
                    key={node.id}
                    opacity={visible ? 1 : GHOST}
                    style={{ transition: "opacity 260ms ease-out" }}
                  >
                    <rect
                      x={node.x - 7.5}
                      y={node.y - 2.6}
                      width="15"
                      height="5.2"
                      rx="0.8"
                      fill="var(--card)"
                      stroke={
                        i === shown - 1 && !isStatic
                          ? LEDGER_TOKENS.accent
                          : "var(--border)"
                      }
                      strokeWidth="0.3"
                    />
                    <text
                      x={node.x}
                      y={node.y + 0.6}
                      textAnchor="middle"
                      fontSize="1.7"
                      fill="var(--foreground)"
                      fontFamily="var(--font-display)"
                    >
                      {node.label}
                    </text>
                    <text
                      x={node.x}
                      y={node.y + 5.2}
                      textAnchor="middle"
                      fontSize="1.3"
                      fill="var(--text-muted)"
                      fontFamily="var(--font-mono)"
                    >
                      {node.role}
                    </text>
                  </g>
                );
              })}

              {/* the adversary, attaching to the Originator and the Receiver */}
              <g
                opacity={adversary ? 1 : 0}
                style={{ transition: "opacity 320ms ease-out" }}
              >
                <path
                  d="M 10 24 L 10 42 L 33 42"
                  fill="none"
                  stroke={LEDGER_TOKENS.debit}
                  strokeWidth="0.25"
                  strokeDasharray="1 0.8"
                />
                <path
                  d="M 90 24 L 90 42 L 67 42"
                  fill="none"
                  stroke={LEDGER_TOKENS.debit}
                  strokeWidth="0.25"
                  strokeDasharray="1 0.8"
                />
                <rect
                  x="33"
                  y="38.6"
                  width="34"
                  height="6.4"
                  rx="0.8"
                  fill="var(--card)"
                  stroke={LEDGER_TOKENS.debit}
                  strokeWidth="0.32"
                />
                <text
                  x="50"
                  y="42.6"
                  textAnchor="middle"
                  fontSize="1.8"
                  fill={LEDGER_TOKENS.debit}
                  fontFamily="var(--font-display)"
                >
                  Adversary
                </text>
                <text
                  x="50"
                  y="49.6"
                  textAnchor="middle"
                  fontSize="1.35"
                  fill="var(--text-muted)"
                  fontFamily="var(--font-mono)"
                >
                  instruments an Originator and a Receiver, non-deterministically
                </text>
              </g>
            </svg>

            {isStatic ? (
              <>
                <dl className="mt-8 space-y-3">
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
              <div className="relative mt-8 h-32">
                {STEP_CAPTIONS.map((caption, i) => (
                  <div
                    key={caption}
                    className="absolute inset-x-0 mx-auto max-w-2xl text-center"
                    style={{ opacity: stepOpacity(i, position) }}
                  >
                    <p className="text-base text-[var(--text-secondary)]">
                      {caption}
                    </p>
                    {i === ADVERSARY_STEP && (
                      <ul className="mt-4 grid grid-cols-2 gap-x-6 gap-y-2 text-left sm:grid-cols-4">
                        {CAPABILITIES.map((c) => (
                          <li key={c.id}>
                            <span
                              className="font-(family-name:--font-mono) text-xs"
                              style={{ color: LEDGER_TOKENS.debit }}
                            >
                              {c.id}
                            </span>
                            <span className="mt-0.5 block text-xs text-[var(--text-secondary)]">
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
        );
      }}
    </StickyScene>
  );
}
