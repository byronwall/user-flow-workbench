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
pnpm build
```

## Current capabilities

- Store nodes and edges as plain JSON.
- Place nodes manually with `position: { x, y }`.
- request automatic placement with `layout: { column, row, lane }`.
- Drag nodes and pan or zoom the canvas.
- Show title-only nodes and full details in the inspector.
- Add, duplicate, delete, and edit nodes.
- Export the graph as JSON.
- Persist changes in `localStorage`.
- Use ELK Layered for automatic placement and orthogonal routes.
- Fall back to a local Manhattan router when ELK is unavailable.
- Expose a small `window.flow` API for agents and scripts.

## Project direction

The tool should make complex flows easy to read and easy to revise. It should show actors, fundamental needs, process steps, handoffs, deliverables, interface considerations, and outcomes in one coherent view.

The next major concept is variants. A variant is not a separate node lane. It is another view of the same starting diagram. Each view can emphasize or change selected parts. Tabs or small multiples are likely presentation models.

See [docs/product-context.md](docs/product-context.md) for the original intent, decisions, and open questions. See [docs/iteration-history.md](docs/iteration-history.md) for the prototype history.

## Architecture

- `src/routes/index.tsx` loads the starter graph and renders the SPA.
- `src/routes/api/graph.ts` serves the starter graph as JSON.
- `src/components/` contains the page shell, toolbar, JSON panel, canvas, and inspector.
- `src/lib/flow-workbench.ts` contains direct manipulation, routing, layout, and the agent API.
- `src/data/example-flow.json` is the server-owned starter graph.
- `src/styles.css` contains the visual system from the prototype.

ELK is installed as a package and loads as a separate browser bundle. The local Manhattan router remains the fallback. The browser keeps the editable working graph in `localStorage`.

The preserved single-file prototype is in `docs/prototype/index.html`.

## Source

The prototype came from the ChatGPT conversation [Build Flow Diagram Prototype](https://chatgpt.com/c/6a90df99-1ab0-83ea-883d-9b9c04b69241). The local documentation preserves the important context so future work does not depend on that conversation.
