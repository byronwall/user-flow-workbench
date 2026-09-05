import type { DiagramCatalogEntry } from "../types/diagram";
import type { OverviewCapability, OverviewDocument } from "../types/overview";

export interface OverviewWireframeInventoryItem {
  path: string;
  title: string;
  linkedFrom: string[];
  relationship?: { capabilityId: string; screen?: string };
}

function allCapabilities(document: OverviewDocument): OverviewCapability[] {
  return [...document.groups.flatMap((group) => group.capabilities), ...(document.capabilities || [])];
}

function directoryOf(path: string | undefined): string {
  const slash = path?.lastIndexOf("/") ?? -1;
  return slash < 0 ? "" : path!.slice(0, slash);
}

export function overviewWireframeInventory(
  entries: readonly DiagramCatalogEntry[],
  overviewPath: string | undefined,
  view: OverviewDocument,
): OverviewWireframeInventoryItem[] {
  const folder = directoryOf(overviewPath);
  const relationships = new Map<string, { capabilityId: string; screen?: string; titles: Set<string> }>();
  for (const capability of allCapabilities(view)) {
    for (const reference of capability.wireframeRefs || []) {
      const existing = relationships.get(reference.path);
      if (existing) existing.titles.add(capability.title);
      else relationships.set(reference.path, { capabilityId: capability.id, ...(reference.screen ? { screen: reference.screen } : {}), titles: new Set([capability.title]) });
    }
  }

  const wireframes = new Map<string, DiagramCatalogEntry>();
  for (const entry of entries) {
    if (entry.valid && entry.type === "wireframe" && !wireframes.has(entry.path)) wireframes.set(entry.path, entry);
  }
  return [...wireframes.values()]
    .filter((entry) => directoryOf(entry.path) === folder || relationships.has(entry.path))
    .map((entry) => {
      const relation = relationships.get(entry.path);
      return {
        path: entry.path,
        title: entry.title,
        linkedFrom: relation ? [...relation.titles].sort((left, right) => left.localeCompare(right)) : [],
        ...(relation ? { relationship: { capabilityId: relation.capabilityId, ...(relation.screen ? { screen: relation.screen } : {}) } } : {}),
      };
    })
    .sort((left, right) => left.path.localeCompare(right.path));
}
