import { NODE_TYPES } from "../types/graph.ts";
import type {
  EdgeSetChanges,
  FlowDocument,
  FlowGraph,
  FlowVariant,
  GraphEdge,
  GraphNode,
  LayoutHint,
  NodePosition,
  NodeSetChanges,
  NodeType,
  VariantOperation,
} from "../types/graph.ts";

export const FLOW_DSL_VERSION = 2 as const;
export const FLOW_SCHEMA_VERSION = 4 as const;

const IDENTIFIER_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._-]*$/;
const NUMBER_SOURCE = "-?(?:0|[1-9][0-9]*)(?:\\.[0-9]+)?";
const NUMBER_PATTERN = new RegExp(`^${NUMBER_SOURCE}$`);
const PAIR_PATTERN = new RegExp(`^(${NUMBER_SOURCE}),(${NUMBER_SOURCE})$`);
const NODE_TYPE_SET = new Set<string>(NODE_TYPES);

export type GraphDslDiagnosticCategory =
  | "syntax"
  | "version"
  | "structure"
  | "identifier"
  | "option"
  | "reference"
  | "variant";

export interface GraphDslDiagnostic {
  code: string;
  category: GraphDslDiagnosticCategory;
  message: string;
  line: number;
  column: number;
  length: number;
  actual?: string;
  expected?: string;
  relatedId?: string;
  variantId?: string;
  suggestion?: string;
}

export interface GraphDslParseResult {
  document: FlowDocument;
  diagnostics: GraphDslDiagnostic[];
}

interface Token {
  raw: string;
  line: number;
  start: number;
  end: number;
}

interface LocatedEdge {
  value: GraphEdge;
  from: Token;
  to: Token;
}

interface LocatedPosition {
  nodeId: string;
  token: Token;
}

interface LocatedVariant {
  value: FlowVariant;
  token: Token;
  operationTokens: Token[];
  descriptionSeen: boolean;
  operationsStarted: boolean;
}

export class GraphDslError extends Error {
  diagnostic: GraphDslDiagnostic;
  line: number;
  column: number;
  code: string;

  constructor(diagnostic: GraphDslDiagnostic) {
    super(formatGraphDslDiagnostic(diagnostic));
    this.name = "GraphDslError";
    this.diagnostic = diagnostic;
    this.line = diagnostic.line;
    this.column = diagnostic.column;
    this.code = diagnostic.code;
  }
}

export class VariantMaterializationError extends Error {
  code: string;
  variantId: string;
  operationIndex: number;
  relatedIds: string[];

  constructor(code: string, variantId: string, operationIndex: number, message: string, relatedIds: string[] = []) {
    super(message);
    this.name = "VariantMaterializationError";
    this.code = code;
    this.variantId = variantId;
    this.operationIndex = operationIndex;
    this.relatedIds = relatedIds;
  }
}

export function formatGraphDslDiagnostic(diagnostic: GraphDslDiagnostic): string {
  const location = `line ${diagnostic.line}, column ${diagnostic.column}`;
  const variant = diagnostic.variantId ? ` Variant "${diagnostic.variantId}".` : "";
  return `[${diagnostic.code}] ${location}: ${diagnostic.message}${variant}${diagnostic.suggestion ? ` ${diagnostic.suggestion}` : ""}`;
}

export function parseGraphDsl(source: string): FlowDocument {
  const result = parseGraphDslWithDiagnostics(source);
  if (result.diagnostics.length) throw new GraphDslError(result.diagnostics[0]);
  return result.document;
}

