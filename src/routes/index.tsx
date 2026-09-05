import { createEffect, createResource, createSignal, For, onCleanup, onMount, Show, type JSX } from "solid-js";
import { OverviewWorkbench, type OverviewSourceResult } from "../components/OverviewWorkbench";
import { ApplicationWorkbench } from "../components/ApplicationWorkbench";
import { Workbench } from "../components/Workbench";
import { WireframeWorkbench } from "../components/WireframeWorkbench";
import type { DiagramCatalog, DiagramDocumentResponse, DiagramLoadError } from "../types/diagram";
import { diagramToDsl } from "../lib/diagram-dsl";
import { composeApplicationOverviewUrl, composeApplicationUrl, composeFlowUrl, composeOverviewUrl, composeWireframeUrl, parseApplicationOrigin, parseOverviewOrigin } from "../lib/overview-navigation";
import { projectWorkspaceNavigation, selectWorkspaceEntry, type WorkspaceNavigationCapability, type WorkspaceNavigationProjection } from "../lib/workspace-navigation";
import type { FlowDocument } from "../types/graph";
import type { ApplicationDocument, ApplicationReferenceWarning, ApplicationWarning } from "../types/application";
import type { OverviewDocument } from "../types/overview";
import type { WireframeDocument } from "../types/wireframe";

type LoadedDiagramResponse = DiagramDocumentResponse & {
  source?: string;
  canonicalSource?: string;
  sourceText?: string;
};

interface FlowReturnContext {
  overviewPath: string;
  overviewTitle: string;
  capabilityId: string;
  capabilityTitle?: string;
  viewId?: string;
  viewTitle?: string;
  notice?: string;
}

interface ApplicationReturnContext {
  applicationPath: string;
  applicationTitle: string;
  pageId: string;
  pageTitle?: string;
  stateId?: string;
  stateTitle?: string;
  notice?: string;
}

function overviewWarnings(response: LoadedDiagramResponse) {
  if (response.type !== "overview") return [];
  return "warnings" in response ? response.warnings || [] : [];
}

function applicationWarnings(response: LoadedDiagramResponse) {
  if (response.type !== "application") return [];
  return response.warnings || [];
}

function applicationReferenceWarnings(response: LoadedDiagramResponse): ApplicationReferenceWarning[] {
  return applicationWarnings(response).filter((warning): warning is ApplicationReferenceWarning => warning.code.startsWith("APPLICATION_REFERENCE_"));
}

function applicationCoverageWarnings(response: LoadedDiagramResponse): ApplicationWarning[] {
  return applicationWarnings(response).filter((warning) => !warning.code.startsWith("APPLICATION_REFERENCE_"));
}

class DiagramTypeChangedError extends Error {
  readonly status = 409;
  readonly code = "DIAGRAM_TYPE_CHANGED";

  constructor(path: string) {
    super(`The source type for ${path} changed. It is no longer an overview. Retry or choose another diagram.`);
    this.name = "DiagramTypeChangedError";
  }
}

async function responseError(response: Response): Promise<Error> {
  const body = await response.json().catch(() => null) as DiagramLoadError | null;
  const details = body?.diagnostics
    ?.map((diagnostic) => `Line ${diagnostic.line}:${diagnostic.column} — ${diagnostic.message}`)
    .join("\n");
  const error = new Error([body?.error || `The diagram server returned ${response.status}.`, details].filter(Boolean).join("\n")) as Error & { status?: number };
  error.status = response.status;
  return error;
}

async function loadCatalog(): Promise<DiagramCatalog> {
  const response = await fetch("/api/diagrams");
  if (!response.ok) throw await responseError(response);
  return response.json() as Promise<DiagramCatalog>;
}

async function loadDiagram(path: string, signal?: AbortSignal, variant?: string): Promise<LoadedDiagramResponse> {
  const params = new URLSearchParams({ path });
  if (variant) params.set("variant", variant);
  const response = await fetch(`/api/diagram?${params.toString()}`, { cache: "no-store", signal });
  if (!response.ok) throw await responseError(response);
  return response.json() as Promise<LoadedDiagramResponse>;
}

