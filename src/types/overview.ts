export interface OverviewFlowReference {
  /** A .diagram path relative to the configured diagram root. */
  readonly path: string;
  /** An optional flow variant ID. The base flow is used when omitted. */
  readonly variant?: string;
}

export interface OverviewCapability {
  readonly id: string;
  readonly title: string;
  readonly detail?: string;
  /** Set for grouped capabilities. Omitted for an ungrouped capability. */
  readonly groupId?: string;
  /** Ordered links to standalone flow diagrams. */
  readonly flowRefs?: readonly OverviewFlowReference[];
}

export interface OverviewGroup {
  readonly id: string;
  readonly title: string;
  capabilities: OverviewCapability[];
}

export interface OverviewDocument {
  readonly id: string;
  readonly title: string;
  readonly statusLabel?: string;
  readonly purpose: string;
  readonly groups: readonly OverviewGroup[];
  /** Capabilities without a group. They are ordered after all groups. */
  readonly capabilities?: readonly OverviewCapability[];
  /** Source metadata is supplied by the server, not the semantic DSL. */
  readonly sourcePath?: string;
  /** Named alternatives are ordered operations over the shared base view. */
  readonly variants?: readonly OverviewVariant[];
}

export type OverviewGroupChanges = { title?: string };
export type OverviewCapabilityChanges = { title?: string; detail?: string; groupId?: string; flowRefs?: OverviewFlowReference[] };

export type OverviewVariantOperation =
  | { readonly kind: "add-group"; readonly group: OverviewGroup }
  | { readonly kind: "remove-group"; readonly groupId: string }
  | { readonly kind: "set-group"; readonly groupId: string; readonly changes: OverviewGroupChanges }
  | { readonly kind: "add-capability"; readonly capability: OverviewCapability }
  | { readonly kind: "remove-capability"; readonly capabilityId: string }
  | { readonly kind: "set-capability"; readonly capabilityId: string; readonly changes: OverviewCapabilityChanges }
  | { readonly kind: "unset-capability"; readonly capabilityId: string; readonly property: "detail" | "group" | "flows" };

export interface OverviewVariant {
  readonly id: string;
  readonly title: string;
  readonly description?: string;
  readonly operations: readonly OverviewVariantOperation[];
}

export interface OverviewReferenceWarning {
  readonly code: string;
  readonly capabilityId: string;
  readonly path: string;
  readonly variant?: string;
  readonly message: string;
  readonly suggestion?: string;
}
