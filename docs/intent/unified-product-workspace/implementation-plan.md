---
title: "Unified product workspace — implementation plan"
slug: "unified-product-workspace"
phase: plan
status: implemented
last_updated: "2026-09-03"
---

# Unified product workspace — implementation plan

## Plan at a glance

Build the workspace through four user-visible milestones. First, place the existing overview and flow journey inside one persistent shell. This tests the main product claim without changing a DSL. Second, add one typed capability-to-wireframe reference and prove the same contextual journey through a screen. Third, turn the selected overview into useful project navigation and show files not linked from that overview. Fourth, remove obsolete page chrome and verify every existing renderer, source state, and CLI capture path.

The main implementation pushback is to avoid a universal product model and renderer framework. The catalog, document dispatcher, URL state, overview flow references, and typed workbenches already provide the required seams. The plan adds one shell and one missing relationship. It does not add storage or a server-side relationship registry.

Each milestone leaves the application usable. Direct document URLs remain the bypass. The existing project inventory remains the fallback when the shell cannot choose an overview. Render mode keeps its current isolated output.

### Ticket graph

- Epic: [`ufw-jtsp` — Unify product workspace](../../../.tickets/ufw-jtsp.md)
- Complete: [`ufw-lozf` — Keep overview and flow context in one shell](../../../.tickets/ufw-lozf.md)
- Complete: [`ufw-w2gh` — Open wireframe screens from capabilities](../../../.tickets/ufw-w2gh.md)
- Complete: [`ufw-8680` — Organize project navigation by capability](../../../.tickets/ufw-8680.md)
- Complete: [`ufw-65is` — Replace duplicate workbench chrome](../../../.tickets/ufw-65is.md)

## Implementation strategy

- **First proof:** Navigate from the resume overview to its linked flow inside one persistent project shell.
- **Primary seam:** `Home` keeps document loading and dispatch while a workspace shell owns project and overview-origin context.
- **Fast local loop:** `pnpm test:overview`
- **Local dependencies:** Repository fixtures, temporary catalog directories, browser URL state, and the existing loopback viewer. No network is required.
- **Provider/live confirmation:** None. A built local viewer and a clean browser pass provide the highest required fidelity.
- **Rollout and rollback:** Keep direct `?diagram=` URLs, the inventory fallback, and render-mode bypass until the full workspace passes.

The focused loop should cover pure context, inventory, parser, and resolver behavior. Use `pnpm dev` for interaction work. Run `pnpm build` and the packaged `flow view` path before each browser gate. Inject missing files, wrong types, removed capabilities, removed screens, invalid variants, malformed source, and stale refreshes through fixtures.

## Milestone 1: One shell preserves overview and flow context

This milestone tests whether shared navigation creates one coherent experience. It uses the existing resume overview and flow reference. It changes no document syntax.

- **Change — Make `Home` the workspace controller.**
  - Load the diagram catalog for both inventory and document routes.
  - Keep current document dispatch instead of introducing a renderer registry.
  - Place the active renderer inside one `WorkspaceShell` component.
  - Let the shell own the project name, document path, project navigation, and overview-origin context.
  - Keep the selected document and view in the URL.
  - Verify direct flow, overview, and wireframe URLs still load.

- **Change — Add the minimum project entry rules.**
  - Open the only valid overview when exactly one exists and no document is selected.
  - Show an overview chooser when several valid overviews exist.
  - Show the current inventory when no valid overview exists.
  - Keep invalid files visible with their diagnostic counts.
  - Test zero, one, and several valid overviews with pure catalog fixtures.

- **Change — Preserve capability context through normal navigation.**
  - Reuse `OverviewOrigin`, `composeFlowUrl`, and `composeOverviewUrl` for the first slice.
  - Replace full page reload navigation with history entries where the current lifecycle permits it.
  - Restore the selected capability and overview variant after Back, Forward, and refresh.
  - Show stale-context notices when the capability or view no longer exists.
  - Verify that context parameters reject unsafe paths and identifiers.

