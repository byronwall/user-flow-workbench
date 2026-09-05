import assert from "node:assert/strict";
import test from "node:test";
import { materializeOverview } from "./overview-dsl.ts";
import { projectWorkspaceNavigation, selectWorkspaceEntry } from "./workspace-navigation.ts";
import type { DiagramCatalog } from "../types/diagram.ts";
import type { OverviewDocument } from "../types/overview.ts";

const entry = (path: string, type: "flow" | "overview" | "wireframe", valid = true) => ({ path, type, title: path, valid, diagnosticCount: valid ? 0 : 1 });

function catalog(...diagrams: ReturnType<typeof entry>[]): DiagramCatalog {
  return { rootName: "project", workspaceId: "project", diagrams };
}

function overview(overrides: Partial<OverviewDocument> = {}): OverviewDocument {
  return { id: "home", title: "Home", purpose: "", sourcePath: "home.diagram", groups: [], ...overrides };
}

test("selects the only valid overview as the workspace home", () => {
  assert.deepEqual(selectWorkspaceEntry({ rootName: "resume", workspaceId: "resume", diagrams: [entry("broken.diagram", "overview", false), entry("home.diagram", "overview"), entry("flow.diagram", "flow")] }), {
    kind: "overview",
    overview: entry("home.diagram", "overview"),
  });
});

test("prefers one valid application and offers a chooser for several", () => {
  const application = entry("app.diagram", "overview");
  const validApplication = { ...application, type: "application" as const };
  assert.deepEqual(selectWorkspaceEntry({ rootName: "resume", workspaceId: "resume", diagrams: [entry("home.diagram", "overview"), validApplication] }), {
    kind: "application", application: validApplication,
  });
  const second = { ...validApplication, path: "other-app.diagram" };
  assert.deepEqual(selectWorkspaceEntry({ rootName: "resume", workspaceId: "resume", diagrams: [validApplication, second, entry("home.diagram", "overview")] }), {
    kind: "application-chooser", applications: [validApplication, second],
  });
});

test("falls back from invalid applications to overview or inventory", () => {
  const invalidApplication = { ...entry("broken-app.diagram", "overview", false), type: "application" as const };
  assert.equal(selectWorkspaceEntry({ rootName: "resume", workspaceId: "resume", diagrams: [invalidApplication, entry("home.diagram", "overview")] }).kind, "overview");
  assert.equal(selectWorkspaceEntry({ rootName: "resume", workspaceId: "resume", diagrams: [invalidApplication, entry("flow.diagram", "flow")] }).kind, "inventory");
});

test("chooses among several valid overviews and falls back to inventory", () => {
  assert.equal(selectWorkspaceEntry({ rootName: "project", workspaceId: "project", diagrams: [entry("a.diagram", "overview"), entry("b.diagram", "overview")] }).kind, "overview-chooser");
  assert.deepEqual(selectWorkspaceEntry({ rootName: "project", workspaceId: "project", diagrams: [entry("broken.diagram", "overview", false), entry("flow.diagram", "flow")] }), { kind: "inventory" });
});

test("projects an empty overview and keeps the selected overview as home", () => {
  const result = projectWorkspaceNavigation(overview(), catalog(entry("home.diagram", "overview")), "home.diagram");
  assert.deepEqual(result, {
    overview: entry("home.diagram", "overview"),
    groups: [],
    ungroupedCapabilities: [],
    allDiagrams: [entry("home.diagram", "overview")],
    notLinkedHere: [],
  });
});

test("preserves grouped and ungrouped capability order with typed links", () => {
  const result = projectWorkspaceNavigation(overview({
    groups: [{ id: "first", title: "First", capabilities: [
      { id: "one", title: "One", groupId: "first", flowRefs: [{ path: "one.diagram", variant: "guided" }], wireframeRefs: [{ path: "screen.diagram", screen: "start" }] },
      { id: "two", title: "Two", groupId: "first" },
    ] }],
    capabilities: [{ id: "three", title: "Three", flowRefs: [{ path: "three.diagram" }] }],
  }), catalog(
    entry("home.diagram", "overview"),
    entry("one.diagram", "flow"),
    entry("screen.diagram", "wireframe"),
    entry("three.diagram", "flow"),
    entry("extra.diagram", "wireframe"),
  ), "home.diagram");

  assert.deepEqual(result.groups.map((group) => [group.id, group.capabilities.map((capability) => capability.id)]), [["first", ["one", "two"]]]);
  assert.deepEqual(result.ungroupedCapabilities.map((capability) => capability.id), ["three"]);
  assert.deepEqual(result.groups[0].capabilities[0].relatedFlows, [{ ...entry("one.diagram", "flow"), variant: "guided" }]);
  assert.deepEqual(result.groups[0].capabilities[0].relatedWireframeScreens, [{ ...entry("screen.diagram", "wireframe"), screen: "start" }]);
  assert.deepEqual(result.notLinkedHere.map((item) => item.path), ["extra.diagram"]);
});

