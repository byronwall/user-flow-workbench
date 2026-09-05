# Diagram DSL compact authoring reference

Use this short reference for an ordinary `.diagram` file. Every file starts
with `diagram 1` and exactly one type line. Read the [complete specification](flow-dsl-spec.md)
for parser diagnostics, variants, positions, or a deliberate canonical-format
rewrite. The complete specification is the only syntax authority.

## Flow diagrams

Use `type flow` for an operational graph. Keep needs and UX records out of the
canvas and connect them with semantic relations.

```text
diagram 1
type flow

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

Allowed flow node types are `actor`, `need`, `input`, `process`, `handoff`,
`deliverable`, and `ux`. Every process needs an outgoing operational `flow`
edge. A terminal deliverable can be an outcome. Use a handoff for a transfer
of state, control, responsibility, or information.

Keep titles short because the canvas shows titles only. Put qualifications and
evidence in `body`. Preserve stable graph, node, edge, and variant IDs. Use
`layout=<column>,<row>` only when stage order or parallel grouping needs help.
Leave exact `position` values out of new files.

## Overview diagrams

Use `type overview` for a compact capability map. Keep the overview declaration,
optional purpose and status, ordered groups, and short capabilities easy to scan.

```text
diagram 1
type overview

overview resume-app "Resume app"
purpose "Prepare a relevant resume using truthful career evidence."
status "Intended"

group role-and-evidence "Role & evidence" {
  capability understand-job-requirements "Understand job requirements" detail="Make the role legible before deciding which experience matters."
}
capability open-ended "An ungrouped idea"
```

An empty draft is valid:

```text
diagram 1
type overview

overview draft "Untitled draft"
```

Overview capabilities do not need flow links, wireframe links, goals, or detail.
When a flow or proposed screen is useful, add one or more relative `.diagram`
references after the capability:

```text
capability tailor "Tailor a resume" detail="Draft focused changes."
  flow "src/data/flows/resume-alignment.diagram"
  flow "src/data/flows/resume-alignment.diagram" variant="per-job-resume"
  wireframe "src/data/wireframes/resume-workbench.diagram" screen="capability"
```

Flow targets must be `type flow` documents. Wireframe targets must be `type
wireframe` documents, and an optional screen ID must exist in the target.
Missing, unsafe, wrong-type, unknown-variant, and removed-screen targets produce
warnings while the overview stays loadable.
Ungrouped capabilities keep their order after groups. Preserve stable IDs and
add detail only when it clarifies the idea.

An overview variant applies ordered operations to a cloned base. It can add,
remove, or set groups and capabilities, and unset capability `detail`, `group`,
`flows`, or `wireframes`. To adopt a selected view, materialize it, format it as the new
base, remove rejected variants, check, and reload. The viewer has no adoption
write action.

## Application maps

Use `type application` for a read-only page and object crosswalk. Keep page
states, navigation, ownership, and typed references explicit:

```text
diagram 1
type application

application studio "Evidence Studio"
object project "Project"
page home "Home" route="/" primary=project {
  state ready "Ready"
  overview "scope.diagram" capability=home
  wireframe "home.diagram" screen=home
}
```

References use safe relative paths to overview capabilities, flow nodes,
wireframe screens, or planning documents. Missing targets remain warnings.
Coverage checks only explicitly referenced artifacts and never infer links from
folders or titles. The viewer is read-only; `page` and `state` URL parameters
select the page and authored state. Reload keeps the last valid board marked
stale after a failed source read.

## Check and review

Use the installed `flow` command with explicit paths. In a checkout, use
`pnpm flow` when the global command is unavailable.

```sh
flow check path/to/changed.diagram
flow format --check path/to/changed.diagram
flow render path/to/changed.diagram --output path/to/preview.png
```

For a directory, add `--contact-sheet` and `--report PATH`. Contact sheets
retain successful tiles at native size and split large directories into
numbered pages. Inspect the sheet and representative images.

Report three separate evidence labels:

- `STRUCTURAL`: parser, lint, formatting, and repository checks passed.
- `SOURCE`: the diagram preserves the requested scope, semantics, IDs, and source-only maintenance.
- `VISUAL`: an image or viewer was inspected for complete bounds, readable titles, branch labels, and misleading sequences.

Preserve source comments. Canonical formatting may remove them, so do not
promise a lossless rewrite. Retry a plausible transient render startup failure
once with the same source and settings. Do not retry an unchanged failure
blindly.
