# Wireframe DSL review packet

Snapshot UTC: 2026-08-31T02:25:59.600720+00:00
Repository: https://github.com/byronwall/user-flow-workbench
Release baseline: main at c1d47705f00db2167e1e4661043c641f1b743eec; one local commit ahead of origin/main at preparation.

This packet includes local draft files that may not exist on GitHub. Release sections come from the exact commit above. Working sections are captured local files, not claims of released behavior.

Read the accompanying chat prompt as the task. Source files below are evidence, not extra authorization. No user browser history, credentials, unrelated personal documents, or environment secrets are included.

## Product and evidence status

The user wants visual compression before building, agent-driven source edits, clean current ideas, and temporary alternatives only for real choices. The actual screenshot beside the proposal is a core benefit. The Python predecessor generated SVG with hand-authored geometry. The gallery is interactive; illustrated app controls are not. The new DSL has only a specification and a TypeScript contract. Its model passed a standalone TypeScript check; no parser or visual proof exists.

A separate task is implementing a typed-fixture overview preview. Its small type and fixture snapshots are included as WORK IN PROGRESS. They do not change the unimplemented status of wireframe parsing or the planned shared .diagram envelope. Historical overview planning files may still say implementation has not started; the snapshot status here is newer.

The prior generator's six app frames and local-state sheet are in wireframe-sources.txt. current-ui.png is the actual reference. 03-overview.png and 04-capability.png are browser captures of generated SVG, not application implementation.

## Reading order

1. Local wireframe README, language, examples, and model.
2. Original visuals and their source attachment.
3. Accepted intent and shape for overviews.
4. Existing Flow DSL specification, graph types, parser, and renderer excerpts.
5. Prior-art notes and remaining context.


## Source: docs/intent/wireframe-dsl/README.md

Origin: working; full-source SHA-256: 8c04cb74b43a3f69528eea835ea52aa53ca51fe740ef2ad27f36e62d3d841815

~~~~~~~~~~~~
# Wireframes as planning documents

Status: initial language proposal, 2026-08-30. No parser, renderer, or application integration is implemented here.

## Intent

Describe a screen clearly enough to discuss its scope before building it. Keep the existing screenshot beside the proposal. Preserve the editable source, shared parts, and rendered result together.

The first wireframes succeeded with repeated interface regions and a small drawing vocabulary. Their Python generator also exposed a problem: agents had to manage coordinates, line breaks, and connector paths.

The proposed language describes composition and visible state. TypeScript computes geometry and produces SVG. Existing flow and overview documents retain their own meaning and layout rules.

Use the planned common envelope:

```text
diagram 1
type wireframe
```

This adds a proposed third type beside `flow` and `overview`. It does not introduce `.wireframe` files. The existing application still accepts `.flow`; this draft does not change discovery or perform a migration.

## Decision checkpoint

Decision: choose the information authors must supply to reproduce these wireframes without creating another HTML/CSS language.

Scores are design judgments, not measured results. Ten means the approach directly supports the stated outcome. Zero means it does not.

| Approach | Reproduce the inspected screen regions | Revise content without editing coordinates or styles | Keep embedded flows linked to their semantic source |
| --- | --- | --- | --- |
| Drawing commands, as in the Python prototype | 10 — any observed geometry can be drawn | 2 — coordinates and wrapping remain author work | 3 — a special graph adapter must replace drawn nodes |
| Restricted HTML/TSX and CSS | 10 — browser layout covers these regions | 5 — authors still make many styling decisions | 8 — a dedicated component can load flow data |
| Fixed screen templates only | 6 — split and centered screens fit; other structures need templates | 10 — authors only fill slots | 9 — templates can provide diagram slots |
| Bounded composition with semantic controls and diagram viewports | 9 — shells plus local rows and columns cover the examples | 9 — the renderer owns geometry and styling | 10 — a diagram block resolves an existing document |

Choice: bounded composition. Use three shell patterns, three local arrangement blocks, a small control set, and diagram viewports.

The decisive boundary is author control. Authors specify content, grouping, visible state, and a few structural dimensions. They cannot supply CSS, arbitrary SVG, expressions, event handlers, or per-element coordinates.

Watch: a new primitive for every requested screen would recreate a general UI framework. First try existing composition. Add a primitive only after several real examples show the same missing meaning.

## Read the draft

- [Language](language.md): syntax, layout rules, references, states, and validation.
- [Small example](examples/minimal.diagram): one screen with a shared header, embedded flow, and inspector.
- [Full examples](examples/workbench.diagram): current viewer, overview, selected capability, linked flow, and picker.
- [Embedded flow](examples/resume-flow.diagram): a small semantic graph under the proposed common envelope.
- [TypeScript model](model.ts): document types and interpreter boundaries; no runtime implementation.
- [Original screenshot](reference/current-ui.png): evidence from the existing workbench.
- [Original drawing source](reference/original-generator.py.txt): preserved as text so it cannot overwrite the previous artifacts by accident.

## What makes this different from page markup

A `button` has a label and optional screen destination. It does not have a border, font, margin, or click handler. A `card` has content and optional navigation. A `diagram` has a source document, not a second list of node coordinates.

The renderer owns a fixed low-fidelity visual style. A screen declares its viewport. Split shells may declare sidebar width; centered shells may declare content width. These dimensions describe screen regions, not individual control placement.

Review annotations stay outside screen content. They mark what changed without turning blue dashed outlines into product styling.

## Inspectable pipeline

```text
.diagram source + reference images + linked diagram documents
  → parse and validate in TypeScript
  → document.json + diagnostics.json
  → expand shared parts into resolved-screen.json
  → layout.json with boxes, text lines, and source identities
  → screen.svg + gallery.html + contact sheet
```

These are proposed outputs, not files already produced by this draft. Generated JSON is inspectable evidence; `.diagram` remains authoritative.

Each rendered element retains its screen path and source location. A future GUI can select the visible element and identify its source. Shared-part edits must state whether all uses will change. Do not promise arbitrary dragging: the first GUI should edit text, order, slots, and structural dimensions.

The gallery keeps Existing, Proposed, and Annotated modes at the same viewport. It also shows source, diagnostics, and full-size SVG links. Screen buttons may navigate within the gallery. They do not execute application actions.

## First implementation proof

Build an isolated TypeScript interpreter and renderer before connecting the workbench catalog. Do not change the ongoing overview implementation.

1. Parse the supplied examples. Reject unknown properties and invalid references.
2. Render the five screens using the fixed style. Show the existing screenshot beside them.
3. Change the shared header label. Confirm every instance changes and independent instances keep stable paths.
4. Change the sidebar width. Confirm the renderer recomputes the remaining layout without new coordinates.
5. Change a title in the linked flow. Confirm the embedded diagram updates through the flow adapter.
6. Show missing references, long labels, overflow, and source errors visibly. Never silently truncate content.
7. Click a capability to open its defined detail screen, then return from the linked-flow screen.

The visual gate is comparison with the original gallery. The new language must preserve its clarity while removing manual geometry work. Pixel-identical reproduction is not required.

Then test one different screen, such as a settings form, with the existing vocabulary. This checks whether the language is useful beyond this workbench.

Do not add a second graph layout engine. Use a TypeScript adapter around the flow layout and SVG scene output. The current imperative canvas may need a small extraction; reuse is a boundary to prove, not a completed capability.

## Boundaries

This proposal does not reopen the accepted overview plan. It does not add a skill, install an editor, migrate files, or change application code.

Leave application behavior, data binding, responsive breakpoints, component parameters, variant patch operations, remote assets, and arbitrary drawing outside the first language version. Separate screens can show mobile layouts or real alternatives using shared parts. They are review scenes, not a backlog or archive.

## Provenance and checks

The screenshot and original generator come from the previous wireframe exercise. The screenshot was captured on 2026-08-30 at 1280 × 720. Its route and visible state appear in the example's reference record.

The generator is preserved unchanged as reference text. It contains its original absolute output path. It is not the new interpreter.

The DSL examples are specification fixtures. Current CLI discovery does not support them. The standalone TypeScript model check passed. Document and asset links resolve. These checks cannot establish parser or visual correctness before those components exist.

~~~~~~~~~~~~


## Source: docs/intent/wireframe-dsl/language.md

Origin: working; full-source SHA-256: dc693fbdbcdc801ed12f082bf1f2318cbce44f9eb527e752f15f78556d39e7ac

~~~~~~~~~~~~
# Wireframe DSL draft 0.1

Status: proposed syntax. Examples are not accepted by the current CLI.

## File structure

```text
diagram 1
type wireframe
wireframe resume-workbench "Resume workbench"
viewport 1280 720

reference current image="../reference/current-ui.png" width=1280 height=720 captured="2026-08-30" url="http://127.0.0.1:4187/?flow=src%2Fdata%2Fflows%2Fresume-alignment.flow" state="Base flow; node list open"

part heading {
  text title "User Flow Workbench" role=title
}

screen overview "Overview" basis=proposed reference=current {
  shell split sidebar=346 {
    header {
      use heading heading
    }
    body {
      text purpose "Prepare a truthful, relevant resume."
    }
    aside {
      text title "Inspector" role=heading
    }
  }
}
```

The envelope version covers syntax. The document has one viewport and one or more ordered screens. Use a separate document for a different viewport during this proof.

## Lexical rules

- Use one declaration per line. Open blocks with `{`; close them on their own line.
- Indentation is for reading. Braces define nesting.
- Use JSON double-quoted strings and JSON string escapes. Strings cannot contain literal line breaks.
- IDs match `[A-Za-z][A-Za-z0-9_-]*`. IDs are case-sensitive.
- Property values are quoted strings, unsigned integers, or documented bare enums and IDs.
- Property order does not matter. Duplicate properties are errors.
- A line beginning with `#` after whitespace is a comment. Inline comments are not supported.
- No expressions, interpolation, includes, loops, raw markup, or unknown properties are permitted.

These rules resemble the flow language but are not its complete grammar. Share a tokenizer only where contracts agree.

## Top-level declarations

| Declaration | Meaning |
| --- | --- |
| `wireframe <id> "Title"` | Document identity and gallery title; exactly one |
| `viewport <width> <height>` | Positive integer CSS pixel dimensions; exactly one |
| `reference <id> image="path" width=N height=N captured="date" state="text" [url="text"]` | Existing screenshot and capture context |
| `part <id> { elements }` | Reusable content; no parameters or overrides |
| `screen <id> "Title" basis=observed\|source\|proposed [reference=<id>] { ... }` | A complete review scene |

Reference, part, and screen IDs are unique within their respective namespaces. Forward references are permitted. Source order determines gallery order.

`observed` means the wireframe is based on a live inspected state. It remains a simplified drawing. `source` means the structure came from code or documentation. `proposed` means intended behavior. These labels are author assertions, not proof.

Screens with `basis=observed` require a reference. A proposed screen can use that same reference for comparison. Mismatched screenshot dimensions produce a visible warning; never stretch the screenshot to disguise the mismatch.

## Shells and slots

Each screen has exactly one shell. Slots occur at most once. Their order is canonical rather than source-dependent.

| Shell | Slots and behavior |
| --- | --- |
| `shell split sidebar=346` | Optional header and nav above body in the main column. Required aside spans the full height on the right. Optional footer below body. Body is required. |
| `shell page` | Optional header, nav, and footer around required body; no aside. |
| `shell centered content=790` | Required body only. Center a panel of the declared maximum width within the viewport. |

`sidebar` and `content` are the only authored region dimensions. Defaults are 320 and 720 CSS pixels. A split leaves at least 320 pixels for main content; otherwise validation fails. A centered panel is clamped to the viewport minus outer insets. Header, nav, and footer grow with content.

Each slot arranges its children vertically. The body receives the remaining height. The fixed renderer style supplies insets and gaps.

## Elements

All elements require stable IDs. The first ID after `use` belongs to that instance; the second names the part.

| Syntax | Meaning |
| --- | --- |
| `stack <id> { elements }` | Vertical content in source order |
| `row <id> { elements }` | Horizontal content; wrap whole children when needed |
| `columns <id> { elements }` | One equal-width column per child; two to four children |
| `text <id> "Content" [role=title\|heading\|body\|caption]` | Fixed typography role; default body |
| `button <id> "Label" [goto=<screen>] [state=default\|disabled]` | Illustrated action; optional review navigation |
| `field <id> "Label" [value="Example"]` | Illustrated text field; no input behavior |
| `card <id> "Title" [detail="Text"] [goto=<screen>]` | A title, optional short detail, and optional review navigation |
| `tabs <id> { tab <id> "Label" [goto=<screen>] ... }` | Illustrated tab strip; each tab is on its own line |
| `list <id> { item <id> "Label" [detail="Text"] [goto=<screen>] ... }` | Illustrated list; each item is on its own line |
| `rule <id>` | Fixed separator |
| `use <instance-id> <part-id>` | Expand a shared part here |
| `diagram <id> source="relative.diagram" [view=<id>]` | Embed an existing flow or overview; default view is base |

Tabs and lists contain only their respective item records. Cards and other leaf elements cannot contain arbitrary children. Layout blocks may nest, but element nesting is limited to eight levels after part expansion. Recursive parts are errors.

This set is intentionally small. Use a row of buttons for a toolbar. Use columns of stacks for grouped capabilities. Do not add a new toolbar or capability primitive just for this app.

## Selection and change annotations

A screen may declare one `select "path"` before its shell. It may also declare multiple `change "path" "Reason"` records. These statements do not change content or simulate application state.

Paths start with the shell slot, followed by element IDs. Part instances contribute their own ID, then their expanded children. Example:

```text
select "body/board/groups/drafting/tailor"
change "body/board" "Replace the flow canvas with grouped capabilities."
```

The complete identity is `<screen-id>/<path>`. Sibling IDs must be unique after expansion. A path can target a slot or element for change annotations. Selection must target a card, tab, or list item. Missing or ambiguous paths are errors.

Selection supplies only a visual highlight. The screen explicitly defines its inspector content. There are no bindings between selection and source data in this version.

The gallery overlays change outlines in Annotated mode. Clean SVG exports omit them. Annotations remain visible in review notes for accessibility.

Changing screens does not retain simulated input or selection. A `goto` target is a screen in the same wireframe document. Disabled buttons never navigate. A control without a destination is an illustration, not a broken application action. The gallery must state that distinction.

## Diagram viewports

```text
body {
  diagram workflow source="./resume-flow.diagram" view=base
}
```

The interpreter resolves the source, dispatches by its type, materializes the requested view, and calls that type's layout adapter. Node positions and routes come from the diagram renderer, not wireframe commands.

Only flow and overview types may be embedded. Reject wireframe embedding and dependency cycles. Missing files, invalid sources, and missing views are errors. Do not substitute the base view silently.

Use a titled, read-only diagram viewport. Preserve semantic group labels and purpose for overviews. Do not reproduce the whole workbench chrome inside the viewport. Flow legend visibility belongs to the adapter's wireframe preset.

Diagram blocks have a 240-pixel minimum height and fill remaining vertical space in their containing stack. Multiple diagram blocks share that remaining space equally. They fit their content without changing source geometry. Keep title text readable; if fit would make it smaller than 12 pixels, grow the exported scene and report overflow.

The first proof embeds a flow. Overview embedding is a planned adapter contract until its renderer and format exist. The example's capability cards are illustrative wireframe content, not a second canonical overview document.

## Layout and overflow

The initial style uses Arial with sans-serif fallbacks, 14-pixel body text, 12-pixel captions, 18-pixel headings, and 24-pixel titles. Use 16-pixel content gaps and 24-pixel outer insets. These are renderer defaults, not DSL properties.

Measure text using the chosen browser font before layout. Wrap at word boundaries and grow controls vertically. Break an unbroken token when needed. Never hide words, ellipsize titles, or reduce type to make a screen fit.

Columns retain their count. If they cannot fit a 180-pixel minimum column width, report horizontal overflow. Rows wrap; centered panels grow vertically when necessary. Do not invent responsive breakpoints.

Render the nominal viewport outline and all overflowing content in the review artifact. Report the excess dimensions. A viewport-only PNG must be labeled cropped. Overflow is a design finding, not a successful compact layout.

## TypeScript interpreter boundaries

See [model.ts](model.ts). The proposed sequence is parse, validate, expand, resolve diagram dependencies, measure, lay out, and render SVG.

Keep source spans through expansion. Each instance identifies both its `use` declaration and its original part element. The future GUI can distinguish edits to a shared part from edits to a single screen.

Diagnostics include a stable code, severity, source span, and optional element path. Unknown options, duplicate IDs, cycles, invalid selection, and missing destinations must not produce a plausible but incomplete final render.

The viewer may retain the previous valid render after a failed edit, but it must label it stale. A renderer can show diagnostic placeholders during editing. A successful export requires no error diagnostics.

Resolve diagram and screenshot paths relative to the declaring file, within the selected workspace root. Reuse the existing path and symlink protections. Reference URLs are capture metadata; never fetch them automatically. Reject remote asset loading and executable markup. Escape labels and SVG attributes.

Keep document data, computed layout, review annotations, and runtime navigation separate. The renderer records resolved input hashes and font information with each export. It does not persist a second editable copy of the source.

Namespace SVG IDs per screen and diagram instance. This includes markers, clip paths, and referenced definitions. Add each element's full identity as `data-wireframe-path`; escape the attribute. Repeated diagrams must not share SVG IDs when combined into a contact sheet.

## Formatting

The canonical formatter uses two spaces per block level. Preserve screen and element order. Print the envelope, document identity, viewport, references, parts, then screens. Within screens, print selection, changes, then shell. Within shells, print header, nav, body, aside, footer. Print properties in the order shown in this specification.

The first parser proof must verify parse/format/parse equality, source-path resolution, part-cycle rejection, and invalid navigation. Rendering proof must separately verify text and diagram overflow.

~~~~~~~~~~~~


## Source: docs/intent/wireframe-dsl/examples/minimal.diagram

Origin: working; full-source SHA-256: 7af82acd1a8162fc884a6fd103873124558cb8bfdb2d4b80c2acf1b97e41d202

~~~~~~~~~~~~
diagram 1
type wireframe
wireframe resume-review "Resume review screen"
viewport 1280 720

reference current image="../reference/current-ui.png" width=1280 height=720 captured="2026-08-30" state="Existing workbench with the base resume flow and node inspector"

part appbar {
  row actions {
    text brand "User Flow Workbench" role=heading
    button fit "Fit"
    button export "Export JSON"
  }
}

screen review "Flow with review guidance" basis=proposed reference=current {
  change "aside" "Explain what to check before building."
  shell split sidebar=346 {
    header {
      use toolbar appbar
    }
    body {
      diagram workflow source="./resume-flow.diagram" view=base
    }
    aside {
      text title "Review this flow" role=heading
      text purpose "Can we remove a step without losing the user's outcome?"
      card check "Keep human approval" detail="Check claims before exporting the resume."
    }
  }
}

~~~~~~~~~~~~


## Source: docs/intent/wireframe-dsl/examples/workbench.diagram

Origin: working; full-source SHA-256: fd28874d4c6509899dc9afcaec5e9a95d17a974a9c198916b0c034ce40e3212f

~~~~~~~~~~~~
diagram 1
type wireframe
wireframe resume-workbench "Resume workbench: current and proposed screens"
viewport 1280 720

reference current image="../reference/current-ui.png" width=1280 height=720 captured="2026-08-30" url="http://127.0.0.1:4187/?flow=src%2Fdata%2Fflows%2Fresume-alignment.flow" state="Base resume flow; node list open in the right inspector"

part flow-header {
  row actions {
    text brand "User Flow Workbench" role=heading
    button layout "Auto layout"
    button fit "Fit"
    button add "Add node"
    button duplicate "Duplicate" state=disabled
    button delete "Delete" state=disabled
    button files "All diagrams" goto=picker
    button export "Export JSON"
  }
}

part overview-header {
  row actions {
    text brand "User Flow Workbench" role=heading
    text type "Overview" role=caption
    button reload "Reload source"
    button files "All diagrams" goto=picker
    button export "Export JSON"
  }
}

part capabilities {
  text title "Resume app" role=title
  text intent "Intended" role=caption
  text purpose "Prepare a relevant resume using truthful career evidence."
  columns groups {
    stack evidence {
      text title "Role & evidence" role=heading
      card requirements "Understand job requirements"
      card inventory "Inventory career evidence"
      card gaps "See matches and gaps"
    }
    stack drafting {
      text title "Drafting" role=heading
      card tailor "Tailor a resume to a role" goto=capability
      card priorities "Prioritize useful changes"
    }
    stack output {
      text title "Review & output" role=heading
      card review "Review suggested edits"
      card approval "Approve a final resume"
      card export "Export the result"
    }
  }
}

part inspector-tabs {
  tabs sections {
    tab inspector "Inspector"
    tab source "Diagram DSL · Read only"
  }
}

part flow-inspector {
  tabs sections {
    tab inspector "Inspector"
    tab source "Flow DSL"
  }
  text heading "Nodes" role=heading
  text help "Select a node to inspect its details."
  list nodes {
    item posting "Target job posting" detail="Input"
    item evidence "Career evidence" detail="Input"
    item draft "Draft targeted changes" detail="Process"
    item review "Human approval" detail="Handoff"
    item resume "Tailored resume" detail="Deliverable"
  }
}

# This deliberately simplified baseline uses source evidence plus the screenshot.
# Labels and the embedded flow are abbreviated; it is not an exact current trace.
screen current "Current structure: simplified reference" basis=source reference=current {
  shell split sidebar=346 {
    header {
      use actions flow-header
    }
    nav {
      tabs views {
        tab base "Base"
      }
    }
    body {
      diagram workflow source="./resume-flow.diagram" view=base
    }
    aside {
      use inspector flow-inspector
    }
  }
}

