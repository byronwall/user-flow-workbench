export interface OverviewOrigin {
  path: string;
  capabilityId: string;
  viewId?: string;
}

export interface ApplicationOrigin {
  path: string;
  pageId: string;
  stateId?: string;
}

export interface ApplicationSelection {
  pageId: string;
  stateId?: string;
}

function isSafeDiagramPath(path: string): boolean {
  return Boolean(path)
    && !path.includes("\0")
    && path.endsWith(".diagram")
    && !path.startsWith("/")
    && !path.includes("\\")
    && !path.split("/").some((segment) => !segment || segment === "." || segment === "..");
}

function isSafeIdentifier(value: string): boolean {
  return /^[A-Za-z0-9][A-Za-z0-9._-]*$/.test(value);
}

export function parseApplicationSelection(params: URLSearchParams): ApplicationSelection | undefined {
  const pageId = params.get("page") || "";
  const stateId = params.get("state") || undefined;
  if (!isSafeIdentifier(pageId) || (stateId && !isSafeIdentifier(stateId))) return undefined;
  return { pageId, ...(stateId ? { stateId } : {}) };
}

export function composeApplicationSelectionUrl(urlInput: string, selection: ApplicationSelection): string {
  if (!isSafeIdentifier(selection.pageId) || (selection.stateId && !isSafeIdentifier(selection.stateId))) throw new Error("Cannot compose an unsafe application selection.");
  const url = new URL(urlInput, "http://localhost");
  url.searchParams.set("page", selection.pageId);
  if (selection.stateId) url.searchParams.set("state", selection.stateId); else url.searchParams.delete("state");
  return `${url.pathname}${url.search}${url.hash}`;
}

function validateApplicationOrigin(origin: ApplicationOrigin): void {
  if (!isSafeDiagramPath(origin.path) || !isSafeIdentifier(origin.pageId) || (origin.stateId && !isSafeIdentifier(origin.stateId))) {
    throw new Error("Cannot compose a URL for an unsafe application origin.");
  }
}

export function parseApplicationOrigin(params: URLSearchParams): ApplicationOrigin | undefined {
  const path = params.get("application") || "";
  const pageId = params.get("page") || "";
  const stateId = params.get("state") || undefined;
  if (!isSafeDiagramPath(path) || !isSafeIdentifier(pageId) || (stateId && !isSafeIdentifier(stateId))) return undefined;
  return { path, pageId, ...(stateId ? { stateId } : {}) };
}

export function composeApplicationUrl(origin: ApplicationOrigin): string {
  validateApplicationOrigin(origin);
  const params = new URLSearchParams({ diagram: origin.path, page: origin.pageId });
  if (origin.stateId) params.set("state", origin.stateId);
  return `/?${params.toString()}`;
}

function applyApplicationOrigin(params: URLSearchParams, origin: ApplicationOrigin): void {
  validateApplicationOrigin(origin);
  params.set("application", origin.path);
  params.set("page", origin.pageId);
  if (origin.stateId) params.set("state", origin.stateId);
}

export function composeApplicationOverviewUrl(path: string, capabilityId: string, origin: ApplicationOrigin): string {
  if (!isSafeDiagramPath(path) || !isSafeIdentifier(capabilityId)) throw new Error("Cannot compose an unsafe application overview target.");
  const params = new URLSearchParams({ diagram: path, capability: capabilityId });
  applyApplicationOrigin(params, origin);
  return `/?${params.toString()}`;
}

export function composeApplicationFlowUrl(path: string, nodeId: string, origin: ApplicationOrigin): string {
  if (!isSafeDiagramPath(path) || !isSafeIdentifier(nodeId)) throw new Error("Cannot compose an unsafe application flow target.");
  const params = new URLSearchParams({ diagram: path });
  applyApplicationOrigin(params, origin);
  return `/?${params.toString()}#${encodeURIComponent(nodeId)}`;
}

export function composeApplicationWireframeUrl(path: string, screenId: string, origin: ApplicationOrigin): string {
  if (!isSafeDiagramPath(path) || !isSafeIdentifier(screenId)) throw new Error("Cannot compose an unsafe application wireframe target.");
  const params = new URLSearchParams({ diagram: path, screen: screenId });
  applyApplicationOrigin(params, origin);
  return `/?${params.toString()}`;
}

export function parseOverviewOrigin(params: URLSearchParams): OverviewOrigin | undefined {
  const path = params.get("overview") || "";
  const capabilityId = params.get("capability") || "";
  const viewId = params.get("view") || undefined;
  if (!isSafeDiagramPath(path) || !isSafeIdentifier(capabilityId) || (viewId && !isSafeIdentifier(viewId))) return undefined;
  return { path, capabilityId, ...(viewId ? { viewId } : {}) };
}

export function composeFlowUrl(path: string, variant?: string, origin?: OverviewOrigin, applicationOrigin?: ApplicationOrigin): string {
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
  if (applicationOrigin) applyApplicationOrigin(params, applicationOrigin);
  return `/?${params.toString()}`;
}

export function composeWireframeUrl(path: string, screen?: string, origin?: OverviewOrigin, applicationOrigin?: ApplicationOrigin): string {
  if (!isSafeDiagramPath(path) || (screen && !isSafeIdentifier(screen))) throw new Error("Cannot compose a wireframe URL for an unsafe target.");
  const params = new URLSearchParams({ diagram: path });
  if (screen) params.set("screen", screen);
  if (origin) {
    if (!isSafeDiagramPath(origin.path) || !isSafeIdentifier(origin.capabilityId) || (origin.viewId && !isSafeIdentifier(origin.viewId))) throw new Error("Cannot compose a wireframe URL for an unsafe overview origin.");
    params.set("overview", origin.path);
    params.set("capability", origin.capabilityId);
    if (origin.viewId) params.set("view", origin.viewId);
  }
  if (applicationOrigin) applyApplicationOrigin(params, applicationOrigin);
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

export function composeOverviewCapabilityUrl(urlInput: string, capabilityId: string | null): string {
  const url = new URL(urlInput, "http://localhost");
  if (capabilityId) url.searchParams.set("capability", capabilityId);
  else url.searchParams.delete("capability");
  return `${url.pathname}${url.search}${url.hash}`;
}
