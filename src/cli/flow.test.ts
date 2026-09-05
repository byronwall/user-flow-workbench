import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { EventEmitter } from "node:events";
import { access, mkdir, mkdtemp, readFile, rm, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { deflateSync } from "node:zlib";
import { contactSheetOutputPaths, writeContactSheets } from "./contact-sheet.ts";
import { browserExists, launchBrowser } from "./cdp.ts";
import { renderServerRoot, runFlowCli, type FlowViewOptions } from "./flow.ts";
import { terminateChild } from "./runtime.ts";

const validFlow = `diagram 1\ntype flow\n\ngraph example "Example"\nnode start actor "Start"\nnode done deliverable "Done"\nedge finish start -> done\n`;
const validOverview = `diagram 1\ntype overview\n\noverview resume "Resume app"\npurpose "Make applications clearer and more defensible."\nstatus "Intended"\ngroup evidence "Career evidence" {\n  capability collect "Collect evidence" detail="Capture"\n}\ncapability tailor "Tailor an application"\nvariant focused "Focused application" {\n  set capability tailor title="Focused application"\n}\n`;

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
  const path = join(directory, "broken.diagram");
  await writeFile(path, `diagram 1
type flow

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
  assert.match(output.join("\n"), /broken\.diagram:9:12: error \[FLOWLINT001\]/);
  assert.match(output.join("\n"), /Variant "broken"/);
});

test("check accepts a mixed directory and skips flow lint for overview documents", async () => {
  const directory = await mkdtemp(join(tmpdir(), "diagram-cli-check-"));
  await writeFile(join(directory, "flow.diagram"), validFlow);
  await writeFile(join(directory, "overview.diagram"), validOverview);
  const output: string[] = [];
  const code = await runFlowCli(["check", directory], {
    out: message => output.push(message), error: message => output.push(message),
  });
  assert.equal(code, 0);
  assert.match(output.join("\n"), /Checked 2 diagram files\./);
  await rm(directory, { recursive: true, force: true });
});

test("check defaults include the shared data root and examples", async () => {
  const previousDirectory = process.cwd();
  const directory = await mkdtemp(join(tmpdir(), "diagram-cli-default-check-"));
  try {
    await mkdir(join(directory, "src/data/flows"), { recursive: true });
    await mkdir(join(directory, "src/data/overviews"), { recursive: true });
    await mkdir(join(directory, "docs/examples"), { recursive: true });
    await writeFile(join(directory, "src/data/flows/example.diagram"), validFlow);
    await writeFile(join(directory, "src/data/overviews/example.diagram"), validOverview);
    await writeFile(join(directory, "docs/examples/example.diagram"), validFlow);
    process.chdir(directory);
    const output: string[] = [];
    const code = await runFlowCli(["check"], {
      out: message => output.push(message), error: message => output.push(message),
    });
    assert.equal(code, 0);
    assert.match(output.join("\n"), /Checked 3 diagram files\./);
  } finally {
    process.chdir(previousDirectory);
    await rm(directory, { recursive: true, force: true });
  }
});

test("check reports unknown diagram types instead of skipping them", async () => {
  const directory = await mkdtemp(join(tmpdir(), "diagram-cli-check-"));
  const path = join(directory, "unknown.diagram");
  await writeFile(path, "diagram 1\ntype prototype\n\nprototype sample\n");
  const output: string[] = [];
  const code = await runFlowCli(["check", path], {
    out: message => output.push(message), error: message => output.push(message),
  });
  assert.equal(code, 1);
  assert.match(output.join("\n"), /unknown\.diagram:2:1: error \[DIAGRAM103\]/);
  await rm(directory, { recursive: true, force: true });
});

test("format canonicalizes overview diagrams through the shared formatter", async () => {
  const directory = await mkdtemp(join(tmpdir(), "diagram-cli-format-"));
  const path = join(directory, "overview.diagram");
  await writeFile(path, validOverview.replace("purpose", "# comment\npurpose"));
  const code = await runFlowCli(["format", path]);
  assert.equal(code, 0);
  assert.equal(await readFile(path, "utf8"), validOverview.replace('status "Intended"\n', ""));
  await rm(directory, { recursive: true, force: true });
});

test("render accepts a requested overview view and preserves its source hash", async () => {
  const directory = await mkdtemp(join(tmpdir(), "diagram-cli-render-"));
  const path = join(directory, "overview.diagram");
  await writeFile(path, validOverview);
  const output: string[] = [];
  const code = await runFlowCli(["render", path, "--output", join(directory, "overview.png"), "--variant", "focused", "--browser", directory, "--json"], {
    out: message => output.push(message), error: message => output.push(message),
  });
  assert.equal(code, 1);
  const result = JSON.parse(output.join("\n")) as { type: string; view: string; sourceHash: string; error?: string };
  assert.equal(result.type, "overview");
  assert.equal(result.view, "focused");
  assert.equal(result.sourceHash, createHash("sha256").update(validOverview).digest("hex"));
  assert.match(result.error || "", /No compatible local Chromium browser/);
  assert.doesNotMatch(result.error || "", /Unknown overview variant/);
  await assert.rejects(() => access(join(directory, "overview.png")));
  await rm(directory, { recursive: true, force: true });
});

test("single-file renders keep workspace-relative embedded references resolvable", () => {
  const projectRoot = resolve(fileURLToPath(new URL("../../", import.meta.url)));
  const source = join(projectRoot, "src/data/wireframes/resume-workbench.diagram");
  assert.equal(renderServerRoot(source, false, projectRoot), projectRoot);
  assert.equal(renderServerRoot("/tmp/standalone/example.diagram", false, projectRoot), "/tmp/standalone");
  assert.equal(renderServerRoot(join(projectRoot, "src/data"), true, projectRoot), join(projectRoot, "src/data"));
});

test("render rejects an unknown overview view without falling back to base", async () => {
  const directory = await mkdtemp(join(tmpdir(), "diagram-cli-render-"));
  const path = join(directory, "overview.diagram");
  await writeFile(path, validOverview);
  const output: string[] = [];
  const code = await runFlowCli(["render", path, "--output", join(directory, "overview.png"), "--variant", "missing", "--json"], {
    out: message => output.push(message), error: message => output.push(message),
  });
  assert.equal(code, 1);
  const result = JSON.parse(output.join("\n")) as { type: string; view: string; sourceHash: string; error?: string };
  assert.equal(result.type, "overview");
  assert.equal(result.view, "missing");
  assert.equal(result.sourceHash, createHash("sha256").update(validOverview).digest("hex"));
  assert.match(result.error || "", /Unknown overview variant "missing"/);
  assert.doesNotMatch(result.error || "", /FLOW/);
  await assert.rejects(() => access(join(directory, "overview.png")));
  await rm(directory, { recursive: true, force: true });
});

test("directory rendering accepts the same requested view for flow and overview sources", async () => {
  const directory = await mkdtemp(join(tmpdir(), "diagram-cli-render-batch-"));
  const outputDir = await mkdtemp(join(tmpdir(), "diagram-cli-render-batch-out-"));
  await writeFile(join(directory, "flow.diagram"), `diagram 1\ntype flow\n\ngraph example "Example"\nnode start actor "Start"\nnode done deliverable "Done"\nedge finish start -> done\nvariant focused "Focused" {\n  set node done title="Focused done"\n}\n`);
  await writeFile(join(directory, "overview.diagram"), validOverview);
  const output: string[] = [];
  const code = await runFlowCli(["render", directory, "--output-dir", outputDir, "--variant", "focused", "--browser", directory, "--json"], {
    out: message => output.push(message), error: message => output.push(message),
  });
  assert.equal(code, 1);
  const result = JSON.parse(output.join("\n")) as { results: Array<{ source: string; type: string; view: string; error?: string }> };
  assert.deepEqual(result.results.map(item => [item.source, item.type, item.view]), [
    ["flow.diagram", "flow", "focused"],
    ["overview.diagram", "overview", "focused"],
  ]);
  assert.ok(result.results.every(item => /No compatible local Chromium browser/.test(item.error || "")));
  await rm(directory, { recursive: true, force: true });
  await rm(outputDir, { recursive: true, force: true });
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
  const path = join(directory, "example.diagram");
  await writeFile(path, "diagram 1\ntype flow\n\ngraph example \"Example\"\nnode start actor \"Start\"\n");

  await assert.rejects(() => runFlowCli(["view", path]), /not a directory/);
});

test("render rejects an unknown variant before browser startup", async () => {
  const directory = await mkdtemp(join(tmpdir(), "flow-render-"));
  const path = join(directory, "example.diagram");
  await writeFile(path, `diagram 1\ntype flow\n\ngraph example "Example"\nnode start actor "Start"\nnode done deliverable "Done"\nedge finish start -> done\nvariant named "Named" {\n  set node done title="Named done"\n}\n`);
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
  const path = join(directory, "example.diagram");
  const outputPath = join(directory, "example.png");
  await writeFile(path, `diagram 1\ntype flow\n\ngraph example "Example"\nnode start actor "Start"\nnode done deliverable "Done"\nedge finish start -> done\n`);
  await writeFile(outputPath, "keep me");
  await assert.rejects(() => runFlowCli(["render", path, "--output", outputPath]), /Output exists/);
  assert.equal(await readFile(outputPath, "utf8"), "keep me");
  await rm(directory, { recursive: true, force: true });
});

test("render enforces the supported minimum canvas size", async () => {
  const directory = await mkdtemp(join(tmpdir(), "flow-render-"));
  const path = join(directory, "example.diagram");
  await writeFile(path, validFlow);
  await assert.rejects(
    () => runFlowCli(["render", path, "--output", join(directory, "example.png"), "--width", "319"]),
    /--width must be at least 320 pixels/,
  );
  await rm(directory, { recursive: true, force: true });
});

test("render rejects batch-only outputs in file mode", async () => {
  const directory = await mkdtemp(join(tmpdir(), "flow-render-"));
  const path = join(directory, "example.diagram");
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
  await writeFile(join(sourceDir, "a.diagram"), validFlow);
  await writeFile(join(sourceDir, "b.diagram"), validFlow.replace("Example", "Second"));
  const output: string[] = [];
  const code = await runFlowCli([
    "render", sourceDir, "--output-dir", outputDir, "--browser", sourceDir, "--json",
  ], { out: message => output.push(message), error: message => output.push(message) });
  assert.equal(code, 1);
  const result = JSON.parse(output.join("\n")) as { results: Array<{ source: string; type: string | null; status: string }> };
  assert.deepEqual(result.results.map(item => [item.source, item.type, item.status]), [["a.diagram", "flow", "failed"], ["b.diagram", "flow", "failed"]]);
  await rm(directory, { recursive: true, force: true });
});

test("render protects source files and source directories through aliases", async () => {
  const directory = await mkdtemp(join(tmpdir(), "flow-render-protect-"));
  const sourceDir = join(directory, "sources");
  const outputLink = join(directory, "output-link");
  await mkdir(sourceDir);
  const sourcePath = join(sourceDir, "Case.diagram");
  await writeFile(sourcePath, validFlow);
  await symlink(sourceDir, outputLink, "dir");
  await assert.rejects(
    () => runFlowCli(["render", sourceDir, "--output-dir", outputLink]),
    /outside the source directory/,
  );
  await assert.rejects(
    () => runFlowCli(["render", sourceDir, "--output-dir", join(directory, "out"), "--report", join(sourceDir, "case.DIAGRAM")]),
    /collides with a source file|Auxiliary output must be outside/,
  );
  await rm(directory, { recursive: true, force: true });
});

test("contact sheets split large batches and keep links and failures visible", async () => {
  const directory = await mkdtemp(join(tmpdir(), "flow-contact-sheet-"));
  const image = join(directory, "preview.png");
  await writeFile(image, Buffer.from("fake-png"));
  const items = Array.from({ length: 13 }, (_, index) => ({
    label: `flow-${index + 1}.diagram`,
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
  const items = Array.from({ length: 13 }, (_, index) => ({ label: `flow-${index + 1}.diagram`, path: image, status: "success" as const }));
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
  const items = Array.from({ length: 13 }, (_, index) => ({ label: `flow-${index + 1}.diagram`, path: image, status: "success" as const }));
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
  await writeFile(join(sourceDir, "example.diagram"), validFlow);
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
