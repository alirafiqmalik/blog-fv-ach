/**
 * The ledger language, as code (docs/storyboard.md → "The recurring motif").
 *
 * Two colours carry the whole technical argument: green is a credit that
 * posted, red is a debit that failed. Every scene picks its colour by calling
 * `ledgerToken` on a beat's declared effect — never by writing a hex value or
 * reading the prose. `test/ledger-motion.test.ts` fails if a component names a
 * palette variable directly.
 *
 * Kept in a plain `.ts` module rather than a `.tsx` for the reason the template
 * always does: `node --test` cannot import a `.tsx` under type stripping, and
 * the reduced-motion branch is a property worth asserting rather than
 * describing.
 */

import type { LedgerEffect } from "../data/attacks.ts";

/** CSS custom properties, and the only place their names are written. */
export const LEDGER_TOKENS = {
  credit: "var(--ach-credit)",
  debit: "var(--ach-debit)",
  provisional: "var(--ach-provisional)",
  rail: "var(--ach-rail)",
  gap: "var(--ach-gap)",
  accent: "var(--ach-accent)",
} as const;

/** The colour a beat is drawn in, decided solely by what the ledger did. */
export function ledgerToken(effect: LedgerEffect): string {
  switch (effect) {
    case "credit":
      return LEDGER_TOKENS.credit;
    case "debit":
      return LEDGER_TOKENS.debit;
    default:
      return LEDGER_TOKENS.rail;
  }
}

/** Screen-reader text, so the colour is never the only carrier of meaning. */
export function ledgerLabel(effect: LedgerEffect): string {
  switch (effect) {
    case "credit":
      return "credit posted";
    case "debit":
      return "debit failed";
    default:
      return "no ledger movement";
  }
}

/** How long one beat takes to arrive, in seconds. */
export const BEAT_DURATION = 0.34;

/** The subset of Motion's `Transition` this site uses. */
export type BeatTransition = {
  duration: number;
  delay?: number;
  ease?: "easeOut";
};

/**
 * One state of an animated element. Opacity and translation only — animating
 * width, height or filter would repaint on every scroll frame, and a scrubbed
 * scene runs one of these per frame per element.
 */
export type BeatState = {
  opacity: number;
  x: number;
  y: number;
  transition?: BeatTransition;
};

export type BeatVariants = {
  hidden: BeatState;
  visible: BeatState;
  [state: string]: BeatState;
};

/** No motion at all — every reduced-motion transition. */
const INSTANT: BeatTransition = { duration: 0 };

/**
 * The two states an element is driven through.
 *
 * Under reduced motion the *hidden* state is already the finished element:
 * nothing is transparent and nothing is displaced before the scene starts, so
 * a reader who never scrolls sees the completed keyframe rather than a blank
 * frame waiting for a cue that will never come.
 */
export function beatVariants(
  reduced: boolean,
  offset: { x?: number; y?: number } = {},
  delay = 0,
): BeatVariants {
  if (reduced) {
    const complete: BeatState = { opacity: 1, x: 0, y: 0 };
    return { hidden: complete, visible: { ...complete, transition: INSTANT } };
  }

  return {
    hidden: { opacity: 0, x: offset.x ?? 0, y: offset.y ?? 0 },
    visible: {
      opacity: 1,
      x: 0,
      y: 0,
      transition: { duration: BEAT_DURATION, delay, ease: "easeOut" },
    },
  };
}

/**
 * The looping hero scene — the one scene on the site that plays by itself.
 *
 * Everything else is scrubbed. This returns `null` under reduced motion so the
 * caller renders the final frame and arms no loop at all; a slower loop is
 * still a loop, and that is what the preference asks us not to run.
 */
export function heroLoop(reduced: boolean): {
  duration: number;
  repeat: number;
  repeatDelay: number;
  ease: "easeInOut";
} | null {
  if (reduced) return null;
  return { duration: 3.2, repeat: Infinity, repeatDelay: 0.9, ease: "easeInOut" };
}
