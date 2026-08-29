import { createResource, createSignal, For, onMount, Show } from "solid-js";
import { Workbench } from "../components/Workbench";
import type { FlowCatalog, FlowDocumentResponse, FlowLoadError } from "../types/flow-catalog";

async function responseError(response: Response): Promise<Error> {
  const body = await response.json().catch(() => null) as FlowLoadError | null;
  const details = body?.diagnostics
    ?.map((diagnostic) => `Line ${diagnostic.line}:${diagnostic.column} — ${diagnostic.message}`)
    .join("\n");
  return new Error([body?.error || `The graph server returned ${response.status}.`, details].filter(Boolean).join("\n"));
}

async function loadCatalog(): Promise<FlowCatalog> {
  const response = await fetch("/api/flows");
  if (!response.ok) throw await responseError(response);
  return response.json() as Promise<FlowCatalog>;
}

async function loadFlow(path: string): Promise<FlowDocumentResponse> {
  const response = await fetch(`/api/graph?path=${encodeURIComponent(path)}`);
  if (!response.ok) throw await responseError(response);
  return response.json() as Promise<FlowDocumentResponse>;
}

function StartupState(props: { message: string; showBack?: boolean }) {
  return (
    <main class="startup-state">
      <div class="startup-mark" aria-hidden="true">↳</div>
      <h1>User Flow Workbench</h1>
      <p>{props.message}</p>
      <Show when={props.showBack}>
        <a class="btn" href="/" rel="external">Choose another flow</a>
      </Show>
    </main>
  );
}

function FlowPicker(props: { catalog?: FlowCatalog; error?: Error; loading: boolean }) {
  return (
    <main class="flow-picker-shell">
      <section class="flow-picker" aria-labelledby="flow-picker-title">
        <header class="flow-picker-head">
          <div class="flow-picker-mark" aria-hidden="true">
            <span />
            <span />
            <span />
          </div>
          <div>
            <p class="flow-picker-product">User Flow Workbench</p>
            <h1 id="flow-picker-title">Choose a flow</h1>
            <p>
              <Show when={props.catalog} fallback="Searching this folder and its subfolders…">
                {(catalog) => <>Found {catalog().flows.length} flow {catalog().flows.length === 1 ? "file" : "files"} in <strong>{catalog().rootName}</strong>.</>}
              </Show>
            </p>
          </div>
        </header>

        <Show when={props.error}>
          {(error) => <div class="flow-picker-error" role="alert">{error().message}</div>}
        </Show>

        <Show when={!props.loading && props.catalog?.flows.length === 0}>
          <div class="flow-picker-empty">
            <strong>No .flow files found</strong>
            <span>Add a flow file below this folder, then refresh this page.</span>
          </div>
        </Show>

        <Show when={props.catalog?.flows.length}>
          <div class="flow-list" aria-label="Available flow files">
            <For each={props.catalog?.flows}>
              {(flow) => (
                <a class="flow-list-row" href={`/?flow=${encodeURIComponent(flow.path)}`} rel="external">
                  <span class="flow-file-icon" aria-hidden="true">
                    <i />
                    <i />
                    <i />
                  </span>
                  <span class="flow-list-copy">
                    <strong>{flow.title}</strong>
                    <span>{flow.path}</span>
                  </span>
                  <Show
                    when={flow.valid}
                    fallback={<span class="flow-status invalid">{flow.diagnosticCount} {flow.diagnosticCount === 1 ? "error" : "errors"}</span>}
                  >
                    <span class="flow-status">Open</span>
                  </Show>
                  <svg viewBox="0 0 16 16" aria-hidden="true"><path d="m6 3 5 5-5 5" /></svg>
                </a>
              )}
            </For>
          </div>
        </Show>
      </section>
    </main>
  );
}

export default function Home() {
  const [selectedPath, setSelectedPath] = createSignal<string | null>();
  const [catalog] = createResource(
    () => selectedPath() === null ? "catalog" : undefined,
    loadCatalog,
  );
  const [flow] = createResource(
    () => selectedPath() || undefined,
    loadFlow,
  );

  onMount(() => {
    setSelectedPath(new URLSearchParams(window.location.search).get("flow"));
  });

  return (
    <Show
      when={selectedPath() !== undefined}
      fallback={<StartupState message="Preparing the flow catalog…" />}
    >
      <Show
        when={selectedPath()}
        fallback={<FlowPicker catalog={catalog()} error={catalog.error} loading={catalog.loading} />}
      >
        <Show
          when={flow()}
          fallback={<StartupState message={flow.error?.message || "Loading the selected flow…"} showBack={Boolean(flow.error)} />}
        >
          {(loaded) => (
            <Workbench
              initialGraph={loaded().document}
              documentKey={`${loaded().workspaceId}:${loaded().path}`}
              documentPath={loaded().path}
            />
          )}
        </Show>
      </Show>
    </Show>
  );
}
