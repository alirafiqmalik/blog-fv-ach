/**
 * The scroll-scrubbing arithmetic and its `prefers-reduced-motion` branch.
 *
 * These live in a plain `.ts` module for the reason this template always uses:
 * `node --test` cannot import a `.tsx` under Node's type stripping, and the two
 * properties worth asserting here — "reduced motion shows the *final* keyframe"
 * and "there are no dead frames at either end of a sticky scene" — are exactly
 * the ones a headless machine cannot check by looking.
 *
 *   npm run test:unit
 */

import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import {
  clamp01,
  counterValue,
  formatCents,
  formatDollars,
  isLatched,
  scenePosition,
  stepOpacity,
  trackHeight,
} from "../src/components/scroll-scene.ts";

const STICKY = readFileSync(
  new URL("../src/components/StickyScene.tsx", import.meta.url),
  "utf8",
);

const SCENES = [
  "SplitLedger",
  "AchPipeline",
  "AchOverview",
  "AttackScene",
  "ModelGraph",
  "DisclosureTimeline",
].map((name) => ({
  name,
  source: readFileSync(
    new URL(`../src/components/${name}.tsx`, import.meta.url),
    "utf8",
  ),
}));

// ------------------------------------------------------------------- clamp

describe("clamp01", () => {
  test("passes the unit interval through untouched", () => {
    for (const v of [0, 0.25, 0.5, 1]) assert.equal(clamp01(v), v);
  });

  test("absorbs rubber-band overshoot at both ends", () => {
    assert.equal(clamp01(-0.4), 0);
    assert.equal(clamp01(1.9), 1);
  });

  test("a NaN scroll value reads as the start, not as a crash", () => {
    assert.equal(clamp01(Number.NaN), 0);
  });
});

// ---------------------------------------------------------- scene position

describe("scenePosition", () => {
  test("step 0 is already showing before the reader has scrolled", () => {
    const p = scenePosition(0, 5);
    assert.equal(p.index, 0);
    assert.equal(p.local, 0);
  });

  test("the last step is still showing when the track runs out", () => {
    // The bug this guards: progress === 1 landing on index === count, which
    // renders nothing and makes a sticky scene flash empty on the way out.
    const p = scenePosition(1, 5);
    assert.equal(p.index, 4);
    assert.equal(p.local, 1);
  });

  test("steps divide the track evenly", () => {
    assert.equal(scenePosition(0.0, 4).index, 0);
    assert.equal(scenePosition(0.3, 4).index, 1);
    assert.equal(scenePosition(0.55, 4).index, 2);
    assert.equal(scenePosition(0.8, 4).index, 3);
  });

  test("local progress runs 0 → 1 within each step", () => {
    const p = scenePosition(0.375, 4); // halfway through step 1
    assert.equal(p.index, 1);
    assert.equal(Math.round(p.local * 100) / 100, 0.5);
  });

  test("the index never escapes the step list, whatever scroll reports", () => {
    for (const progress of [-2, -0.01, 1.01, 5]) {
      const p = scenePosition(progress, 3);
      assert.ok(p.index >= 0 && p.index <= 2, `index ${p.index} for ${progress}`);
    }
  });

  test("reduced motion pins the scene to its FINAL keyframe", () => {
    // Not to the first, which would be a blank scene, and not to a faster
    // scrub, which is still motion.
    const p = scenePosition(0, 6, true);
    assert.deepEqual(p, { index: 5, local: 1, overall: 1 });
  });

  test("reduced motion ignores scroll entirely", () => {
    assert.deepEqual(scenePosition(0.3, 6, true), scenePosition(0.9, 6, true));
  });

  test("a scene with no steps is a programming error, not a blank render", () => {
    assert.throws(() => scenePosition(0, 0), /at least one step/);
  });
});

// ------------------------------------------------------------ track height

describe("trackHeight", () => {
  test("gives each step a viewport, plus one to rest on", () => {
    assert.equal(trackHeight(5), "600vh");
  });

  test("reduced motion collapses the track to a single viewport", () => {
    // Otherwise the accommodation would be six blank screens of scrolling.
    assert.equal(trackHeight(5, true), "100vh");
  });
});

// ---------------------------------------------------------- step cross-fade

describe("stepOpacity", () => {
  test("the current step is fully drawn once its fade completes", () => {
    assert.equal(stepOpacity(2, { index: 2, local: 0.9, overall: 0.5 }), 1);
  });

  test("the outgoing step hands over to the incoming one", () => {
    const position = { index: 2, local: 0.1, overall: 0.5 };
    const incoming = stepOpacity(2, position);
    const outgoing = stepOpacity(1, position);
    assert.ok(incoming > 0 && incoming < 1);
    assert.ok(outgoing > 0 && outgoing < 1);
    assert.equal(Math.round((incoming + outgoing) * 1000) / 1000, 1);
  });

  test("steps that are neither current nor outgoing are not drawn", () => {
    const position = { index: 2, local: 0.5, overall: 0.5 };
    assert.equal(stepOpacity(0, position), 0);
    assert.equal(stepOpacity(4, position), 0);
  });

  test("no step is ever partly transparent at rest", () => {
    for (let i = 0; i < 5; i += 1) {
      const opacity = stepOpacity(i, { index: i, local: 1, overall: 1 });
      assert.equal(opacity, 1);
    }
  });
});

