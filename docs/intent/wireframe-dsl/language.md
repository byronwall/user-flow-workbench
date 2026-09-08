# Wireframe language contract

Status: first application slice implemented, 2026-08-31. The parser and viewer cover the documented examples. Advanced capture artifacts remain deferred.

## Envelope and lexical rules

Use `.diagram` for all document types. The common dispatcher delegates each payload to its own parser.

```text
diagram 1
type wireframe
wireframe ID "Title"
viewport WIDTH HEIGHT
theme default|recipe
reference*
part*
screen+
```

IDs follow the existing flow rule: `[A-Za-z0-9][A-Za-z0-9._-]*`. Strings use double quotes and the existing flow escaping rules. Options use `key=value`.

`#` begins a comment outside a string. Unknown commands, properties, states, and escapes are errors. Reject duplicate properties and declarations.

Preserve source order within content. Format options and frame slots canonically. Comments need not survive canonical formatting, consistent with the flow formatter.

Widths, heights, and column counts are positive integers in CSS pixels or columns. Reject values that exceed documented renderer resource limits. Resource limits must not act as hidden layout choices.

A document may declare one named theme after `viewport`: `theme default` or `theme recipe`. If omitted, the theme is `default`. Themes select renderer-owned presets. They do not add style options to the language.

## References, parts, and screens

```text
reference ID image="workspace/path.png" width=WIDTH height=HEIGHT
  [captured="date"] [state="captured state"] [url="context URL"]

part ID {
  ELEMENTS
}

screen ID "Title" basis=observed|source|proposed [reference=ID] {
  mark TARGET_ID "Reason"
  shot ID [hover=ELEMENT_ID] [open=POPOVER_ID]
  shot ID {
    set ELEMENT_ID value="..."
    set ELEMENT_ID state=STATE
  }
  FRAME
}
```

The reference declaration occupies one source line. The wrapped syntax above shows its options only.

Reference, part, and screen IDs are unique within their respective document namespaces. `reference` resolves an image record. `goto` resolves a screen in the same document.

Evidence basis means:

- `observed`: the author inspected the screen directly; cite a reference image.
- `source`: the author inferred or simplified the screen from source evidence.
- `proposed`: the screen represents an intended change.

Require a reference for `basis=observed`. Permit references for the other bases. A reference is evidence, not an assertion of pixel equality.

Parts contain elements only. They cannot contain screens, frames, references, marks, diagrams, or uses at any depth. Expansion is exact. Parts have no parameters or overrides; screen shots may overlay rendered IDs.

Panels are containers and require an ID. They accept normal element children. Cards remain leaves and cannot contain child elements.

To change one use, replace it with explicit elements and assign IDs valid in that screen. To change every use, edit the part. This operation is an agent edit, not new syntax.

Marks may repeat. They target an existing frame slot or an explicit direct-child ID in that slot. They do not target nested descendants or alter selected state.

Shots are named review states of one screen. A screen can omit them. If it declares shots, one plain shot represents the resting state. Other shots can force one hover target and one open popover, or overlay an existing stable ID's `value` or control-specific `state` with `set ID value="..."` or `set ID state=...`.

Shot overlays apply only at render time. They never mutate the base screen. Unknown or ambiguous IDs, duplicate targets, incompatible properties, and unsupported states are errors. The live viewer starts at rest, uses real interaction, and provides a compact per-screen state selector for declared shots.

## Frames

```text
frame workbench [inspector=346] {
  header { BAR_OR_SINGLE_USE }
  top { BARS_TABS_OR_SINGLE_USES }
  main { ELEMENTS }
  aside { ELEMENTS }
}

frame page [content=720] {
  body { ELEMENTS }
}
```

Workbench requires `main` and `aside`. `header` and `top` are optional. Page requires `body` and permits no other slots.

Each slot occurs at most once. The formatter orders workbench slots as header, top, main, aside. Source order does not change frame geometry.

Header contains exactly one bar, or one use resolving to one bar. Each top child is a bar, tabs, or a use resolving to one such element.

Main, aside, and body arrange direct children as implicit stacks. When main contains a diagram, that diagram must be its sole child.

## Element inventory

