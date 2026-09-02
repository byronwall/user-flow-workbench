# Stage 1 quick proof

Open `index.html` through a local HTTP server. This isolated demo uses browser layout and six semantic fixture objects.

It tests fixed workbench regions, independent selected states, ordinary page content, narrow overflow, stable IDs, progressive disclosure, and pure SVG export.

The progressive-disclosure screen has a real native popover. It also shows rest, trigger-hover, and open states side by side from the same fixture.

This folder preserves the isolated proof. The application now parses `.diagram` wireframes and captures live flow and overview scenes. Use the files in `src/data/wireframes/` for the current result.

No package, build step, or application source is required.

## Verified on 2026-08-31

- All six screens rendered at their declared sizes in Chromium.
- The narrow stress case kept its bar at 44 pixels and exposed 611 pixels of content in a 320-pixel region.
- The built-in checks passed fixed toolbar, stable region, stable identity, and vector SVG assertions.
- The native popover passed click, forced rest/hover/open state, and screen-navigation checks.
- `goto` passed capability → linked flow → capability navigation.
- No browser console errors appeared.

The SVG and manifest buttons are implemented with browser Blob downloads. The browser test environment did not expose a download event, so saved-file inspection remains unverified.