export function parseGraphDslWithDiagnostics(source: string): GraphDslParseResult {
  let id = "untitled-flow";
  let title = "Untitled flow";
  let description = "";
  let versionSeen = false;
  let graphSeen = false;
  let descriptionSeen = false;
  let stage = 0;
  let activeVariant: LocatedVariant | null = null;
  const nodes: GraphNode[] = [];
  const locatedEdges: LocatedEdge[] = [];
  const hints: Record<string, LayoutHint> = {};
  const positions: Record<string, NodePosition> = {};
  const locatedPositions: LocatedPosition[] = [];
  const nodeIds = new Set<string>();
  const edgeIds = new Set<string>();
  const variants: LocatedVariant[] = [];
  const variantIds = new Set<string>();
  const diagnostics: GraphDslDiagnostic[] = [];

  source.split(/\r?\n/).forEach((rawLine, index) => {
    const line = index + 1;
    let tokens: Token[];
    try {
      tokens = tokenize(rawLine, line);
    } catch (error) {
      diagnostics.push(toDiagnostic(error));
      return;
    }
    if (!tokens.length) return;
    const command = tokens[0].raw;

    try {
      if (activeVariant) {
        if (command === "}") {
          requireCount(tokens, 1, "}");
          variants.push(activeVariant);
          activeVariant = null;
          stage = 5;
          return;
        }
        if (command === "variant") {
          fail("FLOW310", "variant", tokens[0], "Nested variant blocks are not supported.", {
            variantId: activeVariant.value.id,
          });
        }
        if (command === "description") {
          if (activeVariant.descriptionSeen || activeVariant.operationsStarted) {
            fail("FLOW311", "variant", tokens[0], "Variant description must appear once before all operations.", {
              variantId: activeVariant.value.id,
            });
          }
          requireCount(tokens, 2, 'description "<text>"');
          activeVariant.value.description = parseQuotedString(tokens[1]);
          activeVariant.descriptionSeen = true;
          return;
        }
        const operation = parseVariantOperation(tokens, activeVariant.value.id);
        activeVariant.value.operations.push(operation);
        activeVariant.operationTokens.push(tokens[0]);
        activeVariant.operationsStarted = true;
        return;
      }

      if (command === "flow") {
        requireStage(stage, 0, tokens[0], "The flow version must be the first command.");
        requireCount(tokens, 2, `flow ${FLOW_DSL_VERSION}`);
        if (versionSeen) fail("FLOW107", "structure", tokens[0], "The flow version appears more than once.");
        if (tokens[1].raw !== String(FLOW_DSL_VERSION)) {
          fail("FLOW101", "version", tokens[1], `Unsupported Flow DSL version "${tokens[1].raw}".`, {
            actual: tokens[1].raw,
            expected: String(FLOW_DSL_VERSION),
            suggestion: `Use flow ${FLOW_DSL_VERSION}.`,
          });
        }
        versionSeen = true;
        stage = 1;
        return;
      }

      if (command === "graph") {
        requireStage(stage, 1, tokens[0], "The graph command must follow the flow version.");
        requireCount(tokens, 3, 'graph <id> "<title>"');
        id = parseIdentifier(tokens[1]);
        title = parseQuotedString(tokens[2]);
        graphSeen = true;
        stage = 2;
        return;
      }

      if (command === "description") {
        requireStage(stage, 2, tokens[0], "Description must follow graph and precede nodes.");
        requireCount(tokens, 2, 'description "<text>"');
        if (descriptionSeen) fail("FLOW109", "structure", tokens[0], "Description appears more than once.");
        description = parseQuotedString(tokens[1]);
        descriptionSeen = true;
        stage = 3;
        return;
      }

      if (command === "node") {
        if (stage < 2 || stage > 3) fail("FLOW106", "structure", tokens[0], "Nodes must follow graph and precede edges.");
        const parsed = parseNode(tokens);
        if (nodeIds.has(parsed.value.id)) {
          fail("FLOW201", "identifier", tokens[1], `Duplicate node ID "${parsed.value.id}".`, { relatedId: parsed.value.id });
        }
        nodeIds.add(parsed.value.id);
        nodes.push(parsed.value);
        if (parsed.layout) hints[parsed.value.id] = parsed.layout;
        stage = 3;
        return;
      }

      if (command === "edge") {
        if (stage < 3 || stage > 4) fail("FLOW106", "structure", tokens[0], "Edges must follow all nodes and precede variants.");
        const parsed = parseEdge(tokens);
        if (edgeIds.has(parsed.value.id)) {
          fail("FLOW202", "identifier", tokens[1], `Duplicate edge ID "${parsed.value.id}".`, { relatedId: parsed.value.id });
        }
        edgeIds.add(parsed.value.id);
        locatedEdges.push(parsed);
        stage = 4;
        return;
      }

      if (command === "variant") {
        if (stage < 3 || stage > 5) fail("FLOW106", "structure", tokens[0], "Variants must follow all nodes and edges.");
        requireCount(tokens, 4, 'variant <id> "<title>" {');
        const variantId = parseIdentifier(tokens[1]);
        if (tokens[3].raw !== "{") fail("FLOW312", "variant", tokens[3], 'Variant header must end with "{".');
        if (variantIds.has(variantId)) {
          fail("FLOW301", "variant", tokens[1], `Duplicate variant ID "${variantId}".`, { variantId });
        }
        variantIds.add(variantId);
        activeVariant = {
          value: { id: variantId, title: parseQuotedString(tokens[2]), operations: [] },
          token: tokens[0],
          operationTokens: [],
          descriptionSeen: false,
          operationsStarted: false,
        };
        stage = 5;
        return;
      }

      if (command === "position") {
        if (stage < 3 || stage > 6) fail("FLOW106", "structure", tokens[0], "Positions must follow all nodes, edges, and variants.");
        requireCount(tokens, 3, "position <node-id> <x>,<y>");
        const nodeId = parseIdentifier(tokens[1]);
        if (positions[nodeId]) fail("FLOW204", "identifier", tokens[1], `Duplicate position for node "${nodeId}".`, { relatedId: nodeId });
        positions[nodeId] = parsePair(tokens[2], "position", ["x", "y"]);
        locatedPositions.push({ nodeId, token: tokens[1] });
        stage = 6;
        return;
      }

      if (command === "}") fail("FLOW313", "variant", tokens[0], "Closing brace has no open variant block.");

      const suggestion = nearest(command, ["flow", "graph", "description", "node", "edge", "variant", "position"]);
      fail("FLOW110", "syntax", tokens[0], `Unknown command "${command}".`, {
        actual: command,
        expected: "flow, graph, description, node, edge, variant, or position",
        ...(suggestion ? { suggestion: `Did you mean "${suggestion}"?` } : {}),
      });
    } catch (error) {
      diagnostics.push(toDiagnostic(error));
    }
  });

  if (activeVariant) {
    diagnostics.push(makeDiagnostic("FLOW314", "variant", activeVariant.token, "Variant block is missing its closing brace.", {
      variantId: activeVariant.value.id,
    }));
    variants.push(activeVariant);
  }
  if (!versionSeen) diagnostics.push(documentDiagnostic("FLOW102", "version", "Missing Flow DSL version.", `Add flow ${FLOW_DSL_VERSION} as the first command.`));
  if (!graphSeen) diagnostics.push(documentDiagnostic("FLOW205", "structure", "Missing graph command.", `Add graph <id> "<title>" after flow ${FLOW_DSL_VERSION}.`));
  if (!nodes.length) diagnostics.push(documentDiagnostic("FLOW206", "structure", "The base graph requires at least one valid node."));

  for (const edge of locatedEdges) {
    validateNodeReference(edge.from, edge.value.from, nodeIds, diagnostics, edge.value.id);
    validateNodeReference(edge.to, edge.value.to, nodeIds, diagnostics, edge.value.id);
  }
  for (const position of locatedPositions) validateNodeReference(position.token, position.nodeId, nodeIds, diagnostics);

  const hasHints = Object.keys(hints).length > 0;
  const hasPositions = Object.keys(positions).length > 0;
  const document: FlowDocument = {
    dslVersion: FLOW_DSL_VERSION,
    schemaVersion: FLOW_SCHEMA_VERSION,
    graph: {
      id,
      title,
      ...(description ? { description } : {}),
      nodes,
      edges: locatedEdges.map((edge) => edge.value),
      ...(hasHints || hasPositions ? {
        layout: {
          ...(hasHints ? { hints } : {}),
          ...(hasPositions ? { positions } : {}),
        },
      } : {}),
    },
    variants: variants.map((variant) => variant.value),
  };

  for (const variant of variants) {
    try {
      materializeVariant(document, variant.value.id);
    } catch (error) {
      if (!(error instanceof VariantMaterializationError)) throw error;
      const token = variant.operationTokens[error.operationIndex] || variant.token;
      diagnostics.push(makeDiagnostic(error.code, "variant", token, error.message, {
        variantId: variant.value.id,
        ...(error.relatedIds[0] ? { relatedId: error.relatedIds[0] } : {}),
      }));
    }
  }

  return {
    document,
    diagnostics: diagnostics.sort((a, b) => a.line - b.line || a.column - b.column || a.code.localeCompare(b.code)),
  };
}

