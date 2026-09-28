# Credit Without Debit: Formal Verification of Banking Payment Systems

Ali Hamza Malik and Muhammad Taqi Raza, University of Massachusetts Amherst.
ACM CCS 2026, 15–19 November, The Hague.
DOI `10.1145/3830454.3846614`. Artifact `https://doi.org/10.5281/zenodo.22701199`.

Identity, scale figures, Table 1, and the artifact URL below follow
`camera-ready-paper.pdf`. Quoted material is verbatim; everything else is a
faithful condensation. This file is the content authority for the website.

---

## Abstract

Banking payment systems, handling trillions of dollars annually, are widely
assumed to provide strong correctness and access-control guarantees because
transfers result in permanent movement of funds and are governed by strict
operational rules. In this paper, we show that these guarantees do not hold in
practice for U.S. bank-transfer workflows built on the Automated Clearing House
(ACH). We present a formal model of ACH processing that captures the delayed and
asynchronous nature of transfers, the independent control of accounts across
different banks, and the temporary states visible to users before settlement
completes. Using a property-guided verification framework, we analyze whether
fundamental guarantees — authorization validity, debit-credit balance
consistency, and settlement-before-access — hold throughout a payment transfer's
lifecycle. Our analysis reveals systematic violations caused by treating
authorization as a one-time check and by exposing provisional credits before
access control and settlement complete. We instantiate these violations as three
concrete attacks: (i) receiving funds on debit authorization despite later debit
access-control check fails, (ii) fund extraction through asymmetric credit-only
verification in micro-deposit account linking, and (iii) premature restoration of
credit-line in ACH-backed credit-card payments. We validate these findings in
practice across major U.S. banks and third-party financial platforms. We
disclosed our findings and proposed remedies to all affected institutions.
Follow-up testing confirms that these attacks are no longer possible.

**Keywords.** Banking payment security, formal verification, model checking,
access control and authorization.

---

## 1. Introduction

### Scale

- In 2025, the top 50 U.S. financial institutions processed **30.7 billion** ACH
  payments.
- **20 billion** of those payments were concentrated at four major banks: Chase,
  Bank of America, Wells Fargo, and Citibank.
- ACH supports direct deposit of salaries, bill payments, mortgage servicing,
  credit-card payments, and bank-linked funding for Zelle, PayPal, Venmo, and
  Cash App.

The camera-ready paper does not state a global total of 100 trillion USD or a
U.S. total of 30 trillion USD. Those amounts were in an earlier draft. The site
uses the payment counts above.

### The assumption under test

Unlike credit-card networks, which rely on issuer guarantees and chargeback
mechanisms, banking transfers move funds permanently between accounts and
financial institutions. These transfers are irreversible once settled and are
processed through multi-stage interbank clearing and settlement. Banking systems
are therefore designed around strict operational rules and deferred settlement
workflows, and are generally regarded as providing stronger security guarantees
than card-based payment systems.

Participants expect several operational properties to hold by default:

1. debits and credits will occur together for both parties,
2. account balances will not diverge during a transfer,
3. incomplete or in-progress transactions will not affect what users can spend,
4. once a transfer appears complete, the result will not be unexpectedly reversed.

None of these are guaranteed by the ACH or explicitly specified in regulations.

### Research question (verbatim)

> do bank-transfer payment systems actually enforce the security guarantees they
> are assumed to provide when transactions span multiple institutions and
> asynchronous settlement stages?

### Why the question is hard

Banking specifications are incomplete with respect to security-critical
behavior. The standards describe how transactions are initiated and settled, but
leave key questions underspecified:

- whether authorization is a one-time check or must hold continuously,
- whether provisional credits may be exposed before the corresponding debits
  succeed,
- how failures are handled when they occur days after a transaction appears
  complete.

These gaps are amplified by the structure of bank transfers, which unfold over
multiple days and across independent institutions that enforce access control
locally and at different times.

### Contributions

- A comprehensive formal model of bank-transfer payment systems, grounded in
  Nacha specifications, interbank settlement workflows, and real operational
  constraints observed in U.S. banking infrastructure.
- A property-guided verification framework for formally analyzing the
  correctness and security of payment systems, identifying violations arising
  from asynchronous authorization, cross-institution state divergence, and
  settlement timing, even when transactions comply with existing protocol rules.
- A demonstration that these formally derived violations correspond to real,
  exploitable attacks, validated black-box on production systems.

---

## Table 1 — Summary of the three attacks

All three were responsibly disclosed. As of May 2025, A1 and A3 were no longer
reproducible. A2 remained viable for one affected third-party payment provider
through December 2025 and was no longer reproducible as of January 2026.

