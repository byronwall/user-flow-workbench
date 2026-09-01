export function Toolbar(props: { documentPath: string }) {
  return (
    <header class="topbar">
      <div class="brand">
        <h1>
          <span class="brand-full">User Flow Workbench</span>
          <span class="brand-compact">Workbench</span>
        </h1>
        <p title={props.documentPath}>{props.documentPath}</p>
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
        <a class="btn flow-switcher" href="/" rel="external">Project index</a>
        <button class="btn" id="exportBtn" type="button">Export JSON</button>
        <button class="btn" id="resetBtn" type="button">Reset file</button>
      </div>
    </header>
  );
}