export function materializeVariant(document: FlowDocument, variantId: string): FlowGraph {
  const variant = document.variants.find((candidate) => candidate.id === variantId);
  if (!variant) throw new VariantMaterializationError("FLOW302", variantId, -1, `Unknown variant "${variantId}".`);
  const graph = clone(document.graph);
  let clearSeen = false;

  variant.operations.forEach((operation, index) => {
    const nodeById = () => new Map(graph.nodes.map((node) => [node.id, node]));
    const edgeById = () => new Map(graph.edges.map((edge) => [edge.id, edge]));

    if (operation.kind === "clear-all") {
      if (clearSeen || index !== 0) {
        throw variantError("FLOW315", variant, index, "clear all must be the first and only clear operation.");
      }
      clearSeen = true;
      graph.nodes = [];
      graph.edges = [];
      delete graph.layout;
      return;
    }

    if (operation.kind === "add-node") {
      if (nodeById().has(operation.node.id)) {
        throw variantError("FLOW303", variant, index, `Cannot add node "${operation.node.id}" because it already exists.`, [operation.node.id]);
      }
      graph.nodes.push(clone(operation.node));
      if (operation.layout) {
        graph.layout ||= {};
        graph.layout.hints ||= {};
        graph.layout.hints[operation.node.id] = clone(operation.layout);
      }
      return;
    }

    if (operation.kind === "add-edge") {
      if (edgeById().has(operation.edge.id)) {
        throw variantError("FLOW304", variant, index, `Cannot add edge "${operation.edge.id}" because it already exists.`, [operation.edge.id]);
      }
      const nodes = nodeById();
      const missing = [operation.edge.from, operation.edge.to].filter((nodeId) => !nodes.has(nodeId));
      if (missing.length) {
        throw variantError("FLOW305", variant, index, `Cannot add edge "${operation.edge.id}". Unknown node: ${missing.join(", ")}.`, missing);
      }
      graph.edges.push(clone(operation.edge));
      return;
    }

    if (operation.kind === "remove-node") {
      if (!nodeById().has(operation.nodeId)) {
        throw variantError("FLOW306", variant, index, `Cannot remove missing node "${operation.nodeId}".`, [operation.nodeId]);
      }
      graph.nodes = graph.nodes.filter((node) => node.id !== operation.nodeId);
      if (graph.layout?.hints) delete graph.layout.hints[operation.nodeId];
      if (graph.layout?.positions) delete graph.layout.positions[operation.nodeId];
      return;
    }

    if (operation.kind === "remove-edge") {
      if (!edgeById().has(operation.edgeId)) {
        throw variantError("FLOW307", variant, index, `Cannot remove missing edge "${operation.edgeId}".`, [operation.edgeId]);
      }
      graph.edges = graph.edges.filter((edge) => edge.id !== operation.edgeId);
      return;
    }

    if (operation.kind === "set-node") {
      const node = nodeById().get(operation.nodeId);
      if (!node) throw variantError("FLOW308", variant, index, `Cannot set missing node "${operation.nodeId}".`, [operation.nodeId]);
      const { layout, ...semanticChanges } = operation.changes;
      Object.assign(node, clone(semanticChanges));
      if (layout) {
        graph.layout ||= {};
        graph.layout.hints ||= {};
        graph.layout.hints[operation.nodeId] = clone(layout);
      }
      return;
    }

    if (operation.kind === "set-edge") {
      const edge = edgeById().get(operation.edgeId);
      if (!edge) throw variantError("FLOW309", variant, index, `Cannot set missing edge "${operation.edgeId}".`, [operation.edgeId]);
      const nextFrom = operation.changes.from || edge.from;
      const nextTo = operation.changes.to || edge.to;
      const nodes = nodeById();
      const missing = [nextFrom, nextTo].filter((nodeId) => !nodes.has(nodeId));
      if (missing.length) {
        throw variantError("FLOW305", variant, index, `Cannot retarget edge "${operation.edgeId}". Unknown node: ${missing.join(", ")}.`, missing);
      }
      Object.assign(edge, clone(operation.changes));
      return;
    }

    if (operation.kind === "unset-node") {
      const node = nodeById().get(operation.nodeId);
      if (!node) throw variantError("FLOW308", variant, index, `Cannot unset a property on missing node "${operation.nodeId}".`, [operation.nodeId]);
      if (operation.property === "layout") {
        if (!graph.layout?.hints?.[operation.nodeId]) {
          throw variantError("FLOW316", variant, index, `Node "${operation.nodeId}" has no layout hint to unset.`, [operation.nodeId]);
        }
        delete graph.layout.hints[operation.nodeId];
      } else {
        if (!(operation.property in node)) {
          throw variantError("FLOW316", variant, index, `Node "${operation.nodeId}" has no ${operation.property} to unset.`, [operation.nodeId]);
        }
        delete node[operation.property];
      }
      return;
    }

    if (operation.kind === "unset-edge") {
      const edge = edgeById().get(operation.edgeId);
      if (!edge) throw variantError("FLOW309", variant, index, `Cannot unset a property on missing edge "${operation.edgeId}".`, [operation.edgeId]);
      if (!(operation.property in edge)) {
        throw variantError("FLOW316", variant, index, `Edge "${operation.edgeId}" has no ${operation.property} to unset.`, [operation.edgeId]);
      }
      delete edge[operation.property];
      return;
    }

    if (operation.kind === "set-position") {
      if (!nodeById().has(operation.nodeId)) {
        throw variantError("FLOW308", variant, index, `Cannot position missing node "${operation.nodeId}".`, [operation.nodeId]);
      }
      graph.layout ||= {};
      graph.layout.positions ||= {};
      graph.layout.positions[operation.nodeId] = clone(operation.position);
    }
  });

  const nodes = new Set(graph.nodes.map((node) => node.id));
  const dangling = graph.edges.filter((edge) => !nodes.has(edge.from) || !nodes.has(edge.to));
  if (dangling.length) {
    const missingNodes = [...new Set(dangling.flatMap((edge) => [edge.from, edge.to]).filter((nodeId) => !nodes.has(nodeId)))];
    const edgeList = dangling.map((edge) => `"${edge.id}"`).join(", ");
    throw variantError(
      "FLOW317",
      variant,
      Math.max(0, variant.operations.length - 1),
      `Materialized graph has dangling edge${dangling.length === 1 ? "" : "s"} ${edgeList}. Remove or retarget them explicitly.`,
      missingNodes,
    );
  }
  if (!graph.nodes.length) {
    throw variantError("FLOW318", variant, Math.max(0, variant.operations.length - 1), "Materialized graph must contain at least one node.");
  }
  return graph;
}