|                         | A1: creditBLEED                            | A2: creditMINT                                      | A3: creditRESET                        |
| ----------------------- | ---------------------------------------------- | --------------------------------------------------- | -------------------------------------- |
| **Design rationale**    | Provide immediate fund availability            | Simplify account linking                            | Shorten credit-line recovery wait      |
| **Implicit assumption** | Routing/account format ⇒ debit capability      | Inbound credit ⇒ outbound debit                     | Internal posting ⇒ ACH settlement      |
| **Exploit**             | ODFI credit without RDFI debit                 | Repeated micro-credits without debit recovery       | Repeated credit-line restoration       |
| **Impact**              | Access funds on authorization                  | Repeatedly accumulate micro-deposits                | Spend on prematurely restored credit line |

---

## 2. Background

The ACH ecosystem coordinates **Originating Depository Financial Institutions
(ODFIs)**, **Receiving Depository Financial Institutions (RDFIs)**, **Third-Party
Senders (TPS)**, and **ACH Operators**. ODFIs initiate transfers, RDFIs receive
funds, Third-Party Senders offer payment services, and ACH Operators route
batched transactions between banks. Nacha governs the ACH network and defines
Operating Rules for authentication, authorization, access control, and risk
management.

Banking payments settle in multiple stages over several days, unlike credit-card
networks. The ODFI first authorizes the transaction, provisionally credits the
originator, and then tries to pull the funds. The RDFI applies access control at
that stage.

### External account authentication — three methods

1. **Manual-link** — requires the routing and account numbers.
2. **Web-login** — authenticates through the external bank's portal, often
   through aggregators such as Plaid.
3. **Micro-deposits** — send two small amounts ($0.01–$0.99) to the external
   account, which the user confirms to prove ownership.

### Transaction authorization

After account verification, the user can initiate ACH credit (push) or debit
(pull) transfers, bill payments, and recurring credit-card payments. The ACH
network classifies internet-initiated payments using Standard Entry Class (SEC)
codes: **WEB** for one-time and **PPD** for recurring payments. The ODFI
validates the request, constructs an ACH entry with the routing number, account
number, transaction code, and amount, and queues it in a batch for transmission
to an ACH Operator. Batch processing separates initiation from settlement, which
creates a temporal gap.

### Access control

Upon receiving a transaction, the RDFI verifies account eligibility and
transaction context. Credit entries proceed when the account is active and
accepts deposits. Debit entries additionally require enough balance, valid
authorization, and no fraud holds. Recurring payments (PPD) succeed unless
authorization has been revoked; one-time payments (WEB) fail if initiated after
revocation. Failed transactions return to the ODFI, usually within two banking
days, with reason codes such as insufficient funds, closed accounts, or
unauthorized debits. Some errors generate Notifications of Change (NOCs) that
correct information without reversing funds.

**The structural feature the model targets:** provisional credit may be advanced
before the RDFI completes access control. A pending transaction status therefore
persists for **one to three banking days**. This timing gap — between ODFI credit
commitment and RDFI access-control enforcement — is what the formal model is
built to expose.

---

## 3. Overview of ACH Model-Based Verification

### 3.1 Threat model — four capabilities

- **C-1** — The adversary controls legitimate bank accounts at U.S. financial
  institutions, opened through standard procedures, and may assume the role of
  Originator, Receiver, or both.
- **C-2** — The adversary can obtain routing and account numbers for bank
  accounts from public sources (personal checks) or data breaches, **without
  online banking credentials**.
- **C-3** — The adversary can initiate or receive ACH transactions through
  consumer interfaces (banking portals, mobile apps, or third-party payment
  providers), controlling transaction parameters (payment type, SEC code,
  account type, and amount).
- **C-4** — The adversary can modify accounts under their own control through
  standard banking features such as holds, closures, and debit blocks.

**Assumptions.** Financial institutions faithfully apply the Nacha Operating
Rules and do not collude with adversaries. The ACH network reliably delivers
messages within the specified timing windows. Victim account holders behave
honestly and remain unaware of unauthorized transaction activity until they
discover it later.

### 3.2 Framework components

**Standards and specification analysis.** The Nacha Operating Rules, RDFI and
ODFI documentation, SEC code specifications, and regulatory materials from
banking authorities. The complete payment lifecycle spans multiple
organizations, and rules for a single transaction appear across sections and
appendices, which requires constant cross-referencing.

