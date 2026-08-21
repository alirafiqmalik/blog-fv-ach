/**
 * The reference layer's FAQ (docs/storyboard.md §9).
 *
 * Structure borrowed from the EMV Zombie Cards page: plain language, the
 * reader's actual question as the heading, and the honest answer — including
 * the two questions whose honest answer is "no".
 */

export interface FaqEntry {
  id: string;
  question: string;
  /** Paragraphs. Plain text; the accordion renders them as <p>. */
  answer: readonly string[];
}

export const FAQ: readonly FaqEntry[] = [
  {
    id: "at-risk",
    question: "Am I at risk?",
    answer: [
      "No. All three attacks were reported to the affected institutions in April 2025 and none of them reproduces today. A1 and A3 were closed by May 2025; A2 was closed at the last affected provider by January 2026.",
      "While they were live, the party losing money was the institution, not you. In A1 the originating bank advances funds it never collects. In A2 the payment provider issues micro-deposits it cannot reclaim. In A3 the card issuer restores a credit line against a payment that never arrives.",
      "One caveat worth stating plainly: A1 is feasible against any account whose routing and account numbers are known. If the targeted account is not debit-restricted, the money does come out of it — and routing and account numbers are printed on the front of every cheque.",
    ],
  },
  {
    id: "cryptography",
    question: "Did you break the banks' cryptography?",
    answer: [
      "No. Nothing here involves breaking a cipher, forging a signature, or defeating authentication. We used ordinary consumer apps and accounts we owned.",
      "The flaw is in the order of operations. Money is made spendable at one institution before another institution has been asked whether the debit is allowed. Every step is protocol-compliant.",
    ],
  },
  {
    id: "which-banks",
    question: "Which banks and providers were affected?",
    answer: [
      "We are not naming them. The paper anonymises every institution as Bank A, Bank B, and payment services A, B and C, and the screenshots are redacted to match.",
      "The sample was two of the largest U.S. banks, three credit-card issuers, and three third-party payment providers. The structural gaps the model found are properties of the ACH workflow, not of any one institution's implementation.",
    ],
  },
  {
    id: "fixed",
    question: "Is this fixed?",
    answer: [
      "The three specific attacks are, and we confirmed it by re-testing rather than by taking anyone's word for it.",
      "The structural gaps are not. ACH still has no real-time cross-institution account-status query, no pre-flight debit-capability query, and no proactive settlement-status query. Those absences are what made all three attacks possible, and closing them is a specification-level change, not a patch.",
    ],
  },
  {
    id: "model",
    question: "Can I see the model?",
    answer: [
      "Yes. The nuXmv model, the property specifications, and the scripts that reproduce every counterexample trace are in the artifact repository.",
      "Two things are not there. The Nacha Operating Rules themselves are Nacha's copyright and require registration or purchase, so we cannot redistribute them. And the raw account screenshots and transaction logs contain personally identifiable financial information — the paper carries redacted versions instead.",
    ],
  },
  {
    id: "ethics",
    question: "Was it ethical to test this on real banks?",
    answer: [
      "Every attack ran against accounts owned by members of the research team. No third-party account was affected at any point, and every charge was self-contained.",
      "The institutions bearing the financial losses were informed promptly, and we disclosed through official channels before publishing.",
    ],
  },
] as const;

/** Four sentences, for readers who will not scroll. */
export const SHORT_VERSION = [
  "An ACH transfer takes days to settle, and the bank that starts it makes the money spendable long before the bank on the other end has checked whether the debit is even allowed.",
  "We modelled that workflow from the Nacha rules as five communicating state machines, added an adversary that can only do things ordinary customers can do, and asked a model checker whether three basic guarantees survive.",
  "They do not: the checker returned three counterexamples, and all three reproduced on real accounts at real institutions.",
  "We disclosed in April 2025; by January 2026 none of the three reproduced.",
] as const;

export const BIBTEX = `@inproceedings{ach2026provable,
  title     = {Provable and Operational Attacks on Banking Payment Systems},
  author    = {Anonymous Author(s)},
  booktitle = {Proceedings of the 2026 ACM SIGSAC Conference on
               Computer and Communications Security (CCS '26)},
  year      = {2026},
  address   = {The Hague, Netherlands},
  publisher = {ACM}
}`;
