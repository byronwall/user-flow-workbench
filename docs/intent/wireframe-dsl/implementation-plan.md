# Wireframe implementation plan

Status: first application slice implemented, 2026-08-31. The isolated proof remains as historical evidence.

Build one isolated rendering experiment before a wireframe parser. The experiment must prove that useful edits preserve the expected visual regions.

The application now parses `type wireframe`, renders the fixtures, supports native popovers and screen navigation, and shows disclosure contact sheets. Read-only hooks capture real flow and overview geometry as SVG. The viewer uses those scenes without a second graph renderer.

The first slice passes the capture seam gate. Full screen SVG export, manifests, source maps, and GUI editing remain open.

## Scope and dependencies

Keep this work separate from the ongoing overview delivery. Use the current common `.diagram` dispatcher when integration begins.

The review used an older snapshot. The inspected working tree has newer, uncommitted common-format and overview work. Recheck these files before implementation.

| Existing source | Reuse or planned change |
| --- | --- |
| `src/lib/diagram-dsl.ts` | Extend `parseDiagramWithDiagnostics`, `parseDiagram`, and `diagramToDsl` after the visual proof. |
| `src/types/diagram.ts` | Extend the type union with wireframe; keep separate semantic models. |
| `src/lib/overview-dsl.ts` | Use `materializeOverview` for the requested view; do not copy capabilities. |
| `src/server/flow-catalog.ts` | Reuse `resolveFlowRoot`, `resolveDiagramPath`, and catalog/document loading. |
| `src/routes/api/diagrams.ts`, `src/routes/api/diagram.ts` | Extend current document APIs rather than adding a parallel catalog. |
| `src/routes/index.tsx` | Add wireframe viewer dispatch after the proof. Preserve the picker and current routes. |
| `src/lib/overview-navigation.ts` | Preserve actual overview/flow navigation. Wireframe `goto` remains gallery-only. |
| `src/components/OverviewWorkbench.tsx` | Reuse the current board through a narrow capture boundary. No pure-vector snapshot exists yet. |
| `src/lib/flow-workbench.ts` | Keep `mountFlowWorkbench` in charge of layout and routes. Add only a read-only capture boundary. |
| `src/source-refresh.ts` | Reuse refresh control where suitable; dependency changes must invalidate captures. |
| `src/cli/runtime.ts`, `src/cli/cdp.ts`, `src/cli/contact-sheet.ts` | Reuse server ownership, readiness, cleanup, and sheet generation. |

`formatFlowDiagramSource` exports source, not vector scenes. Existing browser screenshots do not prove pure SVG capture.

`readDiagramDocument` can return a base overview after an invalid variant request. Wireframe capture must reject invalid authored views explicitly.

Do not add `diagram-envelope.ts`. The common dispatcher already exists. Do not repeat completed file renames or create migration tooling.

Use TypeScript, TSX, SolidJS, and pnpm. Do not add dependencies until a measured gap requires one. No package adoption follows from the prior-art review.

## Stage 1: typed-fixture visual proof

Create a small isolated browser surface using the proposed [model](model.ts). Do not write a text parser yet.

Use fixed internal style tokens. Browser Grid/Flex and text layout own geometry. Capture actual boxes and line boxes after fonts and paint settle.

Serialize only the supported elements to standalone SVG. Compare the SVG render with the browser source render at the same viewport.

Typed fixtures can carry spans into their TypeScript source. Do not claim DSL property-span support until Stage 2 proves it.

### Six required fixtures

| Fixture | Starting source | What it must demonstrate |
| --- | --- | --- |
| Current workbench structure | `examples/workbench.diagram`, screen `current` | Real flow scene, fixed toolbar, full-height inspector, historical screenshot beside it. |
| Capability detail | Same file, screen `capability` | Canonical overview, focused capability, active inspector tab at the same time. |
| Linked flow | Same file, screen `linked-flow` | Flow scene with return context and stable remaining bounds. |
| Settings | `examples/settings.diagram` | Useful form without workbench-specific behavior. |
| Narrow error | `examples/narrow-error.diagram` | Long labels, unbroken value, empty state, error, horizontal toolbar overflow. |
| Progressive disclosure | `examples/disclosure.diagram` | Real popover behavior and rest, trigger-hover, and open contact-sheet states. |

The overview and picker scenes are supplemental examples. They must not widen the first proof's scope.

A new screenshot of the running app may supplement the historical reference. Label both dates and states; do not overwrite the original.

### The difficult dependency: semantic snapshots

Mount one flow capture host at a time, with `persist:false`. Wait for the workbench readiness boundary and final layout.

Read final node bounds, rendered label lines, icons, and edge paths. Create a namespaced SVG using those results. Return bounds and minimum text size.

Keep graph materialization, ELK, fallback layout, and edge routing where they are. Never change target source geometry to fit a wireframe.

Use a separate overview snapshot path around the existing board. Preserve canonical grouping and capability focus. Do not rebuild the overview in wireframe cards.

Capture sequentially first. Current DOM IDs and readiness globals make multiple live workbench mounts unsafe to assume. Dispose each host before the next capture.

