---
id: ufw-gph8
status: closed
deps: [ufw-kxbr]
links: []
created: 2026-09-04T04:20:25Z
type: feature
priority: 1
assignee: Byron Wall
external-ref: docs/intent/application-map/implementation-plan.md#milestone-2
parent: ufw-j4cd
tags: [application-map, viewer, resume-proof]
---
# Render a readable resume Application Map

Make one authored Application Map useful in the viewer. The evidence-first resume studio is the representative product context: projects, assessment, evidence interview, confirmation, review, and export; conceptual objects such as resume project, posting, evidence library, interview, draft, and frozen export. Treat all resume structure as authored fixture content, not inferred product truth.

## Design

Add a specialized read-only ApplicationWorkbench. Render an explicit page graph, object rail with ownership and cardinality, and page inspector with purpose, states, and grouped typed references. Add an application section to the inventory. Reuse shell and source-panel conventions, but do not reuse OverviewWorkbench in a way that leaks capability assumptions. No universal renderer, editor, or inferred links.

## Acceptance Criteria

The representative map opens directly and shows readable graph bounds, page selection, object rail, and inspector. Keyboard selection works. Direct typed references are presented clearly. Narrow layout remains usable. Flow, overview, and wireframe renderers still open. Focused component and route tests plus typecheck and build pass.


## Notes

**2026-09-04T04:48:47Z**

Added a specialized read-only ApplicationWorkbench, application inventory section, domain-neutral page graph, transition list, object ownership rail, page inspector, source tab/export, and representative Resume Studio source at docs/intent/application-map/resume-studio.diagram. pnpm flow check, test:overview, typecheck, build, and diff check passed. Independent browser verification passed at 1280x900 and 390x844 after fixing narrow toolbar and long-route wrapping. Pointer and keyboard page selection, sidebar tabs, references, and existing artifact inventory navigation passed.
