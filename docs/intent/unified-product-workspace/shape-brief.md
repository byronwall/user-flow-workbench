---
title: "Unified product workspace — shape brief"
slug: "unified-product-workspace"
phase: shape
status: draft
last_updated: "2026-09-02"
---

# Unified product workspace — shape brief

## Recommendation

Build one capability-centered project workspace around the existing typed renderers. Make a valid overview the normal project entry point. Keep flows, wireframes, and overviews as separate `.diagram` bodies. Add only the references needed to connect a capability to wireframe screens.

The workspace should own project navigation, the current source path, and overview-origin context. Each renderer should keep its specialized behavior. Do not create a universal renderer interface before the shared shell proves that one is needed. Use the current URL state and catalog as the first source of workspace state.

When several overviews exist, show an overview chooser. When none exists, show the current diagram inventory. This avoids a project manifest and keeps every existing workspace valid.

## Problem and appetite

- **Problem:** Three useful document types feel like separate applications because each owns its page chrome and navigation.
- **Outcome:** A person moves from product scope to screens and flows without losing project or capability context.
- **Appetite:** One focused capability delivered through four useful milestones. Preserve the current renderers and source model.
- **Not in this shape:** Universal graphs, in-app relationship editing, inferred links, project databases, or flow-node-to-control mapping.

## Core shape

```text
project folder and catalog
        |
        v
workspace shell ----------------------------------+
  | project navigator                             |
  | selected overview and capability context      |
  | browser-addressable document and view state   |
  +---------------------+--------------------------+
                        |
          +-------------+-------------+
          |                           |
          v                           v
  typed renderer                shared context UI
  overview | wireframe | flow   breadcrumb | related items
```

The folder remains the project boundary. The catalog remains the file inventory. A selected overview supplies the capability structure. Explicit references in that overview supply related flows and wireframe screens. The app derives return context from those references.

The route remains browser-addressable. The document path, variant, screen, overview path, and capability ID must survive refresh and history navigation. Render mode bypasses normal workspace chrome so CLI captures stay stable.

The first relationship addition should be typed. A capability needs a wireframe reference with a `.diagram` path and optional screen ID. Do not replace flow references with a generic relationship language. Their targets and validation rules differ.

## Current fit

- **Reuse:** `Home` loading, `/api/diagrams`, `/api/diagram`, `DiagramCatalog`, `OverviewOrigin`, source safety checks, overview flow links, and all three workbench renderers.
- **Add:** One workspace shell, one small workspace-context projection, wireframe references on capabilities, and URL helpers for wireframe destinations.
- **Avoid or replace:** Separate full-page chrome, the special flow return banner, and the idea that the project index is a separate destination.

## How to make this go better

- **Prove the shell without a schema change.** Use the existing resume overview and flow link for the first complete journey.
- **Keep renderer state local.** The shell owns context, but flow editing and wireframe screen state stay with their current owners.
- **Add one typed relationship.** Connect capabilities to wireframe screens without introducing a general product graph.
- **Derive only local backlinks.** Use the active overview context first. Defer project-wide reverse indexing until direct opens need it.
- **Keep render mode separate.** CLI image output must not gain workspace navigation or depend on browser storage.
- **Preserve the old entry path.** A missing or invalid overview must fall back to the existing inventory.

## First proof

- **Question:** Does persistent project and capability context make the three renderers feel like one application?
- **Proof:** Open the resume overview, select resume tailoring, open its existing flow, use Back and Forward, and return inside one shell.
- **Observe:** The shell stays visible, selection survives valid navigation, the flow remains fully interactive, and direct URLs still work.
- **Pass / fail:** Pass when the journey needs no special return banner and users can always identify the project, capability, and current artifact.
- **Deliberately excludes:** Wireframe relationship syntax, project-wide backlinks, relationship editing, and visual polish.

## Rabbit holes and no-gos

- Do not extract a generic renderer framework before the three existing components expose a repeated need.
- Do not scan all documents into a stored relationship registry.
- Do not choose a default overview by filename or folder depth.
- Do not put capability identity inside flow nodes or wireframe controls.
- Do not change flow persistence while moving its page chrome.
- Do not make source refresh and browser-local edits appear equivalent.

## Serious alternative

A shared header and improved project picker would require less change. It would make the pages look related but would not preserve capability context. Keep that as the fallback if the first proof shows that a persistent navigator harms the flow canvas.

## Plan handoff

First prove the shell with the existing overview-to-flow link. Next add capability-to-wireframe references. Then add capability navigation and unlinked inventory. Finish with renderer regression checks, accessibility, documentation, and removal of obsolete chrome.
