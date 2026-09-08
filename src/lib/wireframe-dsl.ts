import { WIREFRAME_ICONS, type WireframeDocument, type WireframeElement, type WireframeFrame, type WireframeIcon, type WireframeScreen, type WireframeShot, type WireframeShotOverride, type WireframeShotState, type WireframeTheme } from "../types/wireframe.ts";

export interface WireframeDslDiagnostic { code: string; category: string; message: string; line: number; column: number; length: number }
interface Token { value: string; line: number; column: number; emptyQuoted?: boolean }

function tokenize(source: string): Token[] {
  const tokens: Token[] = [];
  const lines = source.split(/\r?\n/);
  lines.forEach((line, lineIndex) => {
    let column = 0;
    while (column < line.length) {
      if (/\s/.test(line[column])) { column += 1; continue; }
      if (line[column] === "#") break;
      const start = column;
      const quotedOption = line.slice(column).match(/^([A-Za-z][\w-]*)="/);
      if (quotedOption) {
        const key = quotedOption[1]; column += key.length + 2; let value = "";
        while (column < line.length && line[column] !== '"') {
          if (line[column] === "\\" && column + 1 < line.length) {
            const escaped = line[column + 1];
            if (!["n", '"', "\\"].includes(escaped)) throw new Error(`${lineIndex + 1}:${column + 1}:Unknown string escape "\\${escaped}".`);
            value += escaped === "n" ? "\n" : escaped === '"' || escaped === "\\" ? escaped : `\\${escaped}`;
            column += 2;
          }
          else value += line[column++];
        }
        if (line[column] === '"') column += 1;
        tokens.push({ value: `${key}=${value}`, line: lineIndex + 1, column: start + 1, ...(value === "" ? { emptyQuoted: true } : {}) });
      } else if (line[column] === '"') {
        column += 1;
        let value = "";
        while (column < line.length && line[column] !== '"') {
          if (line[column] === "\\" && column + 1 < line.length) {
            const escaped = line[column + 1];
            if (!["n", '"', "\\"].includes(escaped)) throw new Error(`${lineIndex + 1}:${column + 1}:Unknown string escape "\\${escaped}".`);
            value += escaped === "n" ? "\n" : escaped === '"' || escaped === "\\" ? escaped : `\\${escaped}`;
            column += 2;
          }
          else value += line[column++];
        }
        if (line[column] === '"') column += 1;
        tokens.push({ value, line: lineIndex + 1, column: start + 1 });
      } else if (line[column] === "{" || line[column] === "}") {
        tokens.push({ value: line[column++], line: lineIndex + 1, column: start + 1 });
      } else {
        while (column < line.length && !/\s|[{}]/.test(line[column]) && line[column] !== "#") column += 1;
        tokens.push({ value: line.slice(start, column), line: lineIndex + 1, column: start + 1 });
      }
    }
  });
  return tokens;
}

class Parser {
  private index = 0;
  readonly diagnostics: WireframeDslDiagnostic[] = [];
  private readonly tokens: Token[];
  private readonly sourceText: string;
  constructor(tokens: Token[], sourceText: string) { this.tokens = tokens; this.sourceText = sourceText; }
  private peek(): Token | undefined;
  private peek(value: string): boolean;
  private peek(value?: string): Token | undefined | boolean { const token = this.tokens[this.index]; return value === undefined ? token : token?.value === value; }
  private take(value?: string): Token {
    const token = this.tokens[this.index];
    if (!token || (value && token.value !== value)) throw this.fail(token, `Expected ${value || "a value"}.`);
    this.index += 1; return token;
  }
  private fail(token: Token | undefined, message: string) {
    const at = token || this.tokens[this.tokens.length - 1] || { line: 1, column: 1, value: "" };
    return new Error(`${at.line}:${at.column}:${message}`);
  }
  private option(name: string): string | undefined {
    const token = this.peek();
    if (!token?.value.startsWith(`${name}=`)) return undefined;
    this.index += 1;
    const inline = token.value.slice(name.length + 1);
    return inline || this.take().value;
  }
  private options(): Record<string, string> {
    const result: Record<string, string> = {};
    while (this.peek() && !this.peek("{") && !this.peek("}")) {
      const token = this.peek()!;
      const split = token.value.indexOf("=");
      if (split < 1) break;
      this.index += 1;
      const key = token.value.slice(0, split);
      const inline = token.value.slice(split + 1);
      result[key] = inline || (token.emptyQuoted ? "" : this.take().value);
    }
    return result;
  }
  private controlOptions(options: Record<string, string>, allowed: string[], kind: string) {
    const unknown = Object.keys(options).find(key => !allowed.includes(key));
    if (unknown) throw this.fail(this.tokens[this.index - 1], `Unknown ${kind} option "${unknown}".`);
    return options;
  }
  private icon(value: string | undefined, kind: string): WireframeIcon | undefined {
    if (value === undefined) return undefined;
    if (!WIREFRAME_ICONS.includes(value as WireframeIcon)) throw this.fail(this.tokens[this.index - 1], `Unsupported ${kind} icon "${value}".`);
    return value as WireframeIcon;
  }
  private state(value: string | undefined, allowed: string[], kind: string, required = false) {
    if (value === undefined) {
      if (required) throw this.fail(this.tokens[this.index - 1], `${kind} state is required.`);
      return undefined;
    }
    if (!allowed.includes(value)) throw this.fail(this.tokens[this.index - 1], `Unsupported ${kind} state "${value}".`);
    return value;
  }
  private number(value: string | undefined, fallback: number, name: string) {
    const parsed = Number(value ?? fallback);
    if (!Number.isFinite(parsed) || parsed <= 0) throw this.fail(this.peek(), `${name} must be a positive number.`);
    return parsed;
  }
  private integerAtLeast(value: string, minimum: number, name: string) {
    const parsed = Number(value);
    if (!/^\d+$/.test(value) || !Number.isInteger(parsed) || parsed < minimum) throw this.fail(this.peek(), `${name} must be an integer of at least ${minimum}.`);
    return parsed;
  }
  parse(): WireframeDocument {
    this.take("wireframe"); const id = this.take().value; const title = this.take().value;
    this.take("viewport"); const width = this.number(this.take().value, 1280, "viewport width"); const height = this.number(this.take().value, 720, "viewport height");
    let theme: WireframeTheme = "default";
    if (this.peek("theme")) {
      this.take("theme");
      const value = this.take().value;
      if (value !== "default" && value !== "recipe") throw this.fail(this.tokens[this.index - 1], `Unknown wireframe theme "${value}".`);
      theme = value;
    }
    const document: WireframeDocument = { id, title, viewport: { width, height }, theme, references: [], parts: [], screens: [], sourceText: this.sourceText };
    while (this.peek()) {
      if (this.peek("reference")) {
        this.take(); const referenceId = this.take().value; const options = this.options();
        document.references.push({ id: referenceId, image: options.image || "", width: this.number(options.width, 1, "reference width"), height: this.number(options.height, 1, "reference height"), ...(options.captured ? { captured: options.captured } : {}), ...(options.state ? { state: options.state } : {}), ...(options.url ? { url: options.url } : {}) });
      } else if (this.peek("part")) {
        this.take(); const partId = this.take().value; this.take("{"); const children = this.elements(); this.take("}"); document.parts.push({ id: partId, children });
      } else if (this.peek("screen")) document.screens.push(this.screen());
      else throw this.fail(this.peek(), `Unknown wireframe command "${this.peek()!.value}".`);
    }
    this.validate(document);
    return document;
  }
  private screen(): WireframeScreen {
    this.take("screen"); const id = this.take().value; const title = this.take().value; const options = this.options(); this.take("{");
    const screen: Partial<WireframeScreen> = { id, title, basis: (options.basis as WireframeScreen["basis"]) || "proposed", ...(options.reference ? { referenceId: options.reference } : {}), shots: [], marks: [] };
    while (!this.peek("}")) {
      if (this.peek("shot")) screen.shots!.push(this.shot());
      else if (this.peek("mark")) { this.take(); screen.marks!.push({ target: this.take().value, reason: this.take().value }); }
      else if (this.peek("frame")) screen.frame = this.frame();
      else throw this.fail(this.peek(), `Unknown screen command "${this.peek()!.value}".`);
    }
    this.take("}");
    if (!screen.frame) throw this.fail(this.peek(), `Screen "${id}" needs a frame.`);
    return screen as WireframeScreen;
  }
  private shot(): WireframeShot {
    this.take("shot"); const id = this.take().value; const options = this.options();
    this.controlOptions(options, ["hover", "open"], "shot");
    const shot: WireframeShot = { id, ...(options.hover ? { hoverId: options.hover } : {}), ...(options.open ? { openPopoverId: options.open } : {}) };
    if (!this.peek("{")) return shot;
    this.take("{"); const overrides: WireframeShotOverride[] = [];
    const targets = new Set<string>();
    while (!this.peek("}")) {
      this.take("set"); const target = this.take().value; const values = this.options();
      if (targets.has(target)) throw this.fail(this.tokens[this.index - 1], `Duplicate shot target "${target}".`);
      targets.add(target);
      const keys = Object.keys(values);
      if (keys.length !== 1 || !keys.every(key => key === "value" || key === "state")) throw this.fail(this.tokens[this.index - 1], `Shot set for "${target}" must provide exactly one of value or state.`);
      if (keys[0] === "value") overrides.push({ target, value: values.value });
      else overrides.push({ target, state: values.state as WireframeShotState });
    }
    this.take("}");
    return { ...shot, ...(overrides.length ? { overrides } : {}) };
  }
  private frame(): WireframeFrame {
    this.take("frame"); const kind = this.take().value; const options = this.options(); this.take("{");
    if (kind !== "page" && kind !== "workbench") throw this.fail(this.tokens[this.index - 1], `Unknown frame "${kind}".`);
    const slots: Record<string, WireframeElement[]> = {};
    const allowed = kind === "page" ? ["body"] : ["header", "top", "main", "aside", "footer"];
    while (!this.peek("}")) {
      const slotToken = this.take(); const slot = slotToken.value;
      if (!allowed.includes(slot)) throw this.fail(slotToken, `Unknown ${kind} frame slot "${slot}".`);
      if (slot in slots) throw this.fail(slotToken, `Duplicate ${kind} frame slot "${slot}".`);
      this.take("{"); slots[slot] = this.elements(); this.take("}");
    }
    this.take("}");
    if (kind === "page") return { kind, content: this.number(options.content, 720, "page content"), body: slots.body || [] };
    if (!("main" in slots)) throw this.fail(this.peek(), 'Workbench frame needs a "main" slot.');
    if (!("aside" in slots)) throw this.fail(this.peek(), 'Workbench frame needs an "aside" slot.');
    return { kind, inspector: this.number(options.inspector, 346, "inspector"), header: slots.header || [], top: slots.top || [], main: slots.main, aside: slots.aside, ...(slots.footer?.length ? { footer: slots.footer } : {}) };
  }
  private elements(): WireframeElement[] {
    const elements: WireframeElement[] = [];
    while (this.peek() && !this.peek("}")) elements.push(this.element());
    return elements;
  }
  private element(): WireframeElement {
    const kind = this.take().value;
    if (kind === "stack" || kind === "grid" || kind === "form") {
      const maybeId = this.peek()?.value !== "{" && !this.peek()?.value.includes("=") ? this.take().value : undefined; const options = this.options(); this.take("{"); const children = this.elements(); this.take("}");
      if (kind === "form") {
        const labels = options.labels || "top";
        if (labels !== "left" && labels !== "top") throw this.fail(this.peek(), 'Form labels must be "left" or "top".');
        return { kind, ...(maybeId ? { id: maybeId } : {}), labels, children };
      }
      if (kind === "grid") {
        this.controlOptions(options, ["columns", "min"], "grid");
        const columns = this.integerAtLeast(options.columns || "2", 1, "grid columns");
        const min = options.min === undefined ? undefined : this.integerAtLeast(options.min, 120, "grid minimum");
        return { kind, ...(maybeId ? { id: maybeId } : {}), columns, ...(min === undefined ? {} : { min }), children };
      }
      return { kind, ...(maybeId ? { id: maybeId } : {}), children };
    }
    if (kind === "panel") { const id = this.take().value; this.take("{"); const children = this.elements(); this.take("}"); return { kind, id, children }; }
    if (kind === "bar") {
      const id = this.peek()?.value !== "{" ? this.take().value : undefined; this.take("{"); let start: WireframeElement[] = [], end: WireframeElement[] = [];
      while (!this.peek("}")) { const slot = this.take().value; this.take("{"); const children = this.elements(); this.take("}"); if (slot === "start") start = children; else if (slot === "end") end = children; }
      this.take("}"); return { kind, ...(id ? { id } : {}), start, end };
    }
    if (kind === "text") { const text = this.take().value; const options = this.options(); return { kind, text, role: (options.role as "title" | "heading" | "body" | "caption") || "body" }; }
    if (kind === "badge") return { kind, text: this.take().value };
    if (kind === "button") {
      const id = this.take().value; const label = this.take().value;
      const options = this.controlOptions(this.options(), ["goto", "icon", "iconOnly", "variant", "tone", "state"], "button");
      const icon = this.icon(options.icon, "button");
      const state = this.state(options.state, ["selected", "disabled"], "button");
      const variant = options.variant;
      if (variant !== undefined && variant !== "primary" && variant !== "secondary" && variant !== "quiet") throw this.fail(this.tokens[this.index - 1], `Unsupported button variant "${variant}". Use primary, secondary, or quiet.`);
      if (options.tone !== undefined && options.tone !== "destructive") throw this.fail(this.tokens[this.index - 1], `Unsupported button tone "${options.tone}".`);
      if (options.iconOnly !== undefined && options.iconOnly !== "true") throw this.fail(this.tokens[this.index - 1], 'button iconOnly must be "true".');
      if (options.iconOnly === "true" && !icon) throw this.fail(this.tokens[this.index - 1], "button iconOnly requires an icon.");
      return { kind, id, label, ...(options.goto ? { goto: options.goto } : {}), ...(icon ? { icon } : {}), ...(options.iconOnly === "true" ? { iconOnly: true } : {}), ...(variant ? { variant: variant as "primary" | "secondary" | "quiet" } : {}), ...(options.tone ? { tone: "destructive" as const } : {}), ...(state ? { state: state as "selected" | "disabled" } : {}) };
    }
    if (kind === "link") { const id = this.take().value; const label = this.take().value; const options = this.options(); return { kind, id, label, ...(options.goto ? { goto: options.goto } : {}), ...(options.state === "disabled" ? { disabled: true } : {}) }; }
    if (kind === "field") { const id = this.take().value; const label = this.take().value; const options = this.controlOptions(this.options(), ["value", "icon"], "field"); const icon = this.icon(options.icon, "field"); return { kind, id, label, ...(options.value !== undefined ? { value: options.value } : {}), ...(icon ? { icon } : {}) }; }
    if (kind === "select") {
      const id = this.take().value; const label = this.take().value; const options = this.controlOptions(this.options(), ["value", "state"], "select");
      if (options.value === undefined) throw this.fail(this.tokens[this.index - 1], "Select value is required.");
      const state = this.state(options.state, ["disabled"], "select");
      return { kind, id, label, value: options.value, ...(state ? { state: "disabled" as const } : {}) };
    }
    if (kind === "toggle") {
      const id = this.take().value; const label = this.take().value; const options = this.controlOptions(this.options(), ["state"], "toggle");
      const state = this.state(options.state, ["on", "off", "disabled"], "toggle", true)!;
      return { kind, id, label, state: state as "on" | "off" | "disabled" };
    }
    if (kind === "checkbox") {
      const id = this.take().value; const label = this.take().value; const options = this.controlOptions(this.options(), ["state"], "checkbox");
      const state = this.state(options.state, ["checked", "unchecked", "disabled"], "checkbox", true)!;
      return { kind, id, label, state: state as "checked" | "unchecked" | "disabled" };
    }
    if (kind === "textarea") {
      const id = this.take().value; const label = this.take().value;
      const options = this.controlOptions(this.options(), ["value"], "textarea");
      if (options.value === undefined) throw this.fail(this.tokens[this.index - 1], "Textarea value is required.");
      return { kind, id, label, value: options.value };
    }
    if (kind === "card") { const id = this.take().value; const title = this.take().value; const options = this.options(); return { kind, id, title, ...(options.detail ? { detail: options.detail } : {}), ...(options.state === "selected" ? { selected: true } : {}), ...(options.goto ? { goto: options.goto } : {}) }; }
    if (kind === "notice") { const id = this.take().value; const title = this.take().value; const options = this.options(); return { kind, id, title, ...(options.detail ? { detail: options.detail } : {}), noticeKind: (options.kind as "info" | "warning" | "error") || "info" }; }
    if (kind === "popover") { const id = this.take().value; const options = this.options(); this.take("{"); const children = this.elements(); this.take("}"); return { kind, id, triggerId: options.trigger || "", children }; }
    if (kind === "rule") return { kind };
    if (kind === "tabs") {
      const id = this.take().value; this.take("{"); const entries: Array<{ id: string; label: string; detail?: string; active?: boolean; goto?: string }> = [];
      while (!this.peek("}")) { this.take("tab"); const entryId = this.take().value; const label = this.take().value; const options = this.options(); entries.push({ id: entryId, label, ...(options.detail ? { detail: options.detail } : {}), ...(options.state === "active" ? { active: true } : {}), ...(options.goto ? { goto: options.goto } : {}) }); }
      this.take("}"); return { kind, id, tabs: entries };
    }
    if (kind === "list") {
      const id = this.take().value;
      const listOptions = this.controlOptions(this.options(), ["mode"], "list");
      const mode = listOptions.mode || "plain";
      if (mode !== "plain" && mode !== "ordered" && mode !== "checkable") throw this.fail(this.tokens[this.index - 1], `Unsupported list mode "${mode}".`);
      this.take("{");
      const items: Extract<WireframeElement, { kind: "list" }>['items'] = [];
      while (!this.peek("}")) {
        this.take("item"); const entryId = this.take().value; const label = this.take().value;
        const options = this.controlOptions(this.options(), ["detail", "goto", "state", "action"], "list item");
        const state = options.state;
        if (options.action !== undefined && options.action !== "remove") throw this.fail(this.tokens[this.index - 1], `Unsupported list item action "${options.action}".`);
        if (state === "selected") {
          if (mode !== "plain") throw this.fail(this.tokens[this.index - 1], `List mode "${mode}" does not support selected state.`);
        } else if (state !== undefined && state !== "checked" && state !== "unchecked") {
          throw this.fail(this.tokens[this.index - 1], `Unsupported list item state "${state}".`);
        } else if (state !== undefined && mode !== "checkable") {
          throw this.fail(this.tokens[this.index - 1], `${mode} lists do not support checked or unchecked item state.`);
        }
        if (mode === "checkable" && state === undefined) throw this.fail(this.tokens[this.index - 1], "Checkable list items require checked or unchecked state.");
        items.push({ id: entryId, label, ...(options.detail !== undefined ? { detail: options.detail } : {}), ...(options.goto ? { goto: options.goto } : {}), ...(state ? { state: state as "checked" | "unchecked" | "selected" } : {}), ...(options.action ? { action: "remove" as const } : {}) });
      }
      this.take("}"); return { kind, id, mode, items };
    }
    if (kind === "table") {
      const id = this.take().value; this.take("{"); this.take("columns");
      const columnOptions = this.options();
      const columns = Object.entries(columnOptions).map(([columnId, label]) => ({ id: columnId, label }));
      if (!columns.length) throw this.fail(this.peek(), `Table "${id}" needs columns.`);
      const rows: Extract<WireframeElement, { kind: "table" }>["rows"] = [];
      while (!this.peek("}")) {
        this.take("row"); const rowId = this.take().value; const values = this.options();
        const state = values.state as "parent" | "child" | "selected" | "error" | undefined;
        const goto = values.goto; delete values.state; delete values.goto;
        const cells = Object.fromEntries(Object.entries(values).map(([columnId, value]) => [columnId, value.startsWith("@") ? { actionId: value.slice(1) } : value]));
        rows.push({ id: rowId, cells, ...(state ? { state } : {}), ...(goto ? { goto } : {}) });
      }
      this.take("}"); return { kind, id, columns, rows };
    }
    if (kind === "use") return { kind, id: this.take().value, partId: this.take().value };
    if (kind === "diagram") { const id = this.take().value; const options = this.options(); return { kind, id, source: options.source || "", view: options.view || "base", ...(options.focus ? { focus: options.focus } : {}) }; }
    throw this.fail(this.peek(), `Unknown element "${kind}".`);
  }
  private validate(document: WireframeDocument) {
    const screenIds = new Set(document.screens.map(screen => screen.id));
    const partIds = new Set(document.parts.map(part => part.id));
    type ShotTarget = { count: number; value: boolean; states: Set<string> };
    const visit = (elements: WireframeElement[], ids: Map<string, number>, targets: Map<string, ShotTarget>, screen: WireframeScreen, partStack = new Set<string>()) => {
      const addId = (id: string) => ids.set(id, (ids.get(id) || 0) + 1);
      const addTarget = (id: string, states: string[] = [], value = false) => {
        addId(id);
        const target = targets.get(id) || { count: 0, value: false, states: new Set<string>() };
        target.count += 1; target.value ||= value; states.forEach(state => target.states.add(state)); targets.set(id, target);
      };
      for (const element of elements) {
        if ("id" in element && element.id) {
          const states = element.kind === "button" ? ["selected", "disabled"] : element.kind === "link" ? ["disabled"] : element.kind === "select" ? ["disabled"] : element.kind === "toggle" ? ["on", "off", "disabled"] : element.kind === "checkbox" ? ["checked", "unchecked", "disabled"] : element.kind === "card" ? ["selected"] : [];
          addTarget(element.id, states, element.kind === "field" || element.kind === "select" || element.kind === "textarea");
        }
        if ((element.kind === "button" || element.kind === "link" || element.kind === "card") && element.goto && !screenIds.has(element.goto)) throw this.fail(undefined, `Unknown screen "${element.goto}".`);
        if (element.kind === "list") {
          for (const item of element.items) {
            addTarget(item.id, element.mode === "checkable" ? ["checked", "unchecked"] : element.mode === "plain" ? ["selected"] : []);
            if (item.goto && !screenIds.has(item.goto)) throw this.fail(undefined, `List "${element.id}" links to an unknown screen.`);
          }
        }
        if (element.kind === "tabs") for (const tab of element.tabs) addTarget(tab.id, ["active"]);
        if (element.kind === "table") {
          if (element.rows.some(row => row.goto && !screenIds.has(row.goto))) throw this.fail(undefined, `Table "${element.id}" links to an unknown screen.`);
          for (const row of element.rows) { addTarget(row.id, ["parent", "child", "selected", "error"]); for (const cell of Object.values(row.cells)) if (typeof cell !== "string") addTarget(cell.actionId); }
        }
        if (element.kind === "use" && !partIds.has(element.partId)) throw this.fail(undefined, `Unknown part "${element.partId}".`);
        if (element.kind === "popover") visit(element.children, ids, targets, screen, partStack);
        if (element.kind === "stack" || element.kind === "grid" || element.kind === "form" || element.kind === "panel") visit(element.children, ids, targets, screen, partStack);
        if (element.kind === "bar") { visit(element.start, ids, targets, screen, partStack); visit(element.end, ids, targets, screen, partStack); }
        if (element.kind === "use" && !partStack.has(element.partId)) {
          const part = document.parts.find(candidate => candidate.id === element.partId);
          if (part) visit(part.children, ids, targets, screen, new Set(partStack).add(element.partId));
        }
      }
    };
    for (const screen of document.screens) {
      const ids = new Map<string, number>(); const targets = new Map<string, ShotTarget>(); const frame = screen.frame;
      const slotNames = frame.kind === "page" ? ["body"] : ["header", "top", "main", "aside", ...(frame.footer ? ["footer"] : [])];
      slotNames.forEach(slot => { ids.set(slot, (ids.get(slot) || 0) + 1); targets.set(slot, { count: 1, value: false, states: new Set() }); });
      const slots = frame.kind === "page" ? [frame.body] : [frame.header, frame.top, frame.main, frame.aside, ...(frame.footer ? [frame.footer] : [])]; slots.forEach(slot => visit(slot, ids, targets, screen));
      for (const shot of screen.shots) {
        if (shot.hoverId && !ids.has(shot.hoverId)) throw this.fail(undefined, `Shot "${shot.id}" has unknown hover target "${shot.hoverId}".`);
        if (shot.openPopoverId && !ids.has(shot.openPopoverId)) throw this.fail(undefined, `Shot "${shot.id}" has unknown popover "${shot.openPopoverId}".`);
        for (const override of shot.overrides || []) {
          const target = targets.get(override.target);
          if (!target) throw this.fail(undefined, `Shot "${shot.id}" has unknown override target "${override.target}".`);
          if (target.count > 1) throw this.fail(undefined, `Shot "${shot.id}" has ambiguous override target "${override.target}".`);
          if ("value" in override && !target.value) throw this.fail(undefined, `Shot target "${override.target}" does not support value overrides.`);
          if ("state" in override && !target.states.size) throw this.fail(undefined, `Shot target "${override.target}" does not support state overrides.`);
          if ("state" in override && !target.states.has(override.state)) throw this.fail(undefined, `Unsupported shot state "${override.state}" for target "${override.target}".`);
        }
      }
      for (const mark of screen.marks) {
        const count = ids.get(mark.target) || 0;
        if (!count) throw this.fail(undefined, `Unknown mark target "${mark.target}".`);
        if (count > 1) throw this.fail(undefined, `Ambiguous mark target "${mark.target}".`);
      }
    }
  }
}

export function parseWireframeDslWithDiagnostics(source: string, lineOffset = 0): { document: WireframeDocument; diagnostics: WireframeDslDiagnostic[] } {
  try {
    const parser = new Parser(tokenize(source), source);
    return { document: parser.parse(), diagnostics: parser.diagnostics };
  } catch (error) {
    const match = String(error instanceof Error ? error.message : error).match(/^(\d+):(\d+):(.*)$/);
    const line = Number(match?.[1] || 1) + lineOffset;
    return { document: { id: "invalid-wireframe", title: "Invalid wireframe", viewport: { width: 1280, height: 720 }, theme: "default", references: [], parts: [], screens: [], sourceText: source }, diagnostics: [{ code: "WIREFRAME101", category: "syntax", message: match?.[3] || String(error), line, column: Number(match?.[2] || 1), length: 1 }] };
  }
}

export function wireframeToDsl(document: WireframeDocument): string {
  return document.sourceText || `wireframe ${document.id} "${document.title}"\nviewport ${document.viewport.width} ${document.viewport.height}`;
}
