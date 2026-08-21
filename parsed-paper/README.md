# parsed-paper — content authority

`ACH_CCS_2026.pdf` is the submitted paper. Everything the website says about the
research must be traceable to this directory:

- `paper.md` — clean prose parse, section by section, with the authoritative
  A1/A2/A3 and Φ1/Φ2/Φ3 numbering.
- `raw-layout.txt` — `pdftotext -layout` dump, kept so a claim can be grepped
  back to the two-column source.
- `assets/fig*.png` — the paper's figures, **cropped from rendered pages**
  (`pdftoppm -r 200`), never from `pdfimages`. The screenshots carry redaction
  overlays; rendering composites them, raw extraction would strip them and
  publish unredacted account data.
- `assets/pages/page-NN.png` — every page at 110 dpi, for locating a claim.

If the website and `paper.md` disagree, `paper.md` wins.
