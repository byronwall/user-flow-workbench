---
id: ufw-woz5
status: closed
deps: [ufw-btnh, ufw-l0qs]
links: []
created: 2026-09-08T03:34:11Z
type: task
priority: 2
assignee: Byron Wall
external-ref: docs/intent/diagram-dsl-concision#canonical-corpus
parent: ufw-xc31
tags: [dsl, docs, migration]
---
# Converge maintained DSL docs and local sources

## Initiative Intent
Make the maintained language description and repository-owned source corpus match the Narrow canonical parser and formatter.

## Outcome
The authoring skill, normative specification, repository sources, and test fixtures use one canonical form with no compatibility layer.

## Current System and Evidence
The maintained skill and product context already call unsafe paths parse errors. The normative specification incorrectly says unsafe overview paths warn. AGENTS.md requires updating the maintained authoring skill before its distributed reference and keeping docs/diagram-dsl-spec.md byte-identical to skills/author-flow-diagrams/references/flow-dsl-spec.md. Repository wireframes already state basis. sharing-disclosure has explicit default frame widths and noncanonical envelope spacing. Several tests omit basis.

## Requirements
- Start only after the application or overview and wireframe implementation tickets pass.
- Update the maintained authoring skill first.
- Synchronize both specification copies byte-for-byte.
- Document bare identifiers, quoted text and paths, the narrow escape set, explicit basis, canonical overview child references, application cardinality words, and unsafe-path errors versus safe-target warnings.
- Rewrite repository sources and tests to canonical output.
- Preserve all semantic IDs, references, variants, screens, and rendered behavior.
- Add or retain cross-type contract coverage where it belongs.

## Constraints and Non-Goals
Do not change product semantics, add migration readers, restore aliases, move production fixtures, or fix the unrelated missing resume-alignment test fixture. Do not edit external project sources; another packet owns known consumers.

## Scope
Own UFW documentation, authoring skill references, repository .diagram files, test fixture strings, and final integration checks. Preserve unrelated files.

## Edge Cases and Failure Behavior
The specification copies must remain byte-identical. Dynamic table keys must not be rewritten as fixed options. Baseline pnpm test:dsl failures must be recorded separately.

## Proof and Acceptance
Sleuth validation passes. Specification copies compare equal. UFW diagrams parse and format idempotently. pnpm test:overview, pnpm typecheck, and pnpm check:flows pass. Usable pnpm test:dsl cases do not regress.

## Rollout and Recovery
Rewrite sources only after both parser roots pass. Revert documentation and sources together with parser behavior if semantic comparison fails.

## Below the Cut Line
New grammar families, public publishing, the missing production fixture, UI changes, and external source migration.

## Provenance
Claims predictable-authoring, one-time-rewrite, keep-semantics, basis-policy, and unsafe-path-policy. Plan Milestone 3.


## Notes

**2026-09-08T04:50:36Z**

Independent final verification passed: maintained docs contain no stale quoted identifier guidance; unsafe path policy is correct; specs are byte-identical; 13 maintained diagrams check and format; focused tests 43/43; overview 74/74; typecheck, flow checks, Sleuth validation, and diff check pass.
