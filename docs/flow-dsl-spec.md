# Flow DSL specification

Status: Draft 0.3
DSL version: 2
JSON schema version: 4

## Purpose

Flow DSL describes a directed product or user-flow graph. It supports deterministic agent generation and mutation.

The format separates two concerns:

- Nodes and edges contain semantic graph data.
- Layout hints and exact positions contain optional presentation data.

A valid graph does not require layout hints or positions. The renderer creates an initial layout when positions are absent.

Variants are ordered changes to the shared base graph. The app materializes each variant as a complete graph view.

## Complete example

```text
flow 2

graph checkout "Online checkout"
description "Checkout flow from purchase intent through confirmation."

node customer actor "Customer"
node payment process "Submit payment" body="Authorize the selected payment method." tags=["checkout","money"] layout=2,1
node confirmation goal "Order confirmed" layout=3,1

edge payment-completes payment -> confirmation label="approved" emphasis=true

variant saved-card "Use saved card" {
  description "Skip payment entry when a valid saved card exists."
  set node payment title="Confirm saved card"
  set edge payment-completes label="confirmed"
}

position payment 620,154
position confirmation 940,154
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
flow 2
```

This line is required and must be first. Version 2 is the only supported DSL version.

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

Layout values are hints. They are not exact canvas coordinates.

### Edge

```text
edge <edge-id> <from-node-id> -> <to-node-id> [label="<label>"] [emphasis=true]
```

Each edge ID is required and must be unique. Both referenced nodes must exist.

The arrow points from the source node to the target node.

Edge options use this canonical order:

1. `label`
2. `emphasis`

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
unset edge <edge-id> label|emphasis
position <node-id> <x>,<y>
clear all
```

`set` changes only the listed properties. `unset` removes an optional property. Required IDs, node types, titles, and edge endpoints cannot be unset.

`clear all` removes all inherited nodes, edges, hints, and positions. It must be the first operation. Add a complete replacement graph after it. The result must contain at least one node and cannot contain a dangling edge.

Removing a node does not silently remove its edges. Remove connected edges first. This rule makes structural changes explicit for agents.

Variant positions override base positions for the same node. Positions are optional. A variant with missing positions receives a fresh automatic layout. Dragging a node in a variant appends or updates its `position` operation.

### Materialization and JSON

Schema version 4 stores the agent document in this shape:

```json
{
  "dslVersion": 2,
  "schemaVersion": 4,
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
| `need` | Problem, requirement, or user motivation | `Understand delivery timing` | A business goal or step |
| `process` | Operational action or transformation | `Validate payment` | A UI surface |
| `handoff` | Transfer of information, control, or state | `Payment result` | The resulting artifact |
| `deliverable` | Durable artifact or output | `Order receipt` | The transfer that produced it |
| `ux` | User interaction, interface behavior, or guidance | `Explain payment recovery` | Backend-only processing |
| `goal` | Desired end state or measurable outcome | `Order confirmed` | One intermediate action |

Use `need` for why the flow matters. Use `goal` for the state the flow should produce.

Use `handoff` for a transfer. Use `deliverable` for the durable item transferred or produced.

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
version        = "flow", WS, "2" ;
graph          = "graph", WS, id, WS, string ;
description    = "description", WS, string ;

node           = "node", WS, id, WS, nodeType, WS, string, nodeOption* ;
nodeOption     = WS, (body | tags | layout) ;
body           = "body=", string ;
tags           = "tags=", stringArray ;
layout         = "layout=", number, ",", number ;

edge           = "edge", WS, id, WS, id, WS, "->", WS, id, edgeOption* ;
edgeOption     = WS, (label | emphasis) ;
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
nodeType       = "actor" | "need" | "process" | "handoff" |
                 "deliverable" | "ux" | "goal" ;
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
- Edge: `label`, `emphasis`.

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

The strict parser returns a schema version 3 graph.

| DSL field | JSON field |
| --- | --- |
| `flow 1` | `dslVersion: 1` |
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

- It starts with `flow 1`.
- It has one graph line and at least one node.
- Command sections use the required order.
- Every node and edge ID is unique.
- Every edge and position reference resolves.
- Every node uses an allowed node type.
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

## Mutation regression suite

The executable suite is [graph-dsl.test.ts](../src/lib/graph-dsl.test.ts).

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
