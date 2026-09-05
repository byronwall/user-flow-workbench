# Diagram DSL specification

Status: Draft 0.5
Diagram format version: 1
Flow DSL version: 3
Graph JSON schema version: 5

## Purpose

Diagram DSL describes an operational flow, compact product overview, wireframe, or read-only application map.
The source extension is `.diagram`; the body parser is selected by one explicit
type line. The parser does not infer type from the filename and does not accept
a mixed body.

Every document starts with this envelope:

```text
diagram 1
type flow
```

or:

```text
diagram 1
type overview
```

The header and type line are required. A document has exactly one type line.

Flow diagrams describe an operational flow plus semantic needs and UX records.
Overview diagrams describe ordered capability groups and optional typed links to
standalone flow and wireframe diagrams.

The format separates three concerns:

- Nodes and edges contain semantic graph data.
- Edge relations distinguish operational flow from supporting metadata.
- Layout hints and exact positions contain optional presentation data.

A valid graph does not require layout hints or positions. The renderer creates an initial layout when positions are absent.

Variants are ordered changes to the shared base graph. The app materializes each variant as a complete graph view.

## Complete flow example

```text
diagram 1
type flow

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

See [checkout.diagram](examples/checkout.diagram) for a larger example.

Production flow diagrams live in `src/data/flows`, and production overview
diagrams live in `src/data/overviews`. The API parses these files directly.
JSON is a generated render and export format.

## Document structure

Use this command order:

1. The common `diagram 1` and `type flow` envelope.
2. One `graph` line.
3. Zero or one `description` line.
4. One or more `node` lines.
5. Zero or more `edge` lines.
6. Zero or more `variant` blocks.
7. Zero or more base `position` lines.

Each command uses one physical line. Use `\n` for a line break inside a string.

Blank lines can separate sections. A `#` starts a comment outside a quoted string.

## Commands

### Envelope and version

```text
diagram 1
type flow
```

The common `diagram 1` line is required and must be first. The `type flow` line
selects the flow body. Flow version 3 is represented by this body shape; the
legacy `flow 3` header is not valid in a `.diagram` document. Earlier diagram
and flow versions are not supported.

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

## Overview diagrams

Use `type overview` for a compact capability map. An overview has a stable
document ID and title. Purpose is optional. Status is optional in source and
defaults to `Intended`; when present it must be `Current` or `Intended`.
Groups are ordered. Capabilities can be grouped or ungrouped. An empty overview
is valid, and overview capabilities do not require flow edges, wireframe links,
goals, or detail.

```text
diagram 1
type overview

overview resume-app "Resume app"
purpose "Prepare a relevant resume using truthful career evidence."
status "Intended"

group drafting "Drafting" {
  capability tailor "Tailor a resume to a role" detail="Draft focused changes."
    flow "src/data/flows/resume-alignment.diagram"
    flow "src/data/flows/resume-alignment.diagram" variant="per-job-resume"
}
capability open-ended "An ungrouped idea"
```

Each `flow` reference follows its capability and may be repeated. Its path is
relative to the configured diagram root, must be a safe relative `.diagram`
path, and must resolve to a document with `type flow`. An optional `variant`
selects a flow variant. Missing, unsafe, wrong-type, or unknown-variant links
produce warnings while the overview remains loadable. A `wireframe` reference
uses the same safe path rules and may include an optional stable `screen` ID.
Missing, unsafe, wrong-type, or removed-screen targets produce warnings while
the overview remains loadable.

Overview variants are ordered operations over the shared base. They do not
inherit from another variant. The materializer clones the base before applying
operations and validates the final view.

```text
variant focused "Focused scope" {
  description "A smaller first release."
  set capability tailor title="Tailor one resume for one role"
  add group review "Review"
  add capability approve "Approve the result" group="review"
  set capability tailor flow="src/data/flows/resume-alignment.diagram" variant="per-job-resume"
  set capability tailor wireframe="src/data/wireframes/resume-workbench.diagram" screen="capability"
  unset capability open-ended detail
}
```

