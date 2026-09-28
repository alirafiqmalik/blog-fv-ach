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
      "Filed through each institution's official responsible-disclosure portal, with detailed reproduction steps, proof-of-concept demonstrations with screenshots, and technical reports.",
    status: { a1: "viable", a2: "viable", a3: "viable" },
  },
  {
    id: "acknowledged",
    date: "2025-04-30",
    label: "Then",
    headline: "Acknowledged, under internal review",
    detail:
      "We supplied additional evidence and received confirmation that the reports had been received and were under internal review.",
    status: { a1: "viable", a2: "viable", a3: "viable" },
  },
  {
    id: "may",
    date: "2025-05-31",
    label: "May 2025",
    headline: "A1 and A3 no longer reproducible",
    detail:
      "Follow-up testing could no longer reproduce creditBLEED or creditRESET. creditMINT remained viable.",
    status: { a1: "fixed", a2: "viable", a3: "fixed" },
  },
  {
    id: "december",
    date: "2025-12-31",
    label: "December 2025",
    headline: "A2 survives at one provider",
    detail:
      "creditMINT was still exploitable through one affected third-party payment provider.",
    status: { a1: "fixed", a2: "viable", a3: "fixed" },
  },
  {
    id: "january",
    date: "2026-01-31",
    label: "January 2026",
    headline: "A2 resolved everywhere",
    detail:
      "All affected payment providers had resolved creditMINT. None of the three instances reproduce.",
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
    text: "Treat authorization as a persistent predicate, not a one-time check at initiation. Any change in the debit eligibility of the source account during the settlement window should invalidate the transaction and revoke the provisional credit. Revalidate at posting, and again before settlement is final.",
    invariant: "phi1",
  },
  {
    id: "delayed-exposure",
    title: "Delayed exposure of provisional credits",
    text: "User-visible balances should not reflect provisional credits until the corresponding debit has passed an enforceable access-control point. Where early availability is necessary, hold the credit in an isolated state that cannot fund withdrawals, transfers, bill payments or credit-line restoration.",
    invariant: "phi3",
  },
  {
    id: "zero-sum",
    title: "Explicit zero-sum enforcement across institutions",
    text: "Enforce the cross-institution zero-sum invariant throughout execution, not only at final reconciliation. Track the debit and the credit as a single logical transfer, and withhold user access until both sides reach a committed state.",
    invariant: "phi2",
  },
  {
    id: "symmetric-verification",
    title: "Symmetric verification in account linking",
    text: "Micro-deposit linking must verify outbound debit capability as well as inbound credit acceptance before the account is usable. Treat a failed debit recovery as a verification failure, and stop reissuing credits for canceled or retried attempts.",
    invariant: "phi2",
  },
  {
    id: "specification",
    title: "Specification-level clarification",
    text: "Payment network standards must say whether authorization is ongoing or a one-time event, whether provisional credits are user-visible, and how settlement failures surface in user-visible state. Underspecification is what allows protocol-compliant but insecure executions.",
    invariant: null,
    closes: ["U1", "U2", "U3"],
  },
] as const;
