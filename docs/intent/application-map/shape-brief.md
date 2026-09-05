---
title: "Application Map — shape brief"
slug: "application-map"
phase: shape
status: current
last_updated: "2026-09-04"
---

# Application Map — shape brief

## Recommendation

Add a fourth, read-only `type application` document that acts as a compact crosswalk between product structure and the existing diagram types. Keep it deliberately smaller than a product database or planning system. Its body should define one application record, conceptual object records, explicit ownership/cardinality relations, page records with states, page-to-page navigation, and typed references to overview capabilities, flow nodes, wireframe screens, and external planning documents.

Build the first proof with the evidence-first resume studio. The map can name the representative pages and objects from the accepted proposal, but the Workbench should treat them as authored source, not inferred resume requirements. The viewer should make the map useful immediately: page graph, object rail, page inspector, direct links, source tab and refresh, URL page/state selection, and repairable coverage warnings.

The main implementation pushback is to avoid a generic graph or renderer framework. The existing catalog, document dispatcher, URL helpers, source-refresh behavior, and workspace shell are enough seams. Add an application model and specialized workbench only where the new semantics require them.

## Problem and appetite

- **Problem:** The Workbench has capability, operational, and screen views, but no source of truth for application pages, conceptual objects, or app-wide transitions.
- **Outcome:** A reader can understand where capabilities live, what objects move through the product, and which artifacts prove each page without leaving the Workbench.
- **Appetite:** One medium read-only capability delivered through four small vertical slices. No external dependencies.
- **Not in this shape:** Requirements management, tickets, database design, API contracts, application variants, editing, recursive projects, or a universal graph.

## Core shape

```text
application diagram
  ├── pages ── navigation edges ──> page graph
  │     ├── states
  │     └── typed artifact links ──> overview | flow | wireframe | planning doc
  └── objects ── ownership/cardinality ──> object rail
                         |
                         v
                   page inspector
```

The source remains authoritative. A minimal syntax can use explicit records such as `application`, `object`, `owns`, `page`, `state`, `overview`, `flow`, `wireframe`, `document`, and `nav`. Exact option names remain provisional until parser tests prove they are readable and unambiguous. A page reference must carry its target kind and safe relative path. Flow references may identify node IDs; wireframe references may identify screen IDs; documents may carry an optional heading anchor.

The resume proof should link pages such as Projects, Assessment, Evidence Interview, Confirmation, Review, and Export to the existing resume overview, alignment flow nodes, wireframe screens, and `docs/intent/evidence-to-resume-flow` artifacts. This is a representative fixture, not a new assertion that every resume product must have those exact pages.

The server should validate lexical path safety during parsing. It should resolve references through the existing containment checks and report missing files, wrong document types, unknown IDs, or missing screens as warnings. It should not infer relationships from same-folder inventory or titles.

## Current fit

- **Reuse:** `DiagramCatalog`, `parseDiagramWithDiagnostics`, `diagramToDsl`, `readDiagramDocument`, `resolveDiagramPath`, `resolveReferenceImagePath` patterns, `source-refresh.ts`, `WorkspaceShell`, `selectWorkspaceEntry`, existing URL state helpers, and read-only overview/wireframe navigation.
- **Add:** `src/types/application.ts`, `src/lib/application-dsl.ts`, application parser/formatter tests, application target validation in `flow-catalog.ts`, catalog and response unions, `ApplicationWorkbench.tsx`, and focused application navigation helpers.
- **Avoid or replace:** A second project manifest, a relationship registry, inferred backlinks, application variants, a renderer registry, or a new server endpoint.

## How to make this go better

- **Prove the source model first.** Parse and format one resume Application Map before adding viewer state. This prevents UI assumptions from defining the DSL.
- **Keep the four reference kinds separate.** Distinct target validation gives agents clear repairs and prevents a generic link object from hiding wrong-type errors.
- **Reuse the current read path.** Extend `/api/diagrams` and `/api/diagram` dispatch instead of creating an application endpoint or a second catalog.
- **Keep warnings non-blocking.** A valid map with one missing screen should still show its page graph and identify the broken link.
- **Keep page state in the URL.** Validate page and state IDs on load so refresh and direct links remain inspectable without storing browser drafts.
- **Use one representative fixture.** The resume studio exercises pages, objects, navigation, four target kinds, and coverage gaps without claiming broad product requirements.

## First proof

- **Question:** Does a compact Application Map make the resume studio’s page ownership and artifact coverage easier to understand than separate overview, flow, and wireframe files?
- **Proof:** Add one valid resume application source, parse it, load it through the existing catalog/API path, and render its page graph with one selected page, object rail, inspector, and direct links.
- **Observe:** The valid map becomes the project home; page/state URL changes survive refresh; a linked flow, wireframe screen, capability, and document open with context; an intentionally missing target shows a warning while the map remains usable.
- **Pass / fail:** Pass when the map is readable, all links remain typed and explicit, safe paths reject, target failures warn, and the overview/inventory fallback still works. Fail if the new body requires inferred semantics or breaks existing document routes.
- **Deliberately excludes:** Editing, application variants, universal graphs, new APIs, database fields, tickets, requirements, and production resume behavior.

## Rabbit holes and no-gos

- Do not make the DSL a requirements, backlog, API, or database schema language.
- Do not infer page links from folders, filenames, titles, or shared diagram membership.
- Do not add application variants or a global graph to solve future view composition.
- Do not build an abstraction layer for renderers before the application workbench shows a repeated need.
- Do not expand the resume fixture into unsupported product requirements.

## Serious alternative

Keep the existing overview as the project home and store the missing page/object/navigation model only in Markdown. This is cheaper, but it leaves the key crosswalk non-inspectable and makes direct artifact coverage hard to verify. It is a valid fallback if the application viewer adds more navigation cost than it removes.

## Plan handoff

The implementation plan should first prove the new document can parse, catalog, load, and render. Then add typed target validation and direct links, followed by preferred-home selection, URL page/state handling, source refresh, and coverage warnings. Keep the existing overview and inventory paths available at every step.