test("keeps shared artifacts under each capability and dedupes only not-linked inventory", () => {
  const view = overview({
    groups: [{ id: "group", title: "Group", capabilities: [
      { id: "first", title: "First", flowRefs: [{ path: "shared.diagram" }, { path: "second.diagram" }] },
      { id: "second", title: "Second", wireframeRefs: [{ path: "shared-wireframe.diagram" }, { path: "shared-wireframe.diagram", screen: "details" }] },
    ] }],
  });
  const result = projectWorkspaceNavigation(view, catalog(
    entry("home.diagram", "overview"),
    entry("shared.diagram", "flow"),
    entry("second.diagram", "flow"),
    entry("shared-wireframe.diagram", "wireframe"),
  ), "home.diagram");
  assert.deepEqual(result.groups[0].capabilities[0].relatedFlows.map((item) => item.path), ["shared.diagram", "second.diagram"]);
  assert.deepEqual(result.groups[0].capabilities[1].relatedWireframeScreens.map((item) => item.screen), [undefined, "details"]);
  assert.deepEqual(result.notLinkedHere, []);
});

test("projects a materialized overview variant and keeps catalog order, including invalid files", () => {
  const base = overview({
    groups: [{ id: "group", title: "Group", capabilities: [{ id: "base", title: "Base", flowRefs: [{ path: "base.diagram" }] }] }],
    variants: [{ id: "focused", title: "Focused", operations: [
      { kind: "add-capability", capability: { id: "new", title: "New", groupId: "group", wireframeRefs: [{ path: "new.diagram", screen: "main" }] } },
      { kind: "remove-capability", capabilityId: "base" },
    ] }],
  });
  const result = projectWorkspaceNavigation(materializeOverview(base, "focused"), catalog(
    entry("new.diagram", "wireframe"),
    entry("base.diagram", "flow", false),
    entry("broken.diagram", "flow", false),
    entry("other.diagram", "flow"),
  ), "home.diagram");
  assert.deepEqual(result.groups[0].capabilities.map((capability) => capability.id), ["new"]);
  assert.deepEqual(result.groups[0].capabilities[0].relatedWireframeScreens.map((item) => [item.path, item.screen]), [["new.diagram", "main"]]);
  assert.deepEqual(result.allDiagrams.map((item) => item.path), ["new.diagram", "base.diagram", "broken.diagram", "other.diagram"]);
  assert.deepEqual(result.notLinkedHere.map((item) => item.path), ["other.diagram"]);
});

test("does not invent a target relationship when a reference is absent from the catalog", () => {
  const result = projectWorkspaceNavigation(overview({ capabilities: [{ id: "capability", title: "Capability", flowRefs: [{ path: "missing.diagram" }] }] }), catalog(entry("home.diagram", "overview")), "home.diagram");
  assert.deepEqual(result.ungroupedCapabilities[0].relatedFlows, [{ path: "missing.diagram", title: "missing.diagram", type: "flow", valid: false, diagnosticCount: 0 }]);
  assert.deepEqual(result.notLinkedHere, []);
});

test("keeps relationship types explicit and invalidates wrong-type targets", () => {
  const result = projectWorkspaceNavigation(overview({ capabilities: [{
    id: "capability",
    title: "Capability",
    flowRefs: [{ path: "wireframe.diagram" }],
    wireframeRefs: [{ path: "flow.diagram" }],
  }] }), catalog(
    entry("home.diagram", "overview"),
    entry("wireframe.diagram", "wireframe"),
    entry("flow.diagram", "flow"),
  ), "home.diagram");
  assert.deepEqual(result.ungroupedCapabilities[0].relatedFlows, [{ ...entry("wireframe.diagram", "wireframe"), type: "flow", valid: false }]);
  assert.deepEqual(result.ungroupedCapabilities[0].relatedWireframeScreens, [{ ...entry("flow.diagram", "flow"), type: "wireframe", valid: false }]);
});

test("preserves diagnostics for invalid relationship targets", () => {
  const invalidFlow = { ...entry("broken.diagram", "flow", false), diagnosticCount: 3 };
  const result = projectWorkspaceNavigation(overview({ capabilities: [{ id: "capability", title: "Capability", flowRefs: [{ path: "broken.diagram" }] }] }), catalog(entry("home.diagram", "overview"), invalidFlow), "home.diagram");
  assert.deepEqual(result.ungroupedCapabilities[0].relatedFlows, [{ ...invalidFlow, type: "flow" }]);
  assert.deepEqual(result.allDiagrams, [entry("home.diagram", "overview"), invalidFlow]);
});

test("only exposes a matching overview catalog entry as home", () => {
  const diagrams = catalog(entry("home.diagram", "overview"), entry("flow.diagram", "flow"));
  assert.equal("overview" in projectWorkspaceNavigation(overview(), diagrams, "missing.diagram"), false);
  assert.equal("overview" in projectWorkspaceNavigation(overview(), diagrams, "flow.diagram"), false);
});
