export interface OverviewOrigin {
  path: string;
  capabilityId: string;
  viewId?: string;
}

function isSafeDiagramPath(path: string): boolean {
  return Boolean(path)
    && path.endsWith(".diagram")
    && !path.startsWith("/")
    && !path.includes("\\")
    && !path.split("/").some((segment) => !segment || segment === "." || segment === "..");
}

function isSafeIdentifier(value: string): boolean {
  return /^[A-Za-z0-9][A-Za-z0-9._-]*$/.test(value);
}

export function parseOverviewOrigin(params: URLSearchParams): OverviewOrigin | undefined {
  const path = params.get("overview") || "";
  const capabilityId = params.get("capability") || "";
  const viewId = params.get("view") || undefined;
  if (!isSafeDiagramPath(path) || !isSafeIdentifier(capabilityId) || (viewId && !isSafeIdentifier(viewId))) return undefined;
  return { path, capabilityId, ...(viewId ? { viewId } : {}) };
}

export function composeFlowUrl(path: string, variant?: string, origin?: OverviewOrigin): string {
  if (!isSafeDiagramPath(path)) throw new Error("Cannot compose a flow URL for an unsafe diagram path.");
  const params = new URLSearchParams({ diagram: path });
  if (variant && isSafeIdentifier(variant)) params.set("variant", variant);
  if (origin) {
    if (!isSafeDiagramPath(origin.path) || !isSafeIdentifier(origin.capabilityId) || (origin.viewId && !isSafeIdentifier(origin.viewId))) {
      throw new Error("Cannot compose a flow URL for an unsafe overview origin.");
    }
    params.set("overview", origin.path);
    params.set("capability", origin.capabilityId);
    if (origin.viewId) params.set("view", origin.viewId);
  }
  return `/?${params.toString()}`;
}

export function composeOverviewUrl(origin: OverviewOrigin): string {
  if (!isSafeDiagramPath(origin.path) || !isSafeIdentifier(origin.capabilityId) || (origin.viewId && !isSafeIdentifier(origin.viewId))) {
    throw new Error("Cannot compose an overview URL for an unsafe origin.");
  }
  const params = new URLSearchParams({ diagram: origin.path });
  if (origin.capabilityId) params.set("capability", origin.capabilityId);
  if (origin.viewId) params.set("variant", origin.viewId);
  return `/?${params.toString()}`;
}
