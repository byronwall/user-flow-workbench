import exampleGraph from "../../data/example-flow.json";
import type { FlowGraph, GraphNode } from "../../types/graph";

const legacyGraph = exampleGraph as typeof exampleGraph;
const starterGraph: FlowGraph = {
  dslVersion: 1,
  schemaVersion: 3,
  id: legacyGraph.id,
  title: legacyGraph.title,
  description: legacyGraph.description,
  nodes: legacyGraph.nodes.map(({ layout: _layout, position: _position, ...node }) => ({
    ...node,
    type: node.type as GraphNode["type"],
  })),
  edges: legacyGraph.edges,
  layout: {
    hints: Object.fromEntries(legacyGraph.nodes.map((node) => [node.id, node.layout])),
    positions: Object.fromEntries(legacyGraph.nodes.map((node) => [node.id, node.position])),
  },
};

export function GET() {
  return Response.json(starterGraph, {
    headers: {
      "Cache-Control": "no-store",
    },
  });
}