**Scope reduction.** Building a complete formal model from the full
specification is impractical: the Nacha Operating Rules span **728 pages**
defining **25 SEC codes**, **87 return codes**, and **14 change notification
codes**, and modeling all elements yields an undecidable verification problem.
The model is therefore scoped to **domestic, standard consumer ACH transactions
performed over the internet** (e.g., paying a credit-card bill), which captures
the dominant transaction volume and the primary consumer-fraud attack surface.
Both direct ACH transfers and transactions started through third-party payment
providers are modeled; under Nacha rules those providers act as Third-Party
Senders (TPSs) and use micro-deposit-based authentication.

**Abstract protocol model.** ACH payment procedures are modeled as a
parameterized system of communicating FSMs. The system model M comprises five
participant types: Originators O, an ODFI BO, the ACH Operator A, an RDFI BR,
and Receivers R, with parameterized counts of Originators and Receivers. M is
extended with an adversarial machine embodying the threat capabilities to form
M^adv, which is then checked against formal security properties.

**Model checking process (M^adv ⊨ Φ).** M^adv was first validated against the
Nacha Operating Rules through a counterexample-driven debugging loop, correcting
the model whenever a trace exhibited specification-inconsistent behavior until
all traces conformed. Each security requirement was then expressed as a safety
invariant over the reachable states of M^adv; model checking either established
that the invariant holds or returned a counterexample trace identifying the
structural protocol mechanism producing the violation.

**Validating counterexamples.** For each counterexample, bank accounts are
configured to match the preconditions in the trace, the attack sequence is run
through banking portals, and the resulting state changes are observed. Because
the authors lack access to internal bank logs or ACH trace files, validation is
black-box, from user-visible artifacts in online banking dashboards.

---

## 4. Formal Modeling of ACH Payments

### 4.1 Modeling components

**Participant FSMs.** Communicating finite state machines among Originators (O),
the ODFI (BO), the ACH Operator (A), the RDFI (BR), and Receivers (R). Each
participant type gets an independent FSM template so the protocol can be built
modularly and reasoned about compositionally. Each template F is a tuple
(S, s₀, V, Σ, δ): a finite set of states, an initial state, local state
variables, a message alphabet, and guarded transitions δ : S × Guards → S × Actions.

**States.** Defined by a combination of names and associated variables. For
instance, Boolean variables in BO such as `entry_validated` and
`batch_submitted` record whether the ODFI has validated an incoming ACH entry
and submitted the batch to the Operator.

**Transitions.** Labeled `guard/action`. Guards are propositional formulas over
local variables, received messages, and environment variables. Non-empty guards
are required for all transitions to ensure deterministic state progression.
Environment variables are Boolean flags set non-deterministically by the model
checker to explore alternative execution paths.

**Messages and channels.** Only the critical message fields related to
authorization and settlement are modeled (account numbers, routing numbers,
transaction codes, amounts). ACH communication is abstracted through two
channels:

- **C_info** transmits payment instructions, acknowledgments, and settlement
  data between participants (Originator ↔ ODFI, ODFI ↔ Operator, Operator ↔ RDFI).
- **C_$** executes fund transfers during settlement.

**System composition.**

```
M = (E, O¹, …, O^nO, BO, A, BR, R¹, …, R^nR, C_info, C_$)
```

where E controls global timing variables. The model is bounded so the state
space stays finite: **each Originator initiates at most two transactions, each
batch contains at most three entries, and three batch processing windows are
modeled per verification run.**

### 4.2 Adversarial instrumentation

M is extended with adversarial capabilities to obtain M^adv. Originators and
Receivers are instrumented with **nondeterministic** state transitions capturing
the C-1…C-4 behaviors, letting the model checker exhaustively explore all attack
strategies permitted by the specification. For example, a malicious Originator
may link a business checking account when only authorized for consumer accounts,
or may swap the routing and account numbers of a legitimate account to redirect
funds.

### 4.3 Addressing underspecification

#### U1 — Undefined authentication standards

Nacha Article 2, Subsection 2.5.17.5:

> "An Originator of a debit WEB Entry must establish and implement commercially
> reasonable methods of authentication to verify the identity of the Receiver of
> the debit WEB Entry."

Nacha Article 2, Subsection 2.2.1:

> "The ODFI must utilize a commercially reasonable method to verify the identity
> of an Originator or Third-Party Sender at the time the ODFI enters into an
> Origination Agreement with the Originator or Third-Party Sender."

The specification does not define what constitutes commercially reasonable
methods of authentication or enumerate acceptable security factors, leaving
critical implementation decisions to individual financial institutions. Two key
procedures rest on it: `linkExternalAccount` (authorizes Originators to debit
Receiver accounts) and `verifyAccount` (establishes Third-Party Sender
agreements) — different trust requirements, same vague standard.

