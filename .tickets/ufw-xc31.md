---
id: ufw-xc31
status: closed
deps: [ufw-btnh, ufw-l0qs, ufw-woz5, ufw-88vx]
links: []
created: 2026-09-08T03:32:24Z
type: epic
priority: 1
assignee: Byron Wall
external-ref: docs/intent/diagram-dsl-concision
tags: [dsl, canonicalization]
---
# Adopt the Narrow canonical Diagram DSL

## Initiative Intent
Make flow, overview, wireframe, and application sources easier to predict, edit, and repair without changing their semantic models.

## Outcome
The current Diagram DSL family uses one narrow lexical contract, real canonical wireframe formatting, synchronized documentation, and canonical known sources.

## Requirements
- Keep diagram 1 and explicit type declarations.
- Keep explicit stable IDs, braces, typed relations and references, and explicit variant operations.
- Quote human text and paths. Keep identifiers, enums, booleans, and numbers bare.
- Support only escaped quote, backslash, and newline in quoted values.
- Require every wireframe screen to state basis.
- Reject unsafe overview paths during parsing. Warn for safe missing or wrong targets.
- Remove undocumented application aliases and duplicate base overview reference forms.
- Preserve semantic ASTs through parse, format, and parse.

## Constraints and Non-Goals
No new package, shared tokenizer framework, indentation grammar, JSON or HCL source, generated IDs, arbitrary wireframe styling, permanent compatibility layer, push, or publish.

## Proof and Acceptance
All child packets close. Focused parser tests, formatter round trips, canonical corpus checks, Sleuth validation, typecheck, and available repository checks pass. Baseline-only failures from loopback sandbox restrictions and the missing production flow fixture remain separately identified.

## Provenance
- docs/intent/diagram-dsl-concision/intent-brief.md
- docs/intent/diagram-dsl-concision/shape-brief.md
- docs/intent/diagram-dsl-concision/implementation-plan.md
- docs/intent/diagram-dsl-concision/sources/chatgpt-pro-2026-09-08/diagram-dsl-concision-evaluation.txt


## Notes

**2026-09-08T04:50:37Z**

All four child tickets passed independent verification. Runtime, docs, 13 maintained sources, and 15 known consumer sources meet the Narrow canonical contract. pnpm test:dsl remains 55/57 only for documented baseline loopback EPERM and missing resume-alignment fixture.

**2026-09-08T04:52:11Z**

Final unsandboxed pnpm test:dsl result: 56/57 passed. The loopback runtime test passes outside sandbox. The sole remaining failure is the pre-existing missing src/data/flows/resume-alignment.diagram fixture.