// -------------------------------------------------------- latched ledger state

describe("isLatched", () => {
  const flags = [false, false, true, false, false];

  test("state stays on once it has happened", () => {
    // A posted credit does not un-post because the reader kept scrolling.
    for (const index of [2, 3, 4]) {
      assert.equal(isLatched(flags, { index, local: 0, overall: 0 }), true);
    }
  });

  test("state is off before it happens", () => {
    for (const index of [0, 1]) {
      assert.equal(isLatched(flags, { index, local: 0, overall: 0 }), false);
    }
  });
});

// ------------------------------------------------------------------ counters

describe("counterValue", () => {
  const values = [1401, 1401, 2401, 2401];

  test("a counter reads its step's value for most of the step", () => {
    assert.equal(counterValue(values, { index: 1, local: 0, overall: 0 }), 1401);
    assert.equal(counterValue(values, { index: 1, local: 0.5, overall: 0 }), 1401);
  });

  test("it tweens into the next value near the step boundary", () => {
    const mid = counterValue(values, { index: 1, local: 0.85, overall: 0 });
    assert.ok(mid > 1401 && mid < 2401, `expected a value in flight, got ${mid}`);
  });

  test("it lands exactly on the next step's value", () => {
    assert.equal(counterValue(values, { index: 1, local: 1, overall: 0 }), 2401);
  });

  test("the last step has nothing to tween into", () => {
    assert.equal(counterValue(values, { index: 3, local: 1, overall: 1 }), 2401);
  });

  test("an empty list is zero, not a crash", () => {
    assert.equal(counterValue([], { index: 0, local: 0, overall: 0 }), 0);
  });
});

describe("money formatting", () => {
  test("dollars are whole and grouped", () => {
    assert.equal(formatDollars(2401), "$2,401");
    assert.equal(formatDollars(16500), "$16,500");
  });

  test("dollars round rather than showing a tween's fractional cents", () => {
    assert.equal(formatDollars(2400.6), "$2,401");
  });

  test("micro-deposits are cents, and keep both decimal places", () => {
    assert.equal(formatCents(34), "$0.34");
    assert.equal(formatCents(8), "$0.08");
  });
});

// ------------------------------------------------------- component contract

describe("scenes delegate their arithmetic", () => {
  test("StickyScene imports the schedule rather than re-deriving it", () => {
    assert.match(STICKY, /from "\.\/scroll-scene\.ts"/);
    assert.match(STICKY, /scenePosition/);
    assert.match(STICKY, /trackHeight/);
  });

  test("StickyScene renders the finished scene before hydration", () => {
    // progress starts at 1 so SSR and the no-JavaScript reader get the last
    // keyframe. Starting at 0 would ship a blank first paint.
    assert.match(
      STICKY,
      /useState\(1\)/,
      "the pre-hydration progress must be 1, not 0",
    );
  });

  test("StickyScene consults prefers-reduced-motion and gates scrubbing on it", () => {
    assert.match(STICKY, /useReducedMotion/);
    assert.match(
      STICKY,
      /useReducedMotion\(\)\s*\?\?\s*false/,
      "the hook returns null on the server; the static path must be the default",
    );
    assert.match(STICKY, /if \(!isStatic\) setProgress/);
  });

  test("StickyScene falls back to a static figure on narrow viewports", () => {
    assert.match(STICKY, /matchMedia/);
    assert.match(STICKY, /SCRUB_MIN_WIDTH/);
  });

  test("no scene hardcodes a fade constant of its own", () => {
    for (const scene of SCENES) {
      assert.ok(
        !/const\s+FADE\s*=/.test(scene.source),
        `${scene.name} forks the cross-fade; it belongs to scroll-scene.ts`,
      );
      assert.match(
        scene.source,
        /from "\.\/(scroll-scene|StickyScene)/,
        `${scene.name} should build on the shared scene primitive`,
      );
    }
  });

  test("no scene imports an animation runtime other than Motion", () => {
    // One runtime. GSAP, ScrollTrigger and Lenis are excluded from this project.
    for (const scene of [...SCENES, { name: "StickyScene", source: STICKY }]) {
      for (const banned of ["gsap", "ScrollTrigger", "lenis"]) {
        assert.ok(
          !scene.source.includes(banned),
          `${scene.name} pulls in ${banned}`,
        );
      }
    }
  });
});
