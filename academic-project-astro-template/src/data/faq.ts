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
      "No. We reported the Phantom Funds Exploit in April 2025. By January 2026 none of the three variations still worked. Fake Authorization and the Credit Line Mirage were closed by May 2025; the Micro-Deposit Trap closed at the last affected app by January 2026.",
      "While they were live, the party losing money was the institution, not you. Your bank, the payment app, or the card issuer was the one that advanced funds it never collected.",
      "One caveat, stated plainly: Fake Authorization works against any account whose routing and account numbers are known. If that account is not locked, the money does come out of it — and those numbers are printed on the front of every cheque.",
    ],
  },
  {
    id: "cryptography",
    question: "Did you break cryptography?",
    answer: [
      "No. Nothing here involves breaking a cipher, forging a signature, or defeating a login. We used ordinary consumer apps and accounts we owned.",
      "The flaw is in the order of operations. Money is made spendable at one institution before another institution has been asked whether the debit is allowed. Every step follows the rules.",
    ],
  },
  {
    id: "which-banks",
    question: "Which banks and providers were affected?",
    answer: [
      "We are not naming them. The paper anonymises every institution, and the screenshots are redacted to match.",
      "The sample was two of the largest U.S. banks, three credit-card issuers, and three payment apps. The gap the simulator found is a property of the transfer rules, not of any one bank's code.",
    ],
  },
  {
    id: "fixed",
    question: "Is this fixed?",
    answer: [
      "The three specific variations are, and we confirmed it by re-testing rather than by taking anyone's word for it.",
      "The structural gaps are not. Banks still cannot ask each other in real time whether an account is locked, whether it allows withdrawals, or whether a transfer has actually settled. Closing those gaps is a change to the rulebook, not a patch.",
    ],
  },
  {
    id: "model",
    question: "Can I see the model?",
    answer: [
      "Yes. The simulator, the properties it checked, and the traces it produced are in the artifact repository linked at the top of this page.",
      "Two things are not there. The Nacha Operating Rules themselves are Nacha's copyright, so we cannot redistribute them. And the raw account screenshots contain personal financial information — the redacted versions on this page are what we can publish.",
    ],
  },
  {
    id: "ethics",
    question: "Was it ethical to test this on real banks?",
    answer: [
      "Every test ran against accounts owned by members of the research team. No third-party account was affected at any point, and every charge was self-contained.",
      "The institutions bearing the financial losses were informed promptly, and we disclosed through official channels before publishing.",
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