async function loadFlowReturnContext(search: string): Promise<FlowReturnContext | undefined> {
  const origin = parseOverviewOrigin(new URLSearchParams(search));
  if (!origin) return undefined;
  let response: LoadedDiagramResponse;
  try {
    response = await loadDiagram(origin.path, undefined, origin.viewId);
  } catch {
    return {
      overviewPath: origin.path,
      overviewTitle: "Overview unavailable",
      capabilityId: origin.capabilityId,
      ...(origin.viewId ? { viewId: origin.viewId } : {}),
      notice: "This overview is no longer available. Open the flow without its stale context.",
    };
  }
  if (response.type !== "overview") {
    return {
      overviewPath: origin.path,
      overviewTitle: "Overview unavailable",
      capabilityId: origin.capabilityId,
      ...(origin.viewId ? { viewId: origin.viewId } : {}),
      notice: "This overview is no longer an overview document. Open the flow without its stale context.",
    };
  }
  const overviewView = response.view || response.document;
  const capabilities = [
    ...overviewView.groups.flatMap((group) => group.capabilities),
    ...(overviewView.capabilities || []),
  ];
  const capability = capabilities.find((candidate) => candidate.id === origin.capabilityId);
  const view = origin.viewId && response.activeVariant === origin.viewId ? response.document.variants?.find((candidate) => candidate.id === origin.viewId) : undefined;
  return {
    overviewPath: response.path,
    overviewTitle: response.document.title,
    capabilityId: origin.capabilityId,
    ...(capability ? { capabilityTitle: capability.title } : {}),
    ...(view ? { viewId: view.id, viewTitle: view.title } : {}),
    ...(!capability ? { notice: "This capability is no longer in the overview." } : {}),
    ...(origin.viewId && !view ? { notice: "This overview view is no longer available; return to its base view." } : {}),
  };
}

async function loadApplicationReturnContext(search: string): Promise<ApplicationReturnContext | undefined> {
  const origin = parseApplicationOrigin(new URLSearchParams(search));
  if (!origin) return undefined;
  try {
    const response = await loadDiagram(origin.path);
    if (response.type !== "application") return { applicationPath: origin.path, applicationTitle: "Application unavailable", pageId: origin.pageId, ...(origin.stateId ? { stateId: origin.stateId } : {}), notice: "This application map is no longer available." };
    const page = response.document.pages.find((candidate) => candidate.id === origin.pageId);
    const state = page?.states.find((candidate) => candidate.id === origin.stateId);
    return {
      applicationPath: response.path,
      applicationTitle: response.document.title,
      pageId: origin.pageId,
      ...(page ? { pageTitle: page.title } : {}),
      ...(state ? { stateId: state.id, stateTitle: state.title } : {}),
      ...(!page ? { notice: "This page is no longer in the application map." } : {}),
      ...(page && origin.stateId && !state ? { notice: "This page state is no longer in the application map." } : {}),
    };
  } catch {
    return { applicationPath: origin.path, applicationTitle: "Application unavailable", pageId: origin.pageId, ...(origin.stateId ? { stateId: origin.stateId } : {}), notice: "This application map is no longer available." };
  }
}

async function resolveOverviewFlowReference(reference: { path: string; variant?: string }) {
  const response = await loadDiagram(reference.path);
  if (response.type !== "flow") throw new Error("This linked diagram is not a flow. Choose another source or retry after repairing the reference.");
  if (reference.variant && !response.document.variants.some((variant) => variant.id === reference.variant)) {
    throw new Error(`Flow view "${reference.variant}" is no longer available. Choose the base flow or repair the reference.`);
  }
  return {
    path: response.path,
    title: response.document.graph.title,
    ...(reference.variant ? { variant: reference.variant } : {}),
  };
}

async function resolveOverviewWireframeReference(reference: { path: string; screen?: string }) {
  const response = await loadDiagram(reference.path);
  if (response.type !== "wireframe") throw new Error("This linked diagram is not a wireframe. Choose another source or retry after repairing the reference.");
  const screen = reference.screen && response.document.screens.find((candidate) => candidate.id === reference.screen);
  if (reference.screen && !screen) throw new Error(`Wireframe screen "${reference.screen}" is no longer available. Choose another screen or repair the reference.`);
  return { path: response.path, title: response.document.title, ...(screen ? { screen: screen.id, screenTitle: screen.title } : {}) };
}

