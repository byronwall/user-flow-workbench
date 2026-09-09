import assert from "node:assert/strict";
import test from "node:test";
import { diagramToDsl, parseDiagram, parseDiagramWithDiagnostics } from "./diagram-dsl.ts";

const FLOW = `diagram 1
type flow

graph checkout "Checkout"
node start actor "Start"
node done deliverable "Done"
edge finish start -> done
`;
const OVERVIEW = `diagram 1
type overview

overview app "Example"
purpose "A small idea."
group core "Core" {
  capability first "First" detail="A detail."
}
capability loose "Ungrouped"
`;
const APPLICATION = `diagram 1
type application

application app "Example application"
object user "User"
page home "Home" {
  state ready "Ready"
}
`;
const WIREFRAME = `diagram 1
type wireframe

wireframe sketch "A \\\"sketch\\\""
viewport 800 600
screen home "Home" basis=proposed {
  frame page {
    body {
      text "Line 1\\nLine 2"
    }
  }
}
`;

test("dispatches flow documents and preserves body semantics", () => {
  const parsed = parseDiagram(FLOW);
  assert.equal(parsed.type, "flow");
  assert.equal((parsed.document as import("../types/graph.ts").FlowDocument).graph.id, "checkout");
  assert.equal((parseDiagram(diagramToDsl(parsed)).document as import("../types/graph.ts").FlowDocument).graph.title, "Checkout");
});

test("dispatches overviews, including empty and ungrouped content", () => {
  const parsed = parseDiagram(OVERVIEW);
  assert.equal(parsed.type, "overview");
  assert.equal((parsed.document as import("../types/overview.ts").OverviewDocument).groups[0]?.capabilities[0]?.detail, "A detail.");
  assert.equal((parsed.document as import("../types/overview.ts").OverviewDocument).capabilities?.[0]?.groupId, undefined);
  assert.equal(diagramToDsl(parsed), OVERVIEW);
  const empty = parseDiagram("diagram 1\ntype overview\noverview draft \"Draft\"\n");
  assert.deepEqual((empty.document as import("../types/overview.ts").OverviewDocument).groups, []);
});

test("dispatches and formats application documents", () => {
  const parsed = parseDiagram(APPLICATION);
  assert.equal(parsed.type, "application");
  assert.equal((parsed.document as import("../types/application.ts").ApplicationDocument).pages[0]?.states[0]?.id, "ready");
  const formatted = diagramToDsl(parsed);
  assert.equal(diagramToDsl(parseDiagram(formatted)), formatted);
});

test("dispatches wireframes with the narrow lexical contract", () => {
  const parsed = parseDiagram(WIREFRAME);
  assert.equal(parsed.type, "wireframe");
  const formatted = diagramToDsl(parsed);
  assert.match(formatted, /basis=proposed/);
  assert.match(formatted, /text "Line 1\\nLine 2"/);
  assert.equal(diagramToDsl(parseDiagram(formatted)), formatted);
  const missingBasis = parseDiagramWithDiagnostics(WIREFRAME.replace(" basis=proposed", ""));
  assert.ok(missingBasis.diagnostics.some(diagnostic => diagnostic.code === "WIREFRAME101"));
});

test("reports envelope errors and located body errors", () => {
  const result = parseDiagramWithDiagnostics(`diagram 1\ntype overview\n\noverview draft "Draft"\ncapability dup "One"\ncapability dup "Two"\n`);
  assert.equal(result.diagnostics.length, 1);
  assert.equal(result.diagnostics[0]?.code, "OVERVIEW201");
  assert.equal(result.diagnostics[0]?.line, 6);
  const mixed = parseDiagramWithDiagnostics("diagram 1\ntype overview\n\nflow 3\n");
  assert.ok(mixed.diagnostics.some(diagnostic => diagnostic.code === "DIAGRAM105"));
});

test("offsets malformed overview declaration diagnostics through the common envelope", () => {
  const result = parseDiagramWithDiagnostics("diagram 1\ntype overview\n\noverview draft \"Draft\"\npurpose \"A purpose\" extra\n");
  const diagnostic = result.diagnostics.find(candidate => candidate.code === "OVERVIEW120");
  assert.equal(diagnostic?.line, 5);
  assert.equal(diagnostic?.column, 1);
});

test("rejects unknown, duplicate, and missing type declarations", () => {
  const unknown = parseDiagramWithDiagnostics("diagram 1\ntype other\n\nflow 3\ngraph wrong \"Wrong\"\nnode");
  assert.ok(unknown.diagnostics.some(d => d.code === "DIAGRAM103"));
  assert.equal(unknown.diagnostics.some(d => d.code.startsWith("FLOW")), false);
  const missing = parseDiagramWithDiagnostics("diagram 1\n\nflow 3\ngraph wrong \"Wrong\"\nnode");
  assert.equal(missing.diagnostics.some(d => d.code.startsWith("FLOW")), false);
  assert.ok(parseDiagramWithDiagnostics("diagram 1\ntype flow\ntype overview\n").diagnostics.some(d => d.code === "DIAGRAM104"));
  assert.ok(parseDiagramWithDiagnostics("diagram 1\nflow 3\n").diagnostics.some(d => d.code === "DIAGRAM103"));
});