- **Change — Keep renderer boundaries intact.**
  - Keep `mountFlowWorkbench` responsible for flow state, layout, and browser-local persistence.
  - Keep overview source refresh with its current last-valid behavior.
  - Keep wireframe screen, shot, reference, and display controls local to `WireframeWorkbench`.
  - Bypass normal shell chrome when `render=1`.
  - Test flow selection, dragging, pan, zoom, layout, variant switching, and reset after shell integration.

### Desired end state

- The resume overview and linked flow appear inside one persistent project workspace.
- Back, Forward, refresh, and direct URLs preserve valid context.
- Every document type remains independently usable.
- A browser pass proves the shell does not break flow interaction or CLI render output.

Rollback: remove the shell wrapper and retain the current conditional workbench dispatch. No source files require migration.

## Milestone 2: A capability opens its wireframe screens

This milestone adds the one semantic relationship missing from the approved product shape. It does not introduce generic relationships or flow-node links.

- **Change — Add typed wireframe references to overview capabilities.**
  - Add a wireframe reference with a safe `.diagram` path and optional screen ID.
  - Keep it separate from `OverviewFlowReference` because screens and flow variants have different rules.
  - Extend overview parsing, canonical formatting, materialization, cloning, and variant operations.
  - Support clearing wireframe references without changing flow references.
  - Prove parse-format-parse equality and formatter idempotence.

- **Change — Validate wireframe targets through the current document reader.**
  - Reuse `resolveDiagramPath` and `readDiagramDocument` containment checks.
  - Require `type wireframe` for a wireframe reference.
  - Validate the optional screen against the target document.
  - Keep missing files, wrong types, and removed screens as capability warnings.
  - Keep a valid overview usable when one target is unavailable.
  - Test traversal, symlink, wrong-type, missing-screen, and repair cases.

- **Change — Navigate to a screen with overview context.**
  - Add a safe URL composer for a wireframe path, optional screen, and `OverviewOrigin`.
  - Make `WireframeWorkbench` initialize from URL screen state and respond to history navigation.
  - Show the active capability context in the shared shell.
  - Preserve the wireframe's own `goto` behavior inside its document.
  - Verify that a removed screen falls back visibly instead of silently showing another proposal.

- **Change — Show flows and wireframes together in capability detail.**
  - Extend `OverviewInspector` with separate related-flow and related-screen sections.
  - Preserve stable ordering from the source.
  - Keep capabilities without either relationship useful and selectable.
  - Update the resume fixtures with one representative screen relationship.

### Desired end state

- A capability can open a specific wireframe screen inside the same workspace.
- A wireframe created before its flow needs only a capability relationship.
- Broken references produce repairable warnings without hiding valid content.
- Parser tests and a browser journey prove the complete overview-to-screen path.

Rollback: remove wireframe references from the representative fixture and ignore the optional field. Existing flow links and standalone wireframes remain valid.

## Milestone 3: The overview organizes project navigation

This milestone makes the common overview useful beyond its canvas. It derives navigation from the active overview and catalog. It does not create a project-wide relationship database.

- **Change — Build a pure navigation projection.**
  - Project the selected overview into groups, capabilities, related flows, and related wireframe screens.
  - Combine that projection with `DiagramCatalog` for all-document access.
  - Mark valid flows and wireframes not referenced by the selected overview as `Not linked here`.
  - Do not call them globally unlinked because another overview can reference them.
  - Test shared artifacts, several references, active variants, invalid files, and stable ordering.

- **Change — Add capability-centered project navigation.**
  - Keep the current overview visible as the home item.
  - Expand the selected capability to show its related screens and flows.
  - Provide small `All diagrams` and `Not linked here` sections.
  - Restore focus when navigation replaces the main renderer.
  - Make the navigator operable with keyboard and narrow-screen controls.

- **Change — Derive contextual backlinks only when context is known.**
  - Show the current overview and capability while an artifact was opened from that relationship.
  - Allow several capabilities to open the same artifact with different origin context.
  - Do not scan every overview to invent backlinks for a direct file URL.
  - Test removed relationships and direct-open behavior.

