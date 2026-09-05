import { Portal } from "solid-js/web";
import { ApplicationActions } from "./ApplicationActions";
import { ApplicationPageGraph } from "./ApplicationPageGraph";
import { createMemo, createSignal, For, onCleanup, onMount, Show } from "solid-js";
import { composeApplicationFlowUrl, composeApplicationOverviewUrl, composeApplicationSelectionUrl, composeApplicationWireframeUrl, parseApplicationSelection } from "../lib/overview-navigation";
import { createSourceRefresh, type SourceRefreshState } from "../source-refresh";
import type { ApplicationDocument, ApplicationObject, ApplicationPage, ApplicationReference, ApplicationReferenceWarning, ApplicationWarning } from "../types/application";

interface ApplicationWorkbenchProps {
  document: ApplicationDocument;
  sourceText?: string;
  documentPath?: string;
  sourceHash?: string;
  referenceWarnings?: readonly ApplicationReferenceWarning[];
  coverageWarnings?: readonly ApplicationWarning[];
  loadSource?: (signal: AbortSignal) => Promise<{ document: ApplicationDocument; sourceText: string; sourceHash: string; warnings?: ApplicationWarning[] }>;
}

type ApplicationWindow = Window & {
  __flowWorkbenchReady?: { status: "loading" | "ready"; layoutEngine?: "css-board" };
};

const referenceTitles: Record<ApplicationReference["kind"], string> = {
  overview: "Overview capability",
  flow: "Flow step",
  wireframe: "Wireframe screen",
  document: "Document",
};

function referenceLabel(reference: ApplicationReference) {
  if (reference.kind === "overview") return `${reference.path} · ${reference.capabilityId}`;
  if (reference.kind === "flow") return `${reference.path} · ${reference.nodeId}`;
  if (reference.kind === "wireframe") return `${reference.path} · ${reference.screenId}`;
  return `${reference.path}${reference.heading ? ` · ${reference.heading}` : ""}`;
}

function referenceHref(reference: ApplicationReference, origin?: { path: string; pageId: string; stateId?: string }) {
  if (!origin) return undefined;
  if (reference.kind === "overview") return composeApplicationOverviewUrl(reference.path, reference.capabilityId, origin);
  if (reference.kind === "flow") return composeApplicationFlowUrl(reference.path, reference.nodeId, origin);
  if (reference.kind === "wireframe") return composeApplicationWireframeUrl(reference.path, reference.screenId, origin);
  return undefined;
}

function downloadSource(document: ApplicationDocument, sourceText: string) {
  if (!sourceText) return;
  const url = URL.createObjectURL(new Blob([sourceText], { type: "text/plain;charset=utf-8" }));
  const link = window.document.createElement("a");
  link.href = url;
  link.download = `${document.id}.diagram`;
  link.click();
  URL.revokeObjectURL(url);
}

function ObjectRelation(props: { document: ApplicationDocument; objectId: string; cardinality: string; onSelectObject: (id: string) => void }) {
  const object = () => props.document.objects.find((item) => item.id === props.objectId);
  return <Show when={object()} fallback={<span class="application-object-relation-inert"><strong>{props.objectId}</strong><span>· {props.cardinality}</span></span>}>{(target) => <button type="button" onClick={() => props.onSelectObject(target().id)}><strong>{target().title}</strong><span>· {props.cardinality}</span></button>}</Show>;
}