export function graphToDsl(document: FlowDocument, options: { includePositions?: boolean } = {}): string {
  if (document.dslVersion !== FLOW_DSL_VERSION) {
    throw new Error(`Cannot format Flow DSL version "${document.dslVersion}". Expected version ${FLOW_DSL_VERSION}.`);
  }
  const graph = document.graph;
  const sections: string[][] = [
    [`flow ${FLOW_DSL_VERSION}`],
    [
      `graph ${formatIdentifier(graph.id)} ${quote(graph.title)}`,
      ...(graph.description ? [`description ${quote(graph.description)}`] : []),
    ],
    graph.nodes.map((node) => formatNode(node, graph.layout?.hints?.[node.id])),
  ];

  if (graph.edges.length) sections.push(graph.edges.map(formatEdge));
  if (document.variants.length) sections.push(document.variants.map(formatVariant));

  if (options.includePositions && graph.layout?.positions) {
    const lines = graph.nodes.flatMap((node) => {
      const position = graph.layout?.positions?.[node.id];
      return position ? [`position ${formatIdentifier(node.id)} ${formatPair(position.x, position.y)}`] : [];
    });
    if (lines.length) sections.push(lines);
  }

  return `${sections.filter((section) => section.length).map((section) => section.join("\n")).join("\n\n")}\n`;
}

