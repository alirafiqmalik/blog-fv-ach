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
          <div className="mx-auto w-full max-w-4xl px-6">
            <svg viewBox="0 0 100 74" className="h-auto w-full" aria-hidden="true">
              {/* edges */}
              {MODEL_EDGES.map((edge) => {
                const from = MODEL_NODES.find((n) => n.id === edge.from)!;
                const to = MODEL_NODES.find((n) => n.id === edge.to)!;
                const channelIndex = CHANNELS.findIndex(
                  (c) => c.id === edge.channel,
                );
                const visible = channelsShown > channelIndex;
                return (
                  <line
                    key={`${edge.from}-${edge.to}-${edge.channel}`}
                    x1={from.x}
                    y1={from.y * 0.6}
                    x2={to.x}
                    y2={to.y * 0.6}
                    stroke={
                      edge.channel === "dollar"
                        ? LEDGER_TOKENS.credit
                        : LEDGER_TOKENS.rail
                    }
                    strokeWidth={edge.channel === "dollar" ? "0.4" : "0.3"}
                    strokeDasharray={edge.channel === "dollar" ? "1.4 1" : undefined}
                    opacity={visible ? 0.85 : 0}
                    style={{ transition: "opacity 260ms ease-out" }}
                  />
                );
              })}

              {/* participant nodes */}
              {MODEL_NODES.map((node, i) => {
                const visible = i < shown;
                return (
                  <g
                    key={node.id}
                    opacity={visible ? 1 : 0}
                    style={{ transition: "opacity 260ms ease-out" }}
                  >
                    <rect
                      x={node.x - 8}
                      y={node.y * 0.6 - 3.4}
                      width="16"
                      height="6.8"
                      rx="1"
                      fill="var(--card)"
                      stroke={
                        i === shown - 1 && !isStatic
                          ? LEDGER_TOKENS.accent
                          : "var(--border)"
                      }
                      strokeWidth="0.35"
                    />
                    <text
                      x={node.x}
                      y={node.y * 0.6 + 0.4}
                      textAnchor="middle"
                      fontSize="2.3"
                      fill="var(--foreground)"
                      fontFamily="var(--font-display)"
                    >
                      {node.label}
                    </text>
                    <text
                      x={node.x}
                      y={node.y * 0.6 + 3.2}
                      textAnchor="middle"
                      fontSize="1.7"
                      fill="var(--text-muted)"
                      fontFamily="var(--font-mono)"
                    >
                      {node.role}
                    </text>
                  </g>
                );
              })}

              {/* the adversary, attaching to the graph */}
              <g
                opacity={adversary ? 1 : 0}
                style={{ transition: "opacity 260ms ease-out" }}
              >
                <line
                  x1="12"
                  y1="30"
                  x2="12"
                  y2="52"
                  stroke={LEDGER_TOKENS.debit}
                  strokeWidth="0.3"
                  strokeDasharray="1 0.8"
                />
                <line
                  x1="92"
                  y1="30"
                  x2="92"
                  y2="52"
                  stroke={LEDGER_TOKENS.debit}
                  strokeWidth="0.3"
                  strokeDasharray="1 0.8"
                />
                <rect
                  x="38"
                  y="52"
                  width="24"
                  height="8"
                  rx="1"
                  fill="var(--card)"
                  stroke={LEDGER_TOKENS.debit}
                  strokeWidth="0.4"
                />
                <line x1="12" y1="56" x2="38" y2="56" stroke={LEDGER_TOKENS.debit} strokeWidth="0.3" />
                <line x1="62" y1="56" x2="92" y2="56" stroke={LEDGER_TOKENS.debit} strokeWidth="0.3" />
                <text
                  x="50"
                  y="56.9"
                  textAnchor="middle"
                  fontSize="2.4"
                  fill={LEDGER_TOKENS.debit}
                  fontFamily="var(--font-display)"
                >
                  Adversary
                </text>
                <text
                  x="50"
                  y="66"
                  textAnchor="middle"
                  fontSize="1.9"
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
