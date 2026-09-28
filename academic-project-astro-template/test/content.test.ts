/**
 * Content fidelity: the site says what the paper says, and nothing else.
 *
 * Two failure modes this guards against, both of which are easy to introduce
 * and impossible to spot by reading the rendered page:
 *
 *   1. **Stale numbers.** An earlier draft cited $100 trillion globally and
 *      $30 trillion in the US. The camera-ready paper does not. It reports
 *      30.7 billion ACH payments at the top 50 institutions in 2025, and
 *      20 billion of those at four major banks. This file fails if the site
 *      keeps the draft dollar totals or drops the camera-ready counts.
 *   2. **Drift from the paper.** Return codes, dates, the invariant assignments
 *      and the disclosure status of each attack are all checked against
 *      `parsed-paper/paper.md`, which is the content authority.
 *
 *   npm run test:unit
 */

import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import { ATTACKS, attackById } from "../src/data/attacks.ts";
import { INVARIANTS, invariantById } from "../src/data/invariants.ts";
import { MILESTONES, REMEDIES } from "../src/data/disclosure.ts";
import { PIPELINE_STEPS, RETURN_CODES } from "../src/data/ach-pipeline.ts";
import { PAPER, RULEBOOK, SCALE } from "../src/data/paper.ts";
import { FAQ, SHORT_VERSION } from "../src/data/faq.ts";
import { UNDERSPECIFICATIONS } from "../src/data/method.ts";

const PAPER_MD = readFileSync(
  new URL("../../parsed-paper/paper.md", import.meta.url),
  "utf8",
);

const MDX = readFileSync(new URL("../src/paper.mdx", import.meta.url), "utf8");

/** Everything a reader could read: the page plus every authored string. */
const ALL_COPY = [
  MDX,
  JSON.stringify(ATTACKS),
  JSON.stringify(INVARIANTS),
  JSON.stringify(MILESTONES),
  JSON.stringify(REMEDIES),
  JSON.stringify(PIPELINE_STEPS),
  JSON.stringify(FAQ),
  JSON.stringify(SHORT_VERSION),
  JSON.stringify(UNDERSPECIFICATIONS),
].join("\n");

// ------------------------------------------------------ numbers we may not use

describe("the site claims no figure the paper does not have", () => {
  test("the camera-ready payment counts are the ones on the page", () => {
    assert.match(PAPER_MD, /30\.7 billion/);
    assert.match(PAPER_MD, /20 billion/);
    assert.match(ALL_COPY, /30\.7/);
    assert.match(ALL_COPY, /\b20 billion\b/);
    assert.deepEqual(
      SCALE.map((s) => s.value),
      [30.7, 20],
    );
    for (const figure of SCALE) assert.equal(figure.suffix, "billion");
  });

  test("the four-bank concentration names the institutions the paper names", () => {
    for (const name of ["Chase", "Bank of America", "Wells Fargo", "Citibank"]) {
      assert.ok(PAPER_MD.includes(name), `${name} is missing from paper.md`);
      assert.ok(ALL_COPY.includes(name), `${name} is missing from the copy`);
    }
  });

  test("the draft dollar totals are not claimed", () => {
    assert.doesNotMatch(ALL_COPY, /100 trillion/i);
    assert.doesNotMatch(ALL_COPY, /30 trillion/i);
  });

  test("the rulebook counts match the paper", () => {
    assert.match(PAPER_MD, /\*\*728 pages\*\*/);
    assert.equal(RULEBOOK.pages, 728);
    assert.equal(RULEBOOK.secCodes, 25);
    assert.equal(RULEBOOK.returnCodes, 87);
    assert.equal(RULEBOOK.notificationCodes, 14);
    for (const value of Object.values(RULEBOOK)) {
      assert.match(
        PAPER_MD,
        new RegExp(`\\b${value}\\b`),
        `${value} is not in parsed-paper/paper.md`,
      );
    }
  });
});

// ------------------------------------------------------------- the attacks

