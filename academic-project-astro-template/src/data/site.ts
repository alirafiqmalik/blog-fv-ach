/**
 * Identity shared by the site chrome (nav + contact bar).
 *
 * These are the values `_data/personal.yml` carries on the Jekyll personal
 * site; the demo deploys to its own project site, so every cross-site link is
 * absolute against the canonical domain in that repo's `CNAME`.
 */
export const SITE = {
  /** Canonical origin of the personal site (personal-site/CNAME). */
  home: "https://alihamzamalik.me",
  author: "Ali Hamza Malik",
  email: "ahmalik@umass.edu",
  location: "Amherst, MA",
  contactBlurb:
    "If you have questions, ideas for collaboration, or want to chat, here's how to find me. I typically respond within 2 business days.",
  socials: {
    github: "https://github.com/alirafiqmalik",
    linkedin: "https://linkedin.com/in/alihamzamalik",
    scholar: "https://scholar.google.com/citations?user=alihamzamalik",
  },
} as const;
