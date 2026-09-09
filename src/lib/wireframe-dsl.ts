import { decodeDslQuoted, DSL_IDENTIFIER, encodeDslQuoted } from "./dsl-lexical.ts";
import { WIREFRAME_ICONS, type WireframeDocument, type WireframeElement, type WireframeFrame, type WireframeIcon, type WireframeScreen, type WireframeShot, type WireframeShotOverride, type WireframeShotState, type WireframeTheme } from "../types/wireframe.ts";

export interface WireframeDslDiagnostic { code: string; category: string; message: string; line: number; column: number; length: number }
interface Token { value: string; line: number; column: number; emptyQuoted?: boolean; quoted?: boolean; optionKey?: string; optionQuoted?: boolean }
type Options = Record<string, string> & { quoted: Record<string, boolean>; tokens: Record<string, Token> };

function tokenize(source: string): Token[] {
  const tokens: Token[] = [];
  const lines = source.split(/\r?\n/);
  lines.forEach((line, lineIndex) => {
    let column = 0;
    while (column < line.length) {
      if (/\s/.test(line[column])) { column += 1; continue; }
      if (line[column] === "#") break;
      const start = column;
      const quotedOption = line.slice(column).match(/^([A-Za-z0-9][A-Za-z0-9._-]*)="/);
      if (quotedOption) {
        const key = quotedOption[1]; column += key.length + 2; const valueStart = column - 1;
        while (column < line.length && line[column] !== '"') column += line[column] === "\\" ? 2 : 1;
        if (line[column] !== '"') throw new Error(`${lineIndex + 1}:${start + 1}:Unterminated quoted string.`);
        const decoded = decodeDslQuoted(line.slice(valueStart, column + 1));
        if ("error" in decoded) throw new Error(`${lineIndex + 1}:${valueStart + decoded.offset + 1}:${decoded.error}`);
        const value = decoded.value;
        column += 1;
        tokens.push({ value: `${key}=${value}`, line: lineIndex + 1, column: start + 1, optionKey: key, optionQuoted: true, ...(value === "" ? { emptyQuoted: true } : {}) });
      } else if (line[column] === '"') {
        const valueStart = column; column += 1;
        while (column < line.length && line[column] !== '"') column += line[column] === "\\" ? 2 : 1;
        if (line[column] !== '"') throw new Error(`${lineIndex + 1}:${start + 1}:Unterminated quoted string.`);
        const decoded = decodeDslQuoted(line.slice(valueStart, column + 1));
        if ("error" in decoded) throw new Error(`${lineIndex + 1}:${valueStart + decoded.offset + 1}:${decoded.error}`);
        const value = decoded.value;
        column += 1;
        tokens.push({ value, line: lineIndex + 1, column: start + 1, quoted: true });
      } else if (line[column] === "{" || line[column] === "}") {
        tokens.push({ value: line[column++], line: lineIndex + 1, column: start + 1 });
      } else {
        while (column < line.length && !/\s|[{}]/.test(line[column]) && line[column] !== "#") column += 1;
        const value = line.slice(start, column);
        const option = value.match(/^([A-Za-z0-9][A-Za-z0-9._-]*)=(.*)$/);
        tokens.push({ value, line: lineIndex + 1, column: start + 1, ...(option ? { optionKey: option[1], optionQuoted: false } : {}) });
      }
    }
  });
  return tokens;
}

class Parser {
  private index = 0;
  readonly diagnostics: WireframeDslDiagnostic[] = [];
  private readonly tokens: Token[];
  constructor(tokens: Token[]) { this.tokens = tokens; }
  private peek(): Token | undefined;
  private peek(value: string): boolean;
  private peek(value?: string): Token | undefined | boolean { const token = this.tokens[this.index]; return value === undefined ? token : token?.value === value; }
  private take(value?: string): Token {
    const token = this.tokens[this.index];
    if (!token || (value && token.value !== value)) throw this.fail(token, `Expected ${value || "a value"}.`);
    this.index += 1; return token;
  }
  private identifier(kind: string): string {
    const token = this.take();
    if (token.quoted || !DSL_IDENTIFIER.test(token.value)) throw this.fail(token, `${kind} must be a bare identifier.`);
    return token.value;
  }
  private bare(kind: string): string {
    const token = this.take();
    if (token.quoted) throw this.fail(token, `${kind} must be bare.`);
    return token.value;
  }
  private text(kind: string): string {
    const token = this.take();
    if (!token.quoted) throw this.fail(token, `${kind} must be a quoted string.`);
    return token.value;
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
  private options(): Options {
    const result = {} as Options;
    Object.defineProperties(result, { quoted: { value: {}, enumerable: false }, tokens: { value: {}, enumerable: false } });
    while (this.peek() && !this.peek("{") && !this.peek("}")) {
      const token = this.peek()!;
      const split = token.value.indexOf("=");
      if (split < 1 || !token.optionKey) break;
      this.index += 1;
      const key = token.value.slice(0, split);
      const inline = token.value.slice(split + 1);
      if (result[key] !== undefined) throw this.fail(token, `Duplicate option "${key}".`);
      result[key] = inline || (token.emptyQuoted ? "" : this.take().value);
      result.quoted[key] = token.optionQuoted === true;
      result.tokens[key] = token;
    }
    return result;
  }
  private controlOptions(options: Options, allowed: string[], kind: string, quoted: string[] = [], bare: string[] = []) {
    const unknown = Object.keys(options).find(key => !allowed.includes(key));
    if (unknown) throw this.fail(options.tokens[unknown], `Unknown ${kind} option "${unknown}".`);
    for (const key of quoted) if (options[key] !== undefined && !options.quoted[key]) throw this.fail(options.tokens[key], `${kind} option "${key}" must be quoted.`);
    for (const key of bare) if (options[key] !== undefined && options.quoted[key]) throw this.fail(options.tokens[key], `${kind} option "${key}" must be bare.`);
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
    this.take("wireframe"); const id = this.identifier("Wireframe ID"); const title = this.text("Wireframe title");
    this.take("viewport"); const width = this.number(this.take().value, 1280, "viewport width"); const height = this.number(this.take().value, 720, "viewport height");
    let theme: WireframeTheme = "default";
    let themeSeen = false;
    if (this.peek("theme")) {
      themeSeen = true;
      this.take("theme");
      const value = this.bare("Wireframe theme");
      if (value !== "default" && value !== "recipe") throw this.fail(this.tokens[this.index - 1], `Unknown wireframe theme "${value}".`);
      theme = value;
    }
    const document: WireframeDocument = { id, title, viewport: { width, height }, theme, references: [], parts: [], screens: [] };
    while (this.peek()) {
      if (this.peek("reference")) {
        this.take(); const referenceId = this.identifier("Reference ID"); const options = this.controlOptions(this.options(), ["image", "width", "height", "captured", "state", "url"], "reference", ["image", "captured", "state", "url"], ["width", "height"]);
        document.references.push({ id: referenceId, image: options.image || "", width: this.number(options.width, 1, "reference width"), height: this.number(options.height, 1, "reference height"), ...(options.captured !== undefined ? { captured: options.captured } : {}), ...(options.state !== undefined ? { state: options.state } : {}), ...(options.url !== undefined ? { url: options.url } : {}) });
      } else if (this.peek("part")) {
        this.take(); const partId = this.identifier("Part ID"); this.take("{"); const children = this.elements(); this.take("}"); document.parts.push({ id: partId, children });
      } else if (this.peek("screen")) document.screens.push(this.screen());
      else if (this.peek("theme")) { if (themeSeen) throw this.fail(this.peek(), "Duplicate theme command."); this.take(); const value = this.bare("Wireframe theme"); if (value !== "default" && value !== "recipe") throw this.fail(this.tokens[this.index - 1], `Unknown wireframe theme "${value}".`); theme = value; themeSeen = true; }
      else throw this.fail(this.peek(), `Unknown wireframe command "${this.peek()!.value}".`);
    }
    this.validate(document);
    return document;
  }
  private screen(): WireframeScreen {
    this.take("screen"); const id = this.identifier("Screen ID"); const title = this.text("Screen title"); const options = this.controlOptions(this.options(), ["basis", "reference"], "screen", [], ["basis", "reference"]);
    if (options.basis === undefined) throw this.fail(this.peek(), `Screen "${id}" needs basis=observed, basis=source, or basis=proposed.`);
    if (options.basis !== "observed" && options.basis !== "source" && options.basis !== "proposed") throw this.fail(this.tokens[this.index - 1], `Unknown screen basis "${options.basis}".`);
    const screen: Partial<WireframeScreen> = { id, title, basis: options.basis, ...(options.reference !== undefined ? { referenceId: options.reference } : {}), shots: [], marks: [] };
    this.take("{");
    while (!this.peek("}")) {
      if (this.peek("shot")) screen.shots!.push(this.shot());
      else if (this.peek("mark")) { this.take(); screen.marks!.push({ target: this.identifier("Mark target"), reason: this.text("Mark reason") }); }
      else if (this.peek("frame")) screen.frame = this.frame();
      else throw this.fail(this.peek(), `Unknown screen command "${this.peek()!.value}".`);
    }
    this.take("}");
    if (!screen.frame) throw this.fail(this.peek(), `Screen "${id}" needs a frame.`);
    return screen as WireframeScreen;
  }
  private shot(): WireframeShot {
    this.take("shot"); const id = this.identifier("Shot ID"); const options = this.options();
    this.controlOptions(options, ["hover", "open"], "shot", [], ["hover", "open"]);
    const shot: WireframeShot = { id, ...(options.hover !== undefined ? { hoverId: options.hover } : {}), ...(options.open !== undefined ? { openPopoverId: options.open } : {}) };
    if (!this.peek("{")) return shot;
    this.take("{"); const overrides: WireframeShotOverride[] = [];
    const targets = new Set<string>();
    while (!this.peek("}")) {
      this.take("set"); const target = this.identifier("Shot target"); const values = this.options();
      if (targets.has(target)) throw this.fail(this.tokens[this.index - 1], `Duplicate shot target "${target}".`);
      targets.add(target);
      const keys = Object.keys(values);
      if (keys.length !== 1 || !keys.every(key => key === "value" || key === "state")) throw this.fail(this.tokens[this.index - 1], `Shot set for "${target}" must provide exactly one of value or state.`);
      if (keys[0] === "value" && !values.quoted.value) throw this.fail(values.tokens.value, 'Shot value must be quoted.');
      if (keys[0] === "state" && values.quoted.state) throw this.fail(values.tokens.state, 'Shot state must be bare.');
      if (keys[0] === "value") overrides.push({ target, value: values.value });
      else overrides.push({ target, state: values.state as WireframeShotState });
    }
    this.take("}");
    return { ...shot, ...(overrides.length ? { overrides } : {}) };
  }
  private frame(): WireframeFrame {
    this.take("frame"); const kind = this.bare("Frame kind"); const options = this.controlOptions(this.options(), kind === "page" ? ["content"] : ["inspector"], `${kind} frame`, [], ["content", "inspector"]); this.take("{");
    if (kind !== "page" && kind !== "workbench") throw this.fail(this.tokens[this.index - 1], `Unknown frame "${kind}".`);
    const slots: Record<string, WireframeElement[]> = {};
    const allowed = kind === "page" ? ["body"] : ["header", "top", "main", "aside", "footer"];
    while (!this.peek("}")) {
      const slotToken = this.take(); const slot = slotToken.value;
      if (slotToken.quoted) throw this.fail(slotToken, `${kind} frame slot must be bare.`);
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
    const kind = this.bare("Element kind");
    if (kind === "stack" || kind === "grid" || kind === "form") {
      const maybeId = this.peek()?.value !== "{" && !this.peek()?.value.includes("=") ? this.identifier(`${kind} ID`) : undefined;
      const options = this.controlOptions(this.options(), kind === "grid" ? ["columns", "min"] : kind === "form" ? ["labels"] : [], kind, [], ["columns", "min", "labels"]);
      this.take("{"); const children = this.elements(); this.take("}");
      if (kind === "form") {
        const labels = options.labels ?? "top";
        if (labels !== "left" && labels !== "top") throw this.fail(this.peek(), 'Form labels must be "left" or "top".');
        return { kind, ...(maybeId ? { id: maybeId } : {}), labels, children };
      }
      if (kind === "grid") {
        const columns = this.integerAtLeast(options.columns ?? "2", 1, "grid columns");
        const min = options.min === undefined ? undefined : this.integerAtLeast(options.min, 120, "grid minimum");
        return { kind, ...(maybeId ? { id: maybeId } : {}), columns, ...(min === undefined ? {} : { min }), children };
      }
      return { kind, ...(maybeId ? { id: maybeId } : {}), children };
    }
    if (kind === "panel") { const id = this.identifier("Panel ID"); this.take("{"); const children = this.elements(); this.take("}"); return { kind, id, children }; }
    if (kind === "bar") {
      const id = this.peek()?.value !== "{" ? this.identifier("Bar ID") : undefined; this.take("{"); let start: WireframeElement[] = [], end: WireframeElement[] = []; const seenSlots = new Set<string>();
      while (!this.peek("}")) { const slotToken = this.take(); const slot = slotToken.value; if (slotToken.quoted) throw this.fail(slotToken, "Bar slot must be bare."); if (slot !== "start" && slot !== "end") throw this.fail(slotToken, `Unknown bar slot "${slot}".`); if (seenSlots.has(slot)) throw this.fail(slotToken, `Duplicate bar slot "${slot}".`); seenSlots.add(slot); this.take("{"); const children = this.elements(); this.take("}"); if (slot === "start") start = children; else end = children; }
      this.take("}"); return { kind, ...(id ? { id } : {}), start, end };
    }
    if (kind === "text") { const text = this.text("Text"); const options = this.controlOptions(this.options(), ["role"], "text", [], ["role"]); const role = options.role ?? "body"; if (!["title", "heading", "body", "caption"].includes(role)) throw this.fail(this.tokens[this.index - 1], `Unsupported text role "${role}".`); return { kind, text, role: role as "title" | "heading" | "body" | "caption" }; }
    if (kind === "badge") return { kind, text: this.text("Badge text") };
    if (kind === "button") {
      const id = this.identifier("Button ID"); const label = this.text("Button label");
      const options = this.controlOptions(this.options(), ["goto", "icon", "iconOnly", "variant", "tone", "state"], "button", [], ["goto", "icon", "iconOnly", "variant", "tone", "state"]);
      const icon = this.icon(options.icon, "button");
      const state = this.state(options.state, ["selected", "disabled"], "button");
      const variant = options.variant;
      if (variant !== undefined && variant !== "primary" && variant !== "secondary" && variant !== "quiet") throw this.fail(this.tokens[this.index - 1], `Unsupported button variant "${variant}". Use primary, secondary, or quiet.`);
      if (options.tone !== undefined && options.tone !== "destructive") throw this.fail(this.tokens[this.index - 1], `Unsupported button tone "${options.tone}".`);
      if (options.iconOnly !== undefined && options.iconOnly !== "true") throw this.fail(this.tokens[this.index - 1], 'button iconOnly must be "true".');
      if (options.iconOnly === "true" && !icon) throw this.fail(this.tokens[this.index - 1], "button iconOnly requires an icon.");
      return { kind, id, label, ...(options.goto !== undefined ? { goto: options.goto } : {}), ...(icon ? { icon } : {}), ...(options.iconOnly === "true" ? { iconOnly: true } : {}), ...(variant ? { variant: variant as "primary" | "secondary" | "quiet" } : {}), ...(options.tone ? { tone: "destructive" as const } : {}), ...(state ? { state: state as "selected" | "disabled" } : {}) };
    }
    if (kind === "link") { const id = this.identifier("Link ID"); const label = this.text("Link label"); const options = this.controlOptions(this.options(), ["goto", "state"], "link", [], ["goto", "state"]); if (options.state !== undefined && options.state !== "disabled") throw this.fail(this.tokens[this.index - 1], `Unsupported link state "${options.state}".`); return { kind, id, label, ...(options.goto !== undefined ? { goto: options.goto } : {}), ...(options.state === "disabled" ? { disabled: true } : {}) }; }
    if (kind === "field") { const id = this.identifier("Field ID"); const label = this.text("Field label"); const options = this.controlOptions(this.options(), ["value", "icon"], "field", ["value"], ["icon"]); const icon = this.icon(options.icon, "field"); return { kind, id, label, ...(options.value !== undefined ? { value: options.value } : {}), ...(icon ? { icon } : {}) }; }
    if (kind === "select") {
      const id = this.identifier("Select ID"); const label = this.text("Select label"); const options = this.controlOptions(this.options(), ["value", "state"], "select", ["value"], ["state"]);
      if (options.value === undefined) throw this.fail(this.tokens[this.index - 1], "Select value is required.");
      const state = this.state(options.state, ["disabled"], "select");
      return { kind, id, label, value: options.value, ...(state ? { state: "disabled" as const } : {}) };
    }
    if (kind === "toggle") {
      const id = this.identifier("Toggle ID"); const label = this.text("Toggle label"); const options = this.controlOptions(this.options(), ["state"], "toggle", [], ["state"]);
      const state = this.state(options.state, ["on", "off", "disabled"], "toggle", true)!;
      return { kind, id, label, state: state as "on" | "off" | "disabled" };
    }
    if (kind === "checkbox") {
      const id = this.identifier("Checkbox ID"); const label = this.text("Checkbox label"); const options = this.controlOptions(this.options(), ["state"], "checkbox", [], ["state"]);
      const state = this.state(options.state, ["checked", "unchecked", "disabled"], "checkbox", true)!;
      return { kind, id, label, state: state as "checked" | "unchecked" | "disabled" };
    }
    if (kind === "textarea") {
      const id = this.identifier("Textarea ID"); const label = this.text("Textarea label");
      const options = this.controlOptions(this.options(), ["value"], "textarea", ["value"]);
      if (options.value === undefined) throw this.fail(this.tokens[this.index - 1], "Textarea value is required.");
      return { kind, id, label, value: options.value };
    }
    if (kind === "card") { const id = this.identifier("Card ID"); const title = this.text("Card title"); const options = this.controlOptions(this.options(), ["detail", "state", "goto"], "card", ["detail"], ["state", "goto"]); if (options.state !== undefined && options.state !== "selected") throw this.fail(this.tokens[this.index - 1], `Unsupported card state "${options.state}".`); return { kind, id, title, ...(options.detail !== undefined ? { detail: options.detail } : {}), ...(options.state === "selected" ? { selected: true } : {}), ...(options.goto !== undefined ? { goto: options.goto } : {}) }; }
    if (kind === "notice") { const id = this.identifier("Notice ID"); const title = this.text("Notice title"); const options = this.controlOptions(this.options(), ["detail", "kind"], "notice", ["detail"], ["kind"]); const noticeKind = options.kind ?? "info"; if (!["info", "warning", "error"].includes(noticeKind)) throw this.fail(this.tokens[this.index - 1], `Unsupported notice kind "${noticeKind}".`); return { kind, id, title, ...(options.detail !== undefined ? { detail: options.detail } : {}), noticeKind: noticeKind as "info" | "warning" | "error" }; }
    if (kind === "popover") { const id = this.identifier("Popover ID"); const options = this.controlOptions(this.options(), ["trigger"], "popover", [], ["trigger"]); if (options.trigger === undefined) throw this.fail(this.tokens[this.index - 1], "Popover trigger is required."); this.take("{"); const children = this.elements(); this.take("}"); return { kind, id, triggerId: options.trigger, children }; }
    if (kind === "rule") return { kind };
    if (kind === "tabs") {
      const id = this.identifier("Tabs ID"); this.take("{"); const entries: Array<{ id: string; label: string; active?: boolean; goto?: string }> = [];
      while (!this.peek("}")) { this.take("tab"); const entryId = this.identifier("Tab ID"); const label = this.text("Tab label"); const options = this.controlOptions(this.options(), ["state", "goto"], "tab", [], ["state", "goto"]); if (options.state !== undefined && options.state !== "active") throw this.fail(this.tokens[this.index - 1], `Unsupported tab state "${options.state}".`); entries.push({ id: entryId, label, ...(options.state === "active" ? { active: true } : {}), ...(options.goto ? { goto: options.goto } : {}) }); }
      this.take("}"); return { kind, id, tabs: entries };
    }
    if (kind === "list") {
      const id = this.identifier("List ID");
      const listOptions = this.controlOptions(this.options(), ["mode"], "list", [], ["mode"]);
      const mode = listOptions.mode ?? "plain";
      if (mode !== "plain" && mode !== "ordered" && mode !== "checkable") throw this.fail(this.tokens[this.index - 1], `Unsupported list mode "${mode}".`);
      this.take("{");
      const items: Extract<WireframeElement, { kind: "list" }>['items'] = [];
      while (!this.peek("}")) {
        this.take("item"); const entryId = this.identifier("List item ID"); const label = this.text("List item label");
        const options = this.controlOptions(this.options(), ["detail", "goto", "state", "action"], "list item", ["detail"], ["goto", "state", "action"]);
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
        items.push({ id: entryId, label, ...(options.detail !== undefined ? { detail: options.detail } : {}), ...(options.goto !== undefined ? { goto: options.goto } : {}), ...(state ? { state: state as "checked" | "unchecked" | "selected" } : {}), ...(options.action ? { action: "remove" as const } : {}) });
      }
      this.take("}"); return { kind, id, mode, items };
    }
    if (kind === "table") {
      const id = this.identifier("Table ID"); this.take("{"); this.take("columns");
      const columnOptions = this.options();
      const columns = Object.keys(columnOptions).map(columnId => { const label = columnOptions[columnId]!; if (!DSL_IDENTIFIER.test(columnId)) throw this.fail(this.tokens[this.index - 1], `Table column ID "${columnId}" must be a bare identifier.`); if (!columnOptions.quoted[columnId]) throw this.fail(columnOptions.tokens[columnId], `Table column "${columnId}" label must be quoted.`); return { id: columnId, label }; });
      if (!columns.length) throw this.fail(this.peek(), `Table "${id}" needs columns.`);
      const rows: Extract<WireframeElement, { kind: "table" }>["rows"] = [];
      while (!this.peek("}")) {
        this.take("row"); const rowId = this.identifier("Table row ID"); const values = this.options();
        const state = values.state as "parent" | "child" | "selected" | "error" | undefined;
        const goto = values.goto; delete values.state; delete values.goto;
        if (state !== undefined && values.quoted.state) throw this.fail(values.tokens.state, 'Table row option "state" must be bare.');
        if (goto !== undefined && values.quoted.goto) throw this.fail(values.tokens.goto, 'Table row option "goto" must be bare.');
        if (state !== undefined && !["parent", "child", "selected", "error"].includes(state)) throw this.fail(this.tokens[this.index - 1], `Unsupported table row state "${state}".`);
        if (Object.keys(values).some(columnId => !DSL_IDENTIFIER.test(columnId))) throw this.fail(this.tokens[this.index - 1], "Table cell keys must be bare identifiers.");
        for (const columnId of Object.keys(values)) {
          const value = values[columnId]!;
          const actionCell = !values.quoted[columnId] && value.startsWith("@");
          if (!actionCell && !values.quoted[columnId]) throw this.fail(values.tokens[columnId], `Table cell "${columnId}" has invalid quoting.`);
        }
        const cells = Object.fromEntries(Object.keys(values).map(columnId => { const value = values[columnId]!; return [columnId, !values.quoted[columnId] && value.startsWith("@") ? { actionId: value.slice(1) } : value]; }));
        rows.push({ id: rowId, cells, ...(state ? { state } : {}), ...(goto !== undefined ? { goto } : {}) });
      }
      this.take("}"); return { kind, id, columns, rows };
    }
    if (kind === "use") return { kind, id: this.identifier("Use ID"), partId: this.identifier("Part ID") };
    if (kind === "diagram") { const id = this.identifier("Diagram ID"); const options = this.controlOptions(this.options(), ["source", "view", "focus"], "diagram", ["source"], ["view", "focus"]); return { kind, id, source: options.source ?? "", view: options.view ?? "base", ...(options.focus !== undefined ? { focus: options.focus } : {}) }; }
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
    const parser = new Parser(tokenize(source));
    return { document: parser.parse(), diagnostics: parser.diagnostics };
  } catch (error) {
    const match = String(error instanceof Error ? error.message : error).match(/^(\d+):(\d+):(.*)$/);
    const line = Number(match?.[1] || 1) + lineOffset;
    return { document: { id: "invalid-wireframe", title: "Invalid wireframe", viewport: { width: 1280, height: 720 }, theme: "default", references: [], parts: [], screens: [] }, diagnostics: [{ code: "WIREFRAME101", category: "syntax", message: match?.[3] || String(error), line, column: Number(match?.[2] || 1), length: 1 }] };
  }
}

export function wireframeToDsl(document: WireframeDocument): string {
  const lines = [`wireframe ${document.id} ${quote(document.title)}`, `viewport ${document.viewport.width} ${document.viewport.height}`];
  if (document.theme !== "default") lines.push(`theme ${document.theme}`);
  for (const reference of document.references) {
    lines.push(`reference ${reference.id}${option("image", reference.image, true)}${option("width", reference.width)}${option("height", reference.height)}${option("captured", reference.captured, true)}${option("state", reference.state, true)}${option("url", reference.url, true)}`.trimEnd());
  }
  for (const part of document.parts) {
    lines.push(`part ${part.id} {`, ...formatElements(part.children, 1), "}");
  }
  for (const screen of document.screens) {
    lines.push(`screen ${screen.id} ${quote(screen.title)} basis=${screen.basis}${screen.referenceId !== undefined ? ` reference=${screen.referenceId}` : ""} {`);
    for (const shot of screen.shots) lines.push(...formatShot(shot, 1));
    for (const mark of screen.marks) lines.push(`${indent(1)}mark ${mark.target} ${quote(mark.reason)}`);
    lines.push(...formatFrame(screen.frame, 1), "}");
  }
  return `${lines.join("\n")}\n`;
}

function indent(level: number): string { return "  ".repeat(level); }
function quote(value: string): string { return encodeDslQuoted(value); }
function option(name: string, value: string | number | boolean | undefined, quoted = false): string { return value === undefined ? "" : ` ${name}=${quoted ? quote(String(value)) : String(value)}`; }
function formatOptions(options: Array<[string, string | number | boolean | undefined, boolean?]>): string { return options.map(([name, value, quoted]) => option(name, value, quoted)).join(""); }

function formatShot(shot: WireframeShot, level: number): string[] {
  const header = `${indent(level)}shot ${shot.id}${formatOptions([["hover", shot.hoverId], ["open", shot.openPopoverId]])}`;
  if (!shot.overrides?.length) return [header];
  return [header + " {", ...shot.overrides.map(override => `${indent(level + 1)}set ${override.target}${"value" in override ? option("value", override.value, true) : option("state", override.state)}`), `${indent(level)}}`];
}

function formatFrame(frame: WireframeFrame, level: number): string[] {
  const options = frame.kind === "page" ? formatOptions([["content", frame.content === 720 ? undefined : frame.content]]) : formatOptions([["inspector", frame.inspector === 346 ? undefined : frame.inspector]]);
  const lines = [`${indent(level)}frame ${frame.kind}${options} {`];
  const slots = frame.kind === "page" ? [["body", frame.body]] as const : [["header", frame.header], ["top", frame.top], ["main", frame.main], ["aside", frame.aside], ...(frame.footer !== undefined ? [["footer", frame.footer] as const] : [])] as const;
  for (const [name, elements] of slots) {
    if ((name === "header" || name === "top" || name === "footer") && !elements.length) continue;
    lines.push(`${indent(level + 1)}${name} {`, ...formatElements(elements, level + 2), `${indent(level + 1)}}`);
  }
  return [...lines, `${indent(level)}}`];
}

function formatElements(elements: WireframeElement[], level: number): string[] {
  return elements.flatMap(element => formatElement(element, level));
}

function formatElement(element: WireframeElement, level: number): string[] {
  const p = indent(level);
  switch (element.kind) {
    case "stack": case "grid": case "form": {
      const options = element.kind === "grid" ? formatOptions([["columns", element.columns === 2 ? undefined : element.columns], ["min", element.min]]) : element.kind === "form" ? formatOptions([["labels", element.labels === "top" ? undefined : element.labels]]) : "";
      const head = `${p}${element.kind}${element.id ? ` ${element.id}` : ""}${options} {`;
      return [head, ...formatElements(element.children, level + 1), `${p}}`];
    }
    case "panel": case "popover": {
      const options = element.kind === "popover" ? ` trigger=${element.triggerId}` : "";
      return [`${p}${element.kind} ${element.id}${options} {`, ...formatElements(element.children, level + 1), `${p}}`];
    }
    case "bar": return [`${p}bar${element.id ? ` ${element.id}` : ""} {`, ...(element.start.length ? [`${indent(level + 1)}start {`, ...formatElements(element.start, level + 2), `${indent(level + 1)}}`] : []), ...(element.end.length ? [`${indent(level + 1)}end {`, ...formatElements(element.end, level + 2), `${indent(level + 1)}}`] : []), `${p}}`];
    case "text": return [`${p}text ${quote(element.text)}${formatOptions([["role", element.role === "body" ? undefined : element.role]])}`];
    case "badge": return [`${p}badge ${quote(element.text)}`];
    case "button": return [`${p}button ${element.id} ${quote(element.label)}${formatOptions([["goto", element.goto], ["icon", element.icon], ["iconOnly", element.iconOnly ? "true" : undefined], ["variant", element.variant], ["tone", element.tone], ["state", element.state]])}`];
    case "link": return [`${p}link ${element.id} ${quote(element.label)}${formatOptions([["goto", element.goto], ["state", element.disabled ? "disabled" : undefined]])}`];
    case "field": return [`${p}field ${element.id} ${quote(element.label)}${formatOptions([["value", element.value, true], ["icon", element.icon]])}`];
    case "select": return [`${p}select ${element.id} ${quote(element.label)}${option("value", element.value, true)}${option("state", element.state)}`];
    case "toggle": return [`${p}toggle ${element.id} ${quote(element.label)} state=${element.state}`];
    case "checkbox": return [`${p}checkbox ${element.id} ${quote(element.label)} state=${element.state}`];
    case "textarea": return [`${p}textarea ${element.id} ${quote(element.label)}${option("value", element.value, true)}`];
    case "card": return [`${p}card ${element.id} ${quote(element.title)}${formatOptions([["detail", element.detail, true], ["state", element.selected ? "selected" : undefined], ["goto", element.goto]])}`];
    case "notice": return [`${p}notice ${element.id} ${quote(element.title)}${formatOptions([["detail", element.detail, true], ["kind", element.noticeKind === "info" ? undefined : element.noticeKind]])}`];
    case "rule": return [`${p}rule`];
    case "tabs": return [`${p}tabs ${element.id} {`, ...element.tabs.map(tab => `${indent(level + 1)}tab ${tab.id} ${quote(tab.label)}${formatOptions([["state", tab.active ? "active" : undefined], ["goto", tab.goto]])}`), `${p}}`];
    case "list": return [`${p}list ${element.id}${option("mode", element.mode === "plain" ? undefined : element.mode)} {`, ...element.items.map(item => `${indent(level + 1)}item ${item.id} ${quote(item.label)}${formatOptions([["detail", item.detail, true], ["goto", item.goto], ["state", item.state], ["action", item.action]])}`), `${p}}`];
    case "table": return [`${p}table ${element.id} {`, `${indent(level + 1)}columns${element.columns.map(column => option(column.id, column.label, true)).join("")}`, ...element.rows.map(row => `${indent(level + 1)}row ${row.id}${Object.entries(row.cells).map(([columnId, cell]) => option(columnId, typeof cell === "string" ? cell : `@${cell.actionId}`, typeof cell === "string")).join("")}${formatOptions([["state", row.state], ["goto", row.goto]])}`), `${p}}`];
    case "use": return [`${p}use ${element.id} ${element.partId}`];
    case "diagram": return [`${p}diagram ${element.id}${option("source", element.source, true)}${option("view", element.view)}${option("focus", element.focus)}`];
  }
}