function overviewSourceResult(response: LoadedDiagramResponse, path: string): OverviewSourceResult {
  if (response.type !== "overview") throw new DiagramTypeChangedError(path);
  return {
    document: response.document,
    sourceText: response.canonicalSource || response.sourceText || response.source || diagramToDsl(response),
    sourceHash: response.sourceHash,
    warnings: response.warnings || [],
  };
}

function applicationSourceResult(response: LoadedDiagramResponse, path: string) {
  if (response.type !== "application") throw new Error(`The source type for ${path} changed. It is no longer an application map.`);
  return { document: response.document, sourceText: response.canonicalSource || response.sourceText || response.source || diagramToDsl(response), sourceHash: response.sourceHash, warnings: response.warnings || [] };
}

function StartupState(props: { message: string; showBack?: boolean; onRetry?: () => void }) {
  return (
    <main class="startup-state">
      <div class="startup-mark" aria-hidden="true">↳</div>
      <h1>User Flow Workbench</h1>
      <p>{props.message}</p>
      <Show when={props.onRetry}>
        <button class="btn primary" type="button" onClick={props.onRetry}>Retry</button>
      </Show>
      <Show when={props.showBack}>
        <a class="btn" href="/" rel="external">Choose another diagram</a>
      </Show>
    </main>
  );
}

function DiagramPicker(props: { catalog?: DiagramCatalog; error?: Error; loading: boolean; mode: "application-chooser" | "overview-chooser" | "inventory"; onRetry?: () => void }) {
  const chooser = () => props.mode !== "inventory";
  const applicationChooser = () => props.mode === "application-chooser";
  const overviews = () => props.catalog?.diagrams.filter((diagram) => diagram.type === "overview" && !applicationChooser() && (!chooser() || diagram.valid)) || [];
  const wireframes = () => props.catalog?.diagrams.filter((diagram) => !chooser() && diagram.type === "wireframe" && diagram.valid) || [];
  const flows = () => props.catalog?.diagrams.filter((diagram) => !chooser() && diagram.type === "flow" && diagram.valid) || [];
  const applications = () => props.catalog?.diagrams.filter((diagram) => diagram.type === "application" && (!chooser() || applicationChooser()) && diagram.valid) || [];
  const other = () => props.catalog?.diagrams.filter((diagram) => diagram.type !== "overview" && !((diagram.type === "flow" || diagram.type === "wireframe" || diagram.type === "application") && diagram.valid)) || [];
  const list = (diagrams: readonly DiagramCatalog["diagrams"][number][]) => (
    <div class="flow-list">
      <For each={diagrams}>
        {(diagram) => (
          <a class="flow-list-row" href={`/?diagram=${encodeURIComponent(diagram.path)}`} rel="external">
            <span class="flow-file-icon" aria-hidden="true"><i /><i /><i /></span>
            <span class="flow-list-copy"><strong>{diagram.title}</strong><span>{diagram.path}</span></span>
            <Show when={diagram.valid} fallback={<span class="flow-status invalid">{diagram.diagnosticCount} {diagram.diagnosticCount === 1 ? "error" : "errors"}</span>}><span class="flow-status">Open</span></Show>
            <svg viewBox="0 0 16 16" aria-hidden="true"><path d="m6 3 5 5-5 5" /></svg>
          </a>
        )}
      </For>
    </div>
  );
  return (
    <main class="flow-picker-shell">
      <section class="flow-picker" aria-labelledby="flow-picker-title">
        <header class="flow-picker-head">
          <div class="flow-picker-mark" aria-hidden="true"><span /><span /><span /></div>
          <div>
            <p class="flow-picker-product">User Flow Workbench</p>
            <h1 id="flow-picker-title">{chooser() ? `Choose an ${applicationChooser() ? "application map" : "overview"}` : "Project index"}</h1>
            <p>
              <Show when={props.catalog} fallback="Searching this folder and its subfolders…">
              {(catalog) => <>{chooser() ? <>Choose the project {applicationChooser() ? "application map" : "overview"} for {catalog().rootName}.</> : <>Choose an application map, wireframe, overview, or flow from {catalog().rootName}.</>}</>}
              </Show>
            </p>
          </div>
        </header>
        <Show when={props.error}>
          {(error) => <div class="flow-picker-error" role="alert"><span>{error().message}</span><Show when={props.onRetry}><button class="btn" type="button" onClick={props.onRetry}>Retry</button></Show></div>}
        </Show>
        <Show when={!props.loading && props.catalog?.diagrams.length === 0}>
          <div class="flow-picker-empty"><strong>No .diagram files found</strong><span>Add a diagram file below this folder, then refresh this page.</span></div>
        </Show>
        <Show when={props.catalog?.diagrams.length}>
          <div class="flow-picker-sections" aria-label="Project diagrams">
            <Show when={overviews().length}><section class="flow-picker-section" aria-labelledby="flow-picker-overviews"><h2 id="flow-picker-overviews">{chooser() ? "Project overviews" : "Overviews"}</h2>{list(overviews())}</section></Show>
            <Show when={wireframes().length}><section class="flow-picker-section" aria-labelledby="flow-picker-wireframes"><h2 id="flow-picker-wireframes">Wireframes</h2>{list(wireframes())}</section></Show>
            <Show when={flows().length}><section class="flow-picker-section" aria-labelledby="flow-picker-flows"><h2 id="flow-picker-flows">Flows</h2>{list(flows())}</section></Show>
            <Show when={applications().length}><section class="flow-picker-section" aria-labelledby="flow-picker-applications"><h2 id="flow-picker-applications">{applicationChooser() ? "Project application maps" : "Applications"}</h2>{list(applications())}</section></Show>
            <Show when={other().length}><section class="flow-picker-section" aria-labelledby="flow-picker-other"><h2 id="flow-picker-other">Other diagram files</h2>{list(other())}</section></Show>
          </div>
        </Show>
      </section>
    </main>
  );
}

