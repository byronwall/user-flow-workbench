import { createEffect, createMemo, createSignal, For, onCleanup, onMount, Show } from "solid-js";
import type { OverviewCapability, OverviewDocument, OverviewGroup, OverviewReferenceWarning } from "../types/overview";
import type { DiagramCatalog } from "../types/diagram";
import { createSourceRefresh, type SourceRefreshState } from "../source-refresh";
import { composeFlowUrl, composeOverviewCapabilityUrl, composeWireframeUrl } from "../lib/overview-navigation";
import { overviewFlowInventory, type OverviewFlowInventoryItem } from "../lib/overview-flow-inventory";
import { overviewWireframeInventory, type OverviewWireframeInventoryItem } from "../lib/overview-wireframe-inventory";
import { materializeOverview } from "../lib/overview-dsl";
import { projectWorkspaceNavigation, type WorkspaceNavigationProjection } from "../lib/workspace-navigation";
import { captureTextLines, svgEscape, textLinesToSvg } from "../lib/dom-vector-scene";

type OverviewSidebarTab = "inspector" | "source";
const UNGROUPED_PROJECTION_ID = "~ungrouped";

export interface OverviewSourceResult {
  document: OverviewDocument;
  sourceText: string;
  sourceHash: string;
  warnings?: readonly OverviewReferenceWarning[];
}

export interface OverviewFlowReferenceTarget {
  path: string;
  title: string;
  variant?: string;
}

export interface OverviewWireframeReferenceTarget {
  path: string;
  title: string;
  screen?: string;
  screenTitle?: string;
}

export type ResolveOverviewFlowReference = (reference: NonNullable<OverviewCapability["flowRefs"]>[number]) => Promise<OverviewFlowReferenceTarget>;
export type ResolveOverviewWireframeReference = (reference: NonNullable<OverviewCapability["wireframeRefs"]>[number]) => Promise<OverviewWireframeReferenceTarget>;

function sameCapability(left: OverviewCapability, right: OverviewCapability) {
  const leftRefs = left.flowRefs || [];
  const rightRefs = right.flowRefs || [];
  const leftWireframes = left.wireframeRefs || [];
  const rightWireframes = right.wireframeRefs || [];
  return left.id === right.id && left.title === right.title && left.detail === right.detail && left.groupId === right.groupId
    && leftRefs.length === rightRefs.length
    && leftRefs.every((reference, index) => reference.path === rightRefs[index]?.path && reference.variant === rightRefs[index]?.variant)
    && leftWireframes.length === rightWireframes.length
    && leftWireframes.every((reference, index) => reference.path === rightWireframes[index]?.path && reference.screen === rightWireframes[index]?.screen);
}

function createStableGroupProjection() {
  let previous: OverviewGroup[] = [];
  return (document: OverviewDocument) => {
    const previousById = new Map(previous.map((group) => [group.id, group]));
    const next: OverviewGroup[] = document.groups.map((group) => {
      const prior = previousById.get(group.id);
      const priorCapabilities = new Map(prior?.capabilities.map((capability) => [capability.id, capability]));
      const capabilities = group.capabilities.map((capability) => {
        const priorCapability = priorCapabilities.get(capability.id);
        return priorCapability && sameCapability(priorCapability, capability) ? priorCapability : capability;
      });
      if (prior && prior.title === group.title && prior.capabilities.length === capabilities.length && capabilities.every((capability, index) => capability === prior.capabilities[index])) return prior;
      return { ...group, capabilities };
    });
    const groupedIds = new Set(next.flatMap((group) => group.capabilities.map((capability) => capability.id)));
    const ungrouped = (document.capabilities || []).filter((capability) => !groupedIds.has(capability.id));
    if (ungrouped.length) {
      const prior = previousById.get(UNGROUPED_PROJECTION_ID);
      const priorCapabilities = new Map(prior?.capabilities.map((capability) => [capability.id, capability]));
      const capabilities = ungrouped.map((capability) => {
        const priorCapability = priorCapabilities.get(capability.id);
        return priorCapability && sameCapability(priorCapability, capability) ? priorCapability : capability;
      });
      next.push(prior && prior.capabilities.length === capabilities.length && capabilities.every((capability, index) => capability === prior.capabilities[index]) ? prior : { id: UNGROUPED_PROJECTION_ID, title: "Ungrouped capabilities", capabilities });
    }
    previous = next;
    return next;
  };
}