**Addressing U1.** A survey of public documentation from major U.S. banks,
digital-only banks, credit-card issuers, and payment providers found three
deployed mechanisms: manual-link, web-login (directly or via aggregators such as
Plaid), and micro-deposits ($0.01–$0.99). Third-party payment providers combine
manual linking with micro-deposits. **All three are incorporated into M**, chosen
non-deterministically during the `linkExternalAccount` transition, so the model
checker explores all reachable executions under these authentication choices.

#### U2 — Temporal definition ambiguities

Five timing-related underspecifications (Table 2 of the paper):

| Process         | Ambiguity / underspecification                                                                                                                   |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| Stop Payment    | Unlike the fixed 3-day rule for recurring entries, Single/Subsequent Entries require only a "reasonable opportunity to act", which is subjective (§3.7.1.2). |
| Return Deadline | The deadline is "opening of business" on the second Banking Day (§3.8), which is not defined by a specific time of day and varies by DFI operations. |
| Banking Day     | Dual-reference definition (§8.15) allows settlement to occur on a "scheduled date" even if the RDFI is closed / it is not a Banking Day (§7.6).     |
| Reversals       | The 24-hour transmission window is triggered by the "discovery" of the error (§2.9.3), a subjective event lacking a standardized timestamp.         |
| Recredit        | An RDFI must recredit a consumer account "promptly" upon receipt of a valid claim (§3.11.1). The Rules do not define "promptly" in hours or days.   |

Nacha Article 8, Section 8.15 — the Banking Day definition:

> "with reference to a Participating DFI, any day on which such Participating
> DFI is open to the public during any part of such day for carrying on
> substantially all of its banking functions, and, with reference to an ACH
> Operator, any day on which the applicable facility of such ACH Operator is
> being operated."

**Addressing U2.** Two modeling decisions preserve logical ordering. First, all
participants operate within a common time zone and share a calendar, which
removes inter-institutional timing discrepancies. Second, subjective deadline
language ("reasonable opportunity", "promptly") is replaced with a deterministic
rule: actions initiated before the end-of-day complete within the current
Banking Day; actions initiated after the end-of-day complete at the start of the
next Banking Day.

#### U3 — Conflicting error conditions

Appendix 2, Part 2.4:

> "The ACH Operator will either pend or Reject the entire File or any batch(es)
> meeting one or more of the error conditions identified below: … When the
> Transaction Code in an Entry Detail Record is invalid, … When the Amount field
> in an Entry Detail Record is non-numeric."

Part 2.5, however, states that error conditions R19 (Amount Field Error) and R36
(Return of Improper Credit Entry) will **never** cause file or batch rejection,
directly contradicting Part 2.4.

**Addressing U3.** Because the specification does not fix the correct ACH
Operator behavior, **all admissible BatchProcessing transition behaviors are
modeled** — transition conditions for both variants. The same policy applies
wherever alternative behaviors are explicitly or implicitly permitted (optional
parameters, "may", "should"), as long as none is evidently weak or insecure.

### 4.4 Modeling time-dependent behavior

Modeling time with discrete clock ticks causes state-space explosion. Timing
windows are modeled instead as **Boolean variable pairs**: `event_started` and
`event_expired`. An ongoing settlement window is
`settlement_started ∧ ¬settlement_expired`.

Example encoding of "If an originator initiates an ACH credit on Wednesday by
5:00 p.m. for Friday settlement, the RDFI must make funds available by 9:00 a.m.
Friday":

```
complete := achCredit(Oi, Rj, e) ∧ transfer_started(e)
          ∧ settlement_started(e) ∧ ¬settlement_expired(e)
          ⟹ FundsAvailable(Rj, e)
```

### 4.5 Batch processing

Batch membership is encoded within individual transaction states rather than
explicit containers. Each transaction e maintains
`σ_e = e.payment_state` over the domain:

```
σ_e ∈ { not_submitted, submitted, batched, pending_settlement,
        settled, rejected, returned, reversed }
```

Batch transmission is a synchronized global transition triggered by collection
window closure (`batch_expired`). At closure, batch B_t = { e ∈ T : σ_e = submitted },
and atomicity is enforced by:

```
∀ e ∈ T . (σ_e = submitted ∧ batch_expired) → σ'_e = batched
```

---

## 5. Property-Guided Model Analysis

### 5.1 The three invariants

#### Φ1 — Continuous Authorization

Every settled entry must have been submitted while authorized and must not have
been revoked between submission and settlement:

```
∀ o, r, E . EntrySettled(E, o, r) ⟹ Authorized(E, o, r) ∧ ¬Revoked(E, o, r)
```

`EntrySettled(E, o, r)` holds when the ODFI has posted a provisional credit for
entry E to Originator o's account on behalf of Receiver r, committing liquidity
regardless of the ultimate network-side disposition of the entry. **This is an
ODFI-local commitment event.** It holds as soon as the ODFI advances funds, and
remains true even if the underlying ACH debit is subsequently returned.

