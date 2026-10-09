# Storyboard — *Credit Without Debit*

The narration spec for the scroll-driven redesign. Every sentence here is
written to work on its own, with no animation. The scenes illustrate sentences
that already read; they never carry information that exists nowhere else.

Source of truth for every claim: `parsed-paper/paper.md`. Each block below
names the passage it traces to. If a beat is not in `paper.md`, it is not on
the page.

Build order (non-negotiable): **write the copy → storyboard the keyframes →
build the section static → layer scroll-scrubbed motion via a `*-motion.ts`
module.**

The redesign ships in versions, each a full page under `src/pages/versionN/`,
chosen from the root page until one wins:

| Version | Adds | Motion |
| --- | --- | --- |
| `/version1/` | the new structure and all the copy | none new; the hero figure is a still |
| `/version2/` | the hero ACH figure animates, and is reused in Act I | hero loop + Act I walk |
| `/version3/` | creditBLEED scene rebuilt from the paper's own steps | Act III scrub |
| `/version4/` | Act II and Act IV scenes; mobile, reduced-motion and contrast polish | Act II + Act IV scrubs |

The page as it was before the redesign stays reachable at `/original/`.

---

## Two readers, one page

Plain language is the default register. A reader with no technical background
should be able to read every paragraph in the flow of the page and never meet a
symbol. Everything an engineer wants — the state machines, the invariant
formulas, the verification setup, the counterexample traces — sits behind
progressive disclosure: a native `<details>` box labelled **For engineers**,
closed by default, placed immediately after the plain-language sentence it
deepens. Neither reader has to skip anything.

Rhythm, borrowed from the Tamarin TLS page: each abstraction is grounded in
something the reader already knows before it is named. Salary → the network it
rides on → one transfer, step by step → the gap inside that transfer → the
machine that searches the gap → the attack → the fix. One dense,
scroll-scrubbed scene per act, calm prose between.

## Voice

Short declarative sentences. One idea per scroll step. Concrete numbers, and
only the paper's. Second person when the reader is the one holding the account.
No "revolutionary", no "we are excited to". Rigor goes in the engineers' boxes
and the reference layer, not in the narration.

---

## The spine

| Act | The reader's question | The one scene |
| --- | --- | --- |
| Hero | What is this? | The ACH overview figure, under the title |
| I — Why ACH matters | Why should I care? | The same figure, walked step by step |
| II — What we did | How do you even check a thing like that? | The model assembles; the checker finds a trace |
| III — creditBLEED | What actually broke? | The attack, beat by beat |
| IV — Impact and disclosure | Is it fixed? Am I at risk? | The disclosure timeline, and the replay |

## The recurring motif

The **overview figure**: five parties in a row — you, your bank (the ODFI), the
rails (the ACH Operator), their bank (the RDFI), them (the Receiver) — with the
instruction travelling forward along the top and two money legs underneath. The
**credit leg** sits at your bank and posts green on Day 1. The **debit leg**
sits at their bank and is not checked until Day 3. The space between them is
**the gap**. The figure appears in the hero, is walked in Act I, is exploited
in Act III, and is replayed closed in Act IV.

**Strict ledger language, never deviated from:**

| Token | Meaning | Never used for |
| --- | --- | --- |
| `--ach-credit` (green) | a credit that posted, money the user can spend | anything that succeeded generally |
| `--ach-debit` (red) | a debit that failed, a return code, an adversarial step | any warning or emphasis |
| `--ach-provisional` (amber) | in-flight, provisional, not yet final | anything settled |
| `--ach-rail` (grey) | infrastructure, the rails, the honest baseline | anything the reader must act on |

The figure's five participants, its two legs and every caption come from
`src/data/ach-pipeline.ts`. No component declares a party, a day or a caption
of its own.

---

## 0. Chrome

`SiteNav.astro`, with the page's sections as the primary links: Why ACH matters
· What we did · creditBLEED · Impact · FAQ. The reading-progress bar stays
labelled as the settlement timeline, Day 0 to Day 5, so the chrome teaches the
unit of time the story runs on.

---

## Hero

**Copy.** *(paper.md title block, Abstract)*

> ### Credit Without Debit
>
> Formal Verification of Banking Payment Systems
>
> Money that appeared in one bank account before any bank had agreed to take
> it out of another. A formal model of U.S. bank transfers, three ways the
> guarantees fail, and what changed after we reported them.

