---
title: "Diagram DSL concision — implementation plan"
slug: "diagram-dsl-concision"
phase: plan
status: current
last_updated: "2026-09-08"
---

# Diagram DSL concision — implementation plan

## Plan at a glance

Start with two independent proof roots. The application and overview root removes aliases, accepts only bare identifier options, narrows escapes, and keeps unsafe paths as parse errors. The wireframe root requires basis, tightens options, and replaces retained-source output with a complete AST formatter. Both roots preserve the current envelope, ASTs, explicit IDs, braces, and diagnostics.

After both roots pass, update the maintained authoring skill and its byte-identical specification copy. Rewrite repository fixtures and the known local consumer sources once. No compatibility parser is kept. Final proof compares semantics across formatting, checks canonical idempotence, and runs the existing repository gates.

The baseline is healthy for pnpm test:overview, typecheck, and check:flows. pnpm test:dsl has two known environmental or fixture failures: sandbox loopback permission and a missing production flow fixture. These are not DSL-concision acceptance failures unless the change affects them.

## Implementation strategy

- **First proof:** Narrow parser behavior and complete wireframe serialization through focused tests.
- **Primary seam:** Existing body parser and formatter functions behind parseDiagramWithDiagnostics and diagramToDsl.
- **Fast local loop:** `node --experimental-strip-types --test src/lib/application-dsl.test.ts src/lib/overview-dsl.test.ts src/lib/wireframe-dsl.test.ts src/lib/diagram-dsl.test.ts`
- **Local dependencies:** Existing TypeScript fixtures only.
- **Provider/live confirmation:** None.
- **Rollout and rollback:** One source rewrite after both roots pass. Revert parser and source changes together if semantic equality fails.

## Milestone 1: Parser syntax becomes predictable

This root changes language acceptance without changing semantic data.

- **Change — Share narrow lexical primitives**
  - Reuse one identifier rule and quoted-string encode/decode contract.
  - Keep body-specific tokenizers and diagnostic adapters.
- **Change — Tighten application syntax**
  - Remove symbolic cardinalities and navigation label alias.
  - Reject duplicate options and unsupported escapes.
- **Change — Canonicalize overview syntax**
  - Require bare group, variant, and screen identifiers.
  - Keep child flow and wireframe lines as the base capability form.
  - Keep compact inline references for variant mutations.
  - Preserve unsafe-path parse errors and safe-target warnings.
- **Proof**
  - Add cross-type lexical cases and focused application and overview tests.

### Desired end state

- One documented lexical rule applies across body types.
- Legacy aliases fail with repair-grade diagnostics.
- Current semantic ASTs remain unchanged.
- Focused parser tests pass.

## Milestone 2: Wireframes gain semantic canonical output

This root can run beside Milestone 1 because it owns the wireframe parser, types, formatter, and tests.

- **Change — Require explicit provenance**
  - Require basis on every screen.
  - Reject unknown and duplicate options without blocking dynamic table cell keys.
- **Change — Serialize the full AST**
  - Format references, parts, frames, elements, shots, marks, and embedded diagrams in stable order.
  - Remove retained source as formatter authority.
  - Omit only stable presentation defaults that parse to the same AST.
- **Proof**
  - Mutate a parsed AST and confirm output changes.
  - Check parse-format-parse equality and formatter idempotence.
  - Cover both production wireframes and representative examples.

### Desired end state

- Wireframe output reflects AST state rather than stale input text.
- Every supported field round-trips.
- Required basis remains visible.
- Focused wireframe and dispatcher tests pass.

## Milestone 3: Maintained sources converge

This milestone begins after both implementation roots pass.

- **Change — Update language documentation**
  - Update the maintained authoring skill first.
  - Keep docs/diagram-dsl-spec.md byte-identical to the distributed reference.
  - State unsafe-path errors and safe broken-target warnings.
- **Change — Rewrite canonical sources**
  - Format UFW wireframes and tests.
  - Update the evidence-first application identifiers and wireframe defaults.
  - Update the family-finances default frame option.
  - Confirm soccer sources need no edits.
- **Proof**
  - Compare semantic ASTs before and after rewrites.
  - Run format checks for UFW and all known consumers.
  - Run pnpm test:overview, pnpm typecheck, pnpm check:flows, and the usable parts of pnpm test:dsl.

### Desired end state

- Maintained sources use one canonical language.
- The authoring skill and specification agree with execution.
- Known consumers remain valid.
- No compatibility layer remains.

## Cross-cutting verification

- Preserve explicit IDs and all semantic references.
- Confirm all supported escapes work and all unsupported escapes fail.
- Confirm safe missing targets warn while unsafe paths fail.
- Record baseline-only failures separately from regressions.

## Ticket graph

- Epic: ufw-xc31
- Parallel roots: ufw-btnh and ufw-l0qs
- After both roots: ufw-woz5 and ufw-88vx

## Below the cut line

- A shared tokenizer or parser framework.
- Indentation-sensitive or universal block syntax.
- JSON/HCL authoring sources.
- Generated or optional IDs.
- Arbitrary wireframe styling.
- Permanent legacy syntax support.
