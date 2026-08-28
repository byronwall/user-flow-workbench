import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { graphToDsl, materializeVariant, parseGraphDsl, parseGraphDslWithDiagnostics } from "./graph-dsl.ts";

const COMPLETE_SOURCE = `flow 2

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

const VARIANT_SOURCE = `flow 2

graph checkout "Online checkout"
description "Move from intent to confirmation."

node customer actor "Customer" body="Wants to buy an item."
node cart process "Review cart"
node shipping process "Enter shipping details"
node payment process "Submit payment"
node confirmation goal "Order confirmed"

edge customer-cart customer -> cart
edge cart-shipping cart -> shipping
edge shipping-payment shipping -> payment
edge payment-confirmation payment -> confirmation

variant express "Express checkout" {
  description "Skip shipping for returning customers."

  remove edge cart-shipping
  remove edge shipping-payment
  remove node shipping
  set node cart title="Confirm saved details"
  unset node customer body
  add edge cart-payment cart -> payment label="uses saved details"
  position cart 420,180
}
`;

test("parses and formats every base field", () => {
  const document = parseGraphDsl(COMPLETE_SOURCE);
  assert.equal(document.dslVersion, 2);
  assert.equal(document.schemaVersion, 4);
  assert.deepEqual(document.graph.nodes[1].tags, ["checkout", "money"]);
  assert.deepEqual(document.graph.layout?.hints?.payment, { column: 2, row: 1 });
  assert.deepEqual(document.graph.layout?.positions?.payment, { x: 620, y: 154 });
  assert.equal(graphToDsl(document, { includePositions: true }), COMPLETE_SOURCE);
});

test("materializes ordered variant operations without changing the base graph", () => {
  const document = parseGraphDsl(VARIANT_SOURCE);
  const base = structuredClone(document.graph);
  const graph = materializeVariant(document, "express");
  assert.deepEqual(document.graph, base);
  assert.deepEqual(graph.nodes.map((node) => node.id), ["customer", "cart", "payment", "confirmation"]);
  assert.equal(graph.nodes.find((node) => node.id === "cart")?.title, "Confirm saved details");
  assert.equal("body" in (graph.nodes.find((node) => node.id === "customer") || {}), false);
  assert.deepEqual(graph.edges.map((edge) => edge.id), ["customer-cart", "payment-confirmation", "cart-payment"]);
  assert.deepEqual(graph.layout?.positions?.cart, { x: 420, y: 180 });
  assert.equal(graphToDsl(parseGraphDsl(VARIANT_SOURCE)), VARIANT_SOURCE);
});

test("clear all creates an independent graph when it is first", () => {
  const document = parseGraphDsl(`flow 2
graph source "Source"
node old actor "Old"
variant replacement "Replacement" {
  clear all
  add node start actor "New start"
  add node done goal "Done"
  add edge start-done start -> done
}
`);
  const graph = materializeVariant(document, "replacement");
  assert.deepEqual(graph.nodes.map((node) => node.id), ["start", "done"]);
  assert.deepEqual(graph.edges.map((edge) => edge.id), ["start-done"]);
  assert.equal(graph.layout, undefined);
});

test("canonical formatting is idempotent and removes comments", () => {
  const noisy = `flow\t2
# graph metadata
graph   checkout   "Online checkout"
node customer actor "Customer" layout=0.0,1.00 tags=["person", "buyer"] body="Wants to buy."
node confirmation goal "Confirmed"
edge done customer   -> confirmation emphasis=false label="success"
`;
  const once = graphToDsl(parseGraphDsl(noisy));
  assert.equal(once, graphToDsl(parseGraphDsl(once)));
  assert.equal(once.includes("#"), false);
  assert.match(once, /body="Wants to buy\." tags=\["person","buyer"\] layout=0,1/);
  assert.equal(once.includes("emphasis=false"), false);
});

test("stable edge IDs survive insertion and reordering", () => {
  const document = parseGraphDsl(`flow 2
graph graph "Graph"
node a actor "A"
node b process "B"
node c goal "C"
edge a-to-b a -> b
edge b-to-c b -> c
`);
  document.graph.edges.unshift({ id: "a-to-c", from: "a", to: "c" });
  const reparsed = parseGraphDsl(graphToDsl(document));
  assert.deepEqual(reparsed.graph.edges.map((edge) => edge.id), ["a-to-c", "a-to-b", "b-to-c"]);
});

test("rejects ambiguous base values and invalid ordered variant operations", () => {
  const cases = [
    ['node a actor "A" tags="one, two"', "FLOW154"],
    ['node a actor "A" tags=["one","one"]', "FLOW155"],
    ['node a actor "A" layout=+2,1', "FLOW141"],
    ['node a actor "A" body=unquoted', "FLOW122"],
  ];
  for (const [node, code] of cases) {
    const result = parseGraphDslWithDiagnostics(`flow 2\ngraph g "G"\n${node}\n`);
    assert.ok(result.diagnostics.some((diagnostic) => diagnostic.code === code), `${node} must report ${code}`);
  }

  const invalid = [
    `set node missing title="No"`,
    `remove node missing`,
    `add edge bad a -> missing`,
    `unset node a title`,
    `set node a title="Changed"\n  clear all`,
  ];
  for (const operation of invalid) {
    const result = parseGraphDslWithDiagnostics(`flow 2\ngraph g "G"\nnode a actor "A"\nvariant broken "Broken" {\n  ${operation}\n}\n`);
    assert.ok(result.diagnostics.length > 0, operation);
  }
});

test("returns repair-grade variant diagnostics with source context", () => {
  const result = parseGraphDslWithDiagnostics(`flow 2
graph repair "Repair"
node start actor "Start"
node confirmation goal "Confirmation"
variant typo "Typo" {
  set node confirmaton title="Done"
}
`);
  const diagnostic = result.diagnostics.find((item) => item.relatedId === "confirmaton");
  assert.ok(diagnostic);
  assert.equal(diagnostic.line, 6);
  assert.equal(diagnostic.variantId, "typo");
  assert.match(diagnostic.message, /confirmaton/);
});

test("formats exponential positions as canonical decimals", () => {
  const document = parseGraphDsl(`flow 2\ngraph tiny "Tiny"\nnode a actor "A"\n`);
  document.graph.layout = { positions: { a: { x: 1e-7, y: 1e21 } } };
  const formatted = graphToDsl(document, { includePositions: true });
  assert.match(formatted, /position a 0\.0000001,1000000000000000000000/);
  assert.deepEqual(parseGraphDsl(formatted), document);
});

test("the production resume flow stays valid and canonical", () => {
  const source = readFileSync(new URL("../data/flows/resume-alignment.flow", import.meta.url), "utf8");
  const document = parseGraphDsl(source);
  assert.equal(document.variants[0]?.id, "per-job-resume");
  assert.equal(materializeVariant(document, "per-job-resume").nodes.length, 21);
  assert.equal(graphToDsl(document), source);
});
