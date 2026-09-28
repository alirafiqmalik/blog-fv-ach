# Credit Without Debit

Interactive walkthrough of the CCS '26 paper **Credit Without Debit: Formal
Verification of Banking Payment Systems** (Ali Hamza Malik and Muhammad Taqi
Raza). A formal model of U.S. ACH payments, and three Credit-Without-Debit
instances — creditBLEED, creditMINT, and creditRESET — validated on real
accounts and since closed.

- **Site:** `academic-project-astro-template/` (Astro + MDX + React islands)
- **Story:** [`docs/storyboard.md`](docs/storyboard.md) — the narration spec the
  scenes were built against
- **Content authority:** [`parsed-paper/`](parsed-paper/) — the paper, parsed
- **Working notes:** [`AGENTS.md`](AGENTS.md)

```bash
cd academic-project-astro-template
npm install
npm run dev      # http://localhost:4321/blog-fv-ach/
npm test         # unit tests + build + build assertions
```

Deploys to GitHub Pages from `main` via `.github/workflows/deploy.yml`.