function parseVariantOperation(tokens: Token[], variantId: string): VariantOperation {
  const verb = tokens[0].raw;
  if (verb === "clear") {
    requireCount(tokens, 2, "clear all");
    if (tokens[1].raw !== "all") fail("FLOW319", "variant", tokens[1], 'clear only supports "all".', { variantId });
    return { kind: "clear-all" };
  }
  if (verb === "position") {
    requireCount(tokens, 3, "position <node-id> <x>,<y>");
    return { kind: "set-position", nodeId: parseIdentifier(tokens[1]), position: parsePair(tokens[2], "position", ["x", "y"]) };
  }
  if (verb === "add") {
    if (tokens[1]?.raw === "node") {
      const parsed = parseNode([tokens[1], ...tokens.slice(2)]);
      return { kind: "add-node", node: parsed.value, ...(parsed.layout ? { layout: parsed.layout } : {}) };
    }
    if (tokens[1]?.raw === "edge") return { kind: "add-edge", edge: parseEdge([tokens[1], ...tokens.slice(2)]).value };
    fail("FLOW320", "variant", tokens[1] || tokens[0], "add requires node or edge.", { variantId });
  }
  if (verb === "remove") {
    requireCount(tokens, 3, "remove <node|edge> <id>");
    const targetId = parseIdentifier(tokens[2]);
    if (tokens[1].raw === "node") return { kind: "remove-node", nodeId: targetId };
    if (tokens[1].raw === "edge") return { kind: "remove-edge", edgeId: targetId };
    fail("FLOW321", "variant", tokens[1], "remove requires node or edge.", { variantId });
  }
  if (verb === "set") {
    if (tokens.length < 4) fail("FLOW322", "variant", tokens[0], "set requires a target and at least one property.", { variantId });
    const targetId = parseIdentifier(tokens[2]);
    if (tokens[1].raw === "node") {
      const options = readOptions(tokens.slice(3), new Set(["type", "title", "body", "tags", "layout"]));
      const changes: NodeSetChanges = {};
      if (options.type) changes.type = parseNodeType(optionToken(options.type));
      if (options.title) changes.title = parseQuotedString(optionToken(options.title));
      if (options.body) changes.body = parseQuotedString(optionToken(options.body));
      if (options.tags) changes.tags = parseTags(options.tags);
      if (options.layout) changes.layout = parsePair(options.layout, "layout", ["column", "row"]);
      return { kind: "set-node", nodeId: targetId, changes };
    }
    if (tokens[1].raw === "edge") {
      const options = readOptions(tokens.slice(3), new Set(["from", "to", "label", "emphasis"]));
      const changes: EdgeSetChanges = {};
      if (options.from) changes.from = parseIdentifier(optionToken(options.from));
      if (options.to) changes.to = parseIdentifier(optionToken(options.to));
      if (options.label) changes.label = parseQuotedString(optionToken(options.label));
      if (options.emphasis) changes.emphasis = parseBoolean(options.emphasis, "emphasis");
      return { kind: "set-edge", edgeId: targetId, changes };
    }
    fail("FLOW323", "variant", tokens[1], "set requires node or edge.", { variantId });
  }
  if (verb === "unset") {
    requireCount(tokens, 4, "unset <node|edge> <id> <property>");
    const targetId = parseIdentifier(tokens[2]);
    const property = tokens[3].raw;
    if (tokens[1].raw === "node") {
      if (!["body", "tags", "layout"].includes(property)) {
        fail("FLOW324", "variant", tokens[3], "Node unset supports body, tags, or layout.", { variantId });
      }
      return { kind: "unset-node", nodeId: targetId, property: property as "body" | "tags" | "layout" };
    }
    if (tokens[1].raw === "edge") {
      if (!["label", "emphasis"].includes(property)) {
        fail("FLOW325", "variant", tokens[3], "Edge unset supports label or emphasis.", { variantId });
      }
      return { kind: "unset-edge", edgeId: targetId, property: property as "label" | "emphasis" };
    }
    fail("FLOW326", "variant", tokens[1], "unset requires node or edge.", { variantId });
  }
  const suggestion = nearest(verb, ["add", "remove", "set", "unset", "clear", "position"]);
  fail("FLOW327", "variant", tokens[0], `Unknown variant operation "${verb}".`, {
    variantId,
    ...(suggestion ? { suggestion: `Did you mean "${suggestion}"?` } : {}),
  });
}

function formatVariant(variant: FlowVariant): string {
  const lines = [`variant ${formatIdentifier(variant.id)} ${quote(variant.title)} {`];
  if (variant.description) lines.push(`  description ${quote(variant.description)}`);
  if (variant.description && variant.operations.length) lines.push("");
  lines.push(...variant.operations.map((operation) => `  ${formatVariantOperation(operation)}`));
  lines.push("}");
  return lines.join("\n");
}

