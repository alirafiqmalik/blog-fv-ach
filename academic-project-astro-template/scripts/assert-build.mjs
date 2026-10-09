#!/usr/bin/env node
/**
 * Build-assertion harness.
 *
 * `npm run test:unit` checks the modules; this checks the *pages a reader
 * gets*. The two catch different things: a data module can be perfectly
 * correct while an island fails to render, a base prefix is dropped, or a
 * scene ships as an empty div because its static branch was never written.
 *
 * The site is a redirect at `dist/index.html` plus one full page per entry in
 * `src/data/versions.ts`. The redirect gets its own short section; every
 * version page gets the full suite below, with a per-version list of the
 * server-rendered sentences it must carry.
 *
 * The load-bearing section is the static render: this site's whole
 * accessibility story is "the server renders the finished scene", and that is
 * invisible in a browser with JavaScript on. Run after `astro build`:
 *
 *   npm run test:build
 *
 * No dependencies — plain node:fs. Exits nonzero on any failed assertion.
 */

import { readFileSync, readdirSync, statSync, existsSync } from "node:fs";
import { join, relative, dirname } from "node:path";
import { fileURLToPath } from "node:url";

import { DEFAULT_VERSION, VERSIONS } from "../src/data/versions.ts";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const DIST = join(ROOT, "dist");
const BASE = "/blog-fv-ach";

// ---------------------------------------------------------------- utilities

/** Decode numeric and the common named HTML entities so assertions match
 *  regardless of how the build encodes non-ASCII characters like U+207A (⁺). */
function decodeEntities(s) {
  return s
    .replace(/&#x([0-9a-fA-F]+);/g, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(parseInt(d, 10)))
    .replace(/&nbsp;/g, " ")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&");
}

/** Short single-line excerpt of `text` centered on the first occurrence of
 *  `near` (or the start of the text), for failure messages. */
function excerpt(text, near, span = 160) {
  let at = 0;
  if (near) {
    const i = text.indexOf(near);
    if (i !== -1) at = Math.max(0, i - Math.floor(span / 4));
  }
  const raw = text.slice(at, at + span).replace(/\s+/g, " ").trim();
  return `${at > 0 ? "…" : ""}${raw}${at + span < text.length ? "…" : ""}`;
}

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, out);
    else out.push(p);
  }
  return out;
}

let failures = 0;
let passes = 0;

/** Assert `cond`; on failure print what was expected and what was found. */
function check(label, cond, { expected, found } = {}) {
  if (cond) {
    passes += 1;
    console.log(`  ok    ${label}`);
  } else {
    failures += 1;
    console.error(`  FAIL  ${label}`);
    if (expected) console.error(`        expected: ${expected}`);
    if (found) console.error(`        found:    ${found}`);
  }
}

function section(title) {
  console.log(`\n${title}`);
}

