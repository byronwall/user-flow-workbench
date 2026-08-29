import { createHash } from "node:crypto";
import { lstat, readFile, readdir, realpath, stat } from "node:fs/promises";
import { basename, isAbsolute, relative, resolve, sep } from "node:path";
import { formatGraphDslDiagnostic, parseGraphDslWithDiagnostics } from "../lib/graph-dsl.ts";
import type { FlowCatalog, FlowCatalogEntry, FlowDocumentResponse, FlowLoadError } from "../types/flow-catalog.ts";

const IGNORED_DIRECTORIES = new Set([".git", ".output", ".vinxi", "build", "dist", "node_modules"]);

export class FlowCatalogError extends Error {
  readonly status: number;
  readonly details?: FlowLoadError;

  constructor(
    message: string,
    status: number,
    details?: FlowLoadError,
  ) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

export async function resolveFlowRoot(input = process.env.FLOW_WORKBENCH_ROOT || process.cwd()): Promise<string> {
  const root = await realpath(resolve(input));
  const info = await stat(root);
  if (!info.isDirectory()) throw new FlowCatalogError(`Flow root is not a directory: ${input}`, 400);
  return root;
}

function workspaceId(root: string): string {
  return createHash("sha256").update(root).digest("hex").slice(0, 16);
}

function portablePath(root: string, path: string): string {
  return relative(root, path).split(sep).join("/");
}

export async function discoverFlowPaths(rootInput?: string): Promise<string[]> {
  const root = await resolveFlowRoot(rootInput);
  const files: string[] = [];

  async function visit(directory: string): Promise<void> {
    const entries = await readdir(directory, { withFileTypes: true });
    entries.sort((a, b) => a.name < b.name ? -1 : a.name > b.name ? 1 : 0);

    for (const entry of entries) {
      if (entry.isSymbolicLink()) continue;
      if (entry.isDirectory()) {
        if (!IGNORED_DIRECTORIES.has(entry.name)) await visit(resolve(directory, entry.name));
        continue;
      }
      if (entry.isFile() && entry.name.endsWith(".flow")) files.push(resolve(directory, entry.name));
    }
  }

  await visit(root);
  return files;
}

async function catalogEntry(root: string, path: string): Promise<FlowCatalogEntry> {
  const source = await readFile(path, "utf8");
  const parsed = parseGraphDslWithDiagnostics(source);
  return {
    path: portablePath(root, path),
    title: parsed.document.graph.title || basename(path, ".flow"),
    valid: parsed.diagnostics.length === 0,
    diagnosticCount: parsed.diagnostics.length,
  };
}

export async function readFlowCatalog(rootInput?: string): Promise<FlowCatalog> {
  const root = await resolveFlowRoot(rootInput);
  const paths = await discoverFlowPaths(root);
  const flows = await Promise.all(paths.map((path) => catalogEntry(root, path)));
  return { rootName: basename(root), workspaceId: workspaceId(root), flows };
}

async function resolveCatalogPath(root: string, requestedPath: string): Promise<string> {
  if (!requestedPath || isAbsolute(requestedPath)) {
    throw new FlowCatalogError("Select a relative .flow path.", 400);
  }

  const segments = requestedPath.split("/");
  if (segments.some((segment) => !segment || segment === "." || segment === ".." || IGNORED_DIRECTORIES.has(segment))) {
    throw new FlowCatalogError("The selected flow path is not available.", 404);
  }

  const candidate = resolve(root, ...segments);
  if (candidate !== root && !candidate.startsWith(`${root}${sep}`)) {
    throw new FlowCatalogError("The selected flow path is outside the flow root.", 403);
  }
  if (!candidate.endsWith(".flow")) throw new FlowCatalogError("Select a .flow file.", 400);

  let info;
  try {
    info = await lstat(candidate);
  } catch {
    throw new FlowCatalogError("The selected flow file does not exist.", 404);
  }
  if (!info.isFile() || info.isSymbolicLink()) {
    throw new FlowCatalogError("The selected flow path is not a regular file.", 404);
  }

  const canonical = await realpath(candidate);
  if (canonical !== root && !canonical.startsWith(`${root}${sep}`)) {
    throw new FlowCatalogError("The selected flow path is outside the flow root.", 403);
  }
  return canonical;
}

export async function readFlowDocument(requestedPath: string, rootInput?: string): Promise<FlowDocumentResponse> {
  const root = await resolveFlowRoot(rootInput);
  const path = await resolveCatalogPath(root, requestedPath);
  const source = await readFile(path, "utf8");
  const parsed = parseGraphDslWithDiagnostics(source);

  if (parsed.diagnostics.length) {
    throw new FlowCatalogError(`Cannot load ${requestedPath}.`, 422, {
      error: "The flow has syntax errors.",
      path: requestedPath,
      diagnostics: parsed.diagnostics.map((diagnostic) => ({
        line: diagnostic.line,
        column: diagnostic.column,
        message: formatGraphDslDiagnostic(diagnostic),
      })),
    });
  }

  return { path: portablePath(root, path), workspaceId: workspaceId(root), document: parsed.document };
}
