import type { FlowDocument } from "./graph.ts";
import type { ApplicationDocument, ApplicationWarning } from "./application.ts";
import type { OverviewDocument, OverviewReferenceWarning } from "./overview.ts";
import type { WireframeDocument } from "./wireframe.ts";

export const DIAGRAM_FORMAT_VERSION = 1 as const;
export const DIAGRAM_TYPES = ["flow", "overview", "wireframe", "application"] as const;
export type DiagramType = (typeof DIAGRAM_TYPES)[number];

export type DiagramDocument =
  | { type: "flow"; document: FlowDocument }
  | { type: "overview"; document: OverviewDocument }
  | { type: "wireframe"; document: WireframeDocument }
  | { type: "application"; document: ApplicationDocument };

export interface DiagramCatalogEntry {
  path: string;
  type?: DiagramType;
  title: string;
  valid: boolean;
  diagnosticCount: number;
}

export interface DiagramCatalog {
  rootName: string;
  workspaceId: string;
  diagrams: DiagramCatalogEntry[];
}

export type DiagramDocumentResponse =
  | ({ path: string; workspaceId: string; sourceHash: string; sourceText: string; canonicalSource: string } & Extract<DiagramDocument, { type: "flow" }>)
  | ({ path: string; workspaceId: string; sourceHash: string; sourceText: string; canonicalSource: string; warnings?: OverviewReferenceWarning[]; activeVariant?: string | null; view?: OverviewDocument } & Extract<DiagramDocument, { type: "overview" }>)
  | ({ path: string; workspaceId: string; sourceHash: string; sourceText: string; canonicalSource: string } & Extract<DiagramDocument, { type: "wireframe" }>)
  | ({ path: string; workspaceId: string; sourceHash: string; sourceText: string; canonicalSource: string; warnings?: ApplicationWarning[] } & Extract<DiagramDocument, { type: "application" }>);

export interface DiagramLoadError {
  error: string;
  path?: string;
  diagnostics?: Array<{
    code?: string;
    line: number;
    column: number;
    message: string;
  }>;
}