function formatVariantOperation(operation: VariantOperation): string {
  if (operation.kind === "clear-all") return "clear all";
  if (operation.kind === "add-node") return `add ${formatNode(operation.node, operation.layout)}`;
  if (operation.kind === "add-edge") return `add ${formatEdge(operation.edge)}`;
  if (operation.kind === "remove-node") return `remove node ${formatIdentifier(operation.nodeId)}`;
  if (operation.kind === "remove-edge") return `remove edge ${formatIdentifier(operation.edgeId)}`;
  if (operation.kind === "set-node") {
    const parts = [`set node ${formatIdentifier(operation.nodeId)}`];
    if (operation.changes.type) parts.push(`type=${operation.changes.type}`);
    if (operation.changes.title !== undefined) parts.push(`title=${quote(operation.changes.title)}`);
    if (operation.changes.body !== undefined) parts.push(`body=${quote(operation.changes.body)}`);
    if (operation.changes.tags !== undefined) parts.push(`tags=${formatTags(operation.changes.tags)}`);
    if (operation.changes.layout) parts.push(`layout=${formatPair(operation.changes.layout.column, operation.changes.layout.row)}`);
    return parts.join(" ");
  }
  if (operation.kind === "set-edge") {
    const parts = [`set edge ${formatIdentifier(operation.edgeId)}`];
    if (operation.changes.from) parts.push(`from=${formatIdentifier(operation.changes.from)}`);
    if (operation.changes.to) parts.push(`to=${formatIdentifier(operation.changes.to)}`);
    if (operation.changes.label !== undefined) parts.push(`label=${quote(operation.changes.label)}`);
    if (operation.changes.emphasis !== undefined) parts.push(`emphasis=${operation.changes.emphasis}`);
    return parts.join(" ");
  }
  if (operation.kind === "unset-node") return `unset node ${formatIdentifier(operation.nodeId)} ${operation.property}`;
  if (operation.kind === "unset-edge") return `unset edge ${formatIdentifier(operation.edgeId)} ${operation.property}`;
  return `position ${formatIdentifier(operation.nodeId)} ${formatPair(operation.position.x, operation.position.y)}`;
}

function formatNode(node: GraphNode, hint?: LayoutHint): string {
  const parts = [`node ${formatIdentifier(node.id)} ${node.type} ${quote(node.title)}`];
  if (node.body) parts.push(`body=${quote(node.body)}`);
  if (node.tags?.length) parts.push(`tags=${formatTags(node.tags)}`);
  if (hint) parts.push(`layout=${formatPair(hint.column, hint.row)}`);
  return parts.join(" ");
}

function formatEdge(edge: GraphEdge): string {
  const parts = [`edge ${formatIdentifier(edge.id)} ${formatIdentifier(edge.from)} -> ${formatIdentifier(edge.to)}`];
  if (edge.label) parts.push(`label=${quote(edge.label)}`);
  if (edge.emphasis) parts.push("emphasis=true");
  return parts.join(" ");
}

function parseNode(tokens: Token[]): { value: GraphNode; layout?: LayoutHint } {
  if (tokens.length < 4) fail("FLOW111", "syntax", tokens[0], 'Node syntax is: node <id> <type> "<title>".');
  const id = parseIdentifier(tokens[1]);
  const type = parseNodeType(tokens[2]);
  const title = parseQuotedString(tokens[3]);
  const options = readOptions(tokens.slice(4), new Set(["body", "tags", "layout"]));
  return {
    value: {
      id,
      type,
      title,
      ...(options.body ? { body: parseQuotedString(optionToken(options.body)) } : {}),
      ...(options.tags ? { tags: parseTags(options.tags) } : {}),
    },
    ...(options.layout ? { layout: parsePair(options.layout, "layout", ["column", "row"]) } : {}),
  };
}

function parseEdge(tokens: Token[]): LocatedEdge {
  if (tokens.length < 5 || tokens[3]?.raw !== "->") {
    fail("FLOW112", "syntax", tokens[0], "Edge syntax is: edge <edge-id> <from> -> <to>.");
  }
  const id = parseIdentifier(tokens[1]);
  const from = parseIdentifier(tokens[2]);
  const to = parseIdentifier(tokens[4]);
  const options = readOptions(tokens.slice(5), new Set(["label", "emphasis"]));
  const emphasis = options.emphasis ? parseBoolean(options.emphasis, "emphasis") : false;
  return {
    value: {
      id,
      from,
      to,
      ...(options.label ? { label: parseQuotedString(optionToken(options.label)) } : {}),
      ...(emphasis ? { emphasis: true } : {}),
    },
    from: tokens[2],
    to: tokens[4],
  };
}

function readOptions(tokens: Token[], allowed: Set<string>): Record<string, Token> {
  const options: Record<string, Token> = {};
  for (const token of tokens) {
    const separator = token.raw.indexOf("=");
    if (separator < 1) fail("FLOW150", "option", token, `Expected key=value, received "${token.raw}".`, { expected: "key=value" });
    const key = token.raw.slice(0, separator);
    if (!allowed.has(key)) {
      const suggestion = nearest(key, [...allowed]);
      fail("FLOW152", "option", token, `Unknown option "${key}".`, {
        actual: key,
        expected: [...allowed].join(", "),
        ...(suggestion ? { suggestion: `Did you mean "${suggestion}"?` } : {}),
      });
    }
    if (options[key]) fail("FLOW153", "option", token, `Duplicate option "${key}".`, { actual: key });
    options[key] = token;
  }
  return options;
}

function parseNodeType(token: Token): NodeType {
  if (!NODE_TYPE_SET.has(token.raw)) {
    const suggestion = nearest(token.raw, [...NODE_TYPES]);
    fail("FLOW121", "syntax", token, `Unknown node type "${token.raw}".`, {
      actual: token.raw,
      expected: NODE_TYPES.join(", "),
      ...(suggestion ? { suggestion: `Did you mean "${suggestion}"?` } : {}),
    });
  }
  return token.raw as NodeType;
}

