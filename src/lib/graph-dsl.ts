import { NODE_TYPES } from "../types/graph.ts";
import type { FlowGraph, GraphEdge, GraphNode, LayoutHint, NodePosition, NodeType } from "../types/graph.ts";

export const FLOW_DSL_VERSION = 1 as const;

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
  | "reference";

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
  suggestion?: string;
}

export interface GraphDslParseResult {
  graph: FlowGraph;
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

export function formatGraphDslDiagnostic(diagnostic: GraphDslDiagnostic): string {
  const location = `line ${diagnostic.line}, column ${diagnostic.column}`;
  return `[${diagnostic.code}] ${location}: ${diagnostic.message}${diagnostic.suggestion ? ` ${diagnostic.suggestion}` : ""}`;
}

export function parseGraphDsl(source: string): FlowGraph {
  const result = parseGraphDslWithDiagnostics(source);
  if (result.diagnostics.length) throw new GraphDslError(result.diagnostics[0]);
  return result.graph;
}

export function parseGraphDslWithDiagnostics(source: string): GraphDslParseResult {
  let id = "untitled-flow";
  let title = "Untitled flow";
  let description = "";
  let versionSeen = false;
  let graphSeen = false;
  let descriptionSeen = false;
  let stage = 0;
  const nodes: GraphNode[] = [];
  const locatedEdges: LocatedEdge[] = [];
  const hints: Record<string, LayoutHint> = {};
  const positions: Record<string, NodePosition> = {};
  const locatedPositions: LocatedPosition[] = [];
  const nodeIds = new Set<string>();
  const edgeIds = new Set<string>();
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
      if (command === "flow") {
        requireStage(stage, 0, tokens[0], "The flow version must be the first command.");
        requireCount(tokens, 2, "flow 1");
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
        if (graphSeen) fail("FLOW108", "structure", tokens[0], "The graph command appears more than once.");
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
        if (stage < 3 || stage > 4) fail("FLOW106", "structure", tokens[0], "Edges must follow all nodes and precede positions.");
        const parsed = parseEdge(tokens);
        if (edgeIds.has(parsed.value.id)) {
          fail("FLOW202", "identifier", tokens[1], `Duplicate edge ID "${parsed.value.id}".`, { relatedId: parsed.value.id });
        }
        edgeIds.add(parsed.value.id);
        locatedEdges.push(parsed);
        stage = 4;
        return;
      }

      if (command === "position") {
        if (stage < 3 || stage > 5) fail("FLOW106", "structure", tokens[0], "Positions must follow all nodes and edges.");
        requireCount(tokens, 3, "position <node-id> <x>,<y>");
        const nodeId = parseIdentifier(tokens[1]);
        if (positions[nodeId]) fail("FLOW204", "identifier", tokens[1], `Duplicate position for node "${nodeId}".`, { relatedId: nodeId });
        positions[nodeId] = parsePair(tokens[2], "position", ["x", "y"]);
        locatedPositions.push({ nodeId, token: tokens[1] });
        stage = 5;
        return;
      }

      const suggestion = nearest(command, ["flow", "graph", "description", "node", "edge", "position"]);
      fail("FLOW110", "syntax", tokens[0], `Unknown command "${command}".`, {
        actual: command,
        expected: "flow, graph, description, node, edge, or position",
        ...(suggestion ? { suggestion: `Did you mean "${suggestion}"?` } : {}),
      });
    } catch (error) {
      diagnostics.push(toDiagnostic(error));
    }
  });

  if (!versionSeen) diagnostics.push(documentDiagnostic("FLOW102", "version", "Missing Flow DSL version.", "Add flow 1 as the first command."));
  if (!graphSeen) diagnostics.push(documentDiagnostic("FLOW205", "structure", "Missing graph command.", 'Add graph <id> "<title>" after flow 1.'));
  if (!nodes.length) diagnostics.push(documentDiagnostic("FLOW206", "structure", "The graph requires at least one valid node."));

  for (const edge of locatedEdges) {
    validateNodeReference(edge.from, edge.value.from, nodeIds, diagnostics, edge.value.id);
    validateNodeReference(edge.to, edge.value.to, nodeIds, diagnostics, edge.value.id);
  }
  for (const position of locatedPositions) {
    validateNodeReference(position.token, position.nodeId, nodeIds, diagnostics);
  }

  const hasHints = Object.keys(hints).length > 0;
  const hasPositions = Object.keys(positions).length > 0;
  return {
    graph: {
      dslVersion: FLOW_DSL_VERSION,
      schemaVersion: 3,
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
    diagnostics: diagnostics.sort((a, b) => a.line - b.line || a.column - b.column || a.code.localeCompare(b.code)),
  };
}

