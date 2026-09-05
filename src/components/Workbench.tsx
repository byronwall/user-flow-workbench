import { createSignal, onMount, Show } from "solid-js";
import { mountFlowWorkbench, type FlowWorkbenchState } from "../lib/flow-workbench";
import { FlowCanvas } from "./FlowCanvas";
import { GraphJsonPanel } from "./GraphJsonPanel";
import { InspectorPanel } from "./InspectorPanel";
import { Toolbar } from "./Toolbar";
import { VariantBar } from "./VariantBar";
import type { FlowDocument } from "../types/graph";

interface WorkbenchProps {
  initialGraph: FlowDocument;
  documentKey: string;
}

type SidebarTab = "inspector" | "code";

export function Workbench(props: WorkbenchProps) {
  const [activeSidebarTab, setActiveSidebarTab] = createSignal<SidebarTab>("inspector");
  const [flowState, setFlowState] = createSignal<FlowWorkbenchState>({ workingCopy: false, restoredLocalCopy: false });

  const selectSidebarTab = (tab: SidebarTab) => setActiveSidebarTab(tab);

  const handleTabKeyDown = (event: KeyboardEvent) => {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
    event.preventDefault();
    const nextTab = activeSidebarTab() === "inspector" ? "code" : "inspector";
    selectSidebarTab(nextTab);
    document.getElementById(`${nextTab}-tab`)?.focus();
  };

  onMount(() => {
    const renderMode = new URLSearchParams(window.location.search).get("render") === "1";
    if (renderMode) {
      document.documentElement.dataset.flowRender = "true";
    }
    mountFlowWorkbench(props.initialGraph, { storageKey: props.documentKey, persist: !renderMode, onStateChange: setFlowState });
  });

  return (
    <div class="app flow-app">
      <Toolbar flowState={flowState()} />
      <VariantBar />
      <main class="shell">
        <Show when={flowState().variantNotice}>
          {(notice) => (
            <div class="overview-source-alert stale flow-variant-notice" role="status">
              <strong>Flow view unavailable</strong>
              <span>{notice()}</span>
            </div>
          )}
        </Show>
        <FlowCanvas />
      </main>
      <aside class="sidebar" aria-label="Flow details and code">
        <div class="sidebar-tabs" role="tablist" aria-label="Sidebar views">
          <button
            class="sidebar-tab"
            id="inspector-tab"
            type="button"
            role="tab"
            aria-controls="inspector-panel"
            aria-selected={activeSidebarTab() === "inspector"}
            tabIndex={activeSidebarTab() === "inspector" ? 0 : -1}
            onClick={() => selectSidebarTab("inspector")}
            onKeyDown={handleTabKeyDown}
          >
            Inspector
          </button>
          <button
            class="sidebar-tab"
            id="code-tab"
            type="button"
            role="tab"
            aria-controls="code-panel"
            aria-selected={activeSidebarTab() === "code"}
            tabIndex={activeSidebarTab() === "code" ? 0 : -1}
            onClick={() => selectSidebarTab("code")}
            onKeyDown={handleTabKeyDown}
          >
            Flow DSL
          </button>
        </div>
        <div class="variant-description" id="variantDescription" aria-live="polite" hidden>
          <span>Active view</span>
          <p id="variantDescriptionText" />
        </div>
        <InspectorPanel hidden={activeSidebarTab() !== "inspector"} />
        <GraphJsonPanel hidden={activeSidebarTab() !== "code"} />
      </aside>
    </div>
  );
}
