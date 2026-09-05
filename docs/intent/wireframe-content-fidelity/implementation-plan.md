---
title: "Wireframe content fidelity — implementation plan"
slug: "wireframe-content-fidelity"
phase: plan
status: current
last_updated: "2026-09-03"
---

# Wireframe content fidelity — implementation plan

## Plan at a glance

Start with the smallest visible proof: preserve explicit line breaks and render non-linked cards as static content. Then add the optional spanning footer. Finish by exposing existing screen marks through one review mode. Each milestone keeps current wireframes valid and uses the existing browser layout.

The work has no external dependency. Focused Node tests provide the fast loop. A final build and clean browser pass confirm DOM semantics, layout, navigation, and disclosure regressions.

Local ticket graph: epic `ufw-tdbj`; implementation packets `ufw-1pdf`, `ufw-zucw`, `ufw-hovp`, and `ufw-qtxm`.

## Implementation strategy

- **First proof:** Multiline text remains readable inside a non-interactive resume card.
- **Primary seam:** Existing wireframe model, parser, and renderer.
- **Fast local loop:** `node --experimental-strip-types --test src/lib/wireframe-dsl.test.ts`
- **Local dependencies:** Existing fixtures and browser viewer.
- **Provider/live confirmation:** None.
- **Rollout and rollback:** Existing sources need no migration. Reverting the extension restores current behavior.

## Milestone 1: Static resume content reads correctly

- Decode supported newline escapes in quoted wireframe copy.
- Preserve explicit line breaks when static copy renders.
- Render cards without `goto` as static containers.
- Keep linked cards as keyboard and pointer controls.
- Add focused parser and renderer proof.

### Desired end state

- Resume paragraphs and bullet lines retain authored structure.
- Static cards do not appear as disabled controls.
- Existing sources and linked-card navigation still work.

## Milestone 2: Workbench actions can span the screen

- Add an optional footer slot to the workbench frame.
- Render it across the main and inspector columns.
- Reject unknown or duplicate frame slots while changing slot parsing.
- Prove layouts with and without footer content.

### Desired end state

- A resume review can show one bottom action area across both columns.
- Existing workbench sources render unchanged.

## Milestone 3: Authored changes are visible during review

- Reuse each screen's existing target and reason marks.
- Add one review toggle for normal and annotated views.
- Highlight only valid marked targets and show their reasons.
- Keep screen navigation, popovers, references, and embedded scenes unchanged.

### Desired end state

- Byron can reveal the proposal's changed regions and reasons.
- The normal mockup remains uncluttered.

## Milestone 4: The overview lists project wireframes

- Reuse the flow inventory rules in a wireframe-specific pure projection.
- Include valid wireframes in the overview folder and valid explicit references.
- Deduplicate by source path and keep explicit capability titles and the first target screen.
- Render a `Wireframes in this project` shelf below the flow shelf.
- Keep folder-discovered rows free of invented capability context.

### Desired end state

- A project overview exposes its valid wireframe inventory.
- Explicit links retain useful navigation context.
- Nested or invalid files do not create misleading rows.

## Cross-cutting verification

- Run focused wireframe tests, `pnpm test:dsl`, `pnpm typecheck`, and `pnpm build`.
- Run `pnpm flow check` on the representative wireframe fixture.
- Inspect multiline content, static cards, footer layout, mark display, navigation, and popovers in a clean browser.
- Update current product and wireframe authoring documentation.

## Below the cut line

- Markdown, rich text, inline formatting, and arbitrary style tokens.
- Generic semantic tones.
- A second disclosure or annotation model.
- Resume-specific primitives.
