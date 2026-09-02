# Wireframe DSL review

**Verdict: build a smaller custom layer.**

Keep the shared `.diagram` envelope, the screenshot-backed review gallery, strict diagnostics, and semantic references to existing diagrams. Do **not** implement the current three-shell/three-arrangement proposal as a custom geometry engine. It is already close to a small HTML/CSS system, but its most important CSS-like behaviors—toolbar alignment, intrinsic sizing, fill, wrapping, overflow, text metrics, and nested height allocation—are either unspecified or internally contradictory.

The smallest defensible ownership boundary is:

- two fixed screen frames: `workbench` and `page`;
- three arrangements: `stack`, `bar`, and `grid`;
- a small fixed set of semantic leaves;
- exact, parameterless shared parts;
- one semantic diagram viewport per workbench screen;
- browser Grid/Flex/text layout internally;
- a pure-SVG transcription step after browser layout;
- a narrow browser-side snapshot hook around the existing flow renderer, not a second graph layout engine.

Before writing a parser, render the adversarial corpus from a typed TypeScript fixture. The text grammar should be the final thin layer over a visual contract that has already survived edits.

## Likelihood and decision standard

**Current proposal unchanged:** low-to-moderate likelihood of meeting the workflow. It has a good product boundary and could probably produce valid, plausible SVGs. It has a substantially lower likelihood of preserving the successful gallery quality and edit locality because those depend on renderer behavior the proposal does not yet define or prove.

**Recommended smaller layer:** moderately high likelihood, conditional on two early proofs:

1. browser layout can be transcribed to portable, readable SVG without font or wrapping drift; and
2. the existing DOM-dependent flow renderer can expose a vector scene snapshot without extracting or duplicating its layout and routing engine.

Success is not “the parser accepts the examples.” Success is all of the following:

- At the nominal viewport, the five-screen adversarial corpus is readable without authored coordinates, CSS, or hidden app-specific layout rules.
- A small source edit changes the intended region and does not move unrelated regions.
- Overflow is visible and diagnosable, not silently clipped, shrunk, or disguised by a larger root SVG.
- An embedded flow remains linked to its semantic source and uses the existing flow layout.
- A rendered element maps back to a source declaration and, when shared, to a particular instance.
- The actual current screenshot remains beside the proposed screen at the same nominal viewport.

The judgment should be falsified if any of these occurs in the first proof:

- two or more corpus screens need coordinates, arbitrary widths, or CSS escape hatches;
- adding one toolbar action changes main-canvas height or diagram scale;
- flow embedding requires a second graph renderer or a broad rewrite of `mountFlowWorkbench`;
- selected-state references break after ordinary reordering or reparenting;
- pure-SVG export materially changes line breaks from the browser layout;
- the “small” language grows part overrides, bindings, custom layout definitions, or a style system before the corpus passes.

## Evidence basis

The review used the attached snapshot as the authority:

- `review-packet.md`, including the complete draft language, examples, TypeScript model, accepted product context, Flow DSL specification, and release-source excerpts;
- `wireframe-sources.txt`, including the original Python geometry program, gallery HTML, metadata, seven SVG scenes, and contact sheet;
- `current-ui.png`, the actual 1280 × 720 workbench capture;
- `03-overview.png` and `04-capability.png`, final rendered wireframes.

All seven predecessor SVG scenes and the contact sheet were also extracted from `wireframe-sources.txt`, rendered in Chromium through Playwright, and visually inspected. The predecessor visuals are evidence of the desired result, not evidence that the proposed DSL can reproduce it. The generator hard-codes coordinates, widths, and several line breaks; for example, the capability board uses fixed `x` increments and an explicit label-splitting table in `docs/intent/wireframe-dsl/reference/original-generator.py.txt`.