Reject unknown views and focus IDs before capture. Check source hashes before and after capture to detect changed dependencies.

A raster diagram embed can diagnose progress, but cannot pass the vector gate. A broad renderer extraction or second router triggers STOP.

### Required edit experiments

| Edit | Expected source change | Allowed visual changes | Must stay fixed |
| --- | --- | --- | --- |
| Lengthen capability detail | One screen's inspector text | Inspector wrapping and overflow | Header, main bounds, overview positions and routes. |
| Lengthen a shared toolbar label | One part child label | Every use's bar content and overflow | Header height, top height, main and aside bounds. |
| Reorder a settings field | Move its declaration without changing ID | Settings body order and downstream layout | Source identity and unrelated screens. |
| Change only one shared header instance | Inline that use with valid screen IDs, then edit | That screen's bar content | Other screens and the original part. |

Also reparent a use between compatible slots while keeping its ID. Geometry may change because the slot changes. Its owner/instance identity must not.

Record box comparisons and masked image diffs. Classify unexpected pixels rather than hiding them with a large mask.

Capture twice in one pinned browser/font environment. Treat cross-platform font equivalence as unproved. Check line text and measured bounds as well as pixels.

### Deliverables

Save a review gallery with the actual screenshot beside the generated frame. Include individual nominal SVGs, annotated SVGs, manifests, source maps, and layout records.

Include optional full-content panels for clipped regions. Label them as supplemental. Do not enlarge the nominal SVG to conceal overflow.

Save edit diffs and a short GO / REVISE / STOP decision. Keep fixture inputs beside outputs. Avoid an image-only result.

### Stage 1 gate

GO to parser work only if all six fixtures work without source coordinates or per-screen rendering exceptions.

Require stable region bounds under local edits, readable explicit overflow, matching browser/SVG line breaks, and vector snapshots from existing diagram geometry.

Source and instance identities must survive reorder and reparent operations. A fresh capture must never report success using stale output.

REVISE for a bounded token adjustment or one repeated need for a semantic leaf. Rerun the corpus after the change.

STOP if toolbar wrapping changes body height, two scenes need style escape hatches, or snapshots need a broad workbench rewrite.

Also STOP if text export remains unreliable, identity depends on tree positions, or comparison requires misleading viewport scaling.

A STOP result permits fixed templates with typed data, or the existing static drawing helpers. It does not justify more DSL features.

## Stage 2: parser, validation, and editing records

Start only after Stage 1 passes. Add a wireframe payload parser separately from flow and overview payloads.

Reuse lexical utilities only where contracts match. Preserve existing flow diagnostics and formatting behavior. Do not force frame blocks into the flow parser.

Prove parse → format → parse semantic equality and formatter idempotence. Expect comments to be expendable.

Validate owner-wide IDs, reserved slot IDs, local state, exact parts, slot shapes, references, view/focus IDs, and resource bounds.

Reject uses or diagrams anywhere inside parts. Reject marks targeting missing or nested elements. Reject multiple diagrams or a diagram outside main.

Test unknown commands/options/escapes, duplicate declarations, missing parts, invalid goto, malformed nesting, and missing view. Require stable diagnostic codes and exact spans.

Test declaration and property spans against real source slices. Resolve a rendered shared child to both its declaration and use site.

Do not build a GUI patch engine. Preserve enough information to distinguish edits to one instance from edits to a shared part.

Stage 2 GO requires located errors, stable identities, canonical round trips, and Stage 1 visual results from parsed source.

## Stage 3: workspace and gallery integration

Extend current document dispatch and catalog APIs. Keep source files authoritative. Do not change flow or overview semantics.

Resolve wireframe references from the workspace root. Use existing diagram path checks. Add equivalent checks for PNG/JPEG references without broadening file access.

Test traversal, absolute paths, symlink components, ignored directories, missing files, wrong types, corrupt images, format/extension mismatches, and dimension mismatches.

Treat the reference URL as inert metadata. Bundle allowed local images; do not add remote fetches.

Track hashes for the wireframe, referenced diagrams, and images. A dependency edit must invalidate the result, even if the wireframe source did not change.

Live preview may retain last-valid output with a clear stale indicator. CLI capture must fail when parsing or capture is invalid.

Reuse CLI runtime ownership and cleanup. Ensure failed capture does not leave a server or browser process behind. Retain existing commands unless a proven gap requires an extension.

Add the gallery's screen navigation, reference pairing, clean/annotated view, source links, and debug artifacts. Keep embedded scene interaction read-only.

Test before/after comparison at native dimensions. Different screenshot dimensions require an explicit warning; no stretching or silent cropping.

Stage 3 GO requires current flow/overview regression checks, secure references, fresh dependency capture, and a complete gallery workflow.

## Completion boundary

Completion means parsed source produces the six proven screens and inspectable artifacts through the current workspace workflow.

It does not include a GUI editor, parameters, themes, variants, nested shared parts, bindings, or production UI output.

The implementation report must distinguish type checks, parser tests, browser observations, and SVG inspection. Passing one does not imply the others.
