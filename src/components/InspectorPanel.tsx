interface InspectorPanelProps {
  hidden: boolean;
}

export function InspectorPanel(props: InspectorPanelProps) {
  return (
    <section
      class="sidebar-panel"
      id="inspector-panel"
      role="tabpanel"
      aria-labelledby="inspector-tab"
      hidden={props.hidden}
    >
      <div class="panel-body" id="inspector" />
    </section>
  );
}
