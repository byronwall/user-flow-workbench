# Authoring skill and reference

Owner: author-flow-diagrams maintainer.

Homes: `skills/author-flow-diagrams` in User Flow Workbench and the installed copy at `/Users/byronwall/.codex/skills/author-flow-diagrams`.

## Outcome

An agent loads only the guidance needed for the requested diagram. It produces durable `.diagram` source and checks meaning, structure, and presentation separately.

## Maintained shape

The repository skill is the maintained source. Its compact base reference at `skills/author-flow-diagrams/references/flow-dsl-base.md` gives the short contract and valid examples. The complete DSL specification at `docs/diagram-dsl-spec.md` remains the only syntax authority. The copy at `skills/author-flow-diagrams/references/flow-dsl-spec.md` is distributed with the skill for work outside this repository and must stay byte-identical to the maintained specification. The checkout example is copied to `skills/author-flow-diagrams/references/examples/checkout.diagram` for the same reason.

The skill starts with scoped discovery, then asks for the full specification only for variants, positions, parser diagnostics, or a deliberate canonical-format rewrite. Use the [reusable authoring runbook](../../flow-authoring-workflow.md) for the complete discovery, evidence, measurement, and handoff loop. Preserve the installed skill's cross-project placement and global CLI guidance. Keep user requested output paths and no-variant instructions authoritative.

## Modeling guidance

Every `process` needs an outgoing `flow` edge. A `handoff` represents transfer of state, control, responsibility, or information. A `deliverable` represents a durable artifact. A terminal deliverable is the derived outcome. Do not add a duplicate deliverable when the handoff only changes the label for the same state.

A process can summarize repeated work when the repetition does not change the reader's decision. Add a retry branch when it changes the route, actor, state, or outcome. Keep left-to-right order readable without implying a required sequence where none exists.

The skill preserves stable IDs, title and body separation, semantic relations, optional layout hints, and source-only maintenance. It does not turn layout conventions into schema rules.

## Current validation and visual guidance

The runbook is `check → format check → source review → render → inspect → revise`. For new uncommented flows, `format --check` must pass. Preserve comments in existing flows and report the known formatter limitation when canonical formatting rejects them, because the formatter removes comments.

```sh
flow render file.diagram --output file.png
flow render diagrams/ --output-dir previews/
```

The CLI checks, formats, views, and renders mixed directories of flow and overview `.diagram` files. Use `--variant ID` for either document type. Overview shelves discover valid same-folder flows and active-view references; same-folder membership does not create a semantic link. Overview views and source tabs are read-only, while flow edits remain browser-local. Browser export downloads are supported, but automated browser checks do not verify the download destination.

Add `--variant ID`, `--width PIXELS`, `--height PIXELS`, `--scale RATIO`, `--overwrite`, or `--json` when needed. Add `--contact-sheet` and `--report PATH` for a directory. Contact sheets are PNG by default. Successful tiles retain their source PNG pixel dimensions. A larger `--scale` increases both source previews and contact-sheet pixels. Pass a `.svg` path to request SVG output. The renderer uses a local Chrome or Chromium executable. Pass `--browser PATH` for one invocation, or set `FLOW_WORKBENCH_BROWSER` for a local executable outside the standard paths. It never downloads a browser and uses a fresh profile for each capture. Inspect a set overview plus representative branched flows. Use individual images when a contact sheet makes titles too small. Record which views were inspected.

Use three evidence labels in reports:

- `STRUCTURAL`: parser, lint, formatting, and repository checks passed.
- `SOURCE`: scope, semantics, IDs, and source-only maintenance are correct.
- `VISUAL`: an image or viewer was inspected for complete bounds, readable titles, branch labels, and misleading sequences.

Image inspection is separate from interactive browser testing. Run drag, pan, zoom, or keyboard checks only when the corresponding interaction code changes.

## Recovery and adoption

Fix a source error and rerun the narrowest failing check. Retry a render once for a plausible transient startup failure. Stop after an unchanged failure and preserve the error. Hand off the exact path, command, passed checks, failure output, changed IDs, inspected views, and next bounded action. State which evidence label remains unresolved.

Validate the maintained skill and its example before syncing the installed copy. Compare reference and example bytes after the sync. Preserve unrelated installed customization. Do not override another project's test policy.

## Cut line

Do not turn the skill into an exhaustive repository-reading checklist. Keep source-reading discipline and efficiency measurement in the [agent workflow plan](agent-workflow.md). Defer executable semantic scoring and automatic graph generation.
