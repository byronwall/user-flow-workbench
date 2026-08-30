import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { EventEmitter } from "node:events";
import { access, mkdir, mkdtemp, readFile, rm, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { deflateSync } from "node:zlib";
import { contactSheetOutputPaths, writeContactSheets } from "./contact-sheet.ts";
import { browserExists, launchBrowser } from "./cdp.ts";
import { runFlowCli, type FlowViewOptions } from "./flow.ts";
import { terminateChild } from "./runtime.ts";

const validFlow = `flow 3\ngraph example "Example"\nnode start actor "Start"\nnode done deliverable "Done"\nedge finish start -> done\n`;

function pngFixture(width: number, height: number): Buffer {
  const crc32 = (content: Uint8Array): number => {
    let crc = 0xffffffff;
    for (const byte of content) {
      crc ^= byte;
      for (let bit = 0; bit < 8; bit += 1) crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
    }
    return (crc ^ 0xffffffff) >>> 0;
  };
  const chunk = (type: string, content: Uint8Array): Buffer => {
    const value = Buffer.alloc(12 + content.length);
    value.writeUInt32BE(content.length, 0);
    Buffer.from(type).copy(value, 4);
    Buffer.from(content).copy(value, 8);
    value.writeUInt32BE(crc32(value.subarray(4, 8 + content.length)), 8 + content.length);
    return value;
  };
  const header = Buffer.alloc(13);
  header.writeUInt32BE(width, 0);
  header.writeUInt32BE(height, 4);
  header[8] = 8;
  header[9] = 6;
  const pixels = Buffer.alloc((width * 4 + 1) * height);
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk("IHDR", header),
    chunk("IDAT", deflateSync(pixels)),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

test("CLI runs through a global package symlink", async () => {
  const directory = await mkdtemp(join(tmpdir(), "flow-global-"));
  try {
    const packageLink = join(directory, "user-flow-workbench");
    await symlink(fileURLToPath(new URL("../../", import.meta.url)), packageLink, "dir");
    const entry = join(packageLink, "src/cli/flow.ts");
    const help = spawnSync(process.execPath, ["--experimental-strip-types", entry, "--help"], {
      cwd: directory,
      encoding: "utf8",
    });
    assert.equal(help.status, 0, help.stderr);
    assert.match(help.stdout, /Usage:\s+flow check/);

    const invalid = spawnSync(process.execPath, ["--experimental-strip-types", entry, "unknown"], {
      cwd: directory,
      encoding: "utf8",
    });
    assert.equal(invalid.status, 2, invalid.stderr);
    assert.match(invalid.stderr, /Unknown command/);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

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

test("view serves the selected directory on the requested port", async () => {
  const directory = await mkdtemp(join(tmpdir(), "flow-view-"));
  const launches: FlowViewOptions[] = [];
  const code = await runFlowCli(["view", directory, "--port", "4317"], undefined, {
    startView: async (options) => {
      launches.push(options);
      return 0;
    },
  });

  assert.equal(code, 0);
  assert.deepEqual(launches, [{ root: directory, host: "127.0.0.1", port: 4317 }]);
});

test("view rejects a file as its search root", async () => {
  const directory = await mkdtemp(join(tmpdir(), "flow-view-"));
  const path = join(directory, "example.flow");
  await writeFile(path, "flow 3\ngraph example \"Example\"\nnode start actor \"Start\"\n");

  await assert.rejects(() => runFlowCli(["view", path]), /not a directory/);
});

test("render rejects an unknown variant before browser startup", async () => {
  const directory = await mkdtemp(join(tmpdir(), "flow-render-"));
  const path = join(directory, "example.flow");
  await writeFile(path, `flow 3\ngraph example "Example"\nnode start actor "Start"\nnode done deliverable "Done"\nedge finish start -> done\nvariant named "Named" {\n  set node done title="Named done"\n}\n`);
  const output: string[] = [];
  const code = await runFlowCli(["render", path, "--output", join(directory, "example.png"), "--variant", "missing"], {
    out: message => output.push(message), error: message => output.push(message),
  });
  assert.equal(code, 1);
  assert.match(output.join("\n"), /Unknown variant "missing"/);
  await assert.rejects(() => access(join(directory, "example.png")));
  await rm(directory, { recursive: true, force: true });
});

test("render refuses an existing output before starting services", async () => {
  const directory = await mkdtemp(join(tmpdir(), "flow-render-"));
  const path = join(directory, "example.flow");
  const outputPath = join(directory, "example.png");
  await writeFile(path, `flow 3\ngraph example "Example"\nnode start actor "Start"\nnode done deliverable "Done"\nedge finish start -> done\n`);
  await writeFile(outputPath, "keep me");
  await assert.rejects(() => runFlowCli(["render", path, "--output", outputPath]), /Output exists/);
  assert.equal(await readFile(outputPath, "utf8"), "keep me");
  await rm(directory, { recursive: true, force: true });
});

test("render enforces the supported minimum canvas size", async () => {
  const directory = await mkdtemp(join(tmpdir(), "flow-render-"));
  const path = join(directory, "example.flow");
  await writeFile(path, validFlow);
  await assert.rejects(
    () => runFlowCli(["render", path, "--output", join(directory, "example.png"), "--width", "319"]),
    /--width must be at least 320 pixels/,
  );
  await rm(directory, { recursive: true, force: true });
});

test("render rejects batch-only outputs in file mode", async () => {
  const directory = await mkdtemp(join(tmpdir(), "flow-render-"));
  const path = join(directory, "example.flow");
  await writeFile(path, validFlow);
  await assert.rejects(
    () => runFlowCli(["render", path, "--output", join(directory, "example.png"), "--contact-sheet"]),
    /batch-only/,
  );
  await assert.rejects(
    () => runFlowCli(["render", path, "--output", join(directory, "example.png"), "--report", join(directory, "report.json")]),
    /batch-only/,
  );
  await rm(directory, { recursive: true, force: true });
});

test("batch setup failures produce one stable JSON result per source", async () => {
  const directory = await mkdtemp(join(tmpdir(), "flow-render-batch-"));
  const outputDir = join(directory, "out");
  const sourceDir = join(directory, "sources");
  await writeFile(join(directory, "placeholder"), "");
  await mkdir(sourceDir);
  await writeFile(join(sourceDir, "a.flow"), validFlow);
  await writeFile(join(sourceDir, "b.flow"), validFlow.replace("Example", "Second"));
  const output: string[] = [];
  const code = await runFlowCli([
    "render", sourceDir, "--output-dir", outputDir, "--browser", sourceDir, "--json",
  ], { out: message => output.push(message), error: message => output.push(message) });
  assert.equal(code, 1);
  const result = JSON.parse(output.join("\n")) as { results: Array<{ source: string; status: string }> };
  assert.deepEqual(result.results.map(item => [item.source, item.status]), [["a.flow", "failed"], ["b.flow", "failed"]]);
  await rm(directory, { recursive: true, force: true });
});

test("render protects source files and source directories through aliases", async () => {
  const directory = await mkdtemp(join(tmpdir(), "flow-render-protect-"));
  const sourceDir = join(directory, "sources");
  const outputLink = join(directory, "output-link");
  await mkdir(sourceDir);
  const sourcePath = join(sourceDir, "Case.flow");
  await writeFile(sourcePath, validFlow);
  await symlink(sourceDir, outputLink, "dir");
  await assert.rejects(
    () => runFlowCli(["render", sourceDir, "--output-dir", outputLink]),
    /outside the source directory/,
  );
  await assert.rejects(
    () => runFlowCli(["render", sourceDir, "--output-dir", join(directory, "out"), "--report", join(sourceDir, "case.FLOW")]),
    /collides with a source file|Auxiliary output must be outside/,
  );
  await rm(directory, { recursive: true, force: true });
});

test("contact sheets split large batches and keep links and failures visible", async () => {
  const directory = await mkdtemp(join(tmpdir(), "flow-contact-sheet-"));
  const image = join(directory, "preview.png");
  await writeFile(image, Buffer.from("fake-png"));
  const items = Array.from({ length: 13 }, (_, index) => ({
    label: `flow-${index + 1}.flow`,
    path: image,
    status: index === 12 ? "failed" as const : "success" as const,
    ...(index === 12 ? { error: "Invalid source" } : {}),
  }));
  const paths = await writeContactSheets(items, join(directory, "contact-sheet.svg"));
  assert.equal(paths.length, 2);
  assert.match(await readFile(paths[0], "utf8"), /<a href=".*preview\.png"/);
  const second = await readFile(paths[1], "utf8");
  assert.match(second, /Failed render/);
  assert.match(second, /Invalid source/);
  await rm(directory, { recursive: true, force: true });
});

test("PNG contact sheets rasterize each page and preserve page suffixes", async () => {
  const directory = await mkdtemp(join(tmpdir(), "flow-contact-sheet-png-"));
  const image = join(directory, "preview.png");
  await writeFile(image, Buffer.from("fake-png"));
  const items = Array.from({ length: 13 }, (_, index) => ({ label: `flow-${index + 1}.flow`, path: image, status: "success" as const }));
  const sizes: Array<[number, number]> = [];
  const paths = await writeContactSheets(items, join(directory, "contact-sheet.png"), {
    rasterize: async (svg, width, height) => {
      sizes.push([width, height]);
      assert.match(svg, /data:image\/png;base64,/);
      return Buffer.from(`PNG ${width}x${height}`);
    },
  });
  assert.deepEqual(paths, contactSheetOutputPaths(join(directory, "contact-sheet.png"), 13));
  assert.equal(sizes.length, 2);
  assert.deepEqual(sizes, [[1080, 1000], [360, 250]]);
  assert.equal(await readFile(paths[0], "utf8"), "PNG 1080x1000");
  await rm(directory, { recursive: true, force: true });
});

test("PNG contact sheets retain native source pixels and scale with rendered inputs", async () => {
  const directory = await mkdtemp(join(tmpdir(), "flow-contact-sheet-native-"));
  const image = join(directory, "preview.png");
  const scaledImage = join(directory, "preview-2x.png");
  await writeFile(image, pngFixture(1200, 800));
  await writeFile(scaledImage, pngFixture(2400, 1600));
  const items = Array.from({ length: 13 }, (_, index) => ({ label: `flow-${index + 1}.flow`, path: image, status: "success" as const }));
  const sizes: Array<[number, number]> = [];
  await writeContactSheets(items, join(directory, "contact-sheet.png"), {
    rasterize: async (_svg, width, height) => {
      sizes.push([width, height]);
      return Buffer.from("PNG");
    },
  });
  await writeContactSheets(items.map(item => ({ ...item, path: scaledImage })), join(directory, "contact-sheet-2x.png"), {
    rasterize: async (_svg, width, height) => {
      sizes.push([width, height]);
      return Buffer.from("PNG");
    },
  });
  assert.deepEqual(sizes, [[3720, 3400], [1240, 850], [7320, 6600], [2440, 1650]]);
  await rm(directory, { recursive: true, force: true });
});

test("render rejects unknown contact sheet extensions before browser startup", async () => {
  const directory = await mkdtemp(join(tmpdir(), "flow-contact-sheet-format-"));
  const sourceDir = join(directory, "sources");
  await mkdir(sourceDir);
  await writeFile(join(sourceDir, "example.flow"), validFlow);
  await assert.rejects(
    () => runFlowCli(["render", sourceDir, "--output-dir", join(directory, "out"), "--contact-sheet", join(directory, "sheet.jpg")]),
    /\.png or \.svg extension/,
  );
  await rm(directory, { recursive: true, force: true });
});

test("browser selection rejects directories and non-executable files", async () => {
  const directory = await mkdtemp(join(tmpdir(), "flow-browser-"));
  const file = join(directory, "browser");
  await writeFile(file, "not a browser");
  assert.equal(await browserExists(directory), false);
  assert.equal(await browserExists(file), false);
  await assert.rejects(() => launchBrowser(directory), /regular executable file/);
  await rm(directory, { recursive: true, force: true });
});

test("child cleanup reports confirmed and unconfirmed termination separately", async () => {
  class FakeChild extends EventEmitter {
    exitCode: number | null = null;
    signalCode: NodeJS.Signals | null = null;
    private readonly exits: boolean;
    constructor(exits: boolean) { super(); this.exits = exits; }
    kill(signal: NodeJS.Signals) {
      if (!this.exits) return true;
      this.signalCode = signal;
      this.emit("exit", null, signal);
      return true;
    }
  }
  assert.equal(await terminateChild(new FakeChild(true) as never), true);
  assert.equal(await terminateChild(new FakeChild(false) as never), false);
});
