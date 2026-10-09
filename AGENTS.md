# blog-fv-ach

Interactive scrollytelling site for the CCS '26 paper *Credit Without Debit:
Formal Verification of Banking Payment Systems*. Built by adapting the Astro template from
`alirafiqmalik/blog-demo-qkd-fv` — the layout primitives and the
component + `*-motion.ts` split came across; none of the QKD content did.

## Layout

- `academic-project-astro-template/` — the site (Astro 6 + Tailwind 4 + MDX +
  React islands). The redesign ships in **versions**, registered in
  `src/data/versions.ts`: each `src/pages/versionN/index.mdx` is a full page
  snapshot rendered through `src/layouts/Site.astro`, and the root page
  (`src/pages/index.astro`) redirects to `DEFAULT_VERSION`. Promote a version
  by changing that one field. Register a version and the nav, the content
  tests and the build assertions all pick it up; an unregistered page does not
  exist as far as the tests are concerned.
- `parsed-paper/` — **content authority.** `paper.md` is the clean parse;
  `ACH_CCS_2026.pdf` is the submission; `assets/fig*.png` are the paper's
  figures. If the site and `paper.md` disagree, `paper.md` wins.
- `docs/storyboard.md` — **the narration spec.** Written before any component
  was. Every scene exists to illustrate a sentence in there.

## Preferred libraries

Use the library rather than writing it from scratch, and install it if it isn't
already in the project:

- Animations, transitions, gestures: Motion (`motion/react`)
- Charts and data viz: Recharts (Visx or Nivo for custom work)
- Icons: Lucide
- Dates: date-fns

Always use the current version of a library's syntax. If you're unsure of the
current API, check the library's docs rather than relying on an older version
you might remember.

## Guardrails

- Don't add a library when the platform already does the job. A fade or a hover
  is native CSS, not a dependency.
- **One animation runtime: Motion.** GSAP, ScrollTrigger and Lenis are excluded
  from this project — `test/scroll-scene.test.ts` fails if one appears.
- Only animate `transform`, `opacity` and `filter`. Never `width`, `height` or
  `margin`: a scrubbed scene runs one of these per frame per element.
- Respect `prefers-reduced-motion` in every animation.
- Tell the author which library you're using, and why, before installing it.

## The four things that will break this site

Read this before editing. Each has a test behind it, but the tests only tell you
*that* you broke something, not why it mattered.

1. **`src/data/*.ts` is the content authority; components draw it.** No
   component may declare a step, a beat, a banking day or a caption of its own.
   `AchPipeline.tsx` and `AchOverview.tsx` in particular draw `ach-pipeline.ts`
   and nothing else, because the hero figure, Act I, creditBLEED and the finale
   all lean on that one timeline. A second copy is how they drift apart.
   → `test/ach-pipeline.test.ts`

2. **The ledger language never bends.** Green is a credit that posted, red is a
   debit that failed, amber is in-flight, grey is the rails. Components ask
   `ledgerToken(effect)` for a colour and never write one — `ledger-motion.ts`
   is the only file allowed to name `--ach-credit` and friends.
   → `test/ledger-motion.test.ts`

3. **The server renders the finished scene.** `StickyScene` starts at
   `progress = 1`, not 0, so a reader with no JavaScript gets the last keyframe
   rather than a blank island. Reduced motion pins the scene to its *final*
   keyframe (not a faster scrub), and narrow viewports drop out of scrubbing
   entirely and render the caption list. All three branches are asserted.
   → `test/scroll-scene.test.ts`, and the static-render section of
   `scripts/assert-build.mjs`

4. **We do not claim numbers the paper does not have.** The camera-ready §1
   figures are **30.7 billion** ACH payments at the top 50 U.S. institutions in
   2025, and **20 billion** of those at four banks (Chase, Bank of America,
   Wells Fargo, Citibank). An earlier draft's $100 trillion / $30 trillion
   totals are not in `camera-ready-paper.pdf`, and the build fails if they
   appear in the copy.
   → `test/content.test.ts`, and the numbers section of `assert-build.mjs`

`assert-build.mjs` runs its full suite on every registered version. A version
without an entry in its `STATIC_CONTENT`, `PROPERTY_LINES` and `FIGURES` maps
fails the build: a page nobody has written a static contract for is a page
nobody has checked.

## Two readers, one page

Plain language is the default register of every version from `version1` on.
Anything an engineer wants (formulas, the FSM tuple, nuXmv setup, counterexample
traces) goes in a `Disclosure.astro` box, closed by default, right after the
plain sentence it deepens. `test/content.test.ts` fails if an implication
symbol or `INVARSPEC` appears outside one.

## Motion modules

Anything with a `prefers-reduced-motion` branch lives in a plain `.ts` module
next to its component, not inside the `.tsx`: `node --test` cannot import a
`.tsx` under Node's type stripping, and "reduced motion shows the finished
state" is a property worth asserting rather than describing.

- `scroll-scene.ts` — the scrub arithmetic (`scenePosition`, `trackHeight`,
  `stepOpacity`, `counterValue`). Pure functions; no component re-derives them.
- `ledger-motion.ts` — the palette tokens, `beatVariants`, `heroLoop`.

## Figures

`parsed-paper/assets/fig*.png` are cropped from **rendered pages**
(`pdftoppm -r 200`), never from `pdfimages`. The screenshots carry redaction
overlays; rendering composites them, raw extraction would strip them and publish
unredacted account data. Do not "improve" this by extracting the embedded
images.

The screenshots are white banking UI on a dark site. They get an explicit light
card (`ScreenshotFrame.astro`) rather than a CSS invert — inverting evidence
would stop it matching the paper.

## Commands

```
npm run dev        # dev server
npm run build      # astro check && astro build
npm run test:unit  # node --test over test/**/*.test.ts
npm run assert     # build assertions against dist/
npm test           # test:unit + build + assert
```

Review over Tailscale: bind the dev server to `0.0.0.0`.

**Stale dev-server gotcha:** if the dev server is left running across an
`npm install`, Vite's optimized-dep cache goes stale and island imports 504
silently — islands render their static SSR markup but never hydrate (no
animations, no console errors). Restart the dev server after any `npm install`.

## Deployment

`.github/workflows/deploy.yml` publishes to GitHub Pages on push to `main`, and
gates on `test:unit`, `build` and `assert` before the artifact is uploaded, so a
red test never reaches the live site. `test/deploy-workflow.test.ts` pins that
wiring — add a step to `npm test` and it goes red until the workflow runs it too.

Base is `/blog-fv-ach`; final URL `https://alihamzamalik.me/blog-fv-ach/`.

**One-time manual step, not automatable from the repo:** Settings → Pages →
Build and deployment → Source = *GitHub Actions*. Note this repository is
**private**, and GitHub Pages on a private repository requires a paid plan; on
the free tier the repo must be made public before Pages will serve.

## Palette

Dark-only, native to `alihamzamalik.me`: `#141414` ground, `#CEFF00` lime accent,
Space Grotesk / Inter / JetBrains Mono. The ledger tokens are layered on top and
documented in `docs/storyboard.md`.
