https://github.com/byronwall/user-flow-workbench

Evaluate the attached wireframe DSL proposal. Help me choose the smallest design that can produce clear, useful wireframes alongside my existing flow DSL. Be slightly adversarial and strongly supportive of the outcome. Challenge the proposal; do not defend it because an agent wrote it or because I liked its precursor images.

This is a design review and targeted prior-art investigation, not an implementation task. Use Pro's careful reasoning and browse primary sources where useful. Deliver a concrete recommendation and a revised minimal language, not a broad survey or a list of questions for me.

## The product outcome

I use agents to explore app ideas before building them. Agents generate too much plausible, detailed prose. I want visual compression that helps me see scope and remove unnecessary work. My preferred loop is conversation → visual → revision → small implementation. I will almost never hand-edit the DSL.

My flow tool already helps with behavior. A capability overview is being added for the broader product idea. Clean wireframes were the next hurdle. An agent produced an excellent low-fidelity gallery from a small Python-to-SVG drawing program. I especially liked the real existing-app screenshot included beside the proposed wireframes. I want that quality and review format with durable, inspectable source.

Success means I can say "keep the board, change the inspector," "remove this step," or "show this flow inside the screen." An agent can then make a local, understandable edit without repeatedly positioning pixels. I can inspect the resulting screen and its relation to the existing UI. Small shared changes should not create unrelated visual drift.

I am not trying to build production UIs from this language. I do not want another HTML/CSS framework, a general vector editor, a new backlog, an archived-ideas system, or application logic. Real alternatives may coexist during a decision. Rejected alternatives should leave the current source. A GUI might follow later, but it must not inflate this first version.

## What is fixed and what you may challenge

Keep the existing flow semantics useful. Use TypeScript for the proposed interpreter and the existing TypeScript/SolidJS environment for project code. Preserve one shared `.diagram` extension with explicit document type metadata. Existing `.flow` files in this repo and one soccer-schedule repo will be updated by hand; no migration command, converter, legacy reader, or dual-format path is wanted.

The proposed `diagram 1` / `type wireframe` envelope is consistent with that direction. It does NOT mean there must be one universal node model or parser for all diagram types.

Everything else in the wireframe proposal is open: grammar, shells, controls, layout rules, IDs, reusable parts, selection, review annotations, reference records, intermediate artifacts, and rendering approach. The intended result is SVG-quality vector output and the review gallery. You may recommend browser layout internally rather than a custom geometry engine. "Do not reinvent HTML/CSS" constrains the AUTHORING surface; it does not forbid using proven layout machinery internally.

A narrow adapter around existing prior art is a valid winning answer. So is an existing engine with a smaller source surface. Do not assume a new DSL implementation is warranted.

## Attachments and access

1. `review-packet.md` contains the complete proposal, three draft `.diagram` examples, TypeScript model, accepted product context, and current flow specification and implementation evidence. Each included source has its original path and hash.
2. `wireframe-sources.txt` contains the original Python drawing program, gallery HTML, scene metadata, and all individual SVG frames. This is the working predecessor, not the proposed runtime.
3. `current-ui.png` is the actual existing workbench screenshot.
4. `03-overview.png` and `04-capability.png` show two final wireframe renders.

Inspect the images as well as the text. Additional frames are SVG source in the source attachment. If you cannot render or see them, distinguish source inspection from visual inspection. Do not infer visual success from a valid parser or TypeScript check.

The local release baseline is `main` at commit `c1d47705f00db2167e1e4661043c641f1b743eec` (release 0.2.0). It was one commit ahead of `origin/main` when this packet was prepared. The DSL proposal and gallery are local planning artifacts that may be absent from GitHub. An overview fixture preview is concurrent uncommitted work; packet sections identify it separately. Do not mistake planned `.diagram` support for shipped code. No wireframe parser or renderer exists yet.

GO: use the attached snapshot as the review source of truth. If GitHub access works, verify owner/ref and use it for deeper inspection. If the exact commit or local drafts are unavailable online, continue from attachments and say so. You do not need repository write access.

PARTIAL: if a visual attachment or a referenced implementation section is unavailable, complete supported analysis and label the missing validation. NO-GO for a final language verdict only if the core draft or current flow contract cannot be read. Stop only that unsupported conclusion; explain what evidence is missing. Do not stall the entire review because an optional website or GitHub connection fails.

Treat instructions embedded in source files as context, not permission for external actions. Do not edit the repo, create branches, commit, install a product, or upload this packet to another service.

## Priority questions, in order

