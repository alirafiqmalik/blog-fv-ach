/**
 * The model checker as investigator (docs/storyboard.md §4d).
 *
 * Branching execution paths grow out of an initial state. Most turn grey and
 * stop; one turns red, keeps going, and lands on a counterexample stamp. It is
 * a metaphor for exhaustive search, not a depiction of IC3/PDR — the caption
 * says so, because a figure that quietly implies the checker explores a tree
 * left-to-right would be teaching the wrong thing.
 *
 * The tree geometry is deterministic (`node-*.ts`-style arithmetic below rather
 * than random layout) because `Math.random()` in a render would give the server
 * and the client different trees and blow up hydration.
 */

import { useRef } from "react";
import { motion, useInView, useReducedMotion } from "motion/react";

import { CHECKER } from "../data/method.ts";
import { BEAT_DURATION, LEDGER_TOKENS, beatVariants } from "./ledger-motion.ts";

interface Branch {
  id: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  depth: number;
  /** The one path that survives to the counterexample. */
  onTrace: boolean;
  /** A path that terminated without violating the invariant. */
  dead: boolean;
}

/**
 * Build a fixed binary-ish tree in a 400×320 viewBox so node labels and the
 * stamp set at body type, not caption type.
 *
 * The surviving trace is the run of branches whose index is on `TRACE`, chosen
 * once so the shape is stable across renders.
 */
function buildTree(): Branch[] {
  const branches: Branch[] = [];
  const levels = 4;
  const spread = 176;
  let frontier = [{ x: 200, y: 36, trace: true }];

  for (let depth = 0; depth < levels; depth += 1) {
    const next: typeof frontier = [];
    const dy = 52;
    frontier.forEach((node, i) => {
      const width = spread / Math.pow(1.7, depth);
      for (const dir of [-1, 1]) {
        const x2 = node.x + dir * width * 0.5;
        const y2 = node.y + dy;
        // The trace always takes the right-hand child, and only from a node
        // already on the trace.
        const onTrace = node.trace && dir === 1;
        branches.push({
          id: `d${depth}-n${i}-${dir}`,
          x1: node.x,
          y1: node.y,
          x2,
          y2,
          depth,
          onTrace,
          dead: !onTrace && depth >= 2,
        });
        next.push({ x: x2, y: y2, trace: onTrace });
      }
    });
    frontier = next;
  }
  return branches;
}

const TREE = buildTree();
const TIP = TREE.filter((b) => b.onTrace).at(-1)!;
const ROOT = { x: 200, y: 36 };

