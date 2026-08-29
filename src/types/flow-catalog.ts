import type { FlowDocument } from "./graph";

export interface FlowCatalogEntry {
  path: string;
  title: string;
  valid: boolean;
  diagnosticCount: number;
}

export interface FlowCatalog {
  rootName: string;
  workspaceId: string;
  flows: FlowCatalogEntry[];
}

export interface FlowDocumentResponse {
  path: string;
  workspaceId: string;
  document: FlowDocument;
}

export interface FlowLoadError {
  error: string;
  path?: string;
  diagnostics?: Array<{
    line: number;
    column: number;
    message: string;
  }>;
}
