import assert from "node:assert/strict";
import test from "node:test";
import { overviewWireframeInventory } from "./overview-wireframe-inventory.ts";

test("lists valid local and explicit wireframes with stable, deduplicated context", () => {
  const result = overviewWireframeInventory([
    { path: "src/data/overviews/app.diagram", type: "overview", title: "App", valid: true, diagnosticCount: 0 },
    { path: "src/data/overviews/local.diagram", type: "wireframe", title: "Local", valid: true, diagnosticCount: 0 },
    { path: "src/data/overviews/invalid.diagram", type: "wireframe", title: "Invalid", valid: false, diagnosticCount: 1 },
    { path: "src/data/overviews/not-wireframe.diagram", type: "flow", title: "Wrong type", valid: true, diagnosticCount: 0 },
    { path: "src/data/wireframes/z.diagram", type: "wireframe", title: "Zed", valid: true, diagnosticCount: 0 },
    { path: "src/data/wireframes/a.diagram", type: "wireframe", title: "Alpha", valid: true, diagnosticCount: 0 },
    { path: "src/data/wireframes/a.diagram", type: "wireframe", title: "Duplicate", valid: true, diagnosticCount: 0 },
    { path: "src/data/wireframes/missing.diagram", type: "wireframe", title: "Missing", valid: false, diagnosticCount: 1 },
    { path: "src/data/overviews/nested/deeper.diagram", type: "wireframe", title: "Nested", valid: true, diagnosticCount: 0 },
  ], "src/data/overviews/app.diagram", {
    id: "app",
    title: "App",
    purpose: "",
    groups: [{ id: "group", title: "Group", capabilities: [
      { id: "second", title: "Second capability", wireframeRefs: [{ path: "src/data/wireframes/a.diagram", screen: "details" }, { path: "src/data/wireframes/z.diagram", screen: "z" }] },
      { id: "first", title: "First capability", wireframeRefs: [{ path: "src/data/wireframes/a.diagram", screen: "home" }, { path: "src/data/overviews/nested/deeper.diagram", screen: "nested" }] },
    ] }],
    capabilities: [{ id: "ungrouped", title: "Ungrouped capability", wireframeRefs: [{ path: "src/data/wireframes/z.diagram" }] }],
  });

  assert.deepEqual(result, [
    { path: "src/data/overviews/local.diagram", title: "Local", linkedFrom: [] },
    { path: "src/data/overviews/nested/deeper.diagram", title: "Nested", linkedFrom: ["First capability"], relationship: { capabilityId: "first", screen: "nested" } },
    { path: "src/data/wireframes/a.diagram", title: "Alpha", linkedFrom: ["First capability", "Second capability"], relationship: { capabilityId: "second", screen: "details" } },
    { path: "src/data/wireframes/z.diagram", title: "Zed", linkedFrom: ["Second capability", "Ungrouped capability"], relationship: { capabilityId: "second", screen: "z" } },
  ]);
});

test("does not invent context for folder rows or include invalid explicit targets", () => {
  const result = overviewWireframeInventory([
    { path: "project/overview.diagram", type: "overview", title: "Overview", valid: true, diagnosticCount: 0 },
    { path: "project/local.diagram", type: "wireframe", title: "Local", valid: true, diagnosticCount: 0 },
    { path: "project/nested/child.diagram", type: "wireframe", title: "Nested", valid: true, diagnosticCount: 0 },
    { path: "project/flow.diagram", type: "flow", title: "Flow", valid: true, diagnosticCount: 0 },
    { path: "project/bad.diagram", type: "wireframe", title: "Bad", valid: false, diagnosticCount: 1 },
  ], "project/overview.diagram", {
    id: "overview",
    title: "Overview",
    purpose: "",
    groups: [],
    capabilities: [{ id: "capability", title: "Capability", wireframeRefs: [
      { path: "project/nested/child.diagram", screen: "home" },
      { path: "project/flow.diagram", screen: "wrong-type" },
      { path: "project/bad.diagram", screen: "invalid" },
      { path: "missing.diagram", screen: "missing" },
    ] }],
  });

  assert.deepEqual(result, [
    { path: "project/local.diagram", title: "Local", linkedFrom: [] },
    { path: "project/nested/child.diagram", title: "Nested", linkedFrom: ["Capability"], relationship: { capabilityId: "capability", screen: "home" } },
  ]);
});
