---
title: "Visual idea overview — implementation plan"
slug: "visual-idea-overview"
phase: plan
status: current
last_updated: "2026-08-31"
---

# Visual idea overview — implementation plan

## Plan at a glance

Build a separate overview surface in the existing application. First show one real idea from a typed fixture. Use that visual in a scope-reduction discussion before committing to a new parser. This tests the main product assumption while the change remains small.

Next, make the source-file conversation loop dependable. An agent writes an overview, checks it, and sees its current contents in the viewer. This is the first usable release boundary. Add navigation to existing flows after that loop works. Add temporary alternatives last, without a proposal lifecycle or discarded-ideas interface.

Use `.diagram` for both flows and overviews, with required type metadata inside each file. Update existing `.flow` sources by hand in this repository and the soccer schedule repository. Preserve their graph meaning. Do not add migration tooling or a general graph framework. Source content remains authoritative; browser preferences cannot restore obsolete capabilities.

This plan uses commit `c1d4770`, release 0.2.0, as its implementation baseline. CLI rendering and authoring improvements are committed locally. Soccer's documentation-gate changes remain in its working tree. Reuse those improvements and preserve ongoing work. Byron approved the wireframes and authorized implementation on 2026-08-30. Byron accepted the running preview unchanged. All four milestones are complete. Final browser rechecks passed on 2026-08-31. See [implementation evidence](final-proof/README.md). See [baseline reconciliation](reconciliation.md) for evidence and limits.

## Implementation strategy

**UI boundary.** Follow the proposed [UI scope review](ui-scope-review.md) and [wireframes](wireframes/index.html). Add the overview board while retaining the existing desktop toolbar and right-sidebar positions. Adapt their content by type. Do not add a navigation system or refactor the flow controller into a generic workbench. Wireframes establish scope; they do not complete the running-preview proof.

**Boundaries.** Proposed additions are a shared diagram envelope, `OverviewDocument`, and `OverviewWorkbench`. Names below identify intended files, not existing code. Dispatch by the required file type to separate flow and overview parsers and viewers. Keep parser output separate from presentation state. Reuse path-security helpers through a narrow extraction with regression tests.

**Reuse the completed tools.** `src/cli/runtime.ts` owns local server startup and cleanup. `src/cli/cdp.ts` owns browser capture. `src/cli/contact-sheet.ts` writes PNG or SVG sheets with native-size tiles and pagination. Extend document dispatch and readiness only; do not build another launcher, screenshot pipeline, or sheet generator. Preserve source-alias protection, overwrite checks, pure JSON reports, source hashes, and confirmed child-process cleanup.

**Source format.** Specify `.diagram` with a `diagram 1` header and exactly one `type flow` or `type overview` line. The header replaces the legacy `flow 3` file header. Keep existing flow body syntax and normalized graph semantics where possible. Reuse flow parsing through a small adapter with correct source-line offsets. The common file version is distinct from the internal graph schema version.

The overview payload contains stable IDs, title, purpose, ordered groups, capabilities, and optional detail. Permit empty drafts and ungrouped capabilities. Canonical formatting must be repeatable. Missing or unknown types, unsupported versions, duplicate IDs, and invalid references produce located diagnostics. Do not infer a type from the filename or silently accept mixed bodies. Flow references and alternatives enter with their respective milestones.

**Local loop.** Run `pnpm dev` for the fixture proof. Run `pnpm typecheck` and `pnpm test:dsl` for shared-code changes. Add `pnpm test:overview` when overview logic exists. After source integration, use `pnpm build`, `pnpm flow view <fixture-root>`, and `pnpm flow render <file.diagram> --output <preview.png>`. Use the checkout CLI until an installed package is confirmed to support the new header. Package verification must exercise `prepack`, the packaged server, and the CLI entry through a package symlink. No network service is required after dependencies are installed.

**Source refresh.** Load only the selected document during iteration. Start with a visible Reload source action and refresh on window focus. Then add bounded polling for the selected overview while visible. Use one outstanding request, a source revision, and cancellation to prevent late responses from replacing newer content. The documented default interval can be two seconds; it is not a product requirement. Do not poll the entire repository.

