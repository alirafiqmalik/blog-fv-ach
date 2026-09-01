/**
 * Three things that should always be true of a bank transfer.
 *
 * Authored once and used twice: the method section introduces the cards, the
 * impact section snaps the remedies back onto them. `InvariantCards.tsx`
 * renders both passes from this module, so the second pass cannot drift.
 *
 * The paper states these as Φ1–Φ3. The page never does — Wired readers get the
 * plain-language line, not the formula.
 */

export type InvariantId = "phi1" | "phi2" | "phi3";

export interface Invariant {
  id: InvariantId;
  /** 01 / 02 / 03 — a scan label, not a logic symbol. */
  symbol: string;
  name: string;
  /** The glyph the card draws. See InvariantCards.tsx. */
  icon: "shield" | "scale" | "lock";
  /** The whole invariant in one sentence a non-specialist can hold. */
  plain: string;
  /** What breaking it buys an attacker. */
  violation: string;
  /** The variation that broke it. */
  brokenBy: "Fake Authorization" | "Micro-Deposit Trap" | "Credit Line Mirage";
}

export const INVARIANTS: readonly Invariant[] = [
  {
    id: "phi1",
    symbol: "01",
    name: "Permission that lasts",
    icon: "shield",
    plain:
      "Permission has to last the whole settlement window — not just the instant you press send.",
    violation:
      "A locked or blocked account can still be used to start a transfer, because nobody checks again before the money is made spendable.",
    brokenBy: "Fake Authorization",
  },
  {
    id: "phi2",
    symbol: "02",
    name: "Money that balances",
    icon: "scale",
    plain:
      "Every credit needs its matching debit. Across a cycle, money is conserved — or it is not a payment.",
    violation:
      "An account that takes deposits and blocks withdrawals can collect money that never comes back.",
    brokenBy: "Micro-Deposit Trap",
  },
  {
    id: "phi3",
    symbol: "03",
    name: "Spend after it's final",
    icon: "lock",
    plain:
      "You spend the money after it is final. Not while the other bank can still take it back.",
    violation:
      "A credit line, a balance, or a payment can be treated as done days before the other bank has actually sent the money.",
    brokenBy: "Credit Line Mirage",
  },
] as const;

export function invariantById(id: InvariantId): Invariant {
  const found = INVARIANTS.find((i) => i.id === id);
  if (!found) throw new Error(`unknown invariant ${id}`);
  return found;
}
