import { createSignal, onMount } from "solid-js";
import { mountFlowWorkbench } from "../lib/flow-workbench";
import { FlowCanvas } from "./FlowCanvas";
import { GraphJsonPanel } from "./GraphJsonPanel";
import { InspectorPanel } from "./InspectorPanel";
import { Toolbar } from "./Toolbar";
import type { FlowGraph } from "../types/graph";

interface WorkbenchProps {
  initialGraph: FlowGraph;
}

export function Workbench(props: WorkbenchProps) {
  const [isCodePanelVisible, setIsCodePanelVisible] = createSignal(true);

  onMount(() => mountFlowWorkbench(props.initialGraph));

  return (
    <div class="app">
      <Toolbar
        isCodePanelVisible={isCodePanelVisible()}
        onToggleCodePanel={() => setIsCodePanelVisible((isVisible) => !isVisible)}
      />
      <div class="shell" classList={{ "code-panel-hidden": !isCodePanelVisible() }}>
        <GraphJsonPanel />
        <FlowCanvas />
        <InspectorPanel />
      </div>
    </div>
  );
}