```text
stack [ID] { ELEMENTS }
panel ID {
  ELEMENTS
}
bar [ID] {
  start { BAR_LEAVES }
  end { BAR_LEAVES }
}
grid [ID] columns=N [min=PX] { ELEMENTS }

text [ID] "Content" [role=title|heading|body|caption]
badge [ID] "Label"
button ID "Label" [goto=SCREEN_ID] [icon=add|calendar-add|cart|chef-hat|chevron-left|chevron-right|copy|download|edit|mic|search|sparkles|trash|upload] [iconOnly=true] [variant=primary|secondary|quiet] [tone=destructive] [state=selected|disabled]
link ID "Label" [goto=SCREEN_ID]
field ID "Label" [value="Example"]
textarea ID "Label" value="Text"
select ID "Label" value="Option" [state=disabled]
toggle ID "Label" [state=on|off|disabled]
checkbox ID "Label" [state=checked|unchecked|disabled]
card ID "Title" [detail="Text"] [goto=SCREEN_ID] [state=selected]
notice ID "Title" [detail="Text"] [kind=info|warning|error]
popover ID trigger=BUTTON_ID {
  ELEMENTS
}
rule [ID]
use INSTANCE_ID PART_ID

tabs ID {
  tab ID "Label" [goto=SCREEN_ID] [state=active]
}
list ID [mode=plain|ordered|checkable] {
  item ID "Label" [detail="Text"] [goto=SCREEN_ID] [state=checked|unchecked] [action=remove]
}
diagram ID source="workspace/path.diagram" view=VIEW_ID [focus=SEMANTIC_ID]
```

The canonical list form is `list ID mode=plain|ordered|checkable { ... }`. Omitted `mode` means `plain`. Checkable items require `state=checked` or `state=unchecked`. Ordered items cannot set `state`. An item with `action=remove` shows a remove action.

Blocks use braces on declaration and closing lines, as shown in the examples. Compact inventory notation does not introduce inline block syntax.

A bar has optional start and end groups, each at most once. Its leaves are text, badge, button, or link. No nested containers, cards, fields, uses, or diagrams are allowed inside a bar.

Text defaults to body. Notice defaults to info. An omitted state means ordinary appearance. Cards remain leaves. Use a stack for compound content.

Fields and textareas show sample values. Selects, toggles, and checkboxes show explicit local state. These controls do not run application behavior. `goto` changes the gallery screen; a disabled button does not navigate. Button `icon`, `variant`, `tone`, and `state` values are finite. Buttons default to the `secondary` variant. Destructive tone remains distinct from hierarchy and takes precedence over variant color. Unknown values are errors.

A popover is screen-local progressive disclosure. Its trigger is a button in the same screen. The browser opens it on click and keyboard activation, supports light dismiss and Escape, and returns to the rest state when dismissed.

Popover content uses the normal stack layout. Version 1 forbids diagrams, uses, popovers, and frames inside it. Popovers are not allowed in parts.

Hover can change trigger appearance in a shot, but it must not be the only way to reveal content. The same trigger must work by click, Enter, and Space.

Controls with `goto` and popover triggers are interactive in the live viewer. Other controls depict the proposed screen only. The viewer must not give illustrative controls a pointer cursor or silently pretend an action occurred.

A tab set permits zero or one active tab. Cards can be selected. Checkable list items use `checked` or `unchecked` state. Multiple independent selections are valid. No screen-wide selection exists.

## Identity and safe edits

Passive and structural elements may omit IDs. Controls, notices, fields, lists, tabs, tab entries, list items, popovers, uses, and diagrams require IDs.

All explicit element IDs must be unique within their owner screen or part, including nested elements. Moving an element inside that owner preserves its identity.

Reserve `header`, `top`, `main`, `aside`, and `body` as screen element IDs. Marks use these names for slots. Part-local IDs use their own namespace.

A part declaration identifies shared source. A use ID identifies one screen instance. Rendered part children retain both identities. Reparenting a use does not change its ID.

Store declaration spans and property spans. Include the use-site span when reporting an error in a rendered part instance. Do not use array indexes or tree paths as durable references.

Anonymous elements have capture-local keys only. Add an explicit ID before referring to an element across edits. Rendered breadcrumbs are display aids, not source authority.

## Layout contract

The renderer owns versioned low-fidelity tokens. Authors control only viewport size, inspector width, page content width, grid column count, and an optional grid minimum width.

Do not expose fonts, colors, spacing, element dimensions, coordinates, CSS, breakpoints, or style escape hatches. Do not inherit changing application CSS silently.

### Workbench

- Inspector defaults to 346 pixels and spans the full viewport height.
- Require viewport width minus inspector width to be at least 560 pixels.
- Header and each top row are exactly 48 pixels high.
- Header and top consume space only in the main column.
- Main uses the remaining height. Reject a frame with no positive main height.
- Main and aside have independent overflow and cannot resize each other.
- Bar content never wraps or reduces its font size.

Bar groups retain their natural widths. Use a fixed minimum gap between them. Align end to the right when space permits.

If a bar is too wide, place groups sequentially in a horizontal scroll area. Do not overlap them. Emit a diagnostic and visible overflow marker without increasing its height.

### Page and arrangements

Page centers a content panel. Its maximum width defaults to 720 pixels. Clamp it to the viewport minus fixed outer insets.

