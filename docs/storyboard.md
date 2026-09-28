# Storyboard — *Credit Without Debit*

The page is three sections: Introduction, Brief methodology, and creditBLEED.
Only the creditBLEED scene is mounted. The earlier multi-scene storyboard below
is the record of the cut material, not the current page.

The narration spec. Every sentence here is written to work on its own, with no
animation. The scenes illustrate sentences that already read; they never carry
information that exists nowhere else.

Source of truth for every claim: `parsed-paper/paper.md`.
Build order (non-negotiable): **write the copy → storyboard the keyframes →
build the section static → layer scroll-scrubbed motion via a `*-motion.ts`
module.**

The live page is the consumer rewrite: one exploit ("The Phantom Funds Exploit"),
three variations, no logic symbols. Scene geometry, ledger language, and the
data-module contracts in this file still apply.

---

## Voice

Short declarative sentences. One idea per scroll step. Concrete numbers.
Second person only when the reader is the one holding the account. No
"revolutionary", no "we are excited to". Rigor goes in footnotes and the
reference layer, not in the narration.

Tamarin's rhythm: a dense sticky scene, then calm text, then another. **One
"wow" scene per act, not per section.**

---

## Three-act spine

| Act | Beat | Sections |
| --- | --- | --- |
| I — The Trust | ACH moves America's salaries and bills. Transfers are irreversible and rule-governed, so everyone assumes authorization comes before access. | Hero, Thesis |
| II — The Gap | Settlement takes days, spans independent institutions, and exposes provisional states. The rules leave the security-critical behavior underspecified. | How ACH Works, The Method |
| III — The Break and the Fix | A formal model plus model checking turns the gap into three concrete, real-world-validated attacks — and disclosure closed them. | The Attacks, Evidence, Impact, Remedies |

## The recurring motif

A **two-ledger split** — ODFI side against RDFI side — and a **gap band**: the
shaded region between initiation and settlement. It opens in Act II, is exploited
in Act III, and visibly closes in the remedies finale.

**Strict two-color ledger language, never deviated from:**

| Token | Meaning | Never used for |
| --- | --- | --- |
| `--ach-credit` (green) | a credit that posted, money the user can spend | anything that succeeded generally |
| `--ach-debit` (red) | a debit that failed, a return code, an adversarial step | any warning or emphasis |
| `--ach-provisional` (amber) | in-flight, provisional, not yet final | anything settled |
| `--ach-rail` (grey) | infrastructure, the rails, the honest baseline | anything the reader must act on |

---

## 0. Chrome — sticky nav + settlement progress bar

Reuse `SiteNav.astro`. Sections: Overview · How ACH Works · The Method · The
Attacks · Evidence · Impact · FAQ.

The reading-progress bar is restyled as a **settlement timeline**: Day 0 on the
left, Day 5 on the right, with tick marks at the banking days. The chrome itself
teaches the unit of time the whole story runs on.

---

## 1. Hero

**Copy.**

> ### Credit Without Debit
>
> Formal Verification of Banking Payment Systems. Ali Hamza Malik and
> Muhammad Taqi Raza. A formal model of ACH, and three Credit-Without-Debit
> instances.

Authors · CCS '26 · The Hague · [Paper] [Artifact] [BibTeX]

**Scene — looped, not scrubbed.** Two stylized bank buildings. A coin token
travels left to right across a calendar strip. The receiving side lights green
the moment the token arrives; the debit side behind it stays grey. Loop, slow,
never demanding.

Underneath, two counters that count up once on entry:

- **30.7 billion** — ACH payments the top 50 U.S. institutions processed in 2025.
- **20 billion** — of those payments, at four major banks (Chase, Bank of
  America, Wells Fargo, Citibank).

**Do not** claim "$100 trillion globally" or "$30 trillion in the US". Those
figures were in an earlier draft and are not in `camera-ready-paper.pdf`.
See `parsed-paper/paper.md` §1.

*Keyframes:* (1) both banks dark, no token · (2) token mid-flight, calendar
advancing · (3) token lands, right side green, left side still grey · (4) fade,
loop.

---

## 2. Thesis — "Credit without debit"

**Copy.**

> Bank transfers feel safer than cards.
>
> A card charge can be disputed. A bank transfer moves the money and it is
> gone — permanently, between institutions, under 728 pages of rules.
>
> So everyone assumes the obvious thing: that you cannot be credited money
> nobody was debited.
>
> Nobody routinely verifies that assumption. We did.
>
> Our question, exactly as we asked it: *do bank-transfer payment systems
> actually enforce the security guarantees they are assumed to provide when
> transactions span multiple institutions and asynchronous settlement stages?*

**Scene — the signature split-ledger, scroll-scrubbed, under one viewport.**

Two account cards, side by side. Bank A on the left, Bank B on the right.

