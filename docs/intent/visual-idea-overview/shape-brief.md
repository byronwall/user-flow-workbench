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
