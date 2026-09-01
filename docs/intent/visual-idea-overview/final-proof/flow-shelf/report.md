# Flow shelf browser verification

Date: 2026-08-31
Browser: fresh Codex in-app browser tab
Viewers: `http://127.0.0.1:4196` fixture, `http://127.0.0.1:4191` earlier actual-port pass, and fresh `http://127.0.0.1:4197` actual project pass

## Result

The flow shelf behavior passes the fixture flow, responsive layout, and actual resume flow navigation checks. The fresh 4197 pass also confirms the project index label is consistent. The earlier `All diagrams` result came from stale browser asset cache on port 4191.

## Acceptance checks

1. **Hard refresh and browser errors — PASS.** Fixture overview and actual resume overview were hard refreshed. No crash, hydration mismatch, warning, or error appeared in the browser log.

2. **Fixture overview shelf — PASS.** `project/overview.diagram` preserved the `Shelf test` capability board and inspector. The shelf heading was `Flows in this project · 2` and contained exactly:

   - `Explicit linked flow`, labeled `Linked from: Linked capability`.
   - `Sibling project flow`, labeled `Project flow`.

   `Other flow` / `other/ignored.diagram` did not appear in the shelf.

3. **Explicit linked flow and return — PASS.** The explicit row opened `project/nested/linked.diagram` with `overview=project/overview.diagram&capability=linked`. The flow displayed `← Shelf test` and `Linked capability`; activating the return link restored the overview with `Linked capability` selected and its related flow visible.

4. **Sibling standalone flow — PASS.** The sibling row opened `project/sibling-unlinked.diagram` without overview query state and without a return status row. Its visible flow content loaded normally.

5. **Project index — PASS.** On fresh port 4197, the overview action is `Project index`, and the index page uses the `User Flow Workbench` kicker, `Project index` H1, and separate `Overviews`, `Flows`, and `Other diagram files` sections. The earlier 4191 observation of `All diagrams` was stale browser asset cache; the fresh 4197 bundle shows the expected label.

6. **Desktop and narrow layout — PASS.** At 1280×800 the shelf was visible below the capability board, compact, and did not distort the board or inspector. The page needed no scroll to discover it because the fixture board and shelf fit within the viewport. At 390×800 both rows remained readable, with no horizontal overflow (`bodyWidth: 390`).

7. **Actual resume overview — PASS.** On fresh port 4197, the requested URL visibly exposed `Flows in this project · 1` with exactly one row: `Tailor a resume to a job posting`, labeled `Linked from: Tailor a resume to a role`. Its link opened `src/data/flows/resume-alignment.diagram` with overview and capability context; the flow showed `← Resume app` and `Tailor a resume to a role`, and return restored the overview shelf and linked label. No other flow row was present.

## Cache recheck

The earlier 4191 tab showed `All diagrams` and no visible shelf. A fresh Chrome tab on port 4197 showed the served current UI: `Project index`, `Flows in this project · 1`, and the linked row. This confirms the earlier result was stale browser asset cache. No source or package inspection was performed during this recheck.

## Evidence

- [Fixture index](./01-index.png)
- [Fixture overview at 1280×800](./02-overview-desktop.png)
- [Explicit linked flow](./03-linked-flow.png)
- [Standalone sibling flow](./04-sibling-flow.png)
- [Fixture overview at 390×800](./05-overview-narrow.png)
- [Actual resume capability and linked flow](./06-actual-resume-capability.png)
- [Actual resume flow](./07-actual-resume-flow.png)
- [Actual project index](./08-actual-index.png)
- [Fresh actual resume shelf](./09-actual-resume-shelf-fresh.png)

## Limits

This was a read-only browser pass. I did not inspect source, modify the app, build, change servers, or restore fixtures. Pointer drag, pan, trackpad zoom, automatic layout, and node routing were outside this shelf-focused acceptance scope.
