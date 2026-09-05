---
title: "Application Map — implementation plan"
slug: "application-map"
phase: plan
status: current
last_updated: "2026-09-04"
---

# Application Map — implementation plan

## Execution tickets

- Epic: `ufw-j4cd`
- Structural source model: `ufw-kxbr`
- Readable application viewer: `ufw-gph8`
- Typed references and project home: `ufw-60jt`
- URL state, coverage, and documentation: `ufw-4oht`

## Plan at a glance

Implement the Application Map as one read-only vertical capability. Start with the smallest real proof: a fourth `type application` document parses, formats, appears in the existing catalog, and loads through the existing diagram API. Use the evidence-first resume studio as the only representative fixture. This proves the source model without allowing the viewer to invent product semantics.

Next, render the authored page graph, object rail, and page inspector. Add direct typed links to existing overview capabilities, flow nodes, wireframe screens, and external planning documents. Then make a valid Application Map the preferred project home and preserve the existing overview and inventory fallback. Finish with URL page/state state, source refresh, warning projection, accessibility, and regression checks.

The plan deliberately avoids a universal graph, renderer registry, new API route, application variants, and in-app editing. The existing catalog and shell remain the transport and navigation seams. Every milestone leaves the current flow, overview, and wireframe documents usable.

## Implementation strategy

- **First proof:** One valid resume Application Map opens as a page graph with a selected page and inspectable typed links.
- **Primary seam:** Extend the shared diagram envelope and existing `/api/diagrams` and `/api/diagram` dispatch. Keep application semantics in their own type, parser, and workbench.
- **Fast local loop:** `pnpm test:overview` plus `pnpm flow check docs/intent/application-map/representative.diagram` once the representative fixture exists.
- **Local dependencies:** Existing TypeScript/SolidStart runtime, deterministic parser fixtures, temporary catalog roots, and the loopback viewer. No network or new package.
- **Provider/live confirmation:** None. A clean local browser pass is the required fidelity check.
- **Rollout and rollback:** Keep direct `?diagram=` routes, overview fallback, inventory fallback, and render-mode bypass. Removing application dispatch returns the project to existing document behavior without source migration.

## Milestone 1: A fourth document type is structurally usable

Prove the source model before building a viewer. The representative source may live in a test fixture or the application-map docs area; it must use only the settled semantic records and explicit references.

- **Change — Add the application domain type.**
  - Define stable application, object, ownership/cardinality, page, state, navigation, and typed-reference records in `src/types/application.ts`.
  - Keep conceptual objects separate from database fields and keep page state separate from browser UI state.
  - Model reference kinds explicitly: overview capability, flow node, wireframe screen, and planning document with optional heading.
- **Change — Add parser and formatter dispatch.**
  - Add `src/lib/application-dsl.ts` with diagnostics, canonical formatting, and parse-format-parse stability.
  - Extend `src/lib/diagram-dsl.ts` to recognize `type application` and enforce the application body header.
  - Treat absolute paths, traversal segments, ignored directories, malformed extensions, and malformed IDs as parser errors.
  - Do not add variants or a generic graph parser path.
- **Change — Extend catalog and API unions.**
  - Add application to `DIAGRAM_TYPES`, `DiagramDocument`, catalog title handling, response types, `readDiagramDocument`, and CLI check/format dispatch.
  - Reuse `/api/diagrams` and `/api/diagram`; add no endpoint.
  - Keep application cross-file target resolution out of the parser so source syntax stays deterministic.
- **Verification — Structural proof.**
  - Add parser tests for valid records, duplicate IDs, malformed paths, wrong body commands, canonical formatting, and diagnostics.
  - Add catalog/API tests for discovery, title, type dispatch, malformed source, and safe path rejection.
  - Run `pnpm test:overview`, `pnpm test:dsl`, `pnpm typecheck`, and `pnpm build`.

### Desired end state

- A valid `type application` source parses, formats, catalogs, and loads through existing APIs.
- Existing flow, overview, and wireframe sources remain valid and unchanged.
- Unsafe paths fail structurally before any target lookup.
- The application model is clear enough to support a renderer without adding hidden semantics.

## Milestone 2: The resume map reads as a product structure

Make the new type useful in the viewer with one specialized read-only renderer. Keep layout and interaction local to the application workbench.

- **Change — Add the representative resume Application Map.**
  - Include authored pages, states, objects, ownership/cardinality, and navigation from the accepted proposal.
  - Link only to actual resume studio diagrams and planning artifacts that exist in the referenced repository.
  - Label the source as representative; do not promote unsupported resume behavior into product requirements.
- **Change — Add `ApplicationWorkbench`.**
  - Render a compact page graph from explicit `nav` records.
  - Render an object rail with ownership and cardinality.
  - Render a page inspector with purpose, authored states, and grouped typed references.
  - Keep source view read-only and reuse the current source tab and panel conventions.
  - Provide direct artifact links through existing overview, flow, and wireframe URL composers where they fit; use one safe document URL shape for external planning files.
- **Verification — First visible proof.**
  - Open the resume map in a clean browser and inspect graph bounds, page selection, object rail, inspector, and direct links.
  - Confirm the flow canvas, overview selection, wireframe screen navigation, and direct diagram URLs still work.
  - Test keyboard focus and small-width layout for the new map.

