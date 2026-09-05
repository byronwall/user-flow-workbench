---
title: "Wireframe content fidelity"
slug: "wireframe-content-fidelity"
phase: intent
status: current
last_updated: "2026-09-03"
---

# Wireframe content fidelity

## My read

Wireframes must represent content-heavy product screens without becoming a page builder. The immediate proof is the evidence-first resume website. Its screens need readable resume paragraphs, static document sections, a bottom action area, and visible proposal annotations.

The project overview must also list valid wireframes beside its current flow inventory. Folder discovery remains inventory only. It must not create capability relationships.

The current wireframe language already covers forms, lists, cards, notices, navigation, popovers, and saved interaction shots. It wraps long text automatically. It does not preserve authored line breaks in static copy. It also renders every card as a button, even when the card has no action. Workbench frames cannot place one footer across the main and inspector columns. Screen `mark` declarations are parsed but remain invisible.

The useful change is a small extension of current elements and frames. It must keep the DSL finite, source-backed, and easy for agents to edit.

## What matters most

- Represent resume paragraphs and bullet lines as static content.
- Keep static content semantically separate from controls.
- Show bottom actions across the complete workbench.
- Make authored proposal marks visible during review.
- Make project wireframes discoverable from an overview.

## Intended experience

An agent can write one concise wireframe source for a content-heavy screen. Byron can inspect the normal proposal, then reveal the authored changes and their reasons. Static resume sections do not look disabled or interactive.

## Boundaries

### Must be true

- Existing wireframe sources remain valid.
- Escaped newlines survive parsing and render as line breaks.
- Linked cards remain interactive.
- Existing screen navigation, popovers, references, and embedded scenes keep working.
- The overview lists same-folder and explicitly linked wireframes without inventing links.

### Must be avoided

- Do not add rich text, Markdown, arbitrary CSS, coordinates, or a generic style system.
- Do not add another disclosure model.
- Do not add a resume-specific element.

## Current reality

- The tokenizer is line-based and currently removes the slash from `\n`.
- `textarea` already supports editable multiline content.
- Workbench frames contain header, top, main, and aside slots.
- `mark` declarations already carry a target and reason.
- The catalog and overview capability model already contain the data needed for a wireframe inventory.
- The working tree contains user-owned changes in the renderer, CSS, and authoring documentation.

## What seems settled

- Extend current elements before adding new primitives.
- Reuse existing marks and disclosure behavior.
- Keep all current wireframe sources valid.

## Next step after confirmation

Create the local tickets and execute the three proof milestones.