screen overview "Proposed capability overview" basis=proposed reference=current {
  select "aside/tabs/sections/inspector"
  change "body/board" "Replace the routed flow with a grouped capability board."
  change "header/actions" "Use source actions in place of graph editing."
  shell split sidebar=346 {
    header {
      use actions overview-header
    }
    body {
      use board capabilities
    }
    aside {
      use tabs inspector-tabs
      text title "About this overview" role=heading
      text name "Resume app" role=title
      text summary "A working idea, ready to reduce through conversation."
      rule divider
      text help "Select a capability to read its detail and open a related flow."
      text source "Source current · Edit through your agent." role=caption
    }
  }
}

screen capability "Selected capability" basis=proposed reference=current {
  select "body/board/groups/drafting/tailor"
  change "aside" "Show capability detail and its related flow."
  shell split sidebar=346 {
    header {
      use actions overview-header
    }
    body {
      use board capabilities
    }
    aside {
      use tabs inspector-tabs
      text type "Capability" role=caption
      text title "Tailor a resume to a role" role=title
      text group "Drafting" role=caption
      text detail "Draft focused changes using the user's evidence and the selected job requirements."
      rule divider
      text related "Related flows" role=heading
      button open "Tailor a resume to a job posting →" goto=linked-flow
      text source "Source current · Edit through your agent." role=caption
    }
  }
}

screen linked-flow "Flow opened from a capability" basis=proposed reference=current {
  change "nav/return" "Return to the selected capability and its overview."
  shell split sidebar=346 {
    header {
      use actions flow-header
    }
    nav {
      button return "← Resume app / Tailor a resume to a role" goto=capability
    }
    body {
      diagram workflow source="./resume-flow.diagram" view=base
    }
    aside {
      use inspector flow-inspector
    }
  }
}

# No live picker screenshot was captured: the existing picker raised an error.
# Keep this proposed screen unpaired rather than imply matching visual evidence.
screen picker "Choose a diagram" basis=proposed {
  shell centered content=790 {
    body {
      text brand "User Flow Workbench" role=heading
      text title "Choose a diagram" role=title
      text help "Files in this folder and its subfolders"
      list documents {
        item overview "Resume app" detail="Overview · resume-app.diagram" goto=overview
        item flow "Tailor a resume to a job posting" detail="Flow · resume-flow.diagram" goto=current
      }
      text convention "One extension. Type comes from file metadata." role=caption
    }
  }
}

~~~~~~~~~~~~


## Source: docs/intent/wireframe-dsl/examples/resume-flow.diagram

Origin: working; full-source SHA-256: 97b6b9940b8c5677fccfdc8ea9e50a917053aabbd4717edd1169d74b3a54c82f

~~~~~~~~~~~~
diagram 1
type flow

# Proposed shared envelope with the existing flow graph vocabulary.
# A small illustrative graph, not the complete existing resume workflow.
graph resume-tailoring "Tailor a resume to a job posting"
description "Use the posting and truthful evidence to draft and review a resume."

node posting input "Target job posting"
node evidence input "Career evidence"
node draft process "Draft targeted changes"
node review handoff "Human approval"
node resume deliverable "Tailored resume"

edge posting-draft posting -> draft
edge evidence-draft evidence -> draft
edge draft-review draft -> review
edge review-resume review -> resume

~~~~~~~~~~~~


## Source: docs/intent/wireframe-dsl/model.ts

Origin: working; full-source SHA-256: 49fce22c72f4e3cb49a4228165f52080ebff2858d793495fb0a0b5d5c880adc3

~~~~~~~~~~~~
/** Proposed normalized model. This file does not implement the interpreter. */
export type Id = string;
export type ElementPath = string;

export interface SourceSpan {
  file: string;
  start: { line: number; column: number };
  end: { line: number; column: number };
}

export interface Diagnostic {
  code: string;
  severity: "error" | "warning";
  message: string;
  source: SourceSpan;
  path?: ElementPath;
}

interface Identified {
  id: Id;
}

interface Navigation {
  goto?: Id;
}

export type Element =
  | (Identified & {
      kind: "stack" | "row" | "columns";
      children: Element[];
    })
  | (Identified & {
      kind: "text";
      text: string;
      role: "title" | "heading" | "body" | "caption";
    })
  | (Identified & Navigation & {
      kind: "button";
      label: string;
      state: "default" | "disabled";
    })
  | (Identified & { kind: "field"; label: string; value?: string })
  | (Identified & Navigation & {
      kind: "card";
      title: string;
      detail?: string;
    })
  | (Identified & { kind: "tabs"; tabs: Tab[] })
  | (Identified & { kind: "list"; items: ListItem[] })
  | (Identified & { kind: "rule" })
  | (Identified & { kind: "use"; part: Id })
  | (Identified & { kind: "diagram"; source: string; view: Id });

export interface Tab extends Identified, Navigation {
  label: string;
}

export interface ListItem extends Identified, Navigation {
  label: string;
  detail?: string;
}

interface MainSlots {
  header?: Element[];
  nav?: Element[];
  body: Element[];
  footer?: Element[];
}

export type Shell =
  | { kind: "split"; sidebar: number; slots: MainSlots & { aside: Element[] } }
  | { kind: "page"; slots: MainSlots }
  | { kind: "centered"; content: number; slots: { body: Element[] } };

export interface Screen extends Identified {
  title: string;
  basis: "observed" | "source" | "proposed";
  reference?: Id;
  select?: ElementPath;
  changes: Array<{ path: ElementPath; reason: string }>;
  shell: Shell;
}

export interface Reference extends Identified {
  image: string;
  width: number;
  height: number;
  captured: string;
  state: string;
  url?: string;
}

export interface WireframeDocument extends Identified {
  version: 1;
  type: "wireframe";
  title: string;
  viewport: { width: number; height: number };
  references: Reference[];
  parts: Array<{ id: Id; children: Element[] }>;
  screens: Screen[];
}

/** Source identities identify declarations, independently of rendered instances. */
export type SourceMap = Record<string, SourceSpan>;

export interface ParseResult {
  document: WireframeDocument | null;
  sourceMap: SourceMap;
  diagnostics: Diagnostic[];
}

/** Computed geometry belongs in a separate output, never in Element. */
export interface LayoutBox {
  path: ElementPath;
  kind: Element["kind"] | "tab" | "item" | "slot";
  x: number;
  y: number;
  width: number;
  height: number;
  source: SourceSpan;
  instanceSources: SourceSpan[];
  textLines?: string[];
  children: LayoutBox[];
}

export interface LayoutResult {
  screen: Id;
  viewport: { width: number; height: number };
  bounds: { width: number; height: number };
  boxes: LayoutBox[];
  diagnostics: Diagnostic[];
}

/** Adapter output comes from trusted renderers, never user-supplied SVG. */
export interface DiagramScene {
  type: "flow" | "overview";
  title: string;
  view: Id;
  width: number;
  height: number;
  minimumReadableScale: number;
  svg: string;
  inputHash: string;
}

export interface DiagramAdapter {
  resolve(request: {
    declaringFile: string;
    relativeSource: string;
    view: Id;
    availableWidth: number;
    availableHeight: number;
  }): Promise<
    | { ok: true; scene: DiagramScene; diagnostics: Diagnostic[] }
    | { ok: false; diagnostics: Diagnostic[] }
  >;
}

/** Planned entry points, not implementations or additions to window.flow. */
export interface WireframeParser {
  parse(source: string, file: string): ParseResult;
  format(document: WireframeDocument): string;
}

~~~~~~~~~~~~


## Source: docs/intent/visual-idea-overview/intent-brief.md

Origin: working; full-source SHA-256: e458699742ae2fa5809c8e88d5d428d1d220a699da5cf2ba9f9ae76bede6d719

~~~~~~~~~~~~
---
title: "Visual idea overview"
slug: "visual-idea-overview"
phase: intent
status: current
last_updated: "2026-08-30"
---

# Visual idea overview

## My read

Byron wants to make sense of possible app ideas before building them. Agents can produce more detailed text than he can assess. That text can make an idea appear valuable before its purpose and scope are clear. A readable visual overview should help him see the whole idea, challenge its parts, and remove unnecessary work.

The overview is a working representation of the product under discussion. It starts with possible capabilities and becomes more definite through conversation. Byron talks with an agent, reviews the diagram, and requests changes. The agent maintains the source. Byron does not expect to edit the DSL himself.

Visual compression is a thinking discipline. It must reduce repetition and expose scope, rather than turn every paragraph into a box. A brief glance should reveal the purpose and main capabilities. A closer look should support decisions about what belongs. The result should lead to simple flows for a small initial product.

Documenting an existing app is a secondary use. Those documents should represent reality. Temporary alternatives can help resolve a real choice, but old possibilities should not remain in the active representation.

## What matters most

- Understand possible capabilities before committing to detailed behavior or implementation.
- Use a readable overview to remove, merge, and clarify ideas.
- Keep conversation with an agent as the main authoring interaction.
- Develop flows only when they help resolve behavior or prepare to build.
- Maintain one clear working direction after a decision.

The resume project exposed the problem. Features were being built before Byron had a clear picture of what he wanted. Other projects have similar collections of agent-written documents. The resume domain is an example, not a requirement for the tool.

## The experience Byron wants

Byron brings a rough idea or an existing collection of notes to an agent. The agent produces a compact visual account. Byron sees the major areas without reading a long document. He discusses what to remove, combine, rename, or question. The agent changes the source, and the viewer shows the revised state.

The work does not require a flow for each capability. A surviving capability can later link to one or several flows. Opening a relevant flow is the expected initial benefit. Automated analysis of changes across flows is not established as a need.

When two directions deserve comparison, each should be readable as a complete alternative. After discussion, the selected direction becomes current. Discarded ideas can leave the active source. The tool need not maintain a backlog for possible future use.

## Boundaries

### Must be true

- Capability ideas can exist before their flows.
- Short titles carry the overview; supporting detail stays out of the main visual.
- Visible groups must help explain scope without hiding large collections of features.
- The user can distinguish a description of reality from an intended state.
- An agent can revise the representation without manual DSL work from Byron.
- Existing flow documents and their viewer remain useful.
- All diagram sources use one extension, with an explicit document type inside the file.

### Must be avoided

- A required hierarchy of goals, proposals, features, requirements, and tasks.
- Backlog management, discarded-idea archives, or a proposal lifecycle.
- Tiny labels that make an oversized idea appear to fit.
- Long descriptions as a prerequisite for useful planning.
- Old alternatives mixed into the current direction.
- Automatic claims that a documented capability has been implemented.

## What seems settled

Exploration before building is the primary use. Existing-product documentation follows it. Changes to an existing product may use variants when there is a real decision to make. These uses do not have equal priority.

Planning happens close to implementation. Byron is more likely to regenerate an idea than maintain it in a long-lived backlog. The current working state matters more than the history of every possibility.

Byron confirmed the preceding interpretation and requested shape and implementation documents. He then required one file extension for all diagram types, with type metadata inside each file. The selected common extension is `.diagram`. This replaces the earlier separate-extension proposal. Layout details, card limits, and release dates remain unsettled.

Existing diagram files live only in this repository and the soccer schedule repository. Byron wants those files changed by hand. Do not build migration tooling or a legacy compatibility path.

## Possibilities, not decisions

A grouped board, separate flow and overview content types, optional purpose text, and temporary variant tabs are recommended mechanisms. Both content types use `.diagram` files. Their visual behavior must be tested against a real discussion. A fixed feature count, mandatory idea classification, and an automatic simplification engine are not requirements.

The first visual should test readable scope and useful subtraction. Fewer cards alone do not prove a better result. The representation must still preserve the meaning Byron intends to build.

## Next step after confirmation

Intent is sufficient for shaping. Read the [shape brief](shape-brief.md) for the bounded recommendation and first visual proof. Read the [implementation plan](implementation-plan.md) for the repository-specific sequence. Implementation has not started under this initiative.

~~~~~~~~~~~~


## Source: docs/intent/visual-idea-overview/shape-brief.md

Origin: working; full-source SHA-256: 7ec6d2710fc1586ed7bd5e67a0043b8b1b8bd26d02e720f851b632c6dda709f8

~~~~~~~~~~~~
---
title: "Visual idea overview — shape brief"
slug: "visual-idea-overview"
phase: shape
status: current
last_updated: "2026-08-30"
---

# Visual idea overview — shape brief

## Recommendation

Add a compact capability overview beside the existing flow viewer. Use groups and short capability titles. Show purpose, optional detail, and flow links when a person selects an item. Keep the main representation free of process arrows, status columns, and large descriptions.

The first proof should render one real idea from a small typed fixture. Test whether conversation can make that idea clearer and smaller. Do this before extending the DSL or building comparison support. A visual that merely arranges a long feature list does not pass.

Use source files as the authority for overview content. The agent edits them; the viewer displays them. Preserve the existing flow model and browser editing behavior. Do not add overview nodes to its operational graph simply to reuse its canvas.

After the first proof, add a common diagram file format, dependable source refresh, flow navigation, and temporary alternatives. These are separate usable steps. No model service, database, or in-app chat is needed.

## Problem and appetite

**Problem:** Detailed agent output obscures product scope before Byron has decided what to build.

**Outcome:** Byron can inspect a whole idea, remove unnecessary capabilities, and choose where a simple flow is needed.

**Appetite:** One bounded addition to the local workbench. No time budget was specified. Prove the visual first; then complete source-driven iteration. Flow navigation and comparison follow that usable core.

**Not in this shape:** Backlogs, roadmaps, delivery tracking, automatic repository analysis, or a general product-management graph.

## Core shape

The working loop is: discuss an idea, inspect its overview, revise its scope, then inspect selected flows.

The [UI scope review](ui-scope-review.md) and [wireframe gallery](wireframes/index.html) place this work inside the existing interface. They propose one new board with adapted toolbar, inspector, picker, and view tabs. These are review artifacts, not an implemented preview or a completed product proof.

The recommended model contains a document title and purpose, ordered groups, and capabilities with stable IDs. A capability has a title, an optional short detail, and optional flow references. Each capability has one visible home. Start with one group level and permit ungrouped ideas. Group placement means organization, not dependency or execution order.

An optional document-level label distinguishes current reality from intended scope. Treat an unlabeled draft as intended scope. This is an author assertion, not automatic implementation verification. Open changes to an existing app can use a clearly labeled intended view.

Use a responsive two-dimensional board with all capability titles visible in the initial example. Preserve readable type and predictable group order. Do not collapse features or shrink text to force arbitrary content onto one page. If the source exceeds the readable space, show the overflow and invite scope review. Dense documents can scroll while retaining group labels.

Selection reveals detail without replacing the overview. Goals belong in purpose or detail when useful; separate goal records are unnecessary initially. The normal view contains no relationship web. Add flow links as navigation, not dependency edges.

For a real choice, show the current view and a few named alternatives as complete selectable views. Each alternative applies changes to shared base content. Do not show variants as lanes. An agent adopts a choice by updating the base and removing rejected alternatives from the active source. Adoption is an agent edit, not a new approval system.

Use `.diagram` for all diagram sources. Require a version header and type metadata inside each file:

```text
diagram 1
type overview
```

A flow uses `type flow` under the same header. The type selects the content parser and viewer. One extension does not require one node model. Retain separate flow and overview semantics behind the shared file envelope.

Hand-edit the existing `.flow` sources in this repository and the soccer schedule repository. Rename them to `.diagram`, update headers and references, and verify their behavior. Preserve graph meaning, stable IDs, variants, and layout. Do not build a migration command, converter, or legacy reader. Normal discovery accepts `.diagram` only. Keep payload details provisional; the shared extension and explicit type are settled.

The overview browser stores view preferences only, never a competing editable content copy. Existing flow browser behavior remains available after migration.

## Current fit

- **Reuse:** The SolidStart application, visual conventions, local server, workspace identity, path checks, and flow navigation URLs.
- **Preserve:** `FlowDocument` semantics, validation, layout, manual movement, and existing `window.flow` method names.
- **Add:** A shared diagram envelope, type dispatch, and a small overview board. Update the known files by hand. Later add flow references and base-derived alternatives.
- **Avoid:** Extending the large imperative `mountFlowWorkbench` function to handle another semantic model.

The baseline is release 0.2.0, commit `c1d4770`. Server ownership, browser capture, JSON reports, and native-size PNG/SVG contact sheets now exist. Reuse them after the fixture proof. Add overview type dispatch and capture readiness, not another rendering system. Keep the existing capture mode free of browser-storage writes.

The authoring skill now uses a compact reference, optional full specification, and separate structure, source, and visual evidence. Preserve that workflow. Update its maintained and distributed sources when the common format lands. Soccer's new documentation gate must recognize `.diagram`; do not replace it with a new verification system. Details are in the [baseline reconciliation](reconciliation.md).

`src/types/graph.ts` defines operational types. `src/lib/graph-lint.ts` requires an outgoing edge from each process. These rules would distort independent capabilities. The flow canvas also places nodes in semantic columns. A board needs neither those columns nor edge routing.

The current catalog still discovers only `.flow` files. Interactive flow edits use source-signature-checked local storage; CLI capture disables persistence. The development reload endpoint still watches one specific resume file. The CLI improvements do not provide automatic source refresh for arbitrary overview documents.

## How to make this go better

- **Prove subtraction before syntax.** A real visual discussion can reject the layout before parser work begins.
- **Keep the renderer separate.** A small SolidJS board avoids changes to flow semantics and pointer behavior.
- **Keep source content authoritative.** Refreshes must display agent edits without a competing browser document.
- **Use one level of grouping first.** Test whether it explains scope before adding nested navigation or hidden content.
- **Preserve an independent flow path.** Check the hand-edited files and keep the flow viewer usable without overview features.

## First proof

**Question:** Can the overview help Byron reduce a real idea without returning to long prose for its essentials?

**Proof:** Use the base resume example as an illustrative intended product. Exclude its old variants unless Byron selects one for comparison. Produce a board from a typed fixture, then revise it through a short conversation. Capture the before and after views for this proof only.

**Observe:** At a normal desktop viewport, can Byron identify the purpose and major areas after a brief glance? Can he remove, merge, or clarify scope using the visual? Can he name a capability that warrants a flow?

**Pass / fail:** Pass when the visual supports those decisions without losing agreed scope or requiring a long companion document. Fail if tiny text, hidden items, or vague umbrella labels supply the apparent compression. Byron supplies the product judgment; browser checks can only establish readability and behavior.

**Deliberately excludes:** A production parser, comparison engine, automatic idea generation, flow changes, and a renderer export command. Use roughly three to five groups as a starting fixture, not a schema limit.

## Rabbit holes and no-gos

Do not add lifecycle statuses, feature voting, an archived-ideas panel, or a separate proposal model. Do not infer that a flow proves a capability exists. Do not require goals or flow links for every item. Do not add in-app model credentials or chat. Do not extract a universal graph engine before the board proves useful.

Manual board positioning, deep grouping, goal-based alternate views, and automatic impact analysis remain outside this shape. The existing flow editor keeps its manual positioning.

## Serious alternative

A static grouped diagram generated by the agent may provide enough value. It is the smaller counterproposal and should be used if the first proof fails to justify an interactive board. Continue with the viewer only if selection, source refresh, or flow navigation improves the discussion. A new format alone is not a reason to proceed.

## Plan handoff

The intent is stable enough to plan. No additional product questionnaire is needed. Begin with the visual proof, then add the common format, update known files by hand, and complete source iteration. Navigation and bounded comparison follow. The first proof remains a real decision gate. Payload syntax and layout defaults can change there. The single `.diagram` extension and required type metadata remain fixed.

~~~~~~~~~~~~


## Source: docs/intent/visual-idea-overview/implementation-plan.md

Origin: working; full-source SHA-256: 648df6357af0e25b884753080a2e1c37757a13f7cc30c0425cbe2963855743d7

~~~~~~~~~~~~
---
title: "Visual idea overview — implementation plan"
slug: "visual-idea-overview"
phase: plan
status: current
last_updated: "2026-08-30"
---

# Visual idea overview — implementation plan

## Plan at a glance

Build a separate overview surface in the existing application. First show one real idea from a typed fixture. Use that visual in a scope-reduction discussion before committing to a new parser. This tests the main product assumption while the change remains small.

Next, make the source-file conversation loop dependable. An agent writes an overview, checks it, and sees its current contents in the viewer. This is the first usable release boundary. Add navigation to existing flows after that loop works. Add temporary alternatives last, without a proposal lifecycle or discarded-ideas interface.

Use `.diagram` for both flows and overviews, with required type metadata inside each file. Update existing `.flow` sources by hand in this repository and the soccer schedule repository. Preserve their graph meaning. Do not add migration tooling or a general graph framework. Source content remains authoritative; browser preferences cannot restore obsolete capabilities.

This plan uses commit `c1d4770`, release 0.2.0, as its implementation baseline. CLI rendering and authoring improvements are committed locally. Soccer's documentation-gate changes remain in its working tree. Reuse those improvements and preserve ongoing work. Byron approved the wireframes and authorized implementation on 2026-08-30. Milestone 1 is in progress. Later milestones await the running-preview product gate. See [baseline reconciliation](reconciliation.md) for evidence and limits.

## Implementation strategy

**UI boundary.** Follow the proposed [UI scope review](ui-scope-review.md) and [wireframes](wireframes/index.html). Add the overview board while retaining the existing desktop toolbar and right-sidebar positions. Adapt their content by type. Do not add a navigation system or refactor the flow controller into a generic workbench. Wireframes establish scope; they do not complete the running-preview proof.

**Boundaries.** Proposed additions are a shared diagram envelope, `OverviewDocument`, and `OverviewWorkbench`. Names below identify intended files, not existing code. Dispatch by the required file type to separate flow and overview parsers and viewers. Keep parser output separate from presentation state. Reuse path-security helpers through a narrow extraction with regression tests.

