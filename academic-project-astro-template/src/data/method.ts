/**
 * The method — from 728 pages of rules to a machine (paper.md §3–§5.2).
 *
 * Four scenes read this module: the rules funnel, the model graph with its
 * adversary, the invariant cards (which live in `invariants.ts`, because §8
 * reuses them), and the model-checker search.
 */

import { RULEBOOK } from "./paper.ts";

// ------------------------------------------------------------- rules funnel

export interface FunnelStage {
  id: string;
  headline: string;
  detail: string;
  /** Relative width of the stage, 1 = widest. Drives the funnel geometry. */
  width: number;
  /** Counted facts shown alongside the stage. */
  facts: readonly { value: string; label: string }[];
}

export const FUNNEL: readonly FunnelStage[] = [
  {
    id: "rules",
    headline: "The Nacha Operating Rules",
    detail:
      "The rules for one payment are scattered across sections and appendices. You cannot check every page by hand, so we did not try.",
    width: 1,
    facts: [
      { value: String(RULEBOOK.pages), label: "pages" },
      { value: String(RULEBOOK.secCodes), label: "SEC codes" },
      { value: String(RULEBOOK.returnCodes), label: "return codes" },
      { value: String(RULEBOOK.notificationCodes), label: "change notices" },
    ],
  },
  {
    id: "scope",
    headline: "Scoped to the consumer path",
    detail:
      "Domestic consumer ACH, started on the internet: a credit-card bill, an account link, a payment app. That is where the volume is. That is where the fraud is.",
    width: 0.62,
    facts: [
      { value: "WEB", label: "one-time internet entries" },
      { value: "PPD", label: "recurring entries" },
    ],
  },
  {
    id: "fsms",
    headline: "Five players in every transfer",
    detail:
      "You, your bank, the rails, their bank, and them. The simulator tries every behavior the rules allow — including the ones the rules never quite define.",
    width: 0.34,
    facts: [
      { value: "5", label: "players" },
      { value: "1", label: "simulator" },
    ],
  },
] as const;

// -------------------------------------------------------------- model graph

/**
 * Node positions, in the `0 0 100 56` viewBox `ModelGraph.tsx` draws into.
 *
 * One row, in ACH order, matching the pipeline in §3 — the reader has already
 * learned this left-to-right arrangement, and re-teaching it as a zigzag would
 * spend that for nothing. `C_$` is drawn below the row because it is the
 * channel that moves later.
 */
export const MODEL_NODES = [
  { id: "O", label: "Originator", role: "O", x: 10, y: 16 },
  { id: "BO", label: "ODFI", role: "BO", x: 30, y: 16 },
  { id: "A", label: "ACH Operator", role: "A", x: 50, y: 16 },
  { id: "BR", label: "RDFI", role: "BR", x: 70, y: 16 },
  { id: "R", label: "Receiver", role: "R", x: 90, y: 16 },
] as const;

export type ChannelId = "info" | "dollar";

export const CHANNELS: readonly {
  id: ChannelId;
  label: string;
  symbol: string;
  detail: string;
}[] = [
  {
    id: "info",
    label: "Instructions",
    symbol: "C_info",
    detail:
      "Payment instructions, acknowledgments and settlement data. Originator ↔ ODFI ↔ Operator ↔ RDFI. The messages that go first.",
  },
  {
    id: "dollar",
    label: "Money",
    symbol: "C_$",
    detail: "The channel that actually moves money — and it moves later.",
  },
] as const;

export const MODEL_EDGES = [
  { from: "O", to: "BO", channel: "info" as ChannelId },
  { from: "BO", to: "A", channel: "info" as ChannelId },
  { from: "A", to: "BR", channel: "info" as ChannelId },
  { from: "BR", to: "R", channel: "info" as ChannelId },
  { from: "BO", to: "BR", channel: "dollar" as ChannelId },
] as const;

/** The bounds that keep the state space finite (paper.md §4.1). */
export const MODEL_BOUNDS = [
  "each Originator initiates at most two transactions",
  "each batch contains at most three entries",
  "three batch processing windows per verification run",
] as const;

// ---------------------------------------------------------- threat model

export interface Capability {
  id: string;
  short: string;
  text: string;
}