*Keyframes:*

1. Both balances at rest. Bank A `$1,401.20`, Bank B `$1,000.00`. Nothing moving.
2. Scroll: an arrow leaves Bank A toward Bank B, labelled `debit $1,000`.
3. Scroll: **Bank A's available balance ticks up to `$2,401.20` in green.**
4. Scroll: **Bank B's balance does not move.** The arrow stalls against a wall.
5. Caption, and nothing else: **Credit without debit.**

This scene teaches the title. It is the hook, not the lecture — do not let it
grow a third column or a legend.

---

## 3. How ACH works — "The five-day life of a transfer"

**Copy.**

> An ACH transfer is not one event. It is five.
>
> **You** ask your bank to pull money from another account.
> Your bank — the **ODFI** — checks the routing number, the account number, and
> the format. It does not ask the other bank anything.
> The entry waits in a **batch** until the collection window closes, usually
> once a business day.
> An **ACH Operator** routes the batch to the other bank.
> The other bank — the **RDFI** — is the first party in the chain to check
> whether that account actually permits the debit.
>
> That check happens days after your bank already decided.
>
> In between, your bank does something helpful and dangerous: it posts a
> **provisional credit**. The money shows up. You can spend it. Nothing has
> settled.
>
> A transfer stays pending for one to three banking days. If the debit fails,
> the RDFI sends back a **return code** — `R16` if the account is blocked for
> debits — and your bank claws the credit back.
>
> Settlement is not an event either. Settlement is the return window closing
> without a return arriving.

**Scene — the main scrollytelling set-piece. Sticky, horizontal, scrubbed.**

Pipeline: `Originator → ODFI → ACH Operator → RDFI → Receiver`. A day counter
runs above it. Side captions swap per step.

*Keyframes:*

1. **Day 0 — Submit.** Token at the Originator. Pipeline grey.
2. **Day 0 — Routing check.** ODFI node lights. A small check mark: routing
   valid. Caption: *nobody has asked the other bank anything yet.*
3. **Day 0 — Batch.** Token joins two others; the collection window closes with
   a visible shutter. Caption: *initiation and settlement are now separated.*
4. **Day 1 — Provisional credit.** The Originator's balance goes green. The
   debit arrow behind it stays grey. **The gap band opens** — a shaded region
   spanning from here to settlement.
5. **Day 1–3 — In flight.** Operator routes the batch. Gap band widens. Caption:
   *this is the exploitation window.*
6. **Day 3 — RDFI access control.** The RDFI node lights. First and only
   authorization check on the receiving side.
7. **Day 2–5 — Return window.** Labelled explicitly. Caption: *settlement is
   this window closing empty.*

The reader must leave this scene understanding "settlement = the return window
closed" before any attack lands. If they do not, the attacks are just noise.

This exact track is reused in A3 and again in Remedies. It is the spine.

---

## 4. The method — "The checker tries every reading the rules allow"

**Copy.**

> The Nacha Operating Rules are 728 pages. 25 SEC codes. 87 return codes. 14
> change notification codes.
>
> You cannot model that. Modeling all of it is undecidable.
>
> So we scoped it: domestic, standard, consumer ACH transactions initiated over
> the internet — paying a credit-card bill, linking an account, sending money
> through a payment app. That is where the volume is, and where the consumer
> fraud is.
>
> Then we hit a different problem. The rules do not say what the system should
> do.

**Pull-quote, large type:**

> "An Originator of a debit WEB Entry must establish and implement
> **commercially reasonable methods of authentication** to verify the identity
> of the Receiver of the debit WEB Entry."
>
> — Nacha Operating Rules, Article 2, Subsection 2.5.17.5

> The rules never define "commercially reasonable". They never define
> "promptly". They define "Banking Day" twice, in ways that disagree. And in one
> place they say a batch will be rejected for an error that another place says
> can never cause a rejection.
>
> We catalogued three kinds of underspecification and resolved each the same
> way: **when the specification permits several behaviors, model all of them.**
> If a bank is allowed to do it, the model checker gets to try it.

**Scene 4a — the rules funnel.** `728 pages → consumer WEB/PPD scope → five
participant FSMs`. Three stages, each narrowing. Numbers count down as the funnel
narrows.

**Scene 4b — the model assembles.** Five nodes fade in one per scroll step:
Originator, ODFI, ACH Operator, RDFI, Receiver. Then the two channels animate as
edges: `C_info` carries instructions, `C_$` carries money. Then a **red adversary
node attaches** to the graph, and the copy names its four capabilities:

> **C-1** — controls real accounts, opened normally.
> **C-2** — knows a routing and account number. Off a check. Out of a breach. No
> password needed.
> **C-3** — uses ordinary consumer apps, and picks the parameters.
> **C-4** — can put a debit block on their *own* account.
>
> Nothing here is exotic. Every capability is a feature.