**Failure behavior.** Initial invalid content shows an error with source location and retry. A later invalid edit retains the last valid visual with an explicit stale warning. A repair clears the warning. A missing file offers retry and return to the picker. View preferences use workspace, path, and active view identity. They never store semantic content.

**Dependency proof.** The first slice uses the installed SolidJS renderer and a local fixture. The real filesystem enters in milestone 2 through an overview-loader boundary. Test it with temporary roots. Test refresh ordering with controlled responses. Confirm these contracts through the actual local server. Cloud, credentials, and deployment proofs do not apply. The existing ELK router is absent from overview rendering.

**Compatibility.** Preserve flow semantics and command names while changing the supported source extension to `.diagram`. Use a common typed catalog and document loader. Keep the existing flow-specific APIs and query parameters as adapters if needed by current render tooling. The file metadata remains authoritative; a flow-specific request for an overview must fail clearly.

The runtime probes `/api/flows?launch=...` to verify server ownership. Preserve that check when changing catalog endpoints. Separately verify the ordinary browser picker request without a launch token; do not treat successful direct-file renders as proof that the picker works.

Update known file references by hand and report replacement paths. Do not add old-path redirects, storage migration, or a legacy reader. Before renaming a file, preserve any wanted browser-local edits through the existing export path. New file paths may start with fresh view preferences. Normal check, format, view, and render paths discover `.diagram` only.

## Milestone 1: A visual discussion produces smaller, clearer scope

**Execution status:** Complete. Byron accepted the running preview unchanged and requested no scope edits. See [running proof and evidence](proof/README.md). Do not force subtraction or invent before/after evidence. Milestone 2 is complete.

Add a proposed `OverviewWorkbench.tsx` and a small typed fixture at an isolated overview preview route. Use `src/data/flows/resume-alignment.flow` as illustrative input, not proof of implemented resume functionality. Do not import all historical variants into the initial idea.

Render ordered groups and title-only capability controls. Selection opens concise detail. Start with CSS layout rather than the flow router. Use readable text, visible focus, and no required pointer drag. Scope styles to the new surface. Keep the fixture contract small enough to replace without migration.

Use wireframes 3 and 4 to test the board and stable inspector. Omit graph-edit actions, movement hints, and node filters from this surface. The read-only overview source tab supports inspection; authoring remains with the agent.

Capture the initial overview at 1440 × 900 and 1280 × 800. These are test viewports, not support limits. Use a brief conversation to remove, combine, and clarify items. Record whether the revised view preserves intended meaning. Treat feature counts as evidence, never as a success score.

Use browser capture for this fixture-only preview. The existing CLI expects a source-backed flow and its readiness signal; do not invent a fake flow to satisfy it. Reuse the established `STRUCTURAL`, `SOURCE`, and `VISUAL` evidence labels. Actual browser interaction remains separate from image inspection.

Have Byron assess the five-second overview and scope decisions. When practical, use a separate browser-verification subagent for visible behavior. Give it the starting URL and acceptance criteria, not a source walkthrough. Check labels, selection, focus, and overflow. Do not ask it to decide Byron's intended product.

### Desired end state

A running preview helps Byron recognize purpose, reduce scope, and select a capability for further flow work. Before and after evidence records the result. Existing flows remain unchanged. If the proof fails, revise the board or keep a static diagram; do not continue to parser work. Removing the preview restores the prior application.

## Milestone 2: Agent source edits reliably change the overview

**Execution status:** Complete. See [browser evidence](source-proof/m2-source-backed-browser-report.md) and [manual adoption verification](adoption-verification.md). Package capture and source hashes passed. Browser tooling could not observe download delivery; source-panel contents were verified.

Add the common diagram envelope and typed parser/formatter dispatch under `src/types` and `src/lib`. Write a shared `docs/diagram-dsl-spec.md` with flow and overview examples. Add overview types and the reader under `src/server`. Keep ordinary comments and short optional detail sufficient for rough ideas.

Locate the known diagram files in this repository and the soccer schedule repository. Rename them to `.diagram` and update their headers by hand. Update file references, examples, affected tests, and authoring instructions in the same change. Leave unrelated ongoing work untouched. The earlier documentation-only restriction ended when Byron authorized implementation.

