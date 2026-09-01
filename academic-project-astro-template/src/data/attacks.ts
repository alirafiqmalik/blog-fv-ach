/**
 * Three variations of the Phantom Funds Exploit
 * (parsed-paper/paper.md §6).
 *
 * All three scenes share one component (`AttackScene.tsx`). They differ only
 * in the data they hand it. Ledger discipline: every beat declares whether it
 * is a credit that posted (`credit`), a debit that failed (`debit`), or
 * neither. The component picks the colour from that flag alone.
 */

import type { InvariantId } from "./invariants.ts";

export type AttackId = "a1" | "a2" | "a3";

/** What the ledger did on this beat. Drives the colour, exclusively. */
export type LedgerEffect = "credit" | "debit" | "neutral";

export interface AttackBeat {
  id: string;
  /** Banking-day label, or a loop marker. */
  day: string;
  /** One short declarative sentence. */
  text: string;
  effect: LedgerEffect;
  /** Running balance at the attacker's institution, in whole dollars. */
  attacker?: number;
  /** Running balance at the target account. Never moves, in all three. */
  target?: number;
  /** A return code stamped on this beat, if one arrived. */
  stamp?: string;
  /** Marks the beat where the loop restarts. */
  loop?: boolean;
}

export interface Attack {
  id: AttackId;
  /** 01 / 02 / 03 — scan labels, not paper codes. */
  tag: string;
  name: string;
  invariant: InvariantId;
  /** Lead paragraph — the most concrete sentence available, first. */
  lede: string;
  /** The beats, scrubbed by scroll. */
  beats: readonly AttackBeat[];
  /** Four cells of the consumer summary table. */
  summary: {
    whatYouSee: string;
    theTrick: string;
    thePayoff: string;
    impact: string;
  };
  rootCause: string;
  structuralGap: string;
  /** The permissive condition that lets it through, and where it comes from. */
  nacha: { text: string; source: string };
  /** Counter labels under the running balances. */
  counters: { attacker: string; target: string };
  /** Figures from the paper that evidence it. */
  figures: readonly string[];
}

