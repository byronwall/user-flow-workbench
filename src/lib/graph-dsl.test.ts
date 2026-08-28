import assert from "node:assert/strict";
import test from "node:test";
import { graphToDsl, parseGraphDsl, parseGraphDslWithDiagnostics } from "./graph-dsl.ts";
import type { FlowGraph } from "../types/graph.ts";

const COMPLETE_SOURCE = `flow 1

graph checkout "Online checkout"
description "Move from intent to confirmation."

node customer actor "Customer" body="Wants to buy an item." tags=["person","buyer"] layout=0,1
node payment process "Submit payment" body="Authorize the selected method." tags=["checkout","money"] layout=2,1
node confirmation goal "Order confirmed" layout=3,1

edge starts-payment customer -> payment label="checks out"
edge payment-completes payment -> confirmation label="approved" emphasis=true

position customer 88,154
position payment 620,154
position confirmation 940,154
`;

test("parses and formats every Draft 0.2 field", () => {
  const graph = parseGraphDsl(COMPLETE_SOURCE);
  assert.equal(graph.dslVersion, 1);
  assert.equal(graph.schemaVersion, 3);
  assert.deepEqual(graph.nodes[1].tags, ["checkout", "money"]);
  assert.deepEqual(graph.layout?.hints?.payment, { column: 2, row: 1 });
  assert.deepEqual(graph.layout?.positions?.payment, { x: 620, y: 154 });
  assert.deepEqual(graph.edges[1], {
    id: "payment-completes",
    from: "payment",
    to: "confirmation",
    label: "approved",
    emphasis: true,
  });
  assert.equal(graphToDsl(graph, { includePositions: true }), COMPLETE_SOURCE);
});

test("canonical formatting is idempotent and removes comments", () => {
  const noisy = `flow\t1
  # graph metadata
graph   checkout   "Online checkout"
node customer actor "Customer" layout=0.0,1.00 tags=["person", "buyer"] body="Wants to buy."
node confirmation goal "Confirmed"
edge done customer   -> confirmation emphasis=false label="success"
`;
  const once = graphToDsl(parseGraphDsl(noisy));
  const twice = graphToDsl(parseGraphDsl(once));
  assert.equal(once, twice);
  assert.equal(once.includes("#"), false);
  assert.match(once, /body="Wants to buy\." tags=\["person","buyer"\] layout=0,1/);
  assert.match(once, /edge done customer -> confirmation label="success"/);
  assert.equal(once.includes("emphasis=false"), false);
});

test("stable edge IDs survive insertion and reordering", () => {
  const original = parseGraphDsl(`flow 1
graph graph "Graph"
node a actor "A"
node b process "B"
node c goal "C"
edge a-to-b a -> b
edge b-to-c b -> c
`);
  const inserted: FlowGraph = {
    ...original,
    edges: [{ id: "a-to-c", from: "a", to: "c" }, ...original.edges],
  };
  const reparsed = parseGraphDsl(graphToDsl(inserted));
  assert.deepEqual(reparsed.edges.map((edge) => edge.id), ["a-to-c", "a-to-b", "b-to-c"]);
});

test("rejects ambiguous collections, flags, strings, and numbers", () => {
  const cases = [
    ['node a actor "A" tags="one, two"', "FLOW154"],
    ['node a actor "A" tags=["one","one"]', "FLOW155"],
    ['node a actor "A" layout=+2,1', "FLOW141"],
    ['node a actor "A" layout=02,1', "FLOW141"],
    ['node a actor "A" layout=.5,1', "FLOW141"],
    ['node a actor "A" body="two""parts"', "FLOW125"],
    ['node a actor "A" body=unquoted', "FLOW122"],
  ];
  for (const [node, code] of cases) {
    const result = parseGraphDslWithDiagnostics(`flow 1\ngraph g "G"\n${node}\n`);
    assert.ok(result.diagnostics.some((diagnostic) => diagnostic.code === code), `${node} must report ${code}`);
  }
});

test("formats exponential JavaScript numbers as canonical decimals", () => {
  const graph = parseGraphDsl(`flow 1\ngraph tiny "Tiny"\nnode a actor "A"\n`);
  graph.layout = { positions: { a: { x: 1e-7, y: 1e21 } } };
  const formatted = graphToDsl(graph, { includePositions: true });
  assert.match(formatted, /position a 0\.0000001,1000000000000000000000/);
  assert.deepEqual(parseGraphDsl(formatted), graph);
});

test("recovers by line and returns repair-grade reference diagnostics", () => {
  const result = parseGraphDslWithDiagnostics(`flow 1
graph repair "Repair"
node start actor "Start"
node !!! broken
node confirmation goal "Confirmation"
edge finish start -> confirmaton
position missing 10,20
`);
  assert.deepEqual(result.graph.nodes.map((node) => node.id), ["start", "confirmation"]);
  assert.deepEqual(result.graph.edges.map((edge) => edge.id), ["finish"]);
  const unknown = result.diagnostics.find((diagnostic) => diagnostic.code === "FLOW203" && diagnostic.actual === "confirmaton");
  assert.ok(unknown);
  assert.equal(unknown.line, 6);
  assert.equal(unknown.column, 22);
  assert.equal(unknown.relatedId, "finish");
  assert.equal(unknown.suggestion, 'Did you mean "confirmation"?');
  assert.ok(result.diagnostics.length >= 3);
});

test("common AST mutations round-trip without unrelated identity changes", () => {
  let graph = parseGraphDsl(COMPLETE_SOURCE);

  graph.nodes[1].title = "Authorize payment";
  graph.nodes[1].tags = [...(graph.nodes[1].tags || []), "critical"];
  graph.nodes.push({ id: "receipt", type: "deliverable", title: "Receipt" });
  graph.edges.push({ id: "confirmation-produces-receipt", from: "confirmation", to: "receipt", label: "creates" });

  const oldId = "confirmation";
  const newId = "confirmed-order";
  const renamed = graph.nodes.find((node) => node.id === oldId);
  assert.ok(renamed);
  renamed.id = newId;
  for (const edge of graph.edges) {
    if (edge.from === oldId) edge.from = newId;
    if (edge.to === oldId) edge.to = newId;
  }
  if (graph.layout?.hints?.[oldId]) {
    graph.layout.hints[newId] = graph.layout.hints[oldId];
    delete graph.layout.hints[oldId];
  }
  if (graph.layout?.positions?.[oldId]) {
    graph.layout.positions[newId] = graph.layout.positions[oldId];
    delete graph.layout.positions[oldId];
  }

  graph.edges = graph.edges.filter((edge) => edge.id !== "starts-payment");
  const formatted = graphToDsl(graph, { includePositions: true });
  const reparsed = parseGraphDsl(formatted);
  assert.deepEqual(reparsed, graph);
  assert.deepEqual(reparsed.edges.map((edge) => edge.id), ["payment-completes", "confirmation-produces-receipt"]);

  const semanticOnly = structuredClone(reparsed);
  delete semanticOnly.layout;
  const withoutPresentation = parseGraphDsl(graphToDsl(semanticOnly));
  assert.deepEqual(withoutPresentation.nodes, reparsed.nodes);
  assert.deepEqual(withoutPresentation.edges, reparsed.edges);
});
