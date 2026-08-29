import assert from "node:assert/strict";
import { mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { runFlowCli } from "./flow.ts";

test("check reports a variant-only process gap at its added node", async () => {
  const directory = await mkdtemp(join(tmpdir(), "flow-cli-"));
  const path = join(directory, "broken.flow");
  await writeFile(path, `flow 3
graph example "Example"
node start actor "Start"
node done deliverable "Done"
edge start-done start -> done
variant broken "Broken" {
  add node gap process "Find gaps"
  add edge done-gap done -> gap
}
`);
  const output: string[] = [];
  const code = await runFlowCli(["check", path], {
    out: (message) => output.push(message),
    error: (message) => output.push(message),
  });

  assert.equal(code, 1);
  assert.match(output.join("\n"), /broken\.flow:7:12: error \[FLOWLINT001\]/);
  assert.match(output.join("\n"), /Variant "broken"/);
});
