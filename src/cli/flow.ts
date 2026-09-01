#!/usr/bin/env node

import { realpathSync } from "node:fs";
import { createHash } from "node:crypto";
import { access, lstat, mkdir, readdir, readFile, realpath, rename, stat, unlink, writeFile } from "node:fs/promises";
import { constants } from "node:fs";
import { basename, dirname, extname, relative, resolve, sep } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { diagramToDsl, formatDiagramDslDiagnostic, parseDiagramWithDiagnostics, type DiagramParseResult } from "../lib/diagram-dsl.ts";
import { lintFlowDocument, type GraphLintDiagnostic } from "../lib/graph-lint.ts";
import { materializeOverview } from "../lib/overview-dsl.ts";
import type { DiagramType } from "../types/diagram.ts";
import type { FlowDocument } from "../types/graph.ts";
import type { OverviewDocument } from "../types/overview.ts";
import { browserExecutableCandidates, browserExists, launchBrowser } from "./cdp.ts";
import { contactSheetFormat, contactSheetOutputPaths, writeContactSheets, type ContactSheetItem } from "./contact-sheet.ts";
import { startOwnedServer, startViewServer, type OwnedServer } from "./runtime.ts";

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
  flow render <file.diagram> --output <image.png> [options]
  flow render <directory> --output-dir <directory> [options]

Render options:
  --variant <id>       Render a named variant view (base is the default)
  --width <pixels>     Canvas width in CSS pixels (default: 1200)
  --height <pixels>    Canvas height in CSS pixels (default: 800)
  --scale <ratio>      Output pixel scale; contact-sheet tiles follow source PNG pixels (default: 1)
  --browser <path>     Compatible local Chromium executable
  --overwrite          Replace existing PNG, report, or contact sheet
  --report <path>      Batch JSON report path (default: output-dir/report.json)
  --contact-sheet [p]  Write a labeled PNG sheet with native-size tiles (default: output-dir/contact-sheet.png; .svg is also supported)
  --json               Print the result or batch report as JSON

