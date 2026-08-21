/**
 * The hero scene (docs/storyboard.md §1).
 *
 * The one scene on this site that plays by itself rather than being scrubbed:
 * a coin travels from one bank to the other across a calendar strip, the
 * receiving side lights green as it lands, and the debit side stays grey. It
 * loops, slowly, and asks nothing of the reader.
 *
 * Under `prefers-reduced-motion` the loop is not slowed down — it is not armed
 * at all, and the scene renders its landed frame. `heroLoop()` returning null
 * is the single switch for that.
 */

import { motion, useReducedMotion } from "motion/react";

import { LEDGER_TOKENS, heroLoop } from "./ledger-motion.ts";

const DAYS = ["Day 0", "Day 1", "Day 2", "Day 3", "Day 4", "Day 5"];

/** A stylised bank. `lit` fills the roof line in the ledger token given. */
function Bank({
  x,
  label,
  sub,
  token,
  lit,
}: {
  x: number;
  label: string;
  sub: string;
  token: string;
  lit: boolean;
}) {
  return (
    <g transform={`translate(${x}, 96)`}>
      <polygon
        points="-34,-16 0,-34 34,-16"
        fill="none"
        stroke={lit ? token : LEDGER_TOKENS.rail}
        strokeWidth="1.6"
      />
      {[-22, -8, 6, 20].map((cx) => (
        <line
          key={cx}
          x1={cx}
          y1={-12}
          x2={cx}
          y2={22}
          stroke={lit ? token : LEDGER_TOKENS.rail}
          strokeWidth="1.6"
        />
      ))}
      <line
        x1={-32}
        y1={24}
        x2={32}
        y2={24}
        stroke={lit ? token : LEDGER_TOKENS.rail}
        strokeWidth="2"
      />
      <text
        y={46}
        textAnchor="middle"
        fontSize="11"
        fill="var(--foreground)"
        fontFamily="var(--font-display)"
        letterSpacing="0.04em"
      >
        {label}
      </text>
      <text
        y={62}
        textAnchor="middle"
        fontSize="9"
        fill={lit ? token : "var(--text-muted)"}
        fontFamily="var(--font-mono)"
      >
        {sub}
      </text>
    </g>
  );
}

export default function HeroScene() {
  const reduced = useReducedMotion() ?? false;
  const loop = heroLoop(reduced);

  return (
    <div className="not-prose mx-auto w-full max-w-2xl">
      <svg
        viewBox="0 0 520 200"
        className="h-auto w-full"
        role="img"
        aria-label="A payment travels from one bank to another across a five-day calendar. The receiving side lights green on arrival; the sending side stays grey, because no debit has been taken."
      >
        {/* the calendar strip the transfer runs along */}
        <line
          x1="96"
          y1="150"
          x2="424"
          y2="150"
          stroke={LEDGER_TOKENS.rail}
          strokeWidth="1"
          strokeDasharray="2 4"
          opacity="0.6"
        />
        {DAYS.map((day, i) => {
          const x = 96 + (i * (424 - 96)) / (DAYS.length - 1);
          return (
            <g key={day}>
              <line
                x1={x}
                y1="145"
                x2={x}
                y2="155"
                stroke={LEDGER_TOKENS.rail}
                strokeWidth="1"
                opacity="0.7"
              />
              <text
                x={x}
                y="171"
                textAnchor="middle"
                fontSize="8"
                fill="var(--text-muted)"
                fontFamily="var(--font-mono)"
              >
                {day}
              </text>
            </g>
          );
        })}

        {/* the rail the coin runs on */}
        <line
          x1="130"
          y1="96"
          x2="390"
          y2="96"
          stroke={LEDGER_TOKENS.rail}
          strokeWidth="1"
          opacity="0.45"
        />

        <Bank
          x={96}
          label="Their bank"
          sub="no debit taken"
          token={LEDGER_TOKENS.rail}
          lit={false}
        />
        <Bank
          x={424}
          label="Your bank"
          sub="credit posted"
          token={LEDGER_TOKENS.credit}
          lit
        />

        {/* the coin. A loop, not a scrub — and under reduced motion, landed. */}
        <motion.g
          initial={loop ? { x: 130, opacity: 0 } : false}
          animate={loop ? { x: [130, 390], opacity: [0, 1, 1, 0] } : { x: 390, opacity: 1 }}
          transition={loop ?? { duration: 0 }}
        >
          <circle
            cy="96"
            r="9"
            fill="none"
            stroke={LEDGER_TOKENS.provisional}
            strokeWidth="1.6"
          />
          <text
            y="100"
            textAnchor="middle"
            fontSize="9"
            fill={LEDGER_TOKENS.provisional}
            fontFamily="var(--font-mono)"
          >
            $
          </text>
        </motion.g>

        <text
          x="260"
          y="72"
          textAnchor="middle"
          fontSize="9"
          fill="var(--text-muted)"
          fontFamily="var(--font-mono)"
          letterSpacing="0.08em"
        >
          provisional credit
        </text>
      </svg>
    </div>
  );
}
