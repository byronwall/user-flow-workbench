import { createHash } from "node:crypto";
import { lstat, readFile, readdir, realpath, stat } from "node:fs/promises";
import { basename, isAbsolute, join, relative, resolve, sep } from "node:path";
import { diagramToDsl, formatDiagramDslDiagnostic, parseDiagramWithDiagnostics } from "../lib/diagram-dsl.ts";
import type { DiagramCatalog, DiagramCatalogEntry, DiagramDocumentResponse, DiagramLoadError, DiagramType } from "../types/diagram.ts";
import type { FlowCatalog, FlowCatalogEntry, FlowDocumentResponse } from "../types/flow-catalog.ts";
import type { FlowDocument } from "../types/graph.ts";
import type { OverviewDocument, OverviewReferenceWarning } from "../types/overview.ts";
import type { WireframeDocument } from "../types/wireframe.ts";
import { materializeOverview } from "../lib/overview-dsl.ts";

export const IGNORED_DIRECTORIES = new Set([".git", ".output", ".vinxi", "build", "dist", "node_modules"]);

export class FlowCatalogError extends Error {
  readonly status: number;
  readonly details?: DiagramLoadError;
  constructor(message: string, status: number, details?: DiagramLoadError) { super(message); this.name = "FlowCatalogError"; this.status = status; this.details = details; }
}

export async function resolveFlowRoot(input = process.env.FLOW_WORKBENCH_ROOT || process.cwd()): Promise<string> {
  const root = await realpath(resolve(input));
  const info = await stat(root);
  if (!info.isDirectory()) throw new FlowCatalogError(`Diagram root is not a directory: ${input}`, 400);
  return root;
}
export function workspaceId(root: string): string { return createHash("sha256").update(root).digest("hex").slice(0, 16); }
export function portablePath(root: string, path: string): string { return relative(root, path).split(sep).join("/"); }

export async function discoverDiagramPaths(rootInput?: string): Promise<string[]> {
  const root = await resolveFlowRoot(rootInput); const files: string[] = [];
  async function visit(directory: string): Promise<void> {
    const entries = await readdir(directory, { withFileTypes: true }); entries.sort((a, b) => a.name.localeCompare(b.name));
    for (const entry of entries) {
      if (entry.isSymbolicLink()) continue;
      const path = resolve(directory, entry.name);
      if (entry.isDirectory()) { if (!IGNORED_DIRECTORIES.has(entry.name)) await visit(path); }
      else if (entry.isFile() && entry.name.endsWith(".diagram")) files.push(path);
    }
  }
  await visit(root); return files;
}

function titleOf(type: DiagramType | undefined, document: { graph?: { title?: string }; title?: string }, path: string): string {
  return (type === "flow" ? document.graph?.title : document.title) || basename(path, ".diagram");
}
async function catalogEntry(root: string, path: string): Promise<DiagramCatalogEntry> {
  const parsed = parseDiagramWithDiagnostics(await readFile(path, "utf8"));
  return { path: portablePath(root, path), ...(parsed.type ? { type: parsed.type } : {}), title: titleOf(parsed.type, parsed.document.document, path), valid: parsed.diagnostics.length === 0, diagnosticCount: parsed.diagnostics.length };
}
export async function readDiagramCatalog(rootInput?: string): Promise<DiagramCatalog> {
  const root = await resolveFlowRoot(rootInput); const paths = await discoverDiagramPaths(root);
  return { rootName: basename(root), workspaceId: workspaceId(root), diagrams: await Promise.all(paths.map(path => catalogEntry(root, path))) };
}

export async function resolveDiagramPath(root: string, requestedPath: string): Promise<string> {
  return resolveWorkspaceFile(root, requestedPath, [".diagram"], "Select a relative .diagram path.");
}

export async function resolveReferenceImagePath(root: string, requestedPath: string): Promise<string> {
  return resolveWorkspaceFile(root, requestedPath, [".png", ".jpg", ".jpeg", ".webp"], "Select a relative PNG, JPEG, or WebP image path.");
}

async function resolveWorkspaceFile(root: string, requestedPath: string, extensions: string[], invalidMessage: string): Promise<string> {
  if (!requestedPath || requestedPath.includes("\0") || isAbsolute(requestedPath)) throw new FlowCatalogError(invalidMessage, 400);
  const segments = requestedPath.split("/");
  if (segments.some(segment => !segment || segment === "." || segment === ".." || IGNORED_DIRECTORIES.has(segment))) throw new FlowCatalogError("The selected diagram path is not available.", 404);
  if (!extensions.some(extension => requestedPath.toLowerCase().endsWith(extension))) throw new FlowCatalogError(invalidMessage, 400);
  let current = root;
  for (let index = 0; index < segments.length; index += 1) {
    current = join(current, segments[index]);
    let info;
    try { info = await lstat(current); } catch { throw new FlowCatalogError("The selected diagram file does not exist.", 404); }
    if (info.isSymbolicLink()) throw new FlowCatalogError("The selected diagram path is not available.", 404);
    if (index < segments.length - 1 && !info.isDirectory()) throw new FlowCatalogError("The selected diagram path is not available.", 404);
    if (index === segments.length - 1 && !info.isFile()) throw new FlowCatalogError("The selected diagram path is not a regular file.", 404);
  }
  const canonical = await realpath(current);
  if (canonical !== root && !canonical.startsWith(`${root}${sep}`)) throw new FlowCatalogError("The selected diagram path is outside the diagram root.", 403);
  return canonical;
}

