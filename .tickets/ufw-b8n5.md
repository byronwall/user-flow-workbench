---
id: ufw-b8n5
status: closed
deps: [ufw-n6c4, ufw-wjgh, ufw-chyl, ufw-w0zk]
links: []
created: 2026-09-07T22:39:05Z
type: epic
priority: 1
assignee: Byron Wall
external-ref: /Users/byronwall/Projects/evidence-first-resume-studio/docs/intent/wireframe-quality/implementation-plan.md
tags: [wireframe, dsl, viewer]
---
# Improve wireframe viewing truth and action semantics

## Initiative Intent

Improve wireframe truth without turning the DSL into a general UI builder.

## Outcome

The viewer starts each screen predictably, workbench sizing is inspectable, and actions use truthful visual hierarchy. Richer screen states are added only if a bounded syntax is clearer than explicit screens.

## User and Operator Context

Agents author .diagram files. Byron reviews rendered flows and compares proposed screens with live evidence. The resume project wireframes are the current acceptance example.

## Current System and Evidence

The model, parser, renderer, CSS, and authoring skill already support page and workbench frames, closed control vocabularies, references, marks, popovers, and disclosure shots. Live review found stale inner scroll, page-only fit controls, no semantic primary button, and no upload, microphone, or download icons.

## Settled Decisions

Renderer corrections come first. Button hierarchy extends the existing button. Destructive tone remains independent. Shot overrides remain a decision spike. Existing diagrams need no migration.

## Constraints and Non-Goals

Keep the wireframe DSL semantic, finite, and small. Preserve existing diagrams, navigation, popovers, references, embedded scenes, render mode, and source ownership. Do not add arbitrary CSS, custom classes, coordinates, free positioning, data binding, transitions, a responsive engine, a document primitive, rich text, Markdown, or production widget behavior. Use TypeScript, SolidJS, current model/parser/renderer/CSS patterns, and pnpm. Preserve user-owned changes. Do not commit on main.

## Dependencies and Coordination

Children 1 and 2 are independent in product logic but touch the same renderer and CSS. Execute them serially. The state decision follows the simple control improvements.

## Proof and Acceptance

All required children close. Focused tests, full project checks, and clean browser verification pass. The resume diagrams remain valid and useful.

## Rollout and Recovery

Every syntax field is optional. Each slice can be reverted without migrating existing sources.

## Below the Cut Line

Paper primitives, per-breakpoint layout, arbitrary styling, general property patching, data binding, transitions, and production widget behavior.

## Provenance

/Users/byronwall/Projects/evidence-first-resume-studio/docs/intent/wireframe-quality/intent-brief.md
/Users/byronwall/Projects/evidence-first-resume-studio/docs/intent/wireframe-quality/shape-brief.md
/Users/byronwall/Projects/evidence-first-resume-studio/docs/intent/wireframe-quality/implementation-plan.md

## Acceptance Criteria

Every required child ticket is closed. Existing wireframes remain valid. Focused tests, typecheck, build, flow checks, and clean browser verification pass.


## Notes

**2026-09-08T00:19:08Z**

All four child tickets are closed. Delivered navigation scroll reset, workbench fit controls, semantic button variants, upload/mic/download icons, Navigate Escape dismissal, readable seven-screen navigation, and bounded shot value/state overlays. Updated the resume acceptance fixture, maintained authoring skill, installed global flow package, audit, and plan. Clean browser evidence passed for desktop, 390px viewer controls, all seven screens, references, popovers, shots, keyboard actions, and zero coverage or console warnings. Known unrelated test:dsl baseline remains: sandbox listen EPERM and missing resume-alignment fixture.