The soccer checkout is `/Users/byronwall/Projects/soccer-schedule`. Its new `app/scripts/check-docs.ts`, associated tests, and `AGENTS.md` recognize `.flow`. Update that classification to `.diagram`; keep the existing targeted formatter and full-verification fallback. Include `docs/flows/README.md` and all nine flow sources. Because the gate code changes, this change is not documentation-only. Follow soccer's mixed-change verification policy without overwriting its current uncommitted work.

Review the edits to confirm that graph bodies, IDs, variants, and layout remain intact. Check and open the updated diagrams from both repositories. Use ordinary source review and existing validation; do not create a converter, migration command, dry-run mode, or compatibility layer.

Update the DSL panel, source exports, and `window.flow` source/metadata methods to use the common envelope. Preserve method names and graph meaning, not the old header string. Verify that exported flow text reopens as a flow-type `.diagram` document.

Add common diagram catalog and document endpoints. Extend the picker in `src/routes/index.tsx` to display the declared type. Extract root resolution and path validation from `src/server/flow-catalog.ts`. Keep existing flow endpoints as narrow adapters where required. Preserve deterministic discovery and ignored directories. Reject absolute paths, traversal, and symbolic-link components. Never serve arbitrary linked files.

Use wireframe 2 for the picker adaptation. Rename All flows to All diagrams and source-tab wording to Diagram DSL. Use wireframe 7 for local error and empty states; do not add separate workflow screens.

Make `flow check`, `flow format`, and `flow render` dispatch `.diagram` content by its metadata, including directories containing both types. Preserve command names and default search directories. Keep flow semantic lint out of overview validation. Absence of flow links, goals, or detail is not an error. Report unsupported types explicitly rather than skipping files.

Adapt the existing render path to the overview board. Preserve `render=1`, storage-free capture, exact-URL readiness checks, and final-paint waiting. Add a truthful board layout identifier to capture/report types; do not report ELK for a CSS board. Scope capture styles so overview purpose and group labels remain visible. Keep source content unchanged. Reuse the current report and contact-sheet path for both document types.

Update the maintained `skills/author-flow-diagrams` skill, compact reference, distributed specification, example, and `docs/flow-authoring-workflow.md` together. Keep the shared specification authoritative and its distribution copy byte-identical. Let the compact guide branch by document type; do not apply flow stages or outgoing-edge rules to overview ideas. Preserve staged reading, short titles, stable IDs, evidence labels, and bounded retry guidance. Preserve source comments; canonical formatting currently removes them, so do not promise a lossless rewrite.

After validating the maintained skill, update its installed copy at `/Users/byronwall/.codex/skills/author-flow-diagrams`. Preserve local metadata customization. Verify reference/example equality and test one overview authoring exercise. The current installed skill lacks the latest contact-sheet paragraph; include it during that controlled update. Do not create another authoring skill or require an exhaustive reference read.

Connect source refresh to the overview reader. Do not reuse the hard-coded watcher in `src/routes/api/graph-events.ts`. Keep source content out of local storage. Retain selection only while its ID survives; clear removed selections. Use stable group order to limit visual movement during small edits.

Verify both types through parse/format round trips and mixed-directory discovery. Test missing, duplicate, and unknown type declarations, type/body mismatch, and unsupported versions. Add empty drafts, ungrouped items, duplicate IDs, malformed edits, repair, deletion, and out-of-order refreshes. Test traversal and symlink rejection with real temporary directories. Run existing flow semantic, catalog, and CLI checks against the hand-edited fixtures.

Prove the conversation loop from an external fixture root using the packaged server. An agent edit must appear without browser content overriding it. A failed reload must never silently look current. Check that source files and storage are unchanged by capture. Test mixed-type rendering, source hashes, pure JSON, native-size PNG sheets, SVG output, scale, pagination, invalid documents, and startup/cleanup failures. Retain existing CLI regression tests. Inspect individual images as well as sheets; successful rendering does not prove readability.

### Desired end state

Byron can discuss an idea while an agent edits its source, checks it, and presents the refreshed overview. Both types use `.diagram`, including existing files in the two known repositories. Invalid intermediate edits have a clear recovery path. This is a usable stopping point. Removing the overview surface leaves flow documents usable. If the format change fails verification, restore only this initiative's code and file edits together.

## Milestone 3: A capability opens relevant flows and returns to context

