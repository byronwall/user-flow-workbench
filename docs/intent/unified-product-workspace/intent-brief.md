---
title: "Unified product workspace"
slug: "unified-product-workspace"
phase: intent
status: draft
last_updated: "2026-09-02"
---

# Unified product workspace

## My read

The workbench should become one place for shaping a product across three useful levels. An overview explains what the product contains. A wireframe shows what a person sees. A flow explains how work moves. These remain distinct document types because their semantics and interactions differ. The app must make them feel like connected views of one product, not three small applications.

The overview is the normal project home and the main organizing document. Selecting a capability should reveal its related wireframe screens and flows. Opening either artifact should preserve the capability context. A wireframe can start with only a capability relationship. It can gain a flow relationship later, after the flow exists.

The source files remain authoritative and easy for agents to edit. The app derives navigation from explicit references and the existing project catalog. It does not need a universal product graph, database, or project manifest for the first release. Existing standalone files must still open when a project has no overview or an artifact has no link.

## What matters most

- Keep product context while moving from capability scope to screens and operational behavior.
- Preserve the distinct overview, wireframe, and flow models.
- Make an overview the usual entry point without making it mandatory.
- Keep agent-authored `.diagram` files as the source of truth.
- Preserve dependable flow editing, layout, pan, zoom, and routing.

## The experience or behavior you appear to want

A person opens a project and normally sees its overview. They select a capability and see its detail, related screens, and related flows. They open a screen or flow inside the same workspace. The project and capability context remain visible. Browser Back and Forward restore the same context. Files without a relationship remain available through project navigation.

## Boundaries

### Must be true

- One persistent workspace provides project navigation and context.
- A capability can link to several flows and several wireframe screens.
- Several capabilities can link to the same artifact.
- A wireframe can exist before its related flow.
- The app derives reverse context instead of storing duplicate links.
- Direct file URLs and render mode remain usable.

### Must be avoided

- Do not merge the three DSL bodies into one universal schema.
- Do not require every artifact to belong to one capability.
- Do not infer semantic links from folder membership.
- Do not add a database, collaboration service, or in-app source editor.
- Do not weaken the current source safety checks or local-copy behavior.

## What seems settled

- Overviews will be common and make useful project summaries.
- Capabilities are the normal organizing context.
- Wireframes will usually relate to a capability or flow.
- The selected shape is a capability-centered workspace with typed artifacts.
- Byron will review this plan before ticket creation.

## Possibilities, not decisions

- A project could later declare one preferred overview when several exist.
- A wireframe could later link to a specific flow node.
- Directly opened artifacts could later show project-wide backlinks.

## Current reality that matters

- One catalog already discovers all `.diagram` files and reports their types.
- One dispatcher already parses flow, overview, and wireframe documents.
- Overview capabilities already link to flows and preserve return context.
- Wireframes already embed flow or overview scenes.
- The three workbench components currently own separate page chrome and state.
- Flow documents can contain browser-local edits. Overviews and wireframes remain source-backed.

## Next step after confirmation

Implement one resume-project journey inside a persistent shell. Then add capability-to-wireframe references and complete project navigation.