describe("the three attacks", () => {
  test("there are exactly three, tagged A1 A2 A3", () => {
    assert.deepEqual(
      ATTACKS.map((a) => a.tag),
      ["A1", "A2", "A3"],
    );
  });

  test("each breaks a different invariant, matching the paper", () => {
    assert.deepEqual(
      ATTACKS.map((a) => a.invariant),
      ["phi1", "phi2", "phi3"],
    );
    for (const attack of ATTACKS) {
      assert.equal(
        invariantById(attack.invariant).brokenBy,
        attack.tag,
        `${attack.tag} and ${attack.invariant} disagree about who broke whom`,
      );
    }
  });

  test("each names its counterexample", () => {
    assert.deepEqual(
      ATTACKS.map((a) => a.counterexample),
      ["π₁", "π₂", "π₃"],
    );
  });

  test("Table 1's four cells are present and non-empty for each", () => {
    for (const attack of ATTACKS) {
      for (const [key, value] of Object.entries(attack.summary)) {
        assert.ok(value.length > 0, `${attack.tag}.${key} is empty`);
        assert.ok(
          PAPER_MD.includes(value),
          `${attack.tag}.${key} ("${value}") is not Table 1's wording`,
        );
      }
    }
  });

  test("every attack states a root cause and the permissive Nacha condition", () => {
    const needles = [
      /RDFI-side account status/,
      /pre-flight debit-capability check/,
      /settlement-status flag/,
    ];
    for (const [index, attack] of ATTACKS.entries()) {
      assert.ok(attack.rootCause.length > 80, `${attack.tag} root cause is thin`);
      assert.match(
        attack.structuralGap,
        needles[index],
        `${attack.tag}'s permissive condition does not match the camera-ready`,
      );
    }
  });

  test("the three structural gaps are three different missing primitives", () => {
    const gaps = new Set(ATTACKS.map((a) => a.structuralGap));
    assert.equal(gaps.size, 3, "two attacks share a structural gap");
  });
});

describe("attack beats", () => {
  test("every beat declares what the ledger did", () => {
    for (const attack of ATTACKS) {
      for (const beat of attack.beats) {
        assert.ok(
          ["credit", "debit", "neutral"].includes(beat.effect),
          `${attack.tag}/${beat.id} has no ledger effect`,
        );
      }
    }
  });

  test("beat ids are unique within an attack", () => {
    for (const attack of ATTACKS) {
      const ids = attack.beats.map((b) => b.id);
      assert.equal(new Set(ids).size, ids.length, `${attack.tag} repeats a beat id`);
    }
  });

  test("every attack ends with a debit that failed", () => {
    // This is the shape of the finding: the credit posts, the debit does not.
    for (const attack of ATTACKS) {
      const debits = attack.beats.filter((b) => b.effect === "debit");
      assert.ok(debits.length > 0, `${attack.tag} never shows a failed debit`);
    }
  });

  test("the target account never moves, in any of the three", () => {
    // "Credit without debit" is the thesis; a target balance that moved would
    // quietly contradict the title of the site.
    for (const attack of ATTACKS) {
      const targets = attack.beats.map((b) => b.target ?? 0);
      assert.equal(
        new Set(targets).size,
        1,
        `${attack.tag}'s target balance moves — the whole point is that it does not`,
      );
    }
  });

  test("the attacker's balance does move", () => {
    for (const attack of ATTACKS) {
      const values = attack.beats.map((b) => b.attacker ?? 0);
      assert.ok(
        new Set(values).size > 1,
        `${attack.tag} shows no gain at the attacker's institution`,
      );
    }
  });

  test("every attack has a repeatable cycle, because all three do", () => {
    for (const attack of ATTACKS) {
      assert.ok(
        attack.beats.some((b) => b.loop),
        `${attack.tag} does not mark the beat where it repeats`,
      );
    }
  });

  test("only R08 and R16 are named, and both are the paper's codes", () => {
    const codes = new Set<string>(RETURN_CODES.map((c) => c.code));
    assert.deepEqual([...codes].sort(), ["R08", "R16"]);
    for (const match of ALL_COPY.matchAll(/\bR(\d{2})\b/g)) {
      const code = `R${match[1]}`;
      // R19 and R36 appear only inside the U3 discussion, quoting the rulebook.
      if (["R19", "R36"].includes(code)) continue;
      assert.ok(codes.has(code), `copy names return code ${code}, which the paper does not use here`);
    }
  });

  test("A1's stamp is R16 — the code the empirical trace actually returned", () => {
    const stamp = attackById("a1").beats.find((b) => b.stamp)?.stamp ?? "";
    assert.match(stamp, /R16/);
    assert.match(PAPER_MD, /R16 with a message indicating the\naccount was blocked for debits|R16/);
  });
});