/** A built page, in the three forms the assertions read. */
function loadPage(file) {
  const rawHtml = readFileSync(file, "utf8");
  const html = decodeEntities(rawHtml);
  /** Text content only — assertions about what a reader sees, not markup. */
  const text = html
    .replace(/<script[\s\S]*?<\/script>/g, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ");
  const links = [...rawHtml.matchAll(/href="([^"]*)"/g)].map((m) => decodeEntities(m[1]));
  return { rawHtml, html, text, links };
}

// ------------------------------------------------------------------- inputs

if (!existsSync(join(DIST, "index.html"))) {
  console.error(`FAIL  dist/index.html not found at ${join(DIST, "index.html")}`);
  console.error("      run `astro build` first (or use `npm run test:build`).");
  process.exit(1);
}

const distFiles = walk(DIST);
console.log(`Asserting build output in ${relative(ROOT, DIST)}/ (${distFiles.length} files)`);

// ----------------------------------------------------- what each version says

/**
 * The server-rendered sentences each version must carry, by version id.
 *
 * These are the sentences a reader with no JavaScript must still get: the
 * first and last beats of the mounted scene, the return code, the definition
 * of settlement, the verbatim rule quote. A version missing from this map
 * fails the build, because a version with no static contract is a version
 * nobody has checked.
 */
const STATIC_CONTENT = {
  version1: [
    ["the hero overview figure's credit leg", "Credit leg"],
    ["the hero overview figure's debit leg", "Debit leg"],
    ["the walked pipeline's first step", "You ask for the money"],
    ["the walked pipeline's last step", "The return window"],
    ["creditBLEED's first beat", "We link a dormant account we own at Bank B"],
    ["creditBLEED's provisional credit", "Bank A posts a provisional credit"],
    ["creditBLEED's R16 stamp", "R16"],
    ["creditBLEED's last beat", "The target account balance never moves"],
    ["the static scene caption", "how it played out"],
    ["settlement, defined in prose", "Settlement is the return window closing"],
    ["the research question, verbatim", "do bank-transfer payment systems actually enforce the security guarantees"],
    ["the commercially reasonable quote", "commercially reasonable methods of authentication"],
    ["the adversary's capabilities", "C-4"],
    ["Table 1's exploit row", "ODFI credit without RDFI debit"],
    ["the first disclosure milestone", "Disclosed to every affected institution"],
    ["the remedies, snapped onto the properties", "Specification-level clarification"],
    ["the FAQ's first question", "Am I at risk?"],
    ["the short version", "The short version"],
  ],
};

/**
 * How each version states the three properties: the cards, the symbols, or
 * sentences, whichever that version renders on the server.
 */
const PROPERTY_LINES = {
  // The cards: name and plain-language line, server-rendered.
  version1: [
    "Permission must hold the whole way through",
    "Every credit needs its debit",
    "You get to use the money after it is final",
  ],
};

/** The paper figures each version must ship, by asset stem. */
const FIGURES = {
  version1: [
    "fig3-a1-sequence",
    "fig4-account-linking",
    "fig5-a1-dashboard",
    "fig6-microdeposit-sequence",
    "fig7-microdeposit-evidence",
    "fig8-a3-premature-posting",
  ],
};

// ------------------------------------------------------------ the root

section(`Root: redirects to the default version (/${DEFAULT_VERSION}/)`);

const root = loadPage(join(DIST, "index.html"));
const target = `${BASE}/${DEFAULT_VERSION}/`;

check("the default version is a registered version", VERSIONS.some((v) => v.id === DEFAULT_VERSION), {
  expected: `"${DEFAULT_VERSION}" in VERSIONS`,
  found: VERSIONS.map((v) => v.id).join(", "),
});

const refresh = root.rawHtml.match(/<meta http-equiv="refresh" content="([^"]+)"/)?.[1] ?? "";
check("the root carries an instant meta refresh to the default version", refresh === `0;url=${target}`, {
  expected: `content="0;url=${target}"`,
  found: refresh || "(no meta refresh)",
});

check("the root links to the default version for browsers that ignore the refresh", root.links.includes(target), {
  expected: `an href "${target}"`,
  found: root.links.join(", ") || "(no links)",
});

check("the root's canonical URL is the default version on the live site", /<link rel="canonical" href="https:\/\/[^"]+\/version\d+\/"/.test(root.rawHtml), {
  expected: 'a <link rel="canonical"> to https://…/versionN/',
  found: excerpt(root.rawHtml, "canonical"),
});

check("the root mounts no scene of its own", !root.rawHtml.includes("<astro-island"), {
  expected: "no <astro-island> on the root",
  found: excerpt(root.rawHtml, "<astro-island"),
});

check("the root is not the old chooser", !root.text.includes("pick one to read it"), {
  expected: "no chooser copy on the root",
  found: excerpt(root.text, "pick one"),
});

// ------------------------------------------------------------ each version

