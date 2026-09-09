import assert from "node:assert/strict";
import { mkdtemp, mkdir, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { parseApplicationDsl } from "../lib/application-dsl.ts";
import { FlowCatalogError, readDiagramCatalog, readFlowCatalog, readFlowDocument, readDiagramDocument, resolveApplicationCoverage, resolveApplicationReferences, resolveFlowRoot, resolveOverviewReferences, resolveReferenceImagePath } from "./flow-catalog.ts";

const VALID_FLOW = `diagram 1
type flow

graph example "Example flow"
node start actor "Start"
`;
const VALID_WIREFRAME = `diagram 1
type wireframe

wireframe example "Example wireframe"
viewport 800 600
screen home "Home" basis=proposed {
  frame page {
    body {
      text "Home"
    }
  }
}
`;
const VALID_APPLICATION = `diagram 1
type application

application studio "Evidence Studio"
object project "Project"
page home "Home" {
  state ready "Ready"
}
`;

const VALID_OVERVIEW = `diagram 1
type overview

overview app "App"
capability home "Home"
`;

test("catalog finds nested flows and skips generated directories", async () => {
  const root = await mkdtemp(join(tmpdir(), "flow-catalog-"));
  await mkdir(join(root, "nested"));
  await mkdir(join(root, "node_modules"));
  await writeFile(join(root, "root.diagram"), VALID_FLOW);
  await writeFile(join(root, "nested", "child.diagram"), VALID_FLOW.replace("Example flow", "Nested flow"));
  await writeFile(join(root, "node_modules", "ignored.diagram"), VALID_FLOW);

  const catalog = await readFlowCatalog(root);
  assert.equal(catalog.rootName, root.split("/").at(-1));
  assert.deepEqual(catalog.flows.map((flow) => flow.path), ["nested/child.diagram", "root.diagram"]);
  assert.equal(catalog.flows[0]?.title, "Nested flow");
});

test("catalog marks syntax errors without hiding the file", async () => {
  const root = await mkdtemp(join(tmpdir(), "flow-catalog-"));
  await writeFile(join(root, "broken.diagram"), "diagram 1\ntype flow\nflow 3\ngraph broken \"Broken\"\nnode");

  const catalog = await readFlowCatalog(root);
  assert.equal(catalog.flows[0]?.valid, false);
  assert.ok((catalog.flows[0]?.diagnosticCount || 0) > 0);
});

test("document loading rejects traversal and symbolic links", async () => {
  const root = await mkdtemp(join(tmpdir(), "flow-catalog-"));
  const outside = await mkdtemp(join(tmpdir(), "flow-outside-"));
  await writeFile(join(outside, "outside.diagram"), VALID_FLOW);
  await symlink(join(outside, "outside.diagram"), join(root, "linked.diagram"));

  await assert.rejects(
    () => readFlowDocument("../outside.diagram", root),
    (error: unknown) => error instanceof FlowCatalogError && error.status === 404,
  );
  await assert.rejects(
    () => readFlowDocument("linked.diagram", root),
    (error: unknown) => error instanceof FlowCatalogError && error.status === 404,
  );
});

test("reference images stay inside the workspace and use supported formats", async () => {
  const root = await mkdtemp(join(tmpdir(), "wireframe-reference-"));
  await writeFile(join(root, "actual.png"), "png");
  await writeFile(join(root, "notes.txt"), "no");
  const canonicalRoot = await resolveFlowRoot(root);
  assert.equal(await resolveReferenceImagePath(canonicalRoot, "actual.png"), join(canonicalRoot, "actual.png"));
  await assert.rejects(() => resolveReferenceImagePath(canonicalRoot, "../actual.png"));
  await assert.rejects(() => resolveReferenceImagePath(canonicalRoot, "notes.txt"));
});

test("document loading returns its stable workspace and relative path", async () => {
  const root = await mkdtemp(join(tmpdir(), "flow-catalog-"));
  await writeFile(join(root, "example.diagram"), VALID_FLOW);

  const loaded = await readFlowDocument("example.diagram", root);
  assert.equal(loaded.path, "example.diagram");
  assert.equal(loaded.workspaceId.length, 16);
  assert.equal(loaded.document.graph.title, "Example flow");
});

test("catalog includes overview and flow diagrams while flow catalog filters overviews", async () => {
  const root = await mkdtemp(join(tmpdir(), "diagram-catalog-"));
  await writeFile(join(root, "flow.diagram"), VALID_FLOW);
  await writeFile(join(root, "overview.diagram"), "diagram 1\ntype overview\noverview app \"App\"\n");
  const all = await readDiagramCatalog(root);
  assert.deepEqual(all.diagrams.map(item => [item.path, item.type]), [["flow.diagram", "flow"], ["overview.diagram", "overview"]]);
  assert.deepEqual((await readFlowCatalog(root)).flows.map(item => item.path), ["flow.diagram"]);
  await assert.rejects(() => readFlowDocument("overview.diagram", root), (error: unknown) => error instanceof FlowCatalogError && error.status === 422);
});

test("catalog discovers and loads application diagrams through shared APIs", async () => {
  const root = await mkdtemp(join(tmpdir(), "application-catalog-"));
  await writeFile(join(root, "application.diagram"), VALID_APPLICATION);
  const catalog = await readDiagramCatalog(root);
  assert.deepEqual(catalog.diagrams.map((item) => [item.path, item.type, item.title, item.valid]), [["application.diagram", "application", "Evidence Studio", true]]);
  const loaded = await readDiagramDocument("application.diagram", root);
  assert.equal(loaded.type, "application");
  if (loaded.type === "application") assert.equal(loaded.document.pages[0]?.id, "home");
});

test("application references warn without blocking the authored page map", async () => {
  const root = await mkdtemp(join(tmpdir(), "application-references-"));
  await writeFile(join(root, "flow.diagram"), VALID_FLOW);
  await writeFile(join(root, "wireframe.diagram"), VALID_WIREFRAME);
  await writeFile(join(root, "overview.diagram"), VALID_OVERVIEW);
  await writeFile(join(root, "plan.md"), "# Other heading\n");
  const source = `diagram 1
type application

application app "App"
page home "Home" {
  overview "overview.diagram" capability=missing
  flow "flow.diagram" node=missing
  wireframe "wireframe.diagram" screen=missing
  document "plan.md" heading="Missing heading"
  document "plan.md" heading="Other heading"
  document "missing.md"
}
`;
  await writeFile(join(root, "application.diagram"), source);
  const loaded = await readDiagramDocument("application.diagram", root);
  assert.equal(loaded.type, "application");
  if (loaded.type !== "application") throw new Error("Expected application response.");
  assert.deepEqual(loaded.warnings?.filter((warning) => warning.code.startsWith("APPLICATION_REFERENCE_")).map((warning) => warning.code), [
    "APPLICATION_REFERENCE_MISSING_ID",
    "APPLICATION_REFERENCE_MISSING_ID",
    "APPLICATION_REFERENCE_MISSING_ID",
    "APPLICATION_REFERENCE_MISSING_HEADING",
    "APPLICATION_REFERENCE_MISSING",
  ]);
  assert.equal(loaded.document.pages[0]?.id, "home");
  assert.deepEqual(await resolveApplicationReferences(loaded.document, root), loaded.warnings?.filter((warning) => warning.code.startsWith("APPLICATION_REFERENCE_")));
});

test("application references report wrong diagram types and reject symlinks", async () => {
  const root = await mkdtemp(join(tmpdir(), "application-reference-types-"));
  const outside = await mkdtemp(join(tmpdir(), "application-reference-outside-"));
  await writeFile(join(root, "overview.diagram"), VALID_OVERVIEW);
  await writeFile(join(root, "flow.diagram"), VALID_FLOW);
  await writeFile(join(outside, "flow.diagram"), VALID_FLOW);
  await symlink(join(outside, "flow.diagram"), join(root, "linked.diagram"));
  const document = (await readDiagramDocument("overview.diagram", root));
  if (document.type !== "overview") throw new Error("Expected overview response.");
  const application = {
    id: "app", title: "App", objects: [], ownership: [], navigation: [], pages: [{
      id: "home", title: "Home", states: [], references: [
        { kind: "flow" as const, path: "overview.diagram", nodeId: "home" },
        { kind: "flow" as const, path: "linked.diagram", nodeId: "home" },
      ],
    }],
  };
  assert.deepEqual((await resolveApplicationReferences(application, root)).map((warning) => warning.code), [
    "APPLICATION_REFERENCE_WRONG_TYPE",
    "APPLICATION_REFERENCE_MISSING",
  ]);
});

test("application coverage checks only explicit artifacts and pages", async () => {
  const root = await mkdtemp(join(tmpdir(), "application-coverage-"));
  await writeFile(join(root, "flow.diagram"), `diagram 1\ntype flow\n\ngraph flow "Flow"\nnode start actor "Start"\nnode extra deliverable "Extra"\nedge start-extra start -> extra\n`);
  await writeFile(join(root, "overview.diagram"), `diagram 1\ntype overview\n\noverview app "App"\ncapability owned "Owned"\ncapability extra "Extra"\n`);
  await writeFile(join(root, "wireframe.diagram"), `diagram 1\ntype wireframe\n\nwireframe app "App"\nviewport 800 600\nscreen home "Home" basis=proposed {\n  frame page {\n    body {\n      text "Home"\n    }\n  }\n}\nscreen extra "Extra" basis=proposed {\n  frame page {\n    body {\n      text "Extra"\n    }\n  }\n}\n`);
  await writeFile(join(root, "unrelated.diagram"), VALID_FLOW);
  const application = parseApplicationDsl(`application app "App"\npage home "Home" {\n  flow "flow.diagram" node=start\n  overview "overview.diagram" capability=owned\n  wireframe "wireframe.diagram" screen=home\n}\npage settings "Settings" {\n}`);
  const warnings = await resolveApplicationCoverage(application, root);
  assert.deepEqual(warnings.map((warning) => warning.code), [
    "APPLICATION_COVERAGE_PAGE_WITHOUT_WIREFRAME",
    "APPLICATION_COVERAGE_UNCLAIMED_FLOW_NODE",
    "APPLICATION_COVERAGE_UNCLAIMED_OVERVIEW_CAPABILITY",
    "APPLICATION_COVERAGE_UNCLAIMED_WIREFRAME_SCREEN",
  ]);
  assert.ok(warnings.some((warning) => warning.code === "APPLICATION_COVERAGE_UNCLAIMED_FLOW_NODE" && warning.path === "flow.diagram" && warning.targetId === "extra"));
  assert.ok(!warnings.some((warning) => "path" in warning && warning.path === "unrelated.diagram"));
});

test("rejects symbolic-link path components", async () => {
  const root = await mkdtemp(join(tmpdir(), "diagram-catalog-"));
  const outside = await mkdtemp(join(tmpdir(), "diagram-outside-"));
  await writeFile(join(outside, "example.diagram"), VALID_FLOW);
  await symlink(outside, join(root, "linked"), "dir");
  await assert.rejects(() => readFlowDocument("linked/example.diagram", root), (error: unknown) => error instanceof FlowCatalogError && error.status === 404);
});

test("overview references resolve shared flow links and report missing or wrong targets", async () => {
  const root = await mkdtemp(join(tmpdir(), "diagram-catalog-"));
  await writeFile(join(root, "flow.diagram"), VALID_FLOW);
  await writeFile(join(root, "overview-target.diagram"), "diagram 1\ntype overview\noverview target \"Target\"\n");
  const source = `diagram 1
type overview

overview app "App"
capability one "One"
  flow "flow.diagram" variant=missing
  flow "missing.diagram"
capability two "Two"
  flow "overview-target.diagram"
`;
  await writeFile(join(root, "overview.diagram"), source);
  const loaded = await readDiagramDocument("overview.diagram", root);
  assert.equal(loaded.type, "overview");
  assert.equal(loaded.warnings?.length, 3);
  assert.ok(loaded.warnings?.some((warning) => warning.code === "OVERVIEW_FLOW_UNKNOWN_VARIANT"));
  assert.ok(loaded.warnings?.some((warning) => warning.code === "OVERVIEW_FLOW_MISSING"));
  assert.ok(loaded.warnings?.some((warning) => warning.code === "OVERVIEW_FLOW_WRONG_TYPE"));
  assert.equal(await resolveOverviewReferences(loaded.document, root).then((warnings) => warnings.length), 3);
});

test("overview selected view is materialized while the response keeps base source semantics", async () => {
  const root = await mkdtemp(join(tmpdir(), "diagram-catalog-"));
  await writeFile(join(root, "flow.diagram"), VALID_FLOW);
  await writeFile(join(root, "overview.diagram"), `diagram 1
type overview

overview app "App"
capability base "Base"
  flow "flow.diagram"
variant chosen "Chosen" {
  set capability base title="Chosen"
}
`);
  const loaded = await readDiagramDocument("overview.diagram", root, "chosen");
  assert.equal(loaded.type, "overview");
  if (loaded.type !== "overview") throw new Error("Expected overview response.");
  assert.equal(loaded.document.capabilities?.[0]?.title, "Base");
  assert.equal(loaded.view?.capabilities?.[0]?.title, "Chosen");
  assert.equal(loaded.activeVariant, "chosen");
});

test("overview reference resolution does not recurse through overview targets", async () => {
  const root = await mkdtemp(join(tmpdir(), "diagram-catalog-"));
  const a = `diagram 1\ntype overview\n\noverview a "A"\ncapability b "B"\n  flow "a.diagram"\n`;
  const b = `diagram 1\ntype overview\n\noverview b "B"\ncapability a "A"\n  flow "a.diagram"\n`;
  await writeFile(join(root, "a.diagram"), a);
  await writeFile(join(root, "b.diagram"), b);
  const loaded = await readDiagramDocument("a.diagram", root);
  if (loaded.type !== "overview") throw new Error("Expected overview response.");
  const warnings = await resolveOverviewReferences(loaded.document, root);
  assert.equal(warnings.length, 1);
  assert.equal(warnings[0]?.code, "OVERVIEW_FLOW_WRONG_TYPE");
});

test("overview wireframe references validate type, screen, and repairable targets", async () => {
  const root = await mkdtemp(join(tmpdir(), "diagram-catalog-"));
  await writeFile(join(root, "wireframe.diagram"), VALID_WIREFRAME);
  await writeFile(join(root, "flow.diagram"), VALID_FLOW);
  await writeFile(join(root, "overview.diagram"), `diagram 1
type overview

overview app "App"
capability one "One"
  wireframe "wireframe.diagram" screen=home
  wireframe "wireframe.diagram" screen=removed
  wireframe "flow.diagram"
  wireframe "missing.diagram"
`);
  const loaded = await readDiagramDocument("overview.diagram", root);
  assert.equal(loaded.type, "overview");
  assert.deepEqual(loaded.warnings?.map((warning) => warning.code), [
    "OVERVIEW_WIREFRAME_MISSING_SCREEN",
    "OVERVIEW_WIREFRAME_WRONG_TYPE",
    "OVERVIEW_WIREFRAME_MISSING",
  ]);
});
