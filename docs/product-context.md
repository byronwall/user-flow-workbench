# Product context

## Intent

Build a new diagramming tool for product and user flows. Start from the included prototype, but treat it as a jump-off point. The tool must support iterative exploration by a person or an agent.

The key model is one semantic graph with a focused operational projection. Node types are:

- actor
- need
- input
- process
- handoff
- deliverable
- UX consideration

Only actors, inputs, processes, handoffs, and deliverables render on the canvas. Needs and UX stay available through typed relations in the inspector.

The canvas must make the flow readable before it exposes detail. Nodes show only their titles by default. Selection reveals descriptions, needs, UX, and other fields in the inspector.

## Product principles

### Read the diagram first

Keep the canvas compact. Avoid small body text inside nodes. Use clear node shapes, color, and icons to show location and meaning.

### Keep the data explicit

Agents author a compact text DSL. Each node uses one line, and edges follow the nodes. The app converts the DSL to plain JSON for rendering and export.

Semantic nodes and edges do not own canvas state. A top-level `layout` object can contain hints and exact positions for operational nodes. Both are optional. The renderer derives a good initial layout when they do not exist.

### Make direct manipulation dependable

Users must be able to drag nodes, pan the background, and zoom with a trackpad. Zoom should feel controlled. The current wheel sensitivity is about 30 percent lower than the first prototype.

### Route edges around meaning

Use rectilinear routes. Avoid node intersections. Keep edges in separate lanes, including edges that enter the same area. Prefer few bends and predictable connection sides. Layout should pack nodes tightly without making the graph hard to scan.

### Preserve human control

Automatic layout is a tool, not the source of truth. Manual movement must remain available. Graph edits must not leave stale route geometry.

### Treat variants as views

Do not model variants as a vertical lane of special nodes. Each variant applies ordered operations to the shared base graph. The app materializes the result and shows it in a tab.

## Current decisions

- Use title-only cards on the canvas.
- Put node details in the inspector.
- Render only operational nodes and `flow` edges on the canvas.
- Keep needs and UX as semantic nodes shown through inspector relations.
- Use `addresses`, `supports`, and `appears-at` for non-flow relations.
- Derive outcomes from deliverables with no outgoing `flow` edge.
- Use icons for actors, needs, inputs, steps, handoffs, artifacts, UX, and derived outcomes.
- Do not render column or lane headers on the canvas.
- Use larger canvas icons and titles to make semantic groups easy to scan.
- Keep canvas icons borderless and inset them directly into the node.
- Show a compact color legend at the bottom of the canvas.
- Use compact semantic columns.
- Wrap long stage sequences into left-to-right rows that match the viewport aspect ratio.
- Keep 96 pixels between the content bounds of wrapped horizontal bands.
- Center wrapped route bundles inside each gutter with 12 pixels between parallel edges.
- Snap nearby node centers onto shared horizontal lines after automatic layout.
- Keep clear aligned connections straight instead of forcing them onto the routing grid.
- Route row transitions through separate gutters so wrapped flows stay readable.
- Attach incoming flow edges to the left or top of a node.
- Attach outgoing flow edges to the right or bottom of a node.
- Use right-to-left ports within a row and bottom-to-top ports across a row wrap.
- Keep small port groups centered on each node side.
- Use the alternate allowed side when a nearby node blocks the preferred port corridor.
- Show inbound resources as `input` nodes before their consuming process.
- Use `handoff` only when information, control, or responsibility transfers.
- Use ELK Layered for automatic layout.
- Use ELK to place nodes during automatic layout.
- Use the local obstacle-aware Manhattan router for all visible edges.
- Give each edge a separate connection lane and strongly avoid reused route segments.
- Keep a no-library fallback.
- Keep the graph schema and agent API visible.
- Put the inspector and Diagram DSL in tabs within a full-height right sidebar.
- Show active-view descriptions in the sidebar and the variant-impact key in the canvas legend.
- Do not show variant-operation totals in the interface.
- Show the base graph and variants as tabs.
- Keep variant operations separate from the complete graph used by the renderer.
- Permit `clear all` only as the first operation in a replacement variant.

## Current implementation details

