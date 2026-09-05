import type { DiagramCatalog, DiagramCatalogEntry } from "../types/diagram";
import type { OverviewCapability, OverviewDocument } from "../types/overview";

export type WorkspaceEntry =
  | { kind: "application"; application: DiagramCatalogEntry }
  | { kind: "application-chooser"; applications: DiagramCatalogEntry[] }
  | { kind: "overview"; overview: DiagramCatalogEntry }
  | { kind: "overview-chooser"; overviews: DiagramCatalogEntry[] }
  | { kind: "inventory" };

export function selectWorkspaceEntry(catalog: DiagramCatalog): WorkspaceEntry {
  const applications = catalog.diagrams.filter((diagram) => diagram.type === "application" && diagram.valid);
  if (applications.length === 1) return { kind: "application", application: applications[0] };
  if (applications.length > 1) return { kind: "application-chooser", applications };
  const overviews = catalog.diagrams.filter((diagram) => diagram.type === "overview" && diagram.valid);
  if (overviews.length === 1) return { kind: "overview", overview: overviews[0] };
  if (overviews.length > 1) return { kind: "overview-chooser", overviews };
  return { kind: "inventory" };
}

export type WorkspaceNavigationFlow = Omit<DiagramCatalogEntry, "type"> & {
  type: "flow";
  variant?: string;
};

export type WorkspaceNavigationWireframe = Omit<DiagramCatalogEntry, "type"> & {
  type: "wireframe";
  screen?: string;
};

export interface WorkspaceNavigationCapability {
  id: string;
  title: string;
  detail?: string;
  groupId?: string;
  relatedFlows: WorkspaceNavigationFlow[];
  relatedWireframeScreens: WorkspaceNavigationWireframe[];
}

export interface WorkspaceNavigationGroup {
  id: string;
  title: string;
  capabilities: WorkspaceNavigationCapability[];
}

export interface WorkspaceNavigationProjection {
  overview?: DiagramCatalogEntry;
  groups: WorkspaceNavigationGroup[];
  ungroupedCapabilities: WorkspaceNavigationCapability[];
  allDiagrams: DiagramCatalogEntry[];
  notLinkedHere: DiagramCatalogEntry[];
}

function navigationCapability(capability: OverviewCapability, entries: readonly DiagramCatalogEntry[]): WorkspaceNavigationCapability {
  const resolve = <T extends "flow" | "wireframe">(path: string, type: T): Omit<DiagramCatalogEntry, "type"> & { type: T } => {
    const entry = entries.find((candidate) => candidate.path === path);
    if (!entry) return { path, title: path, type, valid: false, diagnosticCount: 0 };
    return { ...entry, type, ...(entry.type !== type ? { valid: false } : {}) };
  };
  return {
    id: capability.id,
    title: capability.title,
    ...(capability.detail !== undefined ? { detail: capability.detail } : {}),
    ...(capability.groupId ? { groupId: capability.groupId } : {}),
    relatedFlows: (capability.flowRefs || []).map((reference) => ({ ...resolve(reference.path, "flow"), ...(reference.variant ? { variant: reference.variant } : {}) })),
    relatedWireframeScreens: (capability.wireframeRefs || []).map((reference) => ({ ...resolve(reference.path, "wireframe"), ...(reference.screen ? { screen: reference.screen } : {}) })),
  };
}

/** Derive capability navigation from one active overview view and its catalog. */
export function projectWorkspaceNavigation(
  view: OverviewDocument,
  catalog: DiagramCatalog,
  overviewPath = view.sourcePath,
): WorkspaceNavigationProjection {
  const groups = view.groups.map((group) => ({
    id: group.id,
    title: group.title,
    capabilities: group.capabilities.map((capability) => navigationCapability(capability, catalog.diagrams)),
  }));
  const groupedIds = new Set(groups.flatMap((group) => group.capabilities.map((capability) => capability.id)));
  const ungroupedCapabilities = (view.capabilities || [])
    .filter((capability) => !groupedIds.has(capability.id))
    .map((capability) => navigationCapability(capability, catalog.diagrams));
  const linkedPaths = new Set([
    ...groups.flatMap((group) => group.capabilities.flatMap((capability) => capability.relatedFlows.map((flow) => flow.path))),
    ...groups.flatMap((group) => group.capabilities.flatMap((capability) => capability.relatedWireframeScreens.map((screen) => screen.path))),
    ...ungroupedCapabilities.flatMap((capability) => capability.relatedFlows.map((flow) => flow.path)),
    ...ungroupedCapabilities.flatMap((capability) => capability.relatedWireframeScreens.map((screen) => screen.path)),
  ]);
  const selectedOverview = overviewPath
    ? catalog.diagrams.find((entry) => entry.path === overviewPath && entry.type === "overview")
    : undefined;

  return {
    ...(selectedOverview ? { overview: selectedOverview } : {}),
    groups,
    ungroupedCapabilities,
    allDiagrams: [...catalog.diagrams],
    notLinkedHere: catalog.diagrams.filter((entry) => entry.valid && (entry.type === "flow" || entry.type === "wireframe") && !linkedPaths.has(entry.path)),
  };
}