**Reuse the completed tools.** `src/cli/runtime.ts` owns local server startup and cleanup. `src/cli/cdp.ts` owns browser capture. `src/cli/contact-sheet.ts` writes PNG or SVG sheets with native-size tiles and pagination. Extend document dispatch and readiness only; do not build another launcher, screenshot pipeline, or sheet generator. Preserve source-alias protection, overwrite checks, pure JSON reports, source hashes, and confirmed child-process cleanup.

**Source format.** Specify `.diagram` with a `diagram 1` header and exactly one `type flow` or `type overview` line. The header replaces the legacy `flow 3` file header. Keep existing flow body syntax and normalized graph semantics where possible. Reuse flow parsing through a small adapter with correct source-line offsets. The common file version is distinct from the internal graph schema version.

The overview payload contains stable IDs, title, purpose, ordered groups, capabilities, and optional detail. Permit empty drafts and ungrouped capabilities. Canonical formatting must be repeatable. Missing or unknown types, unsupported versions, duplicate IDs, and invalid references produce located diagnostics. Do not infer a type from the filename or silently accept mixed bodies. Flow references and alternatives enter with their respective milestones.

**Local loop.** Run `pnpm dev` for the fixture proof. Run `pnpm typecheck` and `pnpm test:dsl` for shared-code changes. Add `pnpm test:overview` when overview logic exists. After source integration, use `pnpm build`, `pnpm flow view <fixture-root>`, and `pnpm flow render <file.diagram> --output <preview.png>`. Use the checkout CLI until an installed package is confirmed to support the new header. Package verification must exercise `prepack`, the packaged server, and the CLI entry through a package symlink. No network service is required after dependencies are installed.

**Source refresh.** Load only the selected document during iteration. Start with a visible Reload source action and refresh on window focus. Then add bounded polling for the selected overview while visible. Use one outstanding request, a source revision, and cancellation to prevent late responses from replacing newer content. The documented default interval can be two seconds; it is not a product requirement. Do not poll the entire repository.

**Failure behavior.** Initial invalid content shows an error with source location and retry. A later invalid edit retains the last valid visual with an explicit stale warning. A repair clears the warning. A missing file offers retry and return to the picker. View preferences use workspace, path, and active view identity. They never store semantic content.

**Dependency proof.** The first slice uses the installed SolidJS renderer and a local fixture. The real filesystem enters in milestone 2 through an overview-loader boundary. Test it with temporary roots. Test refresh ordering with controlled responses. Confirm these contracts through the actual local server. Cloud, credentials, and deployment proofs do not apply. The existing ELK router is absent from overview rendering.

**Compatibility.** Preserve flow semantics and command names while changing the supported source extension to `.diagram`. Use a common typed catalog and document loader. Keep the existing flow-specific APIs and query parameters as adapters if needed by current render tooling. The file metadata remains authoritative; a flow-specific request for an overview must fail clearly.

The runtime probes `/api/flows?launch=...` to verify server ownership. Preserve that check when changing catalog endpoints. Separately verify the ordinary browser picker request without a launch token; do not treat successful direct-file renders as proof that the picker works.

Update known file references by hand and report replacement paths. Do not add old-path redirects, storage migration, or a legacy reader. Before renaming a file, preserve any wanted browser-local edits through the existing export path. New file paths may start with fresh view preferences. Normal check, format, view, and render paths discover `.diagram` only.

## Milestone 1: A visual discussion produces smaller, clearer scope

**Execution status:** The isolated preview is implemented. See [running proof and evidence](proof/README.md). Initial captures and technical checks are available. Byron's scope-reduction discussion and before/after evidence remain pending. Later milestones have not started.

Add a proposed `OverviewWorkbench.tsx` and a small typed fixture at an isolated overview preview route. Use `src/data/flows/resume-alignment.flow` as illustrative input, not proof of implemented resume functionality. Do not import all historical variants into the initial idea.

Render ordered groups and title-only capability controls. Selection opens concise detail. Start with CSS layout rather than the flow router. Use readable text, visible focus, and no required pointer drag. Scope styles to the new surface. Keep the fixture contract small enough to replace without migration.

Use wireframes 3 and 4 to test the board and stable inspector. Omit graph-edit actions, movement hints, and node filters from this surface. The read-only overview source tab supports inspection; authoring remains with the agent.

Capture the initial overview at 1440 × 900 and 1280 × 800. These are test viewports, not support limits. Use a brief conversation to remove, combine, and clarify items. Record whether the revised view preserves intended meaning. Treat feature counts as evidence, never as a success score.

Use browser capture for this fixture-only preview. The existing CLI expects a source-backed flow and its readiness signal; do not invent a fake flow to satisfy it. Reuse the established `STRUCTURAL`, `SOURCE`, and `VISUAL` evidence labels. Actual browser interaction remains separate from image inspection.

Have Byron assess the five-second overview and scope decisions. When practical, use a separate browser-verification subagent for visible behavior. Give it the starting URL and acceptance criteria, not a source walkthrough. Check labels, selection, focus, and overflow. Do not ask it to decide Byron's intended product.

### Desired end state

A running preview helps Byron recognize purpose, reduce scope, and select a capability for further flow work. Before and after evidence records the result. Existing flows remain unchanged. If the proof fails, revise the board or keep a static diagram; do not continue to parser work. Removing the preview restores the prior application.

## Milestone 2: Agent source edits reliably change the overview

Add the common diagram envelope and typed parser/formatter dispatch under `src/types` and `src/lib`. Write a shared `docs/diagram-dsl-spec.md` with flow and overview examples. Add overview types and the reader under `src/server`. Keep ordinary comments and short optional detail sufficient for rough ideas.

Locate the known diagram files in this repository and the soccer schedule repository. Rename them to `.diagram` and update their headers by hand. Update file references, examples, affected tests, and authoring instructions in the same change. Leave unrelated ongoing work untouched. No source files are renamed during this documentation task.

The soccer checkout is `/Users/byronwall/Projects/soccer-schedule`. Its new `app/scripts/check-docs.ts`, associated tests, and `AGENTS.md` recognize `.flow`. Update that classification to `.diagram`; keep the existing targeted formatter and full-verification fallback. Include `docs/flows/README.md` and all nine flow sources. Because the gate code changes, this change is not documentation-only. Follow soccer's mixed-change verification policy without overwriting its current uncommitted work.

Review the edits to confirm that graph bodies, IDs, variants, and layout remain intact. Check and open the updated diagrams from both repositories. Use ordinary source review and existing validation; do not create a converter, migration command, dry-run mode, or compatibility layer.

Update the DSL panel, source exports, and `window.flow` source/metadata methods to use the common envelope. Preserve method names and graph meaning, not the old header string. Verify that exported flow text reopens as a flow-type `.diagram` document.

Add common diagram catalog and document endpoints. Extend the picker in `src/routes/index.tsx` to display the declared type. Extract root resolution and path validation from `src/server/flow-catalog.ts`. Keep existing flow endpoints as narrow adapters where required. Preserve deterministic discovery and ignored directories. Reject absolute paths, traversal, and symbolic-link components. Never serve arbitrary linked files.

Use wireframe 2 for the picker adaptation. Rename All flows to All diagrams and source-tab wording to Diagram DSL. Use wireframe 7 for local error and empty states; do not add separate workflow screens.

Make `flow check`, `flow format`, and `flow render` dispatch `.diagram` content by its metadata, including directories containing both types. Preserve command names and default search directories. Keep flow semantic lint out of overview validation. Absence of flow links, goals, or detail is not an error. Report unsupported types explicitly rather than skipping files.

Adapt the existing render path to the overview board. Preserve `render=1`, storage-free capture, exact-URL readiness checks, and final-paint waiting. Add a truthful board layout identifier to capture/report types; do not report ELK for a CSS board. Scope capture styles so overview purpose and group labels remain visible. Keep source content unchanged. Reuse the current report and contact-sheet path for both document types.

Update the maintained `skills/author-flow-diagrams` skill, compact reference, distributed specification, example, and `docs/flow-authoring-workflow.md` together. Keep the shared specification authoritative and its distribution copy byte-identical. Let the compact guide branch by document type; do not apply flow stages or outgoing-edge rules to overview ideas. Preserve staged reading, short titles, stable IDs, evidence labels, and bounded retry guidance. Preserve source comments; canonical formatting currently removes them, so do not promise a lossless rewrite.

After validating the maintained skill, update its installed copy at `/Users/byronwall/.codex/skills/author-flow-diagrams`. Preserve local metadata customization. Verify reference/example equality and test one overview authoring exercise. The current installed skill lacks the latest contact-sheet paragraph; include it during that controlled update. Do not create another authoring skill or require an exhaustive reference read.

Connect source refresh to the overview reader. Do not reuse the hard-coded watcher in `src/routes/api/graph-events.ts`. Keep source content out of local storage. Retain selection only while its ID survives; clear removed selections. Use stable group order to limit visual movement during small edits.

Verify both types through parse/format round trips and mixed-directory discovery. Test missing, duplicate, and unknown type declarations, type/body mismatch, and unsupported versions. Add empty drafts, ungrouped items, duplicate IDs, malformed edits, repair, deletion, and out-of-order refreshes. Test traversal and symlink rejection with real temporary directories. Run existing flow semantic, catalog, and CLI checks against the hand-edited fixtures.

Prove the conversation loop from an external fixture root using the packaged server. An agent edit must appear without browser content overriding it. A failed reload must never silently look current. Check that source files and storage are unchanged by capture. Test mixed-type rendering, source hashes, pure JSON, native-size PNG sheets, SVG output, scale, pagination, invalid documents, and startup/cleanup failures. Retain existing CLI regression tests. Inspect individual images as well as sheets; successful rendering does not prove readability.

### Desired end state

Byron can discuss an idea while an agent edits its source, checks it, and presents the refreshed overview. Both types use `.diagram`, including existing files in the two known repositories. Invalid intermediate edits have a clear recovery path. This is a usable stopping point. Removing the overview surface leaves flow documents usable. If the format change fails verification, restore only this initiative's code and file edits together.

## Milestone 3: A capability opens relevant flows and returns to context

Add optional flow references to capabilities. Each reference names a `.diagram` path relative to the served root and may select a variant. Verify that the target declares `type flow`. Several capabilities may reference the same flow; a capability can reference several flows. No reverse registry or impact graph is needed.

Resolve references with the common secure diagram reader. Keep missing or wrong-type references visible as warnings with retry guidance. They must not prevent an otherwise valid overview from opening. Use flow URLs with migrated paths. Add a validated return link that restores the overview path, selected capability, and active view. Do not accept an arbitrary return URL.

Wireframe 5 places that context in a small row above the existing flow view tabs. Show it only when there is an overview origin. Keep the flow editor controls and inspector intact.

Test no-link selection, shared links, missing files, renamed variants, direct refresh, browser Back, and return after a capability is removed. Distinguish source-backed flow content from existing browser-local edits; offer the established reset-to-source path when a linked flow has a local working copy. Do not silently clear that copy or claim it is canonical.

Run browser checks on overview navigation and the existing flow canvas. If the flow toolbar changes, verify direct pointer selection, node movement, pan, zoom, and variant switching. Preserve layout and routing behavior.

### Desired end state

A capability provides useful navigation into detailed behavior. Returning restores valid overview context or explains why it no longer exists. Unlinked capabilities remain first-class content. Removing overview navigation leaves each flow independently accessible.

## Milestone 4: A real alternative can become the single current direction

Extend the overview format with named variants based on shared base content. Use a small set of operations for adding, removing, and changing groups and capabilities. Keep materialization pure and separate from rendering. Materialize first, then validate the final view. Reject invalid references rather than silently deleting capabilities when a group disappears. Do not import the flow operation engine or add variant inheritance.

Show the base and named alternatives as tabs. Render only the selected complete view. Start with one meaningful comparison from the current discussion, not a library of historical ideas. Different views must not share selected-item state unless the ID exists in both.

Use wireframe 6. Hide the overview view-tab row when there are no alternatives. Do not add an adoption button or an alternative-management panel.

Document an agent adoption workflow: materialize the chosen view, make it the base, remove rejected alternatives, format, check, and reload. A former variant URL must return to the base with a clear notice when that variant is removed. Adoption requires no in-app write API.

Test base isolation, conflicting operations, removed groups, removed selections, shared flow links, and adoption. Verify that switching views reveals no content from the previous view. Add a document-level current/intended label so an explored future state cannot appear to be shipped reality.

Extend the existing `--variant` render path to overview variants. Verify the requested materialized view in the image and report. Add no separate variant exporter or historical-alternative catalog.

### Desired end state

Byron can compare a legitimate choice, select a direction through conversation, and return to one clean active representation. Existing flow variants remain unchanged. Removing optional overview variants preserves the base overview and all standalone flows.

## Open decisions and spikes

The product gate is the visual proof. The common `.diagram` extension, required type metadata, and manual file updates are settled. Typography, group packing, and payload details remain reversible until the proof passes. If deeper grouping appears necessary, first test whether scope or labels are too broad. Add nesting only when meaningful scope cannot otherwise be shown. No further discovery questionnaire is needed before milestone 1.

## Below the cut line

- Proposal lifecycles, backlogs, history panels, delivery status, and automatic reality checks.
- Cross-flow impact analysis, capability dependencies, and automatic flow generation.
- In-app agents, chat, provider credentials, collaboration servers, or a database.
- A universal graph model, nested variant families, and mandatory goal records.
- Manual overview coordinates, deep grouping, alternate goal views, and mobile-first design.
- A second screenshot/export pipeline. Adapt the existing CLI capture and contact-sheet tools for source-backed overview documents.
- Migration commands, converters, legacy readers, old-path redirects, and browser-storage migration.

Do not remove existing flow exports, manual layout, or browser editing while enforcing this cut line.

~~~~~~~~~~~~


## Source: docs/intent/visual-idea-overview/ui-scope-review.md

Origin: working; full-source SHA-256: 97f81df35a15b1c929f9e5b8a9e1a9d1163f9318a29cb412a3d0a7f559f2f4fc

~~~~~~~~~~~~
# UI integration scope

These low-fidelity wireframes show proposed changes inside the existing workbench. They are planning artifacts, not implemented screens.

Open the [wireframe gallery](wireframes/index.html) or the [six-frame comparison](wireframes/contact-sheet.svg). The gallery includes the actual current UI capture. Blue or dashed marks identify new or changed areas; those outlines are review annotations, not proposed permanent styling.

## Recommendation

Add one new main content surface: the grouped capability board. Retain the current toolbar location, view-tab location, and fixed right sidebar. Adapt their contents to the document type. Keep the flow editor independently useful.

Do not add a project sidebar, global Overview/Flow mode switch, feature-management panel, or embedded chat. A file declares its type. The picker opens the corresponding viewer.

## Screens and changes

| Frame | Existing structure | Proposed change |
| --- | --- | --- |
| 1. Current viewer | Toolbar, view tabs, canvas, right inspector | Reference only; simplified trace of the inspected screen |
| 2. Document picker | Existing centered file list | Rename to diagrams; add a Flow/Overview label and `.diagram` paths |
| 3. Overview | Same toolbar and sidebar positions | Replace routed canvas with grouped capabilities and a short purpose |
| 4. Capability detail | Selection-driven inspector | Show capability detail and optional flow links; keep the board still |
| 5. Linked flow | Existing flow editor | Add a small return-context row only when opened from an overview |
| 6. Alternative | Existing view-tab pattern | Show one complete overview variant; omit the row when no choice exists |
| 7. Local states | Same shell and inspector | Show loading, empty, stale-source, and removed-selection feedback locally |

The resume content is illustrative. These frames propose the interface structure, not the final resume product scope.

## Component boundaries

`src/routes/index.tsx` keeps the picker pattern and gains typed document dispatch. The new overview uses a separate SolidJS board. It must not call the imperative flow canvas merely to obtain the same layout.

`Toolbar.tsx` supplies the visual reference. Flow actions remain Auto layout, Fit, Add node, Duplicate, and Delete. The overview instead exposes Reload source, document navigation, and export. It has no local capability-edit form. Document identity and type stay visible.

Retain the right sidebar at its current desktop width. Overview selection replaces its contents without moving the board. The default inspector explains the view; it does not repeat the whole capability inventory. Label the source tab Diagram DSL. For an overview, it is a read-only reference, since the agent owns source edits. Preserve existing flow editing behavior.

`VariantBar.tsx` supplies the view-tab pattern, not its DOM wiring. Overview tabs use overview state. There is no adoption button, ghost content, archive panel, or side-by-side lane. The agent makes the chosen view the new base.

The flow return row stores the originating overview, capability, and view. It does not require all flows to belong to an overview. Standalone flow URLs keep the current editor layout.

## Plan review findings

**Reuse appearance without forcing shared internals.** The current flow controller expects specific DOM IDs and graph semantics. Extracting a universal workbench would expand this scope unnecessarily. Share small presentation pieces only where behavior matches.

**Do not carry flow controls into the overview.** Movement hints, the node-type legend, graph editing controls, and node filters have no established overview purpose.

**Protect the overview during selection and refresh.** Keep its width and grouping stable. Put source errors in a clear local banner. Show the last valid board as stale, never silently current. Clear selection when its capability disappears.

**Keep image capture truthful.** Flow capture hides toolbar and sidebar today. Overview capture must retain its own purpose and group labels. The dashed review outlines do not belong in exported product images.

## Evidence and limits

The live flow viewer was inspected at `http://127.0.0.1:4187` on 2026-08-30. Its screenshot is [current-ui.png](wireframes/current-ui.png). The current-viewer wireframe preserves its major regions and simplifies graph geometry.

Opening All flows produced an uncaught client exception. The picker proposal therefore uses `src/routes/index.tsx` as its structural reference. This supports the earlier plan to verify ordinary picker navigation separately from direct-file capture. No application fix was made here.

All full frames use the same 1280 × 720 document size for comparison. Narrow gallery windows can scroll the drawing or open it at full size. This is not a responsive product specification. Visual density, final spacing, and the capability wording remain open to review.

Independent browser review checked all seven gallery scenes and their full-size links. It found no material clipping or overlap. The review prompted a visible Read only label on the overview source tab. Final screenshots include that change. Gallery controls work; controls drawn inside each wireframe are illustrations.

These artifacts do not complete implementation milestone 1. They define its UI boundary. The running preview must still prove that a real discussion can reduce scope.

## Implementation follow-up

Byron approved these wireframes and authorized implementation. The isolated overview proof is now implemented and checked. See [running proof evidence](proof/README.md). The scope-reduction discussion remains open. The picker, common format, flow links, and alternatives remain later milestones.

~~~~~~~~~~~~


## Source: docs/intent/visual-idea-overview/reconciliation.md

Origin: working; full-source SHA-256: 02637632737f88eeb302922ea2677eea9cf52c47cbec19c65f160ca75f8ecd47

~~~~~~~~~~~~
# CLI and authoring baseline reconciliation

Date: 2026-08-30

## Baseline

The CLI and skill changes landed during this review as `c1d4770`, **Release 0.2.0 with PNG flow rendering and contact sheets**. The local branch was one commit ahead of `origin/main` when checked. There is one checkout and no separate Git worktree. This initiative's folder remained untracked; all other workbench changes were committed.

The soccer repository is `/Users/byronwall/Projects/soccer-schedule`, at `78547b6` with uncommitted documentation-gate work and nine flow files. Read its current working tree, not only that commit. No files in that repository were changed by this reconciliation.

## What the plan now reuses

- `src/cli/runtime.ts`: owned local servers, launch identity, startup failure handling, and confirmed cleanup.
- `src/cli/cdp.ts`: local Chromium capture, fresh profiles, requested-URL readiness, final-paint checks, and browser cleanup.
- `src/cli/contact-sheet.ts`: native-size PNG tiles, SVG output, scaling, and paginated sheets.
- `src/cli/flow.ts`: source protection, file/batch capture, source hashes, pure JSON, variant selection, and overwrite protection.
- The compact authoring reference and runbook: narrow source reads, explicit evidence labels, image inspection, and bounded retries.

The overview still needs its own semantic model, board, source refresh, and file-type dispatch. The committed CLI does not provide those features. The first fixture proof can use ordinary browser capture. Source-backed overview rendering then uses the existing CLI infrastructure.

## Integration points that cannot be skipped

The `.diagram` change affects more than file names. Update CLI discovery, input checks, output-name derivation, catalog loading, source exports, and references. Preserve the launch-identity handshake used by server startup. Extend capture readiness and report layout identifiers for the board without weakening existing flow checks.

The catalog handler currently requires the launch token when the server sets one. The browser picker fetches `/api/flows` without that token. This is a source-level mismatch, not a browser reproduction from this turn. Add separate picker and startup checks when adapting the endpoints; successful direct-file renders do not cover it.

The maintained full specification and its distributed copy currently match byte-for-byte. The checkout example and distributed example also match. The installed compact and full references match the repository. The installed `SKILL.md` lacks the latest contact-sheet paragraph. Its `agents/openai.yaml` has local wording differences. Update the installed skill deliberately after validation; preserve unrelated customization.

Soccer's `app/scripts/check-docs.ts` classifies `.flow` as documentation and invokes the installed `flow` executable. Update that classification, tests, instructions, and source index for `.diagram`. Verify the executable supports the new header before using the gate. Gate-code edits require soccer's mixed-change checks. Keep its targeted formatter and full-verification fallback.

## Verification evidence and limits

The earlier [verification record](../flow-authoring-efficiency/verification-record.md) reports 35 passing tests, typecheck, package build, and nine successful soccer renders. Those are prior results, not reruns from this review.

This review inspected the committed source, soccer's working changes, and installed reference equality. Fresh `pnpm test:dsl` and `pnpm typecheck` attempts stopped before project execution. pnpm attempted dependency refresh and returned `ERR_PNPM_ABORTED_REMOVE_MODULES_DIR_NO_TTY`. No install was approved or retried. This does not establish a test failure in the project.