export function graphToDsl(graph: FlowGraph, options: { includePositions?: boolean } = {}): string {
  if (graph.dslVersion !== FLOW_DSL_VERSION) {
    throw new Error(`Cannot format Flow DSL version "${graph.dslVersion}". Expected version ${FLOW_DSL_VERSION}.`);
  }
  const sections: string[][] = [
    [`flow ${FLOW_DSL_VERSION}`],
    [
      `graph ${formatIdentifier(graph.id)} ${quote(graph.title)}`,
      ...(graph.description ? [`description ${quote(graph.description)}`] : []),
    ],
    graph.nodes.map((node) => {
      const parts = [`node ${formatIdentifier(node.id)} ${node.type} ${quote(node.title)}`];
      if (node.body) parts.push(`body=${quote(node.body)}`);
      if (node.tags?.length) parts.push(`tags=${formatTags(node.tags)}`);
      const hint = graph.layout?.hints?.[node.id];
      if (hint) parts.push(`layout=${formatNumber(hint.column)},${formatNumber(hint.row)}`);
      return parts.join(" ");
    }),
  ];

  if (graph.edges.length) {
    sections.push(graph.edges.map((edge) => {
      const parts = [
        `edge ${formatIdentifier(edge.id)} ${formatIdentifier(edge.from)} -> ${formatIdentifier(edge.to)}`,
      ];
      if (edge.label) parts.push(`label=${quote(edge.label)}`);
      if (edge.emphasis) parts.push("emphasis=true");
      return parts.join(" ");
    }));
  }

  if (options.includePositions && graph.layout?.positions) {
    const lines = graph.nodes.flatMap((node) => {
      const position = graph.layout?.positions?.[node.id];
      return position
        ? [`position ${formatIdentifier(node.id)} ${formatNumber(position.x)},${formatNumber(position.y)}`]
        : [];
    });
    if (lines.length) sections.push(lines);
  }

  return `${sections.filter((section) => section.length).map((section) => section.join("\n")).join("\n\n")}\n`;
}

function parseNode(tokens: Token[]): { value: GraphNode; layout?: LayoutHint } {
  if (tokens.length < 4) fail("FLOW111", "syntax", tokens[0], 'Node syntax is: node <id> <type> "<title>".');
  const id = parseIdentifier(tokens[1]);
  const typeValue = tokens[2].raw;
  if (!NODE_TYPE_SET.has(typeValue)) {
    const suggestion = nearest(typeValue, [...NODE_TYPES]);
    fail("FLOW121", "syntax", tokens[2], `Unknown node type "${typeValue}".`, {
      actual: typeValue,
      expected: NODE_TYPES.join(", "),
      ...(suggestion ? { suggestion: `Did you mean "${suggestion}"?` } : {}),
    });
  }
  const title = parseQuotedString(tokens[3]);
  const options = readOptions(tokens.slice(4), new Set(["body", "tags", "layout"]));
  return {
    value: {
      id,
      type: typeValue as NodeType,
      title,
      ...(options.body ? { body: parseQuotedString(options.body) } : {}),
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
  let emphasis = false;
  if (options.emphasis) {
    const raw = optionValue(options.emphasis);
    if (raw !== "true" && raw !== "false") {
      fail("FLOW151", "option", options.emphasis, "emphasis must be true or false.", {
        actual: raw,
        expected: "true or false",
      });
    }
    emphasis = raw === "true";
  }
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
    if (separator < 1) {
      fail("FLOW150", "option", token, `Expected key=value, received "${token.raw}".`, { expected: "key=value" });
    }
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
  if (values.some((value) => !Number.isFinite(value))) {
    fail("FLOW142", "syntax", token, `${label} numbers must be finite.`, { actual: raw });
  }
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
    fail("FLOW122", "syntax", token, "String values must use double quotes.", {
      actual: raw,
      expected: '"text"',
    });
  }
  validateQuotedEscapes(raw, token);
  let value = "";
  for (let index = 1; index < raw.length - 1; index += 1) {
    const character = raw[index];
    if (character === '"') {
      fail("FLOW125", "syntax", offsetToken(token, index), "Double quotes inside strings must be escaped.", {
        actual: '"',
        expected: '\\"',
      });
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
    if (quoteOpen) {
      const token = { raw: rawLine.slice(start), line, start, end: rawLine.length };
      fail("FLOW124", "syntax", token, "Unclosed quoted string.");
    }
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
  if (tokens.length !== expected) {
    fail("FLOW111", "syntax", tokens[0], `Expected ${syntax}.`, { expected: syntax });
  }
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
  return separator < 0
    ? token
    : { ...token, raw: token.raw.slice(separator + 1), start: token.start + separator + 1 };
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

function quote(value: string): string {
  return `"${value.replace(/\\/g, "\\\\").replace(/"/g, '\\"').replace(/\n/g, "\\n")}"`;
}

function formatTags(tags: string[]): string {
  if (new Set(tags).size !== tags.length || tags.some((tag) => !tag.length)) {
    throw new Error("Tags must be unique, non-empty strings.");
  }
  return `[${tags.map(quote).join(",")}]`;
}

function formatIdentifier(value: string): string {
  if (!IDENTIFIER_PATTERN.test(value)) {
    throw new Error(`Invalid DSL identifier "${value}". Expected [A-Za-z0-9][A-Za-z0-9._-]*.`);
  }
  return value;
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
