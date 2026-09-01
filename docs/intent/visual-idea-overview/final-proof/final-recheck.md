# Final focused browser recheck

Date: 2026-08-31

Browser: fresh Chrome tab at `http://127.0.0.1:4195`.

## Results

1. **PASS — overview selection by ID.** Role-specific locators distinguished the board capability button from the same-named view tab. After selecting the board button, the inspector showed the capability. Switching to `selected-survives` kept the same capability selected and showed the updated title `Selected capability survives · updated`. Switching to `selected-disappears` cleared the inspector because that ID was removed. The prior report's failure was a false negative from matching generic prompt text.

2. **PASS — missing flow-view Retry without reload.** The initial inspector showed the missing `missing-flow-view` warning and Retry. After temporarily renaming the target variant in `repairable-flow.diagram`, clicking Retry on the existing page removed the alert and exposed a usable link to `variant=missing-flow-view`. No page reload was used after the rename. The target source was restored byte-for-byte.

3. **PASS — adoption fallback without materialization error.** With `selected-survives` active, a temporary edit materialized its content into Base and removed all variants. Reload source produced the Base fallback notice and canonical URL. The view tab list was empty, and fresh browser logs contained no `OverviewMaterializationError`. The source was restored byte-for-byte.

## Decisive evidence

- [Selection before switch](14-selection-before-switch.png)
- [Selection retained with updated title](15-selection-after-survives.png)
- [Selection cleared after ID removal](16-selection-after-disappears.png)
- [Retry repaired link without reload](17-missing-view-retry-repaired.png)
- [Adoption Base fallback with clean console](18-adoption-clean-fallback.png)

## Source state and limits

- `overview-selection-variants.diagram` and `repairable-flow.diagram` match their saved pre-test hashes.
- All temporary backup files were removed after restoration.
- No app source, build, package, commit, server, or unrelated fixture was changed.
- The adoption check used the UI's Reload source action and waited for the resulting fallback; it did not repeat unrelated browser regression checks.
