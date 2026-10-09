/**
 * The page versions (docs/storyboard.md → the version table).
 *
 * The redesign ships one version at a time, each a full page under
 * `src/pages/<id>/`. The root page redirects to `DEFAULT_VERSION`, so promoting
 * a version is a one-field change here. Everything that knows about versions
 * reads this module: the root redirect, each page's nav, and
 * `test/content.test.ts` plus `scripts/assert-build.mjs`, which walk it to
 * check that every version's nav anchors exist and every version builds.
 *
 * `source` is the page's authored content, relative to the package root, so
 * the content tests can read what a reader reads.
 */

export interface NavLink {
  name: string;
  url: string;
}

export interface Version {
  /** Route segment under the site base, and the key in the test suites. */
  id: string;
  /** Short label for the version. */
  title: string;
  /** What this version adds, in one sentence a reviewer can check. */
  blurb: string;
  /** The page's authored content, relative to the package root. */
  source: string;
  /** The "working directory" the nav shows for this page. */
  cwd: string;
  /** Primary nav links, in scroll order. Each must be an anchor on the page. */
  nav: readonly NavLink[];
}

export const VERSIONS: readonly Version[] = [
  {
    id: "version1",
    title: "Version 1 — structure and copy",
    blurb:
      "The four-act structure with all the copy: hero with a still of the ACH overview figure, why ACH matters, what we did, creditBLEED, impact and disclosure. Static apart from the existing creditBLEED scene.",
    source: "src/pages/version1/index.mdx",
    cwd: "blog/fv-ach/version1",
    nav: [
      { name: "Why ACH matters", url: "#act1" },
      { name: "What we did", url: "#act2" },
      { name: "creditBLEED", url: "#act3" },
      { name: "Impact", url: "#act4" },
      { name: "FAQ", url: "#faq" },
    ],
  },
  {
    id: "version2",
    title: "Version 2 — the hero moves",
    blurb:
      "Version 1 with the ACH figure as the hero's animated background instead of a colour wash: the entry loops along the rail, each party answers to hover, focus or tap, and the Act I walk scrubs with the scroll.",
    source: "src/pages/version2/index.mdx",
    cwd: "blog/fv-ach/version2",
    nav: [
      { name: "Why ACH matters", url: "#act1" },
      { name: "What we did", url: "#act2" },
      { name: "creditBLEED", url: "#act3" },
      { name: "Impact", url: "#act4" },
      { name: "FAQ", url: "#faq" },
    ],
  },
] as const;

/** The version the site root sends a reader to. */
export const DEFAULT_VERSION = "version1";

export function versionById(id: string): Version {
  const found = VERSIONS.find((v) => v.id === id);
  if (!found) throw new Error(`unknown version ${id}`);
  return found;
}

export function defaultVersion(): Version {
  return versionById(DEFAULT_VERSION);
}
