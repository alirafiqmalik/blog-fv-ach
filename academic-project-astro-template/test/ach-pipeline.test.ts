/**
 * The pipeline is the spine, and there is exactly one of it.
 *
 * `src/data/ach-pipeline.ts` is the only copy of the five-day timeline. §3
 * scrubs it, A3's narrative leans on it, and §8 replays it with the gap closed.
 * The most likely way to break this site is for one of those to grow a second
 * copy of the days or the captions and then drift — so this file is mostly a
 * source contract saying: draw the data, do not restate it.
 *
 *   npm run test:unit
 */

import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import {
  LEGS,
  LINKING_METHODS,
  PARTICIPANTS,
  PIPELINE_STEPS,
  stepOf,
} from "../src/data/ach-pipeline.ts";

const COMPONENT = readFileSync(
  new URL("../src/components/AchPipeline.tsx", import.meta.url),
  "utf8",
);

const OVERVIEW = readFileSync(
  new URL("../src/components/AchOverview.tsx", import.meta.url),
  "utf8",
);

import { DEFAULT_VERSION, VERSIONS } from "../src/data/versions.ts";

/** Every version's authored page — none of them may retype the timeline. */
const PAGES = VERSIONS.map((v) => ({
  id: v.id,
  source: readFileSync(new URL(`../${v.source}`, import.meta.url), "utf8"),
}));

const MDX = PAGES.find((p) => p.id === DEFAULT_VERSION)!.source;

/** Source with comments removed — assertions are about behaviour, not prose. */
function code(source: string): string {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/(^|[^:])\/\/.*$/gm, "$1");
}

const BODY = code(COMPONENT);
const OVERVIEW_BODY = code(OVERVIEW);

// ------------------------------------------------------------ participants

describe("participants", () => {
  test("five, in ACH order", () => {
    assert.deepEqual(
      PARTICIPANTS.map((p) => p.id),
      ["originator", "odfi", "operator", "rdfi", "receiver"],
    );
  });

  test("each has both a role name and a plain-language name", () => {
    for (const p of PARTICIPANTS) {
      assert.ok(p.label.length > 0, `${p.id} has no role label`);
      assert.ok(p.short.length > 0, `${p.id} has no plain name`);
      assert.notEqual(p.label, p.short);
    }
  });

  test("every step acts at a real participant", () => {
    const ids = new Set(PARTICIPANTS.map((p) => p.id));
    for (const step of PIPELINE_STEPS) {
      assert.ok(ids.has(step.at), `step "${step.id}" acts at unknown "${step.at}"`);
    }
  });

  test("the token visits the ODFI and the RDFI, in that order", () => {
    const lanes = PIPELINE_STEPS.map((s) => s.at);
    assert.ok(lanes.indexOf("odfi") < lanes.indexOf("rdfi"));
  });
});

// -------------------------------------------------------- one timeline only

