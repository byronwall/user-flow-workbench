export const NODE_TYPES = [
  "actor",
  "need",
  "input",
  "process",
  "handoff",
  "deliverable",
  "ux",
] as const;

export type NodeType = (typeof NODE_TYPES)[number];

export const EDGE_RELATIONS = ["flow", "addresses", "supports", "appears-at"] as const;

export type EdgeRelation = (typeof EDGE_RELATIONS)[number];

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
  relation?: EdgeRelation;
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

export interface FlowGraph {
  id: string;
  title: string;
  description?: string;
  nodes: GraphNode[];
  edges: GraphEdge[];
  layout?: GraphLayout;
}

export type NodeSetChanges = Partial<Pick<GraphNode, "type" | "title" | "body" | "tags">> & {
  layout?: LayoutHint;
};

export type EdgeSetChanges = Partial<Pick<GraphEdge, "from" | "to" | "relation" | "label" | "emphasis">>;

export type VariantOperation =
  | { kind: "clear-all" }
  | { kind: "add-node"; node: GraphNode; layout?: LayoutHint }
  | { kind: "add-edge"; edge: GraphEdge }
  | { kind: "remove-node"; nodeId: string }
  | { kind: "remove-edge"; edgeId: string }
  | { kind: "set-node"; nodeId: string; changes: NodeSetChanges }
  | { kind: "set-edge"; edgeId: string; changes: EdgeSetChanges }
  | { kind: "unset-node"; nodeId: string; property: "body" | "tags" | "layout" }
  | { kind: "unset-edge"; edgeId: string; property: "relation" | "label" | "emphasis" }
  | { kind: "set-position"; nodeId: string; position: NodePosition };

export interface FlowVariant {
  id: string;
  title: string;
  description?: string;
  operations: VariantOperation[];
}

/** The persisted, agent-facing document. Variants store ordered differences from graph. */
export interface FlowDocument {
  dslVersion: 3;
  schemaVersion: 5;
  graph: FlowGraph;
  variants: FlowVariant[];
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
  id: string;
  title: string;
  description: string;
  nodes: CanvasNode[];
  edges: CanvasEdge[];
}
