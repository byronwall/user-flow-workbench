interface GraphJsonPanelProps {
  hidden: boolean;
}

export function GraphJsonPanel(props: GraphJsonPanelProps) {
  return (
    <section
      class="sidebar-panel"
      id="code-panel"
      role="tabpanel"
      aria-labelledby="code-tab"
      hidden={props.hidden}
    >
      <div class="panel-head">
        <p>Write each node on one line. List edges after the nodes.</p>
      </div>
      <div class="panel-body">
        <textarea id="dslEditor" class="json-editor" aria-label="Flow DSL" spellcheck={false} />
        <div class="error" id="dslError" role="alert" />
        <div class="row">
          <button class="btn primary" id="applyDslBtn" type="button">Apply DSL</button>
          <button class="btn" id="formatDslBtn" type="button">Format</button>
          <button class="btn" id="copyDslBtn" type="button">Copy</button>
          <button class="btn" id="positionsDslBtn" type="button">Add positions</button>
        </div>
        <div class="hint">
          <strong>Syntax</strong><br />
          <code>flow 3</code><br />
          <code>node id type "Title" body="Detail" tags=["one","two"] layout=2,0</code><br />
          <code>edge edge-id first -&gt; second relation=addresses label="Optional"</code><br />
          <code>variant id "Title" {'{'} add | remove | set | unset | position | clear all {'}'}</code>
          <br /><br />
          <code>layout</code> is optional. Use <strong>Add positions</strong> to write separate, optional
          <code> position</code> lines after manual placement.
        </div>
      </div>
    </section>
  );
}
