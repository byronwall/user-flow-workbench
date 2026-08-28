# Agent guidance

## Purpose

Build a schema-first diagramming tool for product and user flows. Preserve the distinction between graph data, layout hints, manual positions, and future view-specific state.

## Current product rules

- Show only node titles on the canvas.
- Show full node details in the inspector.
- Keep drag, pan, and trackpad zoom dependable.
- Use rectilinear routes that avoid nodes.
- Keep diagrams compact and readable.
- Treat handoffs and deliverables as distinct semantic types.
- Do not restore a variant lane.
- Model future variants as views of shared starting data.
- Keep the JSON model easy for agents to inspect and change.

## Change process

- Read `docs/product-context.md` before a structural change.
- Preserve the current prototype before a framework migration.
- Update the context document when a product decision changes.
- Test direct pointer interaction after canvas event changes.
- Test automatic layout and manual movement after routing changes.
- Preserve a working fallback when ELK does not load.
- Use pnpm if the project adds JavaScript packages or scripts.

## Git

- Preserve user changes.
- Make small commits on branches other than `main`.
- Use `Byron Wall <byron@byroni.us>` for author and committer identity.
