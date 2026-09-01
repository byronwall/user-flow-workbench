# M2 source-backed browser verification

Date: 2026-08-30
URL: `http://127.0.0.1:4191`
Fixture root: `/private/tmp/diagram-m2.N7IOVb/root`

The pass used the rebuilt packaged viewer and real browser interaction. The app worktree was preserved. The original fixture hashes were saved before testing and restored after testing:

- `flow.diagram`: `26ed962d67e8bb32b181db99adda12a14d662765a1ec57c58fd1678adcdd51d2`
- `nested/overview.diagram`: `c37914f5950f4c667e5595d010cbc45f6d738c5b621abe664f991a371dcfb62c`

## Checks completed

1. Opened `/` and confirmed the picker listed both `Flow` and `Overview` entries. The picker showed `flow.diagram` and `nested/overview.diagram`, plus the expected pagination fixtures and invalid entries.
2. Opened `nested/overview.diagram`. The grouped overview was readable at 1280×800 and 1440×900. Evidence: `overview-1280x800.png` and `overview-1440x900.png`.
3. Selected `Understand job requirements`. The inspector showed its group, detail, related-flow empty state, and `Source current`. The selected button exposed `aria-pressed="true"`.
4. Polled the unchanged page three times. Focus stayed on the selected capability button on every poll.
5. Edited only the temporary overview fixture. Changed the capability title to `Clarify hiring needs` and appended source text to its detail. Reloaded the source. The board and inspector refreshed, and the selected capability remained selected by its stable source ID.
6. Polled focus three more times after the source edit. Focus stayed on `Clarify hiring needs` on every poll.
7. Removed the selected capability from the fixture and reloaded. The capability disappeared and the inspector cleared to `Select a capability`.
8. Added an invalid overview command and reloaded. The last valid board remained visible. The alert said `Source changed with errors`, included the exact located error `Line 7:1 — [OVERVIEW101]`, and offered `Retry`.
9. Repaired the fixture and reloaded. The stale warning cleared and `Source current` returned.
10. Deleted `nested/overview.diagram`. Reloading showed `The selected diagram file does not exist.` with `Retry` and `Choose another diagram`. The picker link returned to a usable picker. Restored the original file and reloaded; the complete overview returned.
11. Changed the declaration from `type overview` to `type flow`. Reloading did not crash or misrender. It showed located flow-parser errors and retained the last valid overview board. Restored the original declaration.
12. Opened `/?diagram=missing.diagram`. The page showed a usable missing-file state with `Retry` and `Choose another diagram`; the picker recovery link worked.
13. Created temporary valid `empty.diagram` and `ungrouped.diagram` fixtures. The empty overview showed `No capabilities yet` and an instruction to add a capability. The flat overview rendered an `Ungrouped capabilities` section with both capability buttons. Evidence: `empty-overview-1440x900.png` and `ungrouped-overview-1440x900.png`. Both temporary files were removed afterward.
14. Opened `flow.diagram`. Existing node selection worked. The inspector exposed the node ID, type, title, detail, tags, layout, and related semantic links.
15. Switched to `One resume per posting`. The changed path, changed node, and new nodes rendered with `PATH`, `CHANGED`, and `NEW` markers. `Auto layout` and `Fit` ran without a crash.
16. Used pointer drag on the canvas background. Node coordinates moved by the drag delta, confirming pan. Scrolled over the canvas; the node size and position changed, confirming zoom. Dragged a node itself; its coordinates changed independently, confirming manual movement.

## Source panel and export

The source panel rendered the current canonical overview text, including the edited title and detail during the source-refresh check. It identified itself as `Read only` and said it was the current canonical source. No source hash was displayed in the inspected UI.

In a fresh Chrome extension session, the restored overview source panel matched the fixture exactly: both were 1,414 bytes, and the SHA-256 was `c37914f5950f4c667e5595d010cbc45f6d738c5b621abe664f991a371dcfb62c`. The panel showed the accepted source text and no hash field.

The flow source panel matched the fixture after whitespace normalization. It contained one extra blank line near the header (`12449` panel characters versus `12448` fixture characters). The source content was otherwise equivalent.

Clicking `Export source` in Chrome and waiting six seconds with the documented browser download event observer produced no download event or artifact path. Clicking `Export JSON` produced the same result. The clipboard remained empty. The Chrome Downloads page was blocked by the browser provider URL policy, so no Downloads UI cross-check was possible. These are provider-level observations, not proof that the app export implementation is broken.

## Limitations and follow-up

- Browser policy prohibits inspecting cookies or local storage. No semantic local-storage copy was visible in the tested UI, but storage-level verification remains unconfirmed.
- The initial in-app browser session reported `ERR_CONNECTION_REFUSED`, but this was a sandbox/provider access issue: the parent confirmed PID 62247 listening on `127.0.0.1:4191`, and an escalated curl returned HTTP 200. A fresh Chrome extension session reached the viewer and completed the restored source comparison.
- No app source, build, package, or commit changes were made.

## Evidence files

- `overview-1280x800.png`
- `overview-1440x900.png`
- `stale-source-1280x800.png`
- `empty-overview-1440x900.png`
- `ungrouped-overview-1440x900.png`
- `flow-initial-1440x900.png`
