# Follow-up browser verification report

Date: 2026-08-31

Browser: fresh Chrome tab. URL: `http://127.0.0.1:4195`. Fixture root: `/private/tmp/diagram-m4-final.qBJcLb`.

## Results

1. **PASS — overview Open flow, return, Back, and reload.** The repaired client kept URL and rendered content aligned. Opening from `overview.diagram` with `variant=evidence-interview` reached the flow with `overview=overview.diagram`, `capability=tailor-resume-to-role`, and `view=evidence-interview`. Return, Back, and direct reload restored the overview, selected Evidence interview, and retained the capability.

2. **PASS — flow selection retention.** Selecting `source-resume` in `guided-evidence-interview`, then switching to `per-job-resume`, kept `Current resume` selected in the inspector.

3. **PASS — unknown flow view recovery.** `variant=removed-flow-view` was removed from the URL, Base was selected, and a clear fallback notice appeared. Selecting Base removed the notice.

4. **PASS — semantic edit, reset, and pointer distinction.** A DSL title edit survived overview reopen with `Restored browser-local copy.` Reset removed the edit and showed `Source-backed flow.` on reopen. Pointer movement changed the manual position while keeping the source-backed notice and no semantic edit.

5. **PASS — A/no-link/B chain.** A showed a `per-job-resume` link and opened the One resume per posting view. The middle capability showed `No linked flow yet.` B showed a `guided-evidence-interview` link and opened Agent-guided evidence interview. Inspector switching remained clear.

6. **PASS — wrong-type link.** The corrected `fixtures/wrong-type-link.diagram` showed: `Flow reference resolves to an overview document, not a flow: "fixtures/wrong-type-target.diagram". Link a diagram whose declaration is type flow.`

7. **PASS — repairable missing flow view.** The initial link warned that `missing-flow-view` did not exist. After temporarily renaming the target variant in `repairable-flow.diagram`, a hard page reload exposed the repaired link and opened the requested flow view. The target file was restored byte-for-byte.

8. **PASS — ungrouped rendering.** The fixture showed the authored empty `Ungrouped group` section and one `Ungrouped capability` section. The literal authored group ID `ungrouped` did not cause duplicate label confusion.

9. **PASS — overview selection retention by ID.** A role-specific check selected the board capability button, then switched the separate `Selected capability survives` tab. The same capability ID remained selected and the inspector showed `Selected capability survives · updated`. Switching to `Selected capability disappears` correctly cleared the selection because the ID was removed. The earlier failure was a false negative caused by checking generic page text that appears in the overview prompt.

10. **PASS — bounded adoption/removal.** A temporary copy of `overview-selection-variants.diagram` made the selected-survives content Base and removed all variants. The former `variant=selected-survives` URL canonicalized to Base and showed a fallback notice. The fixture was restored byte-for-byte.

## Evidence

- [A/no-link/B B inspector](05-link-chain-b.png)
- [wrong-type alert](11-wrong-type-corrected.png)
- [missing flow-view warning](07-missing-flow-view.png)
- [repaired missing flow-view link](13-missing-view-repaired.png)
- [ungrouped sections](12-ungrouped-corrected.png)
- [selection retention failure](09-selection-survives.png)
- [adoption former-view fallback](10-adoption-former-view-fallback.png)

## Limits and source state

- The first missing-view retry required a hard page reload after the target file rename. After reload, the repair worked.
- A console error was recorded while loading the intentionally removed former variant: `OverviewMaterializationError: Unknown overview variant "selected-survives".` The visible fallback notice and URL recovery were correct; the console error is reported for engineering review.
- Source and temporary fixture bytes were restored. No app source, package, build output, commit, or persistent server was changed by this review.
- Export behavior was not repeated. The earlier browser-provider limit remains documented in `final-browser-report.md`.
