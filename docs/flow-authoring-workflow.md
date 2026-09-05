# Diagram authoring workflow

Use this runbook for a small or large `.diagram` change. It keeps source discovery, semantic checks, and visual review separate.

## 1. Scope the request

Write down the requested output path and document type. For a flow, record the entry, action, outcome, and important branches. For an overview, record its purpose, status, groups, capabilities, and any ungrouped ideas. For a wireframe, record its viewport, screens, evidence basis, and proposed interaction states. For an application map, record pages, authored states, objects, navigation, and only explicit artifact links. Read `docs/product-context.md` for a structural change. Search for relevant handlers and labels before reading whole files. Record the source file that resolves each open question.

## 2. Author one representative diagram

Start every file with `diagram 1` and exactly one type line: `type flow`, `type overview`, `type wireframe`, or `type application`. Read `skills/author-flow-diagrams/references/flow-dsl-base.md` for the compact branch guide. Read `skills/author-flow-diagrams/references/wireframe-authoring.md` for wireframes. Read `docs/diagram-dsl-spec.md` for variants, positions, parser diagnostics, overview/application syntax, or a deliberate canonical-format rewrite.

For a flow, keep the base graph reusable. Use a `handoff` for a transfer and a terminal `deliverable` for a durable outcome. Add a retry branch only when it changes the route, actor, state, or outcome. A process still needs an outgoing operational `flow` edge.

For an overview, keep groups ordered and capabilities short. Add `purpose`, `status`, and capability `detail` only when they help the idea. Ungrouped capabilities and an empty draft are valid. Add many safe relative `.diagram` flow references when a capability leads to a detailed flow. Unsafe references are parse errors and prevent loading. Missing, wrong-type, and unknown-variant safe targets warn while the overview stays usable. Overview capabilities do not need flow edges or goals.

For a wireframe, keep screens focused and source-backed. Use stable screen and control IDs. Viewer screen, shot, comparison, sizing, and interaction state do not write source.

For an application map, keep pages and states source-backed and read-only. Use safe relative typed references. A valid map is the preferred project home; overview and inventory remain fallbacks. Coverage warnings are non-blocking and inspect only explicit links.

The overview flow shelf shows the union of valid flow files in the overview's folder and valid flow references in the active view. It deduplicates by source path and keeps linked capability titles as context. Same-folder discovery is only project inventory; it does not create semantic links. Linked flows carry a validated overview, capability, and view context for their return link.

For an overview variant, apply ordered add, remove, set, and unset operations to a cloned base. Materialize and validate the selected view before adoption. The viewer shows variants read-only. Format the selected view as the new base, remove rejected variants, check, and reload. The viewer has no adoption write action.

The source tab shows read-only canonical source. `Reload source` refreshes a visible or focused overview or application map. If a refresh fails after a valid load, keep the last valid board and mark it stale until a later load succeeds. Application page and state selections use URL parameters and survive refresh plus Back or Forward. Coverage warnings inspect only explicit artifact links and never block the board. Browser exports download JSON for flows or `.diagram` source for overviews and applications; source files remain authoritative and browser working copies stay local. Automated browser checks do not verify the browser's download destination.

Keep titles short and details in `body` or `detail`. Preserve stable IDs. Keep one dominant left-to-right story in flows. Add layout hints only when semantic order or grouping needs help. Leave exact positions out of new files.

## 3. Run the narrow checks

Use the globally installed command when available. Use the checkout fallback when needed:

```sh
flow check path/to/diagram.diagram
pnpm flow check path/to/diagram.diagram
```

Run `flow check` first. Check, view, and render support directories containing mixed flow, overview, wireframe, and application `.diagram` files. Format supports flow, overview, and application files. Pass `--variant ID` to render a named flow or overview view. Run `flow format --check` for a new uncommented flow, overview, or application. Preserve comments in an existing source file and report the known formatter limitation if the check fails because canonical formatting removes comments. Run the write form only when a full rewrite is intended.

For a production flow in this repository, also run:

```sh
pnpm test:dsl
pnpm typecheck
pnpm check:flows
```

Fix the narrowest failing source issue and rerun its check. Stop after an unchanged failure and preserve the complete diagnostic.

## 4. Render the diagram

The smallest render command is:

```sh
flow render path/to/diagram.diagram --output path/to/preview.png
```

For a directory:

```sh
flow render path/to/flows --output-dir path/to/previews
```

Add `--variant ID`, `--width PIXELS`, `--height PIXELS`, `--scale RATIO`, `--overwrite`, or `--json` when needed. Add `--contact-sheet` and `--report PATH` for a directory. Contact sheets are PNG by default. Each successful tile keeps the native pixels of its source PNG. A larger `--scale` therefore increases both the source previews and the sheet pixels. Pass a `.svg` path to request SVG output. Large directories split into numbered page files. The renderer uses a local Chrome or Chromium executable. Pass `--browser PATH` for one invocation, or set `FLOW_WORKBENCH_BROWSER` for a local executable outside the standard paths. It never downloads a browser and uses a fresh profile for each capture.

Retry a plausible transient startup failure once. Do not retry an unchanged failure blindly. Investigate its cause, use `flow view` when useful, and continue other bounded work. Keep the source unchanged during capture. Application capture waits for the read-only board ready flag. For a directory, use `--contact-sheet` and inspect both the sheet and representative images.

## 5. Report evidence

Use three labels:

- `STRUCTURAL`: parser, lint, formatting, and repository checks passed.
- `SOURCE`: requested scope, semantics, IDs, and source links are correct.
- `VISUAL`: an image or viewer was inspected for complete bounds, readable titles, branch labels, and misleading sequences.

A check proves structure. A render proves that an image was produced. Source review proves meaning. Image inspection proves only what the captured view shows. Record which files, variants, and images were inspected.

## 6. Measure without overstating

For matched tasks, record elapsed time, cold setup, steady-state authoring, fresh input, cached input, output, source reads, checks, repairs, launcher delays, user corrections, and inspected images. Keep durations separate and do not add overlapping phases. A single bounded exercise shows workflow use. It does not prove token savings.

## 7. Hand off

If work stops, provide the source path, exact command, passed checks, failure output, changed IDs, inspected images, and next bounded action. State which evidence label remains unresolved. Keep application-specific checks in the owning repository.
