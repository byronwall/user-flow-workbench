---
id: ufw-1pdf
status: closed
deps: []
links: []
created: 2026-09-04T02:59:04Z
type: feature
priority: 1
assignee: Byron Wall
external-ref: docs/intent/wireframe-content-fidelity/implementation-plan.md#milestone-1-static-resume-content-reads-correctly
parent: ufw-tdbj
tags: [wireframe, content-fidelity, static-content]
---
# Render multiline static content correctly

## Initiative Intent

Content-heavy wireframes must represent resume paragraphs and bullet lines without a rich-text system.

## Outcome

Quoted wireframe copy preserves explicit newline escapes. Cards without navigation render as static content. Linked cards remain controls.

## User and Operator Context

Agents author the source. Byron reviews the visual result and interaction highlights. Static resume sections must look and behave like document content.

## Current System and Evidence

- src/lib/wireframe-dsl.ts uses a line-based tokenizer that removes the slash from escaped n.
- src/types/wireframe.ts already has text, card, list, notice, and textarea elements.
- src/components/WireframeWorkbench.tsx renders every card as a button.
- src/styles.css preserves whitespace only for textarea content.
- The working tree has user-owned changes in the renderer, CSS, tests, and documentation.

## Requirements

- Decode explicit newline escapes in quoted wireframe copy.
- Preserve those line breaks when static text and detail copy render.
- Keep ordinary automatic wrapping.
- Render cards without goto as non-interactive elements.
- Keep linked cards keyboard and pointer accessible.
- Add the smallest parser and renderer checks that fail on regression.

## Settled Decisions

- Extend current elements. Do not add a multiline or resume element.
- Keep textarea for form input.
- Existing wireframe sources remain valid.

## Constraints and Non-Goals

- No Markdown, rich text, inline formatting, arbitrary styles, or dependencies.
- Do not rewrite unrelated dirty changes.
- Use pnpm for project scripts.
- Do not commit on main.

## Scope

Own multiline escape handling, static copy rendering, card DOM semantics, focused tests, and directly related authoring documentation.

## Known Implementation Context

Relevant files include src/lib/wireframe-dsl.ts, src/types/wireframe.ts only if needed, src/components/WireframeWorkbench.tsx, src/styles.css, src/lib/wireframe-dsl.test.ts, docs/product-context.md, and skills/author-flow-diagrams/references/wireframe-authoring.md.

## Allowed Implementation Discretion

Choose the smallest explicit escape decoder and static-card rendering structure. Preserve existing quote escaping.

## Edge Cases and Failure Behavior

- Existing backslash and quote escapes remain safe.
- Unknown escapes must not silently corrupt content.
- Static cards are absent from tab order.
- Linked cards keep navigation and interaction highlighting.

## Proof and Acceptance

- A parser test proves that explicit newline escapes become newline characters.
- A renderer or browser check proves that line breaks remain visible.
- A static card is not a button or disabled control.
- A linked card still navigates.
- Focused wireframe tests, pnpm test:dsl, pnpm typecheck, and pnpm build pass.

## Rollout and Recovery

No source migration is required. Revert the narrow parser and renderer changes if compatibility fails.

## Below the Cut Line

Markdown, rich text, inline emphasis, generic styling, and resume-specific elements.

## Provenance

- Initiative claims: multiline-copy, static-semantics, finite-language.
- Plan milestone: static-content.
- Repository baseline: cd06e7f9b4deabf30de500de0f61e807188ac06a.
- docs/intent/wireframe-content-fidelity/implementation-plan.md

## Open Questions

None.


## Notes

**2026-09-04T03:07:53Z**

Implementation complete. Focused wireframe tests 8/8, overview tests 42/42, typecheck, and build pass. Full test:dsl reaches 51/53; remaining failures are the known sandbox EPERM and user-deleted resume fixture. Browser verification remains before closure.

**2026-09-04T03:42:43Z**

Accepted. Independent browser verification showed two authored Summary lines, a static DIV absent from keyboard focus, and a linked card that remained an enabled button and navigated to the details screen. Final focused tests 10/10, overview tests 46/46, typecheck, build, flow check, and diff check pass.
