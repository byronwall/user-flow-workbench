# Product context

## Intent

Build a new diagramming tool for product and user flows. Start from the included prototype, but treat it as a jump-off point. The tool must support iterative exploration by a person or an agent.

The key model is a directed graph with meaningful node types. The initial types are:

- actor
- need
- process
- handoff
- deliverable
- UX consideration
- goal

The canvas must make the flow readable before it exposes detail. Nodes show only their titles by default. Selection reveals the description and other fields in an inspector.

## Product principles

### Read the diagram first

Keep the canvas compact. Avoid small body text inside nodes. Use clear node shapes, color, and icons to show location and meaning.

### Keep the data explicit

Agents author a compact text DSL. Each node uses one line, and edges follow the nodes. The app converts the DSL to plain JSON for rendering and export.

Semantic nodes and edges do not own canvas state. A top-level `layout` object can contain semantic hints and exact positions. Both are optional. The renderer derives a good initial layout when they do not exist.

### Make direct manipulation dependable

Users must be able to drag nodes, pan the background, and zoom with a trackpad. Zoom should feel controlled. The current wheel sensitivity is about 30 percent lower than the first prototype.

### Route edges around meaning

Use rectilinear routes. Avoid node intersections. Keep edges in separate lanes, including edges that enter the same area. Prefer few bends and predictable connection sides. Layout should pack nodes tightly without making the graph hard to scan.

### Preserve human control

Automatic layout is a tool, not the source of truth. Manual movement must remain available. Graph edits must not leave stale route geometry.

### Treat variants as views

Do not model variants as a vertical lane of special nodes. A future variant starts from the same graph and changes or emphasizes part of it. Likely presentations are tabs, duplicated views, or small multiples.

## Current decisions

- Use title-only cards on the canvas.
- Put node details in the inspector.
- Use icons for actors, needs, steps, handoffs, artifacts, UX, and outcomes.
- Use compact semantic columns.
- Use ELK Layered for automatic layout.
- Use ELK to place nodes during automatic layout.
- Use the local obstacle-aware Manhattan router for all visible edges.
- Give each edge a separate connection lane and strongly avoid reused route segments.
- Keep a no-library fallback.
- Keep the graph schema and agent API visible.
- Remove the original variant lane until the view model is designed.

## Current implementation details

- The graph schema version is `3`.
- The Flow DSL version is `1`.
- The agent-facing source is a line-based flow DSL.
- Node and edge identities are required and stable.
- Canonical formatting makes repeated agent edits converge.
- Recoverable parsing returns stable diagnostics for repair loops.
- Nodes contain semantic data only.
- The optional top-level `layout` object stores hints and exact positions by node ID.
- Separate optional `position` DSL lines make manual coordinates easy to add or remove.
- The app is a TypeScript SolidStart SPA.
- The server serves the starter graph from `GET /api/graph`.
- The browser stores the editable working graph in `localStorage`.
- ELK loads from the installed `elkjs@0.12.0` package as a separate browser bundle.
- ELK uses a rightward layered graph with semantic column partitions.
- ELK uses fixed-side ports and orthogonal edge routing.
- Backward semantic edges do not constrain ELK layout. The local router handles them.
- Automatic layout keeps a readable minimum zoom. The Fit command can show the full graph.
- `window.flow` exposes graph access, mutation, layout, fit, and export functions.
- The original single-file prototype remains in `docs/prototype/index.html`.

## Example domain

The included graph maps a resume-tailoring workflow. It connects a job seeker to three needs:

- understand the actual role
- stay truthful and defensible
- spend effort where it changes the outcome

The process parses a job posting, inventories resume evidence, maps requirements to evidence, and drafts targeted changes. Handoffs produce structured models and deliverables. UX nodes cover provenance, confidence, prioritization, diffs, and approval. The outcome is a stronger, truthful application.

This example tests whether the diagram can show user intent, system work, information transformations, artifacts, interface requirements, and an outcome at the same time.

## Near-term work

1. Improve handoff and deliverable grouping. Test compact visual pairs for a transformation and its artifact.
2. Define the variant data model. Separate shared graph data from view-specific emphasis or changes.
3. Add graph validation, undo and redo, and safer schema migrations.
4. Test large diagrams, dense crossings, backward edges, and disconnected groups.
5. Improve keyboard access, focus behavior, and inspector behavior on small screens.
6. Decide how diagrams are saved, named, duplicated, imported, and shared.

## Open product questions

- Is the main object a graph, a diagram view, or a collection of related views?
- Which properties belong to shared nodes? Which properties belong to one view?
- Can a variant change structure, or can it only hide, style, and annotate shared structure?
- How should a handoff and its deliverable read as one unit without losing graph semantics?
- Should layout constraints stay semantic, or should users edit lanes and groups directly?
- How should agents propose graph changes while a person reviews them?
- Which export formats matter after JSON?

## Source context

The original prototype and iterations are in [Build Flow Diagram Prototype](https://chatgpt.com/c/6a90df99-1ab0-83ea-883d-9b9c04b69241).