Supported overview operations are:

```text
add group <group-id> "<title>"
remove group <group-id>
set group <group-id> title="<title>"
add capability <capability-id> "<title>" [detail="<text>"] [group="<group-id>"] [flow="<path.diagram>" [variant="<id>"]]... [wireframe="<path.diagram>" [screen="<id>"]]...
remove capability <capability-id>
set capability <capability-id> [title="<title>"] [detail="<text>"] [group="<group-id>"] [flow="<path.diagram>" [variant="<id>"]]... [wireframe="<path.diagram>" [screen="<id>"]]...
unset capability <capability-id> detail|group|flows|wireframes
```

Adding a group or capability requires a unique ID. A capability can move to an
existing group or become ungrouped with `group=""`. Removing a group fails if
it still contains capabilities. Unsetting `flows` removes all flow references.
Unsetting `wireframes` removes all wireframe references without changing flow
references.
The final view must still have unique IDs, valid groups, valid flow paths, and
valid status.

To adopt a view, an agent materializes the selected variant, formats that view
as the new base, removes rejected variants, runs `check`, and reloads the
source. Adoption has no write API or viewer control.

### Overview command shapes

An overview body uses these commands in order:

1. One `overview` declaration.
2. Zero or one `purpose` and `status` lines, in either order.
3. Zero or more ordered `group` blocks.
4. Zero or more ungrouped `capability` declarations.
5. Zero or more overview `variant` blocks.

```text
overview <overview-id> "<title>"
purpose "<text>"
status "Current"|"Intended"
group <group-id> "<title>" {
  capability <capability-id> "<title>" [detail="<text>"] [flow="<path.diagram>"]... [wireframe="<path.diagram>"]...
    flow "<path.diagram>" [variant="<flow-variant-id>"]
    wireframe "<path.diagram>" [screen="<wireframe-screen-id>"]
}
capability <capability-id> "<title>" [detail="<text>"] [flow="<path.diagram>"]... [wireframe="<path.diagram>"]...
variant <variant-id> "<title>" {
  description "<purpose>"
  <overview operation>
}

## Application maps

Use `type application` for a read-only map of application pages, authored page
states, conceptual objects, ownership/cardinality, page navigation, and typed
links to existing artifacts. Application maps have no variants or editing API.

```text
diagram 1
type application

application studio "Evidence Studio"
purpose "Prepare evidence for one role."
object project "Project" detail="The workspace for one application effort."
owns project-evidence studio project one
page home "Projects" route="/projects" primary=project {
  purpose "Choose a project."
  state ready "Project selected"
  overview "scope.diagram" capability=home
  flow "alignment.diagram" node=start
  wireframe "studio.diagram" screen=home
  document "docs/plan.md" heading="Scope"
}
nav home-review home -> review trigger="Open review"
```

The command shapes are:

```text
application <id> "<title>"
purpose "<text>"
object <id> "<title>" [detail="<text>"]
owns <id> <owner-id> <object-id> (one|many|optional|one-or-many)
page <id> "<title>" [route="<path>"] [primary=<object-id>] {
  purpose "<text>"
  state <id> "<title>" [detail="<text>"]
  overview "<path.diagram>" capability=<capability-id>
  flow "<path.diagram>" node=<node-id>
  wireframe "<path.diagram>" screen=<screen-id>
  document "<path.md|mdx|txt|pdf|json>" [heading="<text>"]
}
nav <id> <from-page-id> -> <to-page-id> trigger="<text>" [condition="<text>"]
```

Paths must be safe relative paths below the selected project root. Diagram
references must resolve to their declared type and target ID. Planning links
must resolve to an allowed document, and an authored heading must exist when
one is supplied. Missing, wrong-type, missing-ID, and missing-heading links
remain non-blocking warnings. Coverage warnings report pages without an
explicit wireframe and unclaimed nodes, capabilities, or screens only within
explicitly referenced flow, overview, or wireframe files. Folder discovery,
title matching, recursive projects, inferred links, and coverage scores do not
create application semantics.

The viewer displays page and state selection in the `page` and `state` URL
parameters. It is source-backed and read-only. `Reload source` uses the visible
or focused refresh controller. A failed refresh preserves the last valid board
and marks it stale until a later success. Application capture waits for the
renderer ready flag. Source exports are browser downloads, and automated
browser checks do not verify the browser download destination.
```

