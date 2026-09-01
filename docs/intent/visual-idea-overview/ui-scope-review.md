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
