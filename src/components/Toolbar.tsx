import type { FlowWorkbenchState } from "../lib/flow-workbench";

export function Toolbar(props: { flowState: FlowWorkbenchState }) {
  return (
    <header class="topbar">
      <div class="toolbar" aria-label="Canvas actions">
        <button class="btn primary" id="autoLayoutBtn" type="button">Auto layout</button>
        <button class="btn" id="fitBtn" type="button">Fit</button>
        <button class="btn" id="addBtn" type="button">Add node</button>
        <button class="btn" id="duplicateBtn" type="button" disabled>Duplicate</button>
        <button class="btn danger" id="deleteBtn" type="button" disabled>Delete</button>
      </div>
      <div class="spacer" />
      <div class="toolbar" aria-label="Graph actions">
        <span class="flow-source-status" role="status">{props.flowState.workingCopy ? (props.flowState.restoredLocalCopy ? "Restored browser-local copy." : "Using browser-local working copy.") : "Source-backed flow."}</span>
        <button class="btn" id="exportBtn" type="button">Export JSON</button>
        <button class="btn" id="resetBtn" type="button">Reset file</button>
      </div>
    </header>
  );
}
