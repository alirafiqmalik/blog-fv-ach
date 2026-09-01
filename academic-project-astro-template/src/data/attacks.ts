/**
 * The three attacks (parsed-paper/paper.md §6 and Table 1).
 *
 * All three scenes share one component (`AttackScene.tsx`) and one motion
 * module (`attack-scene-motion.ts`), so the four-beat structure the storyboard
 * insists on is enforced by construction rather than by discipline: a scene
 * that wanted a fifth beat would have to change the type.
 *
 * Ledger discipline: every beat declares whether it is a credit that posted
 * (`credit`), a debit that failed (`debit`), or neither. The component picks
 * the colour from that flag alone and never from prose.
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
  /** A1 / A2 / A3. */
  tag: string;
  name: string;
  invariant: InvariantId;
  /** The counterexample this trace corresponds to. */
  counterexample: string;
  /** Lead paragraph — the most concrete sentence available, first. */
  lede: string;
  /** The beats, scrubbed by scroll. */
  beats: readonly AttackBeat[];
  /** Table 1's four cells, verbatim in substance. */
  summary: {
    rationale: string;
    assumption: string;
    exploit: string;
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
    tag: "A1",
    name: "Authorization-as-Access-Control",
    invariant: "phi1",
    counterexample: "π₁",
    lede: "Your bank lets you link an account at another bank by typing in a routing number and an account number. That is the whole check.",
    beats: [
      {
        id: "link",
        day: "Day 0",
        text: "We link a dormant account we own at Bank B, using only its routing and account numbers.",
        effect: "neutral",
        attacker: 1401,
        target: 1000,
      },
      {
        id: "submit",
        day: "Day 0",
        text: "We submit a $1,000 ACH debit against it. Bank A validates the routing number and accepts.",
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
        text: "Bank B applies access control for the first time. The account is blocked for debits. Nothing moves.",
        effect: "debit",
        attacker: 2401,
        target: 1000,
      },
      {
        id: "return",
        day: "Day 5",
        text: "Bank B returns the entry. Bank A reverses the credit — days after the money could have gone.",
        effect: "debit",
        attacker: 1401,
        target: 1000,
        stamp: "R16 — account blocked for debits",
      },
      {
        id: "repeat",
        day: "Again",
        text: "Repeat, and another $1,000 becomes spendable. The target account balance never moves.",
        effect: "credit",
        attacker: 3401,
        target: 1000,
        loop: true,
      },
    ],
    summary: {
      rationale: "Provide immediate fund availability",
      assumption: "Routing/account format ⇒ debit capability",
      exploit: "ODFI credit without RDFI debit",
      impact: "Access funds on authorization",
    },
    rootCause:
      "The ODFI validates only routing and account number format when initiating a debit, without checking whether the target account is locked, debit-restricted, or otherwise restricted. It then grants provisional credit immediately, assuming settlement will succeed, even though actual fund transfer takes up to five days. Restriction status is discovered only when the RDFI rejects the debit during settlement.",
    structuralGap:
      "ACH provides no real-time cross-institution account-status query primitive. Its absence forces ODFIs to commit liquidity at routing-validation time and to learn restriction status only when a return code arrives during settlement.",
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
    tag: "A2",
    name: "Micro-Deposit Verification",
    invariant: "phi2",
    counterexample: "π₂",
    lede: "To link your bank account, an app sends two deposits under a dollar. You report the amounts back. That proves you own the account — and then the app takes its money back.",
    beats: [
      {
        id: "link",
        day: "Day 0",
        text: "We link a bank account that accepts credits and blocks debits. ACH permits exactly that configuration.",
        effect: "neutral",
        attacker: 0,
        target: 0,
      },
      {
        id: "deposit",
        day: "Day 0",
        text: "The provider sends two micro-deposits. Both post. The account is marked LINKED.",
        effect: "credit",
        attacker: 34,
        target: 0,
      },
      {
        id: "reclaim",
        day: "Day 1–3",
        text: "The provider submits the matching debits to reclaim the deposits. Both fail.",
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
        text: "Every cycle issues new credits and recovers none of the old ones. Credits outnumber debits, cycle after cycle.",
        effect: "credit",
        attacker: 68,
        target: 0,
      },
    ],
    summary: {
      rationale: "Simplify account linking",
      assumption: "Inbound credit ⇒ outbound debit",
      exploit: "Credit without debit",
      impact: "Repeatedly accumulate micro-deposits",
    },
    rootCause:
      "The micro-deposit flow assumes credit success implies debit capability, but debit permission is enforced only at withdrawal, after credits are already posted. Payment providers further allow verification restarts without rate limiting, which enables repeated cycles that accumulate micro-deposit credits with no corresponding debit recovery.",
    structuralGap:
      "ACH provides no pre-flight debit-capability query primitive. Its absence forces payment providers to determine whether an account permits debits only by submitting an actual debit and observing the response.",
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
    tag: "A3",
    name: "Premature Posting-as-Settlement",
    invariant: "phi3",
    counterexample: "π₃",
    lede: "You pay your credit-card bill from your bank account. Two days later the card says paid, balance zero, full limit restored. The bank has not sent the money yet.",
    beats: [
      {
        id: "pay",
        day: "Day 0",
        text: "We pay a card balance in full from a bank account we have blocked for debits.",
        effect: "neutral",
        attacker: 0,
        target: 0,
      },
      {
        id: "pending",
        day: "Day 0–2",
        text: "The issuer says the payment takes a couple of days to process, and that the limit updates once it posts.",
        effect: "neutral",
        attacker: 0,
        target: 0,
      },
      {
        id: "posted",
        day: "Day 2",
        text: "The issuer posts internally: balance zero, full credit limit restored. The ACH debit is still in flight.",
        effect: "credit",
        attacker: 16500,
        target: 0,
      },
      {
        id: "spend",
        day: "Day 2",
        text: "We spend against the restored limit. Nothing has been settled at either institution.",
        effect: "credit",
        attacker: 16500,
        target: 0,
      },
      {
        id: "repeat",
        day: "Again",
        text: "Schedule another payment, wait for posting, and the available credit goes up again. Each payment is treated independently.",
        effect: "credit",
        attacker: 33000,
        target: 0,
        loop: true,
      },
      {
        id: "return",
        day: "Day 6",
        text: "The bank returns the debit. The spending has already happened, and no interest was charged for the days the restored credit was in use.",
        effect: "debit",
        attacker: 0,
        target: 0,
        stamp: "Returned — restricted account",
      },
    ],
    summary: {
      rationale: "Shorten credit-line recovery wait",
      assumption: "Internal posting ⇒ ACH settlement",
      exploit: "Unbounded credit line",
      impact: "Spend on prematurely restored credit line",
    },
    rootCause:
      "The issuer restores the credit limit upon internal posting, treating it as settlement confirmation despite having no guarantee the underlying ACH debit will succeed. Because ACH failures surface only days later, the issuer commits to a financial state before funds are confirmed.",
    structuralGap:
      "ACH provides no proactive settlement-status query primitive. Its absence forces issuers to learn settlement only retrospectively, through the absence of a return before window closure.",
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
