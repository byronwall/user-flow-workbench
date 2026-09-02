# Initial prior-art scan

These notes seed the Pro review. They are not an adoption decision or a runtime evaluation. Sources were inspected during packet preparation on 2026-08-31 UTC.

- [PlantUML Salt](https://plantuml.com/salt) documents wireframe widgets and nested grid composition. It is a direct syntax precedent. Borrowing the restricted control vocabulary is worth testing. Its punctuation syntax is not automatically a good fit for stable agent edits.
- [Wire-DSL](https://wire-dsl.org/) documents block syntax, components, layout containers, SVG output, and programmatic rendering. Its [repository](https://github.com/Wire-DSL/wire-dsl) is linked from its documentation. This is the closest initial candidate for adaptation. The home page has inconsistent component counts. Its architecture page failed to load during this scan. Implementation quality, license, and source-map behavior still need checking.
- [Wire Studio](https://wireframes.studio/) links to Wire-DSL and describes a local editor with templates and exports. Treat it as a related review workflow, not independent confirmation that the engine works.
- [Jonkeda's Wireframe DSL](https://marketplace.visualstudio.com/items?itemName=jonkeda.wireframe-vscode) documents a separate widget language, nested layout, SVG preview, and optional absolute positioning. It may show both useful patterns and the path toward an oversized authoring surface. A linked preview image returned 404. No extension was installed.
- [Mermaid block diagrams](https://mermaid.js.org/syntax/block.html) document explicit columns and nested blocks. They offer composition precedent, not ready-made UI control semantics.
- [D2 grids](https://d2lang.com/tour/grid-diagrams/) document row/column layout and a routing limitation for connections between grid cells. This supports examining diagram layout separately from screen layout. It does not establish that D2 should render the wireframes.

The Pro prompt asks for source and license checks before code reuse. No external code or lengthy source excerpts were copied into this packet.
