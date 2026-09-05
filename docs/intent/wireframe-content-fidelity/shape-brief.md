---
title: "Wireframe content fidelity — shape brief"
slug: "wireframe-content-fidelity"
phase: shape
status: current
last_updated: "2026-09-03"
---

# Wireframe content fidelity — shape brief

## Recommendation

Extend the existing wireframe parser and renderer at three narrow seams. Decode explicit newline escapes in quoted copy. Render cards without `goto` as static containers. Add an optional workbench footer that spans both columns. Render the existing `mark` data through one review toggle instead of adding a second annotation model. Add a sibling overview wireframe inventory by reusing the existing flow inventory rules and catalog.

Do not add rich text or universal tones. Existing text roles, notice kinds, and control states already cover normal wireframe semantics.

## Problem and appetite

- **Problem:** Content-heavy screens lose document structure and proposal intent.
- **Outcome:** Resume-style screens remain readable and reviewable.
- **Appetite:** One small DSL and renderer extension with focused tests.
- **Not in this shape:** Production editing, Markdown, arbitrary styling, or new disclosure behavior.

## Core shape

```text
quoted copy with explicit newlines
    → existing text and detail fields
    → browser layout preserves authored lines

screen marks
    → existing target IDs and frame slots
    → optional annotated review mode
```

The existing wireframe source remains authoritative. The browser renderer owns layout and review state.

## Current fit

- **Reuse:** Current parser, element union, screen marks, screen toolbar, and Grid layout.
- **Add:** Escape decoding, static card rendering, one footer slot, one mark overlay mode, and one wireframe inventory projection.
- **Avoid:** A rich-text parser, generic styling vocabulary, or a second annotation store.

## How to make this go better

- **Prove copy first.** Add one parser test that fails on lost newlines.
- **Reuse mark data.** Do not create new change records.
- **Keep the footer optional.** Existing frames must render without source changes.
- **Protect semantic HTML.** Static cards must not enter keyboard or pointer order.
- **Use one representative fixture.** A resume review screen should prove the combined result.
- **Reuse inventory rules.** Same-folder discovery remains inventory, while explicit links retain capability context.

## First proof

- **Question:** Can existing primitives represent a readable resume without rich text?
- **Proof:** Parse and render multiline copy inside a static card.
- **Observe:** Line breaks remain visible and the card is not a button.
- **Pass / fail:** The focused parser test and browser inspection agree.
- **Deliberately excludes:** Markdown, inline formatting, and production editing.

## Rabbit holes and no-gos

- Universal semantic tones without a stable use contract.
- Accordion behavior when popovers and screen shots already cover disclosure.
- A general page-layout or annotation framework.

## Plan handoff

Implement the three seams in small, serial packets because they share renderer files. Verify the combined resume fixture in a clean browser.
