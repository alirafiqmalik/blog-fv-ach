/**
 * Identity of the paper this site is about.
 *
 * Figures and counts come from the camera-ready PDF, recorded in
 * `parsed-paper/paper.md`. The scale counters are the 2025 ACH payment counts
 * in §1 (30.7 billion at the top 50; 20 billion at four banks). The earlier
 * draft's $100 trillion / $30 trillion figures are not in the camera-ready
 * and must not appear in the copy.
 */

export const PAPER = {
  /** Short masthead line. The full title is this plus `paperTitle`. */
  title: "Credit Without Debit",
  paperTitle: "Formal Verification of Banking Payment Systems",
  fullTitle: "Credit Without Debit: Formal Verification of Banking Payment Systems",
  hook: "A formal model of U.S. ACH payments, and three Credit-Without-Debit instances we reproduced and then watched get fixed.",
  venue: "ACM CCS 2026",
  venueCity: "The Hague",
  venueDates: "15–19 November 2026",
  authors: "Ali Hamza Malik and Muhammad Taqi Raza",
  /** Camera-ready DOI. The ACM DL page was not live when this site was updated. */
  doi: "https://doi.org/10.1145/3830454.3846614",
  artifact: "https://doi.org/10.5281/zenodo.22701199",
} as const;

/** The scale of the network being verified — hero counters. Camera-ready §1. */
export interface ScaleFigure {
  id: string;
  /** Rendered as the counter's terminal value. */
  value: number;
  /** Digits after the decimal. `0` renders an integer. */
  decimals: number;
  suffix: string;
  label: string;
  source: string;
}

export const SCALE: readonly ScaleFigure[] = [
  {
    id: "top50",
    value: 30.7,
    decimals: 1,
    suffix: "billion",
    label: "ACH payments the top 50 U.S. institutions processed in 2025",
    source: "camera-ready §1",
  },
  {
    id: "four",
    value: 20,
    decimals: 0,
    suffix: "billion",
    label: "of those payments, concentrated at four major banks",
    source: "camera-ready §1",
  },
] as const;

/** The scoping numbers behind the Nacha rules funnel (paper.md §3.2). */
export const RULEBOOK = {
  pages: 728,
  secCodes: 25,
  returnCodes: 87,
  notificationCodes: 14,
} as const;

/** The empirical footprint (paper.md §5.2 — Validation setup). */
export const VALIDATION_SAMPLE = [
  {
    id: "banks",
    count: 2,
    label: "checking accounts at two major U.S. banks",
    note: "one active, one dormant — the dormant one is the A1 target",
  },
  {
    id: "cards",
    count: 3,
    label: "credit-card accounts",
    note: "the A3 issuers",
  },
  {
    id: "providers",
    count: 3,
    label: "third-party payment provider accounts",
    note: "the A2 providers, anonymised as A, B and C",
  },
] as const;
