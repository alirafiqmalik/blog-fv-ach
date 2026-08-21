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
 * Build a fixed binary-ish tree. The surviving trace is the run of branches
 * whose index is on `TRACE`, chosen once so the shape is stable across renders.
 */
function buildTree(): Branch[] {
  const branches: Branch[] = [];
  const levels = 4;
  const spread = 46;
  let frontier = [{ x: 50, y: 6, trace: true }];

  for (let depth = 0; depth < levels; depth += 1) {
    const next: typeof frontier = [];
    const dy = 15;
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

export default function CheckerSearch() {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion() ?? false;
  const inView = useInView(ref, { once: true, amount: 0.3 });
  const armed = inView || reduced;

  return (
    <div ref={ref} className="not-prose my-10">
      <svg viewBox="0 0 100 78" className="h-auto w-full" aria-hidden="true">
        <circle cx="50" cy="6" r="1.4" fill={LEDGER_TOKENS.accent} />
        <text
          x="50"
          y="3"
          textAnchor="middle"
          fontSize="2"
          fill="var(--text-muted)"
          fontFamily="var(--font-mono)"
        >
          initial state
        </text>

        {TREE.map((branch) => (
          <motion.line
            key={branch.id}
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
            strokeWidth={branch.onTrace ? 0.55 : 0.28}
            variants={beatVariants(
              reduced,
              {},
              branch.depth * BEAT_DURATION * 0.75,
            )}
            initial="hidden"
            animate={armed ? "visible" : "hidden"}
            opacity={branch.dead ? 0.45 : 1}
          />
        ))}

        {/* the terminating stamp */}
        <motion.g
          variants={beatVariants(reduced, { y: 4 }, 4 * BEAT_DURATION * 0.75)}
          initial="hidden"
          animate={armed ? "visible" : "hidden"}
        >
          <rect
            x={TIP.x2 - 18}
            y={TIP.y2 + 3}
            width="36"
            height="8"
            rx="1"
            fill="none"
            stroke={LEDGER_TOKENS.debit}
            strokeWidth="0.5"
          />
          <text
            x={TIP.x2}
            y={TIP.y2 + 8.4}
            textAnchor="middle"
            fontSize="3"
            fill={LEDGER_TOKENS.debit}
            fontFamily="var(--font-mono)"
            letterSpacing="0.1"
          >
            COUNTEREXAMPLE
          </text>
        </motion.g>
      </svg>

      <div className="mt-6 grid gap-x-8 gap-y-3 border-t border-border pt-5 sm:grid-cols-2">
        <div>
          <span className="font-(family-name:--font-mono) text-xs tracking-wider text-[var(--text-muted)] uppercase">
            Checker
          </span>
          <p className="mt-1 text-sm text-foreground">
            {CHECKER.tool} — {CHECKER.spec} over {CHECKER.engine}
          </p>
        </div>
        <div>
          <span className="font-(family-name:--font-mono) text-xs tracking-wider text-[var(--text-muted)] uppercase">
            Composition
          </span>
          <p className="mt-1 text-sm text-foreground">{CHECKER.composition}</p>
        </div>
      </div>
      <p className="mt-4 text-sm text-[var(--text-muted)]">
        The tree above is a picture of exhaustive search, not of the algorithm:
        IC3/PDR works backwards from the property rather than forwards from the
        initial state. What the picture gets right is the outcome — either the
        invariant holds across every reachable state, or one path comes back with
        a trace attached.
      </p>
    </div>
  );
}
