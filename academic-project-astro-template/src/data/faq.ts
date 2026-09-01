/**
 * The reference layer's FAQ.
 *
 * Plain language, the reader's actual question as the heading, and the honest
 * answer — including the two questions whose honest answer is "no".
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
      "No. We reported the Phantom Funds Exploit in April 2025. By January 2026 none of the three variations still worked.",
      "While they were live, the party losing money was the institution, not you.",
    ],
  },
  {
    id: "cryptography",
    question: "Did you break cryptography?",
    answer: [
      "No. Nothing here involves breaking a cipher, forging a signature, or defeating a login. We used ordinary consumer apps and accounts we owned.",
      "The flaw is in the order of operations. Money is made spendable before the other bank is asked whether the debit is allowed.",
    ],
  },
  {
    id: "which-banks",
    question: "Which banks were affected?",
    answer: [
      "We are not naming them. The sample was two of the largest U.S. banks, three credit-card issuers, and three payment apps.",
      "The gap is a property of the transfer rules, not of any one bank's code.",
    ],
  },
  {
    id: "fixed",
    question: "Is this fixed?",
    answer: [
      "The three specific variations are. We confirmed that by re-testing.",
      "The structural gaps are not. Banks still cannot ask each other, in real time, whether an account is locked, whether it allows withdrawals, or whether a transfer has actually settled.",
    ],
  },
] as const;

/** Four sentences, for readers who will not scroll. */
export const SHORT_VERSION = [
  "A bank transfer takes days to settle, and the bank that starts it often lets you spend the money long before the other bank has checked whether the debit is even allowed.",
  "We call that gap the Phantom Funds Exploit: three ways to spend, collect, or restore money that was never actually sent.",
  "We fed the 728-page Nacha rulebook into a simulator, proved the gap is written into the rules, and then triggered it on real accounts at real institutions.",
  "We disclosed in April 2025; by January 2026 none of the three variations still worked. Consumers were never at risk.",
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
