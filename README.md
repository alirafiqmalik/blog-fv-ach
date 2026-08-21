# Money that appears before it exists

Interactive walkthrough of the CCS '26 paper **Provable and Operational Attacks
on Banking Payment Systems** — a formal analysis of U.S. ACH bank transfers that
found three ways to make money spendable that was never debited, all three
validated on real accounts and all three now fixed.

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
