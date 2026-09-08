---
id: ufw-n6c4
status: closed
deps: []
links: []
created: 2026-09-07T22:39:09Z
type: bug
priority: 1
assignee: Byron Wall
external-ref: /Users/byronwall/Projects/evidence-first-resume-studio/docs/intent/wireframe-quality/implementation-plan.md#milestone-1-predictable-workbench-viewing
parent: ufw-b8n5
tags: [wireframe, viewer, layout]
---
# Correct workbench navigation and fit controls

## Initiative Intent

Make wireframe review predictable before changing diagram syntax.

## Outcome

Every selected screen opens at the top. Page and workbench frames both offer clear content-fit and full-viewport modes.

## User and Operator Context

A reviewer may scroll one workbench screen and then use a toolbar tab or authored goto action. The next screen must not inherit the prior inner position.

## Current System and Evidence

WireframeWorkbench resets shot and review state when screenId changes but does not reset the shared wireframe viewport. Page-only guards currently control measurement, auto height, and sizing controls. Workbench main and aside regions scroll independently and must retain that behavior in full-viewport mode.

## Requirements

Reset viewport scrollTop and scrollLeft after the keyed screen is replaced. Cover direct URL, toolbar, and goto navigation. Reuse current sizing controls and measurement flow for workbench frames. Content fit must show natural workbench content. Full viewport must preserve fixed bounds, the spanning footer, and independent main/aside scrolling.

## Settled Decisions

This ticket changes no DSL syntax. It reuses the current displayMode and measurement path.

## Constraints and Non-Goals

Keep the wireframe DSL semantic, finite, and small. Preserve existing diagrams, navigation, popovers, references, embedded scenes, render mode, and source ownership. Do not add arbitrary CSS, custom classes, coordinates, free positioning, data binding, transitions, a responsive engine, a document primitive, rich text, Markdown, or production widget behavior. Use TypeScript, SolidJS, current model/parser/renderer/CSS patterns, and pnpm. Preserve user-owned changes. Do not commit on main.

## Scope

Own the viewer navigation reset, workbench sizing behavior, focused tests, and directly required documentation. Likely seams are src/components/WireframeWorkbench.tsx and src/styles.css.

## Allowed Implementation Discretion

Choose the smallest effect timing and CSS mode that resets after DOM replacement and keeps embedded scenes measurable.

## Edge Cases and Failure Behavior

Reference-only mode, compare mode, footer frames, popovers, embedded diagrams, browser history, and direct screen URLs must remain usable. Content fit must not trap content in zero-height grid rows.

## Proof and Acceptance

Use a fixture with a tall workbench. Scroll it, navigate by toolbar and goto, and confirm the next screen starts at top. Verify both sizing modes, footer spanning, independent full-viewport scrolling, references, and existing page sizing. Run pnpm test:overview, pnpm test:dsl, pnpm typecheck, pnpm build, and flow checks.

## Rollout and Recovery

Revert the viewer-only change. No source migration is required.

## Below the Cut Line

All syntax changes and visual button treatment work.

## Provenance

Plan Milestone 1; intent claims 001 and 003; live resume viewer audit; current WireframeWorkbench and styles.

## Acceptance Criteria

All screen entry paths reset the shared viewport to top-left. Workbench content-fit and full-viewport modes render correctly. Existing frame, navigation, reference, popover, footer, embedded scene, and render-mode behavior remains valid. Required tests and browser checks pass.


## Notes

**2026-09-07T23:04:11Z**

Implemented viewer-only scroll reset and workbench sizing. Focused tests, pnpm test:overview, pnpm typecheck, pnpm build, flow checks, and git diff check passed. pnpm test:dsl retains two baseline environment/fixture failures: loopback EPERM and missing src/data/flows/resume-alignment.diagram. Independent fresh-context browser verification passed toolbar navigation, authored goto, direct URL, browser history, page/workbench sizing controls, and zero console errors. Evidence: /Users/byronwall/Projects/evidence-first-resume-studio/tmp/evals/wireframe-viewer-verification/verification-report.md.
