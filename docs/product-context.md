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
- The agent-facing source uses a shared `diagram 1` envelope with one `type flow`, `type overview`, `type wireframe`, or `type application` line. Each body keeps separate semantics.
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
- Production flow, overview, and wireframe diagrams live in separate folders below `src/data` and share the `.diagram` extension.
- `flow view` serves the packaged SolidStart application on the loopback interface.
- `flow render` captures one file or a directory through the packaged viewer with a fresh local browser profile.
- Render output uses a 1200 × 800 CSS pixel canvas by default, with a supported minimum of 320 × 240 pixels. The legend is hidden below 480 pixels to preserve diagram content. Directory output keeps source-relative paths and writes a JSON report.
- Render startup uses an owned loopback server and launch identity. It waits for layout and final paint, reports ELK or fallback layout, and never downloads a browser.
- The server discovers `.diagram` files below its selected root and dispatches by the declared type.
- One valid overview opens as the project home. Several valid overviews show a chooser. Without a valid overview, the index remains available. It lists valid files under `Overviews`, `Wireframes`, and `Flows`. Invalid and unknown files appear under `Other diagram files`.
- `GET /api/diagrams` serves the mixed-type file catalog.
- `GET /api/diagram` parses one validated relative path and materializes an optional overview variant.
- The server rejects traversal paths, symbolic links, and ignored build directories.
- The browser stores only the editable flow working graph in `localStorage`.
- Browser storage uses the workspace identity and relative source path.
- Browser flow edits do not write back to source files. Overview and wireframe views remain source-backed and read-only.
- Overview source is read-only in the viewer. `Reload source` refreshes visible or focused pages, and a failed refresh keeps the last valid board marked stale until a later success.
- Application Maps are read-only source-backed pages, states, objects, ownership, navigation, and explicit typed references. Page and authored state selection use validated `page` and `state` URL parameters and respond to refresh plus Back or Forward. A valid application is the preferred project home; valid overviews remain the fallback. Application refresh reuses the visible/focused source controller and keeps the last valid board marked stale after failure.
- Application Map pages use a left-to-right graph with arrowed navigation links. ELK places pages and routes orthogonal links. An authored-order fallback remains available. Page nodes show titles; the inspector shows routes and states. Wide graphs scroll horizontally. Numbered edge markers show transition labels and conditions on hover, focus, or tap.
- Application Maps default to a combined Network view. ELK Layered places pages and objects from left to right using directed incoming and outgoing links. Sources come before their targets; return links and cycles remain visible. The application appears as a node only when an explicit ownership link uses it. The application declaration names the document; project objects and ownership hierarchies are optional. Directed links show navigation, ownership with cardinality, and explicit primary objects. Node shapes and link styles distinguish these types. Layer spacing keeps the hierarchy compact, with orthogonal edge routes. Number markers avoid nodes and each other; a short leader connects a marker when its edge has no clear space. The network fits a bounded viewport. A separate camera supports background drag, wheel zoom at the pointer, touch pinch, and keyboard pan or zoom. Fit restores the complete network. Camera changes do not move nodes or change source data. The Pages and objects view remains available through a view switch. The `map` URL parameter preserves the selected view. Layout is temporary and does not change source data.
- Application Map objects are selectable. The inspector shows their parent, children, cardinality, and primary pages, with direct navigation between related objects and pages. Coverage stays below the main map, shows five warnings first, and expands the remaining warnings through a native disclosure.
- Application coverage warnings are non-blocking. They report pages without a wireframe reference, unclaimed nodes in explicitly referenced flows, unclaimed capabilities in explicitly referenced overviews, unclaimed screens in explicitly referenced wireframes, and existing broken planning or artifact links. Folder discovery, inferred links, coverage scores, application variants, and recursive projects are not used.
- The shared shell owns project navigation, the current source path, and overview capability context. Each renderer owns its layout, view, export, reload, screen, shot, reference, and reset controls.
- Flow JSON and overview source exports are browser downloads. Automated browser checks do not verify the browser's download destination.
- Application Maps use the read-only browser renderer and source export path. Capture waits for the application board's ready flag; browser checks do not verify the download destination.
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

