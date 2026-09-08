---
id: ufw-chyl
status: closed
deps: [ufw-wjgh]
links: []
created: 2026-09-07T22:39:14Z
type: task
priority: 2
assignee: Byron Wall
external-ref: /Users/byronwall/Projects/evidence-first-resume-studio/docs/intent/wireframe-quality/implementation-plan.md#milestone-3-one-bounded-screen-state-proof
parent: ufw-b8n5
tags: [wireframe, dsl, spike]
---
# Decide whether shots need bounded state overrides

## Initiative Intent

Decide whether richer screen-state evidence merits new DSL syntax.

## Outcome

A source comparison either selects one bounded value/state override syntax or records that explicit screens remain clearer.

## User and Operator Context

Authors sometimes need empty, answered, validation, loading, or disabled states. The current shot model intentionally covers only hover and popover disclosure.

## Current System and Evidence

WireframeShot contains only hoverId and openPopoverId. The parser has no override grammar. The evidence interview supplies a concrete comparison: empty answer with disabled save, and answered state with normal save.

## Requirements

Compare two explicit screens with one candidate shot-block form. The candidate may override only existing value and state properties on stable IDs. Compare source length, readability, validation clarity, and renderer complexity. Do not implement syntax during this ticket.

## Settled Decisions

This is a decision spike. If duplication is clearer, keep the current shot contract and close as deferred. If bounded shots clearly win, create one separate implementation ticket with exact grammar, compatible targets, rejection rules, and acceptance fixtures.

## Constraints and Non-Goals

Keep the wireframe DSL semantic, finite, and small. Preserve existing diagrams, navigation, popovers, references, embedded scenes, render mode, and source ownership. Do not add arbitrary CSS, custom classes, coordinates, free positioning, data binding, transitions, a responsive engine, a document primitive, rich text, Markdown, or production widget behavior. Use TypeScript, SolidJS, current model/parser/renderer/CSS patterns, and pnpm. Preserve user-owned changes. Do not commit on main. Do not create a general property-patch language or arbitrary element replacement.

## Scope

Own one small source comparison, decision record, and any follow-up ticket definition. Do not edit production parser or renderer code.

## Allowed Implementation Discretion

Choose the smallest representative comparison text and scoring method. A simple table is sufficient.

## Edge Cases and Failure Behavior

The candidate must address unknown and duplicate targets, incompatible properties, current simple shots, and elements without value or state fields.

## Proof and Acceptance

Record both source forms, a clear decision rule, the selected fallback, and why. If syntax is accepted, create a self-contained implementation ticket. If rejected, create no implementation work.

## Rollout and Recovery

No runtime change occurs. Retain hover and popover shots by default.

## Below the Cut Line

Arbitrary property patches, element replacement, style overrides, transitions, and general responsive state.

## Provenance

Plan Milestone 3; intent claims 002 and 005; current WireframeShot contract and authoring guidance.

## Acceptance Criteria

The ticket records both source forms, a decision rule, and a clear result. Accepted syntax creates one separate self-contained implementation ticket. Rejected syntax leaves current hover and popover shots unchanged and creates no speculative work.


## Notes

**2026-09-07T23:37:50Z**

Compared duplicate screens with a bounded shot block for empty versus answered interview states. Separate screens scored clarity 8, renderer simplicity 10, validation simplicity 9, reuse 3. Bounded shots scored clarity 9, renderer simplicity 5, validation simplicity 6, reuse 9. Accepted only set <id> value="..." and set <id> state=... because four authored lines replace about 47 duplicated lines while keeping transient states out of navigation. Preserve rest, hover, and open syntax. Reject unknown or duplicate targets, incompatible properties, and invalid states. Apply immutable render overlays. Also cover value="" parsing. Created implementation ticket ufw-w0zk. Revisit broader overrides only after two real diagrams need properties outside value/state, element replacement, or layout/copy changes.