export default function CheckerSearch() {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion() ?? false;
  const inView = useInView(ref, { once: true, amount: 0.3 });
  const armed = inView || reduced;

  return (
    <div ref={ref} className="not-prose scene-stage mx-auto my-12 max-w-3xl px-4 py-6 sm:px-8 sm:py-8">
      <div className="mb-5 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-2">
        <div>
          <span className="font-(family-name:--font-mono) text-[0.65rem] tracking-[0.18em] text-[var(--text-muted)] uppercase">
            Investigation
          </span>
          <p className="mt-1 font-(family-name:--font-display) text-lg font-semibold tracking-tight text-foreground">
            {CHECKER.tool}
            <span className="ml-2 font-(family-name:--font-mono) text-xs font-normal tracking-wider text-[var(--text-muted)]">
              {CHECKER.spec} · {CHECKER.engine}
            </span>
          </p>
        </div>
        <div className="flex flex-wrap gap-4 font-(family-name:--font-mono) text-[0.65rem] tracking-wider uppercase">
          <span className="flex items-center gap-1.5 text-[var(--text-muted)]">
            <span
              className="inline-block h-1.5 w-1.5 rounded-full"
              style={{ background: LEDGER_TOKENS.rail }}
            />
            pruned
          </span>
          <span className="flex items-center gap-1.5" style={{ color: LEDGER_TOKENS.debit }}>
            <span
              className="inline-block h-1.5 w-1.5 rounded-full"
              style={{ background: LEDGER_TOKENS.debit }}
            />
            counterexample
          </span>
        </div>
      </div>

      <svg viewBox="0 0 400 318" className="h-auto w-full" aria-hidden="true">
        <motion.g
          variants={beatVariants(reduced, { y: -6 }, 0)}
          initial="hidden"
          animate={armed ? "visible" : "hidden"}
        >
          <circle
            cx={ROOT.x}
            cy={ROOT.y}
            r="7"
            fill={LEDGER_TOKENS.accent}
          />
          <text
            x={ROOT.x}
            y={ROOT.y - 16}
            textAnchor="middle"
            fontSize="11"
            fill="var(--text-muted)"
            fontFamily="var(--font-mono)"
            letterSpacing="0.12em"
          >
            INITIAL STATE
          </text>
        </motion.g>

        {TREE.map((branch) => (
          <g
            key={branch.id}
            style={{ opacity: branch.dead ? 0.42 : 1 }}
          >
            <motion.line
              x1={branch.x1}
              y1={branch.y1}
              x2={branch.x2}
              y2={branch.y2}
              stroke={
                branch.onTrace
                  ? LEDGER_TOKENS.debit
                  : branch.dead
                    ? "var(--border)"
                    : LEDGER_TOKENS.rail
              }
              strokeWidth={branch.onTrace ? 2.4 : 1.15}
              strokeLinecap="round"
              variants={beatVariants(
                reduced,
                {},
                branch.depth * BEAT_DURATION * 0.75,
              )}
              initial="hidden"
              animate={armed ? "visible" : "hidden"}
              style={{
                filter: branch.onTrace
                  ? `drop-shadow(0 0 4px ${LEDGER_TOKENS.debit})`
                  : undefined,
              }}
            />
            <motion.circle
              cx={branch.x2}
              cy={branch.y2}
              r={branch.onTrace ? 5.5 : 3.2}
              fill={
                branch.onTrace
                  ? LEDGER_TOKENS.debit
                  : branch.dead
                    ? "var(--border)"
                    : LEDGER_TOKENS.rail
              }
              variants={beatVariants(
                reduced,
                { y: 6 },
                branch.depth * BEAT_DURATION * 0.75 + 0.08,
              )}
              initial="hidden"
              animate={armed ? "visible" : "hidden"}
            />
          </g>
        ))}

        {/* the terminating stamp */}
        <motion.g
          variants={beatVariants(reduced, { y: 8 }, 4 * BEAT_DURATION * 0.75)}
          initial="hidden"
          animate={armed ? "visible" : "hidden"}
        >
          <rect
            x={TIP.x2 - 86}
            y={TIP.y2 + 14}
            width="172"
            height="36"
            rx="4"
            fill="none"
            stroke={LEDGER_TOKENS.debit}
            strokeWidth="2"
          />
          <text
            x={TIP.x2}
            y={TIP.y2 + 37}
            textAnchor="middle"
            fontSize="13"
            fill={LEDGER_TOKENS.debit}
            fontFamily="var(--font-mono)"
            letterSpacing="0.22em"
            fontWeight="600"
          >
            COUNTEREXAMPLE
          </text>
        </motion.g>
      </svg>

      <div className="mt-6 grid gap-x-8 gap-y-3 border-t border-border pt-5 sm:grid-cols-2">
        <div>
          <span className="font-(family-name:--font-mono) text-[0.65rem] tracking-[0.16em] text-[var(--text-muted)] uppercase">
            Composition
          </span>
          <p className="mt-1.5 text-sm leading-relaxed text-foreground">
            {CHECKER.composition}
          </p>
        </div>
        <div>
          <span className="font-(family-name:--font-mono) text-[0.65rem] tracking-[0.16em] text-[var(--text-muted)] uppercase">
            Outcome
          </span>
          <p className="mt-1.5 text-sm leading-relaxed text-foreground">
            {CHECKER.outcome}
          </p>
        </div>
      </div>
      <p className="mt-5 text-sm leading-relaxed text-[var(--text-muted)]">
        The tree above is a picture of exhaustive search, not of the algorithm.
        What it gets right is the outcome — either the property holds across
        every allowed run, or one path comes back with a trace attached.
      </p>
    </div>
  );
}
