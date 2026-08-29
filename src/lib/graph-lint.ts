import { materializeVariant } from "./graph-dsl.ts";
import { isFlowEdge } from "./graph-semantics.ts";
import type { FlowDocument, FlowGraph } from "../types/graph.ts";

export type GraphLintSeverity = "error";

export interface GraphLintDiagnostic {
  code: "FLOWLINT001";
  severity: GraphLintSeverity;
  message: string;
  nodeId: string;
  variantId?: string;
}

function processNodesWithoutOutput(graph: FlowGraph): Set<string> {
  const nodesWithOutput = new Set(graph.edges.filter(isFlowEdge).map((edge) => edge.from));
  return new Set(
    graph.nodes
      .filter((node) => node.type === "process" && !nodesWithOutput.has(node.id))
      .map((node) => node.id),
  );
}

function processOutputDiagnostic(nodeId: string, variantId?: string): GraphLintDiagnostic {
  return {
    code: "FLOWLINT001",
    severity: "error",
    message: `Process node "${nodeId}" has no outgoing flow edge.`,
    nodeId,
    ...(variantId ? { variantId } : {}),
  };
}

/** Lint the base graph and each materialized variant. */
export function lintFlowDocument(document: FlowDocument): GraphLintDiagnostic[] {
  const diagnostics: GraphLintDiagnostic[] = [];
  const baseFailures = processNodesWithoutOutput(document.graph);

  for (const nodeId of baseFailures) diagnostics.push(processOutputDiagnostic(nodeId));

  for (const variant of document.variants) {
    const variantFailures = processNodesWithoutOutput(materializeVariant(document, variant.id));
    for (const nodeId of variantFailures) {
      // Report only defects introduced by this view. The base defect already has one diagnostic.
      if (!baseFailures.has(nodeId)) diagnostics.push(processOutputDiagnostic(nodeId, variant.id));
    }
  }

  return diagnostics;
}
