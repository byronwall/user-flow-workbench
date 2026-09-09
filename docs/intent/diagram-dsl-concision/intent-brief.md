---
title: "Diagram DSL concision"
slug: "diagram-dsl-concision"
phase: intent
status: current
last_updated: "2026-09-08"
---

# Diagram DSL concision

## My read

The goal is to make the diagram DSL easier to predict, author, edit, and repair without weakening the semantic model. Source length is useful, but it is not the primary outcome. The stronger outcome is one small language with fewer exceptions across flow, overview, wireframe, and application documents.

ChatGPT Pro compared the current language with six alternatives across 28 dimensions. It recommends an evolutionary change named **Narrow canonical**. This candidate scored 88.9/100 against 83.2/100 for the current DSL. It only reduced the sample corpus by about 1–2%. Its value came from fewer lexical rules, stronger canonical output, and lower ambiguity.

The recommendation keeps the current envelope, braces, explicit IDs, typed relations, typed references, and explicit variant operations. It rejects a new indentation grammar, a universal block grammar, JSON/HCL source, contextual variant shorthand, and generated IDs. Those options save more characters, but they reduce edit safety, target stability, or recovery quality.

## What matters most

- Use one lexical contract across all four document types.
- Keep stable IDs and the current semantic models.
- Make canonical formatting prove semantic round trips.
- Remove aliases and duplicate forms that add no distinct meaning.

## The experience or behavior you appear to want

An author should know when to quote a value without remembering the document type. Human text and paths stay quoted. Identifiers, enums, booleans, and numbers stay bare. The formatter emits one accepted form. Parser errors identify unknown and duplicate options. Small edits keep stable targets and local diffs.

## Boundaries

### Must be true

- Keep `diagram 1` and the explicit `type` line.
- Keep explicit node, edge, page, screen, relation, and variant IDs.
- Preserve current AST meaning and strict reference checks.
- Replace `wireframeToDsl` source retention with a complete AST formatter.
- Test parse-format-parse equality and formatter idempotence.

### Must be avoided

- Do not redesign the language to gain character count alone.
- Do not add optional or generated IDs.
- Do not add indentation-sensitive parsing or arbitrary wireframe styling.
- Do not keep permanent compatibility code for undocumented aliases.

## What seems settled

- Adopt the Narrow canonical direction as the working recommendation.
- Make identifier-valued options bare, such as `screen=review`, `variant=focused`, and `group=review`.
- Use one string escape set: `\"`, `\\`, and `\n`.
- Remove symbolic application cardinalities and the navigation `label=` alias.
- Keep overview child references as the canonical base form.
- Require every screen to state `basis`; it records provenance.
- Reject unsafe overview paths during parsing. Keep safe missing or wrong targets as warnings.

## Possibilities, not decisions

- Omit stable presentation defaults from canonical wireframe output, including `theme default`, `form labels=top`, and `frame page content=720`.
- Use a short release note instead of a compatibility parser for known source rewrites.

## Current reality that matters

- The application parser accepts undocumented cardinality and navigation aliases.
- The wireframe formatter returns retained source and cannot prove AST serialization.
- The overview parser supports two base reference forms.
- The specification, parser, and tests agree that unsafe overview paths are parse errors; safe missing or wrong targets warn.
- At least 15 diagram files exist in three other local projects. A rewrite must include those known consumers.
- Pro could not run repository checks. Its pinned repository view also lacked production flow and overview fixtures.

## Next step after confirmation

Shape one focused proof. Share the lexical helpers, make the wireframe formatter complete, rewrite known sources once, and run the existing DSL checks. Stop further language redesign unless the corpus exposes a concrete failure.
