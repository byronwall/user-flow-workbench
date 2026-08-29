#!/usr/bin/env node

import { readdir, readFile, stat, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
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

const defaultIO: FlowCliIO = {
  out: (message) => console.log(message),
  error: (message) => console.error(message),
};

function usage(): string {
  return `Usage:
  pnpm flow check [path ...]
  pnpm flow format [--check] <path ...>

Paths can be .flow files or directories. Check uses src/data/flows and
docs/examples when no path is given.`;
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

export async function runFlowCli(args: string[], io: FlowCliIO = defaultIO): Promise<number> {
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