function navigationHref(path: string) {
  return `/?diagram=${encodeURIComponent(path)}`;
}

function projectInventoryNavigation(catalog: DiagramCatalog): WorkspaceNavigationProjection {
  return {
    groups: [],
    ungroupedCapabilities: [],
    allDiagrams: [...catalog.diagrams],
    notLinkedHere: catalog.diagrams.filter((entry) => entry.valid && (entry.type === "flow" || entry.type === "wireframe")),
  };
}

function WorkspaceNavigator(props: { projection: WorkspaceNavigationProjection; activeCapabilityId?: string; activeViewId?: string; applicationReturnContext?: ApplicationReturnContext }) {
  let menu!: HTMLDetailsElement;
  onMount(() => {
    const dismiss = (event: PointerEvent) => {
      if (menu.open && !event.composedPath().includes(menu)) menu.open = false;
    };
    document.addEventListener("pointerdown", dismiss);
    onCleanup(() => document.removeEventListener("pointerdown", dismiss));
  });
  const overviewPath = () => props.projection.overview?.path;
  const applicationOrigin = () => props.applicationReturnContext ? { path: props.applicationReturnContext.applicationPath, pageId: props.applicationReturnContext.pageId, ...(props.applicationReturnContext.stateId ? { stateId: props.applicationReturnContext.stateId } : {}) } : undefined;
  const capabilityHref = (capability: WorkspaceNavigationCapability) => overviewPath()
    ? applicationOrigin() ? composeApplicationOverviewUrl(overviewPath()!, capability.id, applicationOrigin()!) : `/?diagram=${encodeURIComponent(overviewPath()!)}&capability=${encodeURIComponent(capability.id)}${props.activeViewId ? `&variant=${encodeURIComponent(props.activeViewId)}` : ""}`
    : "/";
  const origin = (capability: WorkspaceNavigationCapability) => overviewPath() ? { path: overviewPath()!, capabilityId: capability.id, ...(props.activeViewId ? { viewId: props.activeViewId } : {}) } : undefined;
  const capabilityLinks = (capability: WorkspaceNavigationCapability) => (
    <div class="workspace-capability-links">
      <For each={capability.relatedFlows}>{(flow) => <Show when={flow.valid && flow.type === "flow"} fallback={<span class="workspace-nav-warning">Flow unavailable · {flow.path}</span>}><a href={composeFlowUrl(flow.path, flow.variant, origin(capability), applicationOrigin())} rel="external">Flow · {flow.title}{flow.variant ? ` · ${flow.variant}` : ""}</a></Show>}</For>
      <For each={capability.relatedWireframeScreens}>{(screen) => <Show when={screen.valid && screen.type === "wireframe"} fallback={<span class="workspace-nav-warning">Screen unavailable · {screen.path}</span>}><a href={composeWireframeUrl(screen.path, screen.screen, origin(capability), applicationOrigin())} rel="external">Screen · {screen.title}{screen.screen ? ` · ${screen.screen}` : ""}</a></Show>}</For>
    </div>
  );
  const capabilityGroup = (capability: WorkspaceNavigationCapability) => <li><a class="workspace-capability-link" classList={{ selected: props.activeCapabilityId === capability.id }} href={capabilityHref(capability)} rel="external"><span>{capability.title}</span><Show when={props.activeCapabilityId === capability.id}><span aria-hidden="true">Selected</span></Show></a><Show when={props.activeCapabilityId === capability.id}>{capabilityLinks(capability)}</Show></li>;
  return <details ref={menu} class="workspace-project-menu">
    <summary>Navigate</summary>
    <nav class="workspace-project-menu-panel" aria-label="Overview navigation">
      <div class="workspace-project-menu-heading"><span>Overview</span><strong>{props.projection.overview?.title || "Project capabilities"}</strong></div>
      <div class="workspace-capability-groups"><For each={props.projection.groups}>{(group) => <section><h2>{group.title}</h2><ul>{ForEachCapability(group.capabilities, capabilityGroup)}</ul></section>}</For><Show when={props.projection.ungroupedCapabilities.length}><section><h2>Ungrouped capabilities</h2><ul>{ForEachCapability(props.projection.ungroupedCapabilities, capabilityGroup)}</ul></section></Show></div>
      <Show when={props.projection.notLinkedHere.length}>
        <details class="workspace-other-diagrams"><summary>Other diagrams · {props.projection.notLinkedHere.length}</summary><p class="workspace-nav-note">Not linked from this overview.</p><ul class="workspace-diagram-list"><For each={props.projection.notLinkedHere}>{(diagram) => <li><a href={navigationHref(diagram.path)} rel="external"><span>{diagram.title}</span><small>{diagram.path}</small></a></li>}</For></ul></details>
      </Show>
    </nav>
  </details>;
}

