---
id: ufw-kxbr
status: closed
deps: []
links: []
created: 2026-09-04T04:20:24Z
type: feature
priority: 1
assignee: Byron Wall
external-ref: docs/intent/application-map/implementation-plan.md#milestone-1
parent: ufw-j4cd
tags: [application-map, schema, parser]
---
# Make application documents structurally usable

Add the independent Application Map domain model and grammar. Records cover one application, conceptual objects, explicit ownership and cardinality, pages, authored page states, page navigation, and typed references to overview capabilities, flow nodes, wireframe screens, and safe planning documents. IDs are stable. Safe path violations are structural errors. The source model is not a database schema or universal graph.

## Design

Own the application types, parser, formatter, shared diagram dispatch, catalog and response unions, and CLI check or format support. Reuse existing diagnostic and catalog patterns. Keep cross-file target resolution out of the parser. Add no application variants, new endpoint, renderer abstraction, dependency, or inferred relationship. Preserve dirty user changes and the deleted resume fixtures.

## Acceptance Criteria

A representative type application source parse-format-parses. Duplicate IDs, unknown local references, malformed cardinality, invalid commands, and unsafe paths have stable diagnostics. The catalog discovers and loads the fourth type through existing APIs. Existing flow, overview, and wireframe checks remain valid. Focused tests, typecheck, and build pass or known pre-existing failures are recorded.


## Notes

**2026-09-04T04:32:22Z**

Acceptance clarification from source review: include optional application purpose; optional page route and primary object reference; navigation trigger and optional condition; and safe .json planning-document references in addition to Markdown. Validate unknown page object IDs. These were present in the accepted Application Map proposal and must be part of the structural grammar before close.

**2026-09-04T04:35:11Z**

Implemented independent type application records and line-based grammar for application purpose, conceptual objects, ownership/cardinality, pages with route and primary object, authored states, typed overview/flow/wireframe/document references, and navigation trigger/condition. Extended shared envelope, catalog/API response unions, and canonical formatting. Focused parser/dispatch/catalog tests passed 21/21; pnpm test:overview passed 50/50; pnpm typecheck and pnpm build passed. pnpm test:dsl retains only the known deleted resume fixture and sandbox listen EPERM failures. Review added missing proposal fields before closure.
