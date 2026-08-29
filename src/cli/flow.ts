#!/usr/bin/env node

import { spawn } from "node:child_process";
import { readdir, readFile, stat, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { formatGraphDslDiagnostic, graphToDsl, parseGraphDslWithDiagnostics } from "../lib/graph-dsl.ts";
import { lintFlowDocument, type GraphLintDiagnostic } from "../lib/graph-lint.ts";

interface SourceLocation {
  line: number;
  column: number;
}

export interface FlowCliIO {
  out(message: string): void;
  error(message: string): void;
}

export interface FlowViewOptions {
  root: string;
  host: string;
  port: number;
}

export interface FlowCliRuntime {
  startView(options: FlowViewOptions, io: FlowCliIO): Promise<number>;
}

const defaultIO: FlowCliIO = {
  out: (message) => console.log(message),
  error: (message) => console.error(message),
};

function usage(): string {
  return `Usage:
  flow check [path ...]
  flow format [--check] <path ...>
  flow view [directory] [--port <number>]

Paths can be .flow files or directories. Check uses src/data/flows and
docs/examples when no path is given. View searches the current directory
when no directory is given.`;
}

const defaultRuntime: FlowCliRuntime = {
  async startView(options, io) {
    const packageRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
    const outputDirectories = [resolve(packageRoot, ".output"), resolve(packageRoot, "dist/app")];
    let outputDirectory: string | undefined;
    for (const candidate of outputDirectories) {
      try {
        await stat(resolve(candidate, "server/index.mjs"));
        outputDirectory = candidate;
        break;
      } catch {
        // Try the installed package location after the local build location.
      }
    }
    if (!outputDirectory) {
      throw new Error("The Flow Workbench server is not built. Run `pnpm build`, then run `flow view` again.");
    }
    const serverEntry = resolve(outputDirectory, "server/index.mjs");

    const url = `http://${options.host}:${options.port}`;
    io.out(`Serving flows from ${options.root}`);
    io.out(`Flow Workbench: ${url}`);

    const child = spawn(process.execPath, [serverEntry], {
      cwd: outputDirectory,
      env: {
        ...process.env,
        FLOW_WORKBENCH_ROOT: options.root,
        NITRO_HOST: options.host,
        NITRO_PORT: String(options.port),
      },
      stdio: "inherit",
    });

    return new Promise<number>((resolveExit, reject) => {
      child.once("error", reject);
      child.once("exit", (code, signal) => {
        if (signal) io.error(`Flow Workbench stopped after ${signal}.`);
        resolveExit(code ?? (signal ? 1 : 0));
      });
    });
  },
};

async function viewOptions(args: string[]): Promise<FlowViewOptions> {
  let directory: string | undefined;
  let port = 4173;

  for (let index = 0; index < args.length; index += 1) {
    const argument = args[index];
    if (argument === "--port") {
      const value = args[index + 1];
      if (!value) throw new Error("--port requires a number.");
      port = Number(value);
      index += 1;
      continue;
    }
    if (argument.startsWith("-")) throw new Error(`Unknown view option "${argument}".`);
    if (directory) throw new Error("view accepts one directory.");
    directory = argument;
  }

  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error("--port must be an integer from 1 through 65535.");
  }

  const root = resolve(directory || ".");
  const info = await stat(root);
  if (!info.isDirectory()) throw new Error(`View path is not a directory: ${directory}`);
  return { root, host: "127.0.0.1", port };
}

async function flowFiles(paths: string[]): Promise<string[]> {
  const files = new Set<string>();

  async function visit(path: string): Promise<void> {
    const absolute = resolve(path);
    const info = await stat(absolute);
    if (info.isDirectory()) {
      const entries = await readdir(absolute, { withFileTypes: true });
      for (const entry of entries.sort((a, b) => a.name.localeCompare(b.name))) {
        if (entry.isDirectory() || (entry.isFile() && entry.name.endsWith(".flow"))) {
          await visit(resolve(absolute, entry.name));
        }
      }
      return;
    }
    if (!absolute.endsWith(".flow")) throw new Error(`Expected a .flow file: ${path}`);
    files.add(absolute);
  }

  for (const path of paths) await visit(path);
  return [...files].sort();
}