`Authorized(E, o, r)` holds when, at the moment o submits E, r's authorization
for o is in force. `Revoked(E, o, r)` holds when r revokes authorization for o
between submission of E and its terminal state.

An RDFI-side debit restriction that blocks settlement yields counterexamples in
the same predicate pattern as mid-window revocation, because the ODFI path can
advance while the receiver never grants a debit that survives through
settlement. The abstraction is conservative and yields no false positives.

**A violation enables unauthorized transfers by exploiting the gap between
authorization at initiation and fund movement at settlement.**

#### Φ2 — Zero-Sum Invariant

For any complete cycle, the number of credit entries must equal the number of
debit entries within each entry class:

```
∀ c . CycleComplete(c) ⟹ ⋀_{k ∈ K} CountCredits(c, k) = CountDebits(c, k)
```

with amount classes K = { micro, regular }, where all entries within class k
carry the same nominal amount a_k. `CycleComplete(c)` holds when all entries in
cycle c have reached a terminal state (settled, returned, or reversed).

**A violation allows an attacker to extract funds, for example by accepting
credits while preventing the corresponding debits.**

#### Φ3 — Settlement Finality

Resources dependent on entry E may be released only after E's return window has
closed:

```
∀ r, E . ResourceAvailable(r, E) ⟹ ReturnWindowClosed(E)
```

Settlement in the ACH model is operationally defined as "the return window
closed without an intervening return", so requiring window closure subsumes
settlement as the irrevocability condition. `ResourceAvailable(r, E)` captures
the moment r (credit limit, account balance) becomes accessible, which begins at
internal posting and may precede external settlement by several days.

**A counterexample is a path in which resources become available while the entry
remains provisional.**

### 5.2 Implementation and validation setup

**Model composability.** Five protocol participant FSMs (O, BO, A, BR, R)
encoded as composable **nuXmv** modules communicating over two shared
single-slot buses (`c_info_channel` and `c_dollar_channel`), implementing the
abstract channels C_info and C_$. The top-level composition instantiates **two
adversarial Originators, two adversarial Receivers, one ODFI, one ACH Operator,
and one RDFI**, along with the environment controller E. Each property — Φ1, Φ2,
Φ3 — is encoded in nuXmv as a single `INVARSPEC` safety predicate over the state
space of M^adv.

**Verification setup.** nuXmv's `INVARSPEC` engine applies **IC3/PDR** backward
reachability, which proves or refutes the invariant over all reachable states of
the finite bounded model. For each property, the checker either proves the
invariant holds or produces a counterexample trace π_i, interpreted as a
structural witness to a protocol-level security failure.

**Validation setup.** Live consumer accounts:

- **two checking accounts at two major U.S. banks** (one active and one dormant,
  for testing A1),
- **three credit-card accounts**,
- **three accounts with third-party payment providers**.

For each counterexample, accounts were configured to match the identified
preconditions and the attack sequences executed manually through banking
portals, recording observable state changes: balances, timestamps, status
transitions, fund availability, ACH return timing, and final transaction states.

**Artifact.** `https://doi.org/10.5281/zenodo.22701199` — the
complete model source, property files, and scripts to reproduce all
counterexamples.

---

## 6. Security vulnerabilities in the ACH system

Three ACH security failures aligned with counterexamples π₁, π₂, π₃ for
invariants Φ1, Φ2, Φ3.

### 6.1 A1 — Authorization-as-Access-Control in ACH Debit Processing

**The flaw.** The ODFI treats routing number validation alone as grounds to
initiate debits, without verifying account accessibility at the RDFI. An
adversary links a victim's account using valid routing and account numbers,
which the ODFI accepts and forwards to the ACH operator. The ODFI grants
provisional credit **within one to two days, creating a two-day window during
which the adversary can extract funds**. When targeting debit-restricted or
dormant accounts, the RDFI returns the transaction days later (e.g., with return
code **R16** when the account is blocked for debits), resulting in financial loss
to the ODFI after the adversary has withdrawn the provisionally credited amount.

**Analysis (π₁).** An Originator submits an entry E targeting a debit-restricted
Receiver account; the ODFI accepts the submission after
`CheckRoutingValidity(routing_number) = VALID`; the entry advances to
`AUTHORIZED`; the ODFI grants provisional credit; and several days later the RDFI
returns **R16 (Account Frozen/Blocked)** and the entry transitions to `RETURNED`.
`EntrySettled(E, o, r)` holds at the moment the ODFI posts the provisional
credit, while `Authorized(E, o, r)` does not hold at the RDFI.

