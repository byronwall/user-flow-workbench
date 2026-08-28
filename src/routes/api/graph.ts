import exampleGraph from "../../data/example-flow.json";
import type { FlowGraph } from "../../types/graph";

const starterGraph = exampleGraph as FlowGraph;

export function GET() {
  return Response.json(starterGraph, {
    headers: {
      "Cache-Control": "no-store",
    },
  });
}
