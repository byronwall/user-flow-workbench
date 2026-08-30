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
