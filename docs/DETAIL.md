# Writing suite

This bundle merges the former tutorial writing plugin and paper suite into one Host plugin and one browser panel.

It retains the existing tool names:

- `ascend310b_writing_*` for Markdown tutorial, site, deck, build, progress and release checks.
- `paper_*` for paper scaffolding, citation/evidence audit, LaTeX builds, evidence sync and completeness review.
- `ascend310b_writing_neural_diagram_audit` for TikZ connector-path geometry checks.

The browser sidebar opens one **Writing suite** panel with tutorial overview/progress/code-document views and an academic-paper review view.

The bundled `patent-disclosure` skill produces a nine-section invention technical-disclosure for a professional patent agent. It does not generate claims, formal patent applications, abstracts, requests, or grant-probability judgements. `diagram-design` supplies editable technical-diagram rules.

Configure `tutorialRoot` and `paperRoot` when the two document ecosystems live in different repositories. `repoRoot` remains a shared fallback.

The neural-diagram checker requires a `.layout.json` sidecar with module rectangles and connector polylines. A passing geometry check does not replace inspection of the final PDF.
