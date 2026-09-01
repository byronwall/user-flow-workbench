---
name: author-flow-diagrams
description: Author or revise User Flow Workbench `.diagram` files containing flow or overview diagrams with clear semantics and durable source edits.
---

# Author Flow Diagrams

Create a valid `.diagram` source file that reads clearly before manual positioning. Choose `flow` for an operational graph or `overview` for a compact capability map. Keep shared truth in the base graph when a flow has variants.

## Read only the needed guidance

Start with [the compact authoring reference](references/flow-dsl-base.md). It branches by document type and contains valid examples.

Read [the complete Diagram DSL specification](references/flow-dsl-spec.md) when you use variants, positions, parser diagnostics, overview syntax, or deliberately rewrite canonical formatting. It is the only syntax authority. The repository copy at `docs/diagram-dsl-spec.md` is its maintained source; this reference is a distribution copy for use outside this repository.

Use the user's requested output path and instruction to omit variants when provided. Otherwise, use the project convention. In this repository, production diagrams belong in `src/data/flows/*.diagram` and examples belong in `docs/examples/*.diagram`. Maintain `.diagram` source only. JSON is generated render or export data.

Every file starts with `diagram 1` and exactly one type line. The type line selects the body parser. Do not infer the type from a filename or mix flow and overview body commands.

## Author the shared graph

Use node types by meaning:

- `actor`: a person or system that acts.
- `need`: a motivation, constraint, or problem.
- `input`: information or material that enters the flow.
- `process`: an action or transformation.
- `handoff`: a transfer of state, control, or information.
- `deliverable`: a durable artifact or output.
- `ux`: interface behavior, guidance, or user control.

Needs and UX records stay out of the canvas. Connect them with `addresses`, `supports`, and `appears-at` relations. Omit `relation` for operational `flow` edges.

Every `process` needs an outgoing `flow` edge. A semantic edge does not satisfy this rule. A `deliverable` with no outgoing `flow` edge is a derived outcome; do not add a separate goal node. These flow rules apply only to `type flow` documents.

Use a `handoff` when information, control, responsibility, or state crosses a boundary. Add a `deliverable` only when the flow creates or transfers a durable artifact. Do not make two nodes for the same state merely to show a handoff and an outcome.

Use one dominant left-to-right story. Add a branch when it shows a real alternative, dependency, recovery path, or UX requirement. A process may summarize repeated work when the repetition is not a decision the reader must inspect. Give retries their own branch when the retry changes the route, actor, state, or outcome. Label edges when the relationship is not clear from the node titles.

Keep titles short because the canvas shows titles only. Put qualifications, evidence, acceptance detail, and long wording in `body`. Preserve stable graph, node, edge, and variant IDs. Add tags only when a future edit or agent can use them.

## Author an overview

Keep the overview declaration, optional purpose and status, ordered groups, and capabilities easy to scan. Use short capability titles and add `detail` only when it clarifies the idea. Ungrouped capabilities keep their order after groups. An empty draft is valid. Overview capabilities do not need flow links, goals, or detail, but each can have many safe relative `.diagram` flow references with optional target variants. Missing or invalid targets produce warnings while the overview remains loadable.

## Keep flow layout useful

Do not add exact positions to a new flow. Add `layout=<column>,<row>` only when stage order or parallel grouping needs guidance. Keep each operational stage later than its flow predecessors. Preserve authored positions during a semantic edit unless the user asks for a new layout.

## Make flow variants explicit

Each flow variant starts from the shared base graph. It does not inherit from another variant. Give it one premise or outcome and a description that explains why it exists. Overview variants also start from the shared base and apply ordered add, remove, set, and unset operations to a cloned view. Materialize and validate the selected view before adoption. Adoption is an agent workflow: format the selected view as the new base, remove rejected variants, check, and reload. There is no adoption write API or viewer control.

- Use `set` or `unset` when an existing identity remains.
- Add nodes before edges that reference them.
- Remove connected edges before removing a node.
- Use `position` operations only after the semantic result is sound and the automatic layout needs correction.
- Use `clear all` only as the first operation for a complete replacement graph.

## Check and review

Use the installed `flow` command with explicit paths. In a checkout, `pnpm flow` is the equivalent fallback.

```sh
flow check path/to/changed.diagram
flow format --check path/to/changed.diagram
```

Run both checks for a new uncommented diagram. If an existing diagram contains comments, preserve the comments and report that `format --check` can fail because canonical formatting removes comments. Run the write form of `flow format` only when rewriting the full source is intended. In this repository, a production-flow change also uses `pnpm test:dsl`, `pnpm typecheck`, and `pnpm check:flows`.

Use the shipped render command for visual review:

```sh
flow check path/to/changed.diagram
flow render path/to/changed.diagram --output path/to/preview.png
```

For a directory, use `flow render path/to/diagrams --output-dir path/to/previews`. Add `--variant ID`, `--width PIXELS`, `--height PIXELS`, `--scale RATIO`, `--overwrite`, or `--json` when needed. Add `--contact-sheet` and `--report PATH` for a directory. Contact sheets are PNG by default; pass a `.svg` path when an SVG is needed. Successful tiles keep native size and large directories split into numbered page files. Inspect the sheet and representative images.

The renderer uses a local Chrome or Chromium executable. Pass `--browser PATH` for one invocation, or set `FLOW_WORKBENCH_BROWSER` for a local executable outside the standard paths. It never downloads a browser and uses a fresh browser profile for each capture.

Report three separate evidence labels:

- `STRUCTURAL`: parser, lint, formatting, and repository checks passed.
- `SOURCE`: the diagram preserves the requested scope, semantics, IDs, and source-only maintenance.
- `VISUAL`: an image or viewer was inspected for complete bounds, readable titles, branch labels, and misleading sequences.

A successful check proves structure. A successful render proves that an image was produced. Neither proves semantic fidelity or readability without source review and image inspection.

## Recover and hand off clearly

Fix source errors and rerun the narrowest failing check. Retry a render once when the failure is plausibly transient, such as a startup timeout, and record whether the second attempt used the same source and settings. Do not retry an unchanged failure blindly. Investigate its cause, use the viewer path when useful, and continue other bounded work.

If work must stop, hand off the exact source path, command, checks that passed, failure output, changed IDs, images actually inspected, and the next bounded action. State whether the unresolved issue affects structure, source fidelity, or visual evidence.
