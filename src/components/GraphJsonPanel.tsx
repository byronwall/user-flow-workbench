export function GraphJsonPanel() {
  return (
    <aside class="panel left">
      <div class="panel-head">
        <h2>Graph JSON</h2>
        <p>The canvas is a view of this data. Agents can duplicate and modify the schema directly.</p>
      </div>
      <div class="panel-body">
        <textarea id="jsonEditor" class="json-editor" aria-label="Graph JSON" spellcheck={false} />
        <div class="error" id="jsonError" role="alert" />
        <div class="row">
          <button class="btn primary" id="applyJsonBtn" type="button">Apply JSON</button>
          <button class="btn" id="formatJsonBtn" type="button">Format</button>
          <button class="btn" id="copyJsonBtn" type="button">Copy</button>
        </div>
        <div class="hint">
          <strong>Agent API</strong><br />
          <code>flow.get()</code> · <code>flow.set(graph)</code> · <code>flow.addNode(node)</code> ·{" "}
          <code>flow.addEdge(edge)</code> · <code>flow.autoLayout()</code>.
          <br /><br />
          Nodes keep an exact <code>position</code> plus a semantic <code>layout: {`{ column, row }`}</code> hint.
          Auto layout uses ELK Layered when available, with a local fallback.
        </div>
      </div>
    </aside>
  );
}
