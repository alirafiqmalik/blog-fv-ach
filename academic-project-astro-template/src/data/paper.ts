/**
 * Identity of the paper this site is about.
 *
 * Every figure here is traceable to `parsed-paper/paper.md`. The two dollar
 * amounts are the paper's own §1 numbers; the site deliberately does *not*
 * claim a payment count or a per-institution concentration statistic, because
 * the paper contains neither. `test/paper-facts.test.ts` fails if one appears.
 */

export const PAPER = {
  /** Consumer name for the three attacks, taken together. */
  exploitName: "The Phantom Funds Exploit",
  title: "Money that appears before it exists",
  paperTitle: "Provable and Operational Attacks on Banking Payment Systems",
  hook: "If your bank showed you a thousand dollars this morning, there's a chance nobody on the other end was actually charged.",
  venue: "ACM CCS 2026",
  venueCity: "The Hague",
  /** Anonymous submission — authors are withheld until the paper de-anonymises. */
  authors: "Anonymous Author(s)",
  artifact: "https://anonymous.4open.science/r/ach-model-checking-C3D1/",
} as const;

/** The scale of the thing being verified — hero counters. */
export interface ScaleFigure {
  id: string;
  /** Rendered as the counter's terminal value. */
  value: number;
  unit: string;
  label: string;
  source: string;
}

export const SCALE: readonly ScaleFigure[] = [
  {
    id: "global",
    value: 100,
    unit: "trillion USD",
    label: "moved by banking payment systems worldwide, every year",
    source: "paper.md §1 — Scale",
  },
  {
    id: "us",
    value: 30,
    unit: "trillion USD",
    label: "processed in the United States alone",
    source: "paper.md §1 — Scale",
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
