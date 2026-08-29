export function FlowCanvas() {
  return (
    <main class="canvas-wrap">
      <div class="viewport" id="viewport" role="tabpanel" tabindex="0" aria-label="Flow diagram canvas">
        <div class="world" id="world">
          <svg class="edges" id="edgeSvg" viewBox="0 0 2240 1300" preserveAspectRatio="none" aria-hidden="true">
            <defs>
              <marker id="arrow" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto" markerUnits="strokeWidth">
                <path d="M0,0 L8,4 L0,8 Z" fill="#98a2b3" />
              </marker>
              <marker id="arrow-selected" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto" markerUnits="strokeWidth">
                <path d="M0,0 L8,4 L0,8 Z" fill="#315efb" />
              </marker>
            </defs>
            <g id="edgeLayer" />
          </svg>
          <div id="nodeLayer" />
        </div>
      </div>
      <div class="canvas-status" aria-live="polite">
        <span id="zoomLabel">100%</span>
        <span>Wheel = zoom</span>
        <span>Drag background = pan</span>
        <span>Drag node = move</span>
        <span id="layoutEngineLabel">Separated local routes</span>
      </div>
      <div class="canvas-legend" aria-label="Diagram legend">
        <span class="legend-item"><i data-type="actor" />User</span>
        <span class="legend-item"><i data-type="input" />Input</span>
        <span class="legend-item"><i data-type="process" />Process</span>
        <span class="legend-item"><i data-type="deliverable" />Artifact</span>
        <span class="legend-item"><i data-type="handoff" />Handoff</span>
        <span class="legend-item"><i data-type="outcome" />Outcome</span>
        <span class="variant-legend-group" id="variantLegendItems" hidden>
          <span class="legend-item variant-legend-item"><i data-variant-effect="added" />New</span>
          <span class="legend-item variant-legend-item"><i data-variant-effect="changed" />Changed</span>
          <span class="legend-item variant-legend-item"><i data-variant-effect="connected" />Path</span>
        </span>
      </div>
    </main>
  );
}
