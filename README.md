# User Flow Workbench

This repository contains a SolidStart SPA for schema-first product and user-flow maps.

The app combines a graph editor, a canvas, an inspector, and layout logic. The initial example maps a truthful resume-tailoring flow. The tool is general. The resume flow is sample data, not the product boundary.

![User Flow Workbench showing an operational flow, variant tabs, and a detail inspector](docs/images/readme/flow-workbench.svg)

## Start the app

Use Node.js 22 and pnpm 11. Then run:

```sh
pnpm install
pnpm dev
```

Vinxi prints the local URL. It usually uses <http://localhost:3000>.

Run the production checks with:

```sh
pnpm typecheck
pnpm check:flows
pnpm build
```

Use the Flow CLI to check or canonically format any `.diagram` file or directory:

```sh
pnpm flow check path/to/diagram.diagram
pnpm flow format path/to/diagrams
pnpm flow format --check path/to/diagram.diagram
```

Build and serve the workbench for every `.diagram` file below the current directory:

```sh
pnpm build
pnpm flow view
pnpm flow view path/to/project --port 4317
```

Open the printed local URL. The `Project index` keeps declared overviews in `Overviews`, including invalid ones. It lists valid flows in `Flows`. Invalid flows and unknown or missing types appear in `Other diagram files`. Syntax errors appear on their row.

Render a diagram with the packaged viewer and a local Chrome or Chromium browser:

```sh
pnpm build
pnpm flow render path/to/diagram.diagram --output tmp/diagram.png
pnpm flow render path/to/diagrams --output-dir tmp/diagram-previews --contact-sheet
```

Rendering uses a fresh browser profile and never writes to `.diagram` files or browser storage. The default canvas is 1200 × 800 CSS pixels. The supported minimum is 320 × 240 CSS pixels. The legend is hidden below 480 pixels so compact captures keep diagram content visible. Use `--width`, `--height`, `--scale`, and `--variant <id>` to change the capture. For a directory render, `--scale` also increases contact-sheet tile pixels because each tile follows its source PNG size. Existing output files are preserved unless `--overwrite` is set. The renderer does not download a browser; pass `--browser /path/to/chrome` or set `FLOW_WORKBENCH_BROWSER` when Chrome is outside the standard local paths.

Directory renders preserve each source path below the output directory. They write `report.json` with one result for every source file and return a nonzero code if any file fails. `--report <path>` changes the report location. `--json` prints the result as JSON. `--contact-sheet` writes a PNG contact sheet by default with each successful preview retained at its native pixel size; pass a `.svg` path to keep an SVG sheet instead. Large directories split into `-01`, `-02`, and later pages. Existing sheets are preserved unless `--overwrite` is set.

The workbench reads source files from disk. Flow edits use a browser-local working copy keyed by workspace and source path; reset returns to the source. Overview views and the Diagram DSL tab are read-only. Browser edits and view changes do not write source files.

Install the published CLI globally or run it without installation:

```sh
pnpm add --global user-flow-workbench
flow check path/to/diagram.diagram
flow view path/to/project

pnpm dlx user-flow-workbench check path/to/diagram.diagram
pnpm dlx user-flow-workbench view path/to/project
```

## Install the diagram skill

The repository publishes its diagram-authoring skill from `skills/author-flow-diagrams`.
Install it into another agent environment with:

```sh
npx skills add byronwall/user-flow-workbench --skill author-flow-diagrams
```

## Current capabilities

- Write one `.diagram` source file for either a flow or an overview.
- Write one node per line in a compact flow DSL.
- Give every edge a stable ID with `edge id from -> to`.
- Convert flow or overview DSL to plain JSON for rendering and export.
- Keep needs and UX in the semantic model without placing them on the flow canvas.
- Derive outcomes from terminal deliverables.
- Define ordered structural variants and render them as tabs.
- Replace the base graph with `clear all` inside a variant.
- Keep semantic nodes and edges separate from optional layout state.
- Save exact positions as optional `position id x,y` DSL lines.
- Request automatic placement when positions do not exist.
- Wrap long stage sequences into rows that fit the current canvas.
- Drag nodes and pan or zoom the canvas.
- Show title-only nodes and full details in the inspector.
- Add, duplicate, delete, and edit nodes.
- Export the graph as JSON.
- Persist changes in `localStorage`.
- Use ELK Layered for automatic placement and orthogonal routes.
- Fall back to a local Manhattan router when ELK is unavailable.
- Expose a small `window.flow` API for agents and scripts.
- Discover nested `.diagram` files through the local `flow view` server.
- Keep browser edits separate for each source path and workspace.

