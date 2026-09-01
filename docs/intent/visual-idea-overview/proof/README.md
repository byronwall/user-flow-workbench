# Running overview proof

The first implementation slice is available at `/overview-preview`.
The current local server is [port 4191](http://127.0.0.1:4191/overview-preview).

This record describes the initial fixture proof. After approval, `/overview-preview` was changed to open the source-backed document. The typed fixture was removed.

The fixture contains three groups and eight capabilities from the approved wireframes.
Selection shows detail in a fixed inspector. The source panel shows read-only fixture JSON.
Reload refreshes the page. Export JSON downloads the fixture data.

This route does not parse `.diagram` files. It does not change existing flow sources.
Source refresh, typed discovery, flow links, and alternatives remain later work.

## Evidence

- STRUCTURAL: The orchestrator reran `pnpm typecheck`, `pnpm test:dsl`, and `pnpm build`. All passed; the test suite reported 35 passing tests. Browser checks confirmed selection, reload, picker navigation, and existing flow selection, pan, zoom, Auto layout, and Fit.
- SOURCE: The initial typed fixture supplied the board and source panel. Its accepted content now lives in [resume-app.diagram](../../../../src/data/overviews/resume-app.diagram).
- VISUAL: Independent browser verification captured both planned viewports. All capabilities were visible without page overflow. The board stayed fixed during selection.

Keyboard checks passed in Chrome through native CUA input. Tab traversed all capabilities. Space and Enter selected them without losing focus. Arrow keys switched inspector/source tabs. Earlier in-app key injection failed, and DOM CUA activation moved focus to the body. A fresh CUA-only check did not reproduce either issue. These are verification-tool limits, not confirmed application defects.

| Viewport | Initial board | Selected capability |
| --- | --- | --- |
| 1440 × 900 | [Initial](overview-initial-1440x900.png) | [Requirements](overview-selected-understand-1440x900.png) |
| 1280 × 800 | [Initial](overview-initial-1280x800.png) | [Tailoring](overview-selected-tailor-1280x800.png) |

These are initial-state captures. They are not before-and-after evidence of scope reduction.
Byron accepted the running preview unchanged. Milestone 1 is complete. No forced scope edits or before/after comparison are needed.

## Local server

The normal development command encountered an HMR port-selection problem in this environment.
The implementation worker started the same development app with explicit loopback ports:

```sh
PORT=4191 HOST=127.0.0.1 node --experimental-strip-types --input-type=module -e 'const { default: app } = await import("./app.config.ts"); const hmrPorts = { ssr: 4192, client: 4193, "server-fns": 4194 }; for (const router of app.config.routers) { const port = hmrPorts[router.name]; if (port) router.server = { hmr: { host: "127.0.0.1", port } }; } await app.dev();'
```

This command changes runtime configuration only. It does not edit the project configuration.
An earlier setup assigned one HMR port to all routers and caused browser websocket failures.
The replacement assigns distinct ports. Its client websocket handshake passed.
Fresh browser verification reported no warning or error logs after the repair.
End-to-end source-edit refresh still requires verification.
