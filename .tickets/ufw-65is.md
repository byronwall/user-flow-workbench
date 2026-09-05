---
id: ufw-65is
status: closed
deps: [ufw-8680]
links: []
created: 2026-09-03T03:25:45Z
type: feature
priority: 2
assignee: Byron Wall
external-ref: docs/intent/unified-product-workspace/implementation-plan.md#milestone-4-the-workspace-replaces-duplicate-application-chrome
parent: ufw-jtsp
tags: [unified-workspace, workspace-chrome]
---
# Replace duplicate workbench chrome

## Initiative Intent

Complete the single-app experience after shared context and capability navigation work. Preserve the specialized behavior that makes each diagram type useful.

## Outcome

Overview, wireframe, and flow work feel like views inside one application. Shared project context has one home, while renderer-specific controls remain with their renderers.

## User and Operator Context

Byron uses the canvas to review agent-authored source and directly adjust flows. The final shell must reduce navigation duplication without shrinking useful content or hiding source ownership.

## Current System and Evidence

- The shared shell and capability navigation are established by prerequisite tickets.
- `Workbench`, `OverviewWorkbench`, and `WireframeWorkbench` currently contain duplicate project links and independent top bars.
- Flow controls include layout, fit, variants, export, local-copy status, and reset.
- Overview controls include source refresh, variants, export, stale status, and reference warnings.
- Wireframe controls include screens, shots, content sizing, references, comparison, interactions, and native popovers.
- CLI capture uses render mode and browser paint readiness.

## Requirements

- Let the shell own project navigation, breadcrumbs, source path, and shared context status.
- Keep layout, fit, export, view, shot, reference, and reload actions with their renderers.
- Remove the special flow return banner after the shell provides equivalent context.
- Remove redundant `Project index` links after the navigator replaces them.
- Label source-backed overview and wireframe content clearly.
- Keep flow browser-local working-copy and reset status visible.
- Preserve overview stale-source and reference-warning behavior.
- Preserve wireframe reference evidence, screen state, and comparison controls.
- Preserve direct document URLs and render-mode output.
- Update current product and authoring documentation after behavior is final.

## Settled Decisions

- Shared chrome does not mean identical renderer controls.
- Do not create a configurable toolbar system.
- Do not create a generic renderer interface unless the completed work proves a repeated need.
- Flow direct manipulation remains a release gate.
- Source-backed and browser-local content must remain visibly distinct.
- Browser download limits and non-shipped recursive project grouping must stay accurate in documentation.

## Constraints and Non-Goals

- Do not replace current renderer state ownership.
- Do not add source editing, relationship editing, or collaboration services.
- Do not add a universal product graph, manifest, database, or extension system.
- Do not remove flow exports, manual layout, or browser-local editing.
- Do not change the semantic meaning of folder inventory.
- Do not overwrite unrelated authoring-skill changes.

## Dependencies and Coordination

Depends on `ufw-8680`, which includes the earlier shell and reference prerequisites. Remove duplicate chrome only after the replacement paths pass their browser proofs.

Documentation changes overlap current edits under `skills/author-flow-diagrams`. Reconcile those edits before modifying maintained skill files. Update the maintained skill before distributed references.

## Scope

- Consolidate proven shared workspace controls.
- Remove obsolete return and project-index chrome.
- Preserve renderer-specific actions and state labels.
- Complete accessibility, interaction, narrow-layout, source-state, and CLI regression checks.
- Update `docs/product-context.md`, README, the maintained authoring skill, and required distributed references.

## Known Implementation Context

- Project guidance requires direct pointer checks after canvas event changes.
- Routing changes require automatic layout and manual movement checks.
- The maintained and distributed diagram specifications must remain byte-identical.
- Overview exports and browser downloads have known destination-verification limits.
- Recursive folder-project grouping is not shipped behavior.

## Allowed Implementation Discretion

- Choose final spacing, labels, and responsive placement within the accepted shell.
- Keep a small renderer-local bar when an action has no shared meaning.
- Delete duplicate markup and styles once the replacement passes.
- Extract a shared presentational component only when three proven uses remain identical.

## Edge Cases and Failure Behavior

- Flow source, restored local copy, and changed local copy states.
- Overview current, stale, failed refresh, repaired source, and changed document type.
- Missing, wrong-type, and repaired references.
- Wireframe rest, hover, open popover, content fit, viewport, actual, and compare states.
- Narrow layouts, keyboard focus, and browser history.
- Flow canvas resizing, pointer selection, node drag, background pan, and trackpad zoom.
- Automatic layout, manual movement, variant switching, and fallback routing.
- CLI capture startup, final paint, isolated chrome, and output inspection.

## Proof and Acceptance

- `pnpm test:overview` and `pnpm test:dsl` pass.
- `pnpm typecheck` and `pnpm build` pass.
- `pnpm flow check` passes for repository fixtures.
- `pnpm flow render` succeeds for one overview, one wireframe, and one flow.
- Individual rendered images are visually inspected.
- A clean browser completes the overview-to-screen-to-flow journey.
- Keyboard navigation, focus restoration, readable labels, and narrow layouts pass.
- Direct flow pointer selection, drag, pan, zoom, layout, variants, and reset pass.
- Overview selection, variants, refresh, shelf behavior, and warnings pass.
- Wireframe navigation, popovers, comparisons, and embedded scenes pass.
- Documentation matches shipped behavior and required specification copies are byte-identical.

## Rollout and Recovery

Remove old chrome only after each replacement is verified. If the final consolidation causes a regression, restore renderer-specific chrome while keeping proven relationships and catalog behavior.

## Below the Cut Line

- Universal product graph and generic relationships.
- Project-wide backlinks for direct opens.
- Flow-node-to-screen links.
- In-app source or relationship editing.
- Automatic relationship inference.
- Project manifest, database, or nested project navigation.
- Drag-and-drop organization, coverage scores, or lifecycle tracking.
- General renderer registry, toolbar framework, or extension system.

## Provenance

- Initiative claims: `coherent-workspace`, `overview-home`, `capability-context`, `typed-models`, `explicit-links`, `standalone-artifacts`, `no-universal-graph`.
- Selected shape: one shared shell with specialized typed renderers.
- Plan milestone: `coherent-workspace`.
- Repository baseline: `11553125b622e502a7133f07c966484df850d46b`.
- `docs/intent/unified-product-workspace/implementation-plan.md`

## Open Questions

None. Ticket completion requires observed behavior, not a new product decision.

## Notes

**2026-09-03T05:45:42Z**

Completed shared chrome consolidation and documentation. Removed renderer Project index links and the flow return banner; preserved renderer-local controls and source-state labels. Fixed origin overview titles, embedded-scene readiness, and single-file CLI server-root selection for workspace-relative embeds. Render mode now hides wireframe viewer chrome. Verified 41 overview tests, 52 DSL/CLI tests, typecheck, build, flow check, diff check, byte-identical specs, full browser interactions and navigation, narrow and keyboard behavior, direct/render URLs, and visually inspected overview, flow, standalone wireframe, and embedded wireframe renders.
