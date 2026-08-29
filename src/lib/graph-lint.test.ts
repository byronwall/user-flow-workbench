import assert from "node:assert/strict";
import test from "node:test";
import { parseGraphDsl } from "./graph-dsl.ts";
import { lintFlowDocument } from "./graph-lint.ts";

test("reports a base process without an outgoing flow edge", () => {
  const document = parseGraphDsl(`flow 3
graph broken "Broken"
node start actor "Start"
node abandoned process "Abandoned process"
edge start-abandoned start -> abandoned
`);

  assert.deepEqual(lintFlowDocument(document), [{
    code: "FLOWLINT001",
    severity: "error",
    message: 'Process node "abandoned" has no outgoing flow edge.',
    nodeId: "abandoned",
  }]);
});

test("ignores semantic edges and catches a process added without variant output", () => {
  const document = parseGraphDsl(`flow 3
graph variants "Variants"
node start actor "Start"
node step process "Step"
node done deliverable "Done"
node need need "Need"
edge start-step start -> step
edge step-done step -> done
variant broken "Broken" {
  add node gap process "Find gaps"
  add edge done-gap done -> gap
  add edge gap-need gap -> need relation=addresses
}
`);

  assert.deepEqual(lintFlowDocument(document), [{
    code: "FLOWLINT001",
    severity: "error",
    message: 'Process node "gap" has no outgoing flow edge.',
    nodeId: "gap",
    variantId: "broken",
  }]);
});

test("reports a variant that removes a process output", () => {
  const document = parseGraphDsl(`flow 3
graph variants "Variants"
node start actor "Start"
node step process "Step"
node done deliverable "Done"
edge start-step start -> step
edge step-done step -> done
variant broken "Broken" {
  remove edge step-done
}
`);

  assert.equal(lintFlowDocument(document)[0]?.variantId, "broken");
  assert.equal(lintFlowDocument(document)[0]?.nodeId, "step");
});
