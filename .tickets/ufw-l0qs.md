---
id: ufw-l0qs
status: closed
deps: []
links: []
created: 2026-09-08T03:33:40Z
type: feature
priority: 1
assignee: Byron Wall
external-ref: docs/intent/diagram-dsl-concision#wireframe-formatter
parent: ufw-xc31
tags: [dsl, wireframe, formatter]
---
# Give wireframes semantic canonical output

## Initiative Intent
Make wireframe source predictable and canonical without changing its constrained semantic model.

## Outcome
Wireframe formatting serializes the complete AST instead of returning retained source. Every screen states provenance through basis. Supported documents round-trip and format idempotently.

## Current System and Evidence
wireframeToDsl returns document.sourceText or only the declaration and viewport. The parser defaults missing basis to proposed, generic option parsing overwrites duplicates, and strict unknown-option checks are inconsistent. The AST already carries references, parts, screens, frames, elements, shots, marks, table cells, and embedded diagram data.

## Requirements
- Require basis=observed, basis=source, or basis=proposed on every screen.
- Use the narrow identifier and quoted-string contract where practical.
- Reject unknown and duplicate options by command while preserving dynamic table column and row keys.
- Serialize every semantic AST field in stable canonical order.
- Ignore or remove sourceText as formatting authority.
- Preserve explicit basis and embedded diagram view.
- Omit only defaults that parse back to the same AST: theme default, page content 720, workbench inspector 346, form labels top, text role body, grid columns 2, list mode plain, and notice kind info.
- Keep human text and paths quoted. Keep identifiers and enums bare.

## Constraints and Non-Goals
Do not change renderer behavior, add new wireframe elements, add arbitrary styling, or create a general parser framework. Do not edit application or overview parsers; another lane owns them.

## Scope
Own src/types/wireframe.ts, src/lib/wireframe-dsl.ts, src/lib/wireframe-dsl.test.ts, and wireframe cases in src/lib/diagram-dsl.test.ts. Do not rewrite maintained source files yet.

## Edge Cases and Failure Behavior
Cover every element family, nested parts and use, page and workbench frames, footer, shots, marks, references, tables, tabs, lists, embedded diagrams, empty optional values, escapes, invalid identifiers, unknown options, and duplicate options.

## Proof and Acceptance
A parsed AST mutation changes formatted output. Representative complete fixtures satisfy parse-format-parse semantic equality. Formatting twice is identical. Required basis and default omission are tested. Focused wireframe and dispatcher tests pass.

## Rollout and Recovery
Keep source migration separate. Revert formatter and parser changes if full-field round-trip fails.

## Below the Cut Line
New elements, rich styling, indentation syntax, generated IDs, and compatibility parsing.

## Provenance
Claims canonical-wireframe, shared-lexical-contract, keep-semantics, basis-policy, and no-large-redesign. Shape first proof. Plan Milestone 2.


## Notes

**2026-09-08T03:41:01Z**

Coordination repair: ufw-l0qs owns src/lib/diagram-dsl.test.ts and the cross-type lexical proof. Exact contract: identifiers and enums are bare; human text and paths are quoted; only escaped quote, backslash, and newline are valid.

**2026-09-08T04:11:39Z**

Verified complete: focused wireframe and dispatcher tests passed 23/23; pnpm test:overview passed 73/73; typecheck and diff check pass. Independent final verification covered all AST fields, exact lexical rules, required basis, eight fixtures, dynamic table keys, and quoted @ text versus bare @ action cells.

**2026-09-08T04:24:24Z**

Reopened after corpus format review: canonical wireframe output emits empty optional bar start or end and workbench header or top slots, and omits the final newline. The accepted shape requires concise output and omission of empty optional slots. Fix formatter and add corpus-facing tests before migration tickets close.

**2026-09-08T04:29:38Z**

Corpus regression fixed and independently verified: empty optional bar/workbench slots are omitted, required slots remain, and output has one trailing newline. Focused tests passed 24/24; pnpm test:overview 74/74; nine UFW and three external wireframes passed semantic round-trip and idempotence.