function locateNode(source: string, diagnostic: GraphLintDiagnostic): SourceLocation {
  let activeVariant: string | undefined;
  let baseMatch: SourceLocation | undefined;

  for (const [index, line] of source.split(/\r?\n/).entries()) {
    const variant = line.match(/^\s*variant\s+([^\s]+)\s+/);
    if (variant) activeVariant = variant[1];
    if (/^\s*}\s*(?:#.*)?$/.test(line)) activeVariant = undefined;

    const node = line.match(/^\s*node\s+([^\s]+)\s+/);
    if (node?.[1] === diagnostic.nodeId) {
      baseMatch = { line: index + 1, column: line.indexOf(diagnostic.nodeId) + 1 };
    }

    const addedNode = line.match(/^\s*add\s+node\s+([^\s]+)\s+/);
    if (activeVariant === diagnostic.variantId && addedNode?.[1] === diagnostic.nodeId) {
      return { line: index + 1, column: line.indexOf(diagnostic.nodeId) + 1 };
    }
  }

  return baseMatch || { line: 1, column: 1 };
}

async function checkFile(path: string, io: FlowCliIO): Promise<boolean> {
  const source = await readFile(path, "utf8");
  const parsed = parseGraphDslWithDiagnostics(source);
  let valid = parsed.diagnostics.length === 0;

  for (const diagnostic of parsed.diagnostics) {
    io.error(`${path}:${diagnostic.line}:${diagnostic.column}: error ${formatGraphDslDiagnostic(diagnostic)}`);
  }

  if (valid) {
    for (const diagnostic of lintFlowDocument(parsed.document)) {
      valid = false;
      const location = locateNode(source, diagnostic);
      const variant = diagnostic.variantId ? ` Variant "${diagnostic.variantId}".` : "";
      io.error(`${path}:${location.line}:${location.column}: ${diagnostic.severity} [${diagnostic.code}] ${diagnostic.message}${variant}`);
    }
  }

  return valid;
}

export async function runFlowCli(
  args: string[],
  io: FlowCliIO = defaultIO,
  runtime: FlowCliRuntime = defaultRuntime,
): Promise<number> {
  const [command, ...rest] = args;
  if (!command || command === "help" || command === "--help" || command === "-h") {
    io.out(usage());
    return command ? 0 : 2;
  }

  if (command === "check") {
    const paths = rest.length ? rest : ["src/data/flows", "docs/examples"];
    const files = await flowFiles(paths);
    if (!files.length) throw new Error("No .flow files found.");
    const results = await Promise.all(files.map((file) => checkFile(file, io)));
    if (results.every(Boolean)) io.out(`Checked ${files.length} flow file${files.length === 1 ? "" : "s"}.`);
    return results.every(Boolean) ? 0 : 1;
  }

  if (command === "format") {
    const checkOnly = rest.includes("--check");
    const paths = rest.filter((arg) => arg !== "--check");
    if (!paths.length) throw new Error("format requires at least one file or directory.");
    const files = await flowFiles(paths);
    let changed = false;
    for (const file of files) {
      const source = await readFile(file, "utf8");
      const parsed = parseGraphDslWithDiagnostics(source);
      if (parsed.diagnostics.length) {
        await checkFile(file, io);
        return 1;
      }
      const formatted = graphToDsl(parsed.document, { includePositions: true });
      if (formatted === source) continue;
      changed = true;
      if (checkOnly) io.error(`${file}: is not canonically formatted.`);
      else {
        await writeFile(file, formatted);
        io.out(`Formatted ${file}.`);
      }
    }
    return checkOnly && changed ? 1 : 0;
  }

  if (command === "view") {
    return runtime.startView(await viewOptions(rest), io);
  }

  io.error(`Unknown command "${command}".\n\n${usage()}`);
  return 2;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  runFlowCli(process.argv.slice(2)).then(
    (code) => { process.exitCode = code; },
    (error: unknown) => {
      console.error(error instanceof Error ? error.message : String(error));
      process.exitCode = 2;
    },
  );
}
