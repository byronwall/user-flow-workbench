# Final browser fixture guide

Fixture root: `/private/tmp/diagram-m4-final.qBJcLb`

Use the package viewer with this root. All paths below are relative to the root.

| Path | Visible title | Coverage | Labels / views |
| --- | --- | --- | --- |
| `overview-missing-link-chain.diagram` | A → no link → B | Linked capability A, unlinked middle capability, and linked B with a different target view | A · Linked capability → `per-job-resume`; No linked capability; B · Different target view → `guided-evidence-interview` |
| `overview-ungrouped-cases.diagram` | Ungrouped cases | Authored group ID `ungrouped` and ungrouped capability | Ungrouped group; Ungrouped capability |
| `overview-missing-flow-variant.diagram` | Missing flow view | Existing flow target with a missing requested view | Repairable flow variant link → `missing-flow-view` |
| `repairable-flow.diagram` | Repairable flow target | Repair target for the missing flow view warning | `available-flow-view` |
| `overview-selection-variants.diagram` | Selection variants | Selected capability survives or disappears across overview views | `selected-survives`; `selected-disappears`; Selected capability survives; Selected capability disappears |
| `fixtures/wrong-type-link.diagram` | Wrong links | Explicit flow link that resolves to an overview document | Wrong flow → `fixtures/wrong-type-target.diagram` |

Existing base sources remain `flow.diagram` and `overview.diagram`. The overview link in that temporary copy points to `flow.diagram`.

Validate the temporary root with:

```sh
pnpm flow check /private/tmp/diagram-m4-final.qBJcLb
pnpm flow format --check /private/tmp/diagram-m4-final.qBJcLb
```
