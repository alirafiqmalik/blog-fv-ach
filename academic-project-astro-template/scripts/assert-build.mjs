#!/usr/bin/env node
/**
 * Build-assertion harness (T4).
 *
 * Asserts that dist/ contains the built paper site: title, authors, venue,
 * header links, Table 1 configuration rows, BibTeX block, no template demo
 * remnants, and that every root-absolute URL carries the /blog-demo-qkd-fv
 * base prefix. Run after `astro build`:
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
const BASE = "/blog-demo-qkd-fv";

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

// ------------------------------------------------------- title/authors/venue

section("Identity: title, authors, venue");

const titleMatch = rawHtml.match(/<title>([^<]*)<\/title>/);
const title = titleMatch ? decodeEntities(titleMatch[1]) : "";
check("<title> contains \"Beyond the Quantum Promise\"", title.includes("Beyond the Quantum Promise"), {
  expected: 'title containing "Beyond the Quantum Promise"',
  found: titleMatch ? `<title>${title}</title>` : "no <title> tag in dist/index.html",
});

for (const author of ["Ali Hamza Malik", "Raja Hasnain Anwar", "Muhammad Taqi Raza"]) {
  check(`author "${author}" appears`, html.includes(author), {
    expected: `"${author}" somewhere in dist/index.html`,
    found: excerpt(html, "Amherst"),
  });
}

const venue = "IEEE International Conference on Quantum Computing and Engineering";
check(`venue "${venue}" appears`, html.includes(venue), {
  expected: `"${venue}" in dist/index.html`,
  found: excerpt(html, "Conference"),
});
check("venue year 2026 accompanies the venue string", /2026[^<]{0,40}IEEE International Conference on Quantum Computing and Engineering|IEEE International Conference on Quantum Computing and Engineering[^<]{0,40}2026/.test(html), {
  expected: '"2026" within 40 chars of the venue string',
  found: excerpt(html, venue),
});

// ------------------------------------------------------------- header links

section("Header links");

const links = [...rawHtml.matchAll(/href="([^"]*)"/g)].map((m) => decodeEntities(m[1]));
for (const target of [
  "https://arxiv.org/abs/2608.07626",
  "https://github.com/KhwarizmiLab/QVerify",
]) {
  check(`link to ${target} exists`, links.some((h) => h === target || h.startsWith(`${target}/`)), {
    expected: `an href="${target}"`,
    found: `external hrefs: ${[...new Set(links.filter((h) => h.startsWith("http")))].slice(0, 8).join(", ") || "(none)"}`,
  });
}

// ------------------------------------------------------- Table 1 sub-tables

section("Table 1: nine Eve⁺ configuration rows");

const configRows = [
  "Eve⁺_TWEC",
  "Eve⁺_REC",
  "Eve⁺_FEC",
  "Eve⁺_B2A_TWEC",
  "Eve⁺_B2A_REC",
  "Eve⁺_B2A_FEC",
  "Eve⁺_A2B_TWEC",
  "Eve⁺_A2B_REC",
  "Eve⁺_A2B_FEC",
];
for (const row of configRows) {
  check(`configuration row "${row}" appears`, html.includes(row), {
    expected: `"${row}" (entity-decoded match) in dist/index.html`,
    found: excerpt(html, "Eve⁺"),
  });
}

// ------------------------------------------------- methodology step-through

section("Methodology step-through: tablist and tabpanel wiring");

// T9a ships the shell; #16 and #11-#13 fill it. These assertions are about the
// mechanism surviving in the built HTML — the island renders server-side, so
// the tab semantics are in dist/ whether or not the hydration script runs.

const tabTags = [...rawHtml.matchAll(/<button[^>]*\brole="tab"[^>]*>/g)].map((m) => m[0]);
const attr = (tag, name) => (tag.match(new RegExp(`\\b${name}="([^"]*)"`)) ?? [])[1];
const stepTabLabels = ["Standards", "Specs", "Model", "Verification", "Validation"];

check('one tablist labelled "Methodology stages"', /role="tablist"/.test(rawHtml) && rawHtml.includes('aria-label="Methodology stages"'), {
  expected: 'a role="tablist" with aria-label="Methodology stages"',
  found: excerpt(rawHtml, "tablist"),
});
check('five role="tab" buttons', tabTags.length === 5, {
  expected: "5 tabs",
  found: `${tabTags.length} tab(s)`,
});
check("tabs carry the five stage names as accessible labels", stepTabLabels.every((l) => tabTags.some((t) => attr(t, "aria-label") === l)), {
  expected: stepTabLabels.join(", "),
  found: tabTags.map((t) => attr(t, "aria-label")).join(", ") || "(no aria-labels)",
});

const selectedTabs = tabTags.filter((t) => attr(t, "aria-selected") === "true");
check("exactly one tab is aria-selected", selectedTabs.length === 1, {
  expected: '1 tab with aria-selected="true"',
  found: `${selectedTabs.length} selected`,
});

const panelTag = (rawHtml.match(/<div[^>]*\brole="tabpanel"[^>]*>/) ?? [])[0] ?? "";
const stepPanelId = attr(panelTag, "id");
check("a role=tabpanel with an id exists", Boolean(stepPanelId), {
  expected: 'one <div role="tabpanel" id="...">',
  found: panelTag || "(no tabpanel)",
});
check("every tab points at that panel via aria-controls", tabTags.length > 0 && tabTags.every((t) => attr(t, "aria-controls") === stepPanelId), {
  expected: `aria-controls="${stepPanelId}" on all ${tabTags.length} tabs`,
  found: tabTags.map((t) => attr(t, "aria-controls")).join(", ") || "(none)",
});
check("the panel is labelled by the selected tab", selectedTabs.length === 1 && attr(panelTag, "aria-labelledby") === attr(selectedTabs[0], "id"), {
  expected: `aria-labelledby="${selectedTabs.length === 1 ? attr(selectedTabs[0], "id") : "<selected tab id>"}"`,
  found: attr(panelTag, "aria-labelledby") ?? "(none)",
});

// The code panel (aria-pressed line buttons + terminal chrome) was removed in
// the T14 polish pass at the author's request — its assertions went with it;
// the code and notes are archived in the "Documentation"-labelled issue. The
// tabpanel is now the visual frame, still wired to the tablist above.

// KaTeX labels, with the explicit \; spacing that stops the glyphs overlapping.
for (const tex of ["\\mathcal{M}", "\\mathcal{M}\\;\\models\\;\\varphi"]) {
  check(`tab label KaTeX "${tex}" is rendered`, html.includes(`<annotation encoding="application/x-tex">${tex}</annotation>`), {
    expected: `a KaTeX annotation for ${tex}`,
    found: excerpt(html, "application/x-tex"),
  });
}


// #16 replaced the static image with the step-through, which inherits the
// caption — the number can't lapse, Figures 4 and 5(a)/(b) follow it.
check("the step-through carries Figure 3, and the static image is gone", html.includes("Figure 3.") && !rawHtml.includes("fig3-methodology-dark"), {
  expected: 'the "Figure 3." caption with no fig3-methodology-dark asset',
  found: rawHtml.includes("fig3-methodology-dark") ? excerpt(rawHtml, "fig3-methodology-dark") : excerpt(html, "Figure 3."),
});

// ------------------------------------------- step-through content (T9b/#16)

section("Methodology step-through: paper-derived tab content");

// `test/methodology.test.ts` proves each line traces to its source; these
// assertions prove the traced content survives the build into dist/. All five
// blocks render at once (that is what makes the cross-highlight work), so one
// spot-check per tab is enough to catch a block that silently stopped
// rendering.
const stepContent = [
  ["Standards: a Table II identifier, verbatim", "ETSI GS QKD 014 V1.1.1"],
  ["Specs: the open basis-order choice", "Alice announces her basis before Bob"],
];
for (const [label, needle] of stepContent) {
  check(label, html.includes(needle), {
    expected: `"${needle}" in dist/index.html`,
    found: excerpt(html, needle.split(/[\s(]/)[0]),
  });
}

// The Model/Verification/Validation panel lines left the page with the code
// panel (T14, author request — see the "Documentation" issue), but the data
// module that carried them is still what the visuals derive from, so its
// content must still reach the browser. Same precedent as the raw-MDX chunk
// assertion for the verification matrix below.
const stepChunkContent = [
  ["Model: the m4 include still ships in a client chunk", "include(generic_models/type/Alice.spthy)"],
  ["Verification: a Tamarin lemma still ships in a client chunk", "lemma noninjectiveagreement_A:"],
  ["Validation: the simulation's CHSH constant still ships in a client chunk", "CHSH_REL_ERR_THRESHOLD_PCT = 10.0"],
];
for (const [label, needle] of stepChunkContent) {
  const carrier = distFiles.some((f) => f.endsWith(".js") && readFileSync(f, "utf8").includes(needle));
  check(label, carrier, {
    expected: `one dist/**/*.js containing "${needle}"`,
    found: `${distFiles.filter((f) => f.endsWith(".js")).length} JS chunks, none containing it`,
  });
}

// No placeholder copy reaches the live site. #14 auto-deploys main, so a
// half-landed content change would publish itself.
for (const needle of ["PLACEHOLDER", "lorem ipsum", "Lorem ipsum"]) {
  check(`no "${needle}" anywhere in dist/`, distFiles.every((f) => !readFileSync(f).includes(needle)), {
    expected: `zero files containing "${needle}"`,
    found: distFiles.filter((f) => readFileSync(f).includes(needle)).map((f) => relative(DIST, f)).slice(0, 5).join(", "),
  });
}

// ------------------------------------------- step-through visuals (T10/#11)

section("Methodology step-through: the Standards visual");

// The step-through mounts with the Standards tab active, so its visual — and
// only its visual — is in the server-rendered HTML. Nothing here can check
// the Specs visual (it renders on selection, in the browser) or how either
// one animates; `test/methodology-cards.test.ts` covers the card content and
// the reduced-motion branch, and #15 covers the feel.
//
// React splits interpolated text with comment nodes (`23<!-- --> documents`),
// so comments come out before matching.
const stepVisualHtml = html.replace(/<!--.*?-->/g, "");

check(
  "the Standards visual replaced the placeholder frame",
  !/\b1 \/ 5\b/.test(stepVisualHtml),
  {
    expected: 'no "1 / 5" placeholder counter for the active tab',
    found: excerpt(stepVisualHtml, "1 / 5"),
  },
);

const STANDARDS_LABEL = 'aria-label="Standards corpus feeding the extracted procedures"';
const labelAt = stepVisualHtml.indexOf(STANDARDS_LABEL);

check("it carries the tab's caption as its accessible name", labelAt >= 0, {
  expected: "an svg labelled with the Standards visual caption",
  found: excerpt(stepVisualHtml, "aria-label"),
});

// Every assertion below reads the visual's own <svg> rather than the page:
// the panel beside it quotes the same documents, so a page-wide search would
// stay green with the visual unregistered.
const svgFrom = labelAt < 0 ? -1 : stepVisualHtml.lastIndexOf("<svg", labelAt);
const standardsSvg =
  svgFrom < 0
    ? ""
    : stepVisualHtml.slice(svgFrom, stepVisualHtml.indexOf("</svg>", svgFrom) + 6);

// The cards are Table II rows; the test proves that, this proves they built.
const standardsCards = [
  ["ETSI GS QKD 005 V1.1.1", "Security proofs"],
  ["ETSI GS QKD 014 V1.1.1", "REST key-delivery API"],
  ["ETSI GS QKD 016 V2.1.1", "CC protection profile (PM)"],
  ["Rec. X.1710", "QKDN security framework"],
  ["Rec. Y.3802", "Functional architecture"],
  ["TR FG QIT4N D2.3.1", "Quantum layer protocols"],
];
for (const [id, title] of standardsCards) {
  check(`card "${id}" renders with its Table II title`, standardsSvg.includes(id) && standardsSvg.includes(title), {
    expected: `"${id}" and "${title}" inside the Standards visual`,
    found: excerpt(standardsSvg, id),
  });
}

check(
  "the corpus is stated as Appendix A's three family counts",
  standardsSvg.includes("11 ETSI · 8 ITU-T · 4 technical reports"),
  {
    expected: '"11 ETSI · 8 ITU-T · 4 technical reports" inside the visual',
    found: excerpt(standardsSvg, "technical reports"),
  },
);

check(
  "verdict-free palette: the card accent uses the quantum token, not a hex",
  standardsSvg.includes('fill="var(--qkd-quantum)"'),
  {
    expected: 'fill="var(--qkd-quantum)" on the card accent rule',
    found: excerpt(standardsSvg, "qkd-quantum"),
  },
);

// ------------------------------------------------------------------- BibTeX

section("BibTeX block");

check('BibTeX key "malik2026beyond" appears', html.includes("malik2026beyond"), {
  expected: '"malik2026beyond" in dist/index.html',
  found: excerpt(html, "@inproceedings") || excerpt(html, "bibtex"),
});
check('BibTeX block contains "To appear"', html.includes("To appear"), {
  expected: '"To appear" in dist/index.html',
  found: excerpt(html, "malik2026beyond"),
});

// ------------------------------------------------- validation histograms

section("Validation histograms: Figure 5(a)/(b) (T7)");

// Recharts 3 draws nothing during SSR, so what dist/ can be held to is the
// island's own chrome: its verdicts, its legend and its palette tokens. Each
// assertion is scoped to the island's markup rather than the page, because
// the figure captions beside it quote the same verdict sentences and would
// keep this section green with the charts unmounted.
function chartIsland(id) {
  const at = html.indexOf(`data-chsh-chart="${id}"`);
  if (at === -1) return "";
  const end = html.indexOf("</astro-island>", at);
  return html.slice(at, end === -1 ? at + 4000 : end);
}

const CHART_VERDICTS = {
  "measure-resend": "CHSH test failed — Eve detected",
  v1: "CHSH test passed — Eve⁺ undetected",
};

for (const [id, verdict] of Object.entries(CHART_VERDICTS)) {
  const island = chartIsland(id);
  check(`Figure 5 chart "${id}" is mounted`, island.length > 0, {
    expected: `an element with data-chsh-chart="${id}" in dist/index.html`,
    found: excerpt(html, "chsh") || "no data-chsh-chart element at all",
  });
  check(`"${id}" chart states the baseline verdict`, island.includes("CHSH test passed"), {
    expected: `"CHSH test passed" inside the ${id} chart`,
    found: excerpt(island, "CHSH"),
  });
  check(`"${id}" chart states its own verdict`, island.includes(verdict), {
    expected: `"${verdict}" inside the ${id} chart`,
    found: excerpt(island, "CHSH test"),
  });
  check(`"${id}" chart labels the 10% detection threshold`, island.includes("10% detection threshold"), {
    expected: `"10% detection threshold" inside the ${id} chart`,
    found: excerpt(island, "threshold"),
  });
  check(`"${id}" chart carries a text alternative`, /aria-label="Histogram of relative CHSH violation error/.test(island), {
    expected: `an aria-label describing the ${id} histogram`,
    found: excerpt(island, "aria-label"),
  });
  for (const token of ["var(--qkd-quantum)", "var(--qkd-threat)", "var(--qkd-threshold)"]) {
    check(`"${id}" chart draws in ${token}`, island.includes(token), {
      expected: `${token} inside the ${id} chart`,
      found: excerpt(island, "var(--qkd"),
    });
  }
}

// The charts replace the paper's PNG crops — a white-background image must
// not survive anywhere in the build (spec #1 → Static figures).
for (const png of ["fig7a-measure-resend", "fig7b-v1-injection"]) {
  const hits = distFiles.filter((f) => f.includes(png) || readFileSync(f).includes(png));
  check(`no "${png}" PNG left in dist/`, hits.length === 0, {
    expected: `zero files referencing "${png}"`,
    found: hits.map((f) => relative(DIST, f)).slice(0, 5).join(", "),
  });
}

// ------------------------------------------------- template demo remnants

section("No template demo remnants anywhere in dist/");

const remnants = ["dogs-", "outside.mp4", "BoxVertexColors", "roman2024academic"];
for (const needle of remnants) {
  const hits = distFiles.filter((f) => readFileSync(f).includes(needle));
  check(`no "${needle}" in any dist file`, hits.length === 0, {
    expected: `zero files containing "${needle}"`,
    found: hits.map((f) => relative(DIST, f)).slice(0, 5).join(", "),
  });
}

// ----------------------------------------------------------- base prefix

section(`Base prefix: root-absolute URLs must start with ${BASE}`);

// Every href/src attribute value (plus srcset candidates) in index.html that
// is root-absolute ("/...") must carry the base prefix. Protocol-relative
// ("//...") and absolute ("scheme:...") URLs are exempt.
const urlRefs = [];
for (const m of rawHtml.matchAll(/\b(href|src)="([^"]*)"/g)) {
  urlRefs.push({ attr: m[1], url: decodeEntities(m[2]) });
}
for (const m of rawHtml.matchAll(/\bsrcset="([^"]*)"/g)) {
  for (const cand of decodeEntities(m[1]).split(",")) {
    const url = cand.trim().split(/\s+/)[0];
    if (url) urlRefs.push({ attr: "srcset", url });
  }
}
const rootAbsolute = urlRefs.filter(({ url }) => url.startsWith("/") && !url.startsWith("//"));
const unprefixed = rootAbsolute.filter(
  ({ url }) => !(url === BASE || url.startsWith(`${BASE}/`) || url.startsWith(`${BASE}?`) || url.startsWith(`${BASE}#`)),
);
check(
  `all ${rootAbsolute.length} root-absolute URL(s) carry the ${BASE} prefix`,
  rootAbsolute.length > 0 && unprefixed.length === 0,
  {
    expected: rootAbsolute.length === 0
      ? `at least one root-absolute URL starting with ${BASE} (found none — check the base config)`
      : `every root-absolute href/src/srcset URL to start with ${BASE}`,
    found: unprefixed.slice(0, 8).map(({ attr, url }) => `${attr}="${url}"`).join(", ") || `${rootAbsolute.length} root-absolute URLs`,
  },
);