Overview diagrams provide a compact, source-backed view of product capabilities. They use ordered groups and title-only controls. Selection shows detail in a fixed inspector. The source tab shows read-only Diagram DSL data. Flow, overview, and wireframe documents share the `.diagram` extension and declare their type in the source header.

An overview can contain groups, ungrouped capabilities, optional purpose and status, and an empty draft. Overview records do not require flow links, wireframe links, goals, or detail. A capability can have optional ordered links to safe relative `.diagram` flow sources, including a selected flow view, and wireframe sources with optional stable screen IDs. Unsafe references are parse errors that prevent loading. Missing, wrong-type, unknown-variant, or removed-screen safe targets show a warning while the overview remains usable. Opening a linked flow or wireframe carries a validated overview path, capability, and temporary view so the artifact can return safely to the overview context.

Each overview shows a compact project flow shelf below its board. The shelf lists the union of valid flow files in the overview's folder and valid flow files referenced by capabilities in the active view. It deduplicates by source path and keeps linked capability titles as navigation context. Folder membership discovers project flows; it does not create semantic links.

Each overview also shows a wireframe shelf below the flow shelf. It lists valid wireframes in the overview folder and valid explicit wireframe references in the active view, deduplicated by source path. Explicit rows preserve capability and first-screen navigation context; folder-only rows remain project inventory without invented links.

The overview reloads source data while it is visible. A refresh keeps the last good view when a read fails and marks the source as stale until a later read succeeds. Overview variants are temporary, read-only views materialized from the shared base; agents can inspect a view and later adopt it by editing the source. Independent browser checks passed for navigation, selection, repaired links, and adoption recovery. See [implementation evidence](intent/visual-idea-overview/final-proof/README.md). The approved board layout remains unchanged.

Nested files belong to one selected project root. Folder discovery does not create recursive folder projects.

## Near-term flow work

1. Improve handoff and deliverable grouping. Test compact visual pairs for a transformation and its artifact.
2. Add graph validation, undo and redo, and safer schema migrations.
3. Test large diagrams, dense crossings, backward edges, and disconnected groups.
4. Improve keyboard access, focus behavior, and inspector behavior on small screens.
5. Decide how diagrams are saved, named, duplicated, imported, and shared.

## Wireframes

Wireframes compress proposed interface ideas into inspectable diagrams. Named renderer-owned themes (`default` and `recipe`) keep the DSL free of CSS. The language has panels, cards as leaf elements, explicit select, toggle, and checkbox controls, and finite button icon, tone, and state options. General grids use `columns=N min=PX` with a minimum of 120 pixels; calendar layouts use that grid instead of a calendar primitive. Quoted wireframe copy supports explicit `\n` line breaks while retaining automatic wrapping. Cards with `goto` remain keyboard and pointer controls; cards without `goto` render as static content. Textareas and lists support plain, ordered, and checkable modes, with checked items and optional remove actions. Authored navigation and native popover triggers work in the viewer. A compact per-screen state selector shows rest, hover, and open states; the removed large progressive-state gallery is not part of the viewer.

Workbench wireframes can embed one real flow or overview scene. An optional footer slot spans the main and inspector columns; frames without footer content keep the current layout. Screen marks target frame slots or rendered element IDs. The viewer keeps marks hidden by default and provides one `Show changes` review mode with authored reasons; its blue mark outlines remain distinct from orange interaction highlighting. Unknown and ambiguous mark targets fail validation. Read-only capture hooks reuse the existing browser layout and routing. Wireframe frame slots reject unknown and duplicate names. Wireframe screen, shot, reference, comparison, sizing, interaction, and mark-review state do not write source. The wireframe viewer does not include a second graph renderer. Arbitrary events, bindings, dialogs, and production UI generation remain outside the first slice.

## Open product questions

- Should one document support variant groups when the tab count becomes large?
- Should the UI add structured controls for common variant operations?
- How should a handoff and its deliverable read as one unit without losing graph semantics?
- Should layout constraints stay semantic, or should users edit lanes and groups directly?
- How should agents propose graph changes while a person reviews them?
- Which export formats matter after JSON?

## Source context

The original prototype and iterations are in [Build Flow Diagram Prototype](https://chatgpt.com/c/6a90df99-1ab0-83ea-883d-9b9c04b69241).