A1 is assigned to Φ1 because the exploitable defect is an
**authorization-architecture failure**: the ODFI commits liquidity on the basis
of routing-number validity alone, treating a single upfront check as continuous
authorization through settlement. The provisional credit is a consequence of
that failure rather than its cause.

**Root cause.** The ODFI validates only routing and account number format when
initiating a debit, without checking whether the target account is locked,
debit-restricted, or otherwise restricted. It then grants provisional credit
immediately, assuming settlement will succeed, even though actual fund transfer
takes up to five days.

**Structural gap.** ACH provides **no real-time cross-institution account-status
query primitive**. Its absence forces ODFIs to commit liquidity at
routing-validation time and to learn restriction status only when a return code
arrives during settlement.

**Empirical assessment.** Tested with Bank A (ODFI) and Bank B (RDFI). A dormant
Bank B account was linked as the debit target using only its routing and account
numbers (Fig. 4); an active Bank A account served as the credit destination. An
external ACH debit was submitted from Bank A to Bank B (Fig. 5a). Observed,
black-box, from the banks' dashboards only:

1. After submission, Bank A showed the debit as pending with no immediate error.
2. **Three days later, Bank A made the funds available before settlement** (Fig. 5b).
3. Bank B did not debit the debit-restricted account.
4. Several days later, Bank B returned **R16** with a message indicating the
   account was blocked for debits, and Bank A reversed the credit.

A1 is feasible against any victim whose routing and account numbers are known
(capability C-2). When the targeted account is *not* debit-restricted, the attack
results in funds being transferred from the victim to the attacker's account
without any additional verification or control.

Figures: **3** (sequence diagram), **4** (external account linking interface),
**5** (debit scheduling + dashboard showing funds received before settlement).

### 6.2 A2 — Micro-Deposit Verification

**The flaw.** Payment providers verify bank account ownership through
micro-deposits: small ACH credits the user reports back. To settle these credits
the provider tries to withdraw the same amounts. **Successful credits are
mistakenly treated as implicit authorization for debits.** Debit permission is
enforced only at withdrawal, not during verification. Linking a debit-blocked
account makes deposits succeed and withdrawals fail, so micro-deposits accumulate
without repayment.

**Analysis (π₂).** A Third-Party Sender posts micro-class credits to a target
account through `ProcessCredit(account, amount)`; the credits complete without
return codes; the account transitions to `LINKED`; and the matching micro-class
debits fail with **R08 (Payment Stopped)** or **R16 (Account Frozen for
Debits)**. At the close of the cycle,
`CountCredits(c, micro) > CountDebits(c, micro)`, violating the per-class
equality required by Φ2.

The violation arises because the verification subprotocol decides linkage on
credit success alone, while ACH accounts support **asymmetric permission
configurations** that allow inbound credits while blocking outbound debits. The
provider commits to a `LINKED` state before observing any debit outcome.

π₂ captures the single-cycle violation. The empirical attack amplifies it through
**iterative cycle cancellation and restart**, where each new cycle issues
additional credits without recovering prior deposits.

**Root cause.** The micro-deposit flow assumes credit success implies debit
capability. Payment providers further allow verification restarts **without rate
limiting**.

**Structural gap.** ACH provides **no pre-flight debit-capability query
primitive**. Its absence forces payment providers to determine whether an account
permits debits only by submitting an actual debit and observing the response.

**Empirical assessment.** Evaluated against **three major payment providers (A,
B, C)** by linking a bank account configured with ACH-debit restrictions. All
three credited the account with micro-deposits, but **every corresponding
reversal failed** (Fig. 7). Repeatedly canceling and re-initiating verification
caused each reset to issue new micro-deposits, enabling multiple accumulation
cycles per verification reset. The issue is further amplified by providers that
do not impose timeouts on repeated reversal failures.

Figures: **6** (sequence diagram), **7a** (successful micro-deposits), **7b**
(failed reversals).

### 6.3 A3 — Premature Posting-as-Settlement

**The flaw.** Credit-card payment systems decouple internal posting from ACH
settlement but operate under the assumption that both stages will ultimately
align. The issuer restores the user's available credit once the payment posts
internally (**typically within two days**), even though the ACH debit that must
supply the funds typically settles only after several more days (**usually five
to seven days**). Posting is an issuer-local bookkeeping event, while settlement
depends entirely on the external bank's access-control policy.

