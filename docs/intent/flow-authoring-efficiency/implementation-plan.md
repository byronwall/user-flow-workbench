# Flow authoring improvement plans

Status: implementation and verification complete. Reviewed 2026-08-30.

## Plan at a glance

Implementation is complete across the owner plans. Build CLI rendering first and include dependable startup in that path. The soccer documentation gate, authoring reference, bounded authoring exercise, and repaired CLI have independent proof. The final delta recheck and clean batch rerun passed. See the [verification record](verification-record.md) for current evidence and limits.

Owners below are responsibility roles, not assigned people or newly created tasks. Each linked plan contains its own scope, proof, and deferrals.

| Domain / owner | Plan | Dependency |
| --- | --- | --- |
| Flow Workbench maintainer | [CLI rendering and runtime](flow-cli.md) | First product priority |
| Authoring skill maintainer | [Skill and reference](authoring-skill.md) | Reference work can start now; render instructions follow CLI delivery |
| Soccer application maintainer | [Documentation quality gate](soccer-repository.md) | Can start independently |
| Agent workflow maintainer / evaluator | [Efficient authoring and evaluation](agent-workflow.md) | Practices can start now; full evaluation follows rendering |

## Implementation strategy

Keep all runtime changes in User Flow Workbench. Keep application-specific verification rules in soccer-schedule. The skill explains diagram authoring; the workflow plan explains evidence collection and evaluation.

Preserve existing changes in `src/cli/flow.ts` and `src/cli/flow.test.ts`. They fix global symlink startup and are outside this planning change. Recheck current state before implementation.

Use a real local browser to prove image fidelity. Place browser launch and capture behind a narrow runtime boundary. Use deterministic failures for timeout and cleanup tests. Keep `flow view`, `check`, and `format` working throughout. The installed render path is independently verified; keep the viewer as an interactive fallback. The compact render fits the graph and omits the legend below 480 pixels. Compact text can be small, so 1200 × 800 is the standard recommendation. Dense existing edge labels can still overlap cards. No automated readability or comparative token-savings claim is made.

## Milestone 1: An agent can inspect a rendered diagram

Complete the single-file and runtime proofs in the CLI plan. Resolve browser distribution through its bounded investigation. Do not delay the first image for contact sheets or broad skill restructuring.

### Desired end state

The installed CLI produces a readable PNG from another directory. Startup, layout failure, and cleanup have explicit results. Standard soccer captures pass visual review. Compact renders fit the graph and omit the legend below 480 pixels. Compact text can be small, so 1200 × 800 is recommended. Existing dense edge labels can still overlap cards. Existing commands still work.

## Milestone 2: A diagram set uses the shorter verified workflow

Complete CLI batch output, adopt the skill instructions, and enable the soccer documentation gate. Run the evaluation described in the workflow plan. Contact-sheet delivery is verified for the soccer set.

### Desired end state

An agent creates and checks a diagram set without manual screenshot setup or unnecessary application verification. The report distinguishes structural checks, source review, and visual inspection. Measured results show whether the workflow improved.

## Below the cut line

No new DSL, agent platform, automatic application-to-diagram generator, or mandatory cloud dependency. Do not publish packages or update other repositories merely because these plans exist. Those actions belong to later implementation requests.