Capability `flow="<path.diagram>"` options are a compact form for a reference
on the same line. A separate indented `flow` line follows the preceding
capability and supports an optional `variant` option. Both forms preserve
reference order, and a capability may have many references.

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

Run `pnpm flow check` to parse and lint production and example `.diagram` files.
Pass file or directory paths to check other diagrams.

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

This EBNF defines the accepted flow body command shapes. `WS` means one or more spaces or tabs. The common envelope is parsed before this body.

```text
document       = diagramHeader, NL+, typeFlow, NL+, flowBody ;
diagramHeader  = "diagram", WS, "1" ;
typeFlow       = "type", WS, "flow" ;
flowBody       = graph, NL+, description?, node+, edge*, variant*, position*, EOF ;
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
Overview bodies use the command shapes documented in [Overview diagrams](#overview-diagrams). Their `flow` reference lines are nested under the preceding capability and their variant operations are ordered within a variant block.

## Canonical formatting

`graphToDsl` produces one canonical flow body representation. `diagramToDsl`
adds the `diagram 1` and `type flow` envelope. `overviewToDsl` produces the
overview body and `diagramToDsl` adds the `type overview` envelope. Each
formatter applies these option orders:

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
| `diagram 1` + `type flow` | `dslVersion: 3` and `type: "flow"` |
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

An overview response contains `type: "overview"`, the parsed base `document`,
and may include a selected materialized `view`, `activeVariant`, and reference
`warnings`. Its semantic fields map as follows:

| DSL field | JSON field |
| --- | --- |
| `overview` ID and title | `id`, `title` |
| `purpose` | `purpose` |
| `status` or omitted status | `statusLabel` (`Current` or default `Intended`) |
| `group` | `groups[]` |
| `capability` | `groups[].capabilities[]` or `capabilities[]` |
| capability `detail` | `detail` |
| `flow` reference | `flowRefs[].path` and optional `flowRefs[].variant` |
| `wireframe` reference | `wireframeRefs[].path` and optional `wireframeRefs[].screen` |
| overview `variant` | `variants[]` |

## Diagnostics contract

`parseGraphDsl` stops on the first flow diagnostic. It throws `GraphDslError`.

`parseGraphDslWithDiagnostics` returns a partial graph and all recoverable flow diagnostics. The overview parser provides the corresponding `OverviewDslError` and recoverable diagnostic result.

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
| `FLOW3xx` | Variant syntax or materialization error |

Overview diagnostics use the `OVERVIEW1xx` range for syntax and structure,
`OVERVIEW2xx` for identifiers and references, and `OVERVIEW3xx` for variant
syntax or materialization errors. Common envelope diagnostics use
`DIAGRAM1xx`.

A malformed command does not prevent later valid lines from entering the partial graph.

## Validation rules

A canonical document must meet these rules:

- It starts with `diagram 1` and exactly one type line.
- A `type flow` document has one graph line and at least one node.
- A `type overview` document has one overview line; an empty overview is valid.
- Each body uses the command order for its declared type.
- Every node, edge, group, capability, and variant ID is unique within its scope.
- Every edge and position reference resolves.
- Every flow reference is safe, relative, and points to a flow diagram.
- Every wireframe reference is safe, relative, and points to a wireframe diagram; an optional screen ID is stable.
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
10. Variant readiness: Variants are ordered operations over a shared base; no variant node or variant lane exists.
11. Overview references: Every flow reference is a safe relative `.diagram` path and optional target variant; every wireframe reference is a safe relative `.diagram` path and optional target screen.
12. Overview materialization: A selected view is derived from a cloned base and the final view is validated before adoption.

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
