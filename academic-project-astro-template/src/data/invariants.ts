/**
 * The three safety invariants (parsed-paper/paper.md §5.1).
 *
 * Authored once and used twice, which is the point: §4 introduces the cards,
 * §8 snaps the remedies back onto them. `InvariantCards.tsx` renders both
 * passes from this module, so the second pass cannot drift from the first.
 */

export type InvariantId = "phi1" | "phi2" | "phi3";

export interface Invariant {
  id: InvariantId;
  /** Φ1 / Φ2 / Φ3. */
  symbol: string;
  name: string;
  /** The glyph the card draws. See InvariantCards.tsx. */
  icon: "shield" | "scale" | "lock";
  /** The formula, as plain text — rendered in the mono face, not KaTeX. */
  formal: string;
  /** The whole invariant in one sentence a non-specialist can hold. */
  plain: string;
  /** What a counterexample buys an attacker. */
  violation: string;
  /** The attack that broke it. */
  brokenBy: "A1" | "A2" | "A3";
}

export const INVARIANTS: readonly Invariant[] = [
  {
    id: "phi1",
    symbol: "Φ1",
    name: "Continuous Authorization",
    icon: "shield",
    formal:
      "∀ o, r, E . EntrySettled(E, o, r) ⟹ Authorized(E, o, r) ∧ ¬Revoked(E, o, r)",
    plain:
      "Permission has to last the whole settlement window — not just the instant you press send.",
    violation:
      "A violation enables unauthorized transfers by exploiting the gap between authorization at initiation and fund movement at settlement.",
    brokenBy: "A1",
  },
  {
    id: "phi2",
    symbol: "Φ2",
    name: "Zero-Sum Invariant",
    icon: "scale",
    formal: "∀ c . CycleComplete(c) ⟹ ⋀ₖ CountCredits(c, k) = CountDebits(c, k)",
    plain:
      "Every credit needs its matching debit. Across a cycle, money is conserved — or it is not a payment.",
    violation:
      "A violation allows an attacker to extract funds, for example by accepting credits while preventing the corresponding debits.",
    brokenBy: "A2",
  },
  {
    id: "phi3",
    symbol: "Φ3",
    name: "Settlement Finality",
    icon: "lock",
    formal: "∀ r, E . ResourceAvailable(r, E) ⟹ ReturnWindowClosed(E)",
    plain:
      "You spend the money after it is final. Not while the other bank can still take it back.",
    violation:
      "A counterexample is a path in which resources become available while the entry remains provisional.",
    brokenBy: "A3",
  },
] as const;

export function invariantById(id: InvariantId): Invariant {
  const found = INVARIANTS.find((i) => i.id === id);
  if (!found) throw new Error(`unknown invariant ${id}`);
  return found;
}
