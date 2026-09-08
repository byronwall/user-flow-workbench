---
id: ufw-wjgh
status: closed
deps: []
links: []
created: 2026-09-07T22:39:11Z
type: feature
priority: 1
assignee: Byron Wall
external-ref: /Users/byronwall/Projects/evidence-first-resume-studio/docs/intent/wireframe-quality/implementation-plan.md#milestone-2-truthful-action-hierarchy
parent: ufw-b8n5
tags: [wireframe, dsl, buttons, icons]
---
# Add semantic wireframe button treatments

## Initiative Intent

Make important wireframe actions visually clear without adding a generic styling language.

## Outcome

Buttons express primary, secondary, and quiet hierarchy. Upload, dictation, and download actions use supported icons.

## User and Operator Context

Reviewers must identify the next action without reading every control. Authors need semantic action priority, not a misuse of selected state.

## Current System and Evidence

Buttons already support goto, icon, iconOnly, destructive tone, and selected or disabled state. The parser uses closed vocabularies. WIREFRAME_ICONS and the renderer glyph map lack upload, mic, and download.

## Requirements

Add optional variant=primary|secondary|quiet. Existing buttons default to secondary. Keep tone=destructive independent and define safe visual precedence. Reject unsupported variants. Add upload, mic, and download to the closed icon list, parser, renderer, and docs. Update the maintained authoring skill before mirrored DSL specifications. Preserve byte-identical maintained and distributed specs.

Use the resume acceptance fixture to mark project creation, save, approval, and PDF download as primary. Add upload, microphone, and download icons where they improve recognition.

## Settled Decisions

Extend the existing button type. Do not add upload, dictation, or download control primitives. Do not broaden destructive tone into a generic color system.

## Constraints and Non-Goals

Keep the wireframe DSL semantic, finite, and small. Preserve existing diagrams, navigation, popovers, references, embedded scenes, render mode, and source ownership. Do not add arbitrary CSS, custom classes, coordinates, free positioning, data binding, transitions, a responsive engine, a document primitive, rich text, Markdown, or production widget behavior. Use TypeScript, SolidJS, current model/parser/renderer/CSS patterns, and pnpm. Preserve user-owned changes. Do not commit on main.

## Scope

Own wireframe button types, parser validation, renderer classes and glyphs, CSS, focused tests, maintained authoring guidance, mirrored specs, and acceptance fixture updates.

## Known Implementation Context

Likely seams are src/types/wireframe.ts, src/lib/wireframe-dsl.ts, src/components/WireframeWorkbench.tsx, src/styles.css, src/lib/wireframe-dsl.test.ts, skills/author-flow-diagrams/references/wireframe-authoring.md, docs/intent/wireframe-dsl/language.md, and docs/product-context.md.

## Allowed Implementation Discretion

Choose static colors and glyph shapes consistent with the existing theme. Keep secondary output byte-for-byte or visually equivalent where practical.

## Edge Cases and Failure Behavior

Unsupported variants fail with a useful parser diagnostic. Variant and destructive tone remain distinguishable. iconOnly still requires an icon. Keyboard semantics and interaction highlighting remain unchanged.

## Proof and Acceptance

Parser tests cover all variants, default behavior, unsupported values, and new icons. Live resume input, interview, editor, and export screens show correct hierarchy. Old diagrams render unchanged. Run pnpm test:overview, pnpm test:dsl, pnpm typecheck, pnpm build, flow checks, spec parity, and clean browser checks.

## Rollout and Recovery

Remove optional variants and new icon uses. Existing sources require no migration.

## Below the Cut Line

New control primitives, arbitrary styles, paper surfaces, responsive rules, and shot overrides.

## Provenance

Plan Milestone 2; intent claims 001, 002, and 004; live resume viewer audit; current wireframe parser and renderer.

## Acceptance Criteria

Primary, secondary, and quiet variants parse and render. Existing buttons default to secondary. Destructive tone remains independent. Upload, mic, and download icons work. Unsupported values fail. Maintained and mirrored specs match. Required tests and browser checks pass.


## Notes

**2026-09-07T23:37:50Z**

Implemented finite primary, secondary, and quiet button variants plus upload, mic, and download icons. Updated parser, renderer, CSS, tests, authoring guidance, language docs, product context, and the resume acceptance fixture. pnpm test:overview passed 60 tests. Typecheck and source flow checks passed. Clean-room browser verification covered all seven screens, keyboard activation, highlights, popovers, references, and canvas modes with zero console errors or warnings. Follow-up viewer repairs fixed Escape dismissal and the seven-screen rail; a fresh desktop and 390px recheck passed. pnpm test:dsl remains at the known baseline: 55 pass, with sandbox loopback EPERM and the absent resume-alignment fixture as the only two failures.