- **Change — Preserve source changes.**
  - Recompute navigation after a successful overview source refresh.
  - Keep the last valid projection while the overview is stale.
  - Clear only context that no longer exists after a valid refresh.
  - Never overwrite a flow's browser-local working copy.

### Desired end state

- A common project opens through its overview and capabilities.
- Related screens and flows are one action away.
- Every valid document remains discoverable without false semantic links.
- Source refresh updates navigation without losing the last valid workspace.

Rollback: hide the capability navigator and retain the shell's overview chooser plus all-diagram inventory.

## Milestone 4: The workspace replaces duplicate application chrome

This milestone completes the single-app experience after its relationships and navigation are proven. It removes duplication only where the evidence now supports removal.

- **Change — Consolidate stable workspace controls.**
  - Let the shell own project navigation, breadcrumbs, source path, and shared status placement.
  - Keep layout, fit, export, view, shot, reference, and reload actions with their renderers.
  - Remove the special flow return banner after the shell provides equivalent context.
  - Remove redundant `Project index` links after the navigator provides a tested replacement.
  - Do not create a configurable toolbar system.

- **Change — Preserve distinct source ownership.**
  - Label source-backed overview and wireframe content clearly.
  - Keep flow browser-local working-copy and reset status visible.
  - Preserve the current stale-source and reference-warning behavior.
  - Test refresh failures, restored local copies, source repair, and document-type changes.

- **Change — Complete interaction and accessibility verification.**
  - Verify keyboard navigation, focus restoration, readable labels, and narrow layouts.
  - Run direct pointer checks after every flow canvas container change.
  - Verify automatic layout and manual movement after shell resizing.
  - Verify native wireframe popovers, screen changes, comparisons, and embedded scenes.
  - Verify overview selection, variants, source reload, flow shelf behavior, and warnings.

- **Change — Update maintained product guidance.**
  - Record the capability-centered workspace decision in `docs/product-context.md`.
  - Update the README's entry, navigation, and source-ownership descriptions.
  - Update the maintained authoring skill before its distributed references.
  - Keep the two required DSL specification copies byte-identical.
  - State browser download limits and avoid claims of recursive project grouping.

### Desired end state

- Overview, wireframe, and flow work feel like views inside one application.
- Each renderer keeps its correct controls and state model.
- Existing source files, CLI commands, direct URLs, and render output still work.
- Unit, build, capture, and clean browser evidence support ticket completion.

Rollback: restore renderer-specific chrome while keeping the proven references and catalog behavior. No destructive data migration exists.

## Cross-cutting verification

- Use `pnpm test:overview` during workspace, reference, and navigation changes.
- Run `pnpm test:dsl` when shared catalog or document reading changes.
- Run `pnpm typecheck` and `pnpm build` before every browser gate.
- Run `pnpm flow check` against the repository fixtures after DSL changes.
- Run `pnpm flow render` for one overview, one wireframe, and one flow before completion.
- Use a clean browser session for the final overview-to-screen-to-flow journey.
- Inspect the rendered images. Successful capture alone does not prove correct layout.
- Preserve the current dirty authoring-skill changes and reconcile them before documentation edits.

## Open decisions and spikes

No decision blocks ticket creation after Byron approves this plan. If several valid overviews become common, first observe whether the chooser is sufficient. Add preferred-overview metadata only when that behavior fails.

## Below the cut line

- A universal product graph or generic relationship language.
- Project-wide backlink indexing for directly opened files.
- Flow-node-to-screen or control-level relationships.
- In-app relationship or source editing.
- Automatic relationship inference from embeds, folders, names, or content.
- A project manifest or database.
- Nested project navigation and recursive folder grouping.
- Drag-and-drop capability organization.
- Coverage scores, completeness dashboards, or lifecycle tracking.
- A general renderer registry, toolbar framework, or extension system.
