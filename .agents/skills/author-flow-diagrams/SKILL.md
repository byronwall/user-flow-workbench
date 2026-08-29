---
name: author-flow-diagrams
description: Author or revise User Flow Workbench `.flow` diagrams that remain semantic, readable after automatic layout, and effective as base graphs with outcome-focused variants. Use for new production diagrams, example diagrams, graph restructuring, or variant design in this repository.
---

# Author Flow Diagrams

Create a valid Flow DSL document that reads clearly before manual positioning. Keep shared truth in the base graph. Use variants for meaningful alternatives.

## Start with repository context

Read `docs/flow-dsl-spec.md` before authoring. It is the syntax authority.

Use these locations:

- Put production diagrams in `src/data/flows/*.flow`.
- Treat JSON as generated render or export data. Do not maintain a parallel JSON source.
- Use `docs/examples/*.flow` only for documentation examples.

Preserve existing stable node, edge, graph, and variant IDs. Change an ID only when its identity changes.

## Model the base graph

Make the base graph the most reusable shared flow. It must stand alone without a variant.

Use node types by meaning:

- `actor`: a person or system that acts.
- `need`: a motivation, constraint, or problem.
- `input`: information or material that enters the flow from outside it.
- `process`: an action or transformation.
- `handoff`: a transfer of state, control, or information.
- `deliverable`: a durable artifact or output.
- `ux`: interface behavior, guidance, or user control.

Use `need` for why the flow matters. Use `ux` for interface behavior. These nodes stay out of the canvas.

Use typed relations by meaning:

- Omit `relation` for operational `flow` edges.
- Use `addresses` from an operational node to a need.
- Use `appears-at` from a UX node to an operational node.
- Use `supports` from a UX node to a need.

A deliverable with no outgoing `flow` edge is an outcome. Do not add a goal node.

Write short titles that remain clear on title-only cards. Put qualifications, evidence, and acceptance detail in `body`. Add tags only when agents or future edits can use them.

Create one dominant left-to-right story. Add branches only when they show a real alternative, dependency, recovery path, or UX requirement. Avoid duplicate nodes that state the same idea.

Use edge labels when the relationship is not clear from the two titles. Apply `emphasis=true` only to a small number of outcome-critical edges.

## Design for automatic layout

Do not add exact positions to a new diagram. The renderer must produce a good first view without them.

Add `layout=<column>,<row>` only when order or grouping needs guidance. Give each operational stage a later column than its flow predecessors.

| Column | Typical stage |
| --- | --- |
| `0` | `actor` |
| `1` | inbound `input` |
| `2+` | ordered processes, handoffs, and intermediate deliverables |
| last | terminal deliverable outcome |

Needs and UX nodes do not need layout hints. Use row values to keep parallel branches aligned. Keep the dominant flow strictly left to right.

Preserve authored positions when making a semantic edit unless the user requests a new layout. Treat positions as optional saved view state, not semantic data.

## Author variants

Give each variant one clear premise or outcome. Use a specific title and a description that explains why the variant exists.

Variants start from the base graph. They do not inherit from other variants. Apply operations in source order.

Prefer small, explicit differences:

- Use `set` or `unset` when an existing node or edge keeps its identity.
- Use `add` for new structure.
- Remove connected edges before you remove their node.
- Add nodes before edges that reference them.
- Use variant `position` operations only after the semantic result renders poorly or a user moves a node.

The UI highlights variant impact. Added nodes show as `NEW`. Changed nodes show as `CHANGED`. Endpoints of added, removed, or changed edges show as `PATH`. Use this to make the alternative easy to scan.

Use `clear all` only for a complete replacement graph. It must be the first operation. Add every required node and edge after it. If the alternative has little shared meaning with the base graph, consider a separate production flow instead.

## Review before completion

Confirm these properties:

- The base graph tells a complete story.
- Every edge references nodes that exist at that operation.
- No removed node leaves a dangling edge.
- Each variant creates a meaningful result, not a cosmetic duplicate.
- Titles remain scannable without body text.
- Layout hints improve semantic grouping.
- Exact positions are absent unless they preserve intentional manual work.
- The file uses canonical command and option order.

Run the repository checks after a production flow change:

```sh
pnpm test:dsl
pnpm typecheck
```

Do not run browser validation unless the user requests it or the change affects canvas interaction.
