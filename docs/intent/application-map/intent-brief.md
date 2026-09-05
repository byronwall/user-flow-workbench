---
title: "Application Map"
slug: "application-map"
phase: intent
status: current
last_updated: "2026-09-04"
---

# Application Map

## My read

The User Flow Workbench needs one compact, source-backed model for the product as a person experiences it. The current overview says what the product can do, a flow says how work moves, and a wireframe says what one screen may look like. None owns the application-wide page structure, the durable objects people believe they are working with, or the transitions between pages. An Application Map fills that gap.

It should make a product plan inspectable without moving the rich plan into the DSL. The map owns pages, important page states, conceptual objects, ownership and cardinality, app navigation, and explicit links to the existing overview capabilities, flow nodes, wireframe screens, and external planning documents. It is a compact crosswalk. It is not a database schema, requirements tracker, ticket system, universal graph, or in-app editor.

The representative proof is the evidence-first resume studio. Its map should make the resume project, evidence library, job posting, interview, assessment, draft, and export journey visible, while linking to the existing resume overview, alignment flow, evidence-interview wireframes, and planning artifacts. This proves whether the missing structure helps a reader move from product intent to pages and evidence without claiming requirements that the resume source did not establish.

## What matters most

- Make the application’s page and navigation structure explicit and easy to scan.
- Keep conceptual product objects, ownership, and cardinality visible without pretending to define database fields.
- Connect each page to existing capabilities, flow nodes, wireframe screens, and planning documents through explicit typed references.
- Keep source files agent-editable and keep detailed reasoning outside the DSL.
- Use the Application Map as the preferred project home when valid, with the existing overview and inventory fallback.

## The experience or behavior you appear to want

A person opens a project and sees its valid Application Map. The page graph shows how the product moves between pages. An object rail shows the important objects and their ownership or cardinality. Selecting a page opens an inspector with its purpose, states, related capabilities, flow nodes, wireframes, and planning links. Each link opens the existing artifact in the same shell. The URL preserves the selected page and state. The source view can be refreshed without losing the last valid board.

The resume studio proof should show a small page journey such as projects, assessment, evidence interview, confirmation, review, and export. It should expose coverage warnings when a page, reference, or screen is not accounted for. A warning keeps the valid map usable and gives an agent a repair target.

## Boundaries

### Must be true

- The new document uses the shared `diagram 1` envelope and a fourth `type application` body.
- Pages, page states, conceptual objects, ownership, cardinality, and app navigation have stable IDs.
- References identify their target kind: overview capability, flow node, wireframe screen, or external planning document.
- Safe path errors prevent loading. Missing, wrong-type, or missing-target cross-file references are non-blocking warnings.
- Application Maps are read-only in the viewer and remain source-backed.
- A valid Application Map takes project-home precedence; a valid overview remains the fallback.

### Must be avoided

- Do not add application variants, a universal graph, in-app editing, a new API route, or a renderer abstraction in the first slice.
- Do not infer links from folder membership, matching titles, or recursive project structure.
- Do not move requirements, tickets, API contracts, database fields, or the full planning corpus into the DSL.
- Do not invent resume product requirements beyond the resume studio source evidence.

## What seems settled

- The missing organizing structure is a first-class Application Map.
- The map contains pages, durable user-visible objects, navigation, and typed references.
- The viewer needs a page graph, object rail, page inspector, direct artifact links, source refresh, URL page/state state, and coverage warnings.
- Existing catalog, shell, source-refresh, and reference-validation patterns are the implementation seams.
- The first proof uses the evidence-first resume studio and its planning artifacts and diagrams.

## Possibilities, not decisions

- Exact command names and line syntax for application records remain implementation details until parser tests establish a small coherent language.
- The representative resume map may include the likely pages and objects from the proposal; it does not settle the resume product’s complete domain model.
- A later release may add more view-specific state or broader backlinks after the first read-only map proves useful.

## Current reality that matters

- `src/lib/diagram-dsl.ts` dispatches only `flow`, `overview`, and `wireframe` today.
- `src/server/flow-catalog.ts` already discovers `.diagram` files, validates safe paths, loads documents, and resolves overview references.
- `src/routes/index.tsx` already owns catalog loading, project-home selection, URL context, source-backed refresh, and the shared workspace shell.
- Overview and wireframe models already provide typed cross-file references and stable screen or capability IDs.
- The working tree contains user-owned changes across the shell, overview/wireframe support, docs, and tests. The planning work must not overwrite them.

## Next step after confirmation

Shape the smallest read-only `type application` language and sequence a vertical proof through parsing, catalog dispatch, page rendering, links, URL state, and warnings.