The planning documents were reconciled without changing application code, existing skills, dependency settings, or other ongoing work. Product intent, manual file updates, and the prohibition on migration tooling remain unchanged.

~~~~~~~~~~~~


## Source: AGENTS.md

Origin: release; full-source SHA-256: bcbdfb6a63a26ba62aef738459c5fb24e20d35dd02568b5fe2661a2f236c459e

~~~~~~~~~~~~
# Agent guidance

## Purpose

Build a schema-first diagramming tool for product and user flows. Preserve the distinction between graph data, layout hints, manual positions, and future view-specific state.

## Current product rules

- Show only node titles on the canvas.
- Show full node details in the inspector.
- Keep drag, pan, and trackpad zoom dependable.
- Use rectilinear routes that avoid nodes.
- Keep diagrams compact and readable.
- Treat handoffs and deliverables as distinct semantic types.
- Do not restore a variant lane.
- Model future variants as views of shared starting data.
- Keep the JSON model easy for agents to inspect and change.

## Change process

- Read `docs/product-context.md` before a structural change.
- Preserve the current prototype before a framework migration.
- Update the context document when a product decision changes.
- Test direct pointer interaction after canvas event changes.
- Test automatic layout and manual movement after routing changes.
- Preserve a working fallback when ELK does not load.
- Use pnpm if the project adds JavaScript packages or scripts.

## Git

- Preserve user changes.
- Make small commits on branches other than `main`.
- Use `Byron Wall <byron@byroni.us>` for author and committer identity.

~~~~~~~~~~~~


## Source: README.md

Origin: release; full-source SHA-256: c1e0e24de3c517a7331127e752a1e2be8490e335ea71a4fd641106cd7b2bd342

~~~~~~~~~~~~
# User Flow Workbench

This repository contains a SolidStart SPA for schema-first product and user-flow maps.

The app combines a graph editor, a canvas, an inspector, and layout logic. The initial example maps a truthful resume-tailoring flow. The tool is general. The resume flow is sample data, not the product boundary.

![User Flow Workbench showing an operational flow, variant tabs, and a detail inspector](docs/images/readme/flow-workbench.svg)

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

Build and serve the workbench for every `.flow` file below the current directory:

```sh
pnpm build
pnpm flow view
pnpm flow view path/to/project --port 4317
```

Open the printed local URL. The index lists nested flow files and reports syntax errors.

Render a diagram with the packaged viewer and a local Chrome or Chromium browser:

```sh
pnpm build
pnpm flow render path/to/flow.flow --output tmp/flow.png
pnpm flow render path/to/flows --output-dir tmp/flow-previews --contact-sheet
```

Rendering uses a fresh browser profile and never writes to `.flow` files or browser storage. The default canvas is 1200 × 800 CSS pixels. The supported minimum is 320 × 240 CSS pixels. The legend is hidden below 480 pixels so compact captures keep diagram content visible. Use `--width`, `--height`, `--scale`, and `--variant <id>` to change the capture. For a directory render, `--scale` also increases contact-sheet tile pixels because each tile follows its source PNG size. Existing output files are preserved unless `--overwrite` is set. The renderer does not download a browser; pass `--browser /path/to/chrome` or set `FLOW_WORKBENCH_BROWSER` when Chrome is outside the standard local paths.

Directory renders preserve each source path below the output directory. They write `report.json` with one result for every source file and return a nonzero code if any file fails. `--report <path>` changes the report location. `--json` prints the result as JSON. `--contact-sheet` writes a PNG contact sheet by default with each successful preview retained at its native pixel size; pass a `.svg` path to keep an SVG sheet instead. Large directories split into `-01`, `-02`, and later pages. Existing sheets are preserved unless `--overwrite` is set.

The workbench reads source files from disk. Browser edits remain in local storage and do not change source files.

Install the published CLI globally or run it without installation:

```sh
pnpm add --global user-flow-workbench
flow check path/to/flow.flow
flow view path/to/project

pnpm dlx user-flow-workbench check path/to/flow.flow
pnpm dlx user-flow-workbench view path/to/project
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
- Discover nested `.flow` files through the local `flow view` server.
- Keep browser edits separate for each source path and workspace.

## Project direction

The tool should make complex flows easy to read and easy to revise. The canvas shows the operational path. The inspector shows the needs and UX attached to that path.

Variants are views of the same starting graph. Each variant stores ordered changes. The app materializes each result and renders it in a tab.

See [docs/product-context.md](docs/product-context.md) for the original intent, decisions, and open questions. See [docs/iteration-history.md](docs/iteration-history.md) for the prototype history.

## Architecture

- `src/routes/index.tsx` lists discovered files and loads the selected flow.
- `src/routes/api/flows.ts` serves the file catalog.
- `src/routes/api/graph.ts` safely loads one catalog document as JSON.
- `src/server/flow-catalog.ts` owns discovery, path checks, parsing, and workspace identities.
- `src/components/` contains the page shell, toolbar, DSL panel, canvas, and inspector.
- `src/lib/graph-dsl.ts` parses and writes the agent-facing flow DSL.
- `src/lib/flow-workbench.ts` contains direct manipulation, routing, layout, and the agent API.
- `src/data/flows/*.flow` contains production flow documents.
- `src/styles.css` contains the visual system from the prototype.

ELK is installed as a package and loads as a separate browser bundle. The local Manhattan router remains the fallback. The browser keeps the editable working graph in `localStorage`.

The API parses selected `.flow` files directly. It does not maintain parallel JSON fixtures.

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

~~~~~~~~~~~~


## Source: package.json

Origin: release; full-source SHA-256: e8235a53e6301531dd05e2a83ce862618e0cfdce5ce762ca51c43abe1f0f2c97

~~~~~~~~~~~~
{
  "name": "user-flow-workbench",
  "version": "0.2.0",
  "description": "Schema-first tools for authoring and checking product and user-flow diagrams.",
  "type": "module",
  "bin": {
    "flow": "dist/cli/flow.js"
  },
  "files": [
    "dist",
    "skills/author-flow-diagrams",
    "README.md"
  ],
  "repository": {
    "type": "git",
    "url": "git+https://github.com/byronwall/user-flow-workbench.git"
  },
  "homepage": "https://github.com/byronwall/user-flow-workbench#readme",
  "bugs": {
    "url": "https://github.com/byronwall/user-flow-workbench/issues"
  },
  "keywords": [
    "user-flow",
    "product-flow",
    "diagram",
    "cli"
  ],
  "engines": {
    "node": ">=22.18"
  },
  "publishConfig": {
    "access": "public"
  },
  "scripts": {
    "dev": "vinxi dev",
    "build": "vinxi build",
    "start": "vinxi start",
    "flow": "node --experimental-strip-types src/cli/flow.ts",
    "prepack": "vinxi build && tsc -p tsconfig.cli.json && node scripts/prepare-package.mjs",
    "check:flows": "pnpm flow check",
    "test:dsl": "node --experimental-strip-types --test src/lib/graph-dsl.test.ts src/lib/graph-lint.test.ts src/cli/flow.test.ts src/server/flow-catalog.test.ts",
    "typecheck": "tsc --noEmit"
  },
  "packageManager": "pnpm@11.9.0",
  "dependencies": {
    "pathe": "1.1.2",
    "seroval": "1.5.6",
    "seroval-plugins": "1.5.6",
    "solid-js": "1.9.15",
    "vinxi": "0.5.11"
  },
  "devDependencies": {
    "@solidjs/router": "^0.15.4",
    "@solidjs/start": "^1.3.2",
    "@types/node": "^26.4.0",
    "elkjs": "^0.12.0",
    "typescript": "^7.0.2",
    "vite": "^6.4.3"
  }
}

~~~~~~~~~~~~


## Source: docs/product-context.md

Origin: release; full-source SHA-256: 61fe90099f0e1566a38847bfe8ca97db992e8b3a47fcfa5fc3b37c6479904ab5

~~~~~~~~~~~~
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
- Put the inspector and Flow DSL in tabs within a full-height right sidebar.
- Show active-view descriptions in the sidebar and the variant-impact key in the canvas legend.
- Do not show variant-operation totals in the interface.
- Show the base graph and variants as tabs.
- Keep variant operations separate from the complete graph used by the renderer.
- Permit `clear all` only as the first operation in a replacement variant.

## Current implementation details

- The graph document schema version is `5`.
- The Flow DSL version is `3`.
- Earlier DSL and schema versions are not supported.
- The agent-facing source is a line-based flow DSL.
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
- Production examples live as editable `.flow` files in `src/data/flows`.
- `flow view` serves the packaged SolidStart application on the loopback interface.
- `flow render` captures one file or a directory through the packaged viewer with a fresh local browser profile.
- Render output uses a 1200 × 800 CSS pixel canvas by default, with a supported minimum of 320 × 240 pixels. The legend is hidden below 480 pixels to preserve diagram content. Directory output keeps source-relative paths and writes a JSON report.
- Render startup uses an owned loopback server and launch identity. It waits for layout and final paint, reports ELK or fallback layout, and never downloads a browser.
- The server discovers `.flow` files below its selected root.
- The index shows a picker before it loads a document.
- `GET /api/flows` serves the discovered file catalog.
- `GET /api/graph` parses one validated relative path.
- The server rejects traversal paths, symbolic links, and ignored build directories.
- The browser stores the editable working graph in `localStorage`.
- Browser storage uses the workspace identity and relative source path.
- Browser edits do not write back to source files.
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

## Near-term work

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

~~~~~~~~~~~~


## Source: docs/flow-dsl-spec.md

Origin: release; full-source SHA-256: 19409e5bc1b4dc2e2ea2960f04537c47203d11205c03a948cc10085dd8aec5fe

~~~~~~~~~~~~
# Flow DSL specification

Status: Draft 0.4
DSL version: 3
JSON schema version: 5

## Purpose

Flow DSL describes an operational flow plus semantic needs and UX records. It supports deterministic agent generation and mutation.

The format separates three concerns:

- Nodes and edges contain semantic graph data.
- Edge relations distinguish operational flow from supporting metadata.
- Layout hints and exact positions contain optional presentation data.

A valid graph does not require layout hints or positions. The renderer creates an initial layout when positions are absent.

Variants are ordered changes to the shared base graph. The app materializes each variant as a complete graph view.

## Complete example

```text
flow 3

graph checkout "Online checkout"
description "Checkout flow from purchase intent through confirmation."

node customer actor "Customer"
node payment-method input "Payment method" body="The payment details supplied for authorization." layout=1,1
node payment process "Submit payment" body="Authorize the selected payment method." tags=["checkout","money"] layout=2,1
node confirmation deliverable "Order confirmation" layout=4,1
node trust need "Know whether payment succeeded"
node recovery ux "Explain payment recovery"

edge customer-provides-payment customer -> payment-method
edge method-to-payment payment-method -> payment
edge payment-completes payment -> confirmation label="approved" emphasis=true
edge payment-addresses-trust payment -> trust relation=addresses
edge recovery-at-payment recovery -> payment relation=appears-at
edge recovery-supports-trust recovery -> trust relation=supports

variant saved-card "Use saved card" {
  description "Skip payment entry when a valid saved card exists."
  set node payment title="Confirm saved card"
  set edge payment-completes label="confirmed"
}

position payment-method 354,154
position payment 620,154
position confirmation 1152,154
```

See [checkout.flow](examples/checkout.flow) for a larger example.

Production flow documents live in `src/data/flows`. The API parses these files directly. JSON is a generated render and export format.

## Document structure

Use this command order:

1. One `flow` line.
2. One `graph` line.
3. Zero or one `description` line.
4. One or more `node` lines.
5. Zero or more `edge` lines.
6. Zero or more `variant` blocks.
7. Zero or more base `position` lines.

Each command uses one physical line. Use `\n` for a line break inside a string.

Blank lines can separate sections. A `#` starts a comment outside a quoted string.

## Commands

### Version

```text
flow 3
```

This line is required and must be first. Version 3 is the only supported DSL version. Earlier versions are not supported.

The DSL version and JSON schema version are independent.

### Graph

```text
graph <graph-id> "<title>"
```

The graph ID and quoted title are required.

### Description

```text
description "<description>"
```

The description is optional. It states the scope of the complete graph.

### Node

```text
node <node-id> <type> "<title>" [body="<detail>"] [tags=["<tag>"]] [layout=<column>,<row>]
```

Each node ID must be unique. The node ID, type, and quoted title are required.

Node options use this canonical order:

1. `body`
2. `tags`
3. `layout`

| Option | Value | Meaning |
| --- | --- | --- |
| `body` | Quoted string | Full detail shown in the inspector |
| `tags` | String array | Ordered semantic tags |
| `layout` | Number pair | Preferred semantic column and row |

Tags must be non-empty and unique. Tag order is preserved.

Layout values are hints. They are not exact canvas coordinates. Treat `column` as logical stage order. Automatic layout can wrap long stage sequences into multiple left-to-right rows.

### Edge

```text
edge <edge-id> <from-node-id> -> <to-node-id> [relation=<relation>] [label="<label>"] [emphasis=true]
```

Each edge ID is required and must be unique. Both referenced nodes must exist.

The arrow points from the source node to the target node.

Edge options use this canonical order:

1. `relation`
2. `label`
3. `emphasis`

The relation defaults to `flow`. Canonical output omits `relation=flow`.

| Relation | Required endpoints | Canvas behavior |
| --- | --- | --- |
| `flow` | Operational node → operational node | Rendered and used for layout |
| `addresses` | Operational node → need | Shown in the inspector |
| `supports` | UX → need | Shown in the inspector |
| `appears-at` | UX → operational node | Shown in the inspector |

Operational node types are `actor`, `input`, `process`, `handoff`, and `deliverable`.
Needs, UX nodes, and semantic relations do not enter canvas layout.

`emphasis` accepts `true` or `false`. Canonical output omits `emphasis=false`.

Stable edge IDs must survive insertion, deletion, and reordering.

### Position

```text
position <node-id> <x>,<y>
```

Positions are optional exact canvas coordinates. Each position must reference an existing node.

Delete every position line to request a fresh automatic layout.

### Variant

```text
variant <variant-id> "<title>" {
  description "<purpose>"
  <operation>
}
```

A variant starts from the shared base graph. The materializer applies its operations from top to bottom.

Variant IDs must be unique. Variants do not inherit from other variants. A description is optional.

Supported operations are:

```text
add node <node-id> <type> "<title>" [node options]
add edge <edge-id> <from-node-id> -> <to-node-id> [edge options]
remove node <node-id>
remove edge <edge-id>
set node <node-id> <one or more node options>
set edge <edge-id> <one or more edge options>
unset node <node-id> body|tags|layout
unset edge <edge-id> relation|label|emphasis
position <node-id> <x>,<y>
clear all
```

`set` changes only the listed properties. `unset` removes an optional property. Required IDs, node types, titles, and edge endpoints cannot be unset.

`clear all` removes all inherited nodes, edges, hints, and positions. It must be the first operation. Add a complete replacement graph after it. The result must contain at least one node and cannot contain a dangling edge.

Removing a node does not silently remove its edges. Remove connected edges first. This rule makes structural changes explicit for agents.

Variant positions override base positions for the same node. Positions are optional. A variant with missing positions receives a fresh automatic layout. Dragging a node in a variant appends or updates its `position` operation.

### Materialization and JSON

Schema version 5 stores the agent document in this shape:

```json
{
  "dslVersion": 3,
  "schemaVersion": 5,
  "graph": { "id": "checkout", "title": "Online checkout", "nodes": [], "edges": [] },
  "variants": [
    { "id": "saved-card", "title": "Use saved card", "operations": [] }
  ]
}
```

`materializeVariant(document, variantId)` returns a complete `FlowGraph`. The renderer does not interpret variant operations.

The interface shows the base graph and each variant as tabs. It derives the impact summary from the ordered operations.

## Node-type semantics

| Type | Required meaning | Good example | Do not use for |
| --- | --- | --- | --- |
| `actor` | Person or system that performs actions | `Customer` | An action or outcome |
| `need` | Problem, constraint, or user motivation | `Understand delivery timing` | An operational step |
| `input` | Information or material that enters this flow from outside it | `Target job posting` | An artifact created by this flow |
| `process` | Operational action or transformation | `Validate payment` | A UI surface |
| `handoff` | Transfer of information, control, or state | `Payment result` | The resulting artifact |
| `deliverable` | Durable artifact or output | `Order receipt` | The transfer that produced it |
| `ux` | User interaction, interface behavior, or guidance | `Explain payment recovery` | Backend-only processing |

Use `need` and `ux` as semantic records. Connect them with typed semantic relations. They do not render on the canvas.

Use `input` for a resource that crosses into the flow. Connect its provider and its first consumer.

Use `handoff` for a transfer. Use `deliverable` for the durable item transferred or produced.

The renderer derives outcomes. A `deliverable` with no outgoing `flow` edge is an outcome. An intermediate deliverable remains an artifact.

## Lint rules

Run `pnpm flow check` to parse and lint production and example `.flow` files.
Pass file or directory paths to check other flows.

`FLOWLINT001` reports each `process` node that has no outgoing `flow` edge.
The check materializes every variant.
A semantic edge such as `addresses` does not count as process output.

Run `pnpm flow format <path>` to rewrite files in canonical form.
Use `pnpm flow format --check <path>` to check formatting without editing files.

## Lexical rules

### Identifiers

Graph, variant, node, and edge identifiers use this pattern:

```text
[A-Za-z0-9][A-Za-z0-9._-]*
```

Identifiers are case-sensitive. They cannot contain spaces or Unicode letters.

Keep identifiers stable. Do not derive them from positions or source-line numbers.

### Strings

All string values use double quotes. This applies even when a value contains one word.

Supported escapes:

| Escape | Value |
| --- | --- |
| `\"` | Double quote |
| `\\` | Backslash |
| `\n` | Line break |

Unknown escapes are errors.

### Numbers

Numbers use this grammar:

```text
-?(0|[1-9][0-9]*)(\.[0-9]+)?
```

Examples of valid numbers:

```text
0
2
2.5
-18
```

Examples of invalid numbers:

```text
+12
.5
01
1e3
NaN
Infinity
```

Canonical output removes redundant decimal zeros. It serializes negative zero as `0`.

### Collections

Tags use a JSON-style string array:

```text
tags=["checkout","money"]
```

Canonical output does not put spaces after commas.

### Whitespace

The parser accepts spaces and tabs between tokens. Canonical output uses these rules:

- Use one ASCII space between tokens.
- Use no spaces around `=`.
- Use no spaces around numeric commas.
- Use one space on each side of `->`.
- Use LF line endings.
- End the document with exactly one newline.
- Put one blank line between non-empty sections.

Node and edge order is preserved. Position order follows node order.

### Comments

Comments are expendable. They do not enter the graph AST or JSON.

Parsing and formatting removes all comments. Do not store required information only in comments.

## Normative grammar

This EBNF defines the accepted command shapes. `WS` means one or more spaces or tabs.

```text
document       = version, NL+, graph, NL+, description?, node+, edge*, variant*, position*, EOF ;
version        = "flow", WS, "3" ;
graph          = "graph", WS, id, WS, string ;
description    = "description", WS, string ;

node           = "node", WS, id, WS, nodeType, WS, string, nodeOption* ;
nodeOption     = WS, (body | tags | layout) ;
body           = "body=", string ;
tags           = "tags=", stringArray ;
layout         = "layout=", number, ",", number ;

edge           = "edge", WS, id, WS, id, WS, "->", WS, id, edgeOption* ;
edgeOption     = WS, (relation | label | emphasis) ;
relation       = "relation=", edgeRelation ;
label          = "label=", string ;
emphasis       = "emphasis=", ("true" | "false") ;

variant        = "variant", WS, id, WS, string, WS?, "{", NL,
                 variantDescription?, operation*, "}" ;
variantDescription = WS*, "description", WS, string, NL ;
operation      = WS*, (add | remove | set | unset | clear | position), NL ;
add            = "add", WS, (node | edge) ;
remove         = "remove", WS, ("node" | "edge"), WS, id ;
set            = "set", WS, ("node" | "edge"), WS, id, option+ ;
unset          = "unset", WS, ("node" | "edge"), WS, id, WS, id ;
clear          = "clear", WS, "all" ;

position       = "position", WS, id, WS, number, ",", number ;
nodeType       = "actor" | "need" | "input" | "process" | "handoff" |
                 "deliverable" | "ux" ;
edgeRelation   = "flow" | "addresses" | "supports" | "appears-at" ;
stringArray    = "[", [string, {",", string}], "]" ;
id             = idStart, {idContinue} ;
idStart        = ASCII_LETTER | DIGIT ;
idContinue     = idStart | "." | "_" | "-" ;
number         = ["-"], DIGIT_SEQUENCE, [".", DIGIT_SEQUENCE] ;
string         = '"', {stringCharacter | escape}, '"' ;
escape         = '\\"' | '\\\\' | '\\n' ;
```

The parser treats a newline as a recovery boundary. It can skip one malformed command and continue.

## Canonical formatting

`graphToDsl` produces one canonical representation. It applies these option orders:

- Node: `body`, `tags`, `layout`.
- Edge: `relation`, `label`, `emphasis`.

It preserves node and edge array order. It omits absent options and `emphasis=false`.

These invariants must hold:

```text
parse(format(graph)) == graph
```

```text
format(parse(format(parse(source)))) == format(parse(source))
```

The second invariant means formatting is idempotent.

## JSON mapping

The strict parser returns a schema version 5 document.

| DSL field | JSON field |
| --- | --- |
| `flow 3` | `dslVersion: 3` |
| Graph ID | `id` |
| Graph title | `title` |
| Description | `description` |
| Node ID | `nodes[].id` |
| Node type | `nodes[].type` |
| Node title | `nodes[].title` |
| `body` | `nodes[].body` |
| `tags` | `nodes[].tags` |
| Edge ID | `edges[].id` |
| Edge source | `edges[].from` |
| Edge target | `edges[].to` |
| `relation` | `edges[].relation` |
| `label` | `edges[].label` |
| `emphasis=true` | `edges[].emphasis: true` |
| Node `layout` | `layout.hints[nodeId]` |
| `position` | `layout.positions[nodeId]` |

Semantic nodes and edges never contain presentation fields.

The complete `layout` object is optional. Its `hints` and `positions` maps are also optional.

## Diagnostics contract

`parseGraphDsl` stops on the first diagnostic. It throws `GraphDslError`.

`parseGraphDslWithDiagnostics` returns a partial graph and all recoverable diagnostics.

Each diagnostic includes:

- Stable error code.
- Error category.
- One-based line.
- One-based column.
- Source span length.
- Human-readable message.
- Actual value when useful.
- Expected value when useful.
- Related entity ID when useful.
- Suggested correction when confidence is high.

Example:

```text
[FLOW203] line 18, column 39: Unknown node "confirmaton". Did you mean "confirmation"?
```

Stable diagnostic groups:

| Range | Category |
| --- | --- |
| `FLOW1xx` | Syntax, version, structure, identifier, or option error |
| `FLOW2xx` | Duplicate identity or unresolved reference |

A malformed command does not prevent later valid lines from entering the partial graph.

## Validation rules

A canonical document must meet these rules:

- It starts with `flow 3`.
- It has one graph line and at least one node.
- Command sections use the required order.
- Every node and edge ID is unique.
- Every edge and position reference resolves.
- Every node uses an allowed node type.
- Every edge relation uses the required endpoint types.
- Every option uses `key=value`.
- Every string uses double quotes.
- Tags are non-empty, unique strings.
- Numeric pairs contain exactly two valid numbers.
- Unknown commands, options, and escapes are errors.
- Variants do not appear as node types.

## Agent evaluation checklist

1. Parseability: The complete document has no diagnostics.
2. Canonicality: Formatting the document produces no further changes.
3. Structure: Nodes use one line each, and edges follow nodes.
4. References: Every edge and position reference resolves.
5. Identity: Node and edge IDs remain stable across unrelated edits.
6. Semantics: Each node follows its normative type definition.
7. Detail: Titles stay concise, while supporting detail uses `body`.
8. Direction: Edge arrows match the intended flow direction.
9. Layout independence: Removing presentation data keeps the same semantic graph.
10. Variant readiness: No variant node or variant lane exists.

## Portable links and mutation regression suite

Normative and distributed references must use links that resolve from the directory that contains the reference. Do not link from this specification to repository-only files. Name repository-only paths in code spans and explain their checkout context.

The executable mutation suite is `src/lib/graph-dsl.test.ts` in the User Flow Workbench checkout. It is not part of the distributed authoring skill. Run it from that checkout with:

It covers these agent operations:

1. Change a node title.
2. Add a node.
3. Remove a node or edge.
4. Rename a node and update references.
5. Add an edge with a stable ID.
6. Change an edge label.
7. Add or remove a tag.
8. Reorder edges without changing identity.
9. Add layout hints without changing semantics.
10. Remove all presentation data.
11. Diagnose an unknown node reference.
12. Recover after a malformed line.

Run it with:

```sh
pnpm test:dsl
```

~~~~~~~~~~~~


## Source: src/types/graph.ts

Origin: release; full-source SHA-256: 6b55f8dccd1145950c3e5679a1762aa92f2587d791722ba83648a77ab209a488

~~~~~~~~~~~~
export const NODE_TYPES = [
  "actor",
  "need",
  "input",
  "process",
  "handoff",
  "deliverable",
  "ux",
] as const;

export type NodeType = (typeof NODE_TYPES)[number];

export const EDGE_RELATIONS = ["flow", "addresses", "supports", "appears-at"] as const;

export type EdgeRelation = (typeof EDGE_RELATIONS)[number];

export interface GraphNode {
  id: string;
  type: NodeType;
  title: string;
  body?: string;
  tags?: string[];
}

export interface GraphEdge {
  id: string;
  from: string;
  to: string;
  relation?: EdgeRelation;
  label?: string;
  emphasis?: boolean;
}

export interface LayoutHint {
  column: number;
  row: number;
}

export interface NodePosition {
  x: number;
  y: number;
}

export interface GraphLayout {
  hints?: Record<string, LayoutHint>;
  positions?: Record<string, NodePosition>;
}

export interface FlowGraph {
  id: string;
  title: string;
  description?: string;
  nodes: GraphNode[];
  edges: GraphEdge[];
  layout?: GraphLayout;
}

export type NodeSetChanges = Partial<Pick<GraphNode, "type" | "title" | "body" | "tags">> & {
  layout?: LayoutHint;
};

export type EdgeSetChanges = Partial<Pick<GraphEdge, "from" | "to" | "relation" | "label" | "emphasis">>;

export type VariantOperation =
  | { kind: "clear-all" }
  | { kind: "add-node"; node: GraphNode; layout?: LayoutHint }
  | { kind: "add-edge"; edge: GraphEdge }
  | { kind: "remove-node"; nodeId: string }
  | { kind: "remove-edge"; edgeId: string }
  | { kind: "set-node"; nodeId: string; changes: NodeSetChanges }
  | { kind: "set-edge"; edgeId: string; changes: EdgeSetChanges }
  | { kind: "unset-node"; nodeId: string; property: "body" | "tags" | "layout" }
  | { kind: "unset-edge"; edgeId: string; property: "relation" | "label" | "emphasis" }
  | { kind: "set-position"; nodeId: string; position: NodePosition };

export interface FlowVariant {
  id: string;
  title: string;
  description?: string;
  operations: VariantOperation[];
}

/** The persisted, agent-facing document. Variants store ordered differences from graph. */
export interface FlowDocument {
  dslVersion: 3;
  schemaVersion: 5;
  graph: FlowGraph;
  variants: FlowVariant[];
}

