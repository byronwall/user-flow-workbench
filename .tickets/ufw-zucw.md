---
id: ufw-zucw
status: closed
deps: []
links: []
created: 2026-09-04T02:59:04Z
type: feature
priority: 1
assignee: Byron Wall
external-ref: docs/intent/wireframe-content-fidelity/implementation-plan.md#milestone-2-workbench-actions-can-span-the-screen
parent: ufw-tdbj
tags: [wireframe, content-fidelity, layout]
---
# Add a spanning workbench footer

## Initiative Intent

Content-heavy workbench screens need one bottom action area that spans the main content and inspector.

## Outcome

A workbench frame accepts an optional footer slot and renders it across both columns. Frames without a footer keep their current layout.

## User and Operator Context

The resume draft review uses a persistent bottom action bar for final decisions. The current wireframe places that action inside one column and misrepresents the page structure.

## Current System and Evidence

- src/types/wireframe.ts defines header, top, main, and aside slots.
- src/lib/wireframe-dsl.ts collects frame slots without rejecting unknown or duplicate names.
- src/components/WireframeWorkbench.tsx renders the four current regions.
- src/styles.css defines a two-column, three-row workbench grid.
- The working tree has user-owned changes in these files.

## Requirements

- Add an optional footer slot to workbench frames.
- Render the footer across both workbench columns.
- Keep main and aside scrolling behavior.
- Keep frames without footer content visually unchanged.
- Reject unknown and duplicate frame slots while changing slot parsing.
- Update focused tests and current authoring documentation.

## Settled Decisions

- The footer is a frame slot, not a new element.
- It spans both columns.
- Existing source needs no migration.

## Constraints and Non-Goals

- Do not add arbitrary grid areas, coordinates, sticky configuration, or a layout framework.
- Do not change page frames.
- Preserve unrelated dirty work.
- Use pnpm. Do not commit on main.

## Scope

Own the workbench frame type, slot validation, footer renderer and CSS, focused tests, and directly related documentation.

## Known Implementation Context

Relevant files include src/types/wireframe.ts, src/lib/wireframe-dsl.ts, src/components/WireframeWorkbench.tsx, src/styles.css, src/lib/wireframe-dsl.test.ts, docs/product-context.md, and skills/author-flow-diagrams/references/wireframe-authoring.md.

## Allowed Implementation Discretion

Choose optional or empty-array representation based on the smallest compatible implementation. Keep the source syntax consistent with existing slots.

## Edge Cases and Failure Behavior

- Unknown workbench and page slots fail with a useful diagnostic.
- Duplicate slots fail instead of silently replacing content.
- Empty or absent footer content does not create visible space.
- Footer content remains readable at the declared viewport.

## Proof and Acceptance

- Parser tests cover footer, absent footer, unknown slots, and duplicate slots.
- Browser layout proves the footer spans both columns.
- Existing workbench fixtures keep current bounds without a footer.
- Focused wireframe tests, pnpm test:dsl, pnpm typecheck, and pnpm build pass.

## Rollout and Recovery

Remove the optional footer slot if layout verification fails. Existing sources remain valid.

## Below the Cut Line

Arbitrary workbench areas, sticky options, responsive layout controls, and page-frame footers.

## Provenance

- Initiative claim: spanning-actions.
- Plan milestone: spanning-footer.
- Repository baseline: cd06e7f9b4deabf30de500de0f61e807188ac06a.
- docs/intent/wireframe-content-fidelity/implementation-plan.md

## Open Questions

None.


## Notes

**2026-09-04T03:13:19Z**

Implementation complete. Optional spanning footer, strict frame slot validation, required workbench regions, tests, and docs are in place. Focused tests 9/9, typecheck, build, and representative flow check pass. Full test:dsl reaches 51/53 with the known sandbox and deleted-fixture failures. Browser verification remains before closure.

**2026-09-04T03:42:43Z**

Accepted. Browser geometry confirmed the footer spans the complete 1100px wireframe below the 780px main and 320px aside. The viewer uses its own scroll surface when the declared 700px wireframe plus viewer chrome exceeds a 720px browser window. Final parser, type, build, flow, and diff checks pass.
