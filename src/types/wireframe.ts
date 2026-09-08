export type WireframeElement =
  | { kind: "stack"; id?: string; children: WireframeElement[] }
  | { kind: "grid"; id?: string; columns?: number; min?: number; children: WireframeElement[] }
  | { kind: "panel"; id: string; children: WireframeElement[] }
  | { kind: "form"; id?: string; labels: "left" | "top"; children: WireframeElement[] }
  | { kind: "bar"; id?: string; start: WireframeElement[]; end: WireframeElement[] }
  | { kind: "text"; text: string; role: "title" | "heading" | "body" | "caption" }
  | { kind: "badge"; text: string }
  | { kind: "button"; id: string; label: string; goto?: string; icon?: WireframeIcon; iconOnly?: boolean; variant?: "primary" | "secondary" | "quiet"; tone?: "destructive"; state?: "selected" | "disabled" }
  | { kind: "link"; id: string; label: string; goto?: string; disabled?: boolean }
  | { kind: "field"; id: string; label: string; value?: string; icon?: WireframeIcon }
  | { kind: "select"; id: string; label: string; value: string; state?: "disabled" }
  | { kind: "toggle"; id: string; label: string; state: "on" | "off" | "disabled" }
  | { kind: "checkbox"; id: string; label: string; state: "checked" | "unchecked" | "disabled" }
  | { kind: "textarea"; id: string; label: string; value: string }
  | { kind: "card"; id: string; title: string; detail?: string; selected?: boolean; goto?: string }
  | { kind: "notice"; id: string; title: string; detail?: string; noticeKind: "info" | "warning" | "error" }
  | { kind: "popover"; id: string; triggerId: string; children: WireframeElement[] }
  | { kind: "rule" }
  | { kind: "tabs"; id: string; tabs: Array<{ id: string; label: string; active?: boolean; goto?: string }> }
  | { kind: "list"; id: string; mode: "plain" | "ordered" | "checkable"; items: Array<{ id: string; label: string; detail?: string; goto?: string; state?: "checked" | "unchecked" | "selected"; action?: "remove" }> }
  | { kind: "table"; id: string; columns: Array<{ id: string; label: string }>; rows: Array<{ id: string; cells: Record<string, string | { actionId: string }>; state?: "parent" | "child" | "selected" | "error"; goto?: string }> }
  | { kind: "use"; id: string; partId: string }
  | { kind: "diagram"; id: string; source: string; view: string; focus?: string };

export type WireframeTheme = "default" | "recipe";

export const WIREFRAME_ICONS = ["add", "calendar-add", "cart", "chef-hat", "chevron-left", "chevron-right", "copy", "download", "edit", "mic", "search", "sparkles", "trash", "upload"] as const;
export type WireframeIcon = (typeof WIREFRAME_ICONS)[number];

export type WireframeFrame =
  | { kind: "page"; content: number; body: WireframeElement[] }
  | { kind: "workbench"; inspector: number; header: WireframeElement[]; top: WireframeElement[]; main: WireframeElement[]; aside: WireframeElement[]; footer?: WireframeElement[] };

export type WireframeShotState = "selected" | "disabled" | "on" | "off" | "checked" | "unchecked" | "active" | "parent" | "child" | "error";
export type WireframeShotOverride =
  | { target: string; value: string }
  | { target: string; state: WireframeShotState };
export interface WireframeShot { id: string; hoverId?: string; openPopoverId?: string; overrides?: WireframeShotOverride[] }
export interface WireframeScreen {
  id: string;
  title: string;
  basis: "observed" | "source" | "proposed";
  referenceId?: string;
  shots: WireframeShot[];
  marks: Array<{ target: string; reason: string }>;
  frame: WireframeFrame;
}

export interface WireframeDocument {
  id: string;
  title: string;
  viewport: { width: number; height: number };
  theme: WireframeTheme;
  references: Array<{ id: string; image: string; width: number; height: number; captured?: string; state?: string; url?: string }>;
  parts: Array<{ id: string; children: WireframeElement[] }>;
  screens: WireframeScreen[];
  sourceText?: string;
}
