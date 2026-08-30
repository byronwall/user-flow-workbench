# Flow authoring improvement verification record

Date: 2026-08-30  
Status: implementation and verification complete

This record separates completed owner evidence from the limits that remain. The CLI repair, final delta recheck, and full initiative verification pass for the current scope.

## Current state

- CLI implementation: complete for the current scope. Thirty-two DSL tests, typecheck, prepack, and global installed smoke pass. An independent source review verified source-alias protection, pure JSON output, delayed startup and SIGTERM handling, ready-server cleanup, and stubborn-browser cleanup. The last P2 cleanup confirmation is fixed with deterministic tests.
- Full initiative verification: complete for the current scope. The root installed CLI batch passed 9/9 with ELK images and matching source hashes.
- Skill and reference: independently verified.
- Soccer documentation gate: independently verified.
- Authoring workflow exercise: completed as a bounded usability exercise.

## Evidence

### STRUCTURAL

- Soccer documentation check and targeted formatter passed. The independent fixtures covered untracked documentation, flow-only changes, broken local links, invalid flows, mixed source changes, rename and deletion cases, paths with spaces, and paths outside the repository. The flow-only path did not run the full application scan.
- The full direct verification passed 25 files and 164 tests, with 18 existing warnings and 0 errors.
- Skill review fixed portable links and the compact format trigger. The runbook is now [docs/flow-authoring-workflow.md](../../flow-authoring-workflow.md). The installed skill is valid and synced. Examples, typecheck, and 25 DSL tests passed; the repaired CLI suite now passes 32 DSL tests.
- The installed CLI black-box check passed the nine soccer flows, variants, scale checks, source hashes, error cases, and occupied-port handling. The root installed batch passed 9/9 with ELK images and matching source hashes at `/Users/byronwall/.codex/visualizations/2026/08/30/01a053cf-abcc-7181-a369-a5c591073494/soccer-flow-previews`. The prior report and contact sheet are at `/tmp/flow-render-verify/soccer/report.json` and `/tmp/flow-render-verify/soccer/contact-sheet.svg`.
- The Software Design Sleuth validator passed with one warning: the first milestone introduces material browser and viewer dependencies. The audit scored 8.9/10. Its open improvements are dependency isolation and a more explicit local feedback command.
- The initial local Markdown link check covered 8 files and 9 links. A post-record sweep covered 9 files and 11 links. All local links resolved.

### SOURCE

- The authoring skill review preserved stable IDs, source links, semantic types, and the distinction between handoffs and deliverables.
- The soccer review kept application-specific checks in the soccer repository and preserved the existing full verification fallback.
- The authoring exercise read the runbook, the compact DSL base reference, and targeted CLI excerpts.

### VISUAL

- The installed renderer passed independent black-box review for the standard soccer captures and the contact sheet. The final root batch is 9/9 successful, uses ELK at 1200 × 800, and emits pure JSON in its report.
- A fresh authoring exercise rendered at 1200 × 800. Inspection led to a layout-hint revision, followed by a successful recheck and render.
- Compact renders fit the graph and omit the legend below 480 pixels. Compact text can be small, so standard 1200 × 800 captures are recommended. Dense existing edge labels can still overlap cards. No routing fix was added for this existing renderer limitation.

## Bounded exercise

The exercise used `/tmp/flow-workflow-exercise.flow` and `/tmp/flow-workflow-exercise.png`. The first check and format run required one repair. The final check, format, and 1200 × 800 render passed. This shows that the workflow can guide one fresh authoring task. It is not a matched benchmark and supports no token-savings claim.

The preserved baseline is one prior task: 470.925 seconds, 87,947 uncached input tokens, 1,632,640 cached input tokens, and 11,281 output tokens. The new exercise is not matched to that task.

## PNG contact-sheet follow-up

The CLI now writes PNG contact sheets by default. An explicit `.svg` path preserves SVG output. PNG capture uses the existing browser session. It needs no separate conversion command or package.

The final installed CLI run passed all nine soccer flows. The PNG sheet measures 1080 × 750 pixels. Visual inspection confirmed all nine labels and previews, with no border crop. Typecheck and all 34 tests passed. The package build passed. An independent check confirmed SVG failure sheets still work when browser selection fails.

The one-off conversion worker caused five Chrome startup crashes under the restricted execution context. Logs show macOS application registration aborted before any page loaded. Later CLI runs with approved execution permissions succeeded. The exact startup cause remains uncertain. Do not repeat browser flag changes after this failure; inspect the error and execution permissions first.

## Contact-sheet resolution follow-up

The initial PNG reduced each 1200 × 800 preview to about 315 × 210 pixels. The CLI now reads each PNG's native dimensions and preserves those pixels in the sheet. The regenerated nine-flow sheet measures 3720 × 2550 pixels. Full-size inspection confirmed clear node text. All nine renders, 35 tests, typecheck, and the package build passed. Independent checks covered wide images, tall images, pagination, and 2× source resolution.

## Next verification

No further verification is required for the current scope. Future renderer work can address dense edge-label overlap. There is no automated readability or comparative token-savings claim.
