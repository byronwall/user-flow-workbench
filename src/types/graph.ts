export const NODE_TYPES = [
  "actor",
  "need",
  "process",
  "handoff",
  "deliverable",
  "ux",
  "goal",
] as const;

export type NodeType = (typeof NODE_TYPES)[number];

export interface FlowNode {
  id: string;
  type: NodeType;
  title: string;
  body: string;
  tags: string[];
  layout: {
    column: number;
    row: number;
  };
  position: {
    x: number;
    y: number;
  };
}

export interface FlowEdge {
  id: string;
  from: string;
  to: string;
  label?: string;
  emphasis?: boolean;
}

export interface FlowGraph {
  schemaVersion: 2;
  id: string;
  title: string;
  description: string;
  nodes: FlowNode[];
  edges: FlowEdge[];
}
