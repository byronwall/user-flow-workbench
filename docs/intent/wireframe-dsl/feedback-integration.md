# Pro feedback integration

Integrated on 2026-08-31. This record explains how the downloaded review changed the current wireframe plan.

## Source and preservation

The full [review](pro-review/feedback/wireframe-dsl-review.md) was downloaded from [Evaluate Wireframe DSL](https://chatgpt.com/c/6a94e6c8-ec48-83ea-8227-cfef46ea7ad6).

The saved report contains 57,583 bytes. Its SHA-256 matches the downloaded file. The [receipt](pro-review/feedback/receipt.json) records this check.

The [visible response](pro-review/feedback/chat-response.txt) is also saved. The report and original submitted packet remain unchanged.

This is the complete delivered review artifact and its response summary. The report's claimed experiments and external research are attributed to Pro.

## Adopted decision

Build a smaller custom layer. Use browser layout internally, preserve the compact authoring surface, and prove vector output before parser work.

Pro rated the original proposal low-to-moderate and the revised direction moderately high in likely success. Those are qualitative judgments, not measured probabilities.

The recommendation remains conditional on browser-to-SVG fidelity and a narrow diagram capture boundary. Neither is proved by the old Python gallery.

## Recommendation map

Section references below refer to the unchanged full report.

| Feedback | Decision | Where incorporated |
| --- | --- | --- |
| §1 weakness: wrapping headers move the main region | Change to fixed 44-pixel bars and explicit horizontal overflow | Language layout contract; Stage 1 locality tests. |
| §2 weakness: diagram adapter hides major integration work | Remove presumed adapter; prove a read-only snapshot first | Model snapshot records; Stage 1 capture boundary. |
| §3 weakness: one selected path cannot express independent state | Replace with element-local state and owner/use identity | Model, language, active inspector tab plus focused capability example. |
| §4 weakness: duplicated capabilities drift | Embed canonical overview and flow documents | Workbench examples use current workspace sources. |
| §5 weakness: expanded root gives false comparison | Keep nominal viewport; label supplemental scroll panels | Output contract and gallery gate. |
| Minimum language: reduce shells | Keep workbench/page only | Language, model, all examples. |
| Exact parts without recursive composition | Keep uses but forbid uses/diagrams inside parts | Language validation and parser gate. |
| Optional passive IDs; source/property spans | Keep, with owner-wide ID uniqueness | Model and Stage 2 tests. |
| Grid column count rather than fixed small limit | Keep positive count with readable minimum columns | Language layout rules. |
| Cards as leaves | Keep; compound content uses stack | Element contract. |
| New link, badge, notice leaves | Keep provisionally to cover return context and error corpus | Examples and model; proof may reduce them. |
| Marks separate from selected state | Replace path changes with top-level mark targets | Language and examples. |
| Prior-art comparison | Borrow mechanisms, do not adopt an engine | Notes below. |
| Typed fixtures before parser | Adopt as the first implementation stage | Implementation plan. |
| GUI readiness without full GUI scope | Preserve source and use identities; defer patch tooling | Model and Stage 2. |

## Changes made while reconciling the review

These are deliberate local decisions. They are not claims that the external review specified every detail correctly.

### Current code supersedes the review's integration baseline

The working tree already has `src/lib/diagram-dsl.ts`, `src/types/diagram.ts`, and overview payload support. Do not add another envelope dispatcher.

The catalog uses `/api/diagrams` and `/api/diagram`. The overview viewer and navigation are no longer just fixtures. Reuse them after the proof.

These files were uncommitted during inspection. Their presence is working-tree evidence, not evidence of a published release. Recheck at implementation start.

`formatFlowDiagramSource` is source export. It does not supply vector capture. The review's hardest dependency therefore remains open.

### Use workspace-root-relative paths consistently

The review's examples use sibling file references. Current overview references and `resolveDiagramPath` use paths from the workspace root.

Use that existing rule for wireframe diagram references and raster images. Reject `.` and `..` segments. Do not add two path interpretations.

An image resolver needs equivalent containment checks, but cannot simply call a resolver restricted to `.diagram` files.

### Missing authored focus must not silently change the proposal

The review requires invalid focus diagnostics but also discusses clearing stale selection. Those cases need separate rules.

A deleted authored focus fails validation and leaves a visibly stale preview. The agent must remove focus and update inspector copy explicitly.

Transient selection in the existing interactive overview keeps its existing behavior. No binding or automatic prose rewrite is added.

### Make IDs stable and marks unambiguous

Explicit IDs are unique across an entire owner screen or part. Sibling-only uniqueness would break identity after moving a node.

Reserve slot names in the screen element namespace. Otherwise a mark such as `mark header` could refer to two different things.

Part children retain their source owner and use-site identity. Anonymous elements remain capture-local until an agent adds an ID.

### Narrow bars to preserve their height contract

The review's general bar grammar could admit tall cards or nested containers. That conflicts with fixed-height toolbar behavior.

Permit only text, badge, button, and link leaves in bars. Preserve natural widths. Overflow scrolls horizontally without overlap or wrapping.

### Make capture comparisons honest

Check image dimensions against declared metadata. Warn when the screenshot and nominal wireframe dimensions differ. Preserve aspect ratio and labels.

Independent scroll regions do not form one natural taller screen. A full-content export uses labeled supplemental panels instead.

Use fixed internal tokens rather than inheriting mutable application styles. Record font configuration and availability without claiming universal font determinism.

The historical `current-ui.png` is actually a 1280 × 720 JPEG. Preserve it unchanged for packet provenance.

Examples use a byte-identical `current-ui.jpg` copy. Support PNG and JPEG, and reject future extension/signature mismatches. No image was recompressed.

### Separate the visual gate from the parser gate

The review's combined GO checklist includes parsing and malformed source. A parser-first requirement would defeat the proposed early experiment.

Stage 1 tests typed data, geometry, SVG, locality, and identity. Stage 2 then tests syntax, source spans, and formatting. Both must pass before completion.

## Prior art incorporated

The full report contains primary-source links, inspected revisions, and license findings. This pass did not repeat that external research or copy library code.

| Source examined by Pro | Idea retained | Boundary |
| --- | --- | --- |
| Wire-DSL | Source/property maps, explicit instance records, SVG identity | No engine adoption; generated order-based identity and text heuristics need care. |
| PlantUML Salt | Compact semantic widgets and composition | Do not inherit its full syntax or runtime. |
| Mermaid blocks and D2 grids | Separate screen composition from graph routing | Keep the existing semantic diagram engine. |
| Jonkeda Wireframe DSL | A warning about expanding control and style surfaces | Do not add coordinates, bindings, or a large widget catalog. |

No code-reuse or license decision is needed for this plan. Verify licenses again if a later implementation proposes copying code.

## What was removed or deferred

Remove structural selection paths, row/columns arrangements, split/centered shells, root expansion, nested uses, and copied capability boards.

Defer part parameters, instance override syntax, expanded sections, multiple viewports per file, and GUI editing. Keep the shared `.diagram` decision.

Do not add a migration command, legacy reader, generic vector editor, production UI generator, or application logic.

## Evidence and remaining uncertainty

Locally completed: report download and hash comparison; review ingestion; working-tree inspection; plan, model, and example revision.

Completed checks: the model passed standalone TypeScript validation. The current CLI accepted all three referenced flow/overview files. Local document links and example reference paths resolve.

Wireframe examples received contract review only. No wireframe parser exists to validate them yet.

Not completed: wireframe parsing, browser layout implementation, SVG export proof, vector flow/overview snapshots, or visual locality tests.

The next action is Stage 1 of the [implementation plan](implementation-plan.md), not broad parser or GUI development.