Overview diagrams show ordered capability groups and ungrouped capabilities. Select a capability to read its detail and safe relative flow links in the inspector. Overview variants are read-only views derived from the shared base; an agent adopts one by editing the source, formatting the chosen view as the base, removing rejected variants, checking, and reloading.

The overview flow shelf lists the union of valid flow files in the overview's folder and valid flow references in the active view. It deduplicates by source path. Same-folder discovery is project inventory only and does not imply a semantic link. Linked flows can return to the overview with the originating capability and view when those values remain valid.

## Project direction

The tool should make complex flows easy to read and easy to revise. The canvas shows the operational path. The inspector shows the needs and UX attached to that path.

Variants are views of the same starting graph. Each variant stores ordered changes. The app materializes each result and renders it in a tab.

See [docs/product-context.md](docs/product-context.md) for the original intent, decisions, and open questions. See [docs/iteration-history.md](docs/iteration-history.md) for the prototype history.

## Architecture

- `src/routes/index.tsx` lists discovered files and dispatches the selected flow or overview.
- `src/routes/api/diagrams.ts` serves the mixed-type file catalog.
- `src/routes/api/diagram.ts` safely loads one catalog document as JSON.
- `src/server/flow-catalog.ts` owns discovery, path checks, parsing, and workspace identities.
- `src/components/` contains the page shell, toolbar, DSL panel, canvas, and inspector.
- `src/lib/diagram-dsl.ts` dispatches the shared envelope to the flow or overview parser.
- `src/lib/graph-dsl.ts` parses and writes the flow body DSL.
- `src/lib/flow-workbench.ts` contains direct manipulation, routing, layout, and the agent API.
- `src/data/flows/*.diagram` contains production flow documents.
- `src/styles.css` contains the visual system from the prototype.

ELK is installed as a package and loads as a separate browser bundle. The local Manhattan router remains the fallback. The browser keeps the editable working graph in `localStorage`.

The API parses selected `.diagram` files directly. It validates safe flow references and optional variants for overviews. It does not maintain parallel JSON fixtures.

## Diagram DSL

See the normative [Diagram DSL specification](docs/diagram-dsl-spec.md). A complete flow example is in [checkout.diagram](docs/examples/checkout.diagram).

The shared envelope uses `diagram 1` and one declared type. Flow bodies keep typed edge relations, required edge IDs, variant blocks, quoted strings, structural tags, and canonical formatting. Overview bodies contain ordered groups and capabilities, with optional purpose, status, and detail.

The shortest useful graph has two node lines and one edge line:

```text
diagram 1
type flow

graph signup "New user signup"
node visitor actor "Visitor"
node account deliverable "Account"
edge signup-completes visitor -> account label="signs up" emphasis=true

variant assisted "Assisted signup" {
  set node account title="Account created with support"
}
```

Node options stay on the same line:

```text
node details input "Signup details" body="The account information supplied by the visitor." tags=["signup","required"] layout=1,0
node form process "Complete form" body="Validate the supplied account details." tags=["signup"] layout=2,0
```

Edges default to operational flow. Typed semantic relations stay in the inspector:

```text
node trust need "Know the account is valid"
node guidance ux "Explain validation errors"
edge form-addresses-trust form -> trust relation=addresses
edge guidance-at-form guidance -> form relation=appears-at
edge guidance-supports-trust guidance -> trust relation=supports
```

The `layout` option is a hint. Omit it to derive a column from the node type and a stable row. Exact positions are also optional:

```text
# Optional manual positions. Delete these lines to use automatic layout.
position visitor 88,72
position account 1152,72
```

Use **Add positions** after moving nodes to write all current coordinates back to the DSL. JSON export puts hints and positions in the top-level `layout` object. Nodes stay semantic and do not own canvas state.

The preserved single-file prototype is in `docs/prototype/index.html`.

The flow toolbar exports graph JSON. The overview toolbar exports the canonical `.diagram` source. These are browser downloads; automated browser checks do not verify the browser's download destination.

## Source

The prototype came from the ChatGPT conversation [Build Flow Diagram Prototype](https://chatgpt.com/c/6a90df99-1ab0-83ea-883d-9b9c04b69241). The local documentation preserves the important context so future work does not depend on that conversation.