// -------------------------------------------- verification matrix (T11, #12)

section("Verification matrix: Table 1 reaches the step-through as data");

// The Model and Verification visuals never reach dist/index.html — the
// step-through renders only the active tab's visual server-side — so the
// build-time guard for the matrix is the data path, not the markup. The
// matrix parses `src/paper.mdx?raw` at run time (it is a view of Table 1, not
// a copy: see src/data/verdict-matrix.ts), which means the client chunk that
// carries the step-through must carry all nine configurations. It doesn't if
// the raw import ever stops resolving through the MDX plugin, and then the
// tab silently renders an empty matrix with every unit test still green.
const matrixChunks = distFiles.filter(
  (f) => f.endsWith(".js") && decodeEntities(readFileSync(f, "utf8")).includes(configRows[0]),
);
check(`a client chunk ships the Table 1 rows`, matrixChunks.length > 0, {
  expected: `one dist/*.js containing "${configRows[0]}" (the raw MDX the matrix parses)`,
  found: `${distFiles.filter((f) => f.endsWith(".js")).length} JS chunks, none containing it`,
});
for (const chunk of matrixChunks.slice(0, 1)) {
  const js = decodeEntities(readFileSync(chunk, "utf8"));
  const missing = configRows.filter((row) => !js.includes(row));
  check(`that chunk carries all ${configRows.length} configurations`, missing.length === 0, {
    expected: `every Eve⁺_* row in ${relative(DIST, chunk)}`,
    found: `missing: ${missing.join(", ")}`,
  });
  // Split verdicts are the result, not a rendering detail — a chunk holding a
  // flattened table would mean the source markdown lost them.
  check(`split verdicts survive into the chunk`, js.includes("✓/✗³") || js.includes("✗³/✓"), {
    expected: `a split cell ("✓/✗³") in ${relative(DIST, chunk)}`,
    found: excerpt(js, "Eve⁺_REC"),
  });
}

