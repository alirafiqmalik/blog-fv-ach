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
  LINKING_METHODS,
  PARTICIPANTS,
  PIPELINE_STEPS,
} from "../src/data/ach-pipeline.ts";

const COMPONENT = readFileSync(
  new URL("../src/components/AchPipeline.tsx", import.meta.url),
  "utf8",
);

const MDX = readFileSync(new URL("../src/paper.mdx", import.meta.url), "utf8");

/** Source with comments removed — assertions are about behaviour, not prose. */
function code(source: string): string {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/(^|[^:])\/\/.*$/gm, "$1");
}

const BODY = code(COMPONENT);

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

// ----------------------------------------------------- and no fork elsewhere

describe("nothing else declares a timeline", () => {
  test("the page mounts the pipeline instead of retyping it", () => {
    for (const step of PIPELINE_STEPS) {
      const opening = step.caption.slice(0, 40);
      assert.ok(
        !MDX.includes(opening),
        `src/paper.mdx restates the caption for "${step.id}"`,
      );
    }
  });

  test("the page does not mount a second timeline beside the attack scene", () => {
    assert.equal((MDX.match(/<AchPipeline/g) ?? []).length, 0);
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
