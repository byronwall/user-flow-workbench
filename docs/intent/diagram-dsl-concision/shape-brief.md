---
title: "Diagram DSL concision — shape brief"
slug: "diagram-dsl-concision"
phase: shape
status: current
last_updated: "2026-09-08"
---

# Diagram DSL concision — shape brief

## Recommendation

Keep the four existing semantic languages and narrow their author-facing rules. Share only identifier and quoted-string primitives. Keep each body tokenizer because flow recovery, overview line diagnostics, application tokens, and wireframe nesting differ. Require bare identifiers, quoted text and paths, three supported escapes, explicit screen basis, and strict unknown or duplicate options.

Run two implementation roots in parallel. One tightens application and overview syntax. The other completes wireframe parsing and AST formatting. Reconcile them through cross-type tests, then rewrite maintained sources once. Do not add a compatibility layer.

## Problem and appetite

- **Problem:** Equivalent values use different quoting, escape, alias, and formatting rules.
- **Outcome:** Authors can predict valid syntax and canonical output across all document types.
- **Appetite:** One focused language cleanup with no new package.
- **Not in this shape:** New grammar families, generated IDs, arbitrary styling, or backward compatibility.

## Core shape

The shared diagram envelope and four semantic ASTs remain authoritative. A small lexical module owns identifier checks plus string decoding and encoding. Body parsers keep their specialized tokenization and diagnostics.

Application drops symbolic cardinalities and the navigation label alias. Overview base capabilities accept child reference lines as their one canonical form. Identifier-valued options become bare. Unsafe paths fail parsing; safe broken targets remain warnings.

Wireframe screens require basis. The formatter serializes the complete AST in stable order and omits only presentation defaults that parse back to the same meaning.

## Current fit

- **Reuse:** Existing ASTs, diagnostics, body parsers, dispatcher, canonical flow and overview formatters, and test commands.
- **Add:** Small shared lexical helpers, a complete wireframe formatter, and cross-type contract tests.
- **Avoid or replace:** Retained-source wireframe output, silent duplicate options, undocumented aliases, and duplicate base overview reference forms.

## How to make this go better

- **Share primitives, not tokenizers.** This reduces drift without merging incompatible recovery logic.
- **Prove behavior before migration.** Parser and formatter tests create a safe cutover point.
- **Use AST equality as the gate.** Shorter output does not count if meaning changes.
- **Rewrite known sources once.** The repository and local consumers converge without permanent legacy parsing.
- **Keep the safety distinction explicit.** Unsafe paths are errors; safe unresolved targets are warnings.

## First proof

- **Question:** Can all four bodies use the narrow contract without a real-source exception?
- **Proof:** Focused parser and formatter tests plus every known diagram source.
- **Observe:** Diagnostics, AST equality, idempotence, and changed source count.
- **Pass / fail:** Pass when all canonical sources parse and format twice identically. Revise only for a general semantic exception.
- **Deliberately excludes:** UI changes, a new grammar, compatibility code, and publishing.

## Rabbit holes and no-gos

- A universal tokenizer or parser framework.
- Indentation parsing, generated IDs, JSON/HCL source, and free-form wireframe layout.
- Tests for every internal helper instead of behavioral contracts.

## Plan handoff

Implement the two parser roots independently. Integrate through documentation and corpus migration only after both pass their focused checks.
