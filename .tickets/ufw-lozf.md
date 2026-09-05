---
id: ufw-lozf
status: closed
deps: []
links: []
created: 2026-09-03T03:25:45Z
type: feature
priority: 1
assignee: Byron Wall
external-ref: docs/intent/unified-product-workspace/implementation-plan.md#milestone-1-one-shell-preserves-overview-and-flow-context
parent: ufw-jtsp
tags: [unified-workspace, workspace-shell]
---
# Keep overview and flow context in one shell

## Initiative Intent

Make overview, wireframe, and flow documents feel like connected views inside one application. An overview is the normal project home. Capabilities provide the context for related screens and flows.

## Outcome

The resume overview and its existing linked flow work inside one persistent project shell. The user can navigate, refresh, and use browser history without losing valid capability context.

## User and Operator Context

Byron reviews agent-authored `.diagram` files through the local workbench. He should always know the project, selected capability, and current artifact. Agents continue to edit source files outside the browser.

## Current System and Evidence

- `src/routes/index.tsx` loads the catalog and selected document. It dispatches three full-page workbench components.
- `/api/diagrams` and `/api/diagram` already serve every declared diagram type.
- `OverviewOrigin`, `composeFlowUrl`, and `composeOverviewUrl` already preserve overview, capability, and view context.
- `Workbench` owns flow layout, interaction, variants, and browser-local working-copy state.
- `OverviewWorkbench` owns source refresh and its last-valid stale state.
- `WireframeWorkbench` owns screen, shot, reference, and display state.
- Render mode already isolates CLI capture behavior.

## Requirements

- Load the diagram catalog for inventory and selected-document routes.
- Keep current conditional document dispatch. Do not add a renderer registry.
- Place the active renderer inside one persistent workspace shell.
- Let the shell own project name, source path, project navigation, and overview-origin context.
- Keep the selected document and view addressable in the URL.
- Open the only valid overview when no document is selected.
- Show an overview chooser when several valid overviews exist.
- Show the current inventory when no valid overview exists.
- Keep invalid files visible with diagnostic counts.
- Preserve the selected capability and overview variant through Back, Forward, and refresh.
- Show a clear notice when a capability or overview view no longer exists.
- Bypass normal workspace chrome when `render=1`.

## Settled Decisions

- This ticket changes no diagram syntax.
- The existing catalog remains the project inventory.
- The folder remains the project boundary.
- Direct `?diagram=` URLs remain supported.
- Renderer-specific state remains with its current owner.
- The inventory fallback stays available until the complete workspace passes.

## Constraints and Non-Goals

- Do not merge the three workbench state models.
- Do not create a universal product graph or project manifest.
- Do not select a default overview by filename or folder depth.
- Do not change flow persistence while moving page chrome.
- Do not add a configurable toolbar or generic renderer interface.
- Do not alter source files or browser-local working copies during navigation.

## Dependencies and Coordination

This is the first ready implementation ticket. It has no implementation prerequisite. Later workspace tickets depend on its shell and context behavior.

Preserve unrelated changes in `skills/author-flow-diagrams`. Work on `main` must not receive a routine progress commit unless Byron requests one.

## Scope

- Adapt `Home` into the workspace controller.
- Add the minimum persistent shell.
- Add pure entry-selection behavior for zero, one, and several valid overviews.
- Reuse current overview-to-flow URL context.
- Preserve the current renderer lifecycles and render-mode path.

## Known Implementation Context

- The first proof uses `src/data/overviews/resume-app.diagram` and its existing flow reference.
- `Home` already listens for `popstate` and reads `diagram` or legacy `flow` query values.
- `loadFlowReturnContext` already validates stale overview context.
- The flow canvas can fail when its container or event path changes. Direct pointer checks are required.

## Allowed Implementation Discretion

- Choose the smallest component boundary for the shell.
- Choose compact shell markup and styling that preserve the current canvas area.
- Choose whether history changes use route helpers or the current browser APIs.
- Add pure helpers only when they remove repeated route or selection logic.

## Edge Cases and Failure Behavior

- Zero, one, and several valid overviews.
- Invalid overviews remain visible but never become an automatic home.
- Unsafe diagram paths and identifiers remain rejected.
- Removed capabilities and variants produce clear stale-context notices.
- Direct flow, overview, and wireframe URLs work without an overview origin.
- A linked flow with a browser-local copy keeps that copy and its reset action.
- Render mode never captures the workspace navigator or relies on stored state.
- A failed catalog or document load keeps a useful retry or inventory path.

## Proof and Acceptance

- `pnpm test:overview` covers entry selection and context URL behavior.
- Existing navigation safety tests continue to pass.
- `pnpm typecheck` and `pnpm build` pass.
- Direct URLs load all three document types.
- The resume overview opens its linked flow inside the same shell.
- Back, Forward, and refresh restore valid overview and capability context.
- The flow supports selection, drag, pan, trackpad zoom, layout, variant changes, and reset.
- `pnpm flow render` produces isolated flow, overview, and wireframe output without workspace chrome.

## Rollout and Recovery

Keep direct document URLs, the inventory fallback, and render-mode bypass throughout the work. If the shell harms flow interaction, remove the wrapper and keep the current conditional dispatch.

## Below the Cut Line

- Capability-to-wireframe references.
- Capability tree navigation and `Not linked here` inventory.
- Project-wide backlinks.
- Universal graph or generic relationship model.
- Project manifest, database, or nested project grouping.
- Final removal of all duplicate renderer chrome.

## Provenance

- Initiative claims: `coherent-workspace`, `overview-home`, `capability-context`, `typed-models`, `standalone-artifacts`, `no-universal-graph`.
- Selected shape: capability-centered workspace with typed artifacts.
- Plan milestone: `workspace-shell`.
- Repository baseline: `11553125b622e502a7133f07c966484df850d46b`.
- `docs/intent/unified-product-workspace/implementation-plan.md`

## Open Questions

None. The overview chooser is the approved fallback when several overviews exist. Preferred-overview metadata remains deferred.

## Notes

**2026-09-03T04:01:27Z**

Implemented persistent workspace shell, valid-overview entry selection, inventory fallback, URL-backed capability history, stale origin notices, render-mode chrome isolation, and wireframe readiness signaling. Evidence: pnpm test:overview (30/30), pnpm test:dsl (50/50), pnpm typecheck, pnpm build, pnpm flow check (6 files), clean browser Back/Forward/refresh with matching capability context and no console errors, render=1 header hidden, and full CLI batch report at /private/tmp/ufw-lozf-render-final/report.json with all 5 diagrams successful.
