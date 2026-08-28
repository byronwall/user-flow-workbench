import { createSignal, onCleanup, onMount } from "solid-js";
import { mountFlowWorkbench } from "../lib/flow-workbench";
import { FlowCanvas } from "./FlowCanvas";
import { GraphJsonPanel } from "./GraphJsonPanel";
import { InspectorPanel } from "./InspectorPanel";
import { Toolbar } from "./Toolbar";
import { VariantBar } from "./VariantBar";
import type { FlowDocument } from "../types/graph";

interface WorkbenchProps {
  initialGraph: FlowDocument;
}

const CODE_PANEL_QUERY_PARAM = "code";
const HIDDEN_CODE_PANEL_VALUE = "hidden";

export function Workbench(props: WorkbenchProps) {
  const [isCodePanelVisible, setIsCodePanelVisible] = createSignal(true);

  const readCodePanelVisibility = () => {
    const url = new URL(window.location.href);
    return url.searchParams.get(CODE_PANEL_QUERY_PARAM) !== HIDDEN_CODE_PANEL_VALUE;
  };

  const updateCodePanelUrl = (isVisible: boolean) => {
    const url = new URL(window.location.href);
    if (isVisible) url.searchParams.delete(CODE_PANEL_QUERY_PARAM);
    else url.searchParams.set(CODE_PANEL_QUERY_PARAM, HIDDEN_CODE_PANEL_VALUE);
    window.history.replaceState(window.history.state, "", url);
  };

  const toggleCodePanel = () => {
    setIsCodePanelVisible((isVisible) => {
      const nextVisibility = !isVisible;
      updateCodePanelUrl(nextVisibility);
      return nextVisibility;
    });
  };

  onMount(() => {
    const syncCodePanelFromUrl = () => setIsCodePanelVisible(readCodePanelVisibility());
    syncCodePanelFromUrl();
    window.addEventListener("popstate", syncCodePanelFromUrl);
    onCleanup(() => window.removeEventListener("popstate", syncCodePanelFromUrl));

    mountFlowWorkbench(props.initialGraph);
  });

  return (
    <div class="app">
      <Toolbar
        isCodePanelVisible={isCodePanelVisible()}
        onToggleCodePanel={toggleCodePanel}
      />
      <VariantBar />
      <div class="shell" classList={{ "code-panel-hidden": !isCodePanelVisible() }}>
        <GraphJsonPanel />
        <FlowCanvas />
        <InspectorPanel />
      </div>
    </div>
  );
}
