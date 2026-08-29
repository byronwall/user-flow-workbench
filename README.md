# User Flow Workbench

This repository contains a SolidStart SPA for schema-first product and user-flow maps.

The app combines a graph editor, a canvas, an inspector, and layout logic. The initial example maps a truthful resume-tailoring flow. The tool is general. The resume flow is sample data, not the product boundary.

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

Use the Flow CLI to check or canonically format any `.flow` file or directory:

```sh
pnpm flow check path/to/flow.flow
pnpm flow format path/to/flows
pnpm flow format --check path/to/flow.flow
```

## Install the diagram skill

The repository publishes its diagram-authoring skill from `skills/author-flow-diagrams`.
Install it into another agent environment with:

```sh
npx skills add byronwall/user-flow-workbench --skill author-flow-diagrams
```

## Current capabilities

- Write one node per line in a compact flow DSL.
- Give every edge a stable ID with `edge id from -> to`.
- Convert Flow DSL 3 to schema version 5 JSON for rendering and export.
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

## Project direction

The tool should make complex flows easy to read and easy to revise. The canvas shows the operational path. The inspector shows the needs and UX attached to that path.

Variants are views of the same starting graph. Each variant stores ordered changes. The app materializes each result and renders it in a tab.

See [docs/product-context.md](docs/product-context.md) for the original intent, decisions, and open questions. See [docs/iteration-history.md](docs/iteration-history.md) for the prototype history.

## Architecture

- `src/routes/index.tsx` loads the starter graph and renders the SPA.
- `src/routes/api/graph.ts` serves the starter graph as JSON.
- `src/components/` contains the page shell, toolbar, DSL panel, canvas, and inspector.
- `src/lib/graph-dsl.ts` parses and writes the agent-facing flow DSL.
- `src/lib/flow-workbench.ts` contains direct manipulation, routing, layout, and the agent API.
- `src/data/flows/*.flow` contains production flow documents.
- `src/styles.css` contains the visual system from the prototype.

ELK is installed as a package and loads as a separate browser bundle. The local Manhattan router remains the fallback. The browser keeps the editable working graph in `localStorage`.

The API parses [resume-alignment.flow](src/data/flows/resume-alignment.flow) directly. Edit that file to change the production example. Do not maintain a parallel JSON fixture.

## Flow DSL

See the normative [Flow DSL specification](docs/flow-dsl-spec.md). A complete example is in [checkout.flow](docs/examples/checkout.flow).

Draft 0.4 uses `flow 3`, typed edge relations, required edge IDs, variant blocks, quoted strings, structural tags, and canonical formatting.

The shortest useful graph has two node lines and one edge line:

```text
flow 3

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

## Source

The prototype came from the ChatGPT conversation [Build Flow Diagram Prototype](https://chatgpt.com/c/6a90df99-1ab0-83ea-883d-9b9c04b69241). The local documentation preserves the important context so future work does not depend on that conversation.
