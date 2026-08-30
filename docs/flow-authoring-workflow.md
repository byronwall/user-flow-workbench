# Flow authoring workflow

Use this runbook for a small or large `.flow` change. It keeps source discovery, semantic checks, and visual review separate.

## 1. Scope the request

Write down the requested output path, whether variants are allowed, the entry, action, outcome, and important branches. Read `docs/product-context.md` for a structural change. Search for the relevant handlers and labels before reading whole files. Record the source file that resolves each open question.

## 2. Author one representative flow

Read `skills/author-flow-diagrams/references/flow-dsl-base.md`. Read `docs/flow-dsl-spec.md` for variants, positions, parser diagnostics, or a deliberate canonical-format rewrite. Keep the base graph reusable. Use a `handoff` for a transfer and a terminal `deliverable` for a durable outcome. Add a retry branch only when it changes the route, actor, state, or outcome.

Keep titles short and details in `body`. Preserve stable IDs. Keep one dominant left-to-right story. Add layout hints only when semantic order or grouping needs help. Leave exact positions out of new files.

## 3. Run the narrow checks

Use the globally installed command when available. Use the checkout fallback when needed:

```sh
flow check path/to/flow.flow
pnpm flow check path/to/flow.flow
```

Run `flow check` first. Run `flow format --check` for a new uncommented flow. Preserve comments in an existing source file and report the known formatter limitation if the check fails because canonical formatting removes comments. Run the write form only when a full rewrite is intended.

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
flow render path/to/flow.flow --output path/to/preview.png
```

For a directory:

```sh
flow render path/to/flows --output-dir path/to/previews
```

Add `--variant ID`, `--width PIXELS`, `--height PIXELS`, `--scale RATIO`, `--overwrite`, or `--json` when needed. Add `--contact-sheet` and `--report PATH` for a directory. Contact sheets are PNG by default. Each successful tile keeps the native pixels of its source PNG. A larger `--scale` therefore increases both the source previews and the sheet pixels. Pass a `.svg` path to request SVG output. Large directories split into numbered page files. The renderer uses a local Chrome or Chromium executable. Pass `--browser PATH` for one invocation, or set `FLOW_WORKBENCH_BROWSER` for a local executable outside the standard paths. It never downloads a browser and uses a fresh profile for each capture.

Retry a plausible transient startup failure once. Do not retry an unchanged failure blindly. Investigate its cause, use `flow view` when useful, and continue other bounded work. Keep the source unchanged during capture.

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
