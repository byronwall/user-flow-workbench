import type { FlowDocument } from "./graph.ts";
import type { DiagramCatalogEntry, DiagramLoadError, DiagramDocumentResponse } from "./diagram.ts";

export type FlowCatalogEntry = DiagramCatalogEntry;
export interface FlowCatalog { rootName: string; workspaceId: string; flows: FlowCatalogEntry[]; }
export type FlowDocumentResponse = DiagramDocumentResponse & { type: "flow"; document: FlowDocument };
export type FlowLoadError = DiagramLoadError;