/** The normalized canvas projection. The renderer always has usable layout values. */
export interface CanvasNode extends GraphNode {
  body: string;
  tags: string[];
  layout: LayoutHint;
  position: NodePosition;
}

export interface CanvasEdge extends GraphEdge {
  id: string;
  label: string;
  emphasis: boolean;
}

export interface CanvasGraph {
  id: string;
  title: string;
  description: string;
  nodes: CanvasNode[];
  edges: CanvasEdge[];
}

~~~~~~~~~~~~


## Source: src/lib/graph-dsl.ts

Origin: release; full-source SHA-256: 2ec63d27cc125473507562dc88e48b7bbc114e4436cfd49d7fc19618b01be0ec

~~~~~~~~~~~~
import { EDGE_RELATIONS, NODE_TYPES } from "../types/graph.ts";
import type {
  EdgeRelation,
  EdgeSetChanges,
  FlowDocument,
  FlowGraph,
  FlowVariant,
  GraphEdge,
  GraphNode,
  LayoutHint,
  NodePosition,
  NodeSetChanges,
  NodeType,
  VariantOperation,
} from "../types/graph.ts";

export const FLOW_DSL_VERSION = 3 as const;
export const FLOW_SCHEMA_VERSION = 5 as const;

const IDENTIFIER_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._-]*$/;
const NUMBER_SOURCE = "-?(?:0|[1-9][0-9]*)(?:\\.[0-9]+)?";
const NUMBER_PATTERN = new RegExp(`^${NUMBER_SOURCE}$`);
const PAIR_PATTERN = new RegExp(`^(${NUMBER_SOURCE}),(${NUMBER_SOURCE})$`);
const NODE_TYPE_SET = new Set<string>(NODE_TYPES);
const EDGE_RELATION_SET = new Set<string>(EDGE_RELATIONS);
const OPERATIONAL_NODE_TYPES = new Set<NodeType>(["actor", "input", "process", "handoff", "deliverable"]);

export type GraphDslDiagnosticCategory =
  | "syntax"
  | "version"
  | "structure"
  | "identifier"
  | "option"
  | "reference"
  | "variant";

export interface GraphDslDiagnostic {
  code: string;
  category: GraphDslDiagnosticCategory;
  message: string;
  line: number;
  column: number;
  length: number;
  actual?: string;
  expected?: string;
  relatedId?: string;
  variantId?: string;
  suggestion?: string;
}

export interface GraphDslParseResult {
  document: FlowDocument;
  diagnostics: GraphDslDiagnostic[];
}

interface Token {
  raw: string;
  line: number;
  start: number;
  end: number;
}

interface LocatedEdge {
  value: GraphEdge;
  from: Token;
  to: Token;
}

interface LocatedPosition {
  nodeId: string;
  token: Token;
}

interface LocatedVariant {
  value: FlowVariant;
  token: Token;
  operationTokens: Token[];
  descriptionSeen: boolean;
  operationsStarted: boolean;
}

export class GraphDslError extends Error {
  diagnostic: GraphDslDiagnostic;
  line: number;
  column: number;
  code: string;

  constructor(diagnostic: GraphDslDiagnostic) {
    super(formatGraphDslDiagnostic(diagnostic));
    this.name = "GraphDslError";
    this.diagnostic = diagnostic;
    this.line = diagnostic.line;
    this.column = diagnostic.column;
    this.code = diagnostic.code;
  }
}

export class VariantMaterializationError extends Error {
  code: string;
  variantId: string;
  operationIndex: number;
  relatedIds: string[];

  constructor(code: string, variantId: string, operationIndex: number, message: string, relatedIds: string[] = []) {
    super(message);
    this.name = "VariantMaterializationError";
    this.code = code;
    this.variantId = variantId;
    this.operationIndex = operationIndex;
    this.relatedIds = relatedIds;
  }
}

export function formatGraphDslDiagnostic(diagnostic: GraphDslDiagnostic): string {
  const location = `line ${diagnostic.line}, column ${diagnostic.column}`;
  const variant = diagnostic.variantId ? ` Variant "${diagnostic.variantId}".` : "";
  return `[${diagnostic.code}] ${location}: ${diagnostic.message}${variant}${diagnostic.suggestion ? ` ${diagnostic.suggestion}` : ""}`;
}

export function parseGraphDsl(source: string): FlowDocument {
  const result = parseGraphDslWithDiagnostics(source);
  if (result.diagnostics.length) throw new GraphDslError(result.diagnostics[0]);
  return result.document;
}

export function parseGraphDslWithDiagnostics(source: string): GraphDslParseResult {
  let id = "untitled-flow";
  let title = "Untitled flow";
  let description = "";
  let versionSeen = false;
  let graphSeen = false;
  let descriptionSeen = false;
  let stage = 0;
  let activeVariant: LocatedVariant | null = null;
  const nodes: GraphNode[] = [];
  const locatedEdges: LocatedEdge[] = [];
  const hints: Record<string, LayoutHint> = {};
  const positions: Record<string, NodePosition> = {};
  const locatedPositions: LocatedPosition[] = [];
  const nodeIds = new Set<string>();
  const edgeIds = new Set<string>();
  const variants: LocatedVariant[] = [];
  const variantIds = new Set<string>();
  const diagnostics: GraphDslDiagnostic[] = [];

  source.split(/\r?\n/).forEach((rawLine, index) => {
    const line = index + 1;
    let tokens: Token[];
    try {
      tokens = tokenize(rawLine, line);
    } catch (error) {
      diagnostics.push(toDiagnostic(error));
      return;
    }
    if (!tokens.length) return;
    const command = tokens[0].raw;

    try {
      if (activeVariant) {
        if (command === "}") {
          requireCount(tokens, 1, "}");
          variants.push(activeVariant);
          activeVariant = null;
          stage = 5;
          return;
        }
        if (command === "variant") {
          fail("FLOW310", "variant", tokens[0], "Nested variant blocks are not supported.", {
            variantId: activeVariant.value.id,
          });
        }
        if (command === "description") {
          if (activeVariant.descriptionSeen || activeVariant.operationsStarted) {
            fail("FLOW311", "variant", tokens[0], "Variant description must appear once before all operations.", {
              variantId: activeVariant.value.id,
            });
          }
          requireCount(tokens, 2, 'description "<text>"');
          activeVariant.value.description = parseQuotedString(tokens[1]);
          activeVariant.descriptionSeen = true;
          return;
        }
        const operation = parseVariantOperation(tokens, activeVariant.value.id);
        activeVariant.value.operations.push(operation);
        activeVariant.operationTokens.push(tokens[0]);
        activeVariant.operationsStarted = true;
        return;
      }

      if (command === "flow") {
        requireStage(stage, 0, tokens[0], "The flow version must be the first command.");
        requireCount(tokens, 2, `flow ${FLOW_DSL_VERSION}`);
        if (versionSeen) fail("FLOW107", "structure", tokens[0], "The flow version appears more than once.");
        if (tokens[1].raw !== String(FLOW_DSL_VERSION)) {
          fail("FLOW101", "version", tokens[1], `Unsupported Flow DSL version "${tokens[1].raw}".`, {
            actual: tokens[1].raw,
            expected: String(FLOW_DSL_VERSION),
            suggestion: `Use flow ${FLOW_DSL_VERSION}.`,
          });
        }
        versionSeen = true;
        stage = 1;
        return;
      }

      if (command === "graph") {
        requireStage(stage, 1, tokens[0], "The graph command must follow the flow version.");
        requireCount(tokens, 3, 'graph <id> "<title>"');
        id = parseIdentifier(tokens[1]);
        title = parseQuotedString(tokens[2]);
        graphSeen = true;
        stage = 2;
        return;
      }

      if (command === "description") {
        requireStage(stage, 2, tokens[0], "Description must follow graph and precede nodes.");
        requireCount(tokens, 2, 'description "<text>"');
        if (descriptionSeen) fail("FLOW109", "structure", tokens[0], "Description appears more than once.");
        description = parseQuotedString(tokens[1]);
        descriptionSeen = true;
        stage = 3;
        return;
      }

      if (command === "node") {
        if (stage < 2 || stage > 3) fail("FLOW106", "structure", tokens[0], "Nodes must follow graph and precede edges.");
        const parsed = parseNode(tokens);
        if (nodeIds.has(parsed.value.id)) {
          fail("FLOW201", "identifier", tokens[1], `Duplicate node ID "${parsed.value.id}".`, { relatedId: parsed.value.id });
        }
        nodeIds.add(parsed.value.id);
        nodes.push(parsed.value);
        if (parsed.layout) hints[parsed.value.id] = parsed.layout;
        stage = 3;
        return;
      }

      if (command === "edge") {
        if (stage < 3 || stage > 4) fail("FLOW106", "structure", tokens[0], "Edges must follow all nodes and precede variants.");
        const parsed = parseEdge(tokens);
        if (edgeIds.has(parsed.value.id)) {
          fail("FLOW202", "identifier", tokens[1], `Duplicate edge ID "${parsed.value.id}".`, { relatedId: parsed.value.id });
        }
        edgeIds.add(parsed.value.id);
        locatedEdges.push(parsed);
        stage = 4;
        return;
      }

      if (command === "variant") {
        if (stage < 3 || stage > 5) fail("FLOW106", "structure", tokens[0], "Variants must follow all nodes and edges.");
        requireCount(tokens, 4, 'variant <id> "<title>" {');
        const variantId = parseIdentifier(tokens[1]);
        if (tokens[3].raw !== "{") fail("FLOW312", "variant", tokens[3], 'Variant header must end with "{".');
        if (variantIds.has(variantId)) {
          fail("FLOW301", "variant", tokens[1], `Duplicate variant ID "${variantId}".`, { variantId });
        }
        variantIds.add(variantId);
        activeVariant = {
          value: { id: variantId, title: parseQuotedString(tokens[2]), operations: [] },
          token: tokens[0],
          operationTokens: [],
          descriptionSeen: false,
          operationsStarted: false,
        };
        stage = 5;
        return;
      }

      if (command === "position") {
        if (stage < 3 || stage > 6) fail("FLOW106", "structure", tokens[0], "Positions must follow all nodes, edges, and variants.");
        requireCount(tokens, 3, "position <node-id> <x>,<y>");
        const nodeId = parseIdentifier(tokens[1]);
        if (positions[nodeId]) fail("FLOW204", "identifier", tokens[1], `Duplicate position for node "${nodeId}".`, { relatedId: nodeId });
        positions[nodeId] = parsePair(tokens[2], "position", ["x", "y"]);
        locatedPositions.push({ nodeId, token: tokens[1] });
        stage = 6;
        return;
      }

      if (command === "}") fail("FLOW313", "variant", tokens[0], "Closing brace has no open variant block.");

      const suggestion = nearest(command, ["flow", "graph", "description", "node", "edge", "variant", "position"]);
      fail("FLOW110", "syntax", tokens[0], `Unknown command "${command}".`, {
        actual: command,
        expected: "flow, graph, description, node, edge, variant, or position",
        ...(suggestion ? { suggestion: `Did you mean "${suggestion}"?` } : {}),
      });
    } catch (error) {
      diagnostics.push(toDiagnostic(error));
    }
  });

  if (activeVariant) {
    diagnostics.push(makeDiagnostic("FLOW314", "variant", activeVariant.token, "Variant block is missing its closing brace.", {
      variantId: activeVariant.value.id,
    }));
    variants.push(activeVariant);
  }
  if (!versionSeen) diagnostics.push(documentDiagnostic("FLOW102", "version", "Missing Flow DSL version.", `Add flow ${FLOW_DSL_VERSION} as the first command.`));
  if (!graphSeen) diagnostics.push(documentDiagnostic("FLOW205", "structure", "Missing graph command.", `Add graph <id> "<title>" after flow ${FLOW_DSL_VERSION}.`));
  if (!nodes.length) diagnostics.push(documentDiagnostic("FLOW206", "structure", "The base graph requires at least one valid node."));

  for (const edge of locatedEdges) {
    validateNodeReference(edge.from, edge.value.from, nodeIds, diagnostics, edge.value.id);
    validateNodeReference(edge.to, edge.value.to, nodeIds, diagnostics, edge.value.id);
  }
  const nodesById = new Map(nodes.map((node) => [node.id, node]));
  for (const edge of locatedEdges) validateEdgeRelation(edge, nodesById, diagnostics);
  for (const position of locatedPositions) validateNodeReference(position.token, position.nodeId, nodeIds, diagnostics);

  const hasHints = Object.keys(hints).length > 0;
  const hasPositions = Object.keys(positions).length > 0;
  const document: FlowDocument = {
    dslVersion: FLOW_DSL_VERSION,
    schemaVersion: FLOW_SCHEMA_VERSION,
    graph: {
      id,
      title,
      ...(description ? { description } : {}),
      nodes,
      edges: locatedEdges.map((edge) => edge.value),
      ...(hasHints || hasPositions ? {
        layout: {
          ...(hasHints ? { hints } : {}),
          ...(hasPositions ? { positions } : {}),
        },
      } : {}),
    },
    variants: variants.map((variant) => variant.value),
  };

  for (const variant of variants) {
    try {
      materializeVariant(document, variant.value.id);
    } catch (error) {
      if (!(error instanceof VariantMaterializationError)) throw error;
      const token = variant.operationTokens[error.operationIndex] || variant.token;
      diagnostics.push(makeDiagnostic(error.code, "variant", token, error.message, {
        variantId: variant.value.id,
        ...(error.relatedIds[0] ? { relatedId: error.relatedIds[0] } : {}),
      }));
    }
  }

  return {
    document,
    diagnostics: diagnostics.sort((a, b) => a.line - b.line || a.column - b.column || a.code.localeCompare(b.code)),
  };
}