### Desired end state

- The resume Application Map is a readable page-and-object home for its project.
- A selected page explains its purpose and points to the artifacts that prove it.
- The viewer does not edit source or infer relationships.
- Existing renderers remain independently usable.

## Milestone 3: Cross-file references and project-home precedence are dependable

Connect the map to the existing source-backed workspace. Introduce target resolution and home selection as separate behavior so a bad link does not make the map disappear.

- **Change — Validate typed targets through existing safe resolution.**
  - Reuse containment and symbolic-link protections from `resolveDiagramPath` for diagram targets.
  - Require `type overview`, `type flow`, or `type wireframe` as declared by each reference kind.
  - Check capability IDs, flow node IDs, wireframe screen IDs, and optional document heading targets.
  - Return non-blocking warnings for missing files, wrong types, missing IDs, and removed screens. Preserve the valid page graph.
  - Keep same-folder discovery as inventory only; do not create semantic links.
- **Change — Prefer a valid Application Map as project home.**
  - Extend `selectWorkspaceEntry` and the route dispatch to choose a valid application map first.
  - Fall back to a valid overview using current chooser behavior, then the existing project inventory.
  - Keep invalid application sources visible in the catalog as invalid files.
- **Change — Preserve context on direct links.**
  - Carry application path, page ID, and optional state through links to application pages and linked diagrams.
  - Reuse overview origin context when opening an overview capability, flow node, or wireframe screen.
  - Show a repairable stale-context notice when a page or target disappears.
- **Verification — Failure and fallback proof.**
  - Add pure tests for precedence, zero/one/many homes, target warnings, wrong types, missing IDs, and no inferred links.
  - Add browser checks for a valid map, a map with a broken reference, an invalid map with overview fallback, and a project with no valid overview.

### Desired end state

- A valid Application Map owns project-home selection.
- Cross-file problems are visible warnings, not load failures.
- Direct links retain enough context to return to the authored page.
- Existing overview and inventory fallback behavior remains intact.

## Milestone 4: URL state, refresh, coverage, and documentation close the proof

Finish the first slice with the viewer behavior that makes the map durable for agents and reviewers. Keep this as read-only state; do not add editing or persistence.

- **Change — Add page/state URL state.**
  - Add focused helpers for validated `page` and `state` parameters.
  - Update the selected page and authored state without losing the document path or unsafe-path protections.
  - Restore valid page/state selections after refresh and Back/Forward; fall back visibly when a selection no longer exists.
- **Change — Reuse source refresh.**
  - Apply the current visible/focused reload pattern to application sources.
  - Keep the last valid board when a refresh fails and mark it stale until a later refresh succeeds.
  - Keep application source exports as browser downloads and document that automated checks do not verify download destinations.
- **Change — Add coverage warnings.**
  - Warn for pages without a wireframe, flow nodes without a page, capabilities without a page, unused wireframe screens, and broken planning links.
  - Keep warnings derived from explicit authored records only. Do not score completeness or infer missing semantics.
- **Change — Update maintained documentation.**
  - Document the fourth type, safe references, warning behavior, project-home precedence, and explicit-link rule in the maintained authoring and DSL references.
  - Keep `docs/diagram-dsl-spec.md` byte-identical to its distributed reference as required by the repository guidance.
- **Verification — Final proof.**
  - Run `pnpm test:overview`, `pnpm test:dsl`, `pnpm typecheck`, `pnpm build`, and `pnpm check:flows`.
  - Run the focused CLI checks for representative source and format idempotence.
  - Perform a clean browser pass at desktop and narrow widths. Inspect page graph, object rail, inspector, warnings, refresh, page/state URL state, direct artifact links, overview fallback, and existing flow interactions.

### Desired end state

- Agents can inspect and edit a compact Application Map while detailed planning stays outside the DSL.
- Reviewers can navigate pages, states, objects, and linked artifacts from one source-backed home.
- Refresh, URL state, warnings, and fallback behavior are proven locally.
- No production editor, application variants, universal graph, new API route, or renderer abstraction was added.

## Cross-cutting verification

- Keep parser, formatter, catalog, target-resolution, navigation, and warning tests deterministic and colocated with their subsystems.
- Test direct pointer and keyboard interaction for page selection and artifact links.
- Test malformed source, unsafe paths, missing files, wrong types, missing IDs, and stale refreshes without losing the last valid board.
- Test current flow drag, pan, zoom, layout, source refresh, overview selection, and wireframe screen navigation after shell integration.

## Open decisions and spikes

- **Exact application DSL option spelling.** Decision output: one canonical grammar for page references and navigation triggers. Evidence: parser readability and format-idempotence tests. Fallback: use the smallest explicit line syntax that preserves typed targets.
- **External document target validation.** Decision output: accepted safe extensions and heading behavior. Evidence: representative resume planning links and containment tests. Fallback: validate path safety and file existence first, and treat heading lookup as a warning.

## Below the cut line

- Application variants or per-application view composition.
- Universal graph or renderer abstraction shared by all document types.
- In-app source or relationship editing.
- New API routes, persistence, database fields, tickets, requirements, or full planning-corpus import.
- Recursive project grouping or inferred folder/title relationships.
- Advanced coverage scoring, analytics, exports beyond existing source/download behavior, and production resume functionality.
