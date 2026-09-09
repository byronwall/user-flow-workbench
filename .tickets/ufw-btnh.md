---
id: ufw-btnh
status: closed
deps: []
links: []
created: 2026-09-08T03:32:54Z
type: feature
priority: 1
assignee: Byron Wall
external-ref: docs/intent/diagram-dsl-concision#parser-contract
parent: ufw-xc31
tags: [dsl, parser]
---
# Make application and overview syntax canonical

## Initiative Intent
Make equivalent Diagram DSL values use one predictable lexical rule without replacing the application or overview semantic models.

## Outcome
Application and overview parsing accept the Narrow canonical syntax and reject undocumented or duplicate forms with located diagnostics.

## Current System and Evidence
Application accepts symbolic cardinalities 1, *, 0..1, and 1..*, accepts nav label as trigger, accepts extra escapes, and permits duplicate options. Overview accepts both inline and child base references, quotes identifier options, and uses JSON string decoding. Unsafe overview paths already fail parsing; safe unresolved targets become warnings later in catalog resolution.

## Requirements
- Reuse small shared identifier and quoted-string encode or decode helpers when this reduces real duplication.
- Keep body-specific tokenizers and diagnostic adapters.
- Human text and paths stay quoted. Identifier-valued group, variant, screen, and similar options are bare.
- Support only escaped quote, backslash, and newline.
- Reject unsupported escapes, unknown options, and duplicate options.
- Remove symbolic application cardinalities and the nav label alias.
- Accept child flow and wireframe lines as the only base overview reference form.
- Keep compact inline references inside overview variant add and set operations.
- Preserve unsafe-path parse errors and safe-target warning behavior.

## Constraints and Non-Goals
Do not change AST shapes, explicit IDs, the shared envelope, variant semantics, UI behavior, or add a full shared tokenizer. Do not add compatibility parsing.

## Scope
Own application and overview parser, formatter, and focused test files. Shared lexical helper files may be added. Do not edit wireframe formatter or wireframe fixtures; another lane owns them.

## Edge Cases and Failure Behavior
Cover quoted identifiers, duplicate options, unsupported escapes, unsafe paths, repeated intentional references, and repair-grade source locations.

## Proof and Acceptance
Focused application, overview, and shared dispatcher tests pass. Tests prove alias rejection, bare identifier output, narrow escape behavior, base reference rejection, variant reference retention, unsafe path errors, and unchanged AST meaning.

## Rollout and Recovery
This ticket changes parser behavior before source migration. Revert it before any source rewrite if a real semantic exception appears.

## Below the Cut Line
Universal tokenizer, new grammar family, generated IDs, compatibility aliases, and source migration.

## Provenance
Claims shared-lexical-contract, remove-aliases, single-overview-reference-form, keep-semantics, and unsafe-path-policy. Shape first proof. Plan Milestone 1.


## Notes

**2026-09-08T03:41:01Z**

Coordination repair: ufw-l0qs owns all edits to src/lib/diagram-dsl.test.ts. Keep ufw-btnh proof in application-dsl.test.ts and overview-dsl.test.ts; report any required dispatcher case to the orchestrator.

**2026-09-08T04:08:10Z**

Verified complete: focused combined parser suite passed 41 tests; pnpm test:overview, pnpm typecheck, pnpm check:flows, and git diff --check pass. Independent clean verification confirmed alias rejection, strict lexical behavior, source line offsets, base versus variant references, unsafe-path errors, and semantic round trips.
