---
id: ufw-4oht
status: closed
deps: [ufw-60jt]
links: []
created: 2026-09-04T04:20:25Z
type: feature
priority: 1
assignee: Byron Wall
external-ref: docs/intent/application-map/implementation-plan.md#milestone-4
parent: ufw-j4cd
tags: [application-map, coverage, docs]
---
# Finish Application Map state, coverage, and authoring guidance

Complete the read-only Application Map experience for agents and reviewers. Page and authored state selection are addressable in the URL. Source refresh keeps the last valid board and exposes stale state. Coverage warnings show explicit gaps without scoring or inventing semantics.

## Design

Add validated page and state URL helpers with refresh and Back or Forward behavior. Reuse visible or focused source refresh. Warn for page without wireframe, flow node without owning page, overview capability without owning page, unused wireframe screen, and broken planning links. Update README, product context, authoring skill, compact reference, workflow, maintained DSL spec, and its byte-identical distributed copy. Sync the installed global skill only after repository validation. Do not add application variants, editing, analytics, or new exports.

## Acceptance Criteria

Valid page and state URL selection survives refresh and history; stale values fall back visibly. Refresh failure retains the last valid map. Coverage uses only explicit authored records. Maintained and distributed specs match byte-for-byte. Skill validation passes. Full focused tests, typecheck, build, CLI checks, and clean desktop plus narrow browser verification pass, with pre-existing failures recorded separately.


## Notes

**2026-09-04T05:33:44Z**

Completed page/state URL history, last-valid reload and Retry, explicit coverage warnings, documentation, installed skill sync, and global flow command sync. Evidence: test:overview 55/55; focused application/catalog tests 62/62; typecheck, build, check:flows, representative check/format, spec parity, skill parity/validation, git diff check, and clean desktop/mobile browser journeys pass. Full test:dsl retains two unrelated existing failures: sandbox loopback listen EPERM and the user-deleted resume-alignment.diagram fixture.
