import { createHash } from "node:crypto";
import { lstat, readFile, readdir, realpath, stat } from "node:fs/promises";
import { basename, isAbsolute, join, relative, resolve, sep } from "node:path";
import { diagramToDsl, formatDiagramDslDiagnostic, parseDiagramWithDiagnostics } from "../lib/diagram-dsl.ts";
import type { DiagramCatalog, DiagramCatalogEntry, DiagramDocumentResponse, DiagramLoadError, DiagramType } from "../types/diagram.ts";
import type { FlowCatalog, FlowCatalogEntry, FlowDocumentResponse } from "../types/flow-catalog.ts";
import type { FlowDocument } from "../types/graph.ts";
import type { ApplicationCoverageWarning, ApplicationDocument, ApplicationReference, ApplicationReferenceWarning } from "../types/application.ts";
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

export async function resolvePlanningDocumentPath(root: string, requestedPath: string): Promise<string> {
  return resolveWorkspaceFile(root, requestedPath, [".md", ".mdx", ".txt", ".pdf", ".json"], "Select a relative planning document path.");
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
  if (parsed.type === "application") {
    const document = parsed.document.document as ApplicationDocument;
    const warnings = [...await resolveApplicationReferences(document, root), ...await resolveApplicationCoverage(document, root)];
    return { ...common, type: "application", document, canonicalSource: diagramToDsl(parsed.document), ...(warnings.length ? { warnings } : {}) };
  }
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

/** Resolve only explicit application references. Failures stay on the page as warnings. */
export async function resolveApplicationReferences(document: ApplicationDocument, rootInput?: string): Promise<ApplicationReferenceWarning[]> {
  const root = await resolveFlowRoot(rootInput);
  const warnings: ApplicationReferenceWarning[] = [];
  for (const page of document.pages) {
    for (const reference of page.references) {
      try {
        if (reference.kind === "document") {
          const targetPath = await resolvePlanningDocumentPath(root, reference.path);
          if (reference.heading && !documentHasHeading(await readFile(targetPath, "utf8"), reference.heading)) {
            warnings.push(applicationWarning("APPLICATION_REFERENCE_MISSING_HEADING", page.id, reference, `Planning document heading "${reference.heading}" was not found in "${reference.path}".`, "Choose an existing heading or repair the document reference."));
          }
          continue;
        }
        const targetPath = await resolveDiagramPath(root, reference.path);
        const parsed = parseDiagramWithDiagnostics(await readFile(targetPath, "utf8"));
        if (!parsed.type || parsed.diagnostics.length) {
          warnings.push(applicationWarning("APPLICATION_REFERENCE_INVALID", page.id, reference, `The referenced diagram "${reference.path}" is not valid.`, "Repair the target diagram before opening it."));
          continue;
        }
        const expected = reference.kind;
        if (parsed.type !== expected) {
          warnings.push(applicationWarning("APPLICATION_REFERENCE_WRONG_TYPE", page.id, reference, `Reference expects a ${expected} document, but "${reference.path}" declares type ${parsed.type}.`, `Link a diagram whose declaration is type ${expected}.`));
          continue;
        }
        const targetId = reference.kind === "overview"
          ? reference.capabilityId
          : reference.kind === "flow" ? reference.nodeId : reference.screenId;
        const found = reference.kind === "overview"
          ? [...(parsed.document.document as OverviewDocument).groups.flatMap((group) => group.capabilities), ...((parsed.document.document as OverviewDocument).capabilities || [])].some((capability) => capability.id === targetId)
          : reference.kind === "flow"
            ? (parsed.document.document as FlowDocument).graph.nodes.some((node) => node.id === targetId)
            : (parsed.document.document as WireframeDocument).screens.some((screen) => screen.id === targetId);
        if (!found) {
          warnings.push(applicationWarning("APPLICATION_REFERENCE_MISSING_ID", page.id, reference, `Referenced ${expected} ID "${targetId}" was not found in "${reference.path}".`, "Choose an existing target ID or repair the reference."));
        }
      } catch (error) {
        warnings.push(applicationWarning("APPLICATION_REFERENCE_MISSING", page.id, reference, error instanceof Error ? error.message : `Referenced target "${reference.path}" does not exist.`, "Check the relative target path, then retry."));
      }
    }
  }
  return warnings;
}

/** Warn only about gaps inside explicitly referenced artifacts. */
export async function resolveApplicationCoverage(document: ApplicationDocument, rootInput?: string): Promise<ApplicationCoverageWarning[]> {
  const root = await resolveFlowRoot(rootInput);
  const warnings: ApplicationCoverageWarning[] = [];
  for (const page of document.pages) {
    if (!page.references.some((reference) => reference.kind === "wireframe")) {
      warnings.push({ code: "APPLICATION_COVERAGE_PAGE_WITHOUT_WIREFRAME", pageId: page.id, message: `Page "${page.title}" has no explicit wireframe reference.`, suggestion: "Add a wireframe reference when this page has a proposed screen." });
    }
  }
  const targets = new Map<string, { kind: "flow" | "overview" | "wireframe"; claimed: Set<string> }>();
  for (const page of document.pages) {
    for (const reference of page.references) {
      if (reference.kind === "document") continue;
      const targetId = reference.kind === "overview" ? reference.capabilityId : reference.kind === "flow" ? reference.nodeId : reference.screenId;
      let target = targets.get(`${reference.kind}:${reference.path}`);
      if (!target) {
        try {
          const targetPath = await resolveDiagramPath(root, reference.path);
          const parsed = parseDiagramWithDiagnostics(await readFile(targetPath, "utf8"));
          if (parsed.diagnostics.length || parsed.type !== reference.kind) continue;
          target = { kind: reference.kind, claimed: new Set<string>() };
          targets.set(`${reference.kind}:${reference.path}`, target);
          const ids = reference.kind === "flow"
            ? (parsed.document.document as FlowDocument).graph.nodes.map((node) => node.id)
            : reference.kind === "overview"
              ? [...(parsed.document.document as OverviewDocument).groups.flatMap((group) => group.capabilities), ...((parsed.document.document as OverviewDocument).capabilities || [])].map((capability) => capability.id)
              : (parsed.document.document as WireframeDocument).screens.map((screen) => screen.id);
          const code = reference.kind === "flow" ? "APPLICATION_COVERAGE_UNCLAIMED_FLOW_NODE" : reference.kind === "overview" ? "APPLICATION_COVERAGE_UNCLAIMED_OVERVIEW_CAPABILITY" : "APPLICATION_COVERAGE_UNCLAIMED_WIREFRAME_SCREEN";
          for (const id of ids) warnings.push({ code, kind: reference.kind, path: reference.path, targetId: id, message: `${reference.kind === "flow" ? "Flow node" : reference.kind === "overview" ? "Overview capability" : "Wireframe screen"} "${id}" in "${reference.path}" has no owning application page.`, suggestion: "Add an explicit application page reference or leave the artifact outside this map." });
        } catch {
          continue;
        }
      }
      target.claimed.add(targetId);
    }
  }
  return warnings.filter((warning) => {
    if (warning.code === "APPLICATION_COVERAGE_PAGE_WITHOUT_WIREFRAME") return true;
    return !targets.get(`${warning.kind}:${warning.path}`)?.claimed.has(warning.targetId);
  });
}

function applicationWarning(code: ApplicationReferenceWarning["code"], pageId: string, reference: ApplicationReference, message: string, suggestion: string): ApplicationReferenceWarning {
  const targetId = reference.kind === "overview" ? reference.capabilityId : reference.kind === "flow" ? reference.nodeId : reference.kind === "wireframe" ? reference.screenId : undefined;
  return { code, pageId, kind: reference.kind, path: reference.path, ...(targetId ? { targetId } : {}), ...(reference.kind === "document" && reference.heading ? { heading: reference.heading } : {}), message, suggestion };
}

function documentHasHeading(source: string, heading: string): boolean {
  const wanted = heading.trim();
  if (!wanted) return false;
  return source.split(/\r?\n/).some((line) => line.trim() === wanted || /^#{1,6}\s+(.+?)\s*#*\s*$/.exec(line)?.[1]?.trim() === wanted);
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
    for (const reference of capability.wireframeRefs || []) {
      try {
        const targetPath = await resolveDiagramPath(root, reference.path);
        const targetParsed = parseDiagramWithDiagnostics(await readFile(targetPath, "utf8"));
        if (!targetParsed.type || targetParsed.diagnostics.length) throw new FlowCatalogError(`Cannot load ${reference.path}.`, 422, { error: "The target diagram has syntax errors.", path: reference.path, diagnostics: targetParsed.diagnostics.map((diagnostic) => ({ code: diagnostic.code, line: diagnostic.line, column: diagnostic.column, message: formatDiagramDslDiagnostic(diagnostic) })) });
        if (targetParsed.type !== "wireframe") {
          warnings.push({ code: "OVERVIEW_WIREFRAME_WRONG_TYPE", capabilityId: capability.id, path: reference.path, ...(reference.screen ? { screen: reference.screen } : {}), message: `Wireframe reference resolves to a ${targetParsed.type} document, not a wireframe: "${reference.path}".`, suggestion: "Link a diagram whose declaration is type wireframe." });
        } else if (reference.screen && !(targetParsed.document.document as WireframeDocument).screens.some((screen) => screen.id === reference.screen)) {
          warnings.push({ code: "OVERVIEW_WIREFRAME_MISSING_SCREEN", capabilityId: capability.id, path: reference.path, screen: reference.screen, message: `Wireframe screen "${reference.screen}" does not exist in "${reference.path}".`, suggestion: "Remove the screen or choose one listed by the wireframe." });
        }
      } catch (error) {
        const code = error instanceof FlowCatalogError && error.status === 422 ? "OVERVIEW_WIREFRAME_INVALID" : "OVERVIEW_WIREFRAME_MISSING";
        warnings.push({ code, capabilityId: capability.id, path: reference.path, ...(reference.screen ? { screen: reference.screen } : {}), message: error instanceof Error ? error.message : `Cannot load wireframe "${reference.path}".`, suggestion: "Check that the relative .diagram path exists and declares type wireframe, then retry." });
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
