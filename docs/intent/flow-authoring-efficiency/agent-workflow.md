# Efficient authoring and evidence review

Owner: agent workflow maintainer and evaluator. Initial home: this plan; promote only practices proved by use.

## Outcome

Agents reach accurate, readable diagrams with less fresh context and less environment repair. Efficiency never replaces evidence of correctness. Use the [reusable authoring runbook](../../flow-authoring-workflow.md) for the command loop.

## Focused discovery

Start with the user request, domain invariants, route list, and any existing diagram source map. Make a short internal list for each flow: entry, action, outcome, and important branch. Search for the relevant action handlers first. Read component excerpts for labels and interaction details. Read a complete file only when an excerpt leaves a specific uncertainty.

Keep searches bounded. Avoid reading the same component again without a new question. Keep successful tool output short. Retain full failure diagnostics. Record which source read resolved each uncertainty.

Author and check one representative branched flow before expanding a set. Preserve an overview plus details structure. Update source links and maintenance instructions with durable diagrams. Follow the repository's current quality gate. Use a documented launcher fallback only after a confirmed bootstrap failure. Read script names from `package.json`; do not guess executable locations.

## Evidence after rendering

Use `check → render → inspect → revise`. A successful render proves that an image exists. Inspect complete bounds, readable titles, branch labels, and confusing sequences. Review the overview and representative branched flows. Use individual images when contact-sheet text is too small.

The renderer uses a local Chrome or Chromium executable. Pass `--browser PATH` for one invocation, or set `FLOW_WORKBENCH_BROWSER` for a local executable outside the standard paths. It never downloads a browser and uses a fresh profile for each capture.

Report three separate labels:

- `STRUCTURAL`: parser, lint, formatting, and repository checks passed.
- `SOURCE`: the request, domain meaning, stable IDs, and source links are preserved.
- `VISUAL`: the image or viewer was inspected for bounds, titles, branches, and misleading order.

Interactive browser checks prove interaction behavior. Image inspection proves only what the captured view shows. Run pointer, pan, zoom, or keyboard checks when the related interaction code changes.

Use the nine soccer flows as a rendering regression set. Standard captures passed for the soccer set. Compact renders fit the graph and omit the legend below 480 pixels; compact text can be small, so 1200 × 800 is recommended. Dense existing edge labels can still overlap cards. Evidence is in `/tmp/flow-render-verify/soccer/report.json` and `/tmp/flow-render-verify/soccer/contact-sheet.svg`. For authoring-efficiency evaluation, choose an unfamiliar application or independent workflow slices. Rereading the known soccer application cannot support a speed comparison.

## Honest measurement

For a matched task, record:

- elapsed time, with cold setup separate from steady-state authoring;
- fresh uncached input, cached input, and output tokens when the tool reports them;
- source files and excerpts read, checks run, and images inspected;
- repair attempts, launcher delays, and user corrections; and
- output paths and whether the run completed all requested views.

Keep input, cache, output, and shell-command durations separate. Do not add overlapping process times. Preserve this baseline as context only: 470.925 seconds, 87,947 uncached input tokens, 1,632,640 cached input tokens, and 11,281 output tokens from one task. These values are not targets and do not prove savings.

Report a saving only for matched tasks with similar diagram complexity and equivalent quality checks. A bounded exercise can show that a workflow is usable. It cannot prove token reduction without a matched baseline and reliable measurements.

## Bounded exercise record

Run a small documentation request with the available CLI. Record the source read, exact commands, elapsed time, result, and limits. Example record format:

```text
Date: YYYY-MM-DD
Request: Validate one representative example without changing source.
Source read: docs/diagram-dsl-spec.md; docs/examples/checkout.diagram.
Commands: pnpm flow check docs/examples/checkout.diagram; pnpm flow format --check docs/examples/checkout.diagram.
STRUCTURAL: pass/fail and concise output.
SOURCE: pass/fail and the semantic scope reviewed.
VISUAL: name the rendered image or viewer image inspected.
Elapsed: check and format durations, with setup noted.
Limit: one known example; no token-saving claim.
```

### 2026-08-30 run

The existing checkout example was read with the complete specification and checked with the current CLI. `pnpm flow check docs/examples/checkout.diagram` passed in 0.61 seconds. The example contains comments, so `pnpm flow format --check docs/examples/checkout.diagram` reported that it is not canonical; the formatter removes comments by design. The production flow passed the canonical check with `pnpm flow format --check src/data/flows/resume-alignment.diagram`.

`STRUCTURAL`: the checkout parser and linter passed; the canonical formatter behavior was observed and recorded. `SOURCE`: the checkout example keeps separate input, process, handoff, deliverable, need, and UX meaning, with a recovery relation. `VISUAL`: the standard soccer captures passed visual review. Compact renders fit the graph and omit the legend below 480 pixels; compact text can be small, so 1200 × 800 is recommended. Dense existing edge labels can still overlap cards. The rendered report and contact sheet are at `/tmp/flow-render-verify/soccer/report.json` and `/tmp/flow-render-verify/soccer/contact-sheet.svg`. This was one bounded existing-CLI exercise. It provides no comparative token-savings claim.

## Recovery and handoff

Fix source errors and rerun the narrowest failing check. Retry a plausible transient render startup failure once. Do not retry an unchanged failure blindly. Investigate its cause, use `flow view` when useful, and continue other bounded work.

If work stops, hand off the exact source path, command, passed checks, failure output, changed IDs, inspected images, and next bounded action. State whether the remaining issue is `STRUCTURAL`, `SOURCE`, or `VISUAL`. Keep diagram rules in the authoring skill. Keep application-specific checks in the owning repository.

## Cut line

Do not add a benchmark service, automated visual score, mandatory delegation, token budget promise, or broad policy rewrite. Promote a practice to shared guidance only after a reviewable run proves it useful.