Badge: **ACM CCS 2026 · The Hague**. Authors with affiliation. Buttons: **Read
the paper** (the PDF) · **BibTeX** (`#bibtex`) · **Contact** (`#contact`).
A quieter link to the artifact.

**Scene — the overview figure as the hero's background.** No colour wash
behind the masthead: the figure *is* the background. The five parties in a
row, the entry travelling left to right along the instruction rail, the credit
leg at your bank and the debit leg at their bank underneath, with the gap
between them. Version 1 showed it as a still in a card beneath the title;
from version 2 it is laid under the hero with no card, looping.

*Keyframes (version 2; version 1 shows keyframe 4 as a still):*

1. Five parties, rail grey, both legs ghosted.
2. The token leaves you and reaches your bank. The credit leg lights green:
   *provisional credit, Day 1.* The gap band opens.
3. The token crosses the rails and reaches their bank. The debit leg lights:
   *first check, Day 3.*
4. Hold on the finished frame for the last fifth of the loop. Loop, slow,
   never demanding.

**Interactive.** Each party is a button. Hover, focus or tap shows its role
and the step where it acts, from `PIPELINE_STEPS`, plus the leg that hangs off
it. Escape closes it.

Contrast rule: the figure layer is capped at `BACKDROP_OPACITY` (under half)
and the header reserves the figure's height at the bottom, so the title and
the buttons never sit on top of the parties. Under `prefers-reduced-motion`
the loop is not armed and the figure is keyframe 4, still; the server and a
no-JavaScript reader get the same frame.

---

## Act I — Why ACH matters

**Kicker.** Act I · Why ACH matters

**Copy.** *(paper.md §1 Scale; §1 The assumption under test; §2 Background)*

> Your salary arrives by bank transfer. Your mortgage, your credit-card bill
> and your other bills leave the same way. When you link a bank account to
> Zelle, PayPal, Venmo or Cash App, the link underneath is the same kind of
> transfer.
>
> In the United States those transfers run on the Automated Clearing House,
> the ACH network.

*Counters, counted up once on entry (existing `ScaleCounters`):*

- **30.7 billion** — ACH payments processed by the top 50 U.S. institutions in 2025.
- **20 billion** — of those, at four banks: Chase, Bank of America, Wells
  Fargo and Citibank.

**Do not** claim "$100 trillion globally" or "$30 trillion in the US". Those
figures were in an earlier draft and are not in `camera-ready-paper.pdf`.

> Bank transfers are supposed to be the safe kind of payment. A card charge
> can be disputed. A bank transfer moves the money for good: once it settles it
> cannot be reversed, and it gets there through several stages of clearing
> between banks, under strict operating rules.
>
> So everyone assumes a few things without ever checking them:
>
> 1. If money is credited to one account, it was debited from another.
> 2. The two balances never disagree halfway through.
> 3. A transfer that has not finished does not change what you can spend.
> 4. Once a transfer looks complete, it stays complete.
>
> None of these is guaranteed by the ACH network, and none is written into
> regulation.

**Scene — the overview figure, walked.** The hero figure returns, larger, and
the reader scrolls one party at a time. The captions are `PIPELINE_STEPS` from
`src/data/ach-pipeline.ts`, verbatim; the figure adds nothing the captions do
not say.

> An ACH transfer is not one event. It is a chain of them, across five parties,
> over several days.

*Keyframes (version 2 scrubs them in a sticky scene; version 1 renders the
figure plus the caption list). Clicking a party scrolls the scene to the step
where it acts:*

1. **Day 0 — Submit.** Token at you. Pipeline grey.
2. **Day 0 — Routing check.** Your bank lights. *It does not ask the other
   bank anything.*
3. **Day 0 — Batch.** The entry waits for the collection window to close.
4. **Day 1 — Provisional credit.** The credit leg goes green. **The gap opens.**
5. **Day 1–3 — In flight.** The rails carry the batch. The gap widens.
6. **Day 3 — Their bank checks.** The debit leg lights. First and only check
   on the receiving side.
7. **Day 2–5 — Return window.** *Settlement is this window closing empty.*

