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
      "No. All three Credit-Without-Debit instances were reported to the affected institutions in April 2025 and none of them reproduces today. creditBLEED and creditRESET were closed by May 2025; creditMINT was closed at the last affected provider by January 2026.",
      "While they were live, the party losing money was the institution, not you. In creditBLEED the originating bank advances funds it never collects. In creditMINT the payment provider issues micro-deposits it cannot reclaim. In creditRESET the card issuer restores a credit line against a payment that never arrives.",
      "One caveat worth stating plainly: creditBLEED is feasible against any account whose routing and account numbers are known. If the targeted account is not debit-restricted, the money does come out of it — and routing and account numbers are printed on the front of every cheque.",
    ],
  },
  {
    id: "name",
    question: "Why is it called Credit Without Debit?",
    answer: [
      "A credit posts at one institution, and you can spend it, while the debit that was supposed to balance it fails at another. The three instances are that same shape. What changes is the thing that becomes available: funds in creditBLEED, micro-deposits in creditMINT, a credit line in creditRESET.",
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
      "The paper names four banks only as a volume fact: in 2025, Chase, Bank of America, Wells Fargo, and Citibank together handled 20 billion of the 30.7 billion ACH payments processed by the top 50 institutions. The experiments used accounts at two of those four, plus three credit-card issuers and three payment providers.",
      "Those institutions asked not to be named. The write-up says Bank A, Bank B, and providers A, B, and C, and the screenshots are redacted to match. The gaps the model found are properties of the ACH workflow, not of one bank's code.",
    ],
  },
  {
    id: "fixed",
    question: "Is this fixed?",
    answer: [
      "The three specific instances are, and we confirmed it by re-testing rather than by taking anyone's word for it.",
      "The structural gaps are not. Nacha still does not require an ODFI to query RDFI-side account status before a debit, a pre-flight debit-capability check before micro-deposits post, or a live settlement-status flag before an issuer releases a credit line. Closing those is a specification change, not a patch at one bank.",
    ],
  },
  {
    id: "model",
    question: "Can I see the model?",
    answer: [
      "Yes. The nuXmv model, the property specifications, and the scripts that reproduce every counterexample trace are archived at doi.org/10.5281/zenodo.22701199.",
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
  "Nacha writes the rules. ACH runs them. A transfer takes days to settle, and the bank that starts it can make the money spendable before the other bank has checked the debit.",
  "We modelled that workflow as five communicating state machines, added an adversary limited to what a customer can do, and asked a model checker whether three guarantees survive.",
  "They do not. The counterexamples are one class, Credit-Without-Debit, in three instances — creditBLEED, creditMINT, and creditRESET — and all three reproduced on accounts we controlled.",
  "We disclosed in April 2025; by January 2026 none of the three reproduced.",
] as const;

export const BIBTEX = `@inproceedings{malik2026cwd,
  author    = {Ali Hamza Malik and Muhammad Taqi Raza},
  title     = {Credit Without Debit: Formal Verification of Banking Payment Systems},
  booktitle = {Proceedings of the 2026 ACM SIGSAC Conference on
               Computer and Communications Security (CCS '26)},
  year      = {2026},
  address   = {The Hague, Netherlands},
  publisher = {ACM},
  doi       = {10.1145/3830454.3846614}
}`;