for (const version of VERSIONS) {
  const file = join(DIST, version.id, "index.html");

  section(`/${version.id}/ — the page builds`);
  check(`dist/${version.id}/index.html exists`, existsSync(file), {
    expected: `a built page for src/pages/${version.id}/`,
    found: distFiles.filter((f) => f.endsWith("index.html")).map((f) => relative(DIST, f)).join(", "),
  });
  if (!existsSync(file)) continue;

  const { rawHtml, html, text, links } = loadPage(file);

  // ------------------------------------------------------- identity and venue

  section(`/${version.id}/ — identity: title, venue, links`);

  const titleMatch = rawHtml.match(/<title>([^<]*)<\/title>/);
  const title = titleMatch ? decodeEntities(titleMatch[1]) : "";
  check('<title> is "Credit Without Debit"', title.includes("Credit Without Debit"), {
    expected: "the site title in <title>",
    found: titleMatch ? `<title>${title}</title>` : "no <title> tag",
  });

  check("the paper subtitle appears in the masthead", html.includes("Formal Verification of Banking Payment Systems"), {
    expected: "the paper subtitle in the masthead",
    found: excerpt(text, "Formal Verification"),
  });

  check("the authors are named", text.includes("Ali Hamza Malik") && text.includes("Muhammad Taqi Raza"), {
    expected: "both camera-ready authors",
    found: excerpt(text, "Malik"),
  });

  for (const fragment of ["CCS 2026", "The Hague"]) {
    check(`venue "${fragment}" appears`, text.includes(fragment), {
      expected: `"${fragment}" in the masthead`,
      found: excerpt(text, "CCS"),
    });
  }

  check("the Zenodo artifact is linked", links.some((h) => h.includes("10.5281/zenodo.22701199")), {
    expected: "an href to the Zenodo artifact",
    found: [...new Set(links.filter((h) => h.startsWith("http")))].slice(0, 8).join(", ") || "(none)",
  });

  check("the camera-ready PDF is linked", links.some((h) => h.includes("credit-without-debit.pdf")), {
    expected: "an href to credit-without-debit.pdf",
    found: links.filter((h) => h.includes(".pdf")).join(", ") || "(none)",
  });

  for (const link of version.nav) {
    const id = link.url.replace(/^#/, "");
    check(`nav target ${link.url} exists on the page`, new RegExp(`id="${id}"`).test(rawHtml), {
      expected: `an element with id="${id}" for the "${link.name}" nav link`,
      found: excerpt(rawHtml, `id="${id.slice(0, 4)}`),
    });
  }

  // -------------------------------------------------------- the static render

  section(`/${version.id}/ — static render: every scene ships its finished keyframe`);

  const staticContent = STATIC_CONTENT[version.id];
  check("the version has a static-render contract", Array.isArray(staticContent) && staticContent.length > 0, {
    expected: `an entry for "${version.id}" in STATIC_CONTENT in scripts/assert-build.mjs`,
    found: Object.keys(STATIC_CONTENT).join(", "),
  });
  for (const [label, needle] of staticContent ?? []) {
    check(`${label} is in the server-rendered HTML`, text.includes(needle), {
      expected: `"${needle}" in dist/${version.id}/index.html without running JavaScript`,
      found: excerpt(text, needle.slice(0, 12)),
    });
  }

  check("no scene ships as an empty island root", !/<astro-island[^>]*>\s*<\/astro-island>/.test(rawHtml), {
    expected: "every island to carry server-rendered children",
    found: excerpt(rawHtml, "<astro-island"),
  });

  // ------------------------------------------------------- the three properties

  section(`/${version.id}/ — the three properties, stated in prose`);

  const propertyLines = PROPERTY_LINES[version.id];
  check("the version states the three properties", Array.isArray(propertyLines) && propertyLines.length === 3, {
    expected: `three entries for "${version.id}" in PROPERTY_LINES in scripts/assert-build.mjs`,
    found: Object.keys(PROPERTY_LINES).join(", "),
  });
  for (const line of propertyLines ?? []) {
    check(`"${line}" is on the page`, text.includes(line), {
      expected: `"${line}" on the page`,
      found: excerpt(text, line.slice(0, 18)),
    });
  }

  // ---------------------------------------------------------- the three attacks

  section(`/${version.id}/ — the three attacks`);

  for (const [tag, name] of [
    ["A1", "creditBLEED"],
    ["A2", "creditMINT"],
    ["A3", "creditRESET"],
  ]) {
    check(`${tag} — ${name} is on the page`, text.includes(name), {
      expected: `"${name}"`,
      found: excerpt(text, tag),
    });
  }

  // ----------------------------------------------------------- numbers we own

  section(`/${version.id}/ — numbers: the paper's, and only the paper's`);

  // The counters split the "$" and the digits across elements, so match the
  // figure together with its unit rather than the glyph-exact string.
  check("the rulebook page count is on the page", /\b728\b/.test(text), {
    expected: '"728" (pages of Nacha rules)',
    found: excerpt(text, "728"),
  });
  check("the top-50 payment count is on the page", text.includes("30.7"), {
    expected: '"30.7" billion ACH payments',
    found: excerpt(text, "30.7"),
  });
  check("the four-bank concentration is on the page", /\b20 billion\b/.test(text), {
    expected: '"20 billion"',
    found: excerpt(text, "billion"),
  });

  // The submission draft cited $100 trillion and $30 trillion. The camera-ready
  // does not. See parsed-paper/paper.md §1 and test/content.test.ts.
  for (const [label, pattern] of [
    ["a 100-trillion draft figure", /100 trillion/i],
    ["a 30-trillion draft figure", /30 trillion/i],
  ]) {
    check(`the page does NOT claim ${label}`, !pattern.test(text), {
      expected: `no match for ${pattern} — the camera-ready has no such figure`,
      found: excerpt(text, "trillion"),
    });
  }

  // ------------------------------------------------------------- the evidence

  section(`/${version.id}/ — evidence: the paper's redacted figures ship`);

  for (const figure of FIGURES[version.id] ?? []) {
    check(`${figure} is in dist/`, distFiles.some((f) => f.includes(figure)), {
      expected: `a dist/_astro/${figure}.* asset`,
      found: distFiles.filter((f) => f.includes("fig")).map((f) => relative(DIST, f)).slice(0, 4).join(", ") || "(no figures)",
    });
    check(`${figure} is referenced by the page`, rawHtml.includes(figure), {
      expected: `an <img> or <source> for ${figure}`,
      found: excerpt(rawHtml, "<img"),
    });
  }

  check("screenshots lazy-load", /loading="lazy"/.test(rawHtml), {
    expected: 'loading="lazy" on the evidence images',
    found: excerpt(rawHtml, "<img"),
  });

  check("the ethics statement is on the page", text.includes("No third-party account was affected"), {
    expected: '"No third-party account was affected at any point"',
    found: excerpt(text, "third-party"),
  });

  // ------------------------------------------------------ disclosure and FAQ

  section(`/${version.id}/ — reference layer: disclosure, BibTeX`);

  for (const date of ["16 April 2025", "May 2025", "December 2025", "January 2026"]) {
    check(`disclosure milestone "${date}" renders`, text.includes(date), {
      expected: `"${date}" in the disclosure section`,
      found: excerpt(text, "2025"),
    });
  }

  check("BibTeX block is present", text.includes("@inproceedings") && text.includes("malik2026cwd"), {
    expected: "a BibTeX entry keyed malik2026cwd",
    found: excerpt(text, "@inproceedings"),
  });

  // ---------------------------------------------------------- no template dregs

  section(`/${version.id}/ — no template remnants`);

  for (const remnant of ["qkd", "QVerify", "Eve⁺", "blog-demo-qkd-fv", "Beyond the Quantum Promise", "Lorem ipsum"]) {
    check(`no "${remnant}" left in the build`, !rawHtml.includes(remnant), {
      expected: `no occurrence of "${remnant}"`,
      found: excerpt(rawHtml, remnant),
    });
  }

  // -------------------------------------------------------------- base prefix

  section(`/${version.id}/ — base prefix: every root-absolute URL carries ${BASE}`);

  const rooted = [...rawHtml.matchAll(/(?:href|src)="(\/[^"]*)"/g)].map((m) => decodeEntities(m[1]));
  const unprefixed = rooted.filter((u) => !u.startsWith(`${BASE}/`) && u !== BASE);
  check("no root-absolute URL is missing the base prefix", unprefixed.length === 0, {
    expected: `every /… URL to start with ${BASE}/`,
    found: [...new Set(unprefixed)].slice(0, 6).join(", "),
  });

  check("the favicon resolves under the base", rooted.some((u) => u.startsWith(`${BASE}/`) && u.endsWith(".svg")), {
    expected: `a ${BASE}/favicon.svg link`,
    found: rooted.slice(0, 5).join(", "),
  });

  // ---------------------------------------------------- link-preview card

  section(`/${version.id}/ — link-preview card: og tags and thumbnail`);

  check("og:title is present", /<meta property="og:title" content="[^"]+"/.test(rawHtml), {
    expected: 'a <meta property="og:title"> with content',
    found: excerpt(rawHtml, "og:title"),
  });
  check("og:description is present", /<meta property="og:description" content="[^"]+"/.test(rawHtml), {
    expected: 'a <meta property="og:description"> with content',
    found: excerpt(rawHtml, "og:description"),
  });
  const ogImage = (rawHtml.match(/<meta property="og:image" content="([^"]+)"/) ?? [])[1] ?? "";
  check("og:image is an absolute URL to the thumbnail", ogImage.startsWith("https://") && ogImage.includes("thumbnail"), {
    expected: "https://…/thumbnail.png in og:image",
    found: ogImage || "(no og:image)",
  });
}

section("Shared assets");

check("the thumbnail ships in dist/", distFiles.some((f) => f.endsWith("thumbnail.png")), {
  expected: "dist/**/thumbnail.png",
  found: distFiles.filter((f) => f.endsWith(".png")).slice(0, 5).join(", ") || "(no PNGs)",
});

// ------------------------------------------------------------------ result

console.log(`\n${passes} passed, ${failures} failed`);
if (failures > 0) {
  console.error("\nBuild assertions FAILED.");
  process.exit(1);
}
console.log("Build assertions passed.");
