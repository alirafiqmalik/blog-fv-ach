/**
 * Contract test for the GitHub Pages deploy workflow.
 *
 * The workflow itself can only be exercised by pushing to main, so what is
 * testable offline is the wiring between it and this package: the Node floor,
 * the app directory it builds in, the scripts it calls, and the output
 * directory it uploads. Those are exactly the things that drift silently — a
 * renamed script or a changed `outDir` still builds locally and is only caught
 * once a deploy has already been attempted.
 *
 *   npm run test:unit
 *
 * No test framework — node:test with native TypeScript type stripping.
 */

import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { basename, join } from "node:path";

// ---------------------------------------------------------------- locations

/** This package (…/academic-project-astro-template/). */
const APP_DIR = fileURLToPath(new URL("..", import.meta.url));
/** The git repository root, one level above this package. */
const REPO_ROOT = fileURLToPath(new URL("../..", import.meta.url));
/** The package directory name, as the workflow has to spell it. */
const APP_NAME = basename(APP_DIR);

const WORKFLOW_PATH = join(REPO_ROOT, ".github", "workflows", "deploy.yml");

const workflow = existsSync(WORKFLOW_PATH)
  ? readFileSync(WORKFLOW_PATH, "utf8")
  : "";

const pkg = JSON.parse(readFileSync(join(APP_DIR, "package.json"), "utf8")) as {
  engines: { node: string };
  scripts: Record<string, string>;
};

const astroConfig = readFileSync(join(APP_DIR, "astro.config.ts"), "utf8");

// ---------------------------------------------------------------- utilities