export function materializeVariant(document: FlowDocument, variantId: string): FlowGraph {
  const variant = document.variants.find((candidate) => candidate.id === variantId);
  if (!variant) throw new VariantMaterializationError("FLOW302", variantId, -1, `Unknown variant "${variantId}".`);
  const graph = clone(document.graph);
  let clearSeen = false;

  variant.operations.forEach((operation, index) => {
    const nodeById = () => new Map(graph.nodes.map((node) => [node.id, node]));
    const edgeById = () => new Map(graph.edges.map((edge) => [edge.id, edge]));

    if (operation.kind === "clear-all") {
      if (clearSeen || index !== 0) {
        throw variantError("FLOW315", variant, index, "clear all must be the first and only clear operation.");
      }
      clearSeen = true;
      graph.nodes = [];
      graph.edges = [];
      delete graph.layout;
      return;
    }

    if (operation.kind === "add-node") {
      if (nodeById().has(operation.node.id)) {
        throw variantError("FLOW303", variant, index, `Cannot add node "${operation.node.id}" because it already exists.`, [operation.node.id]);
      }
      graph.nodes.push(clone(operation.node));
      if (operation.layout) {
        graph.layout ||= {};
        graph.layout.hints ||= {};
        graph.layout.hints[operation.node.id] = clone(operation.layout);
      }
      return;
    }

    if (operation.kind === "add-edge") {
      if (edgeById().has(operation.edge.id)) {
        throw variantError("FLOW304", variant, index, `Cannot add edge "${operation.edge.id}" because it already exists.`, [operation.edge.id]);
      }
      const nodes = nodeById();
      const missing = [operation.edge.from, operation.edge.to].filter((nodeId) => !nodes.has(nodeId));
      if (missing.length) {
        throw variantError("FLOW305", variant, index, `Cannot add edge "${operation.edge.id}". Unknown node: ${missing.join(", ")}.`, missing);
      }
      graph.edges.push(clone(operation.edge));
      return;
    }

    if (operation.kind === "remove-node") {
      if (!nodeById().has(operation.nodeId)) {
        throw variantError("FLOW306", variant, index, `Cannot remove missing node "${operation.nodeId}".`, [operation.nodeId]);
      }
      graph.nodes = graph.nodes.filter((node) => node.id !== operation.nodeId);
      if (graph.layout?.hints) delete graph.layout.hints[operation.nodeId];
      if (graph.layout?.positions) delete graph.layout.positions[operation.nodeId];
      return;
    }

    if (operation.kind === "remove-edge") {
      if (!edgeById().has(operation.edgeId)) {
        throw variantError("FLOW307", variant, index, `Cannot remove missing edge "${operation.edgeId}".`, [operation.edgeId]);
      }
      graph.edges = graph.edges.filter((edge) => edge.id !== operation.edgeId);
      return;
    }

    if (operation.kind === "set-node") {
      const node = nodeById().get(operation.nodeId);
      if (!node) throw variantError("FLOW308", variant, index, `Cannot set missing node "${operation.nodeId}".`, [operation.nodeId]);
      const { layout, ...semanticChanges } = operation.changes;
      Object.assign(node, clone(semanticChanges));
      if (layout) {
        graph.layout ||= {};
        graph.layout.hints ||= {};
        graph.layout.hints[operation.nodeId] = clone(layout);
      }
      return;
    }

    if (operation.kind === "set-edge") {
      const edge = edgeById().get(operation.edgeId);
      if (!edge) throw variantError("FLOW309", variant, index, `Cannot set missing edge "${operation.edgeId}".`, [operation.edgeId]);
      const nextFrom = operation.changes.from || edge.from;
      const nextTo = operation.changes.to || edge.to;
      const nodes = nodeById();
      const missing = [nextFrom, nextTo].filter((nodeId) => !nodes.has(nodeId));
      if (missing.length) {
        throw variantError("FLOW305", variant, index, `Cannot retarget edge "${operation.edgeId}". Unknown node: ${missing.join(", ")}.`, missing);
      }
      Object.assign(edge, clone(operation.changes));
      return;
    }

    if (operation.kind === "unset-node") {
      const node = nodeById().get(operation.nodeId);
      if (!node) throw variantError("FLOW308", variant, index, `Cannot unset a property on missing node "${operation.nodeId}".`, [operation.nodeId]);
      if (operation.property === "layout") {
        if (!graph.layout?.hints?.[operation.nodeId]) {
          throw variantError("FLOW316", variant, index, `Node "${operation.nodeId}" has no layout hint to unset.`, [operation.nodeId]);
        }
        delete graph.layout.hints[operation.nodeId];
      } else {
        if (!(operation.property in node)) {
          throw variantError("FLOW316", variant, index, `Node "${operation.nodeId}" has no ${operation.property} to unset.`, [operation.nodeId]);
        }
        delete node[operation.property];
      }
      return;
    }

    if (operation.kind === "unset-edge") {
      const edge = edgeById().get(operation.edgeId);
      if (!edge) throw variantError("FLOW309", variant, index, `Cannot unset a property on missing edge "${operation.edgeId}".`, [operation.edgeId]);
      if (!(operation.property in edge)) {
        throw variantError("FLOW316", variant, index, `Edge "${operation.edgeId}" has no ${operation.property} to unset.`, [operation.edgeId]);
      }
      delete edge[operation.property];
      return;
    }

    if (operation.kind === "set-position") {
      if (!nodeById().has(operation.nodeId)) {
        throw variantError("FLOW308", variant, index, `Cannot position missing node "${operation.nodeId}".`, [operation.nodeId]);
      }
      graph.layout ||= {};
      graph.layout.positions ||= {};
      graph.layout.positions[operation.nodeId] = clone(operation.position);
    }
  });

  const nodes = new Set(graph.nodes.map((node) => node.id));
  const dangling = graph.edges.filter((edge) => !nodes.has(edge.from) || !nodes.has(edge.to));
  if (dangling.length) {
    const missingNodes = [...new Set(dangling.flatMap((edge) => [edge.from, edge.to]).filter((nodeId) => !nodes.has(nodeId)))];
    const edgeList = dangling.map((edge) => `"${edge.id}"`).join(", ");
    throw variantError(
      "FLOW317",
      variant,
      Math.max(0, variant.operations.length - 1),
      `Materialized graph has dangling edge${dangling.length === 1 ? "" : "s"} ${edgeList}. Remove or retarget them explicitly.`,
      missingNodes,
    );
  }
  if (!graph.nodes.length) {
    throw variantError("FLOW318", variant, Math.max(0, variant.operations.length - 1), "Materialized graph must contain at least one node.");
  }
  const nodesById = new Map(graph.nodes.map((node) => [node.id, node]));
  for (const edge of graph.edges) {
    const source = nodesById.get(edge.from);
    const target = nodesById.get(edge.to);
    if (!source || !target) continue;
    const message = edgeRelationError(edge, source, target);
    if (message) {
      throw variantError("FLOW328", variant, Math.max(0, variant.operations.length - 1), message, [edge.id]);
    }
  }
  return graph;
}

export function graphToDsl(document: FlowDocument, options: { includePositions?: boolean } = {}): string {
  if (document.dslVersion !== FLOW_DSL_VERSION) {
    throw new Error(`Cannot format Flow DSL version "${document.dslVersion}". Expected version ${FLOW_DSL_VERSION}.`);
  }
  const graph = document.graph;
  const sections: string[][] = [
    [`flow ${FLOW_DSL_VERSION}`],
    [
      `graph ${formatIdentifier(graph.id)} ${quote(graph.title)}`,
      ...(graph.description ? [`description ${quote(graph.description)}`] : []),
    ],
    graph.nodes.map((node) => formatNode(node, graph.layout?.hints?.[node.id])),
  ];

  if (graph.edges.length) sections.push(graph.edges.map(formatEdge));
  if (document.variants.length) sections.push(document.variants.map(formatVariant));

  if (options.includePositions && graph.layout?.positions) {
    const lines = graph.nodes.flatMap((node) => {
      const position = graph.layout?.positions?.[node.id];
      return position ? [`position ${formatIdentifier(node.id)} ${formatPair(position.x, position.y)}`] : [];
    });
    if (lines.length) sections.push(lines);
  }

  return `${sections.filter((section) => section.length).map((section) => section.join("\n")).join("\n\n")}\n`;
}

function parseVariantOperation(tokens: Token[], variantId: string): VariantOperation {
  const verb = tokens[0].raw;
  if (verb === "clear") {
    requireCount(tokens, 2, "clear all");
    if (tokens[1].raw !== "all") fail("FLOW319", "variant", tokens[1], 'clear only supports "all".', { variantId });
    return { kind: "clear-all" };
  }
  if (verb === "position") {
    requireCount(tokens, 3, "position <node-id> <x>,<y>");
    return { kind: "set-position", nodeId: parseIdentifier(tokens[1]), position: parsePair(tokens[2], "position", ["x", "y"]) };
  }
  if (verb === "add") {
    if (tokens[1]?.raw === "node") {
      const parsed = parseNode([tokens[1], ...tokens.slice(2)]);
      return { kind: "add-node", node: parsed.value, ...(parsed.layout ? { layout: parsed.layout } : {}) };
    }
    if (tokens[1]?.raw === "edge") return { kind: "add-edge", edge: parseEdge([tokens[1], ...tokens.slice(2)]).value };
    fail("FLOW320", "variant", tokens[1] || tokens[0], "add requires node or edge.", { variantId });
  }
  if (verb === "remove") {
    requireCount(tokens, 3, "remove <node|edge> <id>");
    const targetId = parseIdentifier(tokens[2]);
    if (tokens[1].raw === "node") return { kind: "remove-node", nodeId: targetId };
    if (tokens[1].raw === "edge") return { kind: "remove-edge", edgeId: targetId };
    fail("FLOW321", "variant", tokens[1], "remove requires node or edge.", { variantId });
  }
  if (verb === "set") {
    if (tokens.length < 4) fail("FLOW322", "variant", tokens[0], "set requires a target and at least one property.", { variantId });
    const targetId = parseIdentifier(tokens[2]);
    if (tokens[1].raw === "node") {
      const options = readOptions(tokens.slice(3), new Set(["type", "title", "body", "tags", "layout"]));
      const changes: NodeSetChanges = {};
      if (options.type) changes.type = parseNodeType(optionToken(options.type));
      if (options.title) changes.title = parseQuotedString(optionToken(options.title));
      if (options.body) changes.body = parseQuotedString(optionToken(options.body));
      if (options.tags) changes.tags = parseTags(options.tags);
      if (options.layout) changes.layout = parsePair(options.layout, "layout", ["column", "row"]);
      return { kind: "set-node", nodeId: targetId, changes };
    }
    if (tokens[1].raw === "edge") {
      const options = readOptions(tokens.slice(3), new Set(["from", "to", "relation", "label", "emphasis"]));
      const changes: EdgeSetChanges = {};
      if (options.from) changes.from = parseIdentifier(optionToken(options.from));
      if (options.to) changes.to = parseIdentifier(optionToken(options.to));
      if (options.relation) changes.relation = parseEdgeRelation(options.relation);
      if (options.label) changes.label = parseQuotedString(optionToken(options.label));
      if (options.emphasis) changes.emphasis = parseBoolean(options.emphasis, "emphasis");
      return { kind: "set-edge", edgeId: targetId, changes };
    }
    fail("FLOW323", "variant", tokens[1], "set requires node or edge.", { variantId });
  }
  if (verb === "unset") {
    requireCount(tokens, 4, "unset <node|edge> <id> <property>");
    const targetId = parseIdentifier(tokens[2]);
    const property = tokens[3].raw;
    if (tokens[1].raw === "node") {
      if (!["body", "tags", "layout"].includes(property)) {
        fail("FLOW324", "variant", tokens[3], "Node unset supports body, tags, or layout.", { variantId });
      }
      return { kind: "unset-node", nodeId: targetId, property: property as "body" | "tags" | "layout" };
    }
    if (tokens[1].raw === "edge") {
      if (!["relation", "label", "emphasis"].includes(property)) {
        fail("FLOW325", "variant", tokens[3], "Edge unset supports relation, label, or emphasis.", { variantId });
      }
      return { kind: "unset-edge", edgeId: targetId, property: property as "relation" | "label" | "emphasis" };
    }
    fail("FLOW326", "variant", tokens[1], "unset requires node or edge.", { variantId });
  }
  const suggestion = nearest(verb, ["add", "remove", "set", "unset", "clear", "position"]);
  fail("FLOW327", "variant", tokens[0], `Unknown variant operation "${verb}".`, {
    variantId,
    ...(suggestion ? { suggestion: `Did you mean "${suggestion}"?` } : {}),
  });
}

function formatVariant(variant: FlowVariant): string {
  const lines = [`variant ${formatIdentifier(variant.id)} ${quote(variant.title)} {`];
  if (variant.description) lines.push(`  description ${quote(variant.description)}`);
  if (variant.description && variant.operations.length) lines.push("");
  lines.push(...variant.operations.map((operation) => `  ${formatVariantOperation(operation)}`));
  lines.push("}");
  return lines.join("\n");
}

function formatVariantOperation(operation: VariantOperation): string {
  if (operation.kind === "clear-all") return "clear all";
  if (operation.kind === "add-node") return `add ${formatNode(operation.node, operation.layout)}`;
  if (operation.kind === "add-edge") return `add ${formatEdge(operation.edge)}`;
  if (operation.kind === "remove-node") return `remove node ${formatIdentifier(operation.nodeId)}`;
  if (operation.kind === "remove-edge") return `remove edge ${formatIdentifier(operation.edgeId)}`;
  if (operation.kind === "set-node") {
    const parts = [`set node ${formatIdentifier(operation.nodeId)}`];
    if (operation.changes.type) parts.push(`type=${operation.changes.type}`);
    if (operation.changes.title !== undefined) parts.push(`title=${quote(operation.changes.title)}`);
    if (operation.changes.body !== undefined) parts.push(`body=${quote(operation.changes.body)}`);
    if (operation.changes.tags !== undefined) parts.push(`tags=${formatTags(operation.changes.tags)}`);
    if (operation.changes.layout) parts.push(`layout=${formatPair(operation.changes.layout.column, operation.changes.layout.row)}`);
    return parts.join(" ");
  }
  if (operation.kind === "set-edge") {
    const parts = [`set edge ${formatIdentifier(operation.edgeId)}`];
    if (operation.changes.from) parts.push(`from=${formatIdentifier(operation.changes.from)}`);
    if (operation.changes.to) parts.push(`to=${formatIdentifier(operation.changes.to)}`);
    if (operation.changes.relation) parts.push(`relation=${operation.changes.relation}`);
    if (operation.changes.label !== undefined) parts.push(`label=${quote(operation.changes.label)}`);
    if (operation.changes.emphasis !== undefined) parts.push(`emphasis=${operation.changes.emphasis}`);
    return parts.join(" ");
  }
  if (operation.kind === "unset-node") return `unset node ${formatIdentifier(operation.nodeId)} ${operation.property}`;
  if (operation.kind === "unset-edge") return `unset edge ${formatIdentifier(operation.edgeId)} ${operation.property}`;
  return `position ${formatIdentifier(operation.nodeId)} ${formatPair(operation.position.x, operation.position.y)}`;
}

function formatNode(node: GraphNode, hint?: LayoutHint): string {
  const parts = [`node ${formatIdentifier(node.id)} ${node.type} ${quote(node.title)}`];
  if (node.body) parts.push(`body=${quote(node.body)}`);
  if (node.tags?.length) parts.push(`tags=${formatTags(node.tags)}`);
  if (hint) parts.push(`layout=${formatPair(hint.column, hint.row)}`);
  return parts.join(" ");
}

function formatEdge(edge: GraphEdge): string {
  const parts = [`edge ${formatIdentifier(edge.id)} ${formatIdentifier(edge.from)} -> ${formatIdentifier(edge.to)}`];
  if (edge.relation && edge.relation !== "flow") parts.push(`relation=${edge.relation}`);
  if (edge.label) parts.push(`label=${quote(edge.label)}`);
  if (edge.emphasis) parts.push("emphasis=true");
  return parts.join(" ");
}

function parseNode(tokens: Token[]): { value: GraphNode; layout?: LayoutHint } {
  if (tokens.length < 4) fail("FLOW111", "syntax", tokens[0], 'Node syntax is: node <id> <type> "<title>".');
  const id = parseIdentifier(tokens[1]);
  const type = parseNodeType(tokens[2]);
  const title = parseQuotedString(tokens[3]);
  const options = readOptions(tokens.slice(4), new Set(["body", "tags", "layout"]));
  return {
    value: {
      id,
      type,
      title,
      ...(options.body ? { body: parseQuotedString(optionToken(options.body)) } : {}),
      ...(options.tags ? { tags: parseTags(options.tags) } : {}),
    },
    ...(options.layout ? { layout: parsePair(options.layout, "layout", ["column", "row"]) } : {}),
  };
}

function parseEdge(tokens: Token[]): LocatedEdge {
  if (tokens.length < 5 || tokens[3]?.raw !== "->") {
    fail("FLOW112", "syntax", tokens[0], "Edge syntax is: edge <edge-id> <from> -> <to>.");
  }
  const id = parseIdentifier(tokens[1]);
  const from = parseIdentifier(tokens[2]);
  const to = parseIdentifier(tokens[4]);
  const options = readOptions(tokens.slice(5), new Set(["relation", "label", "emphasis"]));
  const relation = options.relation ? parseEdgeRelation(options.relation) : "flow";
  const emphasis = options.emphasis ? parseBoolean(options.emphasis, "emphasis") : false;
  return {
    value: {
      id,
      from,
      to,
      ...(relation !== "flow" ? { relation } : {}),
      ...(options.label ? { label: parseQuotedString(optionToken(options.label)) } : {}),
      ...(emphasis ? { emphasis: true } : {}),
    },
    from: tokens[2],
    to: tokens[4],
  };
}

function readOptions(tokens: Token[], allowed: Set<string>): Record<string, Token> {
  const options: Record<string, Token> = {};
  for (const token of tokens) {
    const separator = token.raw.indexOf("=");
    if (separator < 1) fail("FLOW150", "option", token, `Expected key=value, received "${token.raw}".`, { expected: "key=value" });
    const key = token.raw.slice(0, separator);
    if (!allowed.has(key)) {
      const suggestion = nearest(key, [...allowed]);
      fail("FLOW152", "option", token, `Unknown option "${key}".`, {
        actual: key,
        expected: [...allowed].join(", "),
        ...(suggestion ? { suggestion: `Did you mean "${suggestion}"?` } : {}),
      });
    }
    if (options[key]) fail("FLOW153", "option", token, `Duplicate option "${key}".`, { actual: key });
    options[key] = token;
  }
  return options;
}

function parseNodeType(token: Token): NodeType {
  if (!NODE_TYPE_SET.has(token.raw)) {
    const suggestion = nearest(token.raw, [...NODE_TYPES]);
    fail("FLOW121", "syntax", token, `Unknown node type "${token.raw}".`, {
      actual: token.raw,
      expected: NODE_TYPES.join(", "),
      ...(suggestion ? { suggestion: `Did you mean "${suggestion}"?` } : {}),
    });
  }
  return token.raw as NodeType;
}

function parseEdgeRelation(token: Token): EdgeRelation {
  const valueToken = optionToken(token);
  if (!EDGE_RELATION_SET.has(valueToken.raw)) {
    const suggestion = nearest(valueToken.raw, [...EDGE_RELATIONS]);
    fail("FLOW156", "option", valueToken, `Unknown edge relation "${valueToken.raw}".`, {
      actual: valueToken.raw,
      expected: EDGE_RELATIONS.join(", "),
      ...(suggestion ? { suggestion: `Did you mean "${suggestion}"?` } : {}),
    });
  }
  return valueToken.raw as EdgeRelation;
}

function parseBoolean(token: Token, label: string): boolean {
  const raw = optionValue(token);
  if (raw !== "true" && raw !== "false") {
    fail("FLOW151", "option", token, `${label} must be true or false.`, { actual: raw, expected: "true or false" });
  }
  return raw === "true";
}

function parseTags(token: Token): string[] {
  const raw = optionValue(token);
  if (!raw.startsWith("[") || !raw.endsWith("]")) {
    fail("FLOW154", "option", token, 'tags must be a string array, such as tags=["one","two"].');
  }
  validateQuotedEscapes(raw, token);
  let value: unknown;
  try {
    value = JSON.parse(raw);
  } catch {
    fail("FLOW154", "option", token, 'tags must be a valid string array, such as tags=["one","two"].');
  }
  if (!Array.isArray(value) || value.some((tag) => typeof tag !== "string" || !tag.length)) {
    fail("FLOW154", "option", token, "Every tag must be a non-empty string.");
  }
  if (new Set(value).size !== value.length) fail("FLOW155", "option", token, "Tags must not contain duplicates.");
  return value as string[];
}

function parsePair<T extends string>(token: Token, label: string, keys: [T, T]): Record<T, number> {
  const raw = optionValue(token);
  const match = raw.match(PAIR_PATTERN);
  if (!match) {
    fail("FLOW141", "syntax", token, `${label} requires two canonical numbers separated by one comma.`, {
      actual: raw,
      expected: "-12,2.5",
    });
  }
  const values = [Number(match[1]), Number(match[2])];
  if (values.some((value) => !Number.isFinite(value))) fail("FLOW142", "syntax", token, `${label} numbers must be finite.`, { actual: raw });
  return { [keys[0]]: values[0], [keys[1]]: values[1] } as Record<T, number>;
}

function parseIdentifier(token: Token): string {
  if (!IDENTIFIER_PATTERN.test(token.raw)) {
    fail("FLOW131", "identifier", token, `Invalid identifier "${token.raw}".`, {
      actual: token.raw,
      expected: "[A-Za-z0-9][A-Za-z0-9._-]*",
    });
  }
  return token.raw;
}

function parseQuotedString(token: Token): string {
  const raw = optionValue(token);
  if (!(raw.startsWith('"') && raw.endsWith('"')) || raw.length < 2) {
    fail("FLOW122", "syntax", token, "String values must use double quotes.", { actual: raw, expected: '"text"' });
  }
  validateQuotedEscapes(raw, token);
  let value = "";
  for (let index = 1; index < raw.length - 1; index += 1) {
    const character = raw[index];
    if (character === '"') {
      fail("FLOW125", "syntax", offsetToken(token, index), "Double quotes inside strings must be escaped.", { actual: '"', expected: '\\"' });
    }
    if (character !== "\\") {
      value += character;
      continue;
    }
    const escaped = raw[++index];
    value += escaped === "n" ? "\n" : escaped;
  }
  return value;
}

function validateQuotedEscapes(raw: string, token: Token) {
  for (let index = 0; index < raw.length; index += 1) {
    if (raw[index] !== "\\") continue;
    const escaped = raw[++index];
    if (!['"', "\\", "n"].includes(escaped)) {
      fail("FLOW123", "syntax", offsetToken(token, index), `Unknown string escape "\\${escaped || ""}".`, {
        actual: `\\${escaped || ""}`,
        expected: '\\", \\\\, or \\n',
      });
    }
  }
}

function tokenize(rawLine: string, line: number): Token[] {
  const tokens: Token[] = [];
  let index = 0;
  while (index < rawLine.length) {
    while (index < rawLine.length && /[ \t]/.test(rawLine[index])) index += 1;
    if (index >= rawLine.length || rawLine[index] === "#") break;
    const start = index;
    let quoteOpen = false;
    let escaped = false;
    let bracketDepth = 0;
    while (index < rawLine.length) {
      const character = rawLine[index];
      if (escaped) escaped = false;
      else if (character === "\\" && quoteOpen) escaped = true;
      else if (character === '"') quoteOpen = !quoteOpen;
      else if (!quoteOpen && character === "[") bracketDepth += 1;
      else if (!quoteOpen && character === "]") bracketDepth -= 1;
      else if (!quoteOpen && bracketDepth === 0 && (/[ \t]/.test(character) || character === "#")) break;
      index += 1;
    }
    if (quoteOpen) fail("FLOW124", "syntax", { raw: rawLine.slice(start), line, start, end: rawLine.length }, "Unclosed quoted string.");
    const raw = rawLine.slice(start, index);
    tokens.push({ raw, line, start, end: index });
    if (rawLine[index] === "#") break;
  }
  return tokens;
}

