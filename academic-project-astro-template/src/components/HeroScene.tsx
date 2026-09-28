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
    <g transform={`translate(${x}, 108)`}>
      <polygon
        points="-42,-20 0,-42 42,-20"
        fill="none"
        stroke={lit ? token : LEDGER_TOKENS.rail}
        strokeWidth="1.8"
      />
      {[-26, -9, 8, 25].map((cx) => (
        <line
          key={cx}
          x1={cx}
          y1={-14}
          x2={cx}
          y2={28}
          stroke={lit ? token : LEDGER_TOKENS.rail}
          strokeWidth="1.7"
        />
      ))}
      <line
        x1={-40}
        y1={30}
        x2={40}
        y2={30}
        stroke={lit ? token : LEDGER_TOKENS.rail}
        strokeWidth="2.2"
      />
      {lit && (
        <ellipse
          cx="0"
          cy="4"
          rx="48"
          ry="22"
          fill={token}
          opacity="0.08"
        />
      )}
      <text
        y={54}
        textAnchor="middle"
        fontSize="13"
        fill="var(--foreground)"
        fontFamily="var(--font-display)"
        letterSpacing="0.04em"
      >
        {label}
      </text>
      <text
        y={72}
        textAnchor="middle"
        fontSize="11"
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
    <div className="scene-stage not-prose mx-auto w-full max-w-3xl px-4 py-8 sm:px-8 sm:py-10">
      <p className="mb-6 text-center font-(family-name:--font-mono) text-[0.68rem] tracking-[0.22em] text-[var(--text-muted)] uppercase">
        A credit in flight · nobody debited
      </p>
      <svg
        viewBox="0 0 560 248"
        className="h-auto w-full"
        role="img"
        aria-label="A payment travels from one bank to another across a five-day calendar. The receiving side lights green on arrival; the sending side stays grey, because no debit has been taken."
      >
        {/* the calendar strip the transfer runs along */}
        <line
          x1="56"
          y1="210"
          x2="504"
          y2="210"
          stroke={LEDGER_TOKENS.rail}
          strokeWidth="1"
          strokeDasharray="2 4"
          opacity="0.55"
        />
        {DAYS.map((day, i) => {
          const x = 56 + (i * (504 - 56)) / (DAYS.length - 1);
          return (
            <g key={day}>
              <line
                x1={x}
                y1="204"
                x2={x}
                y2="216"
                stroke={LEDGER_TOKENS.rail}
                strokeWidth="1"
                opacity="0.7"
              />
              <text
                x={x}
                y="232"
                textAnchor="middle"
                fontSize="10"
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
          y1="108"
          x2="430"
          y2="108"
          stroke={LEDGER_TOKENS.rail}
          strokeWidth="1.2"
          opacity="0.4"
        />

        <Bank
          x={96}
          label="Their bank"
          sub="no debit taken"
          token={LEDGER_TOKENS.rail}
          lit={false}
        />
        <Bank
          x={464}
          label="Your bank"
          sub="debit not asked"
          token={LEDGER_TOKENS.rail}
          lit={false}
        />
        {/* Lights only once the coin has landed. Reduced motion stays on the landed frame. */}
        <motion.g
          initial={loop ? { opacity: 0 } : false}
          animate={loop ? { opacity: [0, 0, 1, 0] } : { opacity: 1 }}
          transition={
            loop ? { ...loop, times: [0, 0.62, 0.84, 1] } : { duration: 0 }
          }
        >
          <Bank
            x={424}
            label="Your bank"
            sub="credit posted"
            token={LEDGER_TOKENS.credit}
            lit
          />
        </motion.g>

        {/* Day marker on the calendar, in step with the coin. */}
        <motion.circle
          cy="180"
          r="3.5"
          fill={LEDGER_TOKENS.provisional}
          initial={loop ? { x: 56, opacity: 0 } : false}
          animate={
            loop
              ? { x: [56, 464], opacity: [0, 1, 1, 0] }
              : { x: 464, opacity: 1 }
          }
          transition={loop ?? { duration: 0 }}
        />

        {/* the coin. A loop, not a scrub — and under reduced motion, landed. */}
        <motion.g
          initial={loop ? { x: 130, opacity: 0 } : false}
          animate={loop ? { x: [130, 430], opacity: [0, 1, 1, 0] } : { x: 430, opacity: 1 }}
          transition={loop ?? { duration: 0 }}
        >
          <circle
            cy="108"
            r="13"
            fill="var(--background)"
            stroke={LEDGER_TOKENS.provisional}
            strokeWidth="1.8"
          />
          <text
            y="112"
            textAnchor="middle"
            fontSize="13"
            fill={LEDGER_TOKENS.provisional}
            fontFamily="var(--font-mono)"
            fontWeight="600"
          >
            $
          </text>
        </motion.g>

        <text
          x="280"
          y="82"
          textAnchor="middle"
          fontSize="11"
          fill="var(--text-muted)"
          fontFamily="var(--font-mono)"
          letterSpacing="0.16em"
        >
          PROVISIONAL CREDIT
        </text>
      </svg>
    </div>
  );
}
