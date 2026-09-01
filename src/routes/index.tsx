import { createResource, createSignal, For, onCleanup, onMount, Show } from "solid-js";
import { OverviewWorkbench, type OverviewSourceResult } from "../components/OverviewWorkbench";
import { Workbench, type FlowReturnContext } from "../components/Workbench";
import type { DiagramCatalog, DiagramDocumentResponse, DiagramLoadError } from "../types/diagram";
import { diagramToDsl } from "../lib/diagram-dsl";
import { parseOverviewOrigin } from "../lib/overview-navigation";
import type { FlowDocument } from "../types/graph";
import type { OverviewDocument } from "../types/overview";

type LoadedDiagramResponse = (Extract<DiagramDocumentResponse, { type: "flow" }> | Extract<DiagramDocumentResponse, { type: "overview" }>) & {
  source?: string;
  canonicalSource?: string;
  sourceText?: string;
};

function overviewWarnings(response: LoadedDiagramResponse) {
  if (response.type !== "overview") return [];
  return "warnings" in response ? response.warnings || [] : [];
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
  const response = await loadDiagram(origin.path, undefined, origin.viewId);
  if (response.type !== "overview") throw new Error("The return context is not an overview. Open the flow without its stale context.");
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

function overviewSourceResult(response: LoadedDiagramResponse, path: string): OverviewSourceResult {
  if (response.type !== "overview") throw new DiagramTypeChangedError(path);
  return {
    document: response.document,
    sourceText: response.canonicalSource || response.sourceText || response.source || diagramToDsl(response),
    sourceHash: response.sourceHash,
    warnings: response.warnings || [],
  };
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

function DiagramPicker(props: { catalog?: DiagramCatalog; error?: Error; loading: boolean; onRetry?: () => void }) {
  const overviews = () => props.catalog?.diagrams.filter((diagram) => diagram.type === "overview") || [];
  const flows = () => props.catalog?.diagrams.filter((diagram) => diagram.type === "flow" && diagram.valid) || [];
  const other = () => props.catalog?.diagrams.filter((diagram) => diagram.type !== "overview" && !(diagram.type === "flow" && diagram.valid)) || [];
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
            <h1 id="flow-picker-title">Project index</h1>
            <p>
              <Show when={props.catalog} fallback="Searching this folder and its subfolders…">
                {(catalog) => <>Choose an overview or flow from {catalog().rootName}.</>}
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
            <Show when={overviews().length}><section class="flow-picker-section" aria-labelledby="flow-picker-overviews"><h2 id="flow-picker-overviews">Overviews</h2>{list(overviews())}</section></Show>
            <Show when={flows().length}><section class="flow-picker-section" aria-labelledby="flow-picker-flows"><h2 id="flow-picker-flows">Flows</h2>{list(flows())}</section></Show>
            <Show when={other().length}><section class="flow-picker-section" aria-labelledby="flow-picker-other"><h2 id="flow-picker-other">Other diagram files</h2>{list(other())}</section></Show>
          </div>
        </Show>
      </section>
    </main>
  );
}

export default function Home() {
  const [selectedPath, setSelectedPath] = createSignal<string | null>();
  const [flowReturnContext, setFlowReturnContext] = createSignal<FlowReturnContext>();
  const [catalog, { refetch: refetchCatalog }] = createResource(() => selectedPath() === undefined ? undefined : "catalog", loadCatalog);
  const [diagram, { refetch: refetchDiagram }] = createResource(() => selectedPath() || undefined, (path) => loadDiagram(path));

  onMount(() => {
    let locationRevision = 0;
    const syncLocation = () => {
      const revision = ++locationRevision;
      const query = new URLSearchParams(window.location.search);
      const path = query.get("diagram") || query.get("flow");
      setSelectedPath(path);
      setFlowReturnContext(undefined);
      if (!path) return;
      void loadFlowReturnContext(window.location.search).then((context) => {
        if (revision === locationRevision) setFlowReturnContext(context);
      }).catch(() => {
        if (revision === locationRevision) setFlowReturnContext(undefined);
      });
    };
    syncLocation();
    window.addEventListener("popstate", syncLocation);
    onCleanup(() => window.removeEventListener("popstate", syncLocation));
  });

  return (
    <Show when={selectedPath() !== undefined} fallback={<StartupState message="Preparing the diagram catalog…" />}>
      <Show when={selectedPath()} fallback={<DiagramPicker catalog={catalog.error ? undefined : catalog()} error={catalog.error} loading={catalog.loading} onRetry={() => void refetchCatalog()} />}>
        <Show when={diagram.error ? undefined : diagram()} fallback={<StartupState message={diagram.error?.message || "Loading the selected diagram…"} showBack={Boolean(diagram.error)} onRetry={() => void refetchDiagram()} />}>
          {(loaded) => (
            <Show when={loaded().type === "overview"} fallback={<Workbench initialGraph={loaded().document as FlowDocument} documentKey={`${loaded().workspaceId}:${loaded().path}`} documentPath={loaded().path} returnContext={flowReturnContext()} />}>
              <OverviewWorkbench
                document={loaded().document as OverviewDocument}
                sourceText={loaded().type === "overview" ? (loaded().canonicalSource || loaded().sourceText || loaded().source || diagramToDsl(loaded())) : ""}
                documentPath={loaded().path}
                workspaceId={loaded().workspaceId}
                catalog={catalog()}
                resolveFlowReference={resolveOverviewFlowReference}
                sourceHash={loaded().sourceHash}
                referenceWarnings={overviewWarnings(loaded())}
                loadSource={(signal) => loadDiagram(loaded().path, signal).then((response) => overviewSourceResult(response, loaded().path))}
              />
            </Show>
          )}
        </Show>
      </Show>
    </Show>
  );
}