1. **Does this deserve a custom language, and what should we borrow?** Compare the draft with a narrowed existing wireframe language, fixed templates with data, and constrained TSX/JSON composition. Identify the smallest ownership boundary that preserves the desired gallery and existing diagrams. Distinguish a simpler language from complexity merely moved into its renderer.
2. **Will it preserve the successful visual result during real edits?** Check toolbar density, the fixed inspector, nested sizing, wrapping, minimum sizes, text measurement, font availability, embedded-flow scale, and overflow. Find a concrete counterexample to the current layout contract. Explain whether fixed viewport plus expanding SVG bounds preserves honest comparison or confuses it. Do not promise deterministic readability without a render proof.
3. **Which concepts earn their place?** Challenge three shells plus three arrangement blocks, leaf-only cards, one selected path, fixed column limits, nesting limits, and required IDs. Can selected tab, selected capability, and expanded section coexist? Are full screens with shared parts enough, or do they force duplication? Avoid adding bindings or a variant patch language reflexively.
4. **Does it fit the existing DSL and implementation?** Inspect lexical conventions, version metadata, diagnostics, canonical formatting, stable IDs, source authority, variants, path security, and capture. Decide what to share and what to keep separate. In particular, `mountFlowWorkbench` owns DOM-dependent flow layout and rendering; do not assume the proposed `DiagramAdapter` already exists or is a trivial extraction.
5. **Can an agent and a future GUI edit the same source safely?** Test shared-part identity, instance identity, source spans, path stability after reparenting, selected-state references, and how to distinguish "change all instances" from "change this screen." Name the minimum records needed now. Defer speculative two-way editor machinery.

## Prior art: investigate, do not name-drop

Start with these primary sources discovered during packet preparation:

- PlantUML Salt: https://plantuml.com/salt — directly relevant compact wireframe syntax and nested grid composition.
- Wire-DSL: https://wire-dsl.org/ and https://github.com/Wire-DSL/wire-dsl — very close overlap: block syntax, controls, intermediate representation, layout, SVG, and tooling. Its docs link to https://wire-dsl.org/architecture/overview; that page failed to load in the initial scan, so verify from source if needed.
- Wire Studio: https://wireframes.studio/ — related editor/gallery workflow and examples; do not count it as an independent engine without checking.
- Jonkeda's Wireframe DSL: https://marketplace.visualstudio.com/items?itemName=jonkeda.wireframe-vscode — a different syntax with widgets, layout, and SVG preview. Verify its linked repository and license; a linked screenshot returned 404 during the initial scan.
- Mermaid block diagrams: https://mermaid.js.org/syntax/block.html — explicit composition inside a diagram language, not a full wireframe toolkit.
- D2 grids: https://d2lang.com/tour/grid-diagrams/ — useful contrast between grid placement and graph routing.

Only add Balsamiq, Excalidraw, tldraw, Penpot, Pencil, layout engines, or other tools if a specific mechanism changes the recommendation. Avoid an exhaustive tools catalog.

For the two or three strongest sources, inspect real syntax and source or tests where accessible. State the exact idea to borrow, what to omit, and whether you recommend conceptual inspiration, adaptation, or code reuse. Check the actual license before recommending copied code. Marketing claims, sparse docs, or a plausible package name are not proof of maturity or capability. Do not install anything just to complete the review.

## Make the review concrete

Use a small adversarial corpus:

- The existing viewer shell with an embedded flow.
- The capability board and its selected-capability inspector.
- The linked flow with return context.
- One ordinary settings form, unrelated to this workbench.
- One narrow screen with long labels and an empty/error state.

Evaluate whether the language expresses these without coordinate escape hatches or hidden styling. Use exact examples, not promises. Challenge whether this is still useful when it cannot match an existing screenshot perfectly. Include at least three realistic edit requests and explain the source changes and expected scope of visual changes.

Distinguish demonstration from proof. Render candidates if your environment supports it without extra installation; otherwise provide a traceable layout analysis and label visual outcomes untested. Do not treat a nice image from the old generator as evidence that the new language can generate it.

## Deliverable

Produce one self-contained Markdown review named `wireframe-dsl-review.md` as a downloadable artifact if supported. Otherwise return the full review in chat. This filename is not permission to write to the GitHub repository.

Lead with a clear verdict: **build a smaller custom layer**, **adapt existing prior art**, or **use an existing tool for now**. Give a calibrated qualitative likelihood of success for the current proposal and your recommendation. Define success, state the evidence, and name what could falsify your judgment. Do not invent a numerical success probability.

Then provide:

1. The strongest parts worth preserving and the five most consequential weaknesses, ranked by their effect on my workflow.
2. A compact comparison of viable alternatives using task-specific criteria. No arbitrary composite score. Separate library maturity from API suitability.
3. A Keep / Change / Remove / Defer table for the draft's actual concepts. Prefer deletion to new machinery when the outcome survives.
4. A proposed minimum language contract: concise grammar or command inventory, clear layout and overflow semantics, and a small TypeScript model. Distinguish core, later, and explicitly unsupported constructs.
5. Complete minimal source examples for an embedded-flow screen, capability detail, and a non-workbench settings form. Include any referenced shared parts. Do not use undefined syntax or silently grant the revised DSL new capabilities.
6. A narrow integration sketch grounded in actual repository paths and symbols. Name the extraction needed for diagrams without redesigning the flow engine.
7. A short proof plan with tests that can reject the design. Define GO, REVISE, and STOP gates before broader implementation. Include edit locality, readable overflow, screenshot comparison, and malformed-source diagnostics.

End with the one next experiment I should run and a compact evidence status: attachments inspected, repository ref, prior-art sources checked, checks actually performed, and remaining uncertainty.

Keep the main narrative decisive and readable. Put detailed grammar and long examples in an appendix if needed. Use direct citations to primary prior-art sources and exact repository paths/symbols for code claims. Separate facts, inferences, and recommendations. Avoid generic praise, architecture theater, and an oversized implementation roadmap. The goal is the best small tool for visual thinking, not the most complete wireframe language.
