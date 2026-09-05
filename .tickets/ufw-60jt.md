---
id: ufw-60jt
status: closed
deps: [ufw-gph8]
links: []
created: 2026-09-04T04:20:25Z
type: feature
priority: 1
assignee: Byron Wall
external-ref: docs/intent/application-map/implementation-plan.md#milestone-3
parent: ufw-j4cd
tags: [application-map, references, navigation]
---
# Make Application Map links and project home dependable

Resolve the Application Map through the existing source-backed workspace. A valid application map is the preferred project home. A valid overview remains the fallback, then the existing inventory. Cross-file defects stay visible as non-blocking warnings so the authored page graph remains usable.

## Design

Validate explicit overview capability, flow node, wireframe screen, and planning-document targets through existing containment and symlink protections. Missing files, wrong types, missing IDs, removed screens, and missing document headings warn. Preserve application path, page ID, and optional state on artifact links and return context. Do not infer semantics from folders, names, or common membership.

## Acceptance Criteria

Target warnings use stable codes and do not block a structurally valid map. One valid application wins project-home selection; invalid application falls back to overview; absent application preserves current behavior. Direct links open the correct capability, flow, node context, wireframe screen, or document and can return to the authored page. Pure resolution, precedence, and fallback tests pass.


## Notes

**2026-09-04T05:04:57Z**

Added explicit application reference resolution and stable non-blocking warnings for missing, invalid, wrong-type, missing-ID, and missing document-heading targets. Added application-first home selection with overview and inventory fallback, typed application-origin URLs, flow node hash selection, return context, and page/state URL parsing. Planning documents stay inspectable/copyable because no safe document-serving route exists and the initiative forbids adding one. pnpm test:overview passed 54/54; typecheck and build passed; test:dsl retained only known deleted-fixture and sandbox listen EPERM failures. Independent browser proof passed root home selection, warning display, flow and wireframe links, page-context return, pointer/keyboard use, and clean console. Overview-origin browser proof was unavailable because the current user-owned tree deletes the overview fixture; pure fallback tests passed.
