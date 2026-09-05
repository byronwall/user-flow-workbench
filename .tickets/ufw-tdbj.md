---
id: ufw-tdbj
status: closed
deps: [ufw-zucw, ufw-hovp, ufw-1pdf, ufw-qtxm]
links: []
created: 2026-09-04T02:58:20Z
type: epic
priority: 1
assignee: Byron Wall
external-ref: docs/intent/wireframe-content-fidelity/implementation-plan.md
tags: [wireframe, content-fidelity]
---
# Improve wireframe content fidelity

## Initiative Intent

Improve content-heavy wireframes without turning the DSL into a page builder. The immediate proof is the evidence-first resume website.

## Outcome

Wireframes preserve multiline static content, use correct static semantics, support one spanning footer, and expose authored change marks.

## Requirements

- Keep existing wireframe sources valid.
- Preserve screen navigation, popovers, references, embedded scenes, and source ownership.
- Use current browser layout and existing mark data.
- Update current product and authoring documentation.

## Constraints and Non-Goals

- No Markdown, rich text, arbitrary CSS, coordinates, generic tone system, new disclosure model, or resume-specific element.
- Preserve dirty user-owned work.
- Use TypeScript, TSX, SolidJS, and pnpm.
- Do not commit on main.

## Proof and Acceptance

- All three child tickets close.
- Focused tests, pnpm test:dsl, pnpm typecheck, and pnpm build pass.
- A clean browser confirms multiline copy, static cards, footer layout, mark review, navigation, and popovers.

## Provenance

- docs/intent/wireframe-content-fidelity/intent-brief.md
- docs/intent/wireframe-content-fidelity/shape-brief.md
- docs/intent/wireframe-content-fidelity/implementation-plan.md
- docs/intent/wireframe-content-fidelity/initiative-map.json


## Notes

**2026-09-04T03:42:57Z**

All four child outcomes are complete. Multiline static copy, static-card semantics, spanning footer support, authored change review, and the overview wireframe inventory passed focused tests, typecheck, build, structural checks, independent code review, and browser verification. Full test:dsl still has two pre-existing dirty-tree failures: the user-deleted resume fixture and sandbox loopback EPERM.
