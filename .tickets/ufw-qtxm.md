---
id: ufw-qtxm
status: closed
deps: []
links: []
created: 2026-09-04T03:12:42Z
type: feature
priority: 1
assignee: Byron Wall
external-ref: docs/intent/wireframe-content-fidelity/implementation-plan.md#milestone-4-the-overview-lists-project-wireframes
parent: ufw-tdbj
tags: [overview, wireframe, inventory]
---
# List project wireframes on the overview

## Initiative Intent

A project overview must expose the project wireframes as clearly as it exposes project flows. Folder discovery is inventory only and must not create semantic capability links.

## Outcome

A Wireframes in this project shelf appears directly below the current flow shelf. It lists valid same-folder wireframes and valid explicitly linked wireframes.

## User and Operator Context

Byron opens the overview as the project home. He can already see flows there. Wireframes are visible through other navigation paths, but the overview has no complete wireframe inventory.

## Current System and Evidence

- src/components/OverviewWorkbench.tsx renders only a Flows in this project shelf.
- src/server/flow-catalog.ts already supplies recursive diagram path, type, title, validity, and diagnostics.
- src/types/overview.ts already stores ordered wireframeRefs with optional screen IDs.
- src/lib/overview-navigation.ts already composes safe wireframe URLs.
- src/lib/overview-flow-inventory.ts already defines same-folder plus explicit-reference inventory semantics.
- pnpm test:overview passes 42 tests before this change.
- The working tree contains user-owned changes in OverviewWorkbench, styles, docs, package.json, and the tracker.

## Requirements

- Add a pure overviewWireframeInventory projection with focused tests.
- Include valid wireframe files in the exact overview folder.
- Include valid explicitly referenced wireframes from the active materialized view.
- Deduplicate by source path.
- Aggregate linked capability titles.
- Preserve the first explicit reference screen for one document row.
- Render Wireframes in this project directly below Flows in this project.
- Use Project wireframe for folder-only rows.
- Show a clear empty message when no valid wireframes exist.
- Preserve overview, capability, active-view, and screen context for explicit links.
- Do not attach capability context to folder-discovered rows.

## Settled Decisions

- Reuse the current catalog and flow inventory semantics.
- Do not change the server or diagram source model.
- Nested folders are excluded unless explicitly referenced.
- Invalid, missing, wrong-type, and unsafe references do not produce inventory rows.
- Existing reference warnings remain in the inspector.

## Constraints and Non-Goals

- Same-folder discovery does not create a semantic link.
- Do not add recursive folder projects, backlinks, inference, or a generic artifact shelf framework.
- Reuse current presentation classes where practical.
- Preserve dirty user-owned work.
- Use TypeScript, TSX, SolidJS, and pnpm.
- Do not commit on main.

## Scope

Own the wireframe inventory projection, focused tests, the overview shelf, and directly related product documentation. No wireframe renderer or DSL changes are required.

## Known Implementation Context

Relevant files include src/lib/overview-flow-inventory.ts, a sibling inventory module or the smallest equivalent, existing overview inventory tests, src/components/OverviewWorkbench.tsx, README.md, docs/product-context.md, and package.json only if a new test file needs script inclusion.

## Allowed Implementation Discretion

Choose a sibling pure function or a minimal typed generalization. Prefer the smaller diff. Keep user-facing list structure consistent with the flow shelf.

## Edge Cases and Failure Behavior

- Empty inventory still shows the shelf and empty message.
- Several capabilities linking one wireframe create one row with all capability titles.
- Several screen links use the first explicit screen for the document row.
- Active variants change the linked inventory.
- A stale refresh keeps the last valid shelf.
- Folder-only rows contain no invented origin context.
- Invalid files remain available through existing diagnostics, not this shelf.

## Proof and Acceptance

- Pure tests cover same-folder, explicit external, deduplication, multiple capabilities, screen selection, nested exclusion, invalid targets, and stable order.
- The overview browser shows the wireframe shelf below the flow shelf.
- Explicit rows navigate to the intended screen with capability context.
- Folder-only rows navigate without invented capability context.
- Empty state copy is readable.
- pnpm test:overview, pnpm test:dsl, pnpm typecheck, and pnpm build pass.
- Existing flow shelf behavior remains unchanged.

## Rollout and Recovery

Remove the sibling shelf and projection if browser verification fails. Catalog and overview source semantics remain unchanged.

## Below the Cut Line

Generic artifact inventory framework, inferred relationships, recursive project groups, reverse backlinks, and server changes.

## Provenance

- Initiative claim: wireframe-inventory.
- Plan milestone: wireframe-inventory.
- Repository baseline: cd06e7f9b4deabf30de500de0f61e807188ac06a.
- docs/intent/wireframe-content-fidelity/implementation-plan.md

## Open Questions

None.


## Notes

**2026-09-04T03:16:52Z**

Implementation complete. Added pure wireframe inventory projection, tests, and overview shelf below flows. Same-folder rows remain inventory-only; explicit rows preserve capability, view, and first-screen context. test:overview 45/45, typecheck, and build pass. Full test:dsl has only the known sandbox and deleted-fixture failures. Browser verification remains before closure.

**2026-09-04T03:42:43Z**

Accepted. Independent tests and browser verification showed Flows in this project followed by Wireframes in this project, two understandable wireframe rows, inventory-only Project wireframe labels, correct navigation, and safe browser Back. test:overview 46/46, typecheck, build, and diff check pass.
