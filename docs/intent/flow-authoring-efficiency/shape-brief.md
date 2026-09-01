# Recommended shape

## Recommendation

Add a small rendering path to the existing Flow CLI. Pair it with focused changes to authoring instructions and repository checks.

## Problem and appetite

The current system produces useful diagrams. Visual inspection requires separate browser work, and documentation changes inherit broad application verification. Spend effort on these specific boundaries. Do not replace the DSL or renderer.

## Core shape

The authoring loop becomes: read selected sources, author, check, render, inspect, revise. The CLI produces images and machine-readable results. The agent remains responsible for semantic and visual judgment.

## Current fit

`src/cli/flow.ts` already provides validation, formatting, and viewer startup. `src/lib/flow-workbench.ts` owns layout and exposes `window.flow`. Nodes use HTML while edges use SVG. A browser capture of the existing renderer is the smallest credible image proof.

The installed authoring skill differs from the repository copy. Reconcile these copies before changing distribution. Existing symlink startup fixes are user-owned changes and must be preserved.

## How to make this go better

- Reuse the viewer renderer instead of building a separate SVG renderer.
- Separate server readiness from browser layout readiness.
- Prove one image before directory traversal and contact sheets.
- Keep documentation verification separate from application verification.
- Measure fresh input and elapsed time without weakening correctness checks.

## First proof

Render one branched `.diagram` file to PNG with the installed CLI from another directory. Use a fresh browser context. Confirm readable titles, complete graph bounds, visible branch labels, and source preservation. Repeat at the same viewport. Reject an implementation that needs manual browser clicks or screenshots incomplete layout.

## Rabbit holes and no-gos

Defer SVG/PDF export, automatic diagram generation, visual scoring, and arbitrary URL capture. Do not change package-manager security settings to make checks pass.

## Plan handoff

The [owner plans](implementation-plan.md) define the implementation boundaries. Rendering uses a real local browser for fidelity. Small fakes prove command failures and cleanup. No cloud service or deployed environment is needed.