**Analysis (π₃).** An entry E transitions to `POSTED` at t_posting; the issuer's
`CanWithdraw(account, amount)` guard evaluates to true based on
`InternalBalance(account)`; the resource (restored credit limit or available
balance) becomes accessible at t_availability; and an ACH return arrives at
t_return **before** the return window expires. `ResourceAvailable(r, E)` holds
while `ReturnWindowClosed(E)` is still false, leaving a **four- to five-day
window** during which the entry can still be reversed. The guard on the
`POSTED → AVAILABLE_FOR_WITHDRAWAL` transition consults only internal ledger
state and never blocks on external settlement confirmation.

**Root cause.** The issuer restores the credit limit upon internal posting,
treating it as settlement confirmation despite having no guarantee the
underlying ACH debit will succeed. Because ACH failures surface only days later,
the issuer commits to a financial state before funds are confirmed.

**Structural gap.** ACH provides **no proactive settlement-status query
primitive**. Its absence forces issuers to learn settlement only
retrospectively, through the absence of a return before window closure.

**Empirical assessment.** Tested on **three credit-card accounts**. For each
card, a debit-restricted bank account was linked and the full card balance paid.

1. Upon submission, the issuer displayed the usual message that payments *"take a
   couple of days to process"* and that the balance and available credit would
   update *"once your payment posts"* (Fig. 8b).
2. **In all cases the issuer posted the payment within two business days**,
   marking it as paid, showing a zero balance, and restoring the full credit
   limit while the ACH debit remained unsettled (Fig. 8c) — which allowed
   immediate new spending.
3. Because posting is internal and does not depend on ACH settlement, the process
   repeats: submit a payment, wait for posting, spend against the restored
   credit. **By scheduling multiple payments, available credit could be inflated
   by several times.**
4. **After about six business days, the ACH debit was returned** because the
   linked account was restricted (Fig. 8d).

The issuer also reversed the payment but **did not charge interest (APR of about
26%)** for the time spent using the restored credit, as the account had been
marked as paid in the internal ledger until the reversal. Even a cardholder who
does not aim to spend money can use this method to avoid APR charges.

Figures: **8a** (payment scheduled on linked ACH-debit-blocked account), **8b**
(issuer shows pending until internal posting completes), **8c** (paid balance
with limit restored before bank account debits), **8d** (bank returns the ACH
debit from restricted account).

---

## 7. Remedies and Design Implications

1. **Continuous Authorization Enforcement.** Authorization in ACH workflows
   should be treated as a persistent predicate rather than a one-time check at
   initiation. ACH debits must remain conditionally authorized until settlement
   succeeds. Any change in the debit eligibility of the source account during the
   settlement window should invalidate the transaction and revoke provisional
   credits. Banks ought to revalidate authorization at posting and again prior to
   settlement finalization, rather than assuming monotonic validity. *(Φ1)*

2. **Delayed Exposure of Provisional Credits.** User-visible balances and
   spendable funds should not reflect provisional credits until the corresponding
   debit has passed an enforceable access-control point. If provisional crediting
   is necessary, such credits should be placed in an **isolated state**, not usable
   for withdrawals, transfers, bill payments, or credit-line restoration. *(Φ3)*

3. **Explicit Zero-Sum Enforcement Across Institutions.** Settlement workflows
   must enforce a cross-institution zero-sum invariant throughout execution, not
   only at final reconciliation. Any workflow that exposes funds at one
   institution without a guaranteed, enforceable debit at another should be
   treated as inconsistent. Banks and third-party payment providers are required
   to track debits and credits as a **single logical transfer** and prohibit user
   access until both sides reach a committed state. *(Φ2)*

4. **Symmetric Verification in Account Linking.** Micro-deposit-based account
   linking must verify **both** inbound credit acceptance and outbound debit
   capability before an account is marked usable. Linking workflows must treat
   failed debit recovery as a verification failure and prevent repeated credit
   issuance for canceled or retried verification attempts. *(Φ2)*

5. **Specification-Level Clarification.** Payment network standards must clarify
   (i) whether authorization is ongoing or a one-time event, (ii) if provisional
   credits are user-visible, and (iii) how settlement failures are handled in
   user-visible state. Underspecification allows protocol-compliant but insecure
   executions. *(U1, U2, U3)*

---

## 8. Related Work

To the authors' knowledge, this is **the first work to apply formal verification
to study the security of the ACH banking system**.

- **Security analysis of payment systems** — EMV card payments, application-layer
  exploits in personal payment platforms, authentication flaws in India's UPI,
  implementation weaknesses in mobile money apps, digital wallet exploits.
  Return-code exploitation in ACH batch workflows appears in banking fraud
  advisories and regulatory guidance, but those treatments characterize the
  problem **operationally**, documenting that exploitation occurs without
  identifying the protocol-level causes.