**Scene 4c — three invariant cards.** Each an icon over a plain-language line.

| | Symbol | Formal | Plain language |
| --- | --- | --- | --- |
| **Φ1** | a shield, lit | `EntrySettled ⟹ Authorized ∧ ¬Revoked` | Permission must hold the whole way, not just at the start. |
| **Φ2** | a balance scale, level | `CountCredits(c,k) = CountDebits(c,k)` | Every credit needs its debit. Money is conserved. |
| **Φ3** | a lock, shut | `ResourceAvailable ⟹ ReturnWindowClosed` | You get the money after it is final. Not before. |

These three cards come back in Section 8. Same geometry, same order.

**Scene 4d — the model checker as investigator.** Branching execution paths grow
out of an initial state. Most branches turn grey and stop. One turns red, keeps
going, and terminates in a stamp: **counterexample found**.

> We used **nuXmv**. Its `INVARSPEC` engine runs IC3/PDR backward reachability —
> it either proves the invariant holds across every reachable state of the
> bounded model, or it hands back a trace showing exactly how to break it.
>
> It handed back three.

---

## 5. The three attacks

Three matching set-pieces. **Identical four-beat structure each time** — that
consistency is what makes the site read as designed rather than assembled:

1. sticky sequence diagram, scrubbed by scroll
2. live balance counters
3. root cause vs. the permissive Nacha condition, in two columns
4. the redacted dashboard screenshots, in a carousel

Order: **A3 first is tempting** — posting-vs-settlement is the most intuitive of
the three — but the paper's A1 is the one that establishes the gap band as an
exploitable object, and A2 and A3 are variations on it. Keep paper order, and
open A1 with its most concrete sentence rather than its most general one.

### creditBLEED: the credit posts before the other bank is asked

> Bank A lets you link an account at Bank B by typing in a routing number and an
> account number. That is the whole check.
>
> We linked a dormant account we owned at Bank B, and pulled $1,000 from it.
>
> Bank A validated the routing number. Bank A posted the credit. Three days
> later Bank A made the money spendable.
>
> Bank B never debited anything. The account was blocked for debits.
>
> Several days after that, Bank B returned `R16` — *account blocked for
> debits* — and Bank A reversed the credit. By then, the money could have been
> gone.
>
> Do it again and you get another $1,000. And another.

*Keyframes:* (1) link request, routing check passes · (2) $1,000 debit entry
submitted · (3) provisional credit posts, counter `+$1,000` green, Bank B
unchanged · (4) funds turn spendable, gap band shaded · (5) debit arrow hits a
wall stamped `R16 — account blocked for debits` · (6) loop icon; counter climbs
`+$1,000 → +$2,000 → +$3,000` while Bank B's balance never moves.

**Root cause** — the ODFI validates routing and account *format* only, then
commits liquidity, and learns the restriction only when a return code arrives.
**Structural gap** — ACH has no real-time cross-institution account-status query.
**Invariant broken** — Φ1.

### creditMINT: a small credit is treated as proof a debit will work

> To link your bank account, an app sends you two deposits under a dollar. You
> report the amounts back. That proves you own the account.
>
> Then the app takes its money back.
>
> Except it cannot, if the account accepts credits and blocks debits — and ACH
> accounts can be configured exactly that way.
>
> The deposits land. The reclaim fails. And the app lets you cancel
> verification and start over, as many times as you like, with no rate limit.
>
> Each restart sends new money. None of it comes back.
>
> Three major payment providers. Every reclaim failed.

*Keyframes:* (1) jar labelled *debit-restricted account*; two coins under $1 drop
in · (2) provider's reclaim arrow bounces off the jar, stamped `R08 / R16` ·
(3) a "restart verification" control resets the scene · (4) two more coins drop;
counter: *accumulated `$0.34` · recovered `$0.00`*.

**Root cause** — the flow treats credit success as proof of debit capability, and
allows unlimited restarts. **Structural gap** — ACH has no pre-flight
debit-capability query. **Invariant broken** — Φ2.

### creditRESET: the card marks the bill paid before the bank sends the money

> You pay your credit-card bill from your bank account. Two days later the card
> says paid, balance zero, full limit restored.
>
> The bank has not sent the money yet. It will take about five more days.
>
> The card issuer is not waiting for the bank. It is waiting for its own
> bookkeeping.
>
> So we paid a card from an account we had blocked for debits. The issuer posted
> the payment and gave the credit line back. We spent it.
>
> Then we did it again, and the available credit went up again.
>
> On about day six, the bank returned the debit. The spending had already
> happened.
>
> The issuer reversed the payment. It did not charge the 26% APR for the days
> the restored credit was in use — the ledger had said *paid* the whole time.

