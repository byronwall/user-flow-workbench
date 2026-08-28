# User Flow Workbench

This repository starts a diagramming tool for schema-first product and user-flow maps.

The current prototype is one dependency-light HTML file. It combines a graph editor, a canvas, an inspector, and layout logic. The initial example maps a truthful resume-tailoring flow. The tool is general. The resume flow is sample data, not the product boundary.

## Start the prototype

Run a local server from the repository root:

```sh
python3 -m http.server 4173
```

Then open <http://localhost:4173>.

You can also open `index.html` directly. A local server gives more consistent browser behavior.

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

## Current architecture

`index.html` contains all markup, styles, sample data, rendering, editing, routing, and layout code. It loads `elkjs@0.12.0` from jsDelivr. This structure makes the starting point easy to inspect and change. It is not a required long-term architecture.

## Source

The prototype came from the ChatGPT conversation [Build Flow Diagram Prototype](https://chatgpt.com/c/6a90df99-1ab0-83ea-883d-9b9c04b69241). The local documentation preserves the important context so future work does not depend on that conversation.
