/**
 * Planning contract. The first application parser and viewer now implement its core element set.
 * Revised from the downloaded Pro review; see feedback-integration.md.
 * Semantic validators enforce slot shapes, owner-wide ID uniqueness, and paths.
 * Typed proof fixtures can use spans pointing to their TypeScript declarations.
 * Parser proof must later provide exact DSL declaration and property spans.
 */
export type Id = string;

export interface SourcePoint {
  line: number;
  column: number;
}

export interface SourceSpan {
  file: string;
  start: SourcePoint;
  end: SourcePoint;
}

export interface Located {
  span: SourceSpan;
  propertySpans: Record<string, SourceSpan>;
}

export interface Navigation {
  goto?: Id;
}

export type Element =
  | (Located & {
      kind: "stack";
      id?: Id;
      children: Element[];
    })
  | (Located & {
      kind: "bar";
      id?: Id;
      start: BarLeaf[];
      end: BarLeaf[];
    })
  | (Located & {
      kind: "grid";
      id?: Id;
      columns: number;
      children: Element[];
    })
  | (Located & {
      kind: "text";
      id?: Id;
      text: string;
      role: "title" | "heading" | "body" | "caption";
    })
  | (Located & { kind: "badge"; id?: Id; text: string })
  | (Located & Navigation & {
      kind: "button";
      id: Id;
      label: string;
      state?: "disabled";
    })
  | (Located & Navigation & {
      kind: "link";
      id: Id;
      label: string;
    })
  | (Located & {
      kind: "field";
      id: Id;
      label: string;
      value?: string;
    })
  | (Located & Navigation & {
      kind: "card";
      id: Id;
      title: string;
      detail?: string;
      state?: "selected";
    })
  | (Located & {
      kind: "notice";
      id: Id;
      title: string;
      detail?: string;
      noticeKind: "info" | "warning" | "error";
    })
  | (Located & {
      kind: "popover";
      id: Id;
      triggerId: Id;
      children: Element[];
    })
  | (Located & { kind: "rule"; id?: Id })
  | (Located & { kind: "tabs"; id: Id; tabs: Tab[] })
  | (Located & { kind: "list"; id: Id; items: ListItem[] })
  | (Located & { kind: "use"; id: Id; partId: Id })
  | (Located & {
      kind: "diagram";
      id: Id;
      source: string;
      view: Id;
      focus?: Id;
    });

export type BarLeaf = Extract<Element, { kind: "text" | "badge" | "button" | "link" }>;

export interface Tab extends Located, Navigation {
  id: Id;
  label: string;
  state?: "active";
}

export interface ListItem extends Located, Navigation {
  id: Id;
  label: string;
  detail?: string;
  state?: "selected";
}

export type Frame =
  | {
      kind: "workbench";
      inspector: number;
      header: Element[];
      top: Element[];
      main: Element[];
      aside: Element[];
    }
  | {
      kind: "page";
      content: number;
      body: Element[];
    };

export interface Screen extends Located {
  id: Id;
  title: string;
  basis: "observed" | "source" | "proposed";
  referenceId?: Id;
  marks: Array<{ target: Id; reason: string; span: SourceSpan }>;
  shots: Shot[];
  frame: Frame;
}

export interface Shot extends Located {
  id: Id;
  hoverId?: Id;
  openPopoverId?: Id;
}

export interface Part extends Located {
  id: Id;
  children: Element[];
}

export interface ReferenceImage extends Located {
  id: Id;
  image: string;
  width: number;
  height: number;
  captured?: string;
  state?: string;
  url?: string;
}

export interface WireframeDocument extends Located {
  version: 1;
  type: "wireframe";
  id: Id;
  title: string;
  viewport: { width: number; height: number };
  references: ReferenceImage[];
  parts: Part[];
  screens: Screen[];
}

export interface SourceIdentity {
  owner: { kind: "screen" | "part"; id: Id };
  elementId?: Id;
  span: SourceSpan;
  propertySpans: Record<string, SourceSpan>;
}

export interface InstanceIdentity {
  screenId: Id;
  useId?: Id;
  partId?: Id;
  useSpan?: SourceSpan;
}

export interface RenderNodeIdentity {
  // Derived for this render; never stored in source references.
  renderKey: string;
  source: SourceIdentity;
  instance: InstanceIdentity;
}

export interface Diagnostic {
  code: string;
  severity: "error" | "warning";
  message: string;
  source: SourceSpan;
  elementId?: Id;
  relatedSources?: SourceSpan[];
}

export interface ParseResult {
  document: WireframeDocument | null;
  diagnostics: Diagnostic[];
}

/** Planning shape for the parser entry points. The application uses concrete functions. */
export interface WireframeParser {
  parse(source: string, workspacePath: string): ParseResult;
  format(document: WireframeDocument): string;
}

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface LayoutBox {
  identity: RenderNodeIdentity;
  kind: Element["kind"] | "slot" | "tab" | "item";
  bounds: Rect;
  clip?: Rect;
  scrollWidth: number;
  scrollHeight: number;
  lines?: Array<{ text: string; bounds: Rect; baseline: number; fontSize: number }>;
  children: LayoutBox[];
}

/** Input is resolved and validated by server code before renderer capture. */
export interface DiagramSnapshotRequest {
  workspacePath: string;
  view: Id;
  focus?: Id;
}

/** Produced by the existing diagram renderer, not by a second layout engine. */
export interface DiagramSnapshot {
  type: "flow" | "overview";
  view: Id;
  bounds: Rect;
  smallestTextSize: number;
  svg: string;
  sourceHash: string;
  rendererVersion: string;
}

export interface RenderManifest {
  documentId: Id;
  screenId: Id;
  viewport: { width: number; height: number };
  rendererVersion: string;
  browserBuild: string;
  fonts: Array<{ family: string; available: boolean; assetHash?: string }>;
  dependencies: Array<{ workspacePath: string; hash: string }>;
  overflow: Array<{
    renderKey: string;
    viewport: Rect;
    content: Rect;
    clippedSides: Array<"top" | "right" | "bottom" | "left">;
  }>;
  diagnostics: Diagnostic[];
}

export interface RenderResult {
  svg: string;
  annotatedSvg: string;
  fullContentSvg?: string;
  manifest: RenderManifest;
  layout: LayoutBox[];
}