// ----------------------------------------- V1 sequence play-through (T6, #8)

section("Figure 4: the V1 sequence ships complete and hydrates to play");

// T6 animates a figure that already shipped, so the thing worth guarding at
// build time is that it still ships *complete*: the play arms only after
// hydration, which means dist/index.html must carry every beat drawn, not a
// diagram waiting for JavaScript to reveal it. Beat ids come from the data
// module's source, so a beat added there and dropped from the render fails
// here rather than passing silently.
const v1Source = readFileSync(join(ROOT, "src/data/v1-attack.ts"), "utf8");
const v1Beats = v1Source
  .slice(v1Source.indexOf("export const v1Beats"))
  .split(/\n {2}\{/)
  .slice(1)
  .map((block) => ({
    id: (block.match(/id: "([^"]+)"/) ?? [])[1],
    eve: /\n\s+eve: true/.test(block),
  }))
  .filter((b) => b.id);

/** The markup of one beat's group: from its id to the next beat's. */
function beatGroup(id) {
  const at = html.indexOf(`data-beat-id="${id}"`);
  if (at === -1) return "";
  const next = html.indexOf("data-beat-id=", at + 1);
  const end = html.indexOf("</svg>", at);
  return html.slice(at, next === -1 || next > end ? end : next);
}

const v1Island = rawHtml.match(/<astro-island[^>]*V1Sequence[^>]*>/)?.[0] ?? "";
check(`the figure hydrates as an island`, v1Island.includes('client="visible"'), {
  expected: `an <astro-island> for V1Sequence with client="visible"`,
  found: v1Island || "no V1Sequence island in dist/index.html",
});

const renderedBeats = [...html.matchAll(/data-beat-id="([^"]+)"/g)].map((m) => m[1]);
const missingBeats = v1Beats.filter((b) => !renderedBeats.includes(b.id));
check(`all ${v1Beats.length} beats are server-rendered`, missingBeats.length === 0, {
  expected: `every beat of src/data/v1-attack.ts in dist/index.html`,
  found: `missing: ${missingBeats.map((b) => b.id).join(", ")}`,
});
check(`beats are emitted in the data module's order`, renderedBeats.join() === v1Beats.map((b) => b.id).join(), {
  expected: v1Beats.slice(0, 3).map((b) => b.id).join(" → ") + " → …",
  found: renderedBeats.slice(0, 3).join(" → ") + " → …",
});

// The pre-play state is the finished diagram. A beat group arriving with
// opacity 0 would mean the animation's hidden state leaked into SSR and the
// figure is blank without JavaScript.
const hiddenBeats = v1Beats.filter((b) => /opacity: *0[^.]/.test(beatGroup(b.id)));
check(`no beat is hidden before the play starts`, hiddenBeats.length === 0, {
  expected: `no zero-opacity beat groups in dist/index.html`,
  found: `hidden: ${hiddenBeats.map((b) => b.id).join(", ")}`,
});

// The replay control cannot work without JavaScript, so it is not rendered
// until the island wakes — and never under reduced motion.
const figureIsland = html.slice(
  Math.max(0, html.indexOf("Figure 4 sequence diagram")),
  html.indexOf("</svg>", html.indexOf("Figure 4 sequence diagram")) + 6,
);
check(`the replay control is not in the static markup`, !figureIsland.includes("<button"), {
  expected: `no <button> inside the server-rendered figure`,
  found: excerpt(figureIsland, "<button"),
});

const eveBeats = v1Beats.filter((b) => b.eve);
const untinted = eveBeats.filter((b) => !beatGroup(b.id).includes("var(--qkd-threat)"));
check(`all ${eveBeats.length} Eve⁺ beats are drawn in the threat token`, untinted.length === 0, {
  expected: `var(--qkd-threat) in every adversarial beat group`,
  found: `untinted: ${untinted.map((b) => b.id).join(", ")}`,
});

// The play replays the data module client-side, so the beats have to reach
// the browser. If the island ever stops hydrating, this is what notices.
const beatChunks = distFiles.filter(
  (f) => f.endsWith(".js") && readFileSync(f, "utf8").includes(`"${v1Beats[0].id}"`),
);
check(`a client chunk carries the beats the play replays`, beatChunks.length > 0, {
  expected: `one dist/*.js containing "${v1Beats[0].id}"`,
  found: `${distFiles.filter((f) => f.endsWith(".js")).length} JS chunks, none containing it`,
});

// ---------------------------------------------- validation triptych (T8, #9)

section("Validation triptych: channel headers (T8)");

// Unlike the charts they sit above, the headers are plain SVG and *do* reach
// dist/ — so what this section holds is that each figure ships its two
// scenario lanes drawn complete, before any JavaScript arrives. The lanes'
// content comes from the scenario module's source, so a scenario edited there
// and dropped from the render fails here instead of passing quietly.
const scenarioSource = readFileSync(join(ROOT, "src/data/validation-scenarios.ts"), "utf8");

function scenarioBlock(id) {
  const at = scenarioSource.indexOf(id === "v1" ? "\n  v1: {" : `\n  "${id}": {`);
  return at === -1 ? "" : scenarioSource.slice(at, scenarioSource.indexOf("\n  },", at));
}
/** The middle parties of scenario `id` — Alice and Bob are shared constants. */
const middleParties = (id) =>
  [...scenarioBlock(id).matchAll(/label: "([^"]+)", role/g)].map((m) => m[1]);
/** How many qubit streams the scenario draws, forged and genuine together. */
const streamCount = (id) => [...scenarioBlock(id).matchAll(/kind: "\w+"/g)].length;

/** The header SVG above chart `id`: from the figure's marker to its </svg>. */
function headerMarkup(id) {
  const at = html.indexOf(`data-validation-figure="${id}"`);
  if (at === -1) return "";
  return html.slice(at, html.indexOf("</svg>", at) + 6);
}
/** One lane's markup inside a header. */
function laneMarkup(header, lane) {
  const at = header.indexOf(`data-validation-lane="${lane}"`);
  if (at === -1) return "";
  const next = header.indexOf("data-validation-lane=", at + 1);
  return header.slice(at, next === -1 ? header.length : next);
}

for (const id of Object.keys(CHART_VERDICTS)) {
  const header = headerMarkup(id);
  check(`Figure 5 "${id}" carries a channel header`, header.includes("<svg"), {
    expected: `a data-validation-figure="${id}" wrapper with its header SVG`,
    found: excerpt(html, "data-validation-figure") || "no validation figure at all",
  });

  const lanes = { "honest-eb": laneMarkup(header, "honest-eb"), [id]: laneMarkup(header, id) };
  for (const [lane, markup] of Object.entries(lanes)) {
    check(`"${id}" header draws the ${lane} lane`, markup.length > 0, {
      expected: `data-validation-lane="${lane}" inside the ${id} header`,
      found: excerpt(header, "data-validation-lane") || "no lanes in the header",
    });
    for (const party of ["Alice", "Bob", ...middleParties(lane)]) {
      check(`"${id}" ${lane} lane runs through ${party}`, markup.includes(`>${party}<`), {
        expected: `a box labelled "${party}" in the ${lane} lane`,
        found: excerpt(markup, party),
      });
    }
  }

  // The honest lane forges nothing, so nothing in it is threat-red; the
  // attack lane's re-encoded stream is. That contrast is the header's point.
  check(`"${id}" attack lane is drawn in the threat token`, lanes[id].includes("var(--qkd-threat)"), {
    expected: `var(--qkd-threat) in the ${id} lane`,
    found: excerpt(lanes[id], "var(--qkd"),
  });
  check(`"${id}" honest lane forges nothing`, !lanes["honest-eb"].includes("var(--qkd-threat)"), {
    expected: `no threat token in the honest baseline lane`,
    found: excerpt(lanes["honest-eb"], "var(--qkd-threat)"),
  });
  check(`"${id}" honest lane is drawn in the quantum token`, lanes["honest-eb"].includes("var(--qkd-quantum)"), {
    expected: `var(--qkd-quantum) in the honest baseline lane`,
    found: excerpt(lanes["honest-eb"], "var(--qkd"),
  });

  // Both verdicts are stated on the lanes themselves, read from the data
  // module — the header is the chart's legend drawn as a channel.
  check(`"${id}" header states both verdicts`, lanes["honest-eb"].includes("CHSH test passed") && lanes[id].includes(CHART_VERDICTS[id]), {
    expected: `"CHSH test passed" and "${CHART_VERDICTS[id]}" on their lanes`,
    found: excerpt(header, "CHSH test"),
  });

  // Static by default, in the two senses #8 established: every stream is
  // drawn at rest before hydration, and nothing waits at zero opacity.
  const streams = streamCount("honest-eb") + streamCount(id);
  const drawn = (header.match(/<circle/g) ?? []).length;
  check(`"${id}" header renders all ${streams} qubit streams at rest`, drawn === streams, {
    expected: `${streams} static qubits in the server-rendered header`,
    found: `${drawn} <circle> elements`,
  });
  check(`"${id}" header hides nothing before the play`, !/opacity: *0[^.]/.test(header), {
    expected: `no zero-opacity elements in the ${id} header`,
    found: excerpt(header, "opacity"),
  });
  check(`"${id}" header needs no control to play`, !header.includes("<button"), {
    expected: `no <button> in the header — the play arms on scroll`,
    found: excerpt(header, "<button"),
  });
  check(`"${id}" header carries a text alternative`, /aria-label="[^"]{80,}"/.test(header), {
    expected: `an aria-label describing both lanes`,
    found: excerpt(header, "aria-label"),
  });
}

// The play and the bar growth are client-side, so the scenarios have to reach
// the browser. If the islands ever stop hydrating, this is what notices.
const laneChunks = distFiles.filter(
  (f) => f.endsWith(".js") && readFileSync(f, "utf8").includes("Eve⁺ source"),
);
check(`a client chunk carries the scenarios the headers play`, laneChunks.length > 0, {
  expected: `one dist/*.js containing "Eve⁺ source"`,
  found: `${distFiles.filter((f) => f.endsWith(".js")).length} JS chunks, none containing it`,
});

// ---------------------------------------------------- link-preview card (T14)

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
