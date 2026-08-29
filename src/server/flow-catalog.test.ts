import assert from "node:assert/strict";
import { mkdtemp, mkdir, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { FlowCatalogError, readFlowCatalog, readFlowDocument } from "./flow-catalog.ts";

const VALID_FLOW = `flow 3
graph example "Example flow"
node start actor "Start"
`;

test("catalog finds nested flows and skips generated directories", async () => {
  const root = await mkdtemp(join(tmpdir(), "flow-catalog-"));
  await mkdir(join(root, "nested"));
  await mkdir(join(root, "node_modules"));
  await writeFile(join(root, "root.flow"), VALID_FLOW);
  await writeFile(join(root, "nested", "child.flow"), VALID_FLOW.replace("Example flow", "Nested flow"));
  await writeFile(join(root, "node_modules", "ignored.flow"), VALID_FLOW);

  const catalog = await readFlowCatalog(root);
  assert.equal(catalog.rootName, root.split("/").at(-1));
  assert.deepEqual(catalog.flows.map((flow) => flow.path), ["nested/child.flow", "root.flow"]);
  assert.equal(catalog.flows[0]?.title, "Nested flow");
});

test("catalog marks syntax errors without hiding the file", async () => {
  const root = await mkdtemp(join(tmpdir(), "flow-catalog-"));
  await writeFile(join(root, "broken.flow"), "flow 3\ngraph broken \"Broken\"\nnode");

  const catalog = await readFlowCatalog(root);
  assert.equal(catalog.flows[0]?.valid, false);
  assert.ok((catalog.flows[0]?.diagnosticCount || 0) > 0);
});

test("document loading rejects traversal and symbolic links", async () => {
  const root = await mkdtemp(join(tmpdir(), "flow-catalog-"));
  const outside = await mkdtemp(join(tmpdir(), "flow-outside-"));
  await writeFile(join(outside, "outside.flow"), VALID_FLOW);
  await symlink(join(outside, "outside.flow"), join(root, "linked.flow"));

  await assert.rejects(
    () => readFlowDocument("../outside.flow", root),
    (error: unknown) => error instanceof FlowCatalogError && error.status === 404,
  );
  await assert.rejects(
    () => readFlowDocument("linked.flow", root),
    (error: unknown) => error instanceof FlowCatalogError && error.status === 404,
  );
});

test("document loading returns its stable workspace and relative path", async () => {
  const root = await mkdtemp(join(tmpdir(), "flow-catalog-"));
  await writeFile(join(root, "example.flow"), VALID_FLOW);

  const loaded = await readFlowDocument("example.flow", root);
  assert.equal(loaded.path, "example.flow");
  assert.equal(loaded.workspaceId.length, 16);
  assert.equal(loaded.document.graph.title, "Example flow");
});
