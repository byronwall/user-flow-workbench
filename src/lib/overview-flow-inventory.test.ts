import assert from "node:assert/strict";
import test from "node:test";
import { overviewFlowInventory } from "./overview-flow-inventory.ts";

test("unions valid project flows and linked flows, dedupes, and keeps first link context", () => {
  const result = overviewFlowInventory([
    { path: "src/data/overviews/local.diagram", type: "overview", title: "Overview", valid: true, diagnosticCount: 0 },
    { path: "src/data/overviews/local-flow.diagram", type: "flow", title: "Local flow", valid: true, diagnosticCount: 0 },
    { path: "src/data/flows/z.diagram", type: "flow", title: "Zed", valid: true, diagnosticCount: 0 },
    { path: "src/data/flows/a.diagram", type: "flow", title: "Alpha", valid: true, diagnosticCount: 0 },
    { path: "other/a.diagram", type: "flow", title: "Remote", valid: true, diagnosticCount: 0 },
    { path: "other/a.diagram", type: "flow", title: "Duplicate", valid: true, diagnosticCount: 0 },
    { path: "src/data/flows/b.diagram", type: "flow", title: "Invalid", valid: false, diagnosticCount: 1 },
    { path: "src/data/overviews/invalid.diagram", type: "flow", title: "Invalid local", valid: false, diagnosticCount: 1 },
    { path: "other/overview.diagram", type: "overview", title: "Not a flow", valid: true, diagnosticCount: 0 },
  ], "src/data/overviews/local.diagram", {
    id: "local",
    title: "Local",
    purpose: "",
    groups: [{ id: "group", title: "Group", capabilities: [
      { id: "first", title: "First capability", flowRefs: [{ path: "other/a.diagram", variant: "guided" }] },
      { id: "second", title: "Second capability", flowRefs: [{ path: "other/a.diagram" }] },
    ] }],
  });

  assert.deepEqual(result, [
    { path: "other/a.diagram", title: "Remote", linkedFrom: ["First capability", "Second capability"], relationship: { capabilityId: "first", variant: "guided" } },
    { path: "src/data/overviews/local-flow.diagram", title: "Local flow", linkedFrom: [] },
  ]);
});
