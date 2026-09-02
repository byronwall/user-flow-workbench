import assert from "node:assert/strict";
import { mkdtemp, mkdir, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { FlowCatalogError, readDiagramCatalog, readFlowCatalog, readFlowDocument, readDiagramDocument, resolveFlowRoot, resolveOverviewReferences, resolveReferenceImagePath } from "./flow-catalog.ts";

const VALID_FLOW = `diagram 1
type flow

graph example "Example flow"
node start actor "Start"
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
  flow "flow.diagram" variant="missing"
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
