import { createResource, Show } from "solid-js";
import { Workbench } from "../components/Workbench";
import type { FlowGraph } from "../types/graph";

async function loadExampleGraph(): Promise<FlowGraph> {
  const response = await fetch("/api/graph");
  if (!response.ok) throw new Error(`The graph server returned ${response.status}.`);
  return response.json() as Promise<FlowGraph>;
}

export default function Home() {
  const [graph] = createResource(loadExampleGraph);

  return (
    <Show
      when={graph()}
      fallback={
        <main class="startup-state">
          <h1>User Flow Workbench</h1>
          <p>{graph.error?.message || "Loading the starter graph…"}</p>
        </main>
      }
    >
      {(initialGraph) => <Workbench initialGraph={initialGraph()} />}
    </Show>
  );
}