The page scrolls vertically as content grows. Horizontal overflow remains visible and diagnosed when a fixed grid or bar cannot fit.

Stack uses natural vertical flow and a fixed gap. Grid uses `repeat(N, minmax(PX, 1fr))`. N is any positive integer within resource limits. `PX` is an optional minimum column width; when present, it must be an integer of at least 120 pixels. The renderer default applies when it is omitted.

Keep the requested column count. If the grid cannot fit, report horizontal overflow. Do not introduce an automatic breakpoint.

There is no calendar primitive. Use a general grid and existing elements to depict calendar layouts.

Use `min-width: 0` and `min-height: 0` at bounded frame regions. Measure actual content and scroll extents.

### Text

Wait for `document.fonts.ready` and two animation frames before measurement. Record the browser build, font configuration, and font availability.

Use browser line boxes, not character counts. Outside bars, wrap at words and use `overflow-wrap:anywhere` for unbroken tokens.

Cards, notices, fields, and list entries grow vertically. Do not hide words, add ellipsis, or shrink fonts to fit.

The SVG serializer must preserve measured line placement. Font fallback is a diagnostic. Pixel comparison alone does not prove text fidelity.

## Embedded semantic diagrams

Permit one diagram per screen, as the sole direct child of workbench main. Permit flow and overview targets only.

Require an explicit view. Validate the view against the target; do not silently fall back to base. Validate focus against the materialized view.

For flow, focus names a visible operational node. For overview, focus names a visible capability. Focus adds emphasis without changing layout.

A missing authored focus is an error. Keep any last-valid preview visibly stale. An agent must explicitly clear focus and revise related inspector text.

Inspector text is a wireframe description, not an automatic binding. Do not infer updates from diagram selection. Existing viewer interactions retain their own behavior.

Capture each target's normal semantic scene. Fit it only while the smallest effective text remains at least 12 CSS pixels.

If fitting needs a smaller scale, use the minimum readable scale and internal overflow. Record the clipped extents. Never expand the root wireframe SVG.

Do not mutate target positions, routes, source, or persistent viewer state. Reject recursive wireframe embedding. No second graph router belongs in this feature.

## Paths and assets

All diagram and image paths are relative to the selected workspace root, not the declaring file. This matches current catalog reference rules.

Reject absolute paths, empty segments, `.` and `..`, remote assets, ignored paths, and symlinks. Resolve and validate paths on the server.

Reuse `resolveDiagramPath` for diagram files. A future image resolver must enforce equivalent containment and file checks. Do not broaden the diagram resolver to arbitrary files.

The first image formats are PNG and JPEG. Check file signature, decoding, and declared dimensions. Reject a format/extension mismatch or a dimension mismatch.

A reference image may differ from the wireframe viewport. Warn and label both dimensions. Preserve its aspect ratio; do not stretch it into a false match.

The optional URL is capture context only. Do not fetch or navigate it during rendering. Bundle validated local images with the gallery.

## Outputs and inspection

| Artifact | Contract |
| --- | --- |
| `screen.svg` | Exact nominal viewport, clean rendering, standalone vector UI and text. |
| `screen-annotated.svg` | Same viewport and layout, with marks overlaid. |
| `screen-full.svg` | Optional supplemental panels for scroll regions at CSS pixel scale. Never the comparison baseline. |
| `render-manifest.json` | Source/dependency hashes, viewport, bounds, overflow, diagnostics, renderer/browser/font versions. |
| `source-map.json` | Declaration/property spans, owner IDs, use instances, and render keys. |
| `layout.json` | Measured boxes and line boxes; computed evidence, never authoring input. |
| `index.html` | Gallery with source links, actual screenshot, clean/annotated switch, and navigation. |

When a screen declares shots, the viewer provides a compact per-screen state selector. The manifest records the shot ID and forced hover/open targets plus bounded value/state overlays.

The proof must retain source-map and layout output. Later routine captures may omit debug files. The manifest remains required.

A full-content export labels each independent scroll region. It must not pretend that several scroll containers form one taller screen.

Serialize the supported component set to SVG. Do not make a generic DOM-to-SVG engine. `foreignObject` and a rasterized UI do not satisfy vector export.

The real screenshot remains a raster reference. It must not be presented as generated vector output.

## Errors and deferred work

Fatal parse, reference, or capture errors fail fresh capture. A live preview may keep a visibly stale last-valid result.

Diagnostics need a code, severity, message, source span, and related use-site span when applicable. Overflow is a warning with measurable extents.

Defer dialogs, part parameters, instance overrides, expanded sections, multiple viewport presets per document, and a GUI. Add a dialog only when a proof needs modal focus, focus trapping, and a blocking decision.

Unsupported: arbitrary HTML/SVG, CSS, coordinates, bindings, event handlers, remote assets, wireframe variants, and production code generation.