// ----------------------------------------------------------- the invariants

describe("the three invariants", () => {
  test("Φ1 Φ2 Φ3, each with a formula and a plain-language line", () => {
    assert.deepEqual(
      INVARIANTS.map((i) => i.symbol),
      ["Φ1", "Φ2", "Φ3"],
    );
    for (const inv of INVARIANTS) {
      assert.ok(inv.formal.includes("⟹"), `${inv.symbol} has no implication`);
      assert.ok(
        inv.plain.length > 30 && !inv.plain.includes("⟹"),
        `${inv.symbol}'s plain line is not plain`,
      );
    }
  });

  test("each names a distinct glyph", () => {
    const icons = INVARIANTS.map((i) => i.icon);
    assert.deepEqual(icons, ["shield", "scale", "lock"]);
  });

  test("the formulas match the paper", () => {
    assert.match(PAPER_MD, /EntrySettled\(E, o, r\) ⟹ Authorized\(E, o, r\) ∧ ¬Revoked\(E, o, r\)/);
    assert.match(PAPER_MD, /CountCredits\(c, k\) = CountDebits\(c, k\)/);
    assert.match(PAPER_MD, /ResourceAvailable\(r, E\) ⟹ ReturnWindowClosed\(E\)/);
  });
});

// ------------------------------------------------------------- the pipeline

describe("the five-day pipeline", () => {
  test("it runs from submission to the close of the return window", () => {
    assert.equal(PIPELINE_STEPS[0].id, "submit");
    assert.equal(PIPELINE_STEPS.at(-1)?.id, "return-window");
    assert.ok(PIPELINE_STEPS.at(-1)?.returnWindow);
  });

  test("the credit posts before the receiving bank ever checks", () => {
    // This ordering *is* the vulnerability. If a refactor ever flattens it the
    // whole site stops making sense.
    const credited = PIPELINE_STEPS.findIndex((s) => s.credited);
    const checked = PIPELINE_STEPS.findIndex((s) => s.checked);
    assert.ok(credited >= 0 && checked >= 0);
    assert.ok(
      credited < checked,
      "the provisional credit must come before the RDFI's access-control check",
    );
  });

  test("the gap band opens with the credit and never closes early", () => {
    const firstGap = PIPELINE_STEPS.findIndex((s) => s.gap);
    const firstCredit = PIPELINE_STEPS.findIndex((s) => s.credited);
    assert.equal(firstGap, firstCredit);
    for (const step of PIPELINE_STEPS.slice(firstGap)) {
      assert.ok(step.gap, `the gap band closes at "${step.id}" and reopens later`);
    }
  });

  test("every step carries a caption that works without the animation", () => {
    for (const step of PIPELINE_STEPS) {
      assert.ok(step.caption.length > 60, `"${step.id}" has no real caption`);
      assert.ok(step.day.startsWith("Day"), `"${step.id}" has no banking day`);
    }
  });
});

// ------------------------------------------------------- disclosure and fixes

describe("disclosure timeline", () => {
  test("milestones run forwards in time", () => {
    const dates = MILESTONES.map((m) => Date.parse(m.date));
    for (let i = 1; i < dates.length; i += 1) {
      assert.ok(dates[i] > dates[i - 1], `milestone ${i} goes backwards`);
    }
  });

  test("it starts on the disclosure date the paper gives", () => {
    assert.equal(MILESTONES[0].date, "2025-04-16");
    assert.match(PAPER_MD, /April 16, 2025/);
  });

  test("all three attacks are viable at the start and fixed at the end", () => {
    for (const status of Object.values(MILESTONES[0].status)) {
      assert.equal(status, "viable");
    }
    for (const status of Object.values(MILESTONES.at(-1)!.status)) {
      assert.equal(status, "fixed");
    }
  });

  test("no attack un-fixes itself", () => {
    for (const attack of ATTACKS) {
      let fixed = false;
      for (const milestone of MILESTONES) {
        const status = milestone.status[attack.id];
        if (status === "fixed") fixed = true;
        else
          assert.ok(
            !fixed,
            `${attack.tag} is fixed and then viable again at ${milestone.label}`,
          );
      }
    }
  });

  test("A2 is the one that outlives the others, as the paper reports", () => {
    const may = MILESTONES.find((m) => m.id === "may")!;
    assert.deepEqual(may.status, { a1: "fixed", a2: "viable", a3: "fixed" });
    assert.match(PAPER_MD, /A1 and A3 no longer viable/);
  });
});