Paths can be .diagram files or directories. Check uses src/data and
docs/examples when no path is given. View searches the current directory
when no directory is given.`;
}

const defaultRuntime: FlowCliRuntime = {
  async startView(options, io) {
    return startViewServer(options, io);
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

async function diagramFiles(paths: string[]): Promise<string[]> {
  const files = new Set<string>();

  async function visit(path: string): Promise<void> {
    const absolute = resolve(path);
    const info = await lstat(absolute);
    if (info.isSymbolicLink()) return;
    if (info.isDirectory()) {
      const entries = await readdir(absolute, { withFileTypes: true });
      for (const entry of entries.sort((a, b) => a.name.localeCompare(b.name))) {
        if (entry.isSymbolicLink()) continue;
        if (entry.isDirectory() && !new Set([".git", ".output", ".vinxi", "build", "dist", "node_modules"]).has(entry.name)) {
          await visit(resolve(absolute, entry.name));
        } else if (entry.isFile() && entry.name.endsWith(".diagram")) {
          await visit(resolve(absolute, entry.name));
        }
      }
      return;
    }
    if (!absolute.endsWith(".diagram")) throw new Error(`Expected a .diagram file: ${path}`);
    files.add(absolute);
  }

  for (const path of paths) await visit(path);
  return [...files].sort();
}

interface RenderOptions {
  source: string;
  output?: string;
  outputDir?: string;
  variant: string | null;
  width: number;
  height: number;
  scale: number;
  browser?: string;
  overwrite: boolean;
  report?: string;
  contactSheet?: string;
  json: boolean;
}

interface RenderResult {
  source: string;
  type: DiagramType | null;
  sourceHash: string;
  view: string;
  output: string;
  width: number;
  height: number;
  scale: number;
  layoutEngine: string | null;
  warnings: string[];
  status: "success" | "failed";
  error?: string;
}

function positiveNumber(value: string, option: string, integer = true): number {
  const number = Number(value);
  if (!Number.isFinite(number) || number <= 0 || (integer && !Number.isInteger(number))) {
    throw new Error(`${option} must be a positive ${integer ? "integer" : "number"}.`);
  }
  return number;
}

async function renderOptions(args: string[]): Promise<RenderOptions> {
  const positional: string[] = [];
  const options: Omit<RenderOptions, "source"> = {
    variant: null, width: 1200, height: 800, scale: 1, overwrite: false, json: false,
  };
  for (let index = 0; index < args.length; index += 1) {
    const argument = args[index];
    const next = () => {
      const value = args[++index];
      if (!value || value.startsWith("-")) throw new Error(`${argument} requires a value.`);
      return value;
    };
    if (!argument.startsWith("-")) { positional.push(argument); continue; }
    if (argument === "--variant") options.variant = next();
    else if (argument === "--output") options.output = resolve(next());
    else if (argument === "--output-dir") options.outputDir = resolve(next());
    else if (argument === "--width") options.width = positiveNumber(next(), "--width");
    else if (argument === "--height") options.height = positiveNumber(next(), "--height");
    else if (argument === "--scale") options.scale = positiveNumber(next(), "--scale", false);
    else if (argument === "--browser") options.browser = resolve(next());
    else if (argument === "--report") options.report = resolve(next());
    else if (argument === "--contact-sheet") {
      const candidate = args[index + 1];
      options.contactSheet = candidate && !candidate.startsWith("-") ? resolve(args[++index]) : "";
    } else if (argument === "--overwrite") options.overwrite = true;
    else if (argument === "--json") options.json = true;
    else throw new Error(`Unknown render option "${argument}".`);
  }
  if (positional.length !== 1) throw new Error("render requires one .diagram file or directory.");
  if (options.output && options.outputDir) throw new Error("Use either --output or --output-dir, not both.");
  const source = resolve(positional[0]);
  const info = await stat(source);
  if (info.isDirectory() && !options.outputDir) throw new Error("Directory rendering requires --output-dir.");
  if (info.isFile() && !options.output) throw new Error("File rendering requires --output.");
  if (!info.isDirectory() && !info.isFile()) throw new Error(`Render path is not a file or directory: ${positional[0]}`);
  if (options.outputDir && !info.isDirectory()) throw new Error("--output-dir requires a directory source.");
  if (options.output && !info.isFile()) throw new Error("--output requires a .diagram file source.");
  if (info.isFile() && !source.endsWith(".diagram")) throw new Error(`Expected a .diagram file: ${positional[0]}`);
  if (options.output && extname(options.output).toLowerCase() !== ".png") throw new Error("--output must use a .png extension.");
  if (options.contactSheet) contactSheetFormat(options.contactSheet);
  if (options.width < 320) throw new Error("--width must be at least 320 pixels.");
  if (options.height < 240) throw new Error("--height must be at least 240 pixels.");
  if (info.isFile() && (options.report !== undefined || options.contactSheet !== undefined)) throw new Error("--report and --contact-sheet are batch-only options.");
  if (!options.output && options.contactSheet === "") options.contactSheet = resolve(options.outputDir!, "contact-sheet.png");
  return { source, ...options };
}

async function fileExists(path: string): Promise<boolean> {
  try { await access(path, constants.F_OK); return true; } catch { return false; }
}

async function atomicWrite(path: string, content: Uint8Array | string): Promise<void> {
  await mkdir(dirname(path), { recursive: true });
  const temporary = `${path}.tmp-${process.pid}-${Date.now()}`;
  try { await writeFile(temporary, content); await rename(temporary, path); }
  catch (error) { await unlink(temporary).catch(() => undefined); throw error; }
}

async function chooseBrowser(requested?: string): Promise<string> {
  const candidates = requested ? [requested] : browserExecutableCandidates();
  for (const candidate of candidates) if (await browserExists(candidate)) return candidate;
  throw new Error("No compatible local Chromium browser was found. Install Chrome or pass --browser /path/to/chrome. Render does not download browsers.");
}

async function validateRenderFile(path: string): Promise<{ source: string; parsed?: DiagramParseResult; error?: string }> {
  let source: string;
  try { source = await readFile(path, "utf8"); }
  catch (error) { return { source: "", error: `Cannot read source: ${error instanceof Error ? error.message : String(error)}` }; }
  const parsed = parseDiagramWithDiagnostics(source);
  if (parsed.diagnostics.length) return { source, error: parsed.diagnostics.map(d => `${d.line}:${d.column} ${formatDiagramDslDiagnostic(d)}`).join("; ") };
  if (parsed.type === "flow") {
    const lint = lintFlowDocument(parsed.document.document as FlowDocument).filter(d => d.severity === "error");
    if (lint.length) return { source, error: lint.map(d => `[${d.code}] ${d.message}`).join("; ") };
  }
  return { source, parsed };
}

function requestedVariantError(parsed: DiagramParseResult, variant: string): string | undefined {
  if (parsed.type === "flow") {
    const document = parsed.document.document as FlowDocument;
    return document.variants.some(candidate => candidate.id === variant)
      ? undefined
      : `Unknown variant "${variant}".`;
  }

  if (parsed.type === "overview") {
    try {
      materializeOverview(parsed.document.document as OverviewDocument, variant);
      return undefined;
    } catch (error) {
      return error instanceof Error ? error.message : String(error);
    }
  }

  return `Unknown variant "${variant}".`;
}

async function canonicalPath(path: string): Promise<string> {
  const suffix: string[] = [];
  let current = resolve(path);
  while (true) {
    try { return resolve(await realpath(current), ...suffix.reverse()); }
    catch {
      const parent = dirname(current);
      if (parent === current) return resolve(path);
      suffix.push(basename(current));
      current = parent;
    }
  }
}

async function pathKeys(path: string): Promise<string[]> {
  const lexical = resolve(path);
  const canonical = await canonicalPath(path);
  return [lexical, lexical.toLocaleLowerCase(), canonical, canonical.toLocaleLowerCase()];
}

function outputFor(root: string, source: string, outputDir: string): string {
  const relativeSource = relative(root, source).split(sep).join("/");
  return resolve(outputDir, relativeSource.replace(/\.diagram$/i, ".png"));
}

async function renderCommand(options: RenderOptions, io: FlowCliIO): Promise<number> {
  const sourceInfo = await lstat(options.source);
  if (sourceInfo.isSymbolicLink()) throw new Error("Render does not follow symbolic links. Choose a regular file or directory.");
  const files = sourceInfo.isDirectory() ? await diagramFiles([options.source]) : [options.source];
  if (!files.length) throw new Error("No .diagram files found.");
  const root = sourceInfo.isDirectory() ? options.source : dirname(options.source);
  if (options.outputDir && (resolve(options.outputDir) === resolve(root) || resolve(options.outputDir).startsWith(`${resolve(root)}${sep}`))) {
    throw new Error("--output-dir must be outside the source directory so rendering cannot mutate source files.");
  }
  const prepared = await Promise.all(files.map(async file => ({ file, ...(await validateRenderFile(file)) })));
  const valid = prepared.filter(item => item.parsed);
  const results: RenderResult[] = [];
  let contactSheetPaths: string[] | undefined;
  let contactSheetError: string | undefined;
  let cleanupError: string | undefined;
  const plannedOutputs = options.outputDir ? files.map(file => outputFor(root, file, options.outputDir!)) : [options.output!];
  const contactSheetRequest = options.contactSheet === undefined ? undefined : (options.contactSheet || resolve(options.outputDir!, "contact-sheet.png"));
  const auxiliaryOutputs = [options.report || (options.outputDir ? resolve(options.outputDir, "report.json") : undefined), ...(contactSheetRequest ? contactSheetOutputPaths(contactSheetRequest, files.length) : [])].filter((path): path is string => Boolean(path));
  const protectedPaths = new Map<string, string>();
  const sourceKeys = new Set<string>();
  for (const path of files) for (const key of await pathKeys(path)) sourceKeys.add(key);
  const sourceRootKey = (await canonicalPath(root)).toLocaleLowerCase();
  for (const path of [...plannedOutputs, ...auxiliaryOutputs]) {
    const keys = await pathKeys(path);
    const canonical = (await canonicalPath(path)).toLocaleLowerCase();
    if (auxiliaryOutputs.includes(path) && (canonical.startsWith(`${sourceRootKey}${sep}`) || canonical === sourceRootKey)) throw new Error(`Auxiliary output must be outside the source directory: ${path}.`);
    if (keys.some(key => sourceKeys.has(key))) throw new Error(`Render output collides with a source file: ${path}.`);
    const previous = keys.map(key => protectedPaths.get(key)).find(Boolean);
    if (previous) throw new Error(`Render output collides with ${previous}: ${path}.`);
    for (const key of keys) protectedPaths.set(key, path);
  }
  if (options.outputDir) {
    const outputRoot = await canonicalPath(options.outputDir);
    const sourceRoot = await canonicalPath(root);
    if (outputRoot.toLocaleLowerCase() === sourceRoot.toLocaleLowerCase() || outputRoot.toLocaleLowerCase().startsWith(`${sourceRoot.toLocaleLowerCase()}${sep}`)) {
      throw new Error("--output-dir must be outside the source directory so rendering cannot mutate source files.");
    }
  }
  if (options.output && !options.overwrite && await fileExists(options.output)) {
    throw new Error(`Output exists: ${options.output}. Pass --overwrite to replace it.`);
  }
  if (options.outputDir && !options.overwrite) {
    // Check the short list before startup so a refused batch writes nothing.
    for (const path of plannedOutputs) if (await fileExists(path)) throw new Error(`Output exists: ${path}. Pass --overwrite to replace it.`);
    const reportPath = options.report || resolve(options.outputDir, "report.json");
    if (await fileExists(reportPath)) throw new Error(`Report exists: ${reportPath}. Pass --overwrite to replace it.`);
    if (options.contactSheet !== undefined) {
      const contactPath = options.contactSheet || resolve(options.outputDir, "contact-sheet.png");
      for (const path of contactSheetOutputPaths(contactPath, files.length)) if (await fileExists(path)) throw new Error(`Contact sheet exists: ${path}. Pass --overwrite to replace it.`);
    }
  }
  for (const item of prepared.filter(item => !item.parsed)) {
    results.push({ source: relative(root, item.file), type: item.parsed?.type || null, sourceHash: createHash("sha256").update(item.source).digest("hex"), view: options.variant || "base", output: options.output || outputFor(root, item.file, options.outputDir!), width: options.width, height: options.height, scale: options.scale, layoutEngine: null, warnings: [], status: "failed", error: item.error });
  }
  const renderable: typeof valid = [];
  for (const item of valid) {
    const variantError = options.variant ? requestedVariantError(item.parsed!, options.variant) : undefined;
    if (variantError) {
      const output = options.output || outputFor(root, item.file, options.outputDir!);
      results.push({ source: relative(root, item.file), type: item.parsed!.type, sourceHash: createHash("sha256").update(item.source).digest("hex"), view: options.variant, output, width: options.width, height: options.height, scale: options.scale, layoutEngine: null, warnings: [], status: "failed", error: variantError });
      continue;
    }
    renderable.push(item);
  }
  let browser: Awaited<ReturnType<typeof launchBrowser>> | undefined;
  let server: OwnedServer | undefined;
  let interrupted = false;
  const controller = new AbortController();
  const interrupt = () => {
    interrupted = true;
    controller.abort();
    void browser?.close().catch(() => undefined);
    void server?.close().catch(() => undefined);
  };
  process.once("SIGINT", interrupt);
  process.once("SIGTERM", interrupt);
  try {
    const needsContactRasterizer = Boolean(contactSheetRequest && contactSheetFormat(contactSheetRequest) === "png");
    if (renderable.length || needsContactRasterizer) {
      const executable = await chooseBrowser(options.browser);
      if (renderable.length) server = await startOwnedServer(root, undefined, undefined, controller.signal);
      browser = await launchBrowser(executable, 10_000, controller.signal);
      for (const item of renderable) {
        const output = options.output || outputFor(root, item.file, options.outputDir!);
        const resultBase = { source: relative(root, item.file), type: item.parsed!.type, sourceHash: createHash("sha256").update(item.source).digest("hex"), view: options.variant || "base", output, width: options.width, height: options.height, scale: options.scale, layoutEngine: null as string | null, warnings: [] as string[] };
        try {
          if (await fileExists(output) && !options.overwrite) throw new Error(`Output exists: ${output}. Pass --overwrite to replace it.`);
          const path = relative(root, item.file).split(sep).join("/");
          const url = `${server.url}/?diagram=${encodeURIComponent(path)}&render=1${options.variant ? `&variant=${encodeURIComponent(options.variant)}` : ""}`;
          const capture = await browser.page.screenshot(options.width, options.height, options.scale, url);
          if (interrupted) throw new Error("Render interrupted.");
          await atomicWrite(output, capture.image);
          results.push({ ...resultBase, layoutEngine: capture.layoutEngine, status: "success" });
        } catch (error) {
          results.push({ ...resultBase, status: "failed", error: error instanceof Error ? error.message : String(error) });
        }
      }
      if (options.outputDir && contactSheetRequest) {
        results.sort((a, b) => a.source.localeCompare(b.source));
        const contactPath = contactSheetRequest;
        for (const path of contactSheetOutputPaths(contactPath, files.length)) {
          if (await fileExists(path) && !options.overwrite) throw new Error(`Contact sheet exists: ${path}. Pass --overwrite to replace it.`);
        }
        contactSheetPaths = await writeContactSheets(
          results.map(result => ({ label: result.source, path: result.output, status: result.status, error: result.error } satisfies ContactSheetItem)),
          contactPath,
          contactSheetFormat(contactPath) === "png"
            ? { rasterize: (svg, width, height) => browser!.page.screenshotDocument(width, height, 1, `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`) }
            : undefined,
        );
      }
    } else if (options.outputDir && contactSheetRequest) {
      // SVG sheets do not need a browser, so preserve the useful failure sheet
      // even when every source fails validation before browser startup.
      results.sort((a, b) => a.source.localeCompare(b.source));
      contactSheetPaths = await writeContactSheets(
        results.map(result => ({ label: result.source, path: result.output, status: result.status, error: result.error } satisfies ContactSheetItem)),
        contactSheetRequest,
      );
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (contactSheetRequest && !contactSheetPaths) contactSheetError = message;
    const done = new Set(results.map(result => result.source));
    for (const item of renderable) {
      const source = relative(root, item.file);
      if (done.has(source)) continue;
      results.push({ source, type: item.parsed?.type || null, sourceHash: createHash("sha256").update(item.source).digest("hex"), view: options.variant || "base", output: options.output || outputFor(root, item.file, options.outputDir!), width: options.width, height: options.height, scale: options.scale, layoutEngine: null, warnings: [], status: "failed", error: message });
    }
    if (options.outputDir && contactSheetRequest && contactSheetFormat(contactSheetRequest) === "svg" && !contactSheetPaths) {
      try {
        results.sort((a, b) => a.source.localeCompare(b.source));
        contactSheetPaths = await writeContactSheets(
          results.map(result => ({ label: result.source, path: result.output, status: result.status, error: result.error } satisfies ContactSheetItem)),
          contactSheetRequest,
        );
        contactSheetError = undefined;
      } catch (sheetError) {
        contactSheetError = `${message}; ${sheetError instanceof Error ? sheetError.message : String(sheetError)}`;
      }
    }
  } finally {
    process.removeListener("SIGINT", interrupt);
    process.removeListener("SIGTERM", interrupt);
    try { await browser?.close(); }
    catch (error) { cleanupError = `Browser cleanup failed: ${error instanceof Error ? error.message : String(error)}`; }
    try { await server?.close(); }
    catch (error) {
      const detail = `Server cleanup failed: ${error instanceof Error ? error.message : String(error)}`;
      cleanupError = cleanupError ? `${cleanupError}; ${detail}` : detail;
    }
  }
  if (cleanupError) {
    if (!options.outputDir && results[0]) {
      results[0] = { ...results[0], status: "failed", error: results[0].error ? `${results[0].error}; ${cleanupError}` : cleanupError };
    }
  }
  results.sort((a, b) => a.source.localeCompare(b.source));
  if (options.outputDir) {
    const reportPath = options.report || resolve(options.outputDir, "report.json");
    if (await fileExists(reportPath) && !options.overwrite) throw new Error(`Report exists: ${reportPath}. Pass --overwrite to replace it.`);
    await atomicWrite(reportPath, JSON.stringify({ source: options.source, view: options.variant || "base", dimensions: { width: options.width, height: options.height, scale: options.scale }, ...(cleanupError ? { cleanupError } : {}), ...(contactSheetError ? { contactSheetError } : {}), results }, null, 2) + "\n");
    if (options.contactSheet !== undefined) {
      if (!options.json && contactSheetPaths) io.out(`Contact sheet: ${contactSheetPaths.join(", ")}`);
    }
      if (options.json) io.out(JSON.stringify({ report: reportPath, contactSheet: contactSheetPaths, ...(cleanupError ? { cleanupError } : {}), ...(contactSheetError ? { contactSheetError } : {}), results }, null, 2));
    else io.out(`Rendered ${results.filter(result => result.status === "success").length}/${results.length} diagram files. Report: ${reportPath}${cleanupError ? ` (${cleanupError})` : ""}${contactSheetError ? ` (contact sheet: ${contactSheetError})` : ""}`);
    return results.every(result => result.status === "success") && !cleanupError && !contactSheetError ? 0 : 1;
  }
  const result = results[0];
  if (options.json) io.out(JSON.stringify(result, null, 2));
  else if (result.status === "success") io.out(`Rendered ${result.output} (${result.width}×${result.height} @ ${result.scale}x).`);
  else io.error(`${result.source}: ${result.error}`);
  return result.status === "success" ? 0 : 1;
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
  const parsed = parseDiagramWithDiagnostics(source);
  let valid = parsed.diagnostics.length === 0;

  for (const diagnostic of parsed.diagnostics) {
    io.error(`${path}:${diagnostic.line}:${diagnostic.column}: error ${formatDiagramDslDiagnostic(diagnostic)}`);
  }

  if (valid && parsed.type === "flow") {
    for (const diagnostic of lintFlowDocument(parsed.document.document as FlowDocument)) {
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
    const paths = rest.length ? rest : ["src/data", "docs/examples"];
    const files = await diagramFiles(paths);
    if (!files.length) throw new Error("No .diagram files found.");
    const results = await Promise.all(files.map((file) => checkFile(file, io)));
    if (results.every(Boolean)) io.out(`Checked ${files.length} diagram file${files.length === 1 ? "" : "s"}.`);
    return results.every(Boolean) ? 0 : 1;
  }

  if (command === "format") {
    const checkOnly = rest.includes("--check");
    const paths = rest.filter((arg) => arg !== "--check");
    if (!paths.length) throw new Error("format requires at least one file or directory.");
    const files = await diagramFiles(paths);
    let changed = false;
    for (const file of files) {
      const source = await readFile(file, "utf8");
      const parsed = parseDiagramWithDiagnostics(source);
      if (parsed.diagnostics.length) {
        await checkFile(file, io);
        return 1;
      }
      const formatted = diagramToDsl(parsed.document);
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

  if (command === "render") {
    return renderCommand(await renderOptions(rest), io);
  }

  io.error(`Unknown command "${command}".\n\n${usage()}`);
  return 2;
}

if (process.argv[1] && import.meta.url === pathToFileURL(realpathSync(process.argv[1])).href) {
  runFlowCli(process.argv.slice(2)).then(
    (code) => { process.exitCode = code; },
    (error: unknown) => {
      console.error(error instanceof Error ? error.message : String(error));
      process.exitCode = 2;
    },
  );
}