function parseBoolean(token: Token, label: string): boolean {
  const raw = optionValue(token);
  if (raw !== "true" && raw !== "false") {
    fail("FLOW151", "option", token, `${label} must be true or false.`, { actual: raw, expected: "true or false" });
  }
  return raw === "true";
}

function parseTags(token: Token): string[] {
  const raw = optionValue(token);
  if (!raw.startsWith("[") || !raw.endsWith("]")) {
    fail("FLOW154", "option", token, 'tags must be a string array, such as tags=["one","two"].');
  }
  validateQuotedEscapes(raw, token);
  let value: unknown;
  try {
    value = JSON.parse(raw);
  } catch {
    fail("FLOW154", "option", token, 'tags must be a valid string array, such as tags=["one","two"].');
  }
  if (!Array.isArray(value) || value.some((tag) => typeof tag !== "string" || !tag.length)) {
    fail("FLOW154", "option", token, "Every tag must be a non-empty string.");
  }
  if (new Set(value).size !== value.length) fail("FLOW155", "option", token, "Tags must not contain duplicates.");
  return value as string[];
}

function parsePair<T extends string>(token: Token, label: string, keys: [T, T]): Record<T, number> {
  const raw = optionValue(token);
  const match = raw.match(PAIR_PATTERN);
  if (!match) {
    fail("FLOW141", "syntax", token, `${label} requires two canonical numbers separated by one comma.`, {
      actual: raw,
      expected: "-12,2.5",
    });
  }
  const values = [Number(match[1]), Number(match[2])];
  if (values.some((value) => !Number.isFinite(value))) fail("FLOW142", "syntax", token, `${label} numbers must be finite.`, { actual: raw });
  return { [keys[0]]: values[0], [keys[1]]: values[1] } as Record<T, number>;
}

function parseIdentifier(token: Token): string {
  if (!IDENTIFIER_PATTERN.test(token.raw)) {
    fail("FLOW131", "identifier", token, `Invalid identifier "${token.raw}".`, {
      actual: token.raw,
      expected: "[A-Za-z0-9][A-Za-z0-9._-]*",
    });
  }
  return token.raw;
}

function parseQuotedString(token: Token): string {
  const raw = optionValue(token);
  if (!(raw.startsWith('"') && raw.endsWith('"')) || raw.length < 2) {
    fail("FLOW122", "syntax", token, "String values must use double quotes.", { actual: raw, expected: '"text"' });
  }
  validateQuotedEscapes(raw, token);
  let value = "";
  for (let index = 1; index < raw.length - 1; index += 1) {
    const character = raw[index];
    if (character === '"') {
      fail("FLOW125", "syntax", offsetToken(token, index), "Double quotes inside strings must be escaped.", { actual: '"', expected: '\\"' });
    }
    if (character !== "\\") {
      value += character;
      continue;
    }
    const escaped = raw[++index];
    value += escaped === "n" ? "\n" : escaped;
  }
  return value;
}

function validateQuotedEscapes(raw: string, token: Token) {
  for (let index = 0; index < raw.length; index += 1) {
    if (raw[index] !== "\\") continue;
    const escaped = raw[++index];
    if (!['"', "\\", "n"].includes(escaped)) {
      fail("FLOW123", "syntax", offsetToken(token, index), `Unknown string escape "\\${escaped || ""}".`, {
        actual: `\\${escaped || ""}`,
        expected: '\\", \\\\, or \\n',
      });
    }
  }
}

function tokenize(rawLine: string, line: number): Token[] {
  const tokens: Token[] = [];
  let index = 0;
  while (index < rawLine.length) {
    while (index < rawLine.length && /[ \t]/.test(rawLine[index])) index += 1;
    if (index >= rawLine.length || rawLine[index] === "#") break;
    const start = index;
    let quoteOpen = false;
    let escaped = false;
    let bracketDepth = 0;
    while (index < rawLine.length) {
      const character = rawLine[index];
      if (escaped) escaped = false;
      else if (character === "\\" && quoteOpen) escaped = true;
      else if (character === '"') quoteOpen = !quoteOpen;
      else if (!quoteOpen && character === "[") bracketDepth += 1;
      else if (!quoteOpen && character === "]") bracketDepth -= 1;
      else if (!quoteOpen && bracketDepth === 0 && (/[ \t]/.test(character) || character === "#")) break;
      index += 1;
    }
    if (quoteOpen) fail("FLOW124", "syntax", { raw: rawLine.slice(start), line, start, end: rawLine.length }, "Unclosed quoted string.");
    const raw = rawLine.slice(start, index);
    tokens.push({ raw, line, start, end: index });
    if (rawLine[index] === "#") break;
  }
  return tokens;
}

function requireStage(actual: number, expected: number, token: Token, message: string) {
  if (actual !== expected) fail("FLOW106", "structure", token, message);
}

function requireCount(tokens: Token[], expected: number, syntax: string) {
  if (tokens.length !== expected) fail("FLOW111", "syntax", tokens[0], `Expected ${syntax}.`, { expected: syntax });
}