- The graph document schema version is `5`.
- The Flow DSL version is `3`.
- Earlier DSL and schema versions are not supported.
- The agent-facing source uses a shared `diagram 1` envelope with exactly one `type flow` or `type overview` line. Flow and overview bodies keep separate semantics.
- The flow body remains a line-based DSL. The overview body stores ordered groups, capabilities, optional purpose and status, and safe relative flow references.
- Node and edge identities are required and stable.
- Canonical formatting makes repeated agent edits converge.
- Recoverable parsing returns stable diagnostics for repair loops.
- The reusable semantic linter checks the base graph and each materialized variant.
- A process node must have at least one outgoing `flow` edge.
- Nodes contain semantic data only.
- Edge relations separate operational flow from supporting metadata.
- The optional top-level `layout` object stores hints and exact positions by node ID.
- Separate optional `position` DSL lines make manual coordinates easy to add or remove.
- Variants use ordered add, remove, set, unset, position, and clear operations.
- Variant positions override base positions. They stay optional.
- Semantic form controls are read-only in a materialized variant. Agents edit variant changes in the DSL.
- The app is a TypeScript SolidStart SPA.
- Production flow diagrams live as editable `.diagram` files in `src/data/flows`, and production overview diagrams live in `src/data/overviews`.
- `flow view` serves the packaged SolidStart application on the loopback interface.
- `flow render` captures one file or a directory through the packaged viewer with a fresh local browser profile.
- Render output uses a 1200 × 800 CSS pixel canvas by default, with a supported minimum of 320 × 240 pixels. The legend is hidden below 480 pixels to preserve diagram content. Directory output keeps source-relative paths and writes a JSON report.
- Render startup uses an owned loopback server and launch identity. It waits for layout and final paint, reports ELK or fallback layout, and never downloads a browser.
- The server discovers `.diagram` files below its selected root and dispatches by the declared type.
- The index shows a picker before it loads a document. `Overviews` includes invalid overview files. `Flows` includes valid flows. `Other diagram files` includes invalid flows and unknown or missing types.
- `GET /api/diagrams` serves the mixed-type file catalog.
- `GET /api/diagram` parses one validated relative path and materializes an optional overview variant.
- The server rejects traversal paths, symbolic links, and ignored build directories.
- The browser stores the editable working graph in `localStorage`.
- Browser storage uses the workspace identity and relative source path.
- Browser edits do not write back to source files.
- Overview source is read-only in the viewer. `Reload source` refreshes visible or focused pages, and a failed refresh keeps the last valid board marked stale until a later success.
- Flow JSON and overview source exports are browser downloads. Automated browser checks do not verify the browser's download destination.
- The `variant` URL parameter stores the active tab across refreshes.
- ELK loads from the installed `elkjs@0.12.0` package as a separate browser bundle.
- ELK uses a rightward layered graph with semantic column partitions.
- A viewport-aware pass wraps ELK stage columns into rows after placement.
- ELK uses fixed-side ports and orthogonal edge routing.
- Backward semantic edges do not constrain ELK layout. The local router handles them.
- Automatic layout keeps a readable minimum zoom. The Fit command can show the full graph.
- `window.flow` exposes graph access, mutation, layout, fit, and export functions.
- The original single-file prototype remains in `docs/prototype/index.html`.

## Example domain

The included graph maps a resume-tailoring workflow. Its semantic model records three needs:

- understand the actual role
- stay truthful and defensible
- spend effort where it changes the outcome

The job posting and resume are explicit inputs. The process parses them, maps requirements to evidence, and drafts targeted changes. Deliverables preserve the structured models. A handoff moves the draft to human approval. The terminal tailored resume is the derived outcome.

Needs connect through `addresses`. UX records connect through `appears-at` and `supports`. The inspector exposes these relations without adding them to the operational canvas.

## Capability overview

Overview diagrams provide a compact, source-backed view of product capabilities. They use ordered groups and title-only controls. Selection shows detail in a fixed inspector. The source tab shows read-only Diagram DSL data. Flow and overview documents share the `.diagram` extension and declare their type in the source header.

An overview can contain groups, ungrouped capabilities, optional purpose and status, and an empty draft. Overview records do not require flow links, goals, or detail. A capability can have optional ordered links to safe relative `.diagram` flow sources, including a selected flow view. Unsafe references are parse errors that prevent loading. Missing, wrong-type, or unknown-variant safe targets show a warning while the overview remains usable. Opening a linked flow carries a validated overview path, capability, and temporary view so the flow can return safely to the overview context.

Each overview shows a compact project flow shelf below its board. The shelf lists the union of valid flow files in the overview's folder and valid flow files referenced by capabilities in the active view. It deduplicates by source path and keeps linked capability titles as navigation context. Folder membership discovers project flows; it does not create semantic links.

The overview reloads source data while it is visible. A refresh keeps the last good view when a read fails and marks the source as stale until a later read succeeds. Overview variants are temporary, read-only views materialized from the shared base; agents can inspect a view and later adopt it by editing the source. Independent browser checks passed for navigation, selection, repaired links, and adoption recovery. See [implementation evidence](intent/visual-idea-overview/final-proof/README.md). The approved board layout remains unchanged.

## Near-term flow work

1. Improve handoff and deliverable grouping. Test compact visual pairs for a transformation and its artifact.
2. Add graph validation, undo and redo, and safer schema migrations.
3. Test large diagrams, dense crossings, backward edges, and disconnected groups.
4. Improve keyboard access, focus behavior, and inspector behavior on small screens.
5. Decide how diagrams are saved, named, duplicated, imported, and shared.

## Open product questions

- Should one document support variant groups when the tab count becomes large?
- Should the UI add structured controls for common variant operations?
- How should a handoff and its deliverable read as one unit without losing graph semantics?
- Should layout constraints stay semantic, or should users edit lanes and groups directly?
- How should agents propose graph changes while a person reviews them?
- Which export formats matter after JSON?

## Source context

The original prototype and iterations are in [Build Flow Diagram Prototype](https://chatgpt.com/c/6a90df99-1ab0-83ea-883d-9b9c04b69241).