/** The value of a `key: value` line in the workflow, unquoted. */
function valueOf(key: string): string {
  const found = workflow.match(new RegExp(`^\\s*${key}:\\s*(.+?)\\s*$`, "m"));
  assert.ok(found, `no \`${key}:\` entry in the workflow`);
  return found[1].replace(/^["']|["']$/g, "");
}

/** `[major, minor]` of the first version-like number in a semver range. */
function versionFloor(range: string): [number, number] {
  const found = range.match(/(\d+)(?:\.(\d+))?/);
  assert.ok(found, `no version number in "${range}"`);
  return [Number(found[1]), Number(found[2] ?? 0)];
}

/**
 * The shell commands a package script ultimately runs, with every `npm run X`
 * link expanded. `test` → `test:unit` + `test:build` → the three leaf commands
 * those bottom out in.
 */
function leafCommands(script: string, path: string[] = []): string[] {
  assert.ok(
    !path.includes(script),
    `"${script}" recurses: ${[...path, script].join(" → ")}`,
  );
  assert.ok(pkg.scripts[script], `no "${script}" script to expand`);
  return pkg.scripts[script].split("&&").flatMap((raw) => {
    const command = raw.trim();
    const nested = command.match(/^npm run ([\w:]+)$/);
    return nested ? leafCommands(nested[1], [...path, script]) : [command];
  });
}

/** The package scripts the workflow invokes, in file order. */
function scriptsTheWorkflowRuns(): string[] {
  return [...workflow.matchAll(/npm run ([\w:]+)/g)].map((m) => m[1]);
}

// ------------------------------------------------------------------ shape

describe("deploy workflow", () => {
  test("lives where GitHub Actions looks for it", () => {
    assert.ok(
      existsSync(WORKFLOW_PATH),
      "expected .github/workflows/deploy.yml at the repository root",
    );
  });

  test("runs on pushes to main and on manual dispatch", () => {
    assert.match(workflow, /branches:\s*\[\s*main\s*\]/);
    assert.match(workflow, /workflow_dispatch:/);
  });

  test("requests the permissions the Pages deployment needs", () => {
    assert.match(workflow, /pages:\s*write/);
    assert.match(workflow, /id-token:\s*write/);
  });

  test("serialises deploys behind a concurrency group", () => {
    assert.match(workflow, /concurrency:\s*\n\s*group:\s*\S+/);
  });

  test("uses the first-party Pages actions", () => {
    for (const action of [
      "actions/checkout@",
      "actions/setup-node@",
      "actions/configure-pages@",
      "actions/upload-pages-artifact@",
      "actions/deploy-pages@",
    ]) {
      assert.ok(workflow.includes(action), `workflow must use ${action}`);
    }
  });
});

// -------------------------------------------------------------- app wiring

describe("deploy workflow ↔ package wiring", () => {
  test("runs its steps inside this package", () => {
    assert.match(
      workflow,
      new RegExp(`working-directory:\\s*${APP_NAME}\\s*$`, "m"),
      `the app lives in ${APP_NAME}/, not at the repository root`,
    );
  });

  test("restores the npm cache from this package's lockfile", () => {
    assert.equal(
      valueOf("cache-dependency-path"),
      `${APP_NAME}/package-lock.json`,
    );
    assert.ok(
      existsSync(join(APP_DIR, "package-lock.json")),
      "npm ci needs a committed package-lock.json",
    );
  });

  test("pins a Node version that satisfies engines.node", () => {
    const [wantMajor, wantMinor] = versionFloor(pkg.engines.node);
    const [gotMajor, gotMinor] = versionFloor(valueOf("node-version"));
    assert.ok(
      gotMajor > wantMajor || (gotMajor === wantMajor && gotMinor >= wantMinor),
      `workflow pins Node ${gotMajor}.${gotMinor}, under engines.node ${pkg.engines.node}`,
    );
  });

  test("calls only scripts this package defines", () => {
    const called = scriptsTheWorkflowRuns();
    assert.ok(called.length > 0, "workflow runs no npm scripts");
    for (const script of called) {
      assert.ok(
        pkg.scripts[script],
        `workflow calls missing script "${script}"`,
      );
    }
  });

  test("type-checks, unit-tests and build-asserts before deploying", () => {
    assert.ok(
      workflow.includes("npm ci"),
      "dependencies must come from the lockfile",
    );
    assert.ok(
      workflow.includes("npm run test:unit"),
      "unit tests must gate the deploy",
    );
    assert.ok(
      workflow.includes("npm run build"),
      "the deploy must build through astro check",
    );
    assert.match(pkg.scripts.build, /astro check/);
    assert.ok(
      workflow.includes("npm run assert"),
      "the build-assertion harness must gate the deploy",
    );
    assert.match(pkg.scripts.assert, /assert-build\.mjs/);
  });

  test("gates on everything `npm test` would have run", () => {
    // The workflow deliberately spells the gates out rather than calling
    // `npm test`: that lets it add `astro check` and avoids running
    // `astro build` twice. The cost is that a step added to `npm test` would
    // not reach the deploy — so the decomposition is pinned to the
    // composition here rather than left to reviewer memory.
    const gated = new Set(
      scriptsTheWorkflowRuns().flatMap((s) => leafCommands(s)),
    );
    for (const command of leafCommands("test")) {
      assert.ok(
        gated.has(command),
        `\`npm test\` runs "${command}", but no workflow gate does — ` +
          `add it to .github/workflows/deploy.yml`,
      );
    }
  });

  test("publishes only after the gated build job succeeds", () => {
    // Without `needs`, the deploy job runs concurrently with the build and
    // publishes whatever artifact is around — the gating steps above would
    // still fail, but the red build would no longer stop the release.
    assert.match(
      workflow,
      /^\s*needs:\s*build\s*$/m,
      "the deploy job must depend on the build job",
    );
  });

  test("runs every gate before the artifact is uploaded", () => {
    const upload = workflow.indexOf("actions/upload-pages-artifact@");
    assert.notEqual(upload, -1, "workflow uploads no artifact");
    for (const gate of [
      "npm run test:unit",
      "npm run build",
      "npm run assert",
    ]) {
      assert.ok(
        workflow.indexOf(gate) < upload,
        `"${gate}" must run before the artifact is uploaded`,
      );
    }
  });

  test("uploads the directory astro build actually writes", () => {
    assert.equal(valueOf("path"), `${APP_NAME}/dist`);
    assert.doesNotMatch(
      astroConfig,
      /outDir/,
      "astro.config.ts overrides outDir; the workflow still uploads dist/",
    );
  });
});
