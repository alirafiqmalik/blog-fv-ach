/**
 * Disclosure timeline and remedies (parsed-paper/paper.md §7 and Ethics).
 *
 * The dates are the paper's, absolute, and the status of each attack at each
 * milestone is what the horizontal timeline scrubs through. `test/content.test.ts`
 * checks the milestones stay in chronological order and that every attack ends
 * resolved — the section's whole claim is that the system changed.
 */

import type { AttackId } from "./attacks.ts";
import type { InvariantId } from "./invariants.ts";

export type AttackStatus = "viable" | "fixed";

export interface Milestone {
  id: string;
  /** ISO date, for ordering. Undated follow-up uses the preceding milestone. */
  date: string;
  label: string;
  headline: string;
  detail: string;
  /** Status of each attack as of this milestone. */
  status: Record<AttackId, AttackStatus>;
}

export const MILESTONES: readonly Milestone[] = [
  {
    id: "disclosed",
    date: "2025-04-16",
    label: "16 April 2025",
    headline: "Disclosed to every affected institution",
    detail:
      "Filed through every official portal. Reproduction steps. Proof-of-concept screenshots. Technical reports. No back channels.",
    status: { a1: "viable", a2: "viable", a3: "viable" },
  },
  {
    id: "acknowledged",
    date: "2025-04-30",
    label: "Then",
    headline: "Acknowledged, under internal review",
    detail:
      "We sent more evidence. They confirmed the reports were in — and under review. All three attacks were still live.",
    status: { a1: "viable", a2: "viable", a3: "viable" },
  },
  {
    id: "may",
    date: "2025-05-31",
    label: "May 2025",
    headline: "Two of the three variations no longer worked",
    detail:
      "Follow-up testing could no longer land Fake Authorization or the Credit Line Mirage. The Micro-Deposit Trap was still viable.",
    status: { a1: "fixed", a2: "viable", a3: "fixed" },
  },
  {
    id: "december",
    date: "2025-12-31",
    label: "December 2025",
    headline: "The micro-deposit trap still worked at one app",
    detail:
      "The Micro-Deposit Trap still worked — through one remaining payment app.",
    status: { a1: "fixed", a2: "viable", a3: "fixed" },
  },
  {
    id: "january",
    date: "2026-01-31",
    label: "January 2026",
    headline: "The last variation closed everywhere",
    detail:
      "The last app closed the micro-deposit loop. None of the three variations still work.",
    status: { a1: "fixed", a2: "fixed", a3: "fixed" },
  },
] as const;

export const DISCLOSURE_NOTE =
  "We never received a detailed technical response about how any of it was fixed. That is normal: legal constraints routinely limit what a financial institution can say about a vulnerability. What we got instead was the behaviour changing.";

// ----------------------------------------------------------------- remedies

export interface Remedy {
  id: string;
  title: string;
  text: string;
  /** The invariant it restores, or the underspecifications it closes. */
  invariant: InvariantId | null;
  /** Shown when the remedy targets the specification rather than a property. */
  closes?: readonly string[];
}

export const REMEDIES: readonly Remedy[] = [
  {
    id: "continuous-authorization",
    title: "Continuous authorization enforcement",
    text: "Check permission again before the money is made spendable, not only when the transfer starts. If the source account is locked in the meantime, cancel the credit.",
    invariant: "phi1",
  },
  {
    id: "delayed-exposure",
    title: "Delayed exposure of provisional credits",
    text: "Do not let people spend a credit until the other bank has actually allowed the debit. If the money has to show up early, hold it where it cannot pay a bill, restore a credit line, or leave the account.",
    invariant: "phi3",
  },
  {
    id: "zero-sum",
    title: "Explicit zero-sum enforcement across institutions",
    text: "Treat the debit and the credit as one transfer, not two books that might disagree. Nobody spends until both sides have committed.",
    invariant: "phi2",
  },
  {
    id: "symmetric-verification",
    title: "Symmetric verification in account linking",
    text: "When an app links an account with tiny deposits, it must also prove it can take that money back. A failed reclaim should fail the link, and cancelling should not send more cents.",
    invariant: "phi2",
  },
  {
    id: "specification",
    title: "Specification-level clarification",
    text: "The rulebook must say whether permission is a one-time check or an ongoing one, whether provisional credits are spendable, and how a bounced transfer shows up to the customer. Vague rules are how a compliant system still fails.",
    invariant: null,
    closes: ["U1", "U2", "U3"],
  },
] as const;