function ForEachCapability(capabilities: readonly WorkspaceNavigationCapability[], render: (capability: WorkspaceNavigationCapability) => JSX.Element) {
  return capabilities.map(render);
}

function WorkspaceShell(props: { catalog?: DiagramCatalog; loaded: LoadedDiagramResponse; returnContext?: FlowReturnContext; applicationReturnContext?: ApplicationReturnContext; navigation?: WorkspaceNavigationProjection; activeCapabilityId?: string; activeViewId?: string; children: JSX.Element }) {
  const [renderMode, setRenderMode] = createSignal(false);
  onMount(() => setRenderMode(new URLSearchParams(window.location.search).get("render") === "1"));
  const overviewHref = () => {
    if (props.applicationReturnContext) return composeApplicationUrl({ path: props.applicationReturnContext.applicationPath, pageId: props.applicationReturnContext.pageId, ...(props.applicationReturnContext.stateId ? { stateId: props.applicationReturnContext.stateId } : {}) });
    if (props.returnContext) return composeOverviewUrl({ path: props.returnContext.overviewPath, capabilityId: props.returnContext.capabilityId, viewId: props.returnContext.viewId });
    if (props.loaded.type === "overview") return `/?diagram=${encodeURIComponent(props.loaded.path)}`;
    if (props.loaded.type === "application") return composeApplicationUrl({ path: props.loaded.path, pageId: props.loaded.document.pages[0]?.id || "home" });
    const entry = props.catalog && selectWorkspaceEntry(props.catalog);
    return entry?.kind === "application" ? composeApplicationUrl({ path: entry.application.path, pageId: "home" }) : entry?.kind === "overview" ? `/?diagram=${encodeURIComponent(entry.overview.path)}` : "/";
  };
  const currentTitle = () => props.loaded.type === "flow"
    ? props.loaded.document.graph.title
    : props.loaded.document.title;
  return (
    <div class="workspace-shell" classList={{ "workspace-render-mode": renderMode() }}>
      <header class="workspace-header">
        <div class="workspace-brand"><strong>User Flow Workbench</strong><span>{props.catalog?.rootName || "Project"}</span></div>
        <nav class="workspace-nav" aria-label="Project navigation">
          <a href={overviewHref()} rel="external">{props.applicationReturnContext?.applicationTitle || props.returnContext?.overviewTitle || (props.loaded.type === "overview" ? "Project home" : "Overview")}</a>
          <a href="/?inventory=1" rel="external">All diagrams</a>
          <Show when={props.navigation}>
            {(navigation) => <WorkspaceNavigator projection={navigation()} activeCapabilityId={props.activeCapabilityId} activeViewId={props.activeViewId} applicationReturnContext={props.applicationReturnContext} />}
          </Show>
        </nav>
        <div class="workspace-current">
          <span>{props.loaded.type} · {currentTitle()}</span>
          <small>{props.loaded.path}</small>
        </div>
        <Show when={props.returnContext}>
          {(context) => <div class="workspace-context" role="status"><span>Capability</span><strong>{context().capabilityTitle || context().capabilityId}</strong><Show when={context().viewTitle}><small>View · {context().viewTitle}</small></Show><Show when={context().notice}><em>{context().notice}</em></Show></div>}
        </Show>
        <Show when={props.applicationReturnContext}>
          {(context) => <div class="workspace-context" role="status"><span>Application page</span><strong>{context().pageTitle || context().pageId}</strong><Show when={context().stateTitle}><small>State · {context().stateTitle}</small></Show><Show when={context().notice}><em>{context().notice}</em></Show></div>}
        </Show>
      </header>
      <div class="workspace-renderer">{props.children}</div>
    </div>
  );
}