function validateNodeReference(
  token: Token,
  nodeId: string,
  nodeIds: Set<string>,
  diagnostics: GraphDslDiagnostic[],
  relatedId?: string,
) {
  if (nodeIds.has(nodeId)) return;
  const suggestion = nearest(nodeId, [...nodeIds]);
  diagnostics.push(makeDiagnostic("FLOW203", "reference", token, `Unknown node "${nodeId}".`, {
    actual: nodeId,
    expected: "an existing node ID",
    ...(relatedId ? { relatedId } : {}),
    ...(suggestion ? { suggestion: `Did you mean "${suggestion}"?` } : {}),
  }));
}

function optionValue(token: Token): string {
  const separator = token.raw.indexOf("=");
  return separator >= 0 ? token.raw.slice(separator + 1) : token.raw;
}

function optionToken(token: Token): Token {
  const separator = token.raw.indexOf("=");
  return separator < 0 ? token : { ...token, raw: token.raw.slice(separator + 1), start: token.start + separator + 1 };
}

function offsetToken(token: Token, offset: number): Token {
  return { ...token, start: token.start + offset, end: token.start + offset + 1, raw: token.raw[offset] || "" };
}

function fail(
  code: string,
  category: GraphDslDiagnosticCategory,
  token: Token,
  message: string,
  detail: Partial<GraphDslDiagnostic> = {},
): never {
  throw new GraphDslError(makeDiagnostic(code, category, token, message, detail));
}

function makeDiagnostic(
  code: string,
  category: GraphDslDiagnosticCategory,
  token: Token,
  message: string,
  detail: Partial<GraphDslDiagnostic> = {},
): GraphDslDiagnostic {
  return {
    code,
    category,
    message,
    line: token.line,
    column: token.start + 1,
    length: Math.max(1, token.end - token.start),
    ...detail,
  };
}

function documentDiagnostic(code: string, category: GraphDslDiagnosticCategory, message: string, suggestion?: string) {
  return { code, category, message, line: 1, column: 1, length: 1, ...(suggestion ? { suggestion } : {}) };
}

function toDiagnostic(error: unknown): GraphDslDiagnostic {
  if (error instanceof GraphDslError) return error.diagnostic;
  throw error;
}

function variantError(code: string, variant: FlowVariant, index: number, message: string, relatedIds: string[] = []) {
  return new VariantMaterializationError(code, variant.id, index, message, relatedIds);
}

function nearest(value: string, candidates: string[]): string | undefined {
  let best: { candidate: string; distance: number } | undefined;
  for (const candidate of candidates) {
    const distance = levenshtein(value, candidate);
    if (!best || distance < best.distance) best = { candidate, distance };
  }
  return best && best.distance <= Math.max(2, Math.floor(value.length / 3)) ? best.candidate : undefined;
}

function levenshtein(left: string, right: string): number {
  const row = Array.from({ length: right.length + 1 }, (_, index) => index);
  for (let leftIndex = 1; leftIndex <= left.length; leftIndex += 1) {
    let diagonal = row[0];
    row[0] = leftIndex;
    for (let rightIndex = 1; rightIndex <= right.length; rightIndex += 1) {
      const above = row[rightIndex];
      row[rightIndex] = Math.min(
        row[rightIndex] + 1,
        row[rightIndex - 1] + 1,
        diagonal + (left[leftIndex - 1] === right[rightIndex - 1] ? 0 : 1),
      );
      diagonal = above;
    }
  }
  return row[right.length];
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function quote(value: string): string {
  return `"${value.replace(/\\/g, "\\\\").replace(/"/g, '\\"').replace(/\n/g, "\\n")}"`;
}

function formatTags(tags: string[]): string {
  if (new Set(tags).size !== tags.length || tags.some((tag) => !tag.length)) throw new Error("Tags must be unique, non-empty strings.");
  return `[${tags.map(quote).join(",")}]`;
}

function formatIdentifier(value: string): string {
  if (!IDENTIFIER_PATTERN.test(value)) throw new Error(`Invalid DSL identifier "${value}". Expected [A-Za-z0-9][A-Za-z0-9._-]*.`);
  return value;
}

function formatPair(first: number, second: number): string {
  return `${formatNumber(first)},${formatNumber(second)}`;
}

function formatNumber(value: number): string {
  if (!Number.isFinite(value)) throw new Error(`Cannot format non-finite number "${value}".`);
  if (Object.is(value, -0)) return "0";
  const formatted = expandExponential(String(value));
  if (!NUMBER_PATTERN.test(formatted)) throw new Error(`Cannot format number "${value}" canonically.`);
  return formatted;
}

function expandExponential(value: string): string {
  if (!/[eE]/.test(value)) return value;
  const [coefficient, exponentText] = value.toLowerCase().split("e");
  const exponent = Number(exponentText);
  const negative = coefficient.startsWith("-");
  const unsigned = negative ? coefficient.slice(1) : coefficient;
  const digits = unsigned.replace(".", "");
  const decimalIndex = (unsigned.indexOf(".") >= 0 ? unsigned.indexOf(".") : unsigned.length) + exponent;
  const expanded = decimalIndex <= 0
    ? `0.${"0".repeat(-decimalIndex)}${digits}`
    : decimalIndex >= digits.length
      ? `${digits}${"0".repeat(decimalIndex - digits.length)}`
      : `${digits.slice(0, decimalIndex)}.${digits.slice(decimalIndex)}`;
  return negative ? `-${expanded}` : expanded;
}