export const CAPABILITIES: readonly Capability[] = [
  {
    id: "C-1",
    short: "Real accounts",
    text: "The adversary controls legitimate bank accounts at U.S. financial institutions, opened through standard procedures, and may act as Originator, Receiver, or both.",
  },
  {
    id: "C-2",
    short: "Off a cheque",
    text: "The adversary can obtain routing and account numbers from public sources — the front of a cheque — or from data breaches. No online banking credentials are needed.",
  },
  {
    id: "C-3",
    short: "Ordinary apps",
    text: "The adversary initiates or receives ACH transactions through consumer interfaces, choosing the payment type, SEC code, account type and amount.",
  },
  {
    id: "C-4",
    short: "A debit block",
    text: "The adversary can modify accounts under their own control using standard banking features: holds, closures, and debit blocks.",
  },
] as const;

// ------------------------------------------------------- underspecification

export interface Underspecification {
  id: string;
  title: string;
  /** The problem in one sentence. */
  problem: string;
  /** Verbatim rule text, where the paper quotes it. */
  quote?: string;
  quoteSource?: string;
  /** How the model resolved it. */
  resolution: string;
}

export const UNDERSPECIFICATIONS: readonly Underspecification[] = [
  {
    id: "U1",
    title: "Undefined authentication standards",
    problem:
      "Two procedures with very different trust requirements — authorizing an Originator to debit someone's account, and establishing a Third-Party Sender agreement — rest on the same undefined standard.",
    quote:
      "An Originator of a debit WEB Entry must establish and implement commercially reasonable methods of authentication to verify the identity of the Receiver of the debit WEB Entry.",
    quoteSource: "Article 2, Subsection 2.5.17.5",
    resolution:
      "We surveyed what institutions actually deploy — manual link, web login, micro-deposits — and put all three in the model, chosen non-deterministically, so the checker explores every authentication path the rules permit.",
  },
  {
    id: "U2",
    title: "Temporal definition ambiguities",
    problem:
      "Deadlines are written as “reasonable opportunity”, “promptly”, and “opening of business”. Banking Day is defined twice, in ways that disagree when an institution closes but the Operator does not.",
    quote:
      "with reference to a Participating DFI, any day on which such Participating DFI is open to the public during any part of such day for carrying on substantially all of its banking functions, and, with reference to an ACH Operator, any day on which the applicable facility of such ACH Operator is being operated.",
    quoteSource: "Article 8, Section 8.15",
    resolution:
      "All participants share one calendar and time zone, and subjective deadlines become a deterministic rule: an action started before end-of-day completes that Banking Day, otherwise it completes at the start of the next one.",
  },
  {
    id: "U3",
    title: "Conflicting error conditions",
    problem:
      "Appendix 2 Part 2.4 says a batch will be rejected for an invalid transaction code or a non-numeric amount. Part 2.5 says R19 and R36 will never cause a rejection. Both are in the same rulebook.",
    resolution:
      "Because the specification does not fix the correct behaviour, we model both variants. The same policy applies anywhere the rules say “may” or “should”, as long as no variant is evidently insecure.",
  },
] as const;

/** The five timing ambiguities catalogued in the paper's Table 2. */
export const TIMING_AMBIGUITIES = [
  {
    process: "Stop Payment",
    ambiguity:
      "Single entries require only a “reasonable opportunity to act”, unlike the fixed three-day rule for recurring entries.",
  },
  {
    process: "Return Deadline",
    ambiguity:
      "“Opening of business” on the second Banking Day is not a time of day, and varies by institution.",
  },
  {
    process: "Banking Day",
    ambiguity:
      "A dual-reference definition lets settlement land on a scheduled date even when the RDFI is closed.",
  },
  {
    process: "Reversals",
    ambiguity:
      "The 24-hour window starts at “discovery” of the error — a subjective event with no standardised timestamp.",
  },
  {
    process: "Recredit",
    ambiguity:
      "An RDFI must recredit “promptly”. The rules never define promptly in hours or days.",
  },
] as const;

// ------------------------------------------------------------ model checker

export const CHECKER = {
  tool: "a mathematical simulator",
  engine: "exhaustive search of every allowed behavior",
  spec: "three things that should always be true",
  composition:
    "ordinary customer accounts on both sides, one originating bank, the ACH rails, one receiving bank, and the environment they share",
  outcome:
    "For each property the simulator either proves it holds for every allowed run, or hands back a trace showing exactly how to break it.",
} as const;
