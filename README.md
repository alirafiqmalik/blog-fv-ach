# Credit Without Debit

Single-page research blog for the CCS '26 paper **Credit Without Debit: Formal
Verification of Banking Payment Systems** (Ali Hamza Malik and Muhammad Taqi
Raza).

- **Site:** [`site/index.html`](site/index.html) — one self-contained HTML file
  (plain CSS and vanilla JS, Google Fonts, light/dark theme, no build step)
- **Live:** https://alihamzamalik.me/blog-fv-ach/

Page order: hero and collapsible abstract → Why ACH Payments? → What We Found
(interactive attack walk-through: three tabs, a timeline over the ACH
architecture) → How We Found It (model checking and the Nacha rules, with the
verification-pipeline figure) → What We Tested (results and exposure windows)
→ BibTeX → FAQ.

Open `site/index.html` in a browser to preview it locally.

Deploys to GitHub Pages from `main` via `.github/workflows/deploy.yml`.
The earlier Astro version of the site is kept on the `bkup-main` branch.
