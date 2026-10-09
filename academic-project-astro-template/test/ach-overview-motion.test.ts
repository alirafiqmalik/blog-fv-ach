/**
 * The hero figure's motion, and the three promises it has to keep: reduced
 * motion arms no loop, the loop ends on the finished frame, and the backdrop
 * never competes with the title.
 *
 *   npm run test:unit
 */

import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import {
  BACKDROP_OPACITY,
  BACKDROP_OPACITY_MAX,
  GHOST,
  arrivalTime,
  finalFrame,
  litKeyframes,
  overviewLoop,
  scrubTransition,
  tokenKeyframes,
} from "../src/components/ach-overview-motion.ts";

const LANES = [8, 29, 50, 71, 92];

const COMPONENT = readFileSync(
  new URL("../src/components/AchOverview.tsx", import.meta.url),
  "utf8",
);

const HEADER = readFileSync(
  new URL("../src/components/Header.astro", import.meta.url),
  "utf8",
);

function monotonic(times: number[]): boolean {
  return times.every((t, i) => i === 0 || t >= times[i - 1]);
}

describe("the backdrop never competes with the title", () => {
  test("the layer opacity is capped", () => {
    assert.ok(BACKDROP_OPACITY <= BACKDROP_OPACITY_MAX, `${BACKDROP_OPACITY} is over the cap`);
    assert.ok(BACKDROP_OPACITY_MAX < 0.5, "the cap itself must stay under half");
    assert.ok(BACKDROP_OPACITY > 0.2, "or the figure would be invisible");
  });

  test("the component applies the constant rather than a number of its own", () => {
    assert.match(COMPONENT, /BACKDROP_OPACITY/);
    assert.doesNotMatch(COMPONENT, /opacity:\s*0\.[0-9]+\s*[,}]/, "a literal opacity in the component");
  });

  test("the hero drops its colour wash when the figure is the background", () => {
    // The masthead gradient and the backdrop are alternatives, never stacked.
    assert.match(HEADER, /hasBackdrop/);
    assert.match(HEADER, /hasBackdrop\s*\?\s*"[^"]*"\s*:\s*"masthead/);
  });
});

describe("the loop", () => {
  test("plays by itself, unhurried", () => {
    const loop = overviewLoop(false);
    assert.ok(loop);
    assert.equal(loop.repeat, Infinity);
    assert.ok(loop.duration > 1);
  });

  test("reduced motion arms no loop at all", () => {
    assert.equal(overviewLoop(true), null);
  });
});

describe("the token", () => {
  test("visits every lane in order and holds at the last one", () => {
    const k = tokenKeyframes(LANES);
    assert.equal(k.property, "x");
    assert.deepEqual(k.values.slice(0, LANES.length), LANES);
    assert.equal(k.values.at(-1), LANES.at(-1));
    assert.equal(k.values.length, k.times.length);
  });

  test("times run 0 → 1 and never go backwards", () => {
    const k = tokenKeyframes(LANES);
    assert.equal(k.times[0], 0);
    assert.equal(k.times.at(-1), 1);
    assert.ok(monotonic(k.times));
  });

  test("the hold at the end is long enough to read", () => {
    const k = tokenKeyframes(LANES);
    const arrivedAtLast = k.times[LANES.length - 1];
    assert.ok(1 - arrivedAtLast >= 0.15, `the hold is only ${(1 - arrivedAtLast).toFixed(2)} of the loop`);
  });

  test("a rail needs two lanes", () => {
    assert.throws(() => tokenKeyframes([5]), /two lanes/);
    assert.throws(() => arrivalTime(5, 5), /off the rail/);
  });
});

describe("what lights when", () => {
  test("a leg is ghosted before the token arrives and lit from then on", () => {
    const k = litKeyframes(1, LANES.length);
    assert.equal(k.property, "opacity");
    assert.deepEqual(k.values, [GHOST, GHOST, 1, 1]);
    assert.ok(monotonic(k.times));
    assert.equal(k.times[2], arrivalTime(1, LANES.length));
    assert.equal(k.times.at(-1), 1);
  });

  test("the credit leg (lane 1) lights before the debit leg (lane 3)", () => {
    // That order *is* the figure's point.
    assert.ok(arrivalTime(1, LANES.length) < arrivalTime(3, LANES.length));
  });

  test("ghosted is visible, lit is opaque", () => {
    assert.ok(GHOST > 0 && GHOST < 0.5);
  });

  test("the loop ends on the finished frame", () => {
    const token = tokenKeyframes(LANES);
    const frame = finalFrame(LANES);
    assert.equal(token.values.at(-1), frame.x);
    for (const lane of [1, 3]) {
      assert.equal(litKeyframes(lane, LANES.length).values.at(-1), frame.opacity);
    }
  });
});

describe("the scrubbed walk", () => {
  test("moves with a short tween, and not at all when still", () => {
    assert.equal(scrubTransition(true).duration, 0);
    const moving = scrubTransition(false);
    assert.ok(moving.duration > 0 && moving.duration < 1);
  });
});

describe("the component", () => {
  test("renders the finished frame until it is armed on the client", () => {
    // The server, a no-JavaScript reader, and reduced motion all get the
    // final frame; the loop starts only after hydration.
    assert.match(COMPONENT, /finalFrame\(/);
    assert.match(COMPONENT, /useReducedMotion\(\)\s*\?\?\s*false/);
    assert.match(COMPONENT, /overviewLoop\(/);
  });

  test("animates only x and opacity on the figure", () => {
    for (const banned of ["width:", "height:", "margin", "fontSize:"]) {
      const inAnimate = new RegExp(`animate=\\{\\{[^}]*${banned}`);
      assert.doesNotMatch(COMPONENT, inAnimate, `animates ${banned}`);
    }
  });
});
