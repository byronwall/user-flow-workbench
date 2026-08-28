# Prototype iteration history

## Initial prototype

The first version established a schema-driven graph, draggable cards, pan and zoom, automatic layout, JSON editing, an inspector, local persistence, export, and a small agent API.

It used a resume-tailoring example to show actors, fundamental needs, process steps, handoffs, deliverables, UX considerations, an outcome, and alternate paths.

## Readability and interaction revision

The canvas changed to title-only nodes. Detail moved to the inspector. Icons gained type-specific meaning. Node dragging was repaired. Trackpad zoom became less sensitive.

The alternate-path lane was removed. The desired model changed from variant nodes to multiple views of the same starting diagram.

Edge routing changed to obstacle-aware Manhattan paths. The router added bend penalties and incentives for shared route trunks.

## Layout and routing revision

Nodes became narrower and more tightly packed. Semantic columns moved closer together. Lane boundaries started following node positions.

Automatic layout added ELK Layered. It uses partitions for semantic columns, fixed-side ports, model-order preservation, and orthogonal routes. Manual movement clears ELK routes and returns control to the local router.

The layout keeps a readable minimum zoom. The Fit command remains available for a full-graph view. The app keeps a local layout and routing fallback when the CDN library is unavailable.

## Current transition point

The prototype is useful enough to become its own project. The next work should improve the handoff and deliverable column, then design variants as related diagram views.
