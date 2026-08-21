/**
 * The ledger language, and the discipline that keeps it from bending.
 *
 * The storyboard's one non-negotiable about colour is that green means a credit
 * that posted and red means a debit that failed, and that nothing else may
 * borrow either. That is only enforceable if components ask `ledgerToken` for a
 * colour instead of writing one — so most of this file is a source contract.
 *
 *   npm run test:unit
 */

import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";

import {
  BEAT_DURATION,
  LEDGER_TOKENS,
  beatVariants,
  heroLoop,
  ledgerLabel,
  ledgerToken,
} from "../src/components/ledger-motion.ts";

const COMPONENT_DIR = new URL("../src/components/", import.meta.url);

/**
 * Strip comments before scanning source.
 *
 * These assertions are about what a component *does*, and a comment explaining
 * why it deliberately avoids something would otherwise read as the thing
 * itself — `CheckerSearch.tsx` says in prose that it does not call
 * `Math.random`, which is the opposite of a violation.
 */
function code(source: string): string {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/(^|[^:])\/\/.*$/gm, "$1")
    .replace(/\{\s*\/\*[\s\S]*?\*\/\s*\}/g, "");
}

const COMPONENTS = readdirSync(COMPONENT_DIR)
  .filter((name) => name.endsWith(".tsx"))
  .map((name) => ({
    name,
    source: code(readFileSync(new URL(name, COMPONENT_DIR), "utf8")),
  }));

// --------------------------------------------------------------- the tokens

describe("ledgerToken", () => {
  test("a posted credit is green and a failed debit is red", () => {
    assert.equal(ledgerToken("credit"), LEDGER_TOKENS.credit);
    assert.equal(ledgerToken("debit"), LEDGER_TOKENS.debit);
  });

  test("everything else is the rail — never a third meaning-bearing colour", () => {
    assert.equal(ledgerToken("neutral"), LEDGER_TOKENS.rail);
  });

  test("credit and debit are distinct, and neither is the site accent", () => {
    const { credit, debit, accent } = LEDGER_TOKENS;
    assert.notEqual(credit, debit);
    assert.notEqual(credit, accent);
    assert.notEqual(debit, accent);
  });

  test("every token resolves through a CSS variable, not a hex literal", () => {
    for (const [name, value] of Object.entries(LEDGER_TOKENS)) {
      assert.match(value, /^var\(--ach-/, `${name} is not a palette variable`);
    }
  });
});

describe("ledgerLabel", () => {
  test("colour is never the only carrier of meaning", () => {
    assert.match(ledgerLabel("credit"), /credit/);
    assert.match(ledgerLabel("debit"), /debit/);
    assert.notEqual(ledgerLabel("credit"), ledgerLabel("debit"));
  });
});

// ------------------------------------------------------------- the variants

describe("beatVariants", () => {
  test("an element arrives from nothing and settles complete", () => {
    const v = beatVariants(false);
    assert.equal(v.hidden.opacity, 0);
    assert.equal(v.visible.opacity, 1);
    assert.equal(v.visible.x, 0);
    assert.equal(v.visible.y, 0);
  });

  test("an offset is where it starts, never where it ends", () => {
    const v = beatVariants(false, { x: -14, y: 8 });
    assert.equal(v.hidden.x, -14);
    assert.equal(v.hidden.y, 8);
    assert.equal(v.visible.x, 0);
    assert.equal(v.visible.y, 0);
  });

  test("a stagger delay reaches the transition", () => {
    assert.equal(beatVariants(false, {}, 0.5).visible.transition?.delay, 0.5);
    assert.equal(beatVariants(false).visible.transition?.duration, BEAT_DURATION);
  });

  test("reduced motion makes the HIDDEN state the finished element", () => {
    // The point: an element that never gets its cue is still fully drawn.
    for (const offset of [{}, { x: -20, y: 10 }]) {
      const v = beatVariants(true, offset, 0.9);
      assert.deepEqual(
        { opacity: v.hidden.opacity, x: v.hidden.x, y: v.hidden.y },
        { opacity: 1, x: 0, y: 0 },
      );
      assert.equal(v.visible.transition?.duration, 0);
      assert.equal(v.visible.transition?.delay ?? 0, 0);
    }
  });

  test("only opacity and transform are animated", () => {
    // Animating width/height/filter would repaint every scroll frame.
    const allowed = new Set(["opacity", "x", "y", "transition"]);
    for (const reduced of [false, true]) {
      for (const state of Object.values(beatVariants(reduced, { x: 4 }, 0.2))) {
        for (const key of Object.keys(state)) {
          assert.ok(allowed.has(key), `variant animates "${key}"`);
        }
      }
    }
  });
});

describe("heroLoop", () => {
  test("the hero is the one scene that plays by itself", () => {
    const loop = heroLoop(false);
    assert.ok(loop);
    assert.equal(loop.repeat, Infinity);
    assert.ok(loop.duration > 1, "and it is unhurried");
  });

  test("reduced motion arms no loop at all", () => {
    // A slower loop is still a loop. Null is the switch the component reads to
    // render the landed frame instead.
    assert.equal(heroLoop(true), null);
  });
});

// ------------------------------------------------------- component contract

describe("components keep the ledger language", () => {
  test("no component writes a ledger colour directly", () => {
    for (const component of COMPONENTS) {
      // ledger-motion.ts is the only place these names are written, and it is
      // not a .tsx, so nothing in this list may name one.
      for (const banned of ["--ach-credit", "--ach-debit", "--ach-rail"]) {
        assert.ok(
          !component.source.includes(banned),
          `${component.name} names ${banned} directly instead of asking ledgerToken()`,
        );
      }
    }
  });

  test("no component hardcodes a hex colour", () => {
    const exempt = new Set([
      // The code block's surface, which is the prose theme's, not the ledger's.
      "InvariantCards.tsx",
    ]);
    for (const component of COMPONENTS) {
      if (exempt.has(component.name)) continue;
      assert.doesNotMatch(
        component.source,
        /#[0-9a-fA-F]{6}\b/,
        `${component.name} hardcodes a hex colour; use a palette token`,
      );
    }
  });

  test("every component that colours by outcome asks the helper", () => {
    for (const name of ["AttackScene.tsx", "BeforeAfter.tsx"]) {
      const component = COMPONENTS.find((c) => c.name === name);
      assert.ok(component, `${name} is missing`);
      assert.match(
        component.source,
        /ledgerToken\(/,
        `${name} must pick its colour from the beat's declared effect`,
      );
    }
  });

  test("no component re-derives the beat duration", () => {
    for (const component of COMPONENTS) {
      assert.ok(
        !/const\s+BEAT_DURATION\s*=/.test(component.source),
        `${component.name} forks BEAT_DURATION`,
      );
    }
  });

  test("nothing calls Math.random during render", () => {
    // A random layout gives the server and the client different DOM and blows
    // up hydration — CheckerSearch's tree is deterministic for this reason.
    for (const component of COMPONENTS) {
      assert.ok(
        !component.source.includes("Math.random"),
        `${component.name} randomises during render`,
      );
    }
  });
});
