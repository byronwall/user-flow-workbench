import assert from "node:assert/strict";
import test from "node:test";
import { parseDiagram } from "./diagram-dsl.ts";
import { formatFlowDiagramSource, semanticDocumentSignature } from "./flow-workbench.ts";
import type { FlowDocument } from "../types/graph.ts";

const document: FlowDocument = {
  dslVersion: 3,
  schemaVersion: 5,
  graph: {
    id: "example",
    title: "Example",
    nodes: [
      { id: "start", type: "actor", title: "Start", body: "", tags: [] },
      { id: "done", type: "deliverable", title: "Done", body: "", tags: [] },
    ],
    edges: [{ id: "finish", from: "start", to: "done" }],
  },
  variants: [],
};

test("flow workbench exports one common envelope and round-trips", () => {
  const source = formatFlowDiagramSource(document, false);
  assert.match(source, /^diagram 1\ntype flow\n\n/);
  assert.doesNotMatch(source, /type flow\n\nflow 3/);
  assert.doesNotMatch(source, /\nflow 3\n/);
  const parsed = parseDiagram(source);
  assert.equal(parsed.type, "flow");
  assert.equal(parsed.document.graph.title, "Example");
  assert.equal(parsed.document.graph.layout?.positions, undefined);
});

test("semantic signatures ignore persisted view metadata and default values", () => {
  const withViewMetadata = structuredClone(document);
  withViewMetadata.graph.layout = {
    hints: { start: { column: 0, row: 4 }, done: { column: 3, row: 2 } },
    positions: { start: { x: 120, y: 240 }, done: { x: 560, y: 240 } },
  };
  withViewMetadata.graph.edges[0].relation = "flow";
  assert.equal(semanticDocumentSignature(withViewMetadata), semanticDocumentSignature(document));

  const positionVariantBaseline = structuredClone(document);
  positionVariantBaseline.variants = [{
    id: "saved-view",
    title: "Saved view",
    operations: [],
  }];
  const positionVariant = structuredClone(positionVariantBaseline);
  positionVariant.variants[0].operations = [{ kind: "set-position", nodeId: "start", position: { x: 300, y: 420 } }];
  assert.equal(semanticDocumentSignature(positionVariant), semanticDocumentSignature(positionVariantBaseline));

  const nodeTextBaseline = structuredClone(document);
  const withNodeEdit = structuredClone(nodeTextBaseline);
  withNodeEdit.graph.nodes[0].title = "Edited start";
  assert.notEqual(semanticDocumentSignature(withNodeEdit), semanticDocumentSignature(nodeTextBaseline));

  const semanticVariantBaseline = structuredClone(positionVariantBaseline);
  const withVariantEdit = structuredClone(semanticVariantBaseline);
  withVariantEdit.variants[0].operations = [{ kind: "set-node", nodeId: "start", changes: { title: "Variant start" } }];
  assert.notEqual(semanticDocumentSignature(withVariantEdit), semanticDocumentSignature(semanticVariantBaseline));
});