**Copy, after the scene.** *(paper.md §2 Access control; "The structural
feature the model targets")*

> In the meantime your bank has done something helpful and dangerous. It has
> posted a provisional credit. The money shows up. You can spend it. Nothing
> has settled.
>
> A transfer stays pending for one to three banking days. If the debit fails,
> their bank sends back a return code, R16 if the account is blocked for
> debits, and your bank claws the credit back.
>
> Settlement is not an event either. Settlement is the return window closing
> without a return arriving.

The reader must leave Act I knowing "settlement = the return window closed
empty" before Act III lands. The content test checks that the definition comes
before the attack.

**Pull quote — the research question, verbatim.** *(paper.md §1)*

> do bank-transfer payment systems actually enforce the security guarantees
> they are assumed to provide when transactions span multiple institutions and
> asynchronous settlement stages?

**For engineers.** *(paper.md §1 Why the question is hard)* The standards
leave three things underspecified: whether authorization is a one-time check
or must hold continuously; whether provisional credits may be exposed before
the corresponding debits succeed; how failures are handled when they occur
days after a transaction appears complete. Transfers unfold over multiple days
across independent institutions that enforce access control locally and at
different times.

---

## Act II — What we did

**Kicker.** Act II · What we did

**Copy.** *(paper.md §3.2, §4, §5)*

> We wrote down the rules of the transfer as a model, and let a machine try
> every move the rules allow.
>
> A formal model is a precise description of who can do what, and when. A
> model checker is a program that explores every sequence of moves the model
> permits and reports whether a property you care about can ever be broken.
> When it can, the checker hands back the exact sequence of moves that breaks
> it. That sequence is called a counterexample, and it is a recipe.

**Scope.** *(paper.md §3.2 Scope reduction)*

> The Nacha Operating Rules run to 728 pages: 25 SEC codes, 87 return codes,
> 14 change notification codes. Modelling all of it is not slow. It is
> undecidable.
>
> So we scoped it to the transfers a person starts on the internet: paying a
> credit-card bill, linking an account, sending money through a payment app.
> That is where the volume is, and where the consumer fraud is.

**The model.** *(paper.md §3.2 Abstract protocol model; §4.1; §4.2; §3.1)*

> Five parties, each modelled as a small machine that moves between states
> when it receives a message: you, your bank, the rails, their bank, them.
> Two channels connect them. One carries instructions. The other carries
> money, and it moves later.
>
> Then we added an adversary who can do only what any customer can do:
>
> **C-1** — open real accounts, through the normal process.
> **C-2** — know a routing number and an account number. Off a cheque. Out
> of a breach. No password needed.
> **C-3** — use ordinary banking apps, and pick the amount, the account type,
> the payment type.
> **C-4** — put a debit block on an account they own.
>
> Nothing here is exotic. Every capability is a feature.

**For engineers.** Each participant type is an FSM template
F = (S, s₀, V, Σ, δ) with guarded transitions `guard/action`; environment
variables are Booleans the checker sets non-deterministically. Timing windows
are Boolean pairs (`event_started`, `event_expired`) rather than clock ticks.
Composition M = (E, O¹…O^nO, BO, A, BR, R¹…R^nR, C_info, C_$), bounded to two
transactions per Originator, three entries per batch, three batch windows per
run. M^adv instruments Originators and Receivers with the C-1…C-4 behaviours as
non-deterministic transitions.

**The rules do not say.** *(paper.md §4.3 U1–U3)*

> Then we hit a different problem. The rules do not say what the system should
> do.

Pull quote, large type, verbatim:

> "An Originator of a debit WEB Entry must establish and implement
> **commercially reasonable methods of authentication** to verify the identity
> of the Receiver of the debit WEB Entry."
>
> — Nacha Operating Rules, Article 2, Subsection 2.5.17.5

> The rules never define "commercially reasonable". They never define
> "promptly". They define "Banking Day" twice, in ways that disagree. And in
> one place they say a batch will be rejected for an error that another place
> says can never cause a rejection.
>
> Wherever the rules allow more than one behaviour, we modelled all of them.
> If a bank is allowed to do it, the checker gets to try it.

**For engineers.** U1, U2 and U3 in full, with the quoted rule text and each
resolution, from `src/data/method.ts`.

**The three properties.** *(paper.md §5.1)* Three cards, plain language first:

| | Plain language | Formal |
| --- | --- | --- |
| **Φ1** Continuous authorization | Permission must hold the whole way through, not just when you press send. | `EntrySettled ⟹ Authorized ∧ ¬Revoked` |
| **Φ2** Zero-sum | Every credit needs its debit. Money is conserved. | `CountCredits(c,k) = CountDebits(c,k)` |
| **Φ3** Settlement finality | You get the money after it is final. Not before. | `ResourceAvailable ⟹ ReturnWindowClosed` |

> The one in the title is the second. A credit must be matched by a debit.

The formulas live in the engineers' box, not on the cards.

**How the checker finds a violation.** *(paper.md §3.2 Model checking process;
§5.2)*

> We gave the model to nuXmv, a model checker. For each property it does one
> of two things: it proves the property holds on every run the model allows,
> or it hands back a run that breaks it.
>
> It handed back three.
>
> A counterexample is a claim about a model. So for each one we set up real
> accounts to match its starting conditions, ran the steps through ordinary
> banking apps, and watched the dashboards: two checking accounts at two major
> U.S. banks, three credit cards, three payment-provider accounts. All ours.

**For engineers.** Five nuXmv modules over two single-slot buses
(`c_info_channel`, `c_dollar_channel`); two adversarial Originators, two
adversarial Receivers, one ODFI, one Operator, one RDFI, plus E. Each Φ is a
single `INVARSPEC`; the engine is IC3/PDR backward reachability over the bounded
model. Validation is black-box: no bank logs, no ACH trace files, only
user-visible dashboard state.

**Scene (version 4) — the model assembles, then the checker searches.** Five
nodes fade in one per scroll step, the two channels animate as edges, a red
adversary node attaches, and then branching paths grow out of an initial
state: most go grey and stop, one goes red and ends on a stamp,
**counterexample found**. Version 1 renders the three cards and the prose.

---

## Act III — creditBLEED

**Kicker.** Act III · creditBLEED

The centrepiece. Beats are `ATTACKS[a1].beats` from `src/data/attacks.ts`;
each beat is one sentence and each sentence traces to paper.md §6.1
(Empirical assessment, items 1–4; Analysis π₁; "Do it again" from the
return-and-repeat structure, Table 1 "Access funds on authorization").

**Lede.** *(paper.md §6.1 The flaw; §2 Manual-link)*

> Bank A lets you link an account at Bank B by typing in a routing number and
> an account number. That is the whole check.

**Scene — the attack, beat by beat** (existing `AttackScene` in version 1;
rebuilt in version 3 from the paper's steps). One sentence per beat, two
counters: what is spendable at Bank A, what the balance is at Bank B.

*Keyframes:*

1. **Day 0.** We link a dormant account we own at Bank B, using only its
   routing and account numbers.
2. **Day 0.** We submit a $1,000 ACH debit against it. Bank A validates the
   routing number and accepts.
3. **Day 1.** Bank A posts a provisional credit. Bank B has not been asked
   anything. *(counter: `+$1,000`, green)*
4. **Day 3.** Bank A makes the funds spendable. The debit has still not been
   attempted.
5. **Day 3.** Bank B applies access control for the first time. The account is
   blocked for debits. Nothing moves.
6. **Day 5.** Bank B returns the entry, `R16 — account blocked for debits`.
   Bank A reverses the credit, days after the money could have gone.
7. **Again.** Repeat, and another $1,000 becomes spendable. The target account
   balance never moves.

**Copy, after the scene.** *(paper.md §6.1 Root cause; Structural gap;
"feasible against any victim")*

> Root cause: Bank A checked that the routing number and the account number
> were well formed, then committed the money. It learned that the account was
> blocked only when the return code arrived, days later.
>
> Structural gap: ACH has no way for one bank to ask another, in real time,
> whether an account can be debited. So the first bank commits at
> routing-validation time and finds out at return time.
>
> Invariant broken: Φ1. Permission at the start was treated as permission all
> the way through.
>
> We used our own dormant account. The same steps work against any account
> whose routing and account numbers are known, and if that account is not
> blocked for debits, the money comes out of it.

**Evidence.** Figure 4 (the linking screen) and Figure 5 (the debit being
scheduled; the dashboard showing the funds received before settlement) in
`ScreenshotFrame`. **For engineers:** the counterexample trace π₁ in the
paper's own terms, and Figure 3, the sequence diagram.

**Two more of the same shape.** *(paper.md §6.2, §6.3, Table 1)* Brief, one
card each; the full four-beat treatment is not repeated.

> **creditMINT.** To link your bank account, an app sends two deposits under
> a dollar, and you report the amounts back. Then the app takes its money
> back. Except it cannot, if the account accepts credits and blocks debits,
> which ACH accounts can be configured to do. The deposits land, the reclaim
> fails, and the app lets you cancel and start again, with no rate limit.
> Three major payment providers; every reclaim failed. Invariant broken: Φ2.
>
> **creditRESET.** You pay your credit-card bill from a bank account. Within
> two business days the card says paid, balance zero, full limit restored. The
> bank has not sent the money yet; that takes about five more days. We paid
> three cards from an account blocked for debits. Each issuer restored the
> limit, we could spend against it, and after about six business days the
> debit came back. No interest was charged for the days in between. Invariant
> broken: Φ3.

Then Table 1, rendered from `ATTACKS[*].summary`: design rationale, implicit
assumption, exploit, impact. The evidence for A2 (Figure 7) and A3 (Figure 8)
sits behind a **See the evidence** disclosure on each card.

---

## Act IV — Impact and disclosure

**Kicker.** Act IV · Impact and disclosure

**Copy.** *(paper.md Ethics and Disclosure; Table 1 note)*

> We reported all three to every affected institution on 16 April 2025, with
> reproduction steps, screenshots and technical reports.

*Timeline (`MILESTONES`, `src/data/disclosure.ts`; a static list in version 1,
a sideways scrub in version 4):*

| | |
| --- | --- |
| **16 April 2025** | Disclosed through each institution's official responsible-disclosure portal. |
| *(then)* | Additional evidence supplied. All reports acknowledged and under internal review. |
| **May 2025** | **creditBLEED and creditRESET no longer reproducible.** creditMINT still viable. |
| **December 2025** | creditMINT still exploitable at **one** payment provider. |
| **January 2026** | **creditMINT resolved everywhere.** |

> Who lost money. In every experiment the loss fell on an institution, not a
> customer: the originating bank advanced funds it never collected, the
> payment provider issued deposits it could not reclaim, the card issuer
> restored a credit line against a payment that never arrived. Every account
> was ours, and no third-party account was affected at any point.
>
> We never received a technical response about how any of it was fixed. That
> is normal: legal constraints routinely limit what a financial institution
> can say about a vulnerability. What we got instead was the behaviour
> changing.

**Scene (version 4) — the timeline scrubs sideways, then the replay.** The
three markers turn green on the dates they turned green. Then the creditBLEED
scene replays as a before/after: in "after", the credit never posts and the
sequence stops at the routing check. Version 1 renders the list.

**The fix.** *(paper.md §7)* The three cards from Act II return with the
remedies snapped on: continuous authorization (Φ1); delayed exposure of
provisional credits (Φ3); explicit zero-sum enforcement and symmetric
verification in account linking (Φ2); and a specification-level
clarification that closes U1–U3.

> Three of those are a specification change, not a patch at one bank. The
> instances are fixed. The gaps are not.

**Reference layer.**

- **Short version** — the finding in four sentences (`SHORT_VERSION`).
- **FAQ** (`FAQ`) — *Am I at risk? · Why is it called Credit Without Debit? ·
  Did you break the banks' cryptography? · Which banks were affected? · Is this
  fixed? · Can I see the model? · Was it ethical?*
- **Artifact** — the nuXmv model, property files and scripts, at Zenodo.
- **BibTeX** (`#bibtex`).
- **Contact** — the site footer (`#contact`).

---

## Non-negotiables

1. **`prefers-reduced-motion` freezes every scene at its final keyframe.** Not
   a faster animation: no animation, showing the finished state.
2. **Mobile falls back** from scrubbed sticky scenes to the caption list, in
   document flow, with no horizontal scroll.
3. **No essential information lives only inside an animation.** Every scene
   has a caption that carries the point.
4. **SVG and CSS transforms, never canvas.** Animate `opacity`, `transform`
   and `filter` only; never `width`, `height` or `margin`.
5. **Screenshots lazy-load.**
6. **The server renders the finished state.** A reader with no JavaScript gets
   the complete article, not a stack of blank frames.
7. **One animation runtime: Motion.** No GSAP, no ScrollTrigger, no Lenis.
8. **The ledger palette never bends.** Green means a posted credit. Red means
   a failed debit. Nothing else may borrow them.
9. **The page claims no number the paper does not have.**