The packet identifies the release baseline as `main` at `c1d47705f00db2167e1e4661043c641f1b743eec`, one local commit ahead of `origin/main`. The public repository owner and name were verified as [`byronwall/user-flow-workbench`](https://github.com/byronwall/user-flow-workbench), but that exact commit was not available through GitHub during this review. The local draft wireframe files were also absent online, as the packet warned. Repository-specific conclusions below therefore use the attached source snapshot, not the current public branch.

## What is worth preserving

1. **The product boundary is unusually good.** The draft explicitly excludes production UI generation, arbitrary drawing, application logic, responsive breakpoints, remote assets, and a general editor. Those exclusions should remain requirements, not aspirations.

2. **The common envelope is right.** `diagram 1` plus `type wireframe` fits the accepted direction while allowing separate flow, overview, and wireframe parsers and models. One extension does not justify a universal node model.

3. **The screenshot-backed review artifact is the actual product advantage.** Existing, Proposed, and Annotated modes at the same viewport are more important than a large widget library. Review annotations staying outside clean product content is also correct.

4. **Source authority and staged outputs are sound.** Parse, validate, expand, resolve dependencies, lay out, and render is the right conceptual sequence. `.diagram` must remain the only editable authority; normalized JSON, source maps, layout boxes, manifests, and SVGs are derived evidence.

5. **Strict references and diagnostics fit agent editing.** Unknown options, duplicate identities, cycles, invalid navigation, missing files, stale renders, secure relative paths, and canonical formatting all earn their place. The existing Flow DSL already demonstrates the value of stable diagnostic codes and newline recovery.

## Five consequential weaknesses, ranked by workflow effect

### 1. The layout contract does not preserve edit locality

The strongest visual property in `03-overview.png` and `04-capability.png` is not the card style. It is the stable shell:

- the main region remains 934 pixels wide;
- the inspector remains 346 pixels wide and full height;
- the top toolbar remains a single compact row;
- selecting a capability changes only the board highlight and inspector content;
- the board does not reflow.

The draft cannot derive that toolbar from `row`. Its `overview-header` contains a brand, a type label, and three actions, but `row` has no start/end groups, spacer, justification, intrinsic-width policy, or fixed-height policy. The draft also says rows wrap whole children and headers grow with content. That means a local toolbar edit can change header height, shrink the body, and rescale an embedded flow.

A synthetic browser trace of the draft-like rule demonstrated the failure:

| State | Header height | Main height |
| --- | ---: | ---: |
| Baseline toolbar | 46 px | 674 px |
| Add `Reset file` plus one long action | 92 px | 628 px |

The edit was only in the toolbar; the main region lost 46 pixels. That is exactly the unrelated visual drift the tool is intended to prevent.

A fixed-height `bar` with `start` and `end` groups produced the desired behavior in the same browser trace: header stayed 44 pixels, main stayed 676 pixels, and the added actions produced a detectable 36-pixel horizontal overflow instead of moving the board. That is demonstration of a layout mechanism, not proof of the revised DSL or SVG serializer.

### 2. The proposed diagram viewport assumes the hardest integration already exists

`diagram` is central to the outcome, but the draft treats a `DiagramAdapter` as if it were a normal renderer interface. In the attached release source, `mountFlowWorkbench` in `src/lib/flow-workbench.ts` is a large browser closure that:

- obtains fixed DOM IDs such as `viewport`, `world`, `nodeLayer`, and `edgeLayer`;
- normalizes and materializes flow state;
- measures HTML node boxes;
- runs ELK or fallback placement;
- routes and renders SVG edges;
- renders HTML node cards;
- owns zoom, pan, drag, selection, inspector state, persistence, and readiness.

Its important internal symbols include `renderNodes`, `renderEdges`, `autoLayout`, `getNodeRects`, and `window.__flowWorkbenchReady`. There is no existing type-agnostic `DiagramAdapter`, and extracting one is not trivial.

The draft compounds this by allowing multiple diagram blocks to share remaining space. Multiple live mounts would collide on fixed DOM IDs, duplicate browser state, and complicate SVG ID namespacing. Version 1 should permit **one diagram viewport per screen**. Render each screen separately, then assemble the gallery or contact sheet.

### 3. One structural `select "path"` is the wrong state and identity model

A screen can visibly contain several independent states:

- the Inspector tab is active;
- a capability is selected in the board;
- a source-error notice is visible;
- later, a section might be expanded.

The draft permits one selection path, and selection may target only a card, tab, or list item. It therefore cannot faithfully represent even the attached capability screen if the active Inspector tab and selected capability are both meant to be explicit. An expanded section is not representable at all.

Structural paths also make persisted references fragile. Reparenting `tailor` from one stack to another changes `body/board/groups/drafting/tailor` even if the semantic item did not change. Requiring IDs on every layout and text node adds noise without fixing that problem.

Visible state should live on the element it describes: `state=active`, `state=selected`, or `state=disabled`. Review emphasis should be a separate, repeatable `mark` record. References should use explicit source identities, not tree paths.

### 4. The example duplicates overview semantics and will pressure parts into a component framework

The workbench example writes the capability board again as wireframe cards even though the product direction already has an `overview` document type. That creates two sources for the same capability IDs, labels, grouping, and selection state.

When a canonical overview exists, the wireframe should embed it:

```text
diagram board source="./resume-app.diagram" view=base focus=tailor-resume-to-role
```

The wireframe owns shell context and inspector prose; the overview owns capability content and board layout. This is the same reason a flow is embedded rather than redrawn as cards.

Exact shared parts remain useful for repeated chrome. They should stay parameterless and override-free. A one-off difference can be local content or a second part. Adding bindings or instance patches before repeated evidence appears would turn the language into a component framework.

### 5. Expanding the root SVG makes comparison dishonest

The draft proposes drawing the nominal viewport and growing exported SVG bounds around overflow. That is useful as a diagnostic artifact, but it should not be the comparison artifact.

If two SVGs with different intrinsic dimensions are shown at the same gallery width, the overflowing one is scaled down and its text appears smaller. If shown at one-to-one scale, the frames no longer align. Either behavior makes scope look more compact than it is.

Use two outputs instead:

- `screen.svg`: exactly the declared viewport; this is the gallery and screenshot-comparison artifact;
- `screen-full.svg`: optional one-to-one content extents for overflow inspection.

The viewport artifact must visibly indicate clipped or scrollable edges and report exact excess dimensions. A viewport PNG is not “cropped” in a pejorative sense; it is the truthful screen. The full-bounds artifact is supplemental evidence.

Font handling is another unproved part of the same problem. The predecessor specifies `Arial, Helvetica, sans-serif`; the renderer must wait for `document.fonts.ready`, measure the browser’s actual line boxes, and record the browser version and available font stack. It should not promise cross-machine pixel identity or deterministic readability before render tests.

## Does this deserve a language?

Yes, but only a very small one. The durable source must carry identities, references, visible state, review metadata, and cross-document links in a canonical form that agents can edit. Fixed templates with opaque data are too narrow for the unrelated settings form; unrestricted TSX or HTML is too broad. The winning shape is fixed templates **plus** a constrained semantic tree.

The custom language does not earn a custom layout engine. A smaller authoring surface can still hide a full CSS implementation burden. The proposal currently moves complexity into its renderer rather than deleting it. The recommendation deletes that burden by using browser Grid, Flexbox, intrinsic sizing, and text layout internally while keeping CSS out of the source language.

### Smallest ownership boundary

**Own:**

- the wireframe grammar, AST, formatter, diagnostics, and source map;
- two frame templates and a fixed visual theme;
- the small semantic element set;
- overflow and comparison semantics;
- gallery metadata and review marks;
- a narrow diagram-snapshot request contract.

**Reuse:**

- browser layout and font measurement;
- existing workbench visual tokens in `src/styles.css`;
- existing flow placement and routing in `src/lib/flow-workbench.ts`;
- the overview board renderer when its source format exists;
- workspace path protections from `src/server/flow-catalog.ts`;
- server, Chromium capture, and contact-sheet infrastructure in `src/cli/runtime.ts`, `src/cli/cdp.ts`, and `src/cli/contact-sheet.ts`.

**Do not own:**

- arbitrary geometry;
- an extensible component catalog;
- CSS or style tokens in source;
- custom layout definitions;
- graph routing;
- responsive behavior;
- application events, bindings, or data;
- production component generation.

## Prior art: what to borrow and what to reject

### Wire-DSL: closest overlap, not the recommended runtime

[Wire-DSL](https://wire-dsl.org/) is the closest prior art. Its documented architecture is a TypeScript pipeline from parser to AST, normalized IR, layout, SVG, and exporters. It has a source-map system with source ranges, property ranges, instance wrappers, and `data-node-id` attributes. Its repository is MIT licensed. See the [architecture overview](https://wire-dsl.org/architecture/overview/), [SourceMap documentation](https://wire-dsl.org/architecture/sourcemap/), [repository](https://github.com/Wire-DSL/wire-dsl), and [license](https://github.com/Wire-DSL/wire-dsl/blob/main/LICENSE).

**Borrow conceptually:**

- source nodes and property-value spans carried through the pipeline;
- separate AST, normalized model, layout result, and render output;
- explicit instance wrappers for reusable definitions;
- SVG `data-*` identity attributes;
- a queryable source-map table rather than path-string guessing.

**Do not adapt its language or layout engine for version 1:**

- The public surface already documents 30 components, five layout containers, style configuration, custom components, and custom layouts. That is larger than the intended ownership boundary.
- The source-map documentation calls generated ordinal IDs stable, but the implementation comment in [`packages/engine/src/sourcemap/builder.ts` at `81124edf`](https://github.com/Wire-DSL/wire-dsl/blob/81124edf0e91bb1372934ac3478b45bd3c310b1e/packages/engine/src/sourcemap/builder.ts) states the practical limit: property edits preserve them, while reordering changes them. That does not satisfy stable agent references.
- The layout implementation in [`packages/engine/src/layout/index.ts` at `81124edf`](https://github.com/Wire-DSL/wire-dsl/blob/81124edf0e91bb1372934ac3478b45bd3c310b1e/packages/engine/src/layout/index.ts) estimates wrapping and intrinsic widths with character-width heuristics rather than the browser’s actual font metrics. Its own [layout documentation](https://wire-dsl.org/architecture/layout-engine/) says overflow may clip, expand, or become renderer-dependent.
- It has no native concept of this repository’s flow/overview source, return context, reference screenshot, or workspace path authority. Those hardest requirements would remain custom.

This is a young, sub-1.0 project with promising architecture and a permissive license. Its API suitability, not its code quality, is the reason not to build on it now. Wire Studio is described by Wire-DSL’s own source-map documentation as a web-editor integration, so it is not independent engine evidence.

### PlantUML Salt: borrow compact semantics, not the engine or syntax

[PlantUML Salt](https://plantuml.com/salt) is mature prior art for a restricted widget vocabulary and nested table-like composition. It supports buttons, text fields, checkboxes, lists, nested elements, tabs, menus, and scrollbars. PlantUML is a long-lived Java project under LGPL-3.0; see its [repository](https://github.com/plantuml/plantuml) and [license](https://github.com/plantuml/plantuml/blob/master/COPYING).

**Borrow conceptually:** a small semantic control set can generate useful low-fidelity screens without exposing CSS.

**Omit:** punctuation-heavy widget encoding, raw Creole/HTML, color and skin parameters, manual empty-cell/spacer techniques, and Java/LGPL runtime coupling. Salt’s text-area examples explicitly use dots and space lines to force dimensions; that is the coordinate workaround this product is trying to avoid. It also lacks the explicit IDs, source-instance identity, repository-relative diagram embedding, and screenshot review contract needed here.

### Mermaid blocks and D2 grids: useful contrast, not candidate engines

[Mermaid block diagrams](https://mermaid.js.org/syntax/block.html) deliberately give authors control over block positions. That is appropriate for diagram composition but contrary to the goal of keeping agents out of placement decisions.

[D2 grids](https://d2lang.com/tour/grid-diagrams/) demonstrate another important boundary: once a grid imposes positions, the graph layout engine cannot route connections between its cells and falls back to straight center-to-center segments. D2 also documents invisible elements and explicit widths as alignment techniques. The lesson is to keep screen layout and flow routing separate, not to render this wireframe language with D2.

### Jonkeda’s Wireframe DSL: evidence of the expansion trap

The [VS Code extension](https://marketplace.visualstudio.com/items?itemName=jonkeda.wireframe-vscode) and its [MIT repository](https://github.com/jonkeda/Wireframes) expose 50+ components, themes, widths, heights, gap, padding, alignment, grid coordinates, absolute canvas coordinates, bindings, icons, and navigation. It is a useful example of where a general wireframe language naturally grows. It is not the desired authoring boundary.

## Viable alternatives

| Candidate | Suitability for this workflow | Maturity and ownership consequence |
| --- | --- | --- |
| PlantUML Salt | Compact and proven for ordinary controls, but weak on stable identity, exact workbench shell, source-linked flows, and the reference gallery. | Mature; Java and LGPL-3.0. Adopting it introduces a runtime and still leaves the key integration custom. |
| Wire-DSL engine | Closest syntax and pipeline match. Source maps are useful, but identity is ordinal, layout uses its own text estimates, and the language is already broader than needed. | Young TypeScript/MIT project. Code reuse is legally easy, but the hard project-specific responsibilities remain. |
| Fixed templates with data only | Excellent edit locality for the current workbench and smallest implementation. Breaks on ordinary settings screens or forces a template for each new shape. | No dependency risk. Template count becomes the hidden language. |
| Constrained TSX or JSON | Fastest way to prove the renderer. TSX leaks code and layout decisions; JSON is verbose and poor for conversation-driven diffs. | Use as the temporary proof fixture, not the durable authoring source. |
| **Revised minimal DSL over browser layout** | Covers the workbench, settings form, references, exact parts, state, and semantic diagram embeds without coordinates or CSS. | Small custom parser/model; browser owns layout. Flow snapshot and SVG transcription are the only serious technical risks. |

**Recommendation:** use a constrained TypeScript fixture to prove the last row, then add the text syntax. Do not ship the fixture as the permanent format.

## Adversarial corpus

The revised language must express these screens without coordinates, arbitrary styling, or a new primitive for each app-specific region.

| Corpus screen | Revised expression | Expected behavior and risk |
| --- | --- | --- |
| Existing viewer shell with embedded flow | `frame workbench` + shared header/inspector parts + one `diagram` in `main` | Shell geometry is fixed. Flow uses existing layout. If readable scale would fall below 12-pixel effective text, the main viewport scrolls and reports overflow. |
| Capability board with selected inspector | Same frame + embedded overview with `focus=<capability-id>` + local active tab | Board source remains canonical and does not move when aside content changes. Requires overview snapshot support. |
| Linked flow with return context | One `top` bar with a `link`, then the flow diagram | The intentional extra row reduces main height; changing the link label must not change row height. Long labels overflow horizontally and diagnose. |
| Ordinary settings form | `frame page` + `stack`, `grid`, fields, notice, and action bar | No workbench-specific shell required. At desktop width, fields can use two columns; the renderer does not infer breakpoints. |
| Narrow screen with long labels and error state | Separate 390 × 844 document + `frame page`, one-column stack, `notice kind=error` | Words wrap; unbroken tokens use `overflow-wrap:anywhere`; controls grow vertically. No horizontal crop or font shrink. |

The predecessor gallery remains useful even when it does not exactly match the live screenshot. It succeeds because it preserves the important regions and makes proposed changes legible. Pixel matching of icons, shadows, and graph routes is unnecessary. Failing to preserve toolbar density, inspector width, board stability, or readable embedded-flow scale is not an acceptable “low fidelity” difference.

### Concrete edit-locality requests

1. **“Keep the board; change the inspector.”**
   - Source change: only the `aside` elements in the selected screen.
   - Expected visual scope: the aside subtree; no change to main bounds, board line breaks, or diagram scale.
   - Test: image diff outside the aside mask must be empty except anti-aliasing noise caused by the capture environment.

2. **“Add Reset file to the workbench header.”**
   - Source change: one `button` in the shared header part.
   - Expected visual scope: every header instance changes. Header remains 44 pixels and all main/aside bounds remain identical. If the action cluster no longer fits, show horizontal overflow and a diagnostic; do not wrap.
   - Shared-edit behavior: the agent or GUI must state that all uses of the header part will change.

3. **“Remove Prioritize useful changes.”**
   - Source change: remove that capability from the canonical overview source, not from a wireframe copy.
   - Expected visual scope: the embedded board repacks within `main`. Header and aside bounds remain stable. If that capability was focused, clear focus and show the overview summary or a removed-selection notice.

4. **“Change only this screen’s source label.”**
   - Source change: edit a screen-local `text`, not a shared part.
   - Expected visual scope: one screen. This is the control case that distinguishes a declaration identity from a shared instance identity.

## Keep / Change / Remove / Defer

| Draft concept | Decision | Reason or replacement |
| --- | --- | --- |
| `diagram 1` / `type wireframe` | **Keep** | Correct common envelope with separate type semantics. |
| One viewport per document | **Keep** | Makes comparison explicit. Use another document for another viewport in v1. |
| `reference` with native dimensions and capture state | **Keep** | The screenshot is core evidence. Never fetch its URL automatically. |
| Ordered complete screens | **Keep** | Alternatives can coexist as full scenes and be removed after a decision. |
| `basis=observed|source|proposed` | **Keep** | Useful assertion about evidence status; not implementation proof. |
| Exact shared `part` + `use` | **Keep, narrow** | No parameters, overrides, nested `use`, or variant patches. |
| `goto=<screen>` review navigation | **Keep** | Supports gallery walkthroughs without application logic. |
| Strict parser, canonical formatter, source spans, stable diagnostic codes | **Keep** | Required for agent repair loops and future source selection. |
| Three shells (`split`, `page`, `centered`) | **Change** | Replace with `frame workbench` and `frame page`; `page` owns optional centering/max width. |
| Generic `row` | **Change** | Replace with non-wrapping `bar` with `start` and `end` groups. |
| `columns` limited to two–four | **Change** | Use `grid columns=N`; readable minimum cell width and overflow are layout rules, not grammar limits. |
| `stack` with arbitrary fill semantics | **Change** | Natural vertical flow only. No “remaining height” child except the direct workbench `main` diagram viewport. |
| One screen-level `select "path"` | **Remove** | Put `active`, `selected`, and `disabled` on elements. Use multiple independent states. |
| Structural path references | **Remove** | Use explicit declaration IDs and use-instance IDs. Render paths are derived and non-authoritative. |
| Required ID on every element | **Remove** | Require IDs only for screens, parts, uses, stateful/navigable elements, diagrams, and review targets. |
| Eight-level hard nesting limit | **Remove** | Constrain grammar shape and prohibit nested parts. Emit a complexity warning for deep layout, not an arbitrary syntax failure. |
| Multiple diagram blocks sharing remaining space | **Remove** | One diagram per workbench screen. This matches the outcome and current DOM constraints. |
| Wireframe cards duplicating an overview | **Remove when canonical source exists** | Embed the overview and focus its semantic capability ID. |
| Root SVG expands around overflow | **Change** | Fixed viewport SVG for comparison; optional full-content SVG for inspection. |
| Mandatory `document.json`, `resolved-screen.json`, and `layout.json` products | **Change** | Keep them as optional debug/manifests, not user-facing contract or editable state. |
| Part parameters and per-instance overrides | **Defer** | Add only after repeated real duplication proves exact parts insufficient. |
| Expanded sections / accordion state | **Defer** | Active tab and selected item are core; expansion is not required by the first corpus. |
| Wireframe variants or patch operations | **Defer** | Full screens are sufficient for review alternatives. Rejected alternatives leave source. |
| GUI drag, arbitrary source rewriting, and two-way editor machinery | **Defer** | First GUI may select source, edit values/order, and warn about shared changes. |
| Responsive breakpoints, themes, CSS, arbitrary SVG, icons, and coordinates | **Explicitly unsupported** | They recreate a UI/vector framework and undermine edit locality. |

## Proposed minimum language contract

### Lexical conventions

Reuse the Flow DSL conventions where they truly match:

- one declaration per physical line;
- braces define blocks; indentation is non-semantic;
- JSON double-quoted strings with `\"`, `\\`, and `\n` escapes;
- identifiers match the existing Flow DSL: `[A-Za-z0-9][A-Za-z0-9._-]*`;
- options use `key=value`;
- `#` starts a comment outside a quoted string, including after a declaration;
- unknown commands, properties, states, and escapes are errors;
- source order is preserved;
- the formatter is canonical and comments are expendable, as in the current Flow DSL.

Share a small tokenizer/string/identifier utility, not the flow AST or semantic parser. The common envelope dispatcher reads the first two declarations and delegates with the correct source-line offset.

### Top-level and frame grammar

```text
document    = "diagram 1", NL,
              "type wireframe", NL,
              wireframe, viewport, reference*, part*, screen+ ;

wireframe   = "wireframe", ID, STRING ;
viewport    = "viewport", UINT, UINT ;
reference   = "reference", ID,
              "image=", STRING,
              "width=", UINT,
              "height=", UINT,
              ["captured=", STRING],
              ["state=", STRING],
              ["url=", STRING] ;

part        = "part", ID, "{", element*, "}" ;
screen      = "screen", ID, STRING,
              "basis=", ("observed" | "source" | "proposed"),
              ["reference=", ID],
              "{", mark*, frame, "}" ;

mark        = "mark", TARGET_ID, STRING ;

frame       = workbench | page ;
workbench   = "frame workbench", ["inspector=", UINT], "{",
              header?, top?, main, aside, "}" ;
page        = "frame page", ["content=", UINT], "{", body, "}" ;
```

Frame slot order is canonical, not source-dependent:

- `workbench`: optional `header`, optional `top`, required `main`, required `aside`;
- `page`: required `body`.

`main`, `aside`, and `body` arrange direct children as an implicit vertical stack. `header` contains exactly one `bar`, or one `use` that resolves to a single `bar`. Each direct child of `top` is a `bar`, `tabs`, or a `use` resolving to one of those. When `main` contains a `diagram`, that diagram is its sole child.

A `part` contains elements only. It cannot contain a frame, screen, reference, mark, diagram, or another `use`.

### Element inventory

```text
stack [id] {
  element...
}

bar [id] {
  [start { element... }]
  [end { element... }]
}

grid [id] columns=N {
  element...
}

text [id] "Content" [role=title|heading|body|caption]
badge [id] "Label"
button id "Label" [goto=screen-id] [state=disabled]
link id "Label" [goto=screen-id]
field id "Label" [value="Example"]
card id "Title" [detail="Text"] [goto=screen-id] [state=selected]
notice id "Title" [detail="Text"] [kind=info|warning|error]
rule [id]

use instance-id part-id

tabs id {
  tab id "Label" [goto=screen-id] [state=active]
}

list id {
  item id "Label" [detail="Text"] [goto=screen-id] [state=selected]
}

diagram id source="relative.diagram" view=view-id [focus=semantic-id]
```

Rules:

- Structural and passive elements may omit IDs. IDs are required for screens, parts, uses, diagrams, fields, notices, and all stateful or navigable controls.
- A `mark` may target a frame slot (`header`, `top`, `main`, `aside`, or `body`) or a top-level element/use ID in that slot. Marks do not alter visible state and may repeat.
- `tabs` permits zero or one active tab. Lists and cards may carry independent selected states; there is no global selection exclusivity.
- Cards remain leaf-only. Compound content uses `stack`, `grid`, or `notice`; a card does not become an arbitrary child container.
- `goto` resolves to a screen in the same document. It is gallery navigation only.
- `diagram` is allowed only as a direct child of workbench `main`, and at most once per screen. It may reference only `flow` or `overview`; wireframe embedding and cycles are errors.
- `view` is required. A missing view is never silently replaced with `base`.
- `focus` is validated by the target type and does not change source geometry.
- `grid columns=N` accepts any positive integer. The renderer enforces minimum readable width and reports overflow rather than silently changing the count.

### Layout and overflow semantics

The renderer owns a fixed low-fidelity style. The author may specify only viewport, inspector width, page content width, and grid column count. Typography, gaps, insets, borders, and control heights are versioned renderer tokens for `diagram 1`, never per-document options.

**Workbench frame**

- Intended for desktop review. Validation requires `viewport.width - inspector >= 560`.
- Direct `main`, `aside`, and page `body` content uses the same fixed implicit-stack gap as an explicit `stack`; authors cannot tune it.
- Inspector defaults to 346 pixels and spans full viewport height.
- Header is 44 pixels. Each direct `top` row is a fixed one-line row supplied by `bar` or `tabs`.
- Header and top rows never wrap. Excess horizontal content creates a visible overflow affordance and a diagnostic; it does not change row height.
- Main and aside use `min-width: 0`, `min-height: 0`, and independent overflow.
- Changing aside content cannot change main bounds.

**Page frame**

- Centers a content panel with the declared maximum width, default 720 pixels.
- The panel is clamped to viewport width minus fixed outer insets.
- The page scrolls vertically as content grows. It does not infer responsive breakpoints.

**Containers**

- `stack`: natural vertical flow, fixed gap, children grow with wrapped content.
- `bar`: one non-wrapping horizontal line; `start` is left-aligned and `end` is right-aligned. Children use natural width.
- `grid`: CSS Grid equivalent of `repeat(N, minmax(180px, 1fr))`. If the required minimum width exceeds the container, the grid keeps its column count and overflows horizontally with a diagnostic.

**Text and controls**

- Browser layout runs after `document.fonts.ready` and two animation frames.
- Text wraps at word boundaries. Unbroken tokens use `overflow-wrap:anywhere`.
- No title ellipsis, hidden words, or font shrinking.
- Cards, fields, notices, and list items grow vertically.
- Text inside a `bar` stays on one line; overflow is explicit.

**Diagram viewport**

- The target renderer produces its normal semantic scene.
- The viewport scales the scene only until its smallest effective text reaches 12 pixels.
- If fitting would go below that threshold, keep the minimum readable scale, show internal overflow, and report excess bounds.
- Never mutate target node positions or routes to make the screen fit.
- Never expand the wireframe root to hide diagram overflow.

**Artifacts**

- `screen.svg`: exact nominal viewport, used for gallery comparison.
- `screen-full.svg`: optional full content/scroll extents at one-to-one scale.
- `render-manifest.json`: source hashes, target hashes, viewport, overflow extents, browser build, font stack availability, and diagnostics.
- `source-map.json` and `layout.json`: optional debug evidence. They are never editable authority.

### Core, later, and unsupported

**Core:** everything in the grammar above, source spans, property spans, secure relative references, canonical formatting, clean/annotated SVG, and gallery navigation.

**Later, only after evidence:** part parameters, localizing a shared instance, expanded sections, multiple viewports in one document, and a GUI that patches property spans.

**Unsupported:** CSS, style tokens, themes, arbitrary SVG/HTML, coordinates, element widths/heights, breakpoints, event handlers, bindings, remote assets, wireframe embedding, multiple diagrams per screen, production code generation, component definitions, layout definitions, and wireframe variant operations.

## Small TypeScript model

```ts
export type Id = string;

export interface SourcePoint {
  line: number;
  column: number;
}

export interface SourceSpan {
  file: string;
  start: SourcePoint;
  end: SourcePoint;
}

export interface Located {
  span: SourceSpan;
  propertySpans: Record<string, SourceSpan>;
}

export interface Navigation {
  goto?: Id;
}

export type Element =
  | (Located & {
      kind: "stack";
      id?: Id;
      children: Element[];
    })
  | (Located & {
      kind: "bar";
      id?: Id;
      start: Element[];
      end: Element[];
    })
  | (Located & {
      kind: "grid";
      id?: Id;
      columns: number;
      children: Element[];
    })
  | (Located & {
      kind: "text";
      id?: Id;
      text: string;
      role: "title" | "heading" | "body" | "caption";
    })
  | (Located & { kind: "badge"; id?: Id; text: string })
  | (Located & Navigation & {
      kind: "button";
      id: Id;
      label: string;
      state?: "disabled";
    })
  | (Located & Navigation & {
      kind: "link";
      id: Id;
      label: string;
    })
  | (Located & {
      kind: "field";
      id: Id;
      label: string;
      value?: string;
    })
  | (Located & Navigation & {
      kind: "card";
      id: Id;
      title: string;
      detail?: string;
      state?: "selected";
    })
  | (Located & {
      kind: "notice";
      id: Id;
      title: string;
      detail?: string;
      noticeKind: "info" | "warning" | "error";
    })
  | (Located & { kind: "rule"; id?: Id })
  | (Located & { kind: "tabs"; id: Id; tabs: Tab[] })
  | (Located & { kind: "list"; id: Id; items: ListItem[] })
  | (Located & { kind: "use"; id: Id; partId: Id })
  | (Located & {
      kind: "diagram";
      id: Id;
      source: string;
      view: Id;
      focus?: Id;
    });

export interface Tab extends Located, Navigation {
  id: Id;
  label: string;
  state?: "active";
}

export interface ListItem extends Located, Navigation {
  id: Id;
  label: string;
  detail?: string;
  state?: "selected";
}

export type Frame =
  | {
      kind: "workbench";
      inspector: number;
      header: Element[];
      top: Element[];
      main: Element[];
      aside: Element[];
    }
  | {
      kind: "page";
      content: number;
      body: Element[];
    };

export interface Screen extends Located {
  id: Id;
  title: string;
  basis: "observed" | "source" | "proposed";
  referenceId?: Id;
  marks: Array<{ target: Id; reason: string; span: SourceSpan }>;
  frame: Frame;
}

export interface Part extends Located {
  id: Id;
  children: Element[];
}

export interface ReferenceImage extends Located {
  id: Id;
  image: string;
  width: number;
  height: number;
  captured?: string;
  state?: string;
  url?: string;
}

export interface WireframeDocument extends Located {
  version: 1;
  type: "wireframe";
  id: Id;
  title: string;
  viewport: { width: number; height: number };
  references: ReferenceImage[];
  parts: Part[];
  screens: Screen[];
}

export interface SourceIdentity {
  owner: { kind: "screen" | "part"; id: Id };
  elementId?: Id;
  span: SourceSpan;
  propertySpans: Record<string, SourceSpan>;
}

export interface InstanceIdentity {
  screenId: Id;
  useId?: Id;
  partId?: Id;
}

export interface RenderNodeIdentity {
  // Derived for this render; never stored in source references.
  renderKey: string;
  source: SourceIdentity;
  instance: InstanceIdentity;
}

export interface Diagnostic {
  code: string;
  severity: "error" | "warning";
  message: string;
  source: SourceSpan;
  elementId?: Id;
}
```

The important deletion from the draft model is `ElementPath` as persistent identity. A rendered breadcrumb may still exist for inspection, but source references use explicit IDs and instance tuples.

## Complete minimal source examples

### Workbench document: capability detail, embedded flow, and return context

This is one complete document so the shared parts and `goto` destinations are real. It assumes two valid sibling documents:

- `resume-app.diagram`, `type overview`, with view `base` and capability ID `tailor-resume-to-role`;
- `resume-flow.diagram`, `type flow`, with view `base`.

```text
diagram 1
type wireframe
wireframe resume-review "Resume app review"
viewport 1280 720

reference current image="./current-ui.png" width=1280 height=720 captured="2026-08-30" state="Base resume flow; node inspector open"

part overview-header {
  bar appbar {
    start {
      text brand "User Flow Workbench" role=heading
      badge document-type "Overview"
    }
    end {
      button reload "Reload source"
      button diagrams "All diagrams"
      button export "Export JSON"
    }
  }
}

part flow-header {
  bar appbar {
    start {
      text brand "User Flow Workbench" role=heading
    }
    end {
      button layout "Auto layout"
      button fit "Fit"
      button add "Add node"
      button duplicate "Duplicate" state=disabled
      button delete "Delete" state=disabled
      button diagrams "All diagrams"
      button export "Export JSON"
      button reset "Reset file"
    }
  }
}

part diagram-tabs {
  tabs source-tabs {
    tab inspector "Inspector" state=active
    tab source "Diagram DSL · Read only"
  }
}

part flow-inspector {
  tabs source-tabs {
    tab inspector "Inspector" state=active
    tab source "Flow DSL"
  }
  text nodes-title "Nodes" role=heading
  text nodes-help "Select a node to inspect its details."
  list nodes {
    item posting "Target job posting" detail="Input"
    item evidence "Career evidence" detail="Input"
    item draft "Draft targeted changes" detail="Process"
    item review "Human approval" detail="Handoff"
    item resume "Tailored resume" detail="Deliverable"
  }
}

screen capability "Selected capability" basis=proposed reference=current {
  mark aside "Show the capability detail and its related flow."
  frame workbench inspector=346 {
    header {
      use header overview-header
    }
    main {
      diagram board source="./resume-app.diagram" view=base focus=tailor-resume-to-role
    }
    aside {
      use tabs diagram-tabs
      text type "Capability" role=caption
      text title "Tailor a resume to a role" role=title
      text group "Drafting" role=caption
      text detail "Draft focused changes using the user's evidence and the selected job requirements."
      rule
      text related-title "Related flows" role=heading
      card related-flow "Tailor a resume to a job posting" detail="Open flow →" goto=linked-flow
      notice no-link "No link is also a valid state" detail="Capabilities can precede flows." kind=info
      rule
      text source-status "Source current · Edit through your agent." role=caption
    }
  }
}

screen linked-flow "Flow opened from a capability" basis=proposed reference=current {
  mark top "Preserve the originating overview and capability context."
  frame workbench inspector=346 {
    header {
      use header flow-header
    }
    top {
      bar return-context {
        start {
          link return "← Resume app / Tailor a resume to a role" goto=capability
        }
      }
    }
    main {
      diagram workflow source="./resume-flow.diagram" view=base
    }
    aside {
      use inspector flow-inspector
    }
  }
}
```

This explicitly proves that an active inspector tab and a focused capability can coexist. An expanded section is not part of the core language.

### Non-workbench settings form

```text
diagram 1
type wireframe
wireframe notification-settings "Notification settings"
viewport 1280 720

screen settings "Notification settings" basis=proposed {
  frame page content=680 {
    body {
      stack form {
        text title "Notification settings" role=title
        text purpose "Choose where and when product updates are delivered."
        rule
        grid fields columns=2 {
          field address "Delivery address" value="alex@example.com"
          field timezone "Time zone" value="America/Indiana/Indianapolis"
          field cadence "Digest cadence" value="Weekly"
          field quiet-hours "Quiet hours" value="9:00 PM–7:00 AM"
        }
        notice preview "Next delivery" detail="Monday at 8:00 AM local time." kind=info
        bar actions {
          end {
            button cancel "Cancel"
            button save "Save settings"
          }
        }
      }
    }
  }
}
```

### Narrow long-label and error fixture

This fourth source is part of the adversarial corpus, even though only three examples were required.

```text
diagram 1
type wireframe
wireframe narrow-settings-error "Narrow settings error"
viewport 390 844

screen save-error "Save error" basis=proposed {
  mark body "Verify readable wrapping at the narrow viewport."
  frame page content=680 {
    body {
      stack form {
        text title "Notification settings with a deliberately long title" role=title
        field account "Delivery address" value="alexander.really.long.account.identifier@example.invalid"
        notice save-failure "Could not save settings" detail="AccountPolicyIdentifierThatCannotBreakNaturallyButMustRemainReadable" kind=error
        button retry "Try again"
      }
    }
  }
}
```

A synthetic browser-layout trace of these revised rules kept the 390-pixel viewport free of horizontal overflow. The 300-pixel error notice grew to about 85 pixels high; a long ordinary card grew to about 85 pixels; and an unbroken token card grew to about 65 pixels. This demonstrates browser wrapping behavior only. It does not prove the parser, fixed visual theme, or SVG transcription.

## Agent and future-GUI editing safety

The minimum identity records needed now are:

1. **Source declaration identity**
   - owner kind and owner ID: screen or part;
   - explicit element ID when present;
   - whole-node source span;
   - property-value spans for editable values.

2. **Use instance identity**
   - screen ID;
   - `use` instance ID;
   - part ID;
   - source span of the use site.

3. **Render identity**
   - a derived render key;
   - source declaration identity;
   - optional use instance identity;
   - computed bounds.

4. **Resolved reference table**
   - `goto` → screen;
   - `use` → part;
   - `diagram` → secure file/type/view;
   - `focus` → semantic target ID;
   - `mark` → slot or top-level ID.

A render path may be shown as a breadcrumb, but it is not source identity and is never persisted. Reparenting an element while preserving its ID keeps the source identity. Reparenting a `use` while preserving its use ID keeps the instance identity. Its visual breadcrumb may change, which is harmless.

When a selected rendered node came from a part, a future GUI has enough information to say:

- **Edit shared part:** all instances change; or
- **Make this screen local:** copy the part contents into the screen, then edit the local declaration.

The second operation can be deferred. There should be no hidden per-instance override record in version 1.

## Integration sketch grounded in the snapshot

### 1. Common envelope, separate payload parsers

Add a small type dispatcher, for example `src/lib/diagram-envelope.ts`, that validates:

```text
diagram 1
type flow|overview|wireframe
```

Then delegate:

- flow payload → existing flow parser through a wrapper with source-line offsets;
- overview payload → overview parser;
- wireframe payload → new `src/lib/wireframe-dsl.ts`.

Do not create a universal `DiagramDocument` node model. A narrow catalog union is sufficient. Rename the known `.flow` files by hand, update their headers and references, and then accept `.diagram` only. Add no converter, migration command, legacy reader, or dual-format path.

The current `src/lib/graph-dsl.ts` tokenizer already handles quoted strings, arrays, comments, and newline recovery. Extract shared lexical helpers only if the contracts stay identical. Preserve `parseGraphDslWithDiagnostics` behavior and diagnostic shape; do not force wireframe blocks into the flow command-stage parser.

### 2. Path authority

Extract the workspace-root and relative-path checks from `src/server/flow-catalog.ts` into a type-neutral helper. Use it for:

- diagram discovery;
- wireframe `diagram` references;
- reference images;
- overview flow references.

Continue rejecting absolute paths, traversal, symbolic-link components, ignored build directories, and remote assets. `reference url=` remains inert metadata.

### 3. Wireframe renderer

Create a separate SolidJS surface rather than extending the imperative flow controller:

- semantic model → fixed SolidJS component tree;
- CSS Grid/Flex in an isolated renderer route;
- wait for fonts and stable layout;
- collect line boxes and element bounds;
- transcribe only the allowed component set to pure SVG;
- attach source/instance identities as `data-wireframe-*` attributes.

The author never sees or supplies CSS. Using browser layout internally is not an HTML/CSS authoring surface.

### 4. Flow snapshot: the only required extraction

Do not extract a universal workbench or graph engine. Keep `mountFlowWorkbench` responsible for flow materialization, node placement, routing, and final DOM-dependent geometry.

Add a browser-only read-only capture hook near the existing render/readiness boundary:

1. Mount with `persist:false` in an isolated capture host.
2. Wait for `window.__flowWorkbenchReady.status === "ready"`.
3. Read final node bounds from the rendered node layer and final edge paths from `edgeLayer` after `renderEdges`.
4. Convert the allowed node cards, icons, labels, and existing paths into a namespaced SVG scene.
5. Return bounds, minimum readable scale, source hash, and diagnostics.

This can be an internal `captureFlowScene()` function or route response. It is not an existing `DiagramAdapter`, and it should not expose mutations. The renderer must reuse the routes that `mountFlowWorkbench` already produced.

If this hook requires pulling ELK, routing, and interaction state into a new generic renderer, stop. A temporary raster embed may be acceptable as an explicitly labeled proof artifact, but it does not satisfy the final vector requirement and must not be called complete.

### 5. Existing UI and capture infrastructure

- `src/routes/index.tsx`: dispatch selected `.diagram` files by declared type; keep the picker pattern.
- `src/components/Toolbar.tsx` and `src/components/VariantBar.tsx`: visual references only where behavior matches; do not force common internals.
- `src/styles.css`: source of shared low-fidelity tokens, scoped into the wireframe renderer.
- `src/cli/runtime.ts`: reuse server ownership and cleanup.
- `src/cli/cdp.ts`: reuse browser readiness, final-paint, and capture orchestration.
- `src/cli/contact-sheet.ts`: reuse native-size sheets and SVG pagination.
- `src/types/overview.ts` and `src/data/overviews/resume-app.ts`: concurrent fixture evidence, not proof of a shipped overview parser.

Do not extend `window.flow` broadly for wireframe operations. A single internal scene-capture capability is enough.

## Proof plan with rejection gates

Build the proof from the TypeScript model, not the text grammar. Use the actual reference screenshot and real flow source. No package installation is required for the browser-layout part.

### Structural checks

- Normalize the typed fixtures into the proposed model.
- Validate duplicate IDs, missing parts, invalid `goto`, invalid `mark`, more than one diagram, diagram in the wrong slot, missing view, cycles, and unknown target type.
- When the parser is added, require parse/format/parse equality and idempotent formatting.
- Verify source spans and property spans survive part expansion.
- Verify path traversal, absolute paths, and symlink components are rejected with temporary roots.

### Visual and locality checks

Render all five corpus screens at their declared viewports and inspect individual SVGs, not only a contact sheet.

- Compare the workbench shell against `current-ui.png` and the predecessor gallery.
- Verify header, main, and aside bounding boxes exactly before and after each local edit.
- Verify no text is ellipsized or below 12 effective pixels.
- Verify overflow indicators and manifest excess dimensions.
- Verify `screen.svg` stays at the nominal viewport while `screen-full.svg` exposes full extents.
- Use masked screenshot diffs for the three edit requests. Record both intended changed regions and unexpected changed pixels.
- Repeat capture in the same browser environment to distinguish renderer nondeterminism from cross-environment font differences.

### Source and instance checks

- Change a shared header label and confirm all instances update while use IDs remain stable.
- Reorder a screen-local field and confirm its explicit source identity survives.
- Reparent a `use` from `header` to `top` while preserving the use ID; the render breadcrumb may change, the instance identity must not.
- Select a shared child in the rendered SVG and resolve both the part declaration and the use instance.
- Confirm the tool can distinguish “change all instances” from “change this screen”; version 1 may reject the latter rather than invent an override.

### Diagram checks

- Embed the real resume flow using the existing final routes.
- Change one flow title and confirm the wireframe updates through the flow source, with no copied node list in the wireframe.
- Force a flow too wide for readable fit and verify internal overflow instead of root expansion or font shrink.
- Namespace all SVG IDs so repeated exported screens can coexist in a contact sheet.

### Malformed-source checks

At minimum, verify stable, located diagnostics for:

- unknown element and option;
- duplicate screen/part/control ID;
- missing or cyclic part;
- `use` inside a part;
- invalid `goto`;
- missing diagram file, wrong type, or missing view;
- invalid focus ID;
- more than one diagram;
- mark targeting a nested or missing element;
- reference dimension mismatch;
- overflow warning with exact excess.

### Gates

**GO** when:

- all five corpus screens render without coordinates, CSS, or hidden per-screen code;
- the three locality edits stay within their expected regions;
- long text and diagram overflow remain readable and explicit;
- pure SVG matches browser line breaks;
- flow capture reuses existing layout and routing;
- source and instance selection work after reorder/reparent tests;
- malformed inputs produce stable located diagnostics.

**REVISE** when:

- one missing semantic leaf is repeatedly needed across the corpus;
- a frame token or overflow affordance needs adjustment;
- exact parts cause one clear duplication but no override machinery is yet necessary;
- SVG transcription has small, bounded text differences that can be fixed without author controls.

**STOP** when:

- two or more scenes need coordinates, widths, style options, or custom layouts;
- toolbar edits reflow the body;
- readable embedded flows require source-geometry mutation;
- vector capture requires a second layout/router or a broad `mountFlowWorkbench` rewrite;
- identity depends on sibling order or structural paths;
- the renderer cannot produce honest fixed-viewport comparisons.

A STOP result does not invalidate the visual-thinking workflow. Fall back to fixed templates plus typed data, or continue the small static SVG generator with stricter helper functions and source manifests. Do not answer a failed proof by adding more DSL.

## One next experiment

Build one isolated typed-fixture renderer for exactly these five screens, using the revised two-frame model and browser layout. Add the narrow flow-scene capture hook to `mountFlowWorkbench`, serialize the result to pure SVG, and run the three locality edits before writing any wireframe parser.

The experiment should produce:

- the actual current screenshot;
- five nominal-viewport SVGs;
- any full-content overflow SVGs;
- a contact sheet/gallery;
- render manifests with bounds and source hashes;
- masked edit diffs;
- a short GO / REVISE / STOP result.

The key question is not whether the model can draw the approved screens once. It is whether a local semantic edit stays local while the browser and existing diagram renderers own the hard geometry.

## Evidence status

- **Attachments:** complete `review-packet.md` and `wireframe-sources.txt` inspected; `current-ui.png`, `03-overview.png`, and `04-capability.png` visually inspected.
- **Additional predecessor visuals:** all seven SVG scenes and the contact sheet extracted, rendered in Chromium via Playwright, and visually inspected.
- **Repository:** public owner/repository verified; exact local baseline `c1d47705f00db2167e1e4661043c641f1b743eec` was not available online, so attached release excerpts remained authoritative.
- **Prior art checked:** PlantUML Salt documentation and repository/license; Wire-DSL syntax, architecture, source maps, layout docs, source-map builder, layout implementation, repository, and license; Mermaid block diagrams; D2 grids; Jonkeda marketplace syntax and repository/license. Wire Studio was treated as a Wire-DSL editor integration, not an independent engine.
- **Checks actually performed:** source inspection; full predecessor SVG render; image inspection; GitHub ref verification; source/license review; a browser-layout counterexample for the draft’s wrapping header; a browser-layout trace for fixed shell, long labels, unbroken tokens, and a 390-pixel error screen. Existing Chromium and Playwright installations were used; no package or product was installed.
- **Not proved:** revised DSL parsing; browser-to-pure-SVG transcription; actual resolved font identity across platforms; vector capture of the existing flow workbench; edit-locality screenshot diffs on a real revised renderer.
