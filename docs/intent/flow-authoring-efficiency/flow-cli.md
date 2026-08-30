# Flow CLI rendering and runtime

Owner: Flow Workbench maintainer. Home: this repository.

## Outcome and current fit

An agent can request a faithful diagram image with one command. It receives a usable file or a clear failure.

Reuse `src/cli/flow.ts`, `src/server/flow-catalog.ts`, `src/components/FlowCanvas.tsx`, and `src/lib/flow-workbench.ts`. Keep new CLI services separate from the large workbench module. The canvas combines HTML nodes and SVG edges, so copying the edge SVG would omit nodes.

## First slice: one trustworthy PNG

Proposed interface:

```sh
flow render diagram.flow --output diagram.png
```

The settled option names are `--variant ID`, `--width PIXELS`, `--height PIXELS`, `--scale RATIO`, `--browser PATH`, `--overwrite`, and `--json`. Directory rendering adds `--output-dir DIRECTORY`, `--contact-sheet`, and `--report PATH`. The renderer uses a local Chrome or Chromium executable. `--browser PATH` selects one invocation; `FLOW_WORKBENCH_BROWSER` selects a local executable outside the standard paths. The renderer never downloads a browser.

Validate the document before browser startup. Start an owned server on loopback and use a fresh browser context. Add a narrow render entry point or mode that uses the existing canvas without editor controls. It must accept only local Flow documents, not arbitrary URLs.

Expose an awaitable readiness result for source loading, requested view selection, layout, fonts, and final paint. Do not use fixed sleeps. Serialize layout requests so initial restore cannot race capture. Report whether ELK or the fallback produced the layout. Preserve the viewer fallback; never report fallback as ELK success.

Use a documented default canvas size, provisionally 1200 × 800 CSS pixels. Allow explicit dimensions and keep pixel scale separate from layout size. Fit all operational nodes, routes, and edge labels within the image with padding. Preserve authored positions; otherwise use automatic layout. Do not alter source or persistent browser storage.

Write the PNG atomically. Refuse to overwrite an existing output unless explicitly requested. On success, print its path and render settings. On failure, return nonzero and leave no partial output. Clean up only resources started by this invocation.

Proof: capture a branched example and the existing overview. Compare against the viewer at the same canvas size. Check complete bounds, readable titles, source hashes, repeatability, and process cleanup. Test slow layout, invalid input, missing browser, and unwritable output.

## Runtime slice: honest viewer startup

Share lifecycle code between `view` and `render` where useful. Print a ready URL only after the owned server is serving the expected root. Use a launch identity or equivalent handshake so an existing server cannot satisfy readiness accidentally.

For an occupied explicit port, return nonzero with a short `--port` suggestion. For rendering, request an available port without a probe-then-bind race. Prefer a bound-port handshake from the child process.

Proof: occupy a port with another server; confirm no success message, no false readiness, and no damage to that server. Test child crashes, startup timeout, and interruption.

## Second slice: inspect a directory

```sh
flow render docs/flows --output-dir tmp/flow-previews
```

Discover files in stable order using shared catalog rules. Preserve relative paths to avoid duplicate-basename collisions. Default to base graphs. Provide explicit variant selection before integrating variant authoring guidance; unknown variants fail clearly.

Reuse one browser process with isolated document state. Continue independent files after a failure, then return nonzero if any failed. Add a JSON report with source, view, output, dimensions, layout engine, warnings, and status.

Proof: render all nine soccer flows, nested duplicate names, and a mixed valid/invalid directory. Confirm complete accounting and deterministic filenames.

## Third slice: review a set at a glance

Generate a labeled PNG contact sheet from successful PNGs and the batch report. Preserve each source PNG's native pixels in its tile. Preserve readable labels and individual image links in SVG output. Split large sets across sheets. Pass a `.svg` path to request SVG output. Clearly identify failures rather than silently omitting files.

Proof: find and open a branched soccer diagram from a sheet without guessing its filename.

## Verification note

The installed CLI passed single-file base and variant captures, all nine soccer batch captures, source-hash checks, scale checks, report output, contact-sheet output, invalid-input checks, and occupied-port failure checks. Standard captures passed visual review. Compact renders fit the graph and omit the legend below 480 pixels; compact text can be small, so 1200 × 800 is recommended. Dense existing edge labels can still overlap cards. Evidence is in `/tmp/flow-render-verify/soccer/report.json` and `/tmp/flow-render-verify/soccer/contact-sheet.svg`.

## Dependency investigation and checks

The packaged viewer uses a local browser capture path proved against the installed CLI. Keep browser selection explicit through `--browser PATH`, `FLOW_WORKBENCH_BROWSER`, or the standard local paths. Do not depend on a Codex-only browser session or silently download browsers during render.

Use a fake runtime for command failures and a real local browser for fidelity. Test the installed package from an unrelated directory, with networking unavailable after setup. Keep browser dependencies lazy so checks and formatting work without a browser.

Run focused CLI checks, `pnpm test:dsl`, and `pnpm typecheck`. Run a package build and installed smoke for changed packaging. Use direct pointer checks if canvas event handling changes.

## Rollback and cut line

Keep existing commands and browser screenshots as fallbacks. Remove or disable rendering without changing `.flow` files. Defer SVG/PDF, automatic port retries for interactive view, pixel-perfect cross-platform guarantees, and a large visual regression suite.
