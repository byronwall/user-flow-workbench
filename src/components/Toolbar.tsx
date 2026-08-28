export function Toolbar() {
  return (
    <header class="topbar">
      <div class="brand">
        <h1>User Flow Workbench</h1>
        <p>Schema-first flow mapping for needs, process, handoffs, deliverables, and UX.</p>
      </div>
      <div class="toolbar" aria-label="Canvas actions">
        <button class="btn primary" id="autoLayoutBtn" type="button">Auto layout</button>
        <button class="btn" id="fitBtn" type="button">Fit</button>
        <button class="btn" id="addBtn" type="button">Add node</button>
        <button class="btn" id="duplicateBtn" type="button" disabled>Duplicate</button>
        <button class="btn danger" id="deleteBtn" type="button" disabled>Delete</button>
      </div>
      <div class="spacer" />
      <div class="toolbar" aria-label="Graph actions">
        <button class="btn" id="exportBtn" type="button">Export JSON</button>
        <button class="btn" id="resetBtn" type="button">Reset example</button>
      </div>
    </header>
  );
}
