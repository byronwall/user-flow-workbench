import { formatGraphDslDiagnostic, graphToDsl, parseGraphDslWithDiagnostics } from "./graph-dsl.ts";
import { formatOverviewDslDiagnostic, overviewToDsl, parseOverviewDslWithDiagnostics, type OverviewDslDiagnostic } from "./overview-dsl.ts";
import { DIAGRAM_FORMAT_VERSION, DIAGRAM_TYPES, type DiagramDocument, type DiagramType } from "../types/diagram.ts";
import type { GraphDslDiagnostic } from "./graph-dsl.ts";
import type { FlowDocument } from "../types/graph.ts";

export type DiagramDslDiagnostic = {
  code: string;
  category: string;
  message: string;
  line: number;
  column: number;
  length: number;
  actual?: string;
  expected?: string;
  relatedId?: string;
  variantId?: string;
  suggestion?: string;
};

export interface DiagramParseResult {
  document: DiagramDocument;
  type?: DiagramType;
  diagnostics: DiagramDslDiagnostic[];
}

export class DiagramDslError extends Error {
  readonly diagnostic: DiagramDslDiagnostic;
  readonly line: number;
  readonly column: number;
  readonly code: string;

  constructor(diagnostic: DiagramDslDiagnostic) {
    super(formatDiagramDslDiagnostic(diagnostic));
    this.name = "DiagramDslError";
    this.diagnostic = diagnostic;
    this.line = diagnostic.line;
    this.column = diagnostic.column;
    this.code = diagnostic.code;
  }
}

export function formatDiagramDslDiagnostic(diagnostic: DiagramDslDiagnostic): string {
  if (diagnostic.code.startsWith("FLOW")) return formatGraphDslDiagnostic(diagnostic as GraphDslDiagnostic);
  if (diagnostic.code.startsWith("OVERVIEW")) return formatOverviewDslDiagnostic(diagnostic as OverviewDslDiagnostic);
  return `[${diagnostic.code}] line ${diagnostic.line}, column ${diagnostic.column}: ${diagnostic.message}`;
}

export function parseDiagram(source: string): DiagramDocument {
  const result = parseDiagramWithDiagnostics(source);
  if (result.diagnostics.length) throw new DiagramDslError(result.diagnostics[0]);
  return result.document;
}

export function parseDiagramWithDiagnostics(source: string): DiagramParseResult {
  const lines = source.split(/\r?\n/);
  const diagnostics: DiagramDslDiagnostic[] = [];
  const diagramLine = firstContentLine(lines, 0);
  let typeLine = -1;
  let type: DiagramType | undefined;
  let bodyStart = 0;

  const diagramMatch = diagramLine >= 0 ? lines[diagramLine].trim().match(/^diagram\s+(\S+)(?:\s+#.*)?$/) : undefined;
  if (!diagramMatch || diagramMatch[1] !== String(DIAGRAM_FORMAT_VERSION)) {
    diagnostics.push(documentDiagnostic("DIAGRAM101", "version", "The document must start with diagram 1."));
  } else {
    typeLine = firstContentLine(lines, diagramLine + 1);
    if (typeLine < 0) {
      diagnostics.push(documentDiagnostic("DIAGRAM102", "structure", "Missing diagram type. Add exactly one type flow or type overview line.", lines.length));
      bodyStart = lines.length;
    } else {
      const typeMatch = lines[typeLine].trim().match(/^type\s+(\S+)(?:\s+#.*)?$/);
      if (!typeMatch || !DIAGRAM_TYPES.includes(typeMatch[1] as DiagramType)) {
        diagnostics.push(lineDiagnostic("DIAGRAM103", "structure", typeLine + 1, lines[typeLine], `Unknown or malformed diagram type. Use exactly one of: ${DIAGRAM_TYPES.join(", ")}.`));
      } else type = typeMatch[1] as DiagramType;
      bodyStart = typeLine + 1;
    }
  }

  if (typeLine >= 0) {
    for (let index = typeLine + 1; index < lines.length; index += 1) {
      if (lines[index].trim().startsWith("type ")) {
        diagnostics.push(lineDiagnostic("DIAGRAM104", "structure", index + 1, lines[index], "The document must contain exactly one type line."));
      }
    }
  }

  const bodySource = lines.slice(bodyStart).join("\n");
  const firstBody = firstContentLine(lines, bodyStart);
  const firstCommand = firstBody >= 0 ? lines[firstBody].trim().split(/\s+/)[0] : undefined;
  if (type && firstCommand && ((type === "flow" && firstCommand === "flow") || (type === "overview" && firstCommand !== "overview"))) {
    diagnostics.push(lineDiagnostic("DIAGRAM105", "structure", firstBody + 1, lines[firstBody], `The ${type} document body must begin with ${type === "flow" ? "graph <id> \"<title>\"" : "overview <id> \"<title>\""}.`));
  }

  let document: DiagramDocument;
  if (type === "overview") {
    const parsed = parseOverviewDslWithDiagnostics(bodySource, bodyStart);
    diagnostics.push(...parsed.diagnostics);
    document = { type, document: parsed.document };
  } else if (type === "flow") {
    // The legacy graph parser has its own private version marker. It is
    // inserted only in memory; public .diagram sources use the common header.
    const body = type === "flow" ? `flow 3\n${bodySource}` : "";
    const parsed = parseGraphDslWithDiagnostics(body);
    diagnostics.push(...parsed.diagnostics.map((diagnostic) => ({ ...diagnostic, line: diagnostic.line === 1 ? bodyStart + 1 : diagnostic.line + bodyStart - 1 })));
    document = { type: "flow", document: parsed.document };
  } else {
    // Keep the result shape usable for callers, but do not run a body parser
    // when the envelope has no valid type.
    const emptyFlow: FlowDocument = {
      dslVersion: 3,
      schemaVersion: 5,
      graph: { id: "untitled-flow", title: "Untitled flow", nodes: [], edges: [] },
      variants: [],
    };
    document = { type: "flow", document: emptyFlow };
  }

  return { document, ...(type ? { type } : {}), diagnostics: diagnostics.sort((a, b) => a.line - b.line || a.column - b.column || a.code.localeCompare(b.code)) };
}

export function diagramToDsl(document: DiagramDocument): string {
  const body = document.type === "flow"
    ? graphToDsl(document.document, { includePositions: true }).replace(/^flow 3\r?\n/, "").replace(/^\r?\n+/, "")
    : overviewToDsl(document.document);
  return `diagram ${DIAGRAM_FORMAT_VERSION}\ntype ${document.type}\n\n${body}`;
}

function firstContentLine(lines: string[], start: number): number {
  for (let index = start; index < lines.length; index += 1) {
    const trimmed = lines[index].trim();
    if (trimmed && !trimmed.startsWith("#")) return index;
  }
  return -1;
}

function documentDiagnostic(code: string, category: string, message: string, line = 1): DiagramDslDiagnostic {
  return { code, category, message, line, column: 1, length: 1 };
}

function lineDiagnostic(code: string, category: string, line: number, source: string, message: string): DiagramDslDiagnostic {
  return { code, category, message, line, column: Math.max(1, source.search(/\S/) + 1), length: Math.max(1, source.trim().length) };
}