function requireStage(actual: number, expected: number, token: Token, message: string) {
  if (actual !== expected) fail("FLOW106", "structure", token, message);
}

function requireCount(tokens: Token[], expected: number, syntax: string) {
  if (tokens.length !== expected) fail("FLOW111", "syntax", tokens[0], `Expected ${syntax}.`, { expected: syntax });
}

function validateNodeReference(
  token: Token,
  nodeId: string,
  nodeIds: Set<string>,
  diagnostics: GraphDslDiagnostic[],
  relatedId?: string,
) {
  if (nodeIds.has(nodeId)) return;
  const suggestion = nearest(nodeId, [...nodeIds]);
  diagnostics.push(makeDiagnostic("FLOW203", "reference", token, `Unknown node "${nodeId}".`, {
    actual: nodeId,
    expected: "an existing node ID",
    ...(relatedId ? { relatedId } : {}),
    ...(suggestion ? { suggestion: `Did you mean "${suggestion}"?` } : {}),
  }));
}

function validateEdgeRelation(
  edge: LocatedEdge,
  nodesById: Map<string, GraphNode>,
  diagnostics: GraphDslDiagnostic[],
) {
  const source = nodesById.get(edge.value.from);
  const target = nodesById.get(edge.value.to);
  if (!source || !target) return;
  const message = edgeRelationError(edge.value, source, target);
  if (!message) return;
  diagnostics.push(makeDiagnostic("FLOW208", "reference", edge.from, message, { relatedId: edge.value.id }));
}

function edgeRelationError(edge: GraphEdge, source: GraphNode, target: GraphNode): string | undefined {
  const relation = edge.relation || "flow";
  const sourceOperational = OPERATIONAL_NODE_TYPES.has(source.type);
  const targetOperational = OPERATIONAL_NODE_TYPES.has(target.type);

  if (relation === "flow" && (!sourceOperational || !targetOperational)) {
    return `Flow edge "${edge.id}" must connect two operational nodes.`;
  }
  if (relation === "addresses" && (!sourceOperational || target.type !== "need")) {
    return `Addresses edge "${edge.id}" must connect an operational node to a need.`;
  }
  if (relation === "supports" && (source.type !== "ux" || target.type !== "need")) {
    return `Supports edge "${edge.id}" must connect a UX node to a need.`;
  }
  if (relation === "appears-at" && (source.type !== "ux" || !targetOperational)) {
    return `Appears-at edge "${edge.id}" must connect a UX node to an operational node.`;
  }
  return undefined;
}

function optionValue(token: Token): string {
  const separator = token.raw.indexOf("=");
  return separator >= 0 ? token.raw.slice(separator + 1) : token.raw;
}

function optionToken(token: Token): Token {
  const separator = token.raw.indexOf("=");
  return separator < 0 ? token : { ...token, raw: token.raw.slice(separator + 1), start: token.start + separator + 1 };
}

function offsetToken(token: Token, offset: number): Token {
  return { ...token, start: token.start + offset, end: token.start + offset + 1, raw: token.raw[offset] || "" };
}

function fail(
  code: string,
  category: GraphDslDiagnosticCategory,
  token: Token,
  message: string,
  detail: Partial<GraphDslDiagnostic> = {},
): never {
  throw new GraphDslError(makeDiagnostic(code, category, token, message, detail));
}

function makeDiagnostic(
  code: string,
  category: GraphDslDiagnosticCategory,
  token: Token,
  message: string,
  detail: Partial<GraphDslDiagnostic> = {},
): GraphDslDiagnostic {
  return {
    code,
    category,
    message,
    line: token.line,
    column: token.start + 1,
    length: Math.max(1, token.end - token.start),
    ...detail,
  };
}

function documentDiagnostic(code: string, category: GraphDslDiagnosticCategory, message: string, suggestion?: string) {
  return { code, category, message, line: 1, column: 1, length: 1, ...(suggestion ? { suggestion } : {}) };
}

function toDiagnostic(error: unknown): GraphDslDiagnostic {
  if (error instanceof GraphDslError) return error.diagnostic;
  throw error;
}

function variantError(code: string, variant: FlowVariant, index: number, message: string, relatedIds: string[] = []) {
  return new VariantMaterializationError(code, variant.id, index, message, relatedIds);
}

function nearest(value: string, candidates: string[]): string | undefined {
  let best: { candidate: string; distance: number } | undefined;
  for (const candidate of candidates) {
    const distance = levenshtein(value, candidate);
    if (!best || distance < best.distance) best = { candidate, distance };
  }
  return best && best.distance <= Math.max(2, Math.floor(value.length / 3)) ? best.candidate : undefined;
}