export interface OverviewWorkbenchProps {
  document: OverviewDocument;
  documentPath?: string;
  sourceText?: string;
  sourceHash?: string;
  workspaceId?: string;
  catalog?: DiagramCatalog;
  loadSource?: (signal: AbortSignal) => Promise<OverviewSourceResult>;
  resolveFlowReference?: ResolveOverviewFlowReference;
  resolveWireframeReference?: ResolveOverviewWireframeReference;
  referenceWarnings?: readonly OverviewReferenceWarning[];
  onNavigationChange?: (projection: WorkspaceNavigationProjection) => void;
  onCapabilityChange?: (capabilityId: string | undefined) => void;
  onVariantChange?: (variantId: string | undefined) => void;
}

interface FlowWorkbenchWindow extends Window {
  __flowWorkbenchReady?: { status: "loading" | "ready" | "error"; layoutEngine?: "css-board" };
  flowOverview?: { refresh: () => Promise<void>; select: (id: string | null) => void; captureScene: () => { type: "overview"; width: number; height: number; svg: string; minimumTextSize: number } };
}

function downloadSource(document: OverviewDocument, sourceText: string) {
  if (!sourceText) return;
  const blob = new Blob([sourceText], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = window.document.createElement("a");
  link.href = url;
  link.download = `${document.id}.diagram`;
  link.click();
  URL.revokeObjectURL(url);
}

function CapabilityButton(props: { capability: OverviewCapability; selected: boolean; onSelect: () => void }) {
  return (
    <button class="overview-capability" classList={{ selected: props.selected }} type="button" aria-pressed={props.selected} data-capability-id={props.capability.id} onClick={props.onSelect}>
      <span>{props.capability.title}</span>
    </button>
  );
}

function OverviewFlowShelf(props: { items: readonly OverviewFlowInventoryItem[]; overviewPath?: string; viewId?: string }) {
  return (
    <section class="overview-flow-shelf" aria-labelledby="overview-flow-shelf-title">
      <div class="overview-flow-shelf-heading"><h2 id="overview-flow-shelf-title">Flows in this project · {props.items.length}</h2><span>Project files</span></div>
      <Show when={props.items.length} fallback={<p class="overview-flow-shelf-empty">No valid flows found in this project or its linked capabilities.</p>}>
        <div class="overview-flow-list">
          <For each={props.items}>{(item) => {
            const href = item.relationship && props.overviewPath
              ? composeFlowUrl(item.path, item.relationship.variant, { path: props.overviewPath, capabilityId: item.relationship.capabilityId, ...(props.viewId ? { viewId: props.viewId } : {}) })
              : composeFlowUrl(item.path);
            return <a class="overview-flow-row" href={href} rel="external"><span class="overview-flow-copy"><strong>{item.title}</strong><small>{item.path}</small></span><span class="overview-flow-meta">{item.linkedFrom.length ? `Linked from: ${item.linkedFrom.join(", ")}` : "Project flow"}</span><svg viewBox="0 0 16 16" aria-hidden="true"><path d="m6 3 5 5-5 5" /></svg></a>;
          }}</For>
        </div>
      </Show>
    </section>
  );
}

function OverviewWireframeShelf(props: { items: readonly OverviewWireframeInventoryItem[]; overviewPath?: string; viewId?: string }) {
  return (
    <section class="overview-flow-shelf" aria-labelledby="overview-wireframe-shelf-title">
      <div class="overview-flow-shelf-heading"><h2 id="overview-wireframe-shelf-title">Wireframes in this project · {props.items.length}</h2><span>Project files</span></div>
      <Show when={props.items.length} fallback={<p class="overview-flow-shelf-empty">No valid wireframes found in this project or its linked capabilities.</p>}>
        <div class="overview-flow-list">
          <For each={props.items}>{(item) => {
            const href = item.relationship && props.overviewPath
              ? composeWireframeUrl(item.path, item.relationship.screen, { path: props.overviewPath, capabilityId: item.relationship.capabilityId, ...(props.viewId ? { viewId: props.viewId } : {}) })
              : composeWireframeUrl(item.path, item.relationship?.screen);
            return <a class="overview-flow-row" href={href} rel="external"><span class="overview-flow-copy"><strong>{item.title}</strong><small>{item.path}</small></span><span class="overview-flow-meta">{item.linkedFrom.length ? `Linked from: ${item.linkedFrom.join(", ")}` : "Project wireframe"}</span><svg viewBox="0 0 16 16" aria-hidden="true"><path d="m6 3 5 5-5 5" /></svg></a>;
          }}</For>
        </div>
      </Show>
    </section>
  );
}

interface FlowReferenceState {
  status: "loading" | "ready" | "error";
  target?: OverviewFlowReferenceTarget;
  error?: Error;
}

interface WireframeReferenceState {
  status: "loading" | "ready" | "error";
  target?: OverviewWireframeReferenceTarget;
  error?: Error;
}

function OverviewFlowLinks(props: {
  capability: OverviewCapability;
  states: Record<string, FlowReferenceState>;
  warnings: readonly OverviewReferenceWarning[];
  overviewPath?: string;
  viewId?: string;
  onRetry: () => void;
}) {
  const refs = () => props.capability.flowRefs || [];
  return (
    <div class="overview-flow-links">
      <Show when={refs().length} fallback={<div class="overview-no-links"><strong>No linked flow yet.</strong><span>Capabilities can come before detailed flows.</span></div>}>
        <For each={refs()}>{(reference, index) => {
          const state = () => props.states[`${props.capability.id}:${index()}`];
          const warning = () => props.warnings.find((candidate) => candidate.capabilityId === props.capability.id && candidate.path === reference.path && candidate.variant === reference.variant);
          return (
            <div class="overview-flow-link-row">
              <Show when={state()?.status === "ready" && !warning()} fallback={
                <Show when={warning() || state()?.status === "error"} fallback={<span class="overview-flow-link-loading">Checking linked flow…</span>}>
                  <span class="overview-flow-link-warning" role="alert">{warning()?.message || state()?.error?.message || "This linked flow is unavailable."} {warning()?.suggestion || "Repair the reference, then retry."}</span>
                  <button class="btn" type="button" onClick={props.onRetry}>Retry</button>
                </Show>
              }>
                <Show when={state()?.target}>
                  {(target) => <a class="overview-flow-link" href={composeFlowUrl(target().path, target().variant, props.overviewPath ? { path: props.overviewPath, capabilityId: props.capability.id, ...(props.viewId ? { viewId: props.viewId } : {}) } : undefined)} rel="external"><span>{target().title}</span><small>{target().variant ? `View: ${target().variant}` : "Open flow"}</small></a>}
                </Show>
              </Show>
            </div>
          );
        }}</For>
      </Show>
    </div>
  );
}

function OverviewWireframeLinks(props: { capability: OverviewCapability; states: Record<string, WireframeReferenceState>; warnings: readonly OverviewReferenceWarning[]; overviewPath?: string; viewId?: string; onRetry: () => void }) {
  const refs = () => props.capability.wireframeRefs || [];
  return <div class="overview-flow-links">
    <Show when={refs().length} fallback={<div class="overview-no-links"><strong>No linked wireframe yet.</strong><span>Capabilities can come before proposed screens.</span></div>}>
      <For each={refs()}>{(reference, index) => {
        const state = () => props.states[`${props.capability.id}:${index()}`];
        const warning = () => props.warnings.find((candidate) => candidate.capabilityId === props.capability.id && candidate.path === reference.path && candidate.screen === reference.screen);
        return <div class="overview-flow-link-row">
          <Show when={state()?.status === "ready" && !warning()} fallback={<Show when={warning() || state()?.status === "error"} fallback={<span class="overview-flow-link-loading">Checking linked wireframe…</span>}><span class="overview-flow-link-warning" role="alert">{warning()?.message || state()?.error?.message || "This linked wireframe is unavailable."} {warning()?.suggestion || "Repair the reference, then retry."}</span><button class="btn" type="button" onClick={props.onRetry}>Retry</button></Show>}>
            <Show when={state()?.target}>{(target) => <a class="overview-flow-link" href={composeWireframeUrl(target().path, target().screen, props.overviewPath ? { path: props.overviewPath, capabilityId: props.capability.id, ...(props.viewId ? { viewId: props.viewId } : {}) } : undefined)} rel="external"><span>{target().title}{target().screenTitle ? ` · ${target().screenTitle}` : ""}</span><small>{target().screen ? `Screen: ${target().screen}` : "Open wireframe"}</small></a>}</Show>
          </Show>
        </div>;
      }}</For>
    </Show>
  </div>;
}

function OverviewInspector(props: { document: OverviewDocument; selected?: OverviewCapability; stale: boolean; referenceStates: Record<string, FlowReferenceState>; wireframeStates: Record<string, WireframeReferenceState>; referenceWarnings: readonly OverviewReferenceWarning[]; onRetryReference: () => void; overviewPath?: string; viewId?: string }) {
  return (
    <section class="overview-inspector-body" aria-live="polite">
      <Show when={props.selected} fallback={
        <>
          <p class="overview-panel-kicker">About this overview</p>
          <h2>{props.document.title}</h2>
          <Show when={props.document.statusLabel}><span class="overview-status-pill">{props.document.statusLabel}</span></Show>
          <p class="overview-purpose">{props.document.purpose || "No purpose provided yet."}</p>
          <div class="overview-inspector-rule" />
          <h3>Select a capability</h3>
          <p class="overview-muted">Read its detail while the full overview stays visible.</p>
        </>
      }>
        {(selected) => (
          <>
            <p class="overview-panel-kicker">Capability</p>
            <h2>{selected().title}</h2>
            <Show when={selected().groupId}>
              <p class="overview-capability-group">{props.document.groups.find((group) => group.id === selected().groupId)?.title}</p>
            </Show>
            <p class="overview-purpose">{selected().detail || "No detail provided yet."}</p>
            <div class="overview-inspector-rule" />
            <h3>Related flows</h3>
            <OverviewFlowLinks capability={selected()} states={props.referenceStates} warnings={props.referenceWarnings} overviewPath={props.overviewPath} viewId={props.viewId} onRetry={props.onRetryReference} />
            <h3>Related wireframe screens</h3>
            <OverviewWireframeLinks capability={selected()} states={props.wireframeStates} warnings={props.referenceWarnings} overviewPath={props.overviewPath} viewId={props.viewId} onRetry={props.onRetryReference} />
          </>
        )}
      </Show>
      <div class="overview-inspector-footer">
        <strong>{props.stale ? "Source needs attention" : "Source current"}</strong>
        <span>{props.stale ? "Showing the last valid board." : "Diagram source."}</span>
      </div>
    </section>
  );
}

export function OverviewWorkbench(props: OverviewWorkbenchProps) {
  let boardElement!: HTMLElement;
  const [currentDocument, setCurrentDocument] = createSignal(props.document);
  const [sourceText, setSourceText] = createSignal(props.sourceText || "");
  const [acceptedSourceHash, setAcceptedSourceHash] = createSignal(props.sourceHash || "");
  const [selectedId, setSelectedId] = createSignal<string | null>(null);
  const [activeVariantId, setActiveVariantId] = createSignal<string | null>(null);
  const [variantNotice, setVariantNotice] = createSignal<string>();
  const [referenceStates, setReferenceStates] = createSignal<Record<string, FlowReferenceState>>({});
  const [wireframeStates, setWireframeStates] = createSignal<Record<string, WireframeReferenceState>>({});
  const [referenceWarnings, setReferenceWarnings] = createSignal<readonly OverviewReferenceWarning[]>(props.referenceWarnings || []);
  const [activeSidebarTab, setActiveSidebarTab] = createSignal<OverviewSidebarTab>("inspector");
  const [refreshState, setRefreshState] = createSignal<SourceRefreshState<OverviewSourceResult>>({
    status: "ready",
    value: { document: props.document, sourceText: props.sourceText || "", sourceHash: props.sourceHash || "", warnings: props.referenceWarnings || [] },
    revision: 0,
    stale: false,
  });
  const projectGroupsByView = new Map<string, ReturnType<typeof createStableGroupProjection>>();
  const activeVariant = createMemo(() => {
    const active = activeVariantId();
    return active && currentDocument().variants?.some((variant) => variant.id === active) ? active : null;
  });
  const viewDocument = createMemo(() => materializeOverview(currentDocument(), activeVariant() || undefined));
  const groups = createMemo(() => {
    const viewId = activeVariant() || "base";
    let projectGroups = projectGroupsByView.get(viewId);
    if (!projectGroups) {
      projectGroups = createStableGroupProjection();
      projectGroupsByView.set(viewId, projectGroups);
    }
    return projectGroups(viewDocument());
  });
  const selected = createMemo(() => groups().flatMap((group) => group.capabilities).find((capability) => capability.id === selectedId()));
  const stale = createMemo(() => refreshState().stale || refreshState().status === "error");
  const navigation = createMemo(() => projectWorkspaceNavigation(viewDocument(), props.catalog || { rootName: "", workspaceId: "", diagrams: [] }, props.documentPath));

  createEffect(() => props.onNavigationChange?.(navigation()));

  createEffect(() => {
    const active = activeVariantId();
    if (active && !currentDocument().variants?.some((variant) => variant.id === active)) {
      setActiveVariantId(null);
      props.onVariantChange?.(undefined);
      setVariantNotice(`The overview view "${active}" is no longer available. Showing the base view.`);
      const url = new URL(window.location.href);
      url.searchParams.delete("variant");
      window.history.replaceState(window.history.state, "", url);
    }
  });

  const selectVariant = (variantId: string | null) => {
    if (variantId && !currentDocument().variants?.some((variant) => variant.id === variantId)) return;
    setActiveVariantId(variantId);
    props.onVariantChange?.(variantId || undefined);
    setVariantNotice(undefined);
    const url = new URL(window.location.href);
    if (variantId) url.searchParams.set("variant", variantId);
    else url.searchParams.delete("variant");
    window.history.replaceState({ ...window.history.state, overviewVariant: variantId }, "", url);
  };

  createEffect(() => {
    const id = selectedId();
    if (id && !selected()) {
      setSelectedId(null);
      props.onCapabilityChange?.(undefined);
      window.history.replaceState(window.history.state, "", composeOverviewCapabilityUrl(window.location.href, null));
    }
  });

  const selectCapability = (id: string) => {
    setSelectedId(id);
    props.onCapabilityChange?.(id);
    window.history.pushState({ ...window.history.state, overviewCapability: id }, "", composeOverviewCapabilityUrl(window.location.href, id));
  };

  let referenceRequest = 0;
  const loadFlowReferences = (capability: OverviewCapability) => {
    const requestId = ++referenceRequest;
    const resolver = props.resolveFlowReference;
    const refs = capability.flowRefs || [];
    if (!resolver || !refs.length) return;
    refs.forEach((reference, index) => {
      const key = `${capability.id}:${index}`;
      setReferenceStates((current) => ({ ...current, [key]: { status: "loading" } }));
      void resolver(reference).then((target) => {
        if (requestId !== referenceRequest) return;
        setReferenceWarnings((current) => current.filter((warning) => warning.capabilityId !== capability.id || warning.path !== reference.path || warning.variant !== reference.variant));
        setReferenceStates((current) => ({ ...current, [key]: { status: "ready", target } }));
      }).catch((error) => {
        if (requestId !== referenceRequest) return;
        setReferenceStates((current) => ({ ...current, [key]: { status: "error", error: error instanceof Error ? error : new Error(String(error)) } }));
      });
    });
  };

  const loadWireframeReferences = (capability: OverviewCapability) => {
    const requestId = referenceRequest;
    const resolver = props.resolveWireframeReference;
    const refs = capability.wireframeRefs || [];
    if (!resolver || !refs.length) return;
    refs.forEach((reference, index) => {
      const key = `${capability.id}:${index}`;
      setWireframeStates((current) => ({ ...current, [key]: { status: "loading" } }));
      void resolver(reference).then((target) => {
        if (requestId !== referenceRequest) return;
        setReferenceWarnings((current) => current.filter((warning) => warning.capabilityId !== capability.id || warning.path !== reference.path || warning.screen !== reference.screen));
        setWireframeStates((current) => ({ ...current, [key]: { status: "ready", target } }));
      }).catch((error) => {
        if (requestId !== referenceRequest) return;
        setWireframeStates((current) => ({ ...current, [key]: { status: "error", error: error instanceof Error ? error : new Error(String(error)) } }));
      });
    });
  };

  createEffect(() => {
    const capability = selected();
    if (capability) { loadFlowReferences(capability); loadWireframeReferences(capability); }
    else referenceRequest += 1;
  });

  const handleTabKeyDown = (event: KeyboardEvent) => {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
    event.preventDefault();
    const nextTab = activeSidebarTab() === "inspector" ? "source" : "inspector";
    setActiveSidebarTab(nextTab);
    window.document.getElementById(`overview-${nextTab}-tab`)?.focus();
  };

  const captureScene = () => {
    const boardRect = boardElement.getBoundingClientRect();
    const groupSvg = [...boardElement.querySelectorAll<HTMLElement>(".overview-group")].map((group) => {
      const rect = group.getBoundingClientRect();
      return `<rect x="${(rect.left - boardRect.left).toFixed(1)}" y="${(rect.top - boardRect.top).toFixed(1)}" width="${rect.width.toFixed(1)}" height="${rect.height.toFixed(1)}" rx="8" fill="#f8fafc" stroke="#b9c2cc"/>`;
    }).join("");
    const capabilitySvg = [...boardElement.querySelectorAll<HTMLElement>(".overview-capability")].map((capability) => {
      const rect = capability.getBoundingClientRect();
      const selected = capability.classList.contains("selected");
      const lines = captureTextLines(capability, boardRect).map((line) => ({ ...line, color: "#26303b" }));
      return `<g data-capability-id="${svgEscape(capability.dataset.capabilityId)}"><rect x="${(rect.left - boardRect.left).toFixed(1)}" y="${(rect.top - boardRect.top).toFixed(1)}" width="${rect.width.toFixed(1)}" height="${rect.height.toFixed(1)}" rx="6" fill="${selected ? "#e7efff" : "#fff"}" stroke="${selected ? "#285da8" : "#9da8b3"}" stroke-width="${selected ? 2 : 1}"/>${textLinesToSvg(lines)}</g>`;
    }).join("");
    const headingSvg = [...boardElement.querySelectorAll<HTMLElement>(".overview-group h3")].map((heading) => textLinesToSvg(captureTextLines(heading, boardRect))).join("");
    const width = Math.max(1, Math.ceil(boardElement.scrollWidth));
    const height = Math.max(1, Math.ceil(boardElement.scrollHeight));
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" data-semantic-scene="overview"><rect width="100%" height="100%" fill="#f1f3f6"/>${groupSvg}${headingSvg}${capabilitySvg}</svg>`;
    return { type: "overview" as const, width, height, svg, minimumTextSize: 13 };
  };

  onMount(() => {
    const syncLocation = () => {
      const query = new URLSearchParams(window.location.search);
      const requestedVariant = query.get("variant");
      if (requestedVariant && currentDocument().variants?.some((variant) => variant.id === requestedVariant)) {
        setActiveVariantId(requestedVariant);
        props.onVariantChange?.(requestedVariant);
        setVariantNotice(undefined);
      } else if (requestedVariant) {
        setActiveVariantId(null);
        props.onVariantChange?.(undefined);
        setVariantNotice(`The overview view "${requestedVariant}" is no longer available. Showing the base view.`);
        const url = new URL(window.location.href);
        url.searchParams.delete("variant");
        window.history.replaceState(window.history.state, "", url);
      } else {
        setActiveVariantId(null);
        props.onVariantChange?.(undefined);
        setVariantNotice(undefined);
      }
      setSelectedId(query.get("capability"));
      props.onCapabilityChange?.(query.get("capability") || undefined);
    };
    syncLocation();
    window.addEventListener("popstate", syncLocation);
    onCleanup(() => window.removeEventListener("popstate", syncLocation));
    const renderMode = new URLSearchParams(window.location.search).get("render") === "1";
    if (renderMode) {
      document.documentElement.dataset.flowRender = "true";
      document.documentElement.dataset.flowLayout = "css-board";
    }
    requestAnimationFrame(() => requestAnimationFrame(() => {
      (window as FlowWorkbenchWindow).__flowWorkbenchReady = { status: "ready", layoutEngine: "css-board" };
    }));
    const loader = props.loadSource;
    if (!loader) return;
    const controller = createSourceRefresh({
      load: loader,
      initialValue: { document: props.document, sourceText: props.sourceText || "", sourceHash: props.sourceHash || "", warnings: props.referenceWarnings || [] },
      onState: (state) => {
        setRefreshState(state);
        if (state.value && state.status === "ready") {
          setReferenceWarnings(state.value.warnings || []);
          const unchanged = state.value.sourceHash === acceptedSourceHash() && state.value.sourceText === sourceText();
          setAcceptedSourceHash(state.value.sourceHash);
          if (!unchanged) {
            setCurrentDocument(state.value.document);
            setSourceText(state.value.sourceText);
          }
        }
      },
    });
    const refreshOnFocus = () => void controller.refresh();
    const updateVisibility = () => controller.setVisible(window.document.visibilityState === "visible");
    window.addEventListener("focus", refreshOnFocus);
    window.document.addEventListener("visibilitychange", updateVisibility);
    controller.start();
    onCleanup(() => {
      window.removeEventListener("focus", refreshOnFocus);
      window.document.removeEventListener("visibilitychange", updateVisibility);
      controller.dispose();
    });
    (window as FlowWorkbenchWindow).flowOverview = { refresh: controller.refresh, select: setSelectedId, captureScene };
  });

  const error = createMemo(() => refreshState().error);
  return (
    <div class="app overview-app" classList={{ "overview-app-with-variants": Boolean(currentDocument().variants?.length) }}>
      <header class="topbar overview-topbar">
        <span class="overview-source-status" role="status">Overview</span>
        <div class="toolbar" aria-label="Overview actions"><button class="btn primary" type="button" onClick={() => void (window as FlowWorkbenchWindow).flowOverview?.refresh?.()}>Reload source</button></div>
        <div class="spacer" />
        <div class="toolbar" aria-label="Document actions"><button class="btn" type="button" disabled={!sourceText()} onClick={() => downloadSource(currentDocument(), sourceText())}>Export source</button></div>
      </header>

      <Show when={currentDocument().variants?.length}>
        <section class="variant-bar overview-variant-bar" aria-label="Overview views">
          <div class="variant-picker">
            <span class="variant-picker-label" id="overview-variant-picker-label">View</span>
            <div class="variant-tabs" role="tablist" aria-labelledby="overview-variant-picker-label">
              <button class="variant-tab" type="button" role="tab" aria-selected={activeVariantId() === null} onClick={() => selectVariant(null)}>Base</button>
              <For each={currentDocument().variants}>{(variant) => <button class="variant-tab" type="button" role="tab" aria-selected={activeVariantId() === variant.id} onClick={() => selectVariant(variant.id)}>{variant.title}</button>}</For>
            </div>
          </div>
        </section>
      </Show>

      <main class="shell overview-shell"><div class="overview-main"><div class="overview-content">
        <Show when={error()}><div class="overview-source-alert" classList={{ stale: stale() }} role="alert"><strong>{stale() ? "Source changed with errors" : "Could not load source"}</strong><span>{error()?.message}</span><button class="btn" type="button" onClick={() => void (window as FlowWorkbenchWindow).flowOverview?.refresh?.()}>Retry</button><Show when={((error() as Error & { status?: number } | undefined)?.status === 404) || ((error() as Error & { status?: number } | undefined)?.status === 409)}><a class="btn" href="/" rel="external">Choose another diagram</a></Show></div></Show>
        <Show when={variantNotice()}><div class="overview-variant-notice" role="status">{variantNotice()}</div></Show>
        <div class="overview-heading"><div><div class="overview-title-row"><h1>{viewDocument().title || "Untitled overview"}</h1><Show when={viewDocument().statusLabel}><span class="overview-status-pill">{viewDocument().statusLabel}</span></Show></div><p>{viewDocument().purpose || "No purpose provided yet."}</p></div><span class="overview-board-note">Grouped capabilities · no sequence implied</span></div>
        <section ref={boardElement} class="overview-board" aria-labelledby="overview-board-title"><h2 id="overview-board-title" class="sr-only">Capabilities in this overview</h2><For each={groups()}>{(group) => <section class="overview-group" aria-labelledby={`overview-group-${group.id}`}><h3 id={`overview-group-${group.id}`}>{group.title}</h3><div class="overview-capability-list"><For each={group.capabilities}>{(capability) => <CapabilityButton capability={capability} selected={selectedId() === capability.id} onSelect={() => selectCapability(capability.id)} />}</For></div></section>}</For><Show when={groups().length === 0}><div class="overview-empty"><strong>No capabilities yet</strong><span>Add a capability to the source file, then reload.</span></div></Show></section>
        <OverviewFlowShelf items={overviewFlowInventory(props.catalog?.diagrams || [], props.documentPath, viewDocument())} overviewPath={props.documentPath} viewId={activeVariant() || undefined} />
        <OverviewWireframeShelf items={overviewWireframeInventory(props.catalog?.diagrams || [], props.documentPath, viewDocument())} overviewPath={props.documentPath} viewId={activeVariant() || undefined} />
        <p class="overview-footnote">Select a capability to inspect its detail. The overview stays in place while you review scope.</p>
      </div></div></main>

      <aside class="sidebar overview-sidebar" aria-label="Overview details and source"><div class="sidebar-tabs" role="tablist" aria-label="Overview sidebar views"><button class="sidebar-tab" id="overview-inspector-tab" type="button" role="tab" aria-controls="overview-inspector-panel" aria-selected={activeSidebarTab() === "inspector"} tabIndex={activeSidebarTab() === "inspector" ? 0 : -1} onClick={() => setActiveSidebarTab("inspector")} onKeyDown={handleTabKeyDown}>Inspector</button><button class="sidebar-tab" id="overview-source-tab" type="button" role="tab" aria-controls="overview-source-panel" aria-selected={activeSidebarTab() === "source"} tabIndex={activeSidebarTab() === "source" ? 0 : -1} onClick={() => setActiveSidebarTab("source")} onKeyDown={handleTabKeyDown}><span>Diagram DSL</span><small>Read only</small></button></div><div class="overview-sidebar-content">
        <section class="sidebar-panel overview-sidebar-panel" id="overview-inspector-panel" role="tabpanel" aria-labelledby="overview-inspector-tab" hidden={activeSidebarTab() !== "inspector"}><OverviewInspector document={viewDocument()} selected={selected()} stale={stale()} referenceStates={referenceStates()} wireframeStates={wireframeStates()} referenceWarnings={referenceWarnings()} overviewPath={props.documentPath} viewId={activeVariant() || undefined} onRetryReference={() => { const capability = selected(); if (capability) { loadFlowReferences(capability); loadWireframeReferences(capability); } }} /></section>
        <section class="sidebar-panel overview-sidebar-panel" id="overview-source-panel" role="tabpanel" aria-labelledby="overview-source-tab" hidden={activeSidebarTab() !== "source"}><div class="overview-source-body" data-source-hash={acceptedSourceHash() || undefined}><p class="overview-panel-kicker">Read only</p><h2>Diagram DSL</h2><p class="overview-muted">Source for this diagram.</p><pre class="overview-source-code"><code>{sourceText() || "Source text is unavailable for this document."}</code></pre><p class="overview-source-note">Edit the source file, then reload to see changes.</p></div></section>
      </div></aside>
    </div>
  );
}
