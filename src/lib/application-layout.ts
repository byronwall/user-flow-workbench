import type { ElkExtendedEdge, ElkNode } from "elkjs/lib/elk-api";
import type { ApplicationDocument } from "../types/application.ts";

export const PAGE_WIDTH = 148;
export const PAGE_HEIGHT = 72;

export function edgeMarkerPosition(edge: ElkExtendedEdge, nodes: readonly ElkNode[] = [], occupied: readonly { x: number; y: number }[] = []): { x: number; y: number; anchor?: { x: number; y: number } } {
  let longest = -1;
  let position = { x: 0, y: 0 };
  const segments: { a: { x: number; y: number }; b: { x: number; y: number }; length: number }[] = [];
  for (const section of edge.sections || []) {
    const points = [section.startPoint, ...(section.bendPoints || []), section.endPoint];
    for (let index = 1; index < points.length; index++) {
      const a = points[index - 1], b = points[index];
      const length = Math.hypot(b.x - a.x, b.y - a.y);
      segments.push({ a, b, length });
      if (length > longest) {
        longest = length;
        position = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
      }
    }
  }
  const clear = (point: { x: number; y: number }) => nodes.every((node) => point.x + 24 <= node.x! || point.x - 24 >= node.x! + node.width! || point.y + 24 <= node.y! || point.y - 24 >= node.y! + node.height!)
    && occupied.every((other) => Math.hypot(point.x - other.x, point.y - other.y) >= 48);
  for (const { a, b } of segments.sort((a, b) => b.length - a.length)) {
    for (const t of [.5, .45, .55, .4, .6, .35, .65, .3, .7, .25, .75, .2, .8, .15, .85, .1, .9, .05, .95]) {
      const point = { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };
      if (clear(point)) return point;
    }
  }
  // Dense crossings may have no clear edge segment. Use a short leader to keep the number legible.
  const width = Math.max(0, ...nodes.map((node) => node.x! + node.width!)) + 20;
  const height = Math.max(0, ...nodes.map((node) => node.y! + node.height!)) + 20;
  for (let radius = 32; radius <= Math.max(width, height); radius += 24) {
    for (let direction = 0; direction < 16; direction++) {
      const angle = direction * Math.PI / 8;
      const point = { x: position.x + Math.cos(angle) * radius, y: position.y + Math.sin(angle) * radius };
      if (point.x >= 16 && point.y >= 16 && point.x <= width - 16 && point.y <= height - 16 && clear(point)) return { ...point, anchor: position };
    }
  }
  return position;
}

export function fallbackApplicationLayout(document: Pick<ApplicationDocument, "pages" | "navigation">): ElkNode {
  const children = document.pages.map((page, index) => ({ id: page.id, x: 16 + index * 196, y: 16, width: PAGE_WIDTH, height: PAGE_HEIGHT }));
  const nodes = new Map(children.map((node) => [node.id, node]));
  // ponytail: fallback uses authored order and separate lower lanes; ELK supplies the normal layered layout.
  const edges = document.navigation.flatMap((edge, index) => {
    const from = nodes.get(edge.fromPageId), to = nodes.get(edge.toPageId);
    if (!from || !to) return [];
    const startPoint = { x: from.x + PAGE_WIDTH * .7, y: from.y + PAGE_HEIGHT };
    const endPoint = { x: to.x + PAGE_WIDTH * .3, y: to.y + PAGE_HEIGHT };
    const y = PAGE_HEIGHT + 40 + index * 16;
    return [{ id: edge.id, sources: [from.id], targets: [to.id], sections: [{ id: edge.id, startPoint, endPoint, bendPoints: [{ x: startPoint.x, y }, { x: endPoint.x, y }] }] }];
  });
  return { id: "pages", width: Math.max(196, children.length * 196), height: PAGE_HEIGHT + 56 + edges.length * 16, children, edges };
}

export function applicationNetwork(document: ApplicationDocument) {
  const nodes = [
    ...(document.ownership.some((edge) => edge.ownerId === document.id) ? [{ id: "application", sourceId: document.id, title: document.title, kind: "application" as const }] : []),
    ...document.pages.map((page) => ({ id: `page:${page.id}`, sourceId: page.id, title: page.title, kind: "page" as const })),
    ...document.objects.map((object) => ({ id: `object:${object.id}`, sourceId: object.id, title: object.title, kind: "object" as const })),
  ];
  const edges = [
    ...document.navigation.map((edge) => ({ id: `navigation:${edge.id}`, fromPageId: `page:${edge.fromPageId}`, toPageId: `page:${edge.toPageId}`, kind: "navigation" as const, label: `${edge.trigger}${edge.condition ? ` · ${edge.condition}` : ""}` })),
    ...document.ownership.map((edge) => ({ id: `ownership:${edge.id}`, fromPageId: edge.ownerId === document.id ? "application" : `object:${edge.ownerId}`, toPageId: `object:${edge.objectId}`, kind: "ownership" as const, label: `Owns · ${edge.cardinality}` })),
    ...document.pages.filter((page) => page.primaryObjectId).map((page) => ({ id: `primary:${page.id}`, fromPageId: `page:${page.id}`, toPageId: `object:${page.primaryObjectId}`, kind: "primary" as const, label: "Primary object" })),
  ];
  return { nodes, edges };
}

export function fallbackApplicationNetwork(document: ApplicationDocument) {
  const graph = applicationNetwork(document);
  return fallbackApplicationLayout({
    pages: graph.nodes.map((node) => ({ ...node, states: [], references: [] })),
    navigation: graph.edges.map((edge) => ({ ...edge, trigger: edge.label })),
  });
}

export async function layoutApplicationNetwork(document: ApplicationDocument): Promise<ElkNode> {
  const { default: ELK } = await import("elkjs/lib/elk.bundled.js");
  const graph = applicationNetwork(document);
  return new ELK().layout({
    id: "network",
    layoutOptions: {
      "elk.algorithm": "layered",
      "elk.direction": "RIGHT",
      "elk.edgeRouting": "ORTHOGONAL",
      "elk.padding": "[top=24,left=24,bottom=24,right=24]",
      "elk.spacing.nodeNode": "48",
      "elk.layered.spacing.nodeNodeBetweenLayers": "64",
      "elk.layered.nodePlacement.favorStraightEdges": "true",
    },
    children: graph.nodes.map((node) => ({ id: node.id, width: PAGE_WIDTH, height: PAGE_HEIGHT })),
    edges: graph.edges.map((edge) => ({ id: edge.id, sources: [edge.fromPageId], targets: [edge.toPageId] })),
  });
}

export async function layoutApplicationPages(document: ApplicationDocument): Promise<ElkNode> {
  const { default: ELK } = await import("elkjs/lib/elk.bundled.js");
  const elk = new ELK();
  return elk.layout({
    id: "pages",
    layoutOptions: {
      "elk.algorithm": "layered",
      "elk.direction": "RIGHT",
      "elk.edgeRouting": "ORTHOGONAL",
      "elk.padding": "[top=16,left=16,bottom=16,right=16]",
      "elk.spacing.nodeNode": "32",
      "elk.layered.spacing.nodeNodeBetweenLayers": "48",
    },
    children: document.pages.map((page) => ({ id: page.id, width: PAGE_WIDTH, height: PAGE_HEIGHT })),
    edges: document.navigation.map((edge) => ({ id: edge.id, sources: [edge.fromPageId], targets: [edge.toPageId] })),
  });
}
