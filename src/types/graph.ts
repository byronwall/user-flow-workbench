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

export interface GraphNode {
  id: string;
  type: NodeType;
  title: string;
  body?: string;
  tags?: string[];
}

export interface GraphEdge {
  id: string;
  from: string;
  to: string;
  label?: string;
  emphasis?: boolean;
}

export interface LayoutHint {
  column: number;
  row: number;
}

export interface NodePosition {
  x: number;
  y: number;
}

export interface GraphLayout {
  hints?: Record<string, LayoutHint>;
  positions?: Record<string, NodePosition>;
}

/** The persisted and agent-facing graph. Layout is optional view state. */
export interface FlowGraph {
  dslVersion: 1;
  schemaVersion: 3;
  id: string;
  title: string;
  description?: string;
  nodes: GraphNode[];
  edges: GraphEdge[];
  layout?: GraphLayout;
}

/** The normalized canvas projection. The renderer always has usable layout values. */
export interface CanvasNode extends GraphNode {
  body: string;
  tags: string[];
  layout: LayoutHint;
  position: NodePosition;
}

export interface CanvasEdge extends GraphEdge {
  id: string;
  label: string;
  emphasis: boolean;
}

export interface CanvasGraph {
  dslVersion: 1;
  schemaVersion: 3;
  id: string;
  title: string;
  description: string;
  nodes: CanvasNode[];
  edges: CanvasEdge[];
}