**Execution status:** Complete. Navigation, return, working-copy state, invalid links, and repair passed independent browser checks. See [browser follow-up](final-proof/follow-up-report.md) and [final recheck](final-proof/final-recheck.md).

Add optional flow references to capabilities. Each reference names a `.diagram` path relative to the served root and may select a variant. Verify that the target declares `type flow`. Several capabilities may reference the same flow; a capability can reference several flows. No reverse registry or impact graph is needed.

Resolve references with the common secure diagram reader. Keep missing or wrong-type references visible as warnings with retry guidance. They must not prevent an otherwise valid overview from opening. Use flow URLs with migrated paths. Add a validated return link that restores the overview path, selected capability, and active view. Do not accept an arbitrary return URL.

Wireframe 5 places that context in a small row above the existing flow view tabs. Show it only when there is an overview origin. Keep the flow editor controls and inspector intact.

Test no-link selection, shared links, missing files, renamed variants, direct refresh, browser Back, and return after a capability is removed. Distinguish source-backed flow content from existing browser-local edits; offer the established reset-to-source path when a linked flow has a local working copy. Do not silently clear that copy or claim it is canonical.

Run browser checks on overview navigation and the existing flow canvas. If the flow toolbar changes, verify direct pointer selection, node movement, pan, zoom, and variant switching. Preserve layout and routing behavior.

### Desired end state

A capability provides useful navigation into detailed behavior. Returning restores valid overview context or explains why it no longer exists. Unlinked capabilities remain first-class content. Removing overview navigation leaves each flow independently accessible.

## Milestone 4: A real alternative can become the single current direction

**Execution status:** Complete. View rendering, selection, adoption, and removed-view recovery passed. The accepted overview has no speculative alternatives. See [final recheck](final-proof/final-recheck.md).

Extend the overview format with named variants based on shared base content. Use a small set of operations for adding, removing, and changing groups and capabilities. Keep materialization pure and separate from rendering. Materialize first, then validate the final view. Reject invalid references rather than silently deleting capabilities when a group disappears. Do not import the flow operation engine or add variant inheritance.

Show the base and named alternatives as tabs. Render only the selected complete view. Start with one meaningful comparison from the current discussion, not a library of historical ideas. Different views must not share selected-item state unless the ID exists in both.

Use wireframe 6. Hide the overview view-tab row when there are no alternatives. Do not add an adoption button or an alternative-management panel.

Document an agent adoption workflow: materialize the chosen view, make it the base, remove rejected alternatives, format, check, and reload. A former variant URL must return to the base with a clear notice when that variant is removed. Adoption requires no in-app write API.

Test base isolation, conflicting operations, removed groups, removed selections, shared flow links, and adoption. Verify that switching views reveals no content from the previous view. Add a document-level current/intended label so an explored future state cannot appear to be shipped reality.

Extend the existing `--variant` render path to overview variants. Verify the requested materialized view in the image and report. Add no separate variant exporter or historical-alternative catalog.

### Desired end state

Byron can compare a legitimate choice, select a direction through conversation, and return to one clean active representation. Existing flow variants remain unchanged. Removing optional overview variants preserves the base overview and all standalone flows.

## Open decisions and spikes

The product gate is the visual proof. The common `.diagram` extension, required type metadata, and manual file updates are settled. Typography, group packing, and payload details remain reversible until the proof passes. If deeper grouping appears necessary, first test whether scope or labels are too broad. Add nesting only when meaningful scope cannot otherwise be shown. No further discovery questionnaire is needed before milestone 1.

## Below the cut line

- Proposal lifecycles, backlogs, history panels, delivery status, and automatic reality checks.
- Cross-flow impact analysis, capability dependencies, and automatic flow generation.
- In-app agents, chat, provider credentials, collaboration servers, or a database.
- A universal graph model, nested variant families, and mandatory goal records.
- Manual overview coordinates, deep grouping, alternate goal views, and mobile-first design.
- A second screenshot/export pipeline. Adapt the existing CLI capture and contact-sheet tools for source-backed overview documents.
- Migration commands, converters, legacy readers, old-path redirects, and browser-storage migration.

Do not remove existing flow exports, manual layout, or browser editing while enforcing this cut line.
