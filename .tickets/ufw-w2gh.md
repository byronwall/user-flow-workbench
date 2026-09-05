---
id: ufw-w2gh
status: closed
deps: [ufw-lozf]
links: []
created: 2026-09-03T03:25:45Z
type: feature
priority: 2
assignee: Byron Wall
external-ref: docs/intent/unified-product-workspace/implementation-plan.md#milestone-2-a-capability-opens-its-wireframe-screens
parent: ufw-jtsp
tags: [unified-workspace, wireframe-links]
---
# Open wireframe screens from capabilities

## Initiative Intent

Capabilities should connect product scope to proposed screens and operational flows. A wireframe can exist before a related flow. Keep wireframe and flow references typed because their target semantics differ.

## Outcome

A capability opens a validated wireframe document and optional screen inside the shared workspace. Overview and capability context remain visible throughout the journey.

## User and Operator Context

Byron often creates a wireframe while reducing an idea. The flow may not exist yet. The capability relationship must therefore be useful by itself and remain easy for an agent to author.

## Current System and Evidence

- `OverviewCapability` currently stores ordered `flowRefs` only.
- `src/lib/overview-dsl.ts` parses, formats, clones, and materializes flow references and overview variants.
- `resolveOverviewReferences` uses the secure document reader and reports repairable warnings.
- `WireframeDocument` contains stable screen IDs.
- `WireframeWorkbench` starts from its first screen and writes later navigation to the URL hash.
- The shared document reader already rejects traversal, absolute paths, symbolic links, and wrong file extensions.

## Requirements

- Add a typed capability-to-wireframe reference.
- Require a safe relative `.diagram` path.
- Allow an optional stable wireframe screen ID.
- Keep wireframe references separate from `OverviewFlowReference`.
- Preserve source order for several wireframe references.
- Extend overview parsing, canonical formatting, cloning, materialization, and variant operations.
- Allow wireframe references to be cleared without changing flow references.
- Resolve targets through the current secure document reader.
- Require a `type wireframe` target.
- Validate the optional screen ID against the target document.
- Report missing files, wrong types, and removed screens as capability warnings.
- Keep a valid overview usable when one reference fails.
- Add a safe URL composer for wireframe path, optional screen, and `OverviewOrigin`.
- Initialize wireframe screen state from the URL and respond to history navigation.
- Show related flows and wireframe screens as separate capability sections.
- Keep capabilities without relationships useful and selectable.

## Settled Decisions

- Do not replace typed references with a generic relationship language.
- Do not infer a semantic relationship from a wireframe embed or folder location.
- Do not require a related flow before a capability can open a wireframe.
- Several capabilities can reference the same wireframe screen.
- One capability can reference several flows and screens.
- Broken references warn and remain repairable. They do not hide valid overview content.

## Constraints and Non-Goals

- Do not add flow-node-to-screen or control-level relationships.
- Do not add project-wide backlinks.
- Do not add in-app relationship editing.
- Do not add a project manifest, relationship database, or automatic inference.
- Preserve existing flow reference syntax and behavior.
- Preserve wireframe `goto`, shots, popovers, comparison, and embedded diagrams.

## Dependencies and Coordination

Depends on `ufw-lozf`. The shared shell must already own overview-origin context and direct document routing.

This ticket changes the overview DSL and maintained authoring guidance. Preserve unrelated current edits under `skills/author-flow-diagrams` and reconcile before changing those files.

## Scope

- Extend overview types and DSL behavior with typed wireframe references.
- Extend server-side reference validation and warning output.
- Add wireframe destination and origin URL behavior.
- Show related screens in capability detail.
- Add one representative resume capability-to-screen relationship.

## Known Implementation Context

- Follow the current `flow` reference approach where its contract matches.
- Reuse `resolveDiagramPath` and `readDiagramDocument` safety checks.
- The overview variant model can add, set, and unset capability properties. Wireframe references must behave consistently there.
- The wireframe screen ID is the stable destination. It must not depend on screen order.

## Allowed Implementation Discretion

- Choose concise DSL keywords that match existing overview conventions.
- Choose whether the base-document target omits the screen field or uses an explicit default.
- Choose diagnostic codes and internal helper boundaries within current parser conventions.
- Choose URL parameter names that remain validated and browser-addressable.

## Edge Cases and Failure Behavior

- Missing file, wrong declared type, unsafe path, symlink component, and ignored directory.
- Missing or removed screen ID.
- Direct wireframe open without overview context.
- Several capabilities reference the same document or screen.
- One capability references several screens in one document.
- A variant adds, replaces, or removes wireframe references.
- A selected screen disappears after source changes.
- A repaired target becomes available without requiring a new overview document.
- Invalid wireframe references do not erase valid flow links.

## Proof and Acceptance

- Overview parse-format-parse equality and formatter idempotence pass.
- Tests cover base and variant wireframe references, clearing, and stable source order.
- Catalog tests cover safe targets, wrong types, missing screens, traversal, symlinks, and repair.
- `pnpm test:overview`, `pnpm test:dsl`, `pnpm typecheck`, and `pnpm build` pass.
- A resume capability lists at least one related screen and its existing related flow.
- Opening the screen preserves overview, capability, overview view, and screen context.
- Back, Forward, refresh, and direct wireframe URLs produce clear, stable states.
- Existing wireframe screen navigation, popovers, comparisons, and embedded scenes still work.

## Rollout and Recovery

Keep wireframe references optional. Existing overview and wireframe documents remain valid. If the screen journey fails, remove the representative reference and ignore the optional capability field. Flow links remain unchanged.

## Below the Cut Line

- Universal relationship schema.
- Direct flow-to-wireframe ownership.
- Flow-node-to-screen and control-level links.
- Reverse relationship registry for direct opens.
- In-app relationship editing or source writes.
- Automatic relationship inference from embeds or filenames.

## Provenance

- Initiative claims: `capability-context`, `wireframe-sequence`, `typed-models`, `explicit-links`, `standalone-artifacts`, `no-universal-graph`.
- Selected shape: typed capability references inside the shared workspace.
- Plan milestone: `wireframe-links`.
- Repository baseline: `11553125b622e502a7133f07c966484df850d46b`.
- `docs/intent/unified-product-workspace/implementation-plan.md`

## Open Questions

None. Exact keyword and URL parameter names remain implementation discretion within existing conventions.

## Notes

**2026-09-03T04:27:06Z**

Implemented typed wireframe refs with optional stable screen IDs, parser/formatter/materialization/variant support, secure target and screen validation, URL/history navigation, visible invalid-screen fallback, separate capability sections, representative resume link, and maintained DSL guidance. Evidence: pnpm test:overview (33/33), pnpm test:dsl (51/51), pnpm typecheck, pnpm build, pnpm flow check src/data (5 files), overview format check, byte-identical spec copies, independent code review approved, and clean browser checks for related flow/screen sections, overview context, Back/Forward/refresh, invalid-screen normalization, direct wireframes, embedded scenes, responsive layout, focus, and zero console errors.
