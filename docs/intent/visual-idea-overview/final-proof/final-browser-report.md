# Final browser verification report

Date: 2026-08-30

Browser: fresh Chrome session. URL: `http://127.0.0.1:4195`. Fixture root: `/private/tmp/diagram-m4-final.qBJcLb`.

## Verified

- The picker loaded all five prepared `.diagram` files.
- `overview.diagram` rendered Base, Focused scope, and Evidence interview. Each tab changed the URL and showed one complete capability scope. Direct refresh selected the requested overview variant.
- An unknown overview variant fell back to Base, canonicalized the URL, and showed: `The overview view "removed-view" is no longer available. Showing the base view.`
- The linked flow rendered after a direct refresh. Its variant tabs worked, including direct URL and refresh for `per-job-resume` and `guided-evidence-interview`.
- Native pointer selection selected `Current resume`; native drag changed its position from X=354/Y=164 to X=422/Y=211. Wheel zoom changed 81% to 97%, and background drag moved the board.
- Native keyboard focus and `ArrowRight` changed the flow tab from Base to One resume per posting and updated `variant=per-job-resume`.
- A standalone flow had no overview return row.
- The missing-flow fixture remained visible and selectable. Its inspector showed a clear alert and Retry control without blocking the overview.
- A browser-local DSL edit showed `Using browser-local working copy.` Reset file restored `Source-backed flow.` and the source-backed DSL. SHA-256 hashes for the temporary flow and overview sources matched their saved originals before and after this test.
- No warning or error browser logs were recorded for the final tab.

Screenshots: [picker](01-picker.png), [focused scope](02-focused-scope.png), [evidence interview](03-evidence-interview.png), [linked flow](04-linked-flow.png), [flow controls](05-flow-controls.png), [broken link](06-broken-link.png), [unknown flow view](07-unknown-flow-view.png), [stale linked route](08-stale-route-after-link.png).

## Defects

1. Linked-flow navigation updates the URL but can leave the overview rendered. Reproduction: open `overview.diagram`, select `Tailor a resume to a role`, click `Open flow`, and wait. The URL becomes `?diagram=flow.diagram&overview=overview.diagram&capability=tailor-resume-to-role&view=evidence-interview`, while the page still has the overview heading and capability list. A reload renders the flow. See [08-stale-route-after-link](08-stale-route-after-link.png).

2. The conditional return link has the same client transition defect. From a loaded flow, click `← Resume app`; the URL changes to the overview URL while the flow toolbar and flow content can remain visible until reload. Back showed the same mismatch.

3. Selection is cleared when switching to a variant even when the selected ID still exists. Select `Current resume` (`source-resume`) in Agent-guided evidence interview, then switch to One resume per posting. The target node remains in the variant, but the inspector returns to the node list. Selection retention works through the DSL Apply path when IDs remain.

4. An unknown flow variant (`?diagram=flow.diagram&variant=removed-flow-view`) selected Base but kept the unknown query and showed no fallback notice. Overview unknown variants have the expected notice and URL recovery.

5. After Reset file reported `Source-backed flow.` and restored source text, reopening through the overview later reported `Restored browser-local copy.` even though the DSL title was source-backed. The notice is misleading and may indicate stale local-copy metadata.

## Fixture and tool limits

- The prepared `wrong-type-target.diagram` source exposed no flow link in its read-only DSL, so it could not exercise wrong-type-target diagnostics; its capability showed `No linked flow yet.`
- The prepared overview source contained one linked capability (`Tailor a resume to a role`), plus unlinked capabilities. It had no second linked capability with a different target variant, so the A(link) → no-link → B(different link/target variant) path was unavailable.
- The picker had no authored `ungrouped` group or ungrouped capability fixture, so duplicate-label/section behavior for that case was not testable.
- Source and JSON export clicks completed without an observable Chrome download event. This is a browser-tool observation limit; no app download failure was established.