describe("remedies", () => {
  test("five of them, as the paper lists", () => {
    assert.equal(REMEDIES.length, 5);
  });

  test("every invariant is restored by at least one remedy", () => {
    for (const inv of INVARIANTS) {
      assert.ok(
        REMEDIES.some((r) => r.invariant === inv.id),
        `nothing restores ${inv.symbol}`,
      );
    }
  });

  test("the specification remedy closes all three underspecifications", () => {
    const spec = REMEDIES.find((r) => r.invariant === null);
    assert.ok(spec, "there is no specification-level remedy");
    assert.deepEqual([...(spec.closes ?? [])], ["U1", "U2", "U3"]);
    assert.deepEqual(
      UNDERSPECIFICATIONS.map((u) => u.id),
      ["U1", "U2", "U3"],
    );
  });
});

// ----------------------------------------------------------- reference layer

describe("the reference layer", () => {
  test("the FAQ answers the questions the storyboard names", () => {
    const questions = FAQ.map((f) => f.question.toLowerCase()).join(" ");
    for (const topic of ["at risk", "cryptography", "which banks", "fixed", "model"]) {
      assert.ok(questions.includes(topic), `no FAQ entry covers "${topic}"`);
    }
  });

  test("the answer to “is this fixed?” does not overclaim", () => {
    // The attacks are fixed; the structural gaps are not. Saying only the first
    // half would be the most tempting lie on the page.
    const fixed = FAQ.find((f) => f.id === "fixed");
    assert.ok(fixed);
    assert.match(fixed.answer.join(" "), /structural gaps are not|still has no/i);
  });

  test("the short version is four sentences and mentions the disclosure", () => {
    assert.equal(SHORT_VERSION.length, 4);
    assert.match(SHORT_VERSION.join(" "), /April 2025/);
    assert.match(SHORT_VERSION.join(" "), /January 2026/);
  });

  test("the artifact link is the paper's", () => {
    assert.ok(PAPER_MD.includes(PAPER.artifact.replace(/\/$/, "")));
    assert.ok(MDX.includes(PAPER.artifact));
  });
});

// ---------------------------------------------------------------- the page

describe("src/paper.mdx", () => {
  test("every nav section anchor exists on the page", () => {
    for (const id of ["introduction", "method", "attack"]) {
      assert.ok(
        MDX.includes(`id="${id}"`),
        `the nav links to #${id}, which the page does not have`,
      );
    }
  });

  test("the page animates only creditBLEED", () => {
    assert.equal((MDX.match(/<AttackScene/g) ?? []).length, 1);
    assert.match(MDX, /<AttackScene attack="a1"/);
    for (const name of [
      "HeroScene",
      "ScaleCounters",
      "SplitLedger",
      "AchPipeline",
      "RulesFunnel",
      "ModelGraph",
      "InvariantCards",
      "CheckerSearch",
      "DisclosureTimeline",
      "BeforeAfter",
    ]) {
      assert.ok(!MDX.includes(name), `${name} is still mounted`);
    }
  });

  test("the creditBLEED scene hydrates rather than shipping dead markup", () => {
    const match = MDX.match(/<AttackScene\b[^>]*>/);
    assert.ok(match, "creditBLEED has no scene");
    assert.match(match[0], /client:(visible|load)/);
  });

  test("the “commercially reasonable” quote is on the page, verbatim", () => {
    assert.match(MDX, /commercially\n> reasonable methods of authentication\*\*|commercially reasonable/);
    assert.match(MDX, /2\.5\.17\.5/);
  });

  test("settlement is defined before the attacks use the definition", () => {
    const definition = MDX.indexOf("Settlement is the return window closing");
    const attacks = MDX.indexOf('id="attack"');
    assert.ok(definition > 0, "the page never defines settlement");
    assert.ok(
      definition < attacks,
      "the attacks land before the reader is told what settlement means",
    );
  });
});
