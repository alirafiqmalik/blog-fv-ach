#!/usr/bin/env node
/**
 * Build-assertion harness.
 *
 * `npm run test:unit` checks the modules; this checks the *page a reader gets*.
 * The two catch different things: a data module can be perfectly correct while
 * an island fails to render, a base prefix is dropped, or a scene ships as an
 * empty div because its static branch was never written. Every assertion here
 * is about `dist/index.html` and the files beside it.
 *
 * The load-bearing one is the static-render section: this site's whole
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
    .replace(/&nbsp;/g, " ")
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

// ------------------------------------------------------------------- inputs

if (!existsSync(join(DIST, "index.html"))) {
  console.error(`FAIL  dist/index.html not found at ${join(DIST, "index.html")}`);
  console.error("      run `astro build` first (or use `npm run test:build`).");
  process.exit(1);
}

const rawHtml = readFileSync(join(DIST, "index.html"), "utf8");
const html = decodeEntities(rawHtml);
const distFiles = walk(DIST);

console.log(`Asserting build output in ${relative(ROOT, DIST)}/ (${distFiles.length} files)`);


/** Text content only — assertions about what a reader sees, not about markup. */
const text = html.replace(/<script[\s\S]*?<\/script>/g, " ").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ");

// ------------------------------------------------------- identity and venue

section("Identity: title, venue, links");

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

const links = [...rawHtml.matchAll(/href="([^"]*)"/g)].map((m) => decodeEntities(m[1]));
check("the Zenodo artifact is linked", links.some((h) => h.includes("10.5281/zenodo.22701199")), {
  expected: "an href to the Zenodo artifact",
  found: [...new Set(links.filter((h) => h.startsWith("http")))].slice(0, 8).join(", ") || "(none)",
});

check("the camera-ready PDF is linked", links.some((h) => h.includes("credit-without-debit.pdf")), {
  expected: "an href to credit-without-debit.pdf",
  found: links.filter((h) => h.includes(".pdf")).join(", ") || "(none)",
});

// -------------------------------------------------------- the static render

section("Static render: every scene ships its finished keyframe");

// The site's accessibility promise. A reader with no JavaScript must get a
// complete article, so each scrubbed scene's *content* has to be in the HTML —
// not just an empty island root waiting for hydration.
const staticContent = [
  ["the split-ledger thesis scene", "Credit without debit"],
  ["the pipeline's first step", "You tell your bank to pull"],
  ["the pipeline's return-window step", "Settlement is this window closing empty"],
  ["A1's R16 stamp", "R16"],
  ["A2's restart beat", "There is no rate limit"],
  ["A3's posting beat", "full credit limit restored"],
  ["the adversary's C-2 capability", "printed on the front of every cheque"],
  ["the disclosure timeline's first milestone", "Disclosed to every affected institution"],
  ["the disclosure timeline's last milestone", "A2 resolved everywhere"],
  ["the model checker's honesty note", "IC3/PDR works backwards from the property"],
];
for (const [label, needle] of staticContent) {
  check(`${label} is in the server-rendered HTML`, text.includes(needle), {
    expected: `"${needle}" in dist/index.html without running JavaScript`,
    found: excerpt(text, needle.slice(0, 12)),
  });
}

check("no scene ships as an empty island root", !/<astro-island[^>]*>\s*<\/astro-island>/.test(rawHtml), {
  expected: "every island to carry server-rendered children",
  found: excerpt(rawHtml, "<astro-island"),
});

// ------------------------------------------------------------ the invariants

section("The three invariants, introduced and reused");

for (const [symbol, name] of [["Φ1", "Continuous Authorization"], ["Φ2", "Zero-Sum Invariant"], ["Φ3", "Settlement Finality"]]) {
  check(`${symbol} (${name}) appears`, text.includes(symbol) && text.includes(name), {
    expected: `${symbol} and "${name}"`,
    found: excerpt(text, name),
  });
}