describe("AchPipeline draws the data module", () => {
  test("it imports the steps rather than declaring them", () => {
    assert.match(BODY, /from "\.\.\/data\/ach-pipeline\.ts"/);
    assert.match(BODY, /PIPELINE_STEPS/);
    assert.match(BODY, /PARTICIPANTS/);
  });

  test("the component names no step id of its own", () => {
    for (const step of PIPELINE_STEPS) {
      assert.ok(
        !BODY.includes(`"${step.id}"`),
        `AchPipeline names the step "${step.id}" — it must read the data module`,
      );
    }
  });

  test("the component names no banking day of its own", () => {
    // "Day 0 → Day 5" is the static summary label and is allowed; a per-step
    // day string is a second timeline.
    for (const step of PIPELINE_STEPS) {
      const occurrences = BODY.split(`"${step.day}"`).length - 1;
      assert.equal(
        occurrences,
        0,
        `AchPipeline hardcodes "${step.day}"; the day belongs to the step`,
      );
    }
  });

  test("the component quotes none of the captions", () => {
    for (const step of PIPELINE_STEPS) {
      const opening = step.caption.slice(0, 30);
      assert.ok(
        !BODY.includes(opening),
        `AchPipeline restates the caption for "${step.id}"`,
      );
    }
  });

  test("no step literal is declared inside the component", () => {
    assert.doesNotMatch(
      BODY,
      /\bid:\s*"/,
      "a step literal in the component is a fork of the data module",
    );
  });

  test("the closed variant is a mode, not a second diagram", () => {
    assert.match(BODY, /mode\s*[?:=]/);
    assert.match(BODY, /"closed"/);
    // One component file, one <StickyScene>, one <svg>.
    assert.equal(
      (BODY.match(/<StickyScene/g) ?? []).length,
      1,
      "the closed variant must reuse the same scene",
    );
    assert.equal(
      (BODY.match(/<svg/g) ?? []).length,
      1,
      "the closed variant must reuse the same drawing",
    );
  });

  test("the closed variant withholds the credit until the check has happened", () => {
    // That is what the remedy *is*, drawn.
    assert.match(BODY, /mode === "closed" \? checked : credited/);
    assert.match(BODY, /mode === "closed" \? false : isLatched\(GAP_FLAGS/);
  });
});

// ------------------------------------------------------------- the two legs

describe("the two money legs", () => {
  test("a credit leg and a debit leg, in that order", () => {
    assert.deepEqual(
      LEGS.map((l) => l.id),
      ["credit", "debit"],
    );
  });

  test("the credit leg is at the ODFI and the debit leg at the RDFI", () => {
    // That placement *is* the figure's point: the money appears at your bank
    // before their bank has checked anything.
    assert.equal(LEGS[0].at, "odfi");
    assert.equal(LEGS[1].at, "rdfi");
  });

  test("each leg points at a real pipeline step, and the credit comes first", () => {
    const [credit, debit] = LEGS.map((l) => stepOf(l));
    assert.ok(credit.credited, "the credit leg must sit on the step where the credit posts");
    assert.ok(debit.checked, "the debit leg must sit on the step where the RDFI checks");
    assert.ok(
      PIPELINE_STEPS.indexOf(credit) < PIPELINE_STEPS.indexOf(debit),
      "the credit leg must come before the debit leg on the timeline",
    );
  });

  test("only the credit leg is drawn as a posted credit", () => {
    assert.equal(LEGS[0].effect, "credit");
    assert.equal(LEGS[1].effect, "neutral");
  });

  test("stepOf rejects a dangling reference", () => {
    assert.throws(
      () => stepOf({ ...LEGS[0], step: "nowhere" as never }),
      /unknown step/,
    );
  });
});

// ------------------------------------------------- AchOverview draws the data

describe("AchOverview draws the data module", () => {
  test("it imports the participants, the legs and the steps", () => {
    assert.match(OVERVIEW_BODY, /from "\.\.\/data\/ach-pipeline\.ts"/);
    assert.match(OVERVIEW_BODY, /PARTICIPANTS/);
    assert.match(OVERVIEW_BODY, /\bLEGS\b/);
    assert.match(OVERVIEW_BODY, /PIPELINE_STEPS/);
    assert.match(OVERVIEW_BODY, /stepOf\(/);
  });

  test("it names no step id, banking day or caption of its own", () => {
    for (const step of PIPELINE_STEPS) {
      assert.ok(
        !OVERVIEW_BODY.includes(`"${step.id}"`),
        `AchOverview names the step "${step.id}"`,
      );
      assert.ok(
        !OVERVIEW_BODY.includes(`"${step.day}"`),
        `AchOverview hardcodes "${step.day}"`,
      );
      assert.ok(
        !OVERVIEW_BODY.includes(step.caption.slice(0, 30)),
        `AchOverview restates the caption for "${step.id}"`,
      );
    }
    for (const leg of LEGS) {
      assert.ok(
        !OVERVIEW_BODY.includes(leg.note),
        `AchOverview restates the ${leg.id} leg's note`,
      );
    }
    assert.doesNotMatch(OVERVIEW_BODY, /\bid:\s*"/);
  });

  test("the walk is a mode of the same drawing, not a second figure", () => {
    assert.match(OVERVIEW_BODY, /mode\s*[?:=]/);
    assert.match(OVERVIEW_BODY, /"walk"/);
    assert.match(OVERVIEW_BODY, /"hero"/);
    assert.equal((OVERVIEW_BODY.match(/<svg/g) ?? []).length, 1);
  });

  test("it colours each leg by asking the ledger helper", () => {
    assert.match(OVERVIEW_BODY, /ledgerToken\(leg\.effect\)/);
  });
});

// ----------------------------------------------------- and no fork elsewhere

describe("nothing else declares a timeline", () => {
  test("every page mounts the pipeline instead of retyping it", () => {
    for (const page of PAGES) {
      for (const step of PIPELINE_STEPS) {
        const opening = step.caption.slice(0, 40);
        assert.ok(
          !page.source.includes(opening),
          `${page.id} restates the caption for "${step.id}"`,
        );
      }
    }
  });

  test("no page mounts the old pipeline scene beside the overview figure", () => {
    for (const page of PAGES) {
      assert.equal(
        (page.source.match(/<AchPipeline/g) ?? []).length,
        0,
        `${page.id} mounts AchPipeline as well as AchOverview`,
      );
    }
    assert.ok(MDX.includes("<AchOverview"), "the default page does not mount the overview figure");
  });
});

// -------------------------------------------------------------- linking

describe("account linking", () => {
  test("all three methods the paper found are present", () => {
    assert.deepEqual(
      LINKING_METHODS.map((m) => m.id),
      ["manual", "web-login", "micro-deposit"],
    );
  });

  test("each is described in one sentence a reader can act on", () => {
    for (const method of LINKING_METHODS) {
      assert.ok(method.detail.length > 40, `${method.id} is under-explained`);
    }
  });
});
