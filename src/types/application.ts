/** A source-backed application map. These records describe product concepts, not storage. */
export interface ApplicationObject {
  readonly id: string;
  readonly title: string;
  readonly detail?: string;
}

export type ApplicationCardinality = "one" | "many" | "optional" | "one-or-many";

export interface ApplicationOwnership {
  readonly id: string;
  readonly ownerId: string;
  readonly objectId: string;
  readonly cardinality: ApplicationCardinality;
}

export interface ApplicationPageState {
  readonly id: string;
  readonly title: string;
  readonly detail?: string;
}

export type ApplicationReference =
  | { readonly kind: "overview"; readonly path: string; readonly capabilityId: string }
  | { readonly kind: "flow"; readonly path: string; readonly nodeId: string }
  | { readonly kind: "wireframe"; readonly path: string; readonly screenId: string }
  | { readonly kind: "document"; readonly path: string; readonly heading?: string };

export interface ApplicationReferenceWarning {
  readonly code: "APPLICATION_REFERENCE_MISSING" | "APPLICATION_REFERENCE_WRONG_TYPE" | "APPLICATION_REFERENCE_MISSING_ID" | "APPLICATION_REFERENCE_MISSING_HEADING" | "APPLICATION_REFERENCE_INVALID";
  readonly pageId: string;
  readonly kind: ApplicationReference["kind"];
  readonly path: string;
  readonly targetId?: string;
  readonly heading?: string;
  readonly message: string;
  readonly suggestion?: string;
}

export type ApplicationCoverageWarning =
  | { readonly code: "APPLICATION_COVERAGE_PAGE_WITHOUT_WIREFRAME"; readonly pageId: string; readonly message: string; readonly suggestion?: string }
  | { readonly code: "APPLICATION_COVERAGE_UNCLAIMED_FLOW_NODE" | "APPLICATION_COVERAGE_UNCLAIMED_OVERVIEW_CAPABILITY" | "APPLICATION_COVERAGE_UNCLAIMED_WIREFRAME_SCREEN"; readonly pageId?: string; readonly kind: "flow" | "overview" | "wireframe"; readonly path: string; readonly targetId: string; readonly message: string; readonly suggestion?: string };

export type ApplicationWarning = ApplicationReferenceWarning | ApplicationCoverageWarning;

export interface ApplicationPage {
  readonly id: string;
  readonly title: string;
  readonly purpose?: string;
  readonly route?: string;
  readonly primaryObjectId?: string;
  readonly states: ApplicationPageState[];
  readonly references: ApplicationReference[];
}

export interface ApplicationNavigation {
  readonly id: string;
  readonly fromPageId: string;
  readonly toPageId: string;
  readonly trigger: string;
  readonly condition?: string;
}

export interface ApplicationDocument {
  readonly id: string;
  readonly title: string;
  readonly purpose?: string;
  readonly objects: ApplicationObject[];
  readonly ownership: ApplicationOwnership[];
  readonly pages: ApplicationPage[];
  readonly navigation: ApplicationNavigation[];
}