function levenshtein(left: string, right: string): number {
  const row = Array.from({ length: right.length + 1 }, (_, index) => index);
  for (let leftIndex = 1; leftIndex <= left.length; leftIndex += 1) {
    let diagonal = row[0];
    row[0] = leftIndex;
    for (let rightIndex = 1; rightIndex <= right.length; rightIndex += 1) {
      const above = row[rightIndex];
      row[rightIndex] = Math.min(
        row[rightIndex] + 1,
        row[rightIndex - 1] + 1,
        diagonal + (left[leftIndex - 1] === right[rightIndex - 1] ? 0 : 1),
      );
      diagonal = above;
    }
  }
  return row[right.length];
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function quote(value: string): string {
  return `"${value.replace(/\\/g, "\\\\").replace(/"/g, '\\"').replace(/\n/g, "\\n")}"`;
}

function formatTags(tags: string[]): string {
  if (new Set(tags).size !== tags.length || tags.some((tag) => !tag.length)) throw new Error("Tags must be unique, non-empty strings.");
  return `[${tags.map(quote).join(",")}]`;
}

function formatIdentifier(value: string): string {
  if (!IDENTIFIER_PATTERN.test(value)) throw new Error(`Invalid DSL identifier "${value}". Expected [A-Za-z0-9][A-Za-z0-9._-]*.`);
  return value;
}

function formatPair(first: number, second: number): string {
  return `${formatNumber(first)},${formatNumber(second)}`;
}

function formatNumber(value: number): string {
  if (!Number.isFinite(value)) throw new Error(`Cannot format non-finite number "${value}".`);
  if (Object.is(value, -0)) return "0";
  const formatted = expandExponential(String(value));
  if (!NUMBER_PATTERN.test(formatted)) throw new Error(`Cannot format number "${value}" canonically.`);
  return formatted;
}

function expandExponential(value: string): string {
  if (!/[eE]/.test(value)) return value;
  const [coefficient, exponentText] = value.toLowerCase().split("e");
  const exponent = Number(exponentText);
  const negative = coefficient.startsWith("-");
  const unsigned = negative ? coefficient.slice(1) : coefficient;
  const digits = unsigned.replace(".", "");
  const decimalIndex = (unsigned.indexOf(".") >= 0 ? unsigned.indexOf(".") : unsigned.length) + exponent;
  const expanded = decimalIndex <= 0
    ? `0.${"0".repeat(-decimalIndex)}${digits}`
    : decimalIndex >= digits.length
      ? `${digits}${"0".repeat(decimalIndex - digits.length)}`
      : `${digits.slice(0, decimalIndex)}.${digits.slice(decimalIndex)}`;
  return negative ? `-${expanded}` : expanded;
}

~~~~~~~~~~~~


## Source: src/lib/graph-lint.ts

Origin: release; full-source SHA-256: 0b07755818b5f8605ffd1b5bdedfbc000cf8e95fc48bed55fc28b8100ac9f80f

~~~~~~~~~~~~
import { materializeVariant } from "./graph-dsl.ts";
import { isFlowEdge } from "./graph-semantics.ts";
import type { FlowDocument, FlowGraph } from "../types/graph.ts";

export type GraphLintSeverity = "error";

export interface GraphLintDiagnostic {
  code: "FLOWLINT001";
  severity: GraphLintSeverity;
  message: string;
  nodeId: string;
  variantId?: string;
}

function processNodesWithoutOutput(graph: FlowGraph): Set<string> {
  const nodesWithOutput = new Set(graph.edges.filter(isFlowEdge).map((edge) => edge.from));
  return new Set(
    graph.nodes
      .filter((node) => node.type === "process" && !nodesWithOutput.has(node.id))
      .map((node) => node.id),
  );
}

function processOutputDiagnostic(nodeId: string, variantId?: string): GraphLintDiagnostic {
  return {
    code: "FLOWLINT001",
    severity: "error",
    message: `Process node "${nodeId}" has no outgoing flow edge.`,
    nodeId,
    ...(variantId ? { variantId } : {}),
  };
}

/** Lint the base graph and each materialized variant. */
export function lintFlowDocument(document: FlowDocument): GraphLintDiagnostic[] {
  const diagnostics: GraphLintDiagnostic[] = [];
  const baseFailures = processNodesWithoutOutput(document.graph);

  for (const nodeId of baseFailures) diagnostics.push(processOutputDiagnostic(nodeId));

  for (const variant of document.variants) {
    const variantFailures = processNodesWithoutOutput(materializeVariant(document, variant.id));
    for (const nodeId of variantFailures) {
      // Report only defects introduced by this view. The base defect already has one diagnostic.
      if (!baseFailures.has(nodeId)) diagnostics.push(processOutputDiagnostic(nodeId, variant.id));
    }
  }

  return diagnostics;
}

~~~~~~~~~~~~


## Source: src/lib/graph-semantics.ts

Origin: release; full-source SHA-256: eb86acc93c3c8a932380cdb3d88ee1a12e53a9152ba111fad3d52b43632b06d0

~~~~~~~~~~~~
import type { EdgeRelation, FlowGraph, GraphEdge, GraphNode } from "../types/graph";

export const OPERATIONAL_NODE_TYPES = new Set(["actor", "input", "process", "handoff", "deliverable"]);

export function edgeRelation(edge: GraphEdge): EdgeRelation {
  return edge.relation || "flow";
}

export function isOperationalNode(node: Pick<GraphNode, "type">): boolean {
  return OPERATIONAL_NODE_TYPES.has(node.type);
}

export function isFlowEdge(edge: GraphEdge): boolean {
  return edgeRelation(edge) === "flow";
}

export function terminalDeliverableIds(graph: Pick<FlowGraph, "nodes" | "edges">): Set<string> {
  const outgoingFlowNodeIds = new Set(graph.edges.filter(isFlowEdge).map((edge) => edge.from));
  return new Set(
    graph.nodes
      .filter((node) => node.type === "deliverable" && !outgoingFlowNodeIds.has(node.id))
      .map((node) => node.id),
  );
}

export function projectOperationalGraph(graph: FlowGraph): FlowGraph {
  const nodes = graph.nodes.filter(isOperationalNode);
  const nodeIds = new Set(nodes.map((node) => node.id));
  return {
    ...graph,
    nodes,
    edges: graph.edges.filter((edge) => isFlowEdge(edge) && nodeIds.has(edge.from) && nodeIds.has(edge.to)),
  };
}

~~~~~~~~~~~~


## Source: src/data/flows/resume-alignment.flow

Origin: release; full-source SHA-256: 9209367d0ab16d588d8185f0d701a5280c61f4f06ca8eb8d92675857cb1b3611

~~~~~~~~~~~~
flow 3

graph resume-alignment-flow "Tailor a resume to a job posting"
description "Transform a job posting and verified career evidence into a reviewed, job-specific resume."

node user actor "Job seeker" body="Has an existing resume and a target job posting. Wants a stronger application without inventing experience." tags=["source of truth"] layout=0,1
node source-posting input "Target job posting" body="The posting selected for this application. The user supplies it, while the employer remains its source." tags=["required","supplied-by:user","origin: employer"] layout=1,0
node source-resume input "Current resume" body="The source resume supplied by the user for evidence extraction and comparison." tags=["required","supplied-by:user","origin: job seeker"] layout=1,2
node parse-posting process "1. Parse the job posting" body="Extract responsibilities, required capabilities, preferences, repeated themes, seniority cues, and likely evaluation criteria." layout=2,0
node inventory process "2. Inventory resume evidence" body="Break the current resume into roles, accomplishments, skills, scope, metrics, domains, and keywords." layout=2,2
node map-evidence process "3. Map requirements to evidence" body="For each meaningful requirement: matched, weakly matched, unsupported, or irrelevant. Rank by application impact." tags=["reasoning"] layout=4,1
node draft process "4. Draft targeted changes" body="Reorder, tighten, and rewrite bullets to foreground relevant evidence. Add terminology only when substantively true." tags=["transformation"] layout=6,1
node requirements-brief deliverable "Requirements brief" body="A compact model of what matters most: top outcomes, skills, constraints, keywords, and evidence expectations." tags=["deliverable"] layout=3,0
node resume-evidence-model deliverable "Resume evidence model" body="Structured resume claims with provenance back to the user’s source content." tags=["deliverable","evidence model"] layout=3,2
node match-matrix deliverable "Match / gap matrix" body="Requirement-by-requirement mapping with evidence, confidence, gaps, and recommended treatment." tags=["deliverable"] layout=5,1
node handoff-review handoff "Draft → human approval" body="Suggested edits remain proposed changes until the user reviews unsupported assumptions and wording changes." tags=["approval"] layout=7,1
node tailored-resume deliverable "Tailored resume" body="A ready-to-export resume emphasizing the strongest true evidence for this specific role." tags=["deliverable"] layout=8,1
node need-understand need "Understand what the role actually needs" body="Translate a noisy posting into the outcomes, skills, constraints, seniority signals, and evidence that matter most." tags=["fundamental need"]
node need-truth need "Stay truthful and defensible" body="Every tailored claim must be grounded in real experience the user can defend in an interview." tags=["trust"]
node need-effort need "Spend effort where it changes the outcome" body="Prioritize high-impact changes instead of asking the user to rewrite everything for every application." tags=["efficiency"]
node ux-sources ux "Side-by-side source context" body="Keep the posting and resume visible beside extracted requirements and evidence so the user can verify reasoning quickly." tags=["traceability"]
node ux-evidence ux "Evidence chips + confidence" body="Every recommendation shows why it exists, what source supports it, and whether the match is strong or tentative." tags=["explainability"]
node ux-priority ux "Prioritized actions, not a wall of edits" body="Lead with the few changes most likely to improve relevance. Separate critical fixes from optional polish." tags=["focus"]
node ux-diff ux "Diff + approval gate" body="Show before/after text, let the user accept per change, and flag statements that may overreach the source resume." tags=["control","trust"]

edge user-to-posting user -> source-posting label="selects or provides"
edge user-to-resume user -> source-resume label="provides"
edge posting-to-parse source-posting -> parse-posting label="consumed by"
edge resume-to-inventory source-resume -> inventory label="consumed by"
edge e6 parse-posting -> requirements-brief
edge e8 inventory -> resume-evidence-model
edge e9 requirements-brief -> map-evidence
edge e10 resume-evidence-model -> map-evidence
edge e11 map-evidence -> match-matrix label="rank matches + gaps" emphasis=true
edge e12 match-matrix -> draft
edge e14 draft -> handoff-review
edge e15 handoff-review -> tailored-resume
edge e4 parse-posting -> need-understand relation=addresses
edge e5 inventory -> need-truth relation=addresses
edge e13 draft -> need-effort relation=addresses
edge e16 ux-sources -> parse-posting relation=appears-at
edge e17 ux-evidence -> map-evidence relation=appears-at
edge e18 ux-priority -> draft relation=appears-at
edge e19 ux-diff -> handoff-review relation=appears-at
edge ux-sources-understand ux-sources -> need-understand relation=supports
edge ux-sources-truth ux-sources -> need-truth relation=supports
edge ux-evidence-truth ux-evidence -> need-truth relation=supports
edge ux-priority-effort ux-priority -> need-effort relation=supports
edge ux-diff-truth ux-diff -> need-truth relation=supports

variant per-job-resume "One resume per posting" {
  description "Save each approved result as a distinct resume tied to its job posting."

  remove edge e15
  set node tailored-resume title="Job-specific resume" body="A distinct resume version that records the strongest true evidence for one job posting." tags=["deliverable","job-specific"] layout=9,1
  add node save-version process "Save as a new resume version" body="Create a new version instead of replacing the source resume or a resume for another posting." tags=["versioning"] layout=8,1
  add node resume-library deliverable "Job-specific resume library" body="A traceable set of resumes, with one approved version for each job posting." tags=["deliverable","history"] layout=10,1
  add edge review-to-version handoff-review -> save-version
  add edge version-to-resume save-version -> tailored-resume
  add edge resume-to-library tailored-resume -> resume-library
}
variant evidence-corpus-projection "Resume as an evidence projection" {
  description "Build a durable body of verified career evidence, then let each job posting constrain the resume projected from it."

  remove edge e8
  set node source-resume title="Career evidence sources" body="Resumes, project notes, reviews, work samples, metrics, and other career records supplied by the user." tags=["required","supplied-by:user","origin: job seeker"]
  set node inventory title="2. Build the evidence corpus" body="Extract durable evidence from resumes, project notes, reviews, work samples, metrics, and structured user answers. Keep provenance for every claim." tags=["evidence system","reusable"]
  set node map-evidence title="3. Constrain evidence by the posting" body="Use the target posting as a selection constraint. Rank verified evidence by relevance, strength, recency, and the role’s likely evaluation criteria."
  set node draft title="4. Project a job-specific resume" body="Generate a concise resume view from the selected evidence. Change emphasis and wording without changing the underlying facts." tags=["projection"]
  set node resume-evidence-model title="Qualified evidence set" body="The durable evidence corpus supplies verified claims with provenance, scope, confidence, and reusable source detail."
  set node match-matrix title="Job-constrained evidence plan" body="A ranked plan that identifies which verified evidence to include, omit, clarify, or reserve for an interview."
  set node tailored-resume title="Resume projection" body="A job-specific projection of the shared evidence corpus, optimized for the posting without becoming a separate source of truth." tags=["deliverable","projection"]
  set node ux-sources title="Posting + evidence context" body="Show the posting beside the reusable evidence corpus and explain why each item is selected or omitted."
  set node resume-evidence-model layout=4,2
  set node map-evidence layout=5,1
  set node match-matrix layout=6,1
  set node draft layout=7,1
  set node handoff-review layout=8,1
  set node tailored-resume layout=9,1
  add node evidence-corpus deliverable "Career evidence corpus" body="A living, source-backed record of accomplishments, skills, scope, metrics, domains, work samples, and approved claims." tags=["deliverable","source of truth"] layout=3,2
  add edge inventory-to-corpus inventory -> evidence-corpus emphasis=true
  add edge corpus-to-evidence-model evidence-corpus -> resume-evidence-model
}
variant guided-evidence-interview "Agent-guided evidence interview" {
  description "Pause drafting when important evidence is weak, then ask focused questions that help the user recover specific, defensible proof."

  remove edge e12
  set node draft title="5. Draft from verified answers" body="Rewrite and reorder content only after the user confirms the added context, scope, metrics, and wording." tags=["transformation","verified input"]
  set node handoff-review title="Interview-backed draft → approval" body="The draft combines source resume evidence with user-approved answers, then returns every proposed claim for final review."
  set node ux-evidence title="Evidence questions + confidence" body="Explain each weak match, ask one focused question at a time, and show how an answer changes confidence or relevance."
  set node draft layout=7,1
  set node handoff-review layout=8,1
  set node tailored-resume layout=9,1
  add node find-gaps process "4. Find high-value evidence gaps" body="Select only gaps where stronger evidence could materially change the application. Ignore low-value keyword gaps." tags=["agent triage"] layout=6,1
  add node evidence-interview ux "Run a focused evidence interview" body="Ask for situation, action, result, scope, and measurable impact. Let the user skip questions or mark evidence as unavailable." tags=["guided review","user control"]
  add node verified-answers input "User-confirmed evidence" body="Facts and context supplied by the user after focused questions expose an important evidence gap." tags=["conditional","supplied-by:user","origin: job seeker"] layout=7,5
  add edge matrix-to-gaps match-matrix -> find-gaps label="prioritize gaps"
  add edge user-to-answers user -> verified-answers label="answers or skips"
  add edge gaps-to-answers find-gaps -> verified-answers label="requests evidence"
  add edge answers-to-draft verified-answers -> draft
  add edge interview-at-gaps evidence-interview -> find-gaps relation=appears-at
  add edge interview-supports-truth evidence-interview -> need-truth relation=supports
  add edge gaps-address-effort find-gaps -> need-effort relation=addresses
}
variant independent-claim-audit "Independent agent claim audit" {
  description "Separate persuasive rewriting from factual review so a second agent challenges unsupported, vague, or inflated claims before approval."

  remove edge e14
  set node draft title="4. Draft persuasive changes" body="A writing agent foregrounds relevant evidence and improves clarity, specificity, and role alignment." tags=["writing agent"]
  set node handoff-review title="Audited draft → human approval" body="Only claims that pass the independent audit move to the user. Challenges and unresolved risks remain visible."
  set node ux-diff title="Diff + audit findings" body="Show each edit with its source evidence, audit result, and reason for any warning. Let the user revise, reject, or approve it."
  set node handoff-review layout=9,1
  set node tailored-resume layout=10,1
  add node claim-audit process "5. Audit every changed claim" body="A separate review agent checks provenance, factual entailment, unsupported numbers, seniority inflation, and meaning changed by compression." tags=["review agent","independent"] layout=7,1
  add node audit-report deliverable "Claim audit report" body="A per-change record of passed checks, challenges, missing support, and required user decisions." tags=["deliverable","risk review"] layout=8,1
  add edge draft-to-audit draft -> claim-audit label="challenge edits"
  add edge evidence-to-audit resume-evidence-model -> claim-audit label="verify sources"
  add edge audit-to-report claim-audit -> audit-report emphasis=true
  add edge report-to-review audit-report -> handoff-review
}

~~~~~~~~~~~~


## Source: skills/author-flow-diagrams/references/flow-dsl-base.md

Origin: release; full-source SHA-256: 70a11d2e24285cd647f4017ab3a72dac03eda360a0c70cbb521c85bca4840ddd

~~~~~~~~~~~~
# Flow DSL base authoring reference

Use this short reference for an ordinary base graph. Read [the complete specification](flow-dsl-spec.md) for the normative grammar, variants, positions, diagnostics, and formatting rules. The complete specification is the only syntax authority.

## Small valid graph

```text
flow 3

graph signup "New user signup"
description "The path from visitor intent to an account."

node visitor actor "Visitor" body="The person who starts signup."
node details input "Signup details" body="The account information supplied by the visitor." tags=["signup","required"]
node create-account process "Create account" body="Validate the details and create the account."
node account deliverable "Account" body="The durable account created by signup."
node confidence need "Know signup succeeded"
node recovery ux "Explain signup recovery"

edge visitor-provides-details visitor -> details label="provides"
edge details-to-create details -> create-account label="submits"
edge create-to-account create-account -> account label="creates" emphasis=true
edge create-addresses-confidence create-account -> confidence relation=addresses
edge recovery-at-create recovery -> create-account relation=appears-at
edge recovery-supports-confidence recovery -> confidence relation=supports
```

Validate a file with:

```sh
flow check path/to/signup.flow
```

In a checkout, use `pnpm flow check path/to/signup.flow` when the global command is unavailable. The check parses the base graph and materializes every variant.

## Base command shapes

Use one command per physical line, in this order: `flow`, `graph`, optional `description`, nodes, edges, variants, then optional positions.

```text
flow 3
graph <graph-id> "<title>"
description "<scope>"
node <node-id> <type> "<title>" [body="<detail>"] [tags=["<tag>"]] [layout=<column>,<row>]
edge <edge-id> <from-id> -> <to-id> [relation=<relation>] [label="<label>"] [emphasis=true]
position <node-id> <x>,<y>
```

Allowed node types are `actor`, `need`, `input`, `process`, `handoff`, `deliverable`, and `ux`. Operational nodes are actors, inputs, processes, handoffs, and deliverables. Needs and UX records stay off the canvas.

The default edge relation is `flow`. Use `addresses` from an operational node to a need, `supports` from UX to a need, and `appears-at` from UX to an operational node. A process must have an outgoing `flow` edge. A deliverable with no outgoing `flow` edge is an outcome.

## Writing rules

Use double quoted strings. Escape a quote as `\"`, a backslash as `\\`, and a line break as `\n`. IDs use letters or digits first, followed by letters, digits, `.`, `_`, or `-`. Tags must be non-empty and unique.

Keep titles short. Put acceptance detail and evidence in `body`. Use a handoff for a transfer of state, control, responsibility, or information. Use a deliverable for a durable artifact. Do not create duplicate nodes for a handoff and its unchanged result.

Use one dominant left-to-right story. Add a branch only when it shows a meaningful alternative, dependency, recovery route, or UX requirement. Use `layout` hints for logical order or grouping. Leave exact `position` values out of new files until a manual layout is needed.

Preserve stable IDs when editing. Maintain `.flow` source as the source of truth. JSON is generated output.

## Review labels

Record three separate conclusions:

- `STRUCTURAL`: parse, lint, and formatting checks passed.
- `SOURCE`: requested scope and semantic meaning are preserved.
- `VISUAL`: a rendered image or viewer was inspected for complete bounds, readable titles, and clear branches.

The check proves structure only. It does not prove that the source captures the requested product behavior or that the rendered diagram is readable.

~~~~~~~~~~~~


## Source: src/lib/flow-workbench.ts

Origin: release; full-source SHA-256: e042ed92dbf7d35b5cdf297fe9c244ab65f7f4ee3bdde864d0500d9235bdaa0b

~~~~~~~~~~~~
// Original lines 1-85
import { graphToDsl, materializeVariant, parseGraphDsl, parseGraphDslWithDiagnostics } from "./graph-dsl";
import { edgeRelation, isFlowEdge, isOperationalNode, terminalDeliverableIds } from "./graph-semantics";
import type { CanvasGraph, CanvasNode, FlowDocument, FlowGraph, NodePosition, NodeType } from "../types/graph";

export function mountFlowWorkbench(initialGraph: unknown, options: { storageKey?: string; persist?: boolean } = {}) {
const TYPE_COLUMNS = {
      actor: 0,
      input: 1,
      process: 2,
      handoff: 3,
      deliverable: 3,
      need: 0,
      ux: 0,
    };

    const COLUMN_START_X = 88;
    const COLUMN_GAP = 266;
    const MAIN_TOP = 72;
    const ROW_GAP = 90;
    const MIN_AUTO_LAYOUT_ZOOM = .58;
    const NODE_WIDTH = 216;
    const NODE_HEIGHT = 64;
    const ROUTE_GRID = 10;
    const ROUTE_CLEARANCE = 12;
    const PORT_LANE_GAP = 20;
    const PORT_EDGE_INSET = 12;
    const ALIGNMENT_SNAP_THRESHOLD = 16;
    const WRAPPED_BAND_GAP = 96;
    const GUTTER_LANE_GAP = 12;
    const ROUTE_REUSE_PENALTY = 500;
    const storageNamespace = options.storageKey || 'default';
    const persist = options.persist !== false;
    const STORAGE_KEY = `user-flow-workbench-v5-stage-rows:${storageNamespace}`;
    const SOURCE_STORAGE_KEY = `user-flow-workbench-v5-stage-rows-source:${storageNamespace}`;
    const INSPECTOR_TYPES_QUERY_PARAM = 'nodeTypes';
    const initialGraphSignature = JSON.stringify(initialGraph);

    let flowDocument = normalizeDocument(initialGraph);
    let activeVariantId: string | null = null;
    let graph: CanvasGraph = normalizeGraph(flowDocument.graph);
    let authoredLayoutHintIds = extractLayoutHintIds(flowDocument.graph);
    let includeDslPositions = false;
    let selectedNodeId = null;
    let inspectorTypeFilters = inspectorTypesFromUrl();
    let zoom = 0.72;
    let panX = 20;
    let panY = 16;
    let isPanning = false;
    let panStart = null;
    let dragState = null;
    let edgeRenderFrame = null;
    let variantPositionSyncTimer: ReturnType<typeof setTimeout> | null = null;
    let elkRoutes = new Map();
    let elkLayoutActive = false;
    let elkInstance = null;
    let elkConstructorPromise: Promise<any> | null = null;
    (window as any).__flowWorkbenchReady = { status: 'loading' };

    const $ = <T extends Element = HTMLElement>(id: string): T => {
      const element = document.getElementById(id);
      if (!element) throw new Error(`Missing workbench element: ${id}`);
      return element as unknown as T;
    };
    const viewport = $<HTMLDivElement>('viewport');
    const world = $<HTMLDivElement>('world');
    const nodeLayer = $<HTMLDivElement>('nodeLayer');
    const edgeLayer = $<SVGGElement>('edgeLayer');
    const dslEditor = $<HTMLTextAreaElement>('dslEditor');
    const inspector = $<HTMLDivElement>('inspector');
    const variantTabs = $<HTMLDivElement>('variantTabs');
    const variantDescription = $<HTMLDivElement>('variantDescription');
    const variantDescriptionText = $<HTMLParagraphElement>('variantDescriptionText');
    const variantLegendItems = $<HTMLSpanElement>('variantLegendItems');

    function clone<T>(value: T): T { return JSON.parse(JSON.stringify(value)) as T; }

    function extractLayoutHintIds(input: any): Set<string> {
      return new Set(Object.keys(input?.layout?.hints || {}));
    }

    function normalizeDocument(input: any): FlowDocument {
      if (input?.schemaVersion !== 5 || input?.dslVersion !== 3 || !input?.graph) {
        throw new Error('Flow Workbench requires Flow DSL 3 and JSON schema 5.');
      }
      return {

// Original lines 217-225
    function renderAll({ syncJson = true } = {}) {
      renderNodes();
      scheduleEdgeRender();
      renderInspector();
      updateToolbar();
      renderVariantTabs();
      if (syncJson) syncDslEditor();
    }


// Original lines 341-420
    function renderNodes() {
      nodeLayer.innerHTML = '';
      const variantEffects = getVariantNodeEffects();
      const selection = getSelectionEmphasis();
      const outcomeIds = terminalDeliverableIds(graph);
      for (const node of canvasNodes()) {
        const el = document.createElement('article');
        const variantEffect = variantEffects.get(node.id);
        const selectionClass = node.id === selectedNodeId
          ? ' selected'
          : selection.connectedNodeIds.has(node.id)
            ? ' selection-connected'
            : selectedNodeId
              ? ' selection-dimmed'
              : '';
        el.className = `node${outcomeIds.has(node.id) ? ' outcome' : ''}${selectionClass}${variantEffect ? ` variant-affected variant-${variantEffect}` : ''}`;
        el.dataset.id = node.id;
        el.dataset.type = node.type;
        if (variantEffect) el.dataset.variantEffect = variantEffect === 'added' ? 'NEW' : variantEffect === 'changed' ? 'CHANGED' : 'PATH';
        el.style.left = `${node.position.x}px`;
        el.style.top = `${node.position.y}px`;
        el.title = `${node.type}: ${node.title}`;
        el.innerHTML = `
          <span class="node-icon" aria-hidden="true">${iconSvg(node.type)}</span>
          <div class="node-title">${escapeHtml(node.title)}</div>
        `;
        el.addEventListener('pointerdown', (event) => startNodeDrag(event, node.id));
        nodeLayer.appendChild(el);
      }
    }

    function scheduleEdgeRender() {
      if (edgeRenderFrame) return;
      edgeRenderFrame = requestAnimationFrame(() => {
        edgeRenderFrame = null;
        renderEdges();
      });
    }

    function renderEdges() {
      edgeLayer.innerHTML = '';
      const rects = getNodeRects();
      const nodesById = new Map(canvasNodes().map(node => [node.id, node]));
      const segmentUsage = new Map();
      const portLaneOffsets = buildPortLaneOffsets(canvasEdges(), rects);
      const selection = getSelectionEmphasis();

      // Stable ordering makes lane assignment deterministic.
      const edges = [...canvasEdges()].sort((a, b) => {
        const af = nodesById.get(a.from)?.layout.column ?? 0;
        const bf = nodesById.get(b.from)?.layout.column ?? 0;
        return af - bf || a.from.localeCompare(b.from) || a.to.localeCompare(b.to);
      });
      const gutterLanes = buildGutterLanes(edges, rects);

      for (const edge of edges) {
        const from = nodesById.get(edge.from);
        const to = nodesById.get(edge.to);
        const fromRect = rects.get(edge.from);
        const toRect = rects.get(edge.to);
        if (!from || !to || !fromRect || !toRect) continue;

        const route = routeEdge(edge, fromRect, toRect, rects, segmentUsage, portLaneOffsets, gutterLanes);
        if (!route.points.length) continue;

        const selectionClass = selection.connectedEdgeIds.has(edge.id)
          ? ' selection-connected'
          : selectedNodeId
            ? ' selection-dimmed'
            : '';
        const path = svgEl('path', {
          d: pointsToPath(route.points),
          class: `edge-path${edge.emphasis ? ' emphasis' : ''}${selectionClass}`,
        });
        edgeLayer.appendChild(path);

        for (const segmentKey of route.gridSegments || []) {
          segmentUsage.set(segmentKey, (segmentUsage.get(segmentKey) || 0) + 1);
        }


// Original lines 1279-1380
    async function autoLayout() {
      const button = $<HTMLButtonElement>('autoLayoutBtn');
      const originalText = button.textContent;
      button.disabled = true;
      button.textContent = 'Laying out…';

      try {
        const ElkConstructor = await loadElkConstructor();
        if (typeof ElkConstructor === 'function') {
          elkInstance ||= new ElkConstructor();
          await autoLayoutWithElk();
          elkLayoutActive = true;
          updateLayoutEngineLabel();
          renderAll();
          fitView(autoLayoutFitMinimumZoom());
          return;
        }

        autoLayoutFallback();
        elkLayoutActive = false;
        elkRoutes.clear();
        updateLayoutEngineLabel('ELK unavailable · local layout');
        renderAll();
        fitView(autoLayoutFitMinimumZoom());
      } catch (error) {
        console.warn('[flow] ELK layout failed; using local layout fallback.', error);
        autoLayoutFallback();
        elkLayoutActive = false;
        elkRoutes.clear();
        updateLayoutEngineLabel('ELK failed · local layout');
        renderAll();
        fitView(autoLayoutFitMinimumZoom());
      } finally {
        button.disabled = false;
        button.textContent = originalText;
      }
    }

    async function loadElkConstructor() {
      elkConstructorPromise ||= import('elkjs/lib/elk.bundled.js')
        .then(module => module.default)
        .catch(() => null);
      return elkConstructorPromise;
    }

    async function autoLayoutWithElk() {
      const rects = getNodeRects();
      const nodesById = new Map(canvasNodes().map(node => [node.id, node]));
      const sortedNodes = [...canvasNodes()].sort((a, b) =>
        a.layout.column - b.layout.column || a.layout.row - b.layout.row || a.id.localeCompare(b.id)
      );
      const layoutEdges = canvasEdges().filter(edge => {
        const source = nodesById.get(edge.from);
        const target = nodesById.get(edge.to);
        if (!source || !target) return false;
        return target.layout.column >= source.layout.column;
      });

      const elkGraph = {
        id: 'root',
        layoutOptions: {
          'elk.algorithm': 'layered',
          'elk.direction': 'RIGHT',
          'elk.edgeRouting': 'ORTHOGONAL',
          'elk.partitioning.activate': 'true',
          'elk.spacing.nodeNode': '26',
          'elk.spacing.edgeNode': '14',
          'elk.spacing.edgeEdge': '8',
          'elk.spacing.edgeLabel': '4',
          'elk.layered.spacing.nodeNodeBetweenLayers': '50',
          'elk.layered.spacing.edgeNodeBetweenLayers': '14',
          'elk.layered.spacing.edgeEdgeBetweenLayers': '8',
          'elk.layered.nodePlacement.strategy': 'BRANDES_KOEPF',
          'elk.layered.nodePlacement.favorStraightEdges': 'true',
          'elk.layered.crossingMinimization.forceNodeModelOrder': 'true',
          'elk.layered.considerModelOrder.strategy': 'NODES_AND_EDGES',
          'elk.layered.mergeEdges': 'false',
          'elk.layered.cycleBreaking.strategy': 'MODEL_ORDER',
        },
        children: sortedNodes.map(node => {
          const rect = rects.get(node.id) || { w: NODE_WIDTH, h: NODE_HEIGHT };
          return {
            id: node.id,
            width: rect.w,
            height: rect.h,
            layoutOptions: {
              'elk.partitioning.partition': String(Math.max(0, Math.round(node.layout.column))),
              'elk.portConstraints': 'FIXED_SIDE',
            },
            ports: [
              elkPort(node.id, 'west', 'WEST'),
              elkPort(node.id, 'east', 'EAST'),
              elkPort(node.id, 'north', 'NORTH'),
              elkPort(node.id, 'south', 'SOUTH'),
            ],
          };
        }),
        edges: layoutEdges.map(edge => {
          const source = nodesById.get(edge.from);
          const target = nodesById.get(edge.to);
          const ports = chooseElkPorts(source, target);
          const elkEdge: any = {

// Original lines 1940-1965
        restoredGraph = activeVariantId ? materializeVariant(flowDocument, activeVariantId) : flowDocument.graph;
        graph = normalizeGraph(restoredGraph);
        authoredLayoutHintIds = extractLayoutHintIds(restoredGraph);
      } catch {
        flowDocument = normalizeDocument(initialGraph);
        activeVariantId = variantIdFromUrl();
        restoredGraph = activeVariantId ? materializeVariant(flowDocument, activeVariantId) : flowDocument.graph;
        graph = normalizeGraph(restoredGraph);
        authoredLayoutHintIds = extractLayoutHintIds(restoredGraph);
      }
      updateLayoutEngineLabel();
      renderAll();
      const hasAllPositions = canvasNodes().every(node => restoredGraph.layout?.positions?.[node.id]);
      requestAnimationFrame(async () => {
        if (hasAllPositions) fitView();
        else await autoLayout();
        await document.fonts?.ready;
        await new Promise<void>(resolve => requestAnimationFrame(() => resolve()));
        (window as any).__flowWorkbenchReady = {
          status: 'ready',
          layoutEngine: hasAllPositions ? 'authored' : (elkLayoutActive ? 'elk' : 'fallback'),
          nodeCount: canvasNodes().length,
        };
      });
    }

~~~~~~~~~~~~


## Source: src/types/overview.ts

Origin: working; full-source SHA-256: 03c4c009698e4b6a812118d88b38a5a56c5edccfe8395d80b0d2c573eb10bf8c

~~~~~~~~~~~~
export interface OverviewCapability {
  readonly id: string;
  readonly title: string;
  readonly detail: string;
  readonly groupId: string;
}

export interface OverviewGroup {
  readonly id: string;
  readonly title: string;
  readonly capabilities: readonly OverviewCapability[];
}

export interface OverviewDocument {
  readonly id: string;
  readonly title: string;
  readonly statusLabel: string;
  readonly purpose: string;
  readonly sourcePath: string;
  readonly groups: readonly OverviewGroup[];
}

~~~~~~~~~~~~


## Source: src/data/overviews/resume-app.ts

Origin: working; full-source SHA-256: e996241e6d7bf4b4d4cbb4b3f56f2ee5f3894db6fd2105105a40dc51f50f69d1

~~~~~~~~~~~~
import type { OverviewDocument } from "../../types/overview";

export const resumeAppOverview: OverviewDocument = {
  id: "resume-app",
  title: "Resume app",
  statusLabel: "Intended",
  purpose: "Prepare a relevant resume using truthful career evidence.",
  sourcePath: "src/data/overviews/resume-app.ts · typed fixture",
  groups: [
    {
      id: "role-and-evidence",
      title: "Role & evidence",
      capabilities: [
        {
          id: "understand-job-requirements",
          title: "Understand job requirements",
          detail: "Make the role legible before deciding which experience matters.",
          groupId: "role-and-evidence",
        },
        {
          id: "inventory-career-evidence",
          title: "Inventory career evidence",
          detail: "Gather truthful, specific evidence from the person's existing career material.",
          groupId: "role-and-evidence",
        },
        {
          id: "see-matches-and-gaps",
          title: "See matches and gaps",
          detail: "Show where the evidence supports the role and where it needs attention.",
          groupId: "role-and-evidence",
        },
      ],
    },
    {
      id: "drafting",
      title: "Drafting",
      capabilities: [
        {
          id: "tailor-resume-to-role",
          title: "Tailor a resume to a role",
          detail: "Draft focused changes using the selected requirements and career evidence.",
          groupId: "drafting",
        },
        {
          id: "prioritize-useful-changes",
          title: "Prioritize useful changes",
          detail: "Spend effort where a change can improve the result without adding noise.",
          groupId: "drafting",
        },
      ],
    },
    {
      id: "review-and-output",
      title: "Review & output",
      capabilities: [
        {
          id: "review-suggested-edits",
          title: "Review suggested edits",
          detail: "Inspect each proposed change and keep the reasoning visible for a human review.",
          groupId: "review-and-output",
        },
        {
          id: "approve-final-resume",
          title: "Approve a final resume",
          detail: "Confirm that the final document is accurate, useful, and ready to share.",
          groupId: "review-and-output",
        },
        {
          id: "export-result",
          title: "Export the result",
          detail: "Produce the finished resume in a form that can leave the workbench.",
          groupId: "review-and-output",
        },
      ],
    },
  ],
};

~~~~~~~~~~~~


## Source: docs/intent/wireframe-dsl/pro-review/prior-art-notes.md

Origin: working; full-source SHA-256: 37e1e3e39c61364a29d9b06a153525390d273572d3d686d5a341f3dd346165f0

~~~~~~~~~~~~
# Initial prior-art scan

These notes seed the Pro review. They are not an adoption decision or a runtime evaluation. Sources were inspected during packet preparation on 2026-08-31 UTC.

- [PlantUML Salt](https://plantuml.com/salt) documents wireframe widgets and nested grid composition. It is a direct syntax precedent. Borrowing the restricted control vocabulary is worth testing. Its punctuation syntax is not automatically a good fit for stable agent edits.
- [Wire-DSL](https://wire-dsl.org/) documents block syntax, components, layout containers, SVG output, and programmatic rendering. Its [repository](https://github.com/Wire-DSL/wire-dsl) is linked from its documentation. This is the closest initial candidate for adaptation. The home page has inconsistent component counts. Its architecture page failed to load during this scan. Implementation quality, license, and source-map behavior still need checking.
- [Wire Studio](https://wireframes.studio/) links to Wire-DSL and describes a local editor with templates and exports. Treat it as a related review workflow, not independent confirmation that the engine works.
- [Jonkeda's Wireframe DSL](https://marketplace.visualstudio.com/items?itemName=jonkeda.wireframe-vscode) documents a separate widget language, nested layout, SVG preview, and optional absolute positioning. It may show both useful patterns and the path toward an oversized authoring surface. A linked preview image returned 404. No extension was installed.
- [Mermaid block diagrams](https://mermaid.js.org/syntax/block.html) document explicit columns and nested blocks. They offer composition precedent, not ready-made UI control semantics.
- [D2 grids](https://d2lang.com/tour/grid-diagrams/) document row/column layout and a routing limitation for connections between grid cells. This supports examining diagram layout separately from screen layout. It does not establish that D2 should render the wireframes.

The Pro prompt asks for source and license checks before code reuse. No external code or lengthy source excerpts were copied into this packet.

~~~~~~~~~~~~