export const ATTACKS: readonly Attack[] = [
  {
    id: "a1",
    tag: "01",
    name: "Fake Authorization",
    invariant: "phi1",
    lede: "Your bank lets you link an account at another bank by typing in a routing number and an account number. That is the whole check. Those numbers are printed on the front of every cheque.",
    beats: [
      {
        id: "link",
        day: "Day 0",
        text: "We link a locked account we own at Bank B, using only its routing and account numbers.",
        effect: "neutral",
        attacker: 1401,
        target: 1000,
      },
      {
        id: "submit",
        day: "Day 0",
        text: "We ask Bank A to pull $1,000 from it. Bank A checks that the numbers look valid, and accepts.",
        effect: "neutral",
        attacker: 1401,
        target: 1000,
      },
      {
        id: "provisional",
        day: "Day 1",
        text: "Bank A posts a provisional credit. Bank B has not been asked anything.",
        effect: "credit",
        attacker: 2401,
        target: 1000,
      },
      {
        id: "spendable",
        day: "Day 3",
        text: "Bank A makes the funds spendable. The debit has still not been attempted.",
        effect: "credit",
        attacker: 2401,
        target: 1000,
      },
      {
        id: "blocked",
        day: "Day 3",
        text: "Bank B checks for the first time. The account is locked for withdrawals. Nothing moves.",
        effect: "debit",
        attacker: 2401,
        target: 1000,
      },
      {
        id: "return",
        day: "Day 5",
        text: "Bank B sends the transfer back. Bank A reverses the credit — days after the money could have gone.",
        effect: "debit",
        attacker: 1401,
        target: 1000,
        stamp: "R16 — account blocked for debits",
      },
      {
        id: "repeat",
        day: "Again",
        text: "Repeat, and another $1,000 becomes spendable. The locked account's balance never moves.",
        effect: "credit",
        attacker: 3401,
        target: 1000,
        loop: true,
      },
    ],
    summary: {
      whatYouSee: "Money appears after you type two numbers",
      theTrick: "Link a locked account",
      thePayoff: "Spend funds nobody was charged",
      impact: "Provisional cash you can spend for days",
    },
    rootCause:
      "Your bank checks only that the routing and account numbers look valid. It then shows you the money, assuming the other bank will pay. The lock is discovered only when the other bank refuses, days later.",
    structuralGap:
      "Banks cannot ask each other, in real time, whether an account is locked. Your bank commits the money first and finds out only when a return arrives.",
    nacha: {
      text: "An Originator of a debit WEB Entry must establish and implement commercially reasonable methods of authentication to verify the identity of the Receiver of the debit WEB Entry.",
      source: "Nacha Operating Rules, Article 2, Subsection 2.5.17.5",
    },
    counters: {
      attacker: "Spendable at Bank A",
      target: "Balance at Bank B",
    },
    figures: ["Figure 4", "Figure 5"],
  },
  {
    id: "a2",
    tag: "02",
    name: "Micro-Deposit Trap",
    invariant: "phi2",
    lede: "To link your bank account, an app sends two deposits under a dollar. You report the amounts back. That proves you own the account — and then the app tries to take its money back.",
    beats: [
      {
        id: "link",
        day: "Day 0",
        text: "We link a bank account that accepts deposits and blocks withdrawals. ACH permits exactly that setup.",
        effect: "neutral",
        attacker: 0,
        target: 0,
      },
      {
        id: "deposit",
        day: "Day 0",
        text: "The app sends two micro-deposits. Both land. The account is marked linked.",
        effect: "credit",
        attacker: 34,
        target: 0,
      },
      {
        id: "reclaim",
        day: "Day 1–3",
        text: "The app tries to take the cents back. Both withdrawals fail.",
        effect: "debit",
        attacker: 34,
        target: 0,
        stamp: "R08 / R16 — debit refused",
      },
      {
        id: "restart",
        day: "Restart",
        text: "We cancel verification and start again. There is no rate limit.",
        effect: "neutral",
        attacker: 34,
        target: 0,
        loop: true,
      },
      {
        id: "accumulate",
        day: "Each cycle",
        text: "Every restart sends new cents. None of the old ones come back.",
        effect: "credit",
        attacker: 68,
        target: 0,
      },
    ],
    summary: {
      whatYouSee: "Tiny deposits land and never leave",
      theTrick: "An account that takes deposits but blocks withdrawals",
      thePayoff: "Verification cents on a loop",
      impact: "Credits that cannot be reclaimed",
    },
    rootCause:
      "The flow treats a successful deposit as proof that a withdrawal will work too. It does not. Apps also let you restart verification with no limit, so each reset sends new money and recovers none of the old.",
    structuralGap:
      "There is no way to ask, in advance, whether an account allows withdrawals. Apps find out only by sending a real debit and watching it bounce.",
    nacha: {
      text: "The ODFI must utilize a commercially reasonable method to verify the identity of an Originator or Third-Party Sender at the time the ODFI enters into an Origination Agreement with the Originator or Third-Party Sender.",
      source: "Nacha Operating Rules, Article 2, Subsection 2.2.1",
    },
    counters: {
      attacker: "Accumulated in cents",
      target: "Recovered by the provider",
    },
    figures: ["Figure 7a", "Figure 7b"],
  },
  {
    id: "a3",
    tag: "03",
    name: "Credit Line Mirage",
    invariant: "phi3",
    lede: "You pay your credit-card bill from your bank account. Two days later the card says paid, balance zero, full limit restored. The bank has not sent the money yet.",
    beats: [
      {
        id: "pay",
        day: "Day 0",
        text: "We pay a card in full from a bank account we have locked for withdrawals.",
        effect: "neutral",
        attacker: 0,
        target: 0,
      },
      {
        id: "pending",
        day: "Day 0–2",
        text: "The issuer says the payment takes a couple of days, and that the limit updates once it posts.",
        effect: "neutral",
        attacker: 0,
        target: 0,
      },
      {
        id: "posted",
        day: "Day 2",
        text: "The issuer posts internally: balance zero, full credit limit restored. The bank transfer is still in flight.",
        effect: "credit",
        attacker: 16500,
        target: 0,
      },
      {
        id: "spend",
        day: "Day 2",
        text: "We spend against the restored limit. Nothing has settled at either institution.",
        effect: "credit",
        attacker: 16500,
        target: 0,
      },
      {
        id: "repeat",
        day: "Again",
        text: "Schedule another payment, wait for posting, and the available credit goes up again.",
        effect: "credit",
        attacker: 33000,
        target: 0,
        loop: true,
      },
      {
        id: "return",
        day: "Day 6",
        text: "The bank sends the payment back. The spending has already happened, and no interest was charged for the days the restored credit was in use.",
        effect: "debit",
        attacker: 0,
        target: 0,
        stamp: "Returned — restricted account",
      },
    ],
    summary: {
      whatYouSee: "The card says paid in two days",
      theTrick: "Pay the card from a locked account",
      thePayoff: "Instantly restored credit limit",
      impact: "Spend on a payment that never arrives",
    },
    rootCause:
      "The card issuer treats its own bookkeeping as the real payment. It restores your limit days before the bank has sent the money. When the transfer later bounces, the spending has already happened.",
    structuralGap:
      "There is no way for a card issuer to ask whether a bank transfer has actually settled. It finds out only when a return arrives — or when the window closes empty.",
    nacha: {
      text: "The deadline is the “opening of business” on the second Banking Day — which is not defined by a specific time of day and varies by DFI operations.",
      source: "Nacha Operating Rules, Section 3.8 (as catalogued in Table 2, U2)",
    },
    counters: {
      attacker: "Available credit",
      target: "Funds actually received",
    },
    figures: ["Figure 8a", "Figure 8b", "Figure 8c", "Figure 8d"],
  },
] as const;

export function attackById(id: AttackId): Attack {
  const found = ATTACKS.find((a) => a.id === id);
  if (!found) throw new Error(`unknown attack ${id}`);
  return found;
}
