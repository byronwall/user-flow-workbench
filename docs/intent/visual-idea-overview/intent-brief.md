---
title: "Visual idea overview"
slug: "visual-idea-overview"
phase: intent
status: current
last_updated: "2026-08-30"
---

# Visual idea overview

## My read

Byron wants to make sense of possible app ideas before building them. Agents can produce more detailed text than he can assess. That text can make an idea appear valuable before its purpose and scope are clear. A readable visual overview should help him see the whole idea, challenge its parts, and remove unnecessary work.

The overview is a working representation of the product under discussion. It starts with possible capabilities and becomes more definite through conversation. Byron talks with an agent, reviews the diagram, and requests changes. The agent maintains the source. Byron does not expect to edit the DSL himself.

Visual compression is a thinking discipline. It must reduce repetition and expose scope, rather than turn every paragraph into a box. A brief glance should reveal the purpose and main capabilities. A closer look should support decisions about what belongs. The result should lead to simple flows for a small initial product.

Documenting an existing app is a secondary use. Those documents should represent reality. Temporary alternatives can help resolve a real choice, but old possibilities should not remain in the active representation.

## What matters most

- Understand possible capabilities before committing to detailed behavior or implementation.
- Use a readable overview to remove, merge, and clarify ideas.
- Keep conversation with an agent as the main authoring interaction.
- Develop flows only when they help resolve behavior or prepare to build.
- Maintain one clear working direction after a decision.

The resume project exposed the problem. Features were being built before Byron had a clear picture of what he wanted. Other projects have similar collections of agent-written documents. The resume domain is an example, not a requirement for the tool.

## The experience Byron wants

Byron brings a rough idea or an existing collection of notes to an agent. The agent produces a compact visual account. Byron sees the major areas without reading a long document. He discusses what to remove, combine, rename, or question. The agent changes the source, and the viewer shows the revised state.

The work does not require a flow for each capability. A surviving capability can later link to one or several flows. Opening a relevant flow is the expected initial benefit. Automated analysis of changes across flows is not established as a need.

When two directions deserve comparison, each should be readable as a complete alternative. After discussion, the selected direction becomes current. Discarded ideas can leave the active source. The tool need not maintain a backlog for possible future use.

## Boundaries

### Must be true

- Capability ideas can exist before their flows.
- Short titles carry the overview; supporting detail stays out of the main visual.
- Visible groups must help explain scope without hiding large collections of features.
- The user can distinguish a description of reality from an intended state.
- An agent can revise the representation without manual DSL work from Byron.
- Existing flow documents and their viewer remain useful.
- All diagram sources use one extension, with an explicit document type inside the file.

### Must be avoided

- A required hierarchy of goals, proposals, features, requirements, and tasks.
- Backlog management, discarded-idea archives, or a proposal lifecycle.
- Tiny labels that make an oversized idea appear to fit.
- Long descriptions as a prerequisite for useful planning.
- Old alternatives mixed into the current direction.
- Automatic claims that a documented capability has been implemented.

## What seems settled

Exploration before building is the primary use. Existing-product documentation follows it. Changes to an existing product may use variants when there is a real decision to make. These uses do not have equal priority.

Planning happens close to implementation. Byron is more likely to regenerate an idea than maintain it in a long-lived backlog. The current working state matters more than the history of every possibility.

Byron confirmed the preceding interpretation and requested shape and implementation documents. He then required one file extension for all diagram types, with type metadata inside each file. The selected common extension is `.diagram`. This replaces the earlier separate-extension proposal. Layout details, card limits, and release dates remain unsettled.

Existing diagram files live only in this repository and the soccer schedule repository. Byron wants those files changed by hand. Do not build migration tooling or a legacy compatibility path.

## Possibilities, not decisions

A grouped board, separate flow and overview content types, optional purpose text, and temporary variant tabs are recommended mechanisms. Both content types use `.diagram` files. Their visual behavior must be tested against a real discussion. A fixed feature count, mandatory idea classification, and an automatic simplification engine are not requirements.

The first visual should test readable scope and useful subtraction. Fewer cards alone do not prove a better result. The representation must still preserve the meaning Byron intends to build.

## Next step after confirmation

Intent is sufficient for shaping. Read the [shape brief](shape-brief.md) for the bounded recommendation and first visual proof. Read the [implementation plan](implementation-plan.md) for the repository-specific sequence. Implementation has not started under this initiative.