function ObjectInspector(props: { document: ApplicationDocument; object: ApplicationObject; onSelectObject: (id: string) => void; onSelectPage: (id: string) => void }) {
  const ownedBy = () => props.document.ownership.filter((relation) => relation.objectId === props.object.id);
  const ownedObjects = () => props.document.ownership.filter((relation) => relation.ownerId === props.object.id);
  const primaryPages = () => props.document.pages.filter((page) => page.primaryObjectId === props.object.id);
  const ownerTitle = (ownerId: string) => ownerId === props.document.id ? props.document.title : props.document.objects.find((item) => item.id === ownerId)?.title || ownerId;
  return <div class="application-inspector-body" aria-live="polite">
    <p class="application-panel-kicker">Object inspector</p>
    <h2>{props.object.title}</h2>
    <p class="application-purpose">{props.object.detail || "No description provided yet."}</p>
    <section class="application-detail-section"><h3>Owned by</h3><Show when={ownedBy().length} fallback={<p class="application-muted">No owner specified.</p>}><ul class="application-object-relations"><For each={ownedBy()}>{(relation) => <li><Show when={relation.ownerId !== props.document.id} fallback={<span class="application-object-relation-inert"><strong>{ownerTitle(relation.ownerId)}</strong><span>· {relation.cardinality}</span></span>}><ObjectRelation document={props.document} objectId={relation.ownerId} cardinality={relation.cardinality} onSelectObject={props.onSelectObject} /></Show></li>}</For></ul></Show></section>
    <section class="application-detail-section"><h3>Owns</h3><Show when={ownedObjects().length} fallback={<p class="application-muted">No owned objects.</p>}><ul class="application-object-relations"><For each={ownedObjects()}>{(relation) => <li><ObjectRelation document={props.document} objectId={relation.objectId} cardinality={relation.cardinality} onSelectObject={props.onSelectObject} /></li>}</For></ul></Show></section>
    <section class="application-detail-section"><h3>Primary on</h3><Show when={primaryPages().length} fallback={<p class="application-muted">No page uses this as its primary object.</p>}><ul class="application-object-relations"><For each={primaryPages()}>{(page) => <li><button type="button" onClick={() => props.onSelectPage(page.id)}><strong>{page.title}</strong><Show when={page.route}><span>· <code>{page.route}</code></span></Show></button></li>}</For></ul></Show></section>
  </div>;
}

function PageInspector(props: { document: ApplicationDocument; page?: ApplicationPage; selectedStateId?: string; documentPath?: string; referenceWarnings: readonly ApplicationReferenceWarning[]; onSelectState: (id: string) => void; onSelectObject: (id: string) => void }) {
  const object = () => props.document.objects.find((item) => item.id === props.page?.primaryObjectId);
  const references = () => (props.page?.references || []).reduce<Record<string, ApplicationReference[]>>((groups, reference) => {
    (groups[reference.kind] ||= []).push(reference);
    return groups;
  }, {});
  return (
    <Show when={props.page} fallback={<div class="application-empty"><strong>Select a page</strong><span>Choose a page in the map to inspect it.</span></div>}>
      {(page) => <div class="application-inspector-body">
        <p class="application-panel-kicker">Page inspector</p>
        <h2>{page().title}</h2>
        <Show when={page().route}><p class="application-route"><code>{page().route}</code></p></Show>
        <p class="application-purpose">{page().purpose || "No purpose provided yet."}</p>
        <Show when={object()}>
          {(primary) => <section class="application-detail-section"><h3>Primary object</h3><button class="application-primary-object" type="button" onClick={() => props.onSelectObject(primary().id)}><strong>{primary().title}</strong><Show when={primary().detail}><span>{primary().detail}</span></Show></button></section>}
        </Show>
        <section class="application-detail-section"><h3>States · {page().states.length}</h3><Show when={page().states.length} fallback={<p class="application-muted">No states listed.</p>}><ul class="application-state-list"><For each={page().states}>{(state) => <li><button type="button" aria-pressed={props.selectedStateId === state.id} onClick={() => props.onSelectState(state.id)}><strong>{state.title}</strong><Show when={state.detail}><span>{state.detail}</span></Show></button></li>}</For></ul></Show></section>
        <section class="application-detail-section"><h3>Related diagrams and documents</h3><Show when={page().references.length} fallback={<p class="application-muted">No links added.</p>}><div class="application-reference-groups"><For each={Object.entries(references())}>{([kind, items]) => <section class="application-reference-group"><h4>{referenceTitles[kind as ApplicationReference["kind"]]}</h4><ul><For each={items}>{(reference) => { const targetId = reference.kind === "overview" ? reference.capabilityId : reference.kind === "flow" ? reference.nodeId : reference.kind === "wireframe" ? reference.screenId : undefined; const warning = props.referenceWarnings.find((candidate) => candidate.pageId === page().id && candidate.kind === reference.kind && candidate.path === reference.path && candidate.targetId === targetId && candidate.heading === (reference.kind === "document" ? reference.heading : undefined)); const href = !warning && props.documentPath && reference.kind !== "document" ? referenceHref(reference, { path: props.documentPath, pageId: page().id, ...(props.selectedStateId ? { stateId: props.selectedStateId } : {}) }) : undefined; return <li><Show when={href} fallback={<span class="application-reference-inert"><code>{referenceLabel(reference)}</code><Show when={warning}><small role="status">{warning?.message}</small></Show></span>}>{(link) => <a href={link()} rel="external"><code>{referenceLabel(reference)}</code><span aria-hidden="true">↗</span></a>}</Show></li> }}</For></ul></section>}</For></div></Show></section>
      </div>}
    </Show>
  );
}

