# Soccer repository documentation quality gate

Owner: soccer-schedule maintainer. Home: `/Users/byronwall/Projects/soccer-schedule`.

This document is a handoff plan. It does not change that repository.

## Outcome and evidence

Documentation-only changes receive checks that can find documentation defects. Code changes retain the full application gate.

`AGENTS.md` currently requires formatting after document changes and defaults to `pnpm -C app verify`. `app/scripts/verify.mjs` runs formatting, TypeScript, Vitest, and ESLint. `app/scripts/format-files.mjs` scans whole roots. The reviewed task scanned 412 candidates while formatting one new index.

## First slice: an explicit documentation gate

Add a documented documentation-only path to `AGENTS.md`. Use it only when all changed content is Markdown or `.diagram`, with no application, build, dependency, or runtime configuration changes. Treat executable examples and workflow instructions as requiring targeted review. Mixed or uncertain changes use the full gate.

The gate checks changed Flow files, canonical formatting, affected Markdown, local source links, and the behavior claims changed in the diagrams. Include relevant untracked files without staging user work. Preserve the existing source map in `docs/flows/README.md` as the first navigation aid.

Add a named package script for this gate if a short repeatable implementation is useful. Keep its implementation in TypeScript under the project's conventions. Do not silently change the meaning of `verify`.

Proof: a Markdown-plus-flow change selects the documentation gate. A mixed source change selects full verification. An invalid relation and a broken local source link both fail the documentation gate.

## Second slice: targeted formatting and launcher recovery

Extend the existing formatter to accept explicit files while preserving its no-argument full scan. Support paths with spaces. Reject paths outside the checkout. Limit write mode to the selected files.

Retain the documented direct verification fallback when pnpm fails before the script starts. Add the corresponding safe fallback for document formatting if needed. Prefer pnpm normally; do not disable signature checks, change dependency settings, or install packages as part of verification recovery.

Use the executable path returned by `command -v`. Read script names from `package.json` instead of guessing. After a known bootstrap failure, avoid another long bootstrap attempt without new evidence. Distinguish a failed launcher from failed project checks in the final report.

Proof: format one changed Markdown file without touching unrelated files. Exercise launcher failure through a controlled substitute, not by damaging global pnpm. Confirm the documented fallback runs the intended local script.

## Visual adoption and rollback

Use the shipped Flow renderer to inspect changed diagrams. Standard soccer captures passed visual review. Compact renders fit the graph and omit the legend below 480 pixels; compact text can be small, so 1200 × 800 is recommended. Dense existing edge labels can still overlap cards. Evidence is in `/tmp/flow-render-verify/soccer/report.json` and `/tmp/flow-render-verify/soccer/contact-sheet.svg`.

The independent soccer gate also passed all 164 tests. It reported 18 existing warnings. Do not require every soccer application test for a diagram image.

Keep the full application gate available as the fallback. Reverting the documentation-only rule restores previous behavior without changing application data.

## Cut line

No pnpm upgrade, dependency install, global signature-policy change, application refactor, or new end-to-end testing platform. The observed registry failure does not prove a tampered package. Its root cause belongs to a separate environment investigation if it recurs.
