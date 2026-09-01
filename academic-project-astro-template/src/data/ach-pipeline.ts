/**
 * The five-day life of a transfer — the main scrollytelling set-piece
 * (docs/storyboard.md §3), and the spine the rest of the site reuses.
 *
 * This module is the *only* copy of the pipeline. `AchPipeline.tsx` draws it,
 * the A3 attack scene runs a token along it again, and the remedies finale
 * replays it with the gap band closing. None of those may declare a second
 * timeline — `test/ach-pipeline.test.ts` fails if one appears.
 *
 * Content authority: parsed-paper/paper.md §2 (Background) and §6.1.
 */

/** The five ACH participants, left to right, as the paper names them. */
export const PARTICIPANTS = [
  { id: "originator", short: "You", label: "Originator" },
  { id: "odfi", short: "Your bank", label: "ODFI" },
  { id: "operator", short: "The rails", label: "ACH Operator" },
  { id: "rdfi", short: "Their bank", label: "RDFI" },
  { id: "receiver", short: "Them", label: "Receiver" },
] as const;

export type ParticipantId = (typeof PARTICIPANTS)[number]["id"];

export interface PipelineStep {
  id: string;
  /** Banking day label shown on the counter. */
  day: string;
  title: string;
  /** The caption that carries the point if the animation never runs. */
  caption: string;
  /** Which participant is acting. The token sits here. */
  at: ParticipantId;
  /** True once the ODFI has posted the provisional credit. */
  credited?: boolean;
  /** True while the shaded gap band is open. */
  gap?: boolean;
  /** True once the RDFI has applied access control. */
  checked?: boolean;
  /** True while the return window is the thing being described. */
  returnWindow?: boolean;
}

export const PIPELINE_STEPS: readonly PipelineStep[] = [
  {
    id: "submit",
    day: "Day 0",
    title: "You ask for the money",
    caption:
      "You tell your bank to pull $1,000 from an account at another bank. You supply a routing number and an account number.",
    at: "originator",
  },
  {
    id: "routing",
    day: "Day 0",
    title: "Your bank checks the format",
    caption:
      "Your bank validates the routing number, the account number and the record format. It does not ask the other bank anything.",
    at: "odfi",
  },
  {
    id: "batch",
    day: "Day 0",
    title: "The entry waits for the batch",
    caption:
      "Entries accumulate until the collection window closes, usually once a business day. Initiation and settlement are now separate events.",
    at: "odfi",
  },
  {
    id: "provisional",
    day: "Day 1",
    title: "The money appears",
    caption:
      "Your bank posts a provisional credit. Your balance goes up and the funds become spendable. Nothing has settled. The gap opens here.",
    at: "odfi",
    credited: true,
    gap: true,
  },
  {
    id: "inflight",
    day: "Day 1–3",
    title: "The batch is in flight",
    caption:
      "The ACH Operator routes the batch onward. The credit is spendable and the debit has not been attempted. This is the exploitation window.",
    at: "operator",
    credited: true,
    gap: true,
  },
  {
    id: "access-control",
    day: "Day 3",
    title: "The other bank finally checks",
    caption:
      "The other bank is the first party in the chain to ask whether that account actually permits the debit. Days after your bank already decided.",
    at: "rdfi",
    credited: true,
    gap: true,
    checked: true,
  },
  {
    id: "return-window",
    day: "Day 2–5",
    title: "The return window",
    caption:
      "If the debit fails, a return code comes back — R16 if the account is blocked for debits — and the credit is clawed back. Settlement is this window closing empty.",
    at: "receiver",
    credited: true,
    gap: true,
    checked: true,
    returnWindow: true,
  },
] as const;

/**
 * Return codes the site names. Both are the codes the paper's counterexamples
 * and empirical traces actually produced — not a general list.
 */
export const RETURN_CODES = [
  { code: "R16", meaning: "Account frozen / blocked for debits" },
  { code: "R08", meaning: "Payment stopped" },
] as const;

/** The three ways a consumer links an external account (paper.md §2). */
export const LINKING_METHODS = [
  {
    id: "manual",
    name: "Manual link",
    detail: "Type in the routing and account numbers. Off a cheque, if you like.",
  },
  {
    id: "web-login",
    name: "Web login",
    detail:
      "Authenticate at the external bank's own portal, often through an aggregator such as Plaid.",
  },
  {
    id: "micro-deposit",
    name: "Micro-deposits",
    detail:
      "Two credits under a dollar land in the account; you report the amounts back to prove you own it.",
  },
] as const;