// §4 introduces the cards and §8 snaps the remedies onto them. Two renders of
// the same three cards is the narrative rhyme; one means the finale was lost.
for (const symbol of ["Φ1", "Φ2", "Φ3"]) {
  const count = text.split(symbol).length - 1;
  check(`${symbol} is rendered twice (intro + remedies)`, count >= 2, {
    expected: `at least 2 occurrences of ${symbol}`,
    found: `${count} occurrence(s)`,
  });
}

// ---------------------------------------------------------- the three attacks

section("The three attacks and Table 1");

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

for (const cell of [
  "Provide immediate fund availability",
  "Routing/account format ⇒ debit capability",
  "ODFI credit without RDFI debit",
  "Access funds on authorization",
  "Simplify account linking",
  "Inbound credit ⇒ outbound debit",
  "Repeated micro-credits without debit recovery",
  "Repeatedly accumulate micro-deposits",
  "Shorten credit-line recovery wait",
  "Internal posting ⇒ ACH settlement",
  "Repeated credit-line restoration",
  "Spend on prematurely restored credit line",
]) {
  check(`Table 1 cell "${cell}" renders`, text.includes(cell), {
    expected: `"${cell}" in the summary table`,
    found: excerpt(text, cell.slice(0, 14)),
  });
}

for (const condition of [
  "RDFI-side account status",
  "pre-flight debit-capability check",
  "settlement-status flag",
]) {
  check(`permissive condition "${condition}" is named`, text.includes(condition), {
    expected: `"${condition}"`,
    found: excerpt(text, condition.slice(0, 18)),
  });
}

// ----------------------------------------------------------- numbers we own

section("Numbers: the paper's, and only the paper's");

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

section("Evidence: the paper's redacted figures ship");

for (const figure of ["fig4-account-linking", "fig5-a1-dashboard"]) {
  check(`${figure} is in dist/`, distFiles.some((f) => f.includes(figure)), {
    expected: `a dist/_astro/${figure}.* asset`,
    found: distFiles.filter((f) => f.includes("fig")).map((f) => relative(DIST, f)).slice(0, 4).join(", ") || "(no figures)",
  });
}

check("screenshot carousels lazy-load", /loading="lazy"/.test(rawHtml), {
  expected: 'loading="lazy" on the evidence images',
  found: excerpt(rawHtml, "<img"),
});

check("the ethics statement is on the page", text.includes("No third-party account was affected"), {
  expected: '"No third-party account was affected at any point"',
  found: excerpt(text, "Ethics"),
});

// ------------------------------------------------------ disclosure and FAQ

section("Reference layer: disclosure, FAQ, BibTeX");

for (const date of ["16 April 2025", "May 2025", "December 2025", "January 2026"]) {
  check(`disclosure milestone "${date}" renders`, text.includes(date), {
    expected: `"${date}" on the timeline`,
    found: excerpt(text, "2025"),
  });
}

check("BibTeX block is present", text.includes("@inproceedings") && text.includes("malik2026cwd"), {
  expected: "a BibTeX entry keyed malik2026cwd",
  found: excerpt(text, "@inproceedings"),
});

// ---------------------------------------------------------- no template dregs

section("No template remnants");

for (const remnant of ["qkd", "QVerify", "Eve⁺", "blog-demo-qkd-fv", "Beyond the Quantum Promise", "Lorem ipsum"]) {
  check(`no "${remnant}" left in the build`, !rawHtml.includes(remnant), {
    expected: `no occurrence of "${remnant}"`,
    found: excerpt(rawHtml, remnant),
  });
}

// -------------------------------------------------------------- base prefix

section(`Base prefix: every root-absolute URL carries ${BASE}`);

const rooted = [
  ...rawHtml.matchAll(/(?:href|src)="(\/[^"]*)"/g),
].map((m) => decodeEntities(m[1]));
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

section("Link-preview card: og tags and thumbnail");

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
