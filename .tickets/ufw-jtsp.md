---
id: ufw-jtsp
status: closed
deps: [ufw-lozf, ufw-w2gh, ufw-8680, ufw-65is]
links: []
created: 2026-09-03T03:25:35Z
type: epic
priority: 1
assignee: Byron Wall
external-ref: docs/intent/unified-product-workspace/implementation-plan.md
tags: [unified-workspace]
---
# Unify product workspace

## Initiative Intent

Turn overview, wireframe, and flow documents into connected views inside one application. Keep each document type semantically distinct. Use capabilities as the normal context between product scope, proposed screens, and operational behavior.

Overviews are expected to be common. They should act as project summaries and organizing documents. A wireframe will usually relate to a capability or flow. It must be possible to create the wireframe before its related flow exists.

## Outcome

Deliver one capability-centered project workspace. A person can start from an overview, select a capability, and open related screens or flows without losing context.

## Settled Decisions

- Keep separate overview, wireframe, and flow models under the shared `.diagram` envelope.
- Keep agent-authored source files authoritative.
- Use explicit safe references for semantic navigation.
- Keep projects without overviews and artifacts without links usable.
- Do not infer semantic relationships from folder membership.
- Preserve direct document URLs and isolated CLI render output.

## Child Outcomes

- `ufw-lozf` proves one shell with the existing overview-to-flow relationship.
- `ufw-w2gh` adds validated capability-to-wireframe screen references.
- `ufw-8680` makes the active overview organize project navigation.
- `ufw-65is` removes duplicate chrome and completes regression verification.

## Dependencies and Coordination

The first ticket is the only ready implementation root. Each later ticket depends on the prior user-visible result. The epic tracks completion and depends on every child ticket.

Byron reviewed the implementation plan and authorized ticket creation. This request does not authorize implementation.

The repository is on `main` at planning revision `11553125b622e502a7133f07c966484df850d46b`. Preserve unrelated edits under `skills/author-flow-diagrams`.

## Proof and Acceptance

- The resume example supports an overview-to-screen-to-flow journey inside one persistent workspace.
- Valid capability context survives refresh and browser history.
- Direct URLs, standalone artifacts, and the inventory fallback remain usable.
- Flow drag, pan, zoom, layout, variants, and local working copies remain dependable.
- Overview refresh and wireframe screen behavior retain their current source ownership.
- Unit, type, build, CLI capture, accessibility, and clean browser checks pass.
- Every child ticket is closed.

## Below the Cut Line

- Universal product graph or generic relationship language.
- Project-wide backlinks for direct opens.
- Flow-node-to-screen or control-level links.
- In-app relationship or source editing.
- Automatic relationship inference.
- Project manifest, database, or nested project grouping.
- Generic renderer, toolbar, or extension frameworks.

## Provenance

- `docs/intent/unified-product-workspace/intent-brief.md`
- `docs/intent/unified-product-workspace/shape-brief.md`
- `docs/intent/unified-product-workspace/implementation-plan.md`
- `docs/intent/unified-product-workspace/initiative-map.json`

## Notes

**2026-09-03T05:46:36Z**

All four child tickets are closed. Acceptance passed across unit, CLI, type, build, catalog, render, clean-browser, keyboard, narrow-layout, pointer-interaction, source-state, and documentation checks. Canonical initiative state now marks implementation and tickets complete; structural validation has 0 warnings and audit remains 9.6/10.