export default function Home() {
  const [selectedPath, setSelectedPath] = createSignal<string | null>();
  const [flowReturnContext, setFlowReturnContext] = createSignal<FlowReturnContext>();
  const [applicationReturnContext, setApplicationReturnContext] = createSignal<ApplicationReturnContext>();
  const [overviewNavigation, setOverviewNavigation] = createSignal<WorkspaceNavigationProjection>();
  const [activeCapabilityId, setActiveCapabilityId] = createSignal<string>();
  const [activeViewId, setActiveViewId] = createSignal<string>();
  const [catalog, { refetch: refetchCatalog }] = createResource(() => selectedPath() === undefined ? undefined : "catalog", loadCatalog);
  const [diagram, { refetch: refetchDiagram }] = createResource(() => selectedPath() || undefined, (path) => loadDiagram(path));
  const [projectNavigation] = createResource(() => {
    const currentCatalog = catalog();
    const currentDiagram = diagram();
    if (!currentCatalog || !currentDiagram || currentDiagram.type === "overview") return;
    const context = flowReturnContext();
    const entry = selectWorkspaceEntry(currentCatalog);
    const path = context?.overviewPath || (entry.kind === "overview" ? entry.overview.path : undefined);
    return { catalog: currentCatalog, path, viewId: context?.viewId };
  }, async ({ catalog: currentCatalog, path, viewId }) => {
    if (!path) return projectInventoryNavigation(currentCatalog);
    try {
      const response = await loadDiagram(path, undefined, viewId);
      return response.type === "overview"
        ? projectWorkspaceNavigation(response.view || response.document, currentCatalog, path)
        : projectInventoryNavigation(currentCatalog);
    } catch {
      return projectInventoryNavigation(currentCatalog);
    }
  });
  const shellNavigation = () => {
    const currentCatalog = catalog();
    const currentDiagram = diagram();
    if (!currentCatalog || !currentDiagram) return;
    if (currentDiagram.type === "overview") {
      return overviewNavigation() || projectWorkspaceNavigation(currentDiagram.view || currentDiagram.document, currentCatalog, currentDiagram.path);
    }
    return projectNavigation() || projectInventoryNavigation(currentCatalog);
  };

  createEffect(() => {
    const currentPath = selectedPath();
    const currentCatalog = catalog();
    if (currentPath !== null || new URLSearchParams(window.location.search).get("inventory") === "1" || !currentCatalog || catalog.loading || catalog.error) return;
    const entry = selectWorkspaceEntry(currentCatalog);
    if (entry.kind !== "overview" && entry.kind !== "application") return;
    const url = new URL(window.location.href);
    url.searchParams.set("diagram", entry.kind === "application" ? entry.application.path : entry.overview.path);
    window.history.replaceState(window.history.state, "", url);
    setSelectedPath(entry.kind === "application" ? entry.application.path : entry.overview.path);
  });

  onMount(() => {
    let locationRevision = 0;
    const syncLocation = () => {
      const revision = ++locationRevision;
      const query = new URLSearchParams(window.location.search);
      const path = query.get("diagram") || query.get("flow");
      setSelectedPath(path);
      setFlowReturnContext(undefined);
      setApplicationReturnContext(undefined);
      setOverviewNavigation(undefined);
      setActiveCapabilityId(query.get("capability") || undefined);
      setActiveViewId(query.get("variant") || undefined);
      if (!path) return;
      void loadFlowReturnContext(window.location.search).then((context) => {
        if (revision === locationRevision) setFlowReturnContext(context);
      }).catch(() => {
        if (revision === locationRevision) setFlowReturnContext(undefined);
      });
      void loadApplicationReturnContext(window.location.search).then((context) => {
        if (revision === locationRevision) setApplicationReturnContext(context);
      }).catch(() => {
        if (revision === locationRevision) setApplicationReturnContext(undefined);
      });
    };
    syncLocation();
    window.addEventListener("popstate", syncLocation);
    onCleanup(() => window.removeEventListener("popstate", syncLocation));
  });

  return (
    <Show when={selectedPath() !== undefined} fallback={<StartupState message="Preparing the diagram catalog…" />}>
      <Show when={selectedPath()} fallback={<DiagramPicker catalog={catalog.error ? undefined : catalog()} error={catalog.error} loading={catalog.loading} mode={catalog() ? selectWorkspaceEntry(catalog()!).kind === "application-chooser" ? "application-chooser" : selectWorkspaceEntry(catalog()!).kind === "overview-chooser" ? "overview-chooser" : "inventory" : "inventory"} onRetry={() => void refetchCatalog()} />}>
        <Show when={diagram.error ? undefined : diagram()} fallback={<StartupState message={diagram.error?.message || "Loading the selected diagram…"} showBack={Boolean(diagram.error)} onRetry={() => void refetchDiagram()} />}>
          {(loaded) => (
            <WorkspaceShell catalog={catalog()} loaded={loaded()} returnContext={flowReturnContext()} applicationReturnContext={applicationReturnContext()} navigation={shellNavigation()} activeCapabilityId={activeCapabilityId()} activeViewId={activeViewId()}>
              <Show when={loaded().type === "application"} fallback={<Show when={loaded().type !== "wireframe"} fallback={<WireframeWorkbench document={loaded().document as WireframeDocument} />}>
              <Show when={loaded().type === "overview"} fallback={<Workbench initialGraph={loaded().document as FlowDocument} documentKey={`${loaded().workspaceId}:${loaded().path}`} />}>
                <OverviewWorkbench
                  document={loaded().document as OverviewDocument}
                  sourceText={loaded().type === "overview" ? (loaded().canonicalSource || loaded().sourceText || loaded().source || diagramToDsl(loaded())) : ""}
                  documentPath={loaded().path}
                  workspaceId={loaded().workspaceId}
                  catalog={catalog()}
                  resolveFlowReference={resolveOverviewFlowReference}
                  resolveWireframeReference={resolveOverviewWireframeReference}
                  sourceHash={loaded().sourceHash}
                  referenceWarnings={overviewWarnings(loaded())}
                  loadSource={(signal) => loadDiagram(loaded().path, signal).then((response) => overviewSourceResult(response, loaded().path))}
                  onNavigationChange={setOverviewNavigation}
                  onCapabilityChange={setActiveCapabilityId}
                  onVariantChange={setActiveViewId}
                />
              </Show>
              </Show>}>
                <ApplicationWorkbench document={loaded().document as ApplicationDocument} documentPath={loaded().path} sourceHash={loaded().sourceHash} referenceWarnings={applicationReferenceWarnings(loaded())} coverageWarnings={applicationCoverageWarnings(loaded())} sourceText={loaded().canonicalSource || loaded().sourceText || loaded().source || diagramToDsl(loaded())} loadSource={(signal) => loadDiagram(loaded().path, signal).then((response) => applicationSourceResult(response, loaded().path))} />
              </Show>
            </WorkspaceShell>
          )}
        </Show>
      </Show>
    </Show>
  );
}