*Keyframes:* (1) credit-limit bar full, then drained by a purchase · (2) payment
submitted; **the Section 3 five-day track runs underneath, unchanged** · (3) day
2: the limit bar refills green while the token on the track is still in flight ·
(4) new spending against the refilled bar · (5) day 6: token on the track snaps
back red, stamped *returned* · (6) the bar shows what was already spent.

Reusing the Section 3 track here is the whole point of the scene. Do not draw a
second timeline.

**Root cause** — the issuer restores the limit at internal posting, treating it
as settlement. **Structural gap** — ACH has no proactive settlement-status query.
**Invariant broken** — Φ3.

### Between the attacks — Table 1

The paper's Table 1, rendered with `Table.astro`: design rationale, implicit
assumption, exploit, impact, per attack. It is the summary that lets a reader who
skimmed one attack still follow the next.

---

## 6. Evidence and validation

> We did not have bank logs. We had dashboards.
>
> Every observation on this page is something a customer can see: a balance, a
> timestamp, a status, a return code.
>
> Two of the largest U.S. banks. Three credit-card issuers. Three payment
> providers. All accounts our own — one active, one dormant, all charges
> self-contained.
>
> No third-party account was affected at any point.

**Scene.** The redacted dashboard screenshots in a lazy-loaded carousel with
callout markers: Figure 4 (linking interface), 5 (debit scheduling + funds
received before settlement), 7 (micro-deposits posted / reversals failed), 8a–d
(the credit-card sequence).

Then a **sample-vs-system** panel: the study touched a handful of institutions,
and the two dollar figures from the hero return to say why a handful still
matters. Do not invent a concentration statistic — the paper does not have one.

---

## 7. Disclosure and impact

**Scene — horizontal, sticky, scroll scrubs sideways.** Milestone cards along a
rail:

| | |
| --- | --- |
| **Apr 16, 2025** | Disclosed to every affected institution through their official portals — reproduction steps, proof-of-concept screenshots, technical reports. |
| *(then)* | Additional evidence supplied. All reports acknowledged and under internal review. |
| **May 2025** | **A1 and A3 no longer reproducible.** A2 still viable. |
| **Dec 2025** | A2 still exploitable at **one** payment provider. |
| **Jan 2026** | **A2 resolved everywhere.** |

> We never got a technical response about how any of it was fixed. That is
> normal: legal constraints routinely limit what a financial institution can say
> about a vulnerability. What we got instead was the behavior changing.

**Finale — before/after toggle.** Replay the A1 scene. In "after", the credit
step never posts; the sequence stops at the routing check.

This is the strongest credibility asset on the page. Give it room.

---

## 8. Remedies — "Closing the gap"

The narrative rhyme. Bring back the three invariant cards from Section 4 and snap
each remedy onto its invariant.

| Remedy | Invariant |
| --- | --- |
| Continuous authorization — revalidate at posting and again before finalization | Φ1 |
| Delayed exposure of provisional credits — credit in an isolated, unspendable state | Φ3 |
| Explicit zero-sum enforcement across institutions — one logical transfer, both sides committed | Φ2 |
| Symmetric verification in account linking — verify debit capability, not just credit acceptance | Φ2 |
| Specification-level clarification — say whether authorization is continuous, whether provisional credit is visible, how failures surface | U1–U3 |

Then replay the Section 3 pipeline one last time with the **gap band visibly
closing** as the reader scrolls. The motif that opened in Act I closes here.

---

## 9. Reference layer

Kept structurally verbatim from the EMV Zombie Cards page, at the bottom, where
rigor belongs:

- **Short version** callout — the whole finding in four sentences.
- **FAQ accordion** — *Am I at risk? · Why is it called Credit Without Debit? ·
  Did you break the banks' cryptography? · Which banks were affected? · Is this
  fixed? · Can I see the model?*
- **Artifact repository** — the nuXmv model and counterexample traces.
- **BibTeX.**
- **Talk / demo video** slot via `YouTubeVideo.astro`, if one gets recorded.
- **Press** slot.
- **Credits and contact.**

---

## Non-negotiables

1. **`prefers-reduced-motion` freezes every scene at its final keyframe.** Not a
   faster animation — no animation, showing the finished state.
2. **Mobile falls back** from scrubbed sticky scenes to simple fade/slide.
3. **No essential information lives only inside an animation.** Every scene has a
   caption that carries the point.
4. **SVG and CSS transforms, never canvas.** Animate `opacity` and `transform`
   only — never `width`, `height`, `margin`, or `filter`.
5. **Screenshot carousels lazy-load.**
6. **Server renders the finished state.** A reader with no JavaScript gets the
   complete article, not a stack of blank frames.
7. **One animation runtime: Motion.** No GSAP, no ScrollTrigger, no Lenis.
8. **The ledger palette never bends.** Green means a posted credit. Red means a
   failed debit. Nothing else may borrow them.