- **Systemic cyber risk in financial systems** — macro-oriented literature on
  market failures and cascading liquidity shortfalls. This work instead targets
  protocol- and workflow-level properties of ACH-style batch settlement.
- **Formal verification for network protocol security** — finite-state techniques
  routinely analyze message-based protocol security; this work reuses that
  template (temporal properties over permitted behaviors) but targets ACH's
  batch-settlement and cross-institution workflows.

---

## 9. Conclusion

A formal security analysis of U.S. banking payment workflows, modeling ACH
processing with adversarial capabilities and verifying three core security
invariants: continuous authorization, zero-sum integrity, and settlement
finality. **The bank-transfer payment systems studied did not consistently
enforce the security guarantees they are assumed to provide.** The framework
yields counterexamples that identify concrete vulnerabilities in debit
authorization, micro-deposit verification, and premature credit-card payment
posting. Black-box experiments on real U.S. banks and third-party payment
providers confirm the presence of these attacks in production systems.
Coordinated disclosure led to remediation by affected institutions.

---

## Ethics and Disclosure

**Attack evaluation.** All attacks were conducted against accounts under the
authors' own control to avoid collateral harm to third parties. The banks and
third-party payment providers bearing the financial losses were also informed
promptly. **No third-party accounts were affected at any point.**

The work is assessed under two frameworks: from a **consequentialist** view, the
benefit of exposing systemic vulnerabilities in widely used financial
infrastructure outweighs the minimal, self-contained risk incurred; from a
**deontological** view, confining experiments to accounts under the authors'
control ensures no third party is subjected to harm without consent.

**Disclosure timeline.**

| Date              | Event                                                                                                                                                           |
| ----------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **April 16, 2025** | Disclosures submitted to each relevant institution (banks and payment providers) through their official responsible-disclosure portals, with detailed reproduction steps, proof-of-concept demonstrations with screenshots, and technical reports. |
| *(subsequently)*  | Additional evidence provided; confirmation received that reports had been received and were under internal review.                                                |
| **May 2025**      | **A1 and A3 no longer viable.** A2 remained viable.                                                                                                              |
| **December 2025** | A2 still exploitable through **one** affected third-party payment provider.                                                                                      |
| **January 2026**  | **All affected payment providers had resolved A2.**                                                                                                              |

No detailed technical responses about remediation approaches were received. The
acknowledgment of vulnerabilities and the behavioral changes observed following
disclosure are consistent with active remediation efforts. The absence of
detailed technical engagement reflects a broader challenge in financial-sector
vulnerability disclosure where legal constraints routinely limit communication.

---

## Appendix A — Open Science

- **Formal model and verification artifacts** — FSM definitions, temporal-logic
  property specifications, and nuXmv input files at
  `https://doi.org/10.5281/zenodo.22701199`, including the
  complete model source, property files, and scripts to reproduce all
  counterexamples.
- **Empirical validation** — raw account screenshots and transaction logs cannot
  be shared publicly because they contain personally identifiable financial
  information. The paper provides redacted screenshots documenting the
  user-visible state changes for each attack.
- **Proprietary data** — the models are primarily derived from the Nacha
  Operating Rules, for which Nacha holds the rights. Access requires
  registration or purchase, so the rules are not included in the repository.

## Appendix B — Modeling Payment Batch Processing

**Collection-window lifecycle.** Two Boolean flags: `batch_started` (window
opening) and `batch_expired` (closure). ODFIs close the collection window at
predetermined intervals, typically once per business day, and send all
accumulated transactions in one batch. Transactions submitted after the window
closes stay in `submitted` until the next collection window ends.

**Transaction flow during the collection window.** Originators submit payment
entries that move from `not_submitted` to `submitted`. The ODFI validates each
against Nacha data-format rules; valid entries stay in `submitted` until batch
transmission, invalid entries move at once to `rejected`. When `batch_expired`
becomes true, every `submitted` transaction moves **atomically** to `batched`.

**ACH operator processing.** Transactions that pass the Operator's
data-acceptance checks move from `batched` to `pending_settlement`. Entries that
fail validation are rejected or returned under the applicable Nacha return reason
codes.

**RDFI processing.** Handling of `pending_settlement` transactions is modeled
**non-deterministically**, so the model can cover multiple outcomes from account
state and exception cases. RDFI handling is *not* atomic like batch transmission:
it depends on account-level state and can end in settlement, return, or other
dispositions under Nacha Article 4.

**Reversals.** A reversal introduces a compensating transaction with an
offsetting amount:

```
Reverse(e_i) ⟹ ∃ e_rev : amount(e_rev) = −amount(e_i)
```

Reversals must occur within five banking days after settlement, and batch headers
for reversal entries must carry the literal label `REVERSAL`.