export async function readDiagramDocument(requestedPath: string, rootInput?: string, overviewVariantId?: string): Promise<DiagramDocumentResponse> {
  const root = await resolveFlowRoot(rootInput); const path = await resolveDiagramPath(root, requestedPath); const source = await readFile(path, "utf8");
  const parsed = parseDiagramWithDiagnostics(source);
  if (!parsed.type || parsed.diagnostics.length) throw new FlowCatalogError(`Cannot load ${requestedPath}.`, 422, { error: "The diagram has syntax errors.", path: requestedPath, diagnostics: parsed.diagnostics.map(diagnostic => ({ code: diagnostic.code, line: diagnostic.line, column: diagnostic.column, message: formatDiagramDslDiagnostic(diagnostic) })) });
  const common = { path: portablePath(root, path), workspaceId: workspaceId(root), sourceHash: createHash("sha256").update(source).digest("hex"), sourceText: source };
  if (parsed.type === "flow") return { ...common, type: "flow", document: parsed.document.document as FlowDocument, canonicalSource: diagramToDsl(parsed.document) };
  if (parsed.type === "wireframe") return { ...common, type: "wireframe", document: parsed.document.document as WireframeDocument, canonicalSource: diagramToDsl(parsed.document) };
  const document = parsed.document.document as OverviewDocument;
  let view = document;
  let activeVariant: string | null = null;
  const warnings: OverviewReferenceWarning[] = [];
  if (overviewVariantId) {
    try { view = materializeOverview(document, overviewVariantId); activeVariant = overviewVariantId; }
    catch (error) {
      warnings.push({ code: "OVERVIEW_UNKNOWN_VARIANT", capabilityId: "", path: requestedPath, variant: overviewVariantId, message: error instanceof Error ? error.message : `Unknown overview variant "${overviewVariantId}".`, suggestion: "Reload the base overview or choose an available view." });
    }
  }
  warnings.push(...await resolveOverviewReferences(view, root));
  return { ...common, type: "overview", document, canonicalSource: diagramToDsl(parsed.document), ...(activeVariant ? { activeVariant, view } : {}), ...(warnings.length ? { warnings } : {}) };
}

/** Validate overview links without building a reverse registry or blocking the board. */
export async function resolveOverviewReferences(document: OverviewDocument, rootInput?: string): Promise<OverviewReferenceWarning[]> {
  const root = await resolveFlowRoot(rootInput);
  const warnings: OverviewReferenceWarning[] = [];
  const capabilities = [...document.groups.flatMap((group) => group.capabilities), ...(document.capabilities || [])];
  for (const capability of capabilities) {
    for (const reference of capability.flowRefs || []) {
      try {
        const targetPath = await resolveDiagramPath(root, reference.path);
        const targetParsed = parseDiagramWithDiagnostics(await readFile(targetPath, "utf8"));
        if (!targetParsed.type || targetParsed.diagnostics.length) throw new FlowCatalogError(`Cannot load ${reference.path}.`, 422, { error: "The target diagram has syntax errors.", path: reference.path, diagnostics: targetParsed.diagnostics.map((diagnostic) => ({ code: diagnostic.code, line: diagnostic.line, column: diagnostic.column, message: formatDiagramDslDiagnostic(diagnostic) })) });
        if (targetParsed.type !== "flow") {
          warnings.push({ code: "OVERVIEW_FLOW_WRONG_TYPE", capabilityId: capability.id, path: reference.path, ...(reference.variant ? { variant: reference.variant } : {}), message: `Flow reference resolves to an overview document, not a flow: "${reference.path}".`, suggestion: "Link a diagram whose declaration is type flow." });
        } else if (reference.variant && !(targetParsed.document.document as FlowDocument).variants.some((variant) => variant.id === reference.variant)) {
          warnings.push({ code: "OVERVIEW_FLOW_UNKNOWN_VARIANT", capabilityId: capability.id, path: reference.path, variant: reference.variant, message: `Flow variant "${reference.variant}" does not exist in "${reference.path}".`, suggestion: "Remove the variant or choose one listed by the flow." });
        }
      } catch (error) {
        const code = error instanceof FlowCatalogError && error.status === 422 ? "OVERVIEW_FLOW_INVALID" : "OVERVIEW_FLOW_MISSING";
        warnings.push({ code, capabilityId: capability.id, path: reference.path, ...(reference.variant ? { variant: reference.variant } : {}), message: error instanceof Error ? error.message : `Cannot load flow "${reference.path}".`, suggestion: "Check that the relative .diagram path exists and declares type flow, then retry." });
      }
    }
  }
  return warnings;
}

export async function readFlowCatalog(rootInput?: string): Promise<FlowCatalog> {
  const catalog = await readDiagramCatalog(rootInput); return { rootName: catalog.rootName, workspaceId: catalog.workspaceId, flows: catalog.diagrams.filter(entry => entry.type === "flow") as FlowCatalogEntry[] };
}
export async function readFlowDocument(requestedPath: string, rootInput?: string): Promise<FlowDocumentResponse> {
  const loaded = await readDiagramDocument(requestedPath, rootInput);
  if (loaded.type !== "flow") throw new FlowCatalogError("The selected diagram is an overview, not a flow.", 422, { error: "Flow APIs accept only diagrams with type flow.", path: requestedPath });
  return loaded as FlowDocumentResponse;
}
export function isFlowDocument(document: FlowDocument | OverviewDocument): document is FlowDocument { return "graph" in document; }
