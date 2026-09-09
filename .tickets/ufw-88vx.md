---
id: ufw-88vx
status: closed
deps: [ufw-btnh, ufw-l0qs]
links: []
created: 2026-09-08T03:34:41Z
type: task
priority: 2
assignee: Byron Wall
external-ref: docs/intent/diagram-dsl-concision#known-corpus
parent: ufw-xc31
tags: [dsl, migration, consumers]
---
# Migrate known local consumer diagrams

## Initiative Intent
Keep every known local Diagram DSL consumer valid after the Narrow canonical parser becomes authoritative.

## Outcome
Fifteen diagrams in evidence-first-resume-studio, family-finances, and soccer-schedule parse under the new rules and use canonical output where edits are required.

## Current System and Evidence
Evidence-first-resume-studio has five diagrams and dirty unrelated documentation plus untracked diagram and intent files. resume-app.diagram has 15 quoted screen identifiers and 3 quoted variant identifiers. evidence-library.diagram and resume-workbench.diagram state theme default. Family-finances has one diagram and unrelated dirty intent or ticket state; its transaction diagram states page content 720. Soccer-schedule is clean and its nine flows need verification but no known rewrite.

## Requirements
- Start only after the application or overview and wireframe implementation tickets pass.
- Make targeted edits only in known .diagram source files.
- Convert quoted screen and variant identifiers in resume-app.diagram to bare values.
- Remove stable wireframe defaults only when the new formatter proves semantic equality.
- Preserve explicit basis, IDs, references, application targets, and all graph meaning.
- Run the UFW CLI against all 15 sources after migration.
- Run each external repository native check when available.

## Constraints and Non-Goals
Do not stage, modify, or clean unrelated dirty files. Do not create tickets in external repositories. Do not change application code in those projects. Do not push or publish.

## Scope
Own only the known diagram files under /Users/byronwall/Projects/evidence-first-resume-studio/diagrams, /Users/byronwall/Projects/family-finances/docs/diagrams, and /Users/byronwall/Projects/soccer-schedule/docs/flows. Coordinate any write restriction through the orchestrator.

## Edge Cases and Failure Behavior
Before each edit, capture repository status and target content. If a target has overlapping user edits, stop that file and report the exact conflict. No-op soccer files remain untouched.

## Proof and Acceptance
All 15 files pass UFW flow check. Changed files format idempotently and preserve semantic ASTs. Native checks pass or report an evidenced pre-existing failure. Final status shows no unrelated change from this packet.

## Rollout and Recovery
The edits are a one-time source migration. Revert only the targeted diagram lines if parser rollout is reverted.

## Below the Cut Line
Unknown third-party consumers, package publishing, compatibility parsers, and non-diagram cleanup.

## Provenance
Claims one-time-rewrite, known-corpus, shared-lexical-contract, and keep-semantics. Plan Milestone 3.


## Notes

**2026-09-08T04:50:36Z**

Verified complete: all 15 known consumer diagrams pass check and format; semantic comparisons and idempotence pass; evidence verify passed 546 tests; family checks passed 70 with 4 skipped; soccer checks passed 164; unrelated dirty files remained untouched.
