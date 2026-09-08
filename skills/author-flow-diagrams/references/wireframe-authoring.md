# Wireframe authoring reference

Use this reference for `type wireframe`. The goal is conversation → visual → revision: compress the proposal into a readable screen, inspect it, then revise the source. Read the user's request and any current app source before choosing what to show.

## Choose evidence and scope

- Use `basis=observed` only after inspecting a reference screenshot, and set `reference=ID` to that local image.
- Use `basis=source` for a reconstruction from source evidence.
- Use `basis=proposed` for a new idea or a change. When modifying an existing app, reuse a small current shell and show the proposed change instead of redrawing the whole product.
- Keep alternatives only while they represent a live decision. Remove rejected alternatives after the decision.

References use workspace-relative local PNG or JPEG paths:

```text
reference current image="docs/intent/wireframe-dsl/reference/current-ui.jpg" width=1280 height=720 captured="2026-08-30" state="Current screen"
```

Do not claim a screenshot is bundled, observed, or pixel-identical when it is not.

## Implemented source shape

Every file uses the common envelope, then one wireframe declaration, viewport, optional theme, references or parts, and screens:

```text
diagram 1
type wireframe
wireframe proposal "Feature proposal"
viewport 1280 720
theme default

screen home "Home" basis=proposed {
  frame page content=720 {
    body {
      text "Feature proposal" role=title
    }
  }
}
```

Use `frame page` for a centered page with `body`. Use `frame workbench` for an app shell with optional `header`, `top`, and spanning `footer`, plus required `main` and `aside`. The footer renders across the main and inspector columns. A workbench `main` containing a semantic `diagram` has that diagram as its only direct child.

Each frame slot can occur only once. Page frames permit only `body`; workbench frames permit only `header`, `top`, `main`, `aside`, and `footer`. Unknown or duplicate slots are parse errors.

Use `stack` for ordinary grouping, `panel` for compound content, and `card` only as a leaf. Use a general `grid columns=N min=PX` for repeated content or calendar-like layouts; there is no calendar primitive. Keep the requested column count. `min` is optional and must be at least 120.

Quoted copy supports `\n` for an authored line break. The viewer preserves these breaks and still wraps long lines. A card with `goto=SCREEN_ID` is a keyboard and pointer control; a card without `goto` is static content and is not in the tab order.

Implemented elements include `text`, `badge`, `bar`, `form`, `field`, `textarea`, `select`, `toggle`, `checkbox`, `button`, `link`, `card`, `notice`, `tabs`, `list`, `rule`, `table`, and `diagram`. Controls need stable IDs. Use only themes `default` and `recipe`; the implemented button or field icons are `add`, `calendar-add`, `cart`, `chef-hat`, `chevron-left`, `chevron-right`, `copy`, `download`, `edit`, `mic`, `search`, `sparkles`, `trash`, and `upload`. Buttons use `variant=primary|secondary|quiet` for action hierarchy and default to `secondary`; their only tone is `destructive`, which takes precedence over variant color. Use only accepted states: button `selected|disabled`, select `disabled`, toggle `on|off|disabled`, checkbox `checked|unchecked|disabled`, card `selected`, tabs `active`, and checkable list items `checked|unchecked`.

## Make interaction meaningful

`goto=SCREEN_ID` is real gallery navigation. A popover is screen-local and its trigger must be a button in that same screen:

```text
shot rest
shot filters-open open=filters
button filter-trigger "Filters"
popover filters trigger=filter-trigger {
  select category "Category" value="All"
}

shot empty-answer {
  set answer value=""
  set save state=disabled
}
```

Use `mark TARGET_ID "Reason"` for an authored change. Targets can be a valid frame slot (`body`, `header`, `top`, `main`, `aside`, or `footer`) or one rendered element ID. The viewer keeps the normal mockup clean; use `Show changes` to outline marked targets and read the reasons. Unknown or ambiguous targets are parse errors.

The viewer supports click, keyboard activation, light dismiss, and Escape for the popover. A shot may overlay only an existing stable ID's `value` or control-specific `state`; use `set ID value="..."` or `set ID state=...` inside a shot block. The viewer applies these overlays at render time and leaves the base screen unchanged. Unknown or ambiguous IDs, duplicate targets, incompatible properties, and unsupported states are errors. Controls without `goto` or a popover trigger are illustrative. Use explicit local values and states to communicate the proposal; do not imply production behavior, bindings, handlers, or persistence.

Wireframe views are source-backed and read-only. Screen, shot, reference, comparison, sizing, and interaction state do not write `.diagram` source.

## Edit and validate

Keep source IDs stable across revisions. Put only the proposed change and its needed context on the screen. Do not add HTML, CSS, coordinates, arbitrary style tokens, production logic, or speculative DSL syntax.

Run:

```sh
pnpm flow check path/to/changed.diagram
pnpm flow view path/to/project --port PORT
```

The second command takes a directory or project root, not a file. Inspect the selected wireframe in the live viewer for readable hierarchy, complete bounds, real navigation, and the declared popover shot. The viewer is the visual proof. Advanced capture artifacts and wireframe variants are not part of this authoring workflow.
