import type { EdgeRelation, FlowGraph, GraphEdge, GraphNode } from "../types/graph";

export const OPERATIONAL_NODE_TYPES = new Set(["actor", "input", "process", "handoff", "deliverable"]);

export function edgeRelation(edge: GraphEdge): EdgeRelation {
  return edge.relation || "flow";
}

export function isOperationalNode(node: Pick<GraphNode, "type">): boolean {
  return OPERATIONAL_NODE_TYPES.has(node.type);
}

export function isFlowEdge(edge: GraphEdge): boolean {
  return edgeRelation(edge) === "flow";
}

export function terminalDeliverableIds(graph: Pick<FlowGraph, "nodes" | "edges">): Set<string> {
  const outgoingFlowNodeIds = new Set(graph.edges.filter(isFlowEdge).map((edge) => edge.from));
  return new Set(
    graph.nodes
      .filter((node) => node.type === "deliverable" && !outgoingFlowNodeIds.has(node.id))
      .map((node) => node.id),
  );
}

export function projectOperationalGraph(graph: FlowGraph): FlowGraph {
  const nodes = graph.nodes.filter(isOperationalNode);
  const nodeIds = new Set(nodes.map((node) => node.id));
  return {
    ...graph,
    nodes,
    edges: graph.edges.filter((edge) => isFlowEdge(edge) && nodeIds.has(edge.from) && nodeIds.has(edge.to)),
  };
}