export function ApplicationWorkbench(props: ApplicationWorkbenchProps) {
  type ApplicationSource = { document: ApplicationDocument; sourceText: string; sourceHash: string; warnings?: ApplicationWarning[] };
  const [currentDocument, setCurrentDocument] = createSignal(props.document);
  const [sourceText, setSourceText] = createSignal(props.sourceText || "");
  const [acceptedSourceHash, setAcceptedSourceHash] = createSignal(props.sourceHash || "");
  const [referenceWarnings, setReferenceWarnings] = createSignal<readonly ApplicationReferenceWarning[]>(props.referenceWarnings || []);
  const [coverageWarnings, setCoverageWarnings] = createSignal<readonly ApplicationWarning[]>(props.coverageWarnings || []);
  const [refreshState, setRefreshState] = createSignal<SourceRefreshState<ApplicationSource>>({ status: "ready", value: { document: props.document, sourceText: props.sourceText || "", sourceHash: props.sourceHash || "", warnings: [...(props.referenceWarnings || []), ...(props.coverageWarnings || [])] }, revision: 0, stale: false });
  const [actionTarget, setActionTarget] = createSignal<HTMLElement>();
  const [mapView, setMapView] = createSignal<"network" | "pages">("network");
  const selectMapView = (view: "network" | "pages") => {
    setMapView(view);
    const url = new URL(window.location.href);
    url.searchParams.set("map", view);
    window.history.pushState(window.history.state, "", url);
  };
  const [selectedPageId, setSelectedPageId] = createSignal(props.document.pages[0]?.id);
  const selectedPage = () => currentDocument().pages.find((page) => page.id === selectedPageId()) || currentDocument().pages[0];
  const [selectedObjectId, setSelectedObjectId] = createSignal<string>();
  const selectedObject = () => currentDocument().objects.find((object) => object.id === selectedObjectId());
  const [selectedStateId, setSelectedStateId] = createSignal<string>();
  const [selectionNotice, setSelectionNotice] = createSignal<string>();
  const [activeTab, setActiveTab] = createSignal<"inspector" | "source">("inspector");
  const stale = createMemo(() => refreshState().stale || refreshState().status === "error");
  let refreshSource = () => Promise.resolve();
  const updateSelectionUrl = (pageId: string, stateId?: string, replace = false) => {
    const url = composeApplicationSelectionUrl(window.location.href, { pageId, ...(stateId ? { stateId } : {}) });
    window.history[replace ? "replaceState" : "pushState"]({ ...window.history.state, applicationPage: pageId, applicationState: stateId }, "", url);
  };
  const selectPage = (id: string) => {
    const page = currentDocument().pages.find((candidate) => candidate.id === id);
    if (!page) return;
    setSelectedObjectId(undefined);
    setActiveTab("inspector");
    setSelectedPageId(id);
    const stateId = page.states[0]?.id;
    setSelectedStateId(stateId);
    updateSelectionUrl(id, stateId);
  };
  const selectObject = (id: string) => {
    if (!currentDocument().objects.some((object) => object.id === id)) return;
    setSelectedObjectId(id);
    setActiveTab("inspector");
  };
  const selectState = (id: string) => {
    if (!selectedPage()?.states.some((state) => state.id === id)) return;
    setSelectedStateId(id);
    updateSelectionUrl(selectedPage()!.id, id);
  };
  const handleTabKeyDown = (event: KeyboardEvent) => {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
    event.preventDefault();
    const next = activeTab() === "inspector" ? "source" : "inspector";
    setActiveTab(next);
    window.document.getElementById(`application-${next}-tab`)?.focus();
  };

  onMount(() => {
    setActionTarget(window.document.getElementById("workspace-actions") || undefined);
    const syncLocation = () => {
      const params = new URLSearchParams(window.location.search);
      setMapView(params.get("map") === "pages" ? "pages" : "network");
      const selection = parseApplicationSelection(params);
      const requestedPage = selection?.pageId || params.get("page") || undefined;
      const page = currentDocument().pages.find((candidate) => candidate.id === requestedPage) || currentDocument().pages[0];
      const requestedState = selection?.stateId || params.get("state") || undefined;
      const state = page?.states.find((candidate) => candidate.id === requestedState);
      setSelectedPageId(page?.id);
      setSelectedStateId(state?.id);
      setSelectedObjectId(undefined);
      if (requestedPage && page?.id !== requestedPage) {
        setSelectionNotice(`Page "${requestedPage}" is no longer available. Showing the first page.`);
        if (page) updateSelectionUrl(page.id, state?.id, true);
      } else if (requestedState && !state) {
        setSelectionNotice(`State "${requestedState}" is no longer available. Showing the page without a state selection.`);
        if (page) updateSelectionUrl(page.id, undefined, true);
      } else {
        setSelectionNotice(undefined);
        if (!requestedPage && page) updateSelectionUrl(page.id, state?.id, true);
      }
    };
    syncLocation();
    window.addEventListener("popstate", syncLocation);
    const appWindow = window as ApplicationWindow;
    onCleanup(() => { window.removeEventListener("popstate", syncLocation); if (appWindow.__flowWorkbenchReady?.status === "ready") delete appWindow.__flowWorkbenchReady; });
    const loader = props.loadSource;
    if (!loader) return;
    const controller = createSourceRefresh<ApplicationSource>({
      load: loader,
      initialValue: refreshState().value,
      onState: (state) => {
        setRefreshState(state);
        if (!state.value || state.status !== "ready") return;
        const warnings = state.value.warnings || [];
        setReferenceWarnings(warnings.filter((warning): warning is ApplicationReferenceWarning => warning.code.startsWith("APPLICATION_REFERENCE_")));
        setCoverageWarnings(warnings.filter((warning) => !warning.code.startsWith("APPLICATION_REFERENCE_")));
        const unchanged = state.value.sourceHash === acceptedSourceHash() && state.value.sourceText === sourceText();
        setAcceptedSourceHash(state.value.sourceHash);
        if (!unchanged) {
          setCurrentDocument(state.value.document);
          setSourceText(state.value.sourceText);
          if (selectedObjectId() && !state.value.document.objects.some((object) => object.id === selectedObjectId())) setSelectedObjectId(undefined);
          const nextPage = state.value.document.pages.find((page) => page.id === selectedPageId()) || state.value.document.pages[0];
          if (nextPage?.id !== selectedPageId()) {
            setSelectedPageId(nextPage?.id);
            setSelectedStateId(nextPage?.states[0]?.id);
            setSelectionNotice("The selected page was removed. Showing the first available page.");
            if (nextPage) updateSelectionUrl(nextPage.id, nextPage.states[0]?.id, true);
          } else if (selectedStateId() && !nextPage?.states.some((state) => state.id === selectedStateId())) {
            setSelectedStateId(undefined);
            setSelectionNotice("The selected page state was removed. Showing the page without a state selection.");
            if (nextPage) updateSelectionUrl(nextPage.id, undefined, true);
          }
        }
      },
    });
    refreshSource = controller.refresh;
    const refreshOnFocus = () => void controller.refresh();
    const updateVisibility = () => controller.setVisible(window.document.visibilityState === "visible");
    window.addEventListener("focus", refreshOnFocus);
    window.document.addEventListener("visibilitychange", updateVisibility);
    controller.start();
    onCleanup(() => { window.removeEventListener("focus", refreshOnFocus); window.document.removeEventListener("visibilitychange", updateVisibility); controller.dispose(); });
  });

  return (
    <div class="app application-app" classList={{ "application-network-view": mapView() === "network" }}>
      <Show when={actionTarget()}>{(target) => <Portal mount={target()}><ApplicationActions warnings={coverageWarnings()} stale={stale()} loading={refreshState().status === "loading"} canExport={Boolean(sourceText())} onReload={() => void refreshSource()} onExport={() => downloadSource(currentDocument(), sourceText())} /></Portal>}</Show>
      <main class="application-main"><div class="application-content">
        <Show when={refreshState().error}><div class="application-source-alert" classList={{ stale: stale() }} role="alert"><strong>{stale() ? "Source changed with errors" : "Could not load source"}</strong><span>{refreshState().error?.message}</span><button class="btn" type="button" onClick={() => void refreshSource()}>Retry</button></div></Show>
        <div class="application-heading"><div><div class="application-title-row"><h1>{currentDocument().title}</h1></div><Show when={currentDocument().purpose}><p>{currentDocument().purpose}</p></Show></div></div>
        <div class="application-map-views" role="group" aria-label="Application map view"><button class="btn" type="button" aria-pressed={mapView() === "network"} onClick={() => selectMapView("network")}>Network</button><button class="btn" type="button" aria-pressed={mapView() === "pages"} onClick={() => selectMapView("pages")}>Pages and objects</button></div>
        <section class="application-page-graph" aria-labelledby="application-page-graph-title">
          <div class="application-section-heading"><div><h2 id="application-page-graph-title">{mapView() === "network" ? "Pages and objects network" : "Pages"}</h2><p>{mapView() === "network" ? "Explore navigation, ownership, and primary objects. Hover or focus a number for link details." : "Follow page links from left to right. Hover or focus a number for transition details."}</p></div><span>{currentDocument().pages.length} pages · {mapView() === "network" ? `${currentDocument().objects.length} objects` : `${currentDocument().navigation.length} transitions`}</span></div>
          <ApplicationPageGraph document={currentDocument()} network={mapView() === "network"} selectedPageId={selectedPageId()} selectedObjectId={selectedObjectId()} onSelect={selectPage} onSelectObject={selectObject} onReady={(ready) => { (window as ApplicationWindow).__flowWorkbenchReady = { status: ready ? "ready" : "loading", layoutEngine: "css-board" }; }} />
        </section>
        <Show when={mapView() === "pages"}><section class="application-object-rail" aria-labelledby="application-object-rail-title"><div class="application-section-heading"><div><h2 id="application-object-rail-title">Objects</h2><p>Conceptual records owned by the application or another object.</p></div><span>{currentDocument().objects.length} objects</span></div><div class="application-object-list"><For each={currentDocument().objects}>{(object) => { const owned = currentDocument().ownership.filter((relation) => relation.objectId === object.id); return <article class="application-object-card" classList={{ selected: selectedObjectId() === object.id }} role="button" tabIndex={0} aria-pressed={selectedObjectId() === object.id} onClick={() => selectObject(object.id)} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); selectObject(object.id); } }}><h3>{object.title}</h3><Show when={object.detail}><p>{object.detail}</p></Show><Show when={owned.length} fallback={<span class="application-object-owner">No owner specified</span>}><For each={owned}>{(relation) => <span class="application-object-owner">Owned by {relation.ownerId === currentDocument().id ? currentDocument().title : currentDocument().objects.find((item) => item.id === relation.ownerId)?.title || relation.ownerId} · {relation.cardinality}</span>}</For></Show></article> }}</For></div></section></Show>
        <Show when={selectionNotice()}><p class="application-footnote" role="status">{selectionNotice()}</p></Show>

      </div></main>
      <aside class="sidebar application-sidebar" aria-label="Application details and source"><div class="sidebar-tabs" role="tablist" aria-label="Application sidebar views"><button class="sidebar-tab" id="application-inspector-tab" type="button" role="tab" aria-controls="application-inspector-panel" aria-selected={activeTab() === "inspector"} tabIndex={activeTab() === "inspector" ? 0 : -1} onClick={() => setActiveTab("inspector")} onKeyDown={handleTabKeyDown}>Inspector</button><button class="sidebar-tab" id="application-source-tab" type="button" role="tab" aria-controls="application-source-panel" aria-selected={activeTab() === "source"} tabIndex={activeTab() === "source" ? 0 : -1} onClick={() => setActiveTab("source")} onKeyDown={handleTabKeyDown}>Source</button></div><div class="application-sidebar-content"><section class="sidebar-panel application-sidebar-panel" id="application-inspector-panel" role="tabpanel" aria-labelledby="application-inspector-tab" hidden={activeTab() !== "inspector"}><Show when={selectedObject()} fallback={<PageInspector document={currentDocument()} page={selectedPage()} selectedStateId={selectedStateId()} documentPath={props.documentPath} referenceWarnings={referenceWarnings()} onSelectState={selectState} onSelectObject={selectObject} />}>{(object) => <ObjectInspector document={currentDocument()} object={object()} onSelectObject={selectObject} onSelectPage={selectPage} />}</Show></section><section class="sidebar-panel application-sidebar-panel" id="application-source-panel" role="tabpanel" aria-labelledby="application-source-tab" hidden={activeTab() !== "source"}><div class="application-source-body"><p class="application-panel-kicker">Read only</p><h2>Source</h2><p class="application-muted">Source for this application map.</p><pre class="application-source-code"><code>{sourceText() || "Source text is unavailable for this document."}</code></pre><p class="application-source-note">Edit the source file, then reload to see changes.</p></div></section></div></aside>
    </div>
  );
}
