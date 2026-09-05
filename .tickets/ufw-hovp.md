---
id: ufw-hovp
status: closed
deps: []
links: []
created: 2026-09-04T02:59:05Z
type: feature
priority: 1
assignee: Byron Wall
external-ref: docs/intent/wireframe-content-fidelity/implementation-plan.md#milestone-3-authored-changes-are-visible-during-review
parent: ufw-tdbj
tags: [wireframe, content-fidelity, annotations]
---
# Reveal authored wireframe change marks

## Initiative Intent

Wireframe proposals already record changed regions and reasons. Reviewers need a visible way to inspect that intent.

## Outcome

The viewer provides one optional annotated mode that highlights only authored mark targets and shows each reason.

## User and Operator Context

Byron normally reviews an uncluttered mockup. When needed, he can reveal what the proposal changes and why. Agents keep the reasons in source.

## Current System and Evidence

- WireframeScreen already stores marks with target and reason.
- src/lib/wireframe-dsl.ts already parses mark declarations.
- Current examples mark frame slots such as main and aside.
- src/components/WireframeWorkbench.tsx and src/styles.css do not display marks.
- The viewer already has local state for interaction highlighting and reference modes.

## Requirements

- Reuse existing mark data.
- Add one clear toggle for annotated review when the current screen has marks.
- Highlight marked frame slots and supported element targets.
- Show each authored reason near its target or in one concise review surface.
- Keep the normal mockup unchanged when annotation mode is off.
- Do not confuse mark review with interactive-control highlighting.
- Validate mark targets and add focused regression coverage.

## Settled Decisions

- Do not create a second annotation model.
- Marks remain screen-local and source-backed.
- The viewer owns whether marks are visible.

## Constraints and Non-Goals

- No comments, editing, persistence, collaboration, arbitrary colors, or drawing tools.
- Do not replace the interaction-highlight mode.
- Preserve navigation, popovers, references, and embedded scenes.
- Preserve unrelated dirty work.
- Use pnpm. Do not commit on main.

## Scope

Own mark target validation, rendered target identity, review state, mark presentation, focused tests, and directly related documentation.

## Known Implementation Context

Relevant files include src/types/wireframe.ts, src/lib/wireframe-dsl.ts, src/components/WireframeWorkbench.tsx, src/styles.css, src/lib/wireframe-dsl.test.ts, docs/product-context.md, and skills/author-flow-diagrams/references/wireframe-authoring.md.

## Allowed Implementation Discretion

Choose the smallest accessible presentation for reasons. Support current slot targets and direct rendered IDs. Avoid a general overlay engine.

## Edge Cases and Failure Behavior

- Screens without marks show no annotation toggle.
- Unknown or ambiguous targets fail structural validation.
- Shared part uses preserve usable rendered target identity.
- Annotation mode does not navigate or activate controls.
- Long reasons remain readable.

## Proof and Acceptance

- Parser tests reject missing mark targets.
- Browser checks show highlights and reasons for main, aside, and one element ID.
- Hiding annotations restores the normal view.
- Interaction highlighting, screen navigation, popover shots, references, and embedded scenes still work.
- Focused wireframe tests, pnpm test:dsl, pnpm typecheck, and pnpm build pass.

## Rollout and Recovery

Remove the review toggle and styles while preserving parsed marks if the presentation fails.

## Below the Cut Line

Annotation editing, comments, collaboration, arbitrary target geometry, and persisted viewer state.

## Provenance

- Initiative claim: visible-marks.
- Plan milestone: visible-marks.
- Repository baseline: cd06e7f9b4deabf30de500de0f61e807188ac06a.
- docs/intent/wireframe-content-fidelity/implementation-plan.md

## Open Questions

None.


## Notes

**2026-09-04T03:32:42Z**

Implementation complete. Existing screen marks now validate against frame slots and element identities, and the viewer has a separate Show changes mode with target outlines and reasons. Focused tests 10/10, test:overview 46/46, typecheck, build, and diff check pass. Full test:dsl retains the known sandbox and deleted-fixture failures. Independent code and browser verification remain before closure.

**2026-09-04T03:42:43Z**

Accepted. Browser verification showed Show changes only on marked screens, displayed authored reasons, highlighted main and aside with blue dashed outlines, kept orange interaction highlighting separate, and restored the normal view on Hide changes. Independent review fixes aligned empty-footer targets and actual-reference mode. Final focused tests 10/10, overview tests 46/46, typecheck, build, and diff check pass.
