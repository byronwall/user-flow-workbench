import type {
  ApplicationCardinality,
  ApplicationDocument,
  ApplicationNavigation,
  ApplicationObject,
  ApplicationOwnership,
  ApplicationPage,
  ApplicationPageState,
  ApplicationReference,
} from "../types/application.ts";

const IDENTIFIER = /^[A-Za-z0-9][A-Za-z0-9._-]*$/;
const CARDINALITIES: Record<string, ApplicationCardinality> = {
  one: "one",
  many: "many",
  optional: "optional",
  "one-or-many": "one-or-many",
  "1": "one",
  "*": "many",
  "0..1": "optional",
  "1..*": "one-or-many",
};
const DIAGRAM_PATH = /^.+\.diagram$/;
const DOCUMENT_PATH = /^.+\.(?:md|mdx|txt|pdf|json)$/i;
const IGNORED_SEGMENTS = new Set([".git", ".output", ".vinxi", "build", "dist", "node_modules"]);

export interface ApplicationDslDiagnostic {
  code: string;
  category: "syntax" | "structure" | "identifier" | "reference" | "cardinality";
  message: string;
  line: number;
  column: number;
  length: number;
  actual?: string;
  expected?: string;
  relatedId?: string;
}

export interface ApplicationDslParseResult {
  document: ApplicationDocument;
  diagnostics: ApplicationDslDiagnostic[];
}

interface Token { value: string; start: number; end: number; line: number }
type Fail = (code: string, category: ApplicationDslDiagnostic["category"], token: Token, message: string, detail?: Partial<ApplicationDslDiagnostic>) => never;
type ParsedPage = { id: string; title: string; purpose?: string; route?: string; primaryObjectId?: string; states: ApplicationPageState[]; references: ApplicationReference[] };

export class ApplicationDslError extends Error {
  readonly diagnostic: ApplicationDslDiagnostic;
  readonly line: number;
  readonly column: number;
  readonly code: string;
  constructor(diagnostic: ApplicationDslDiagnostic) {
    super(formatApplicationDslDiagnostic(diagnostic));
    this.name = "ApplicationDslError";
    this.diagnostic = diagnostic;
    this.line = diagnostic.line;
    this.column = diagnostic.column;
    this.code = diagnostic.code;
  }
}

export function formatApplicationDslDiagnostic(diagnostic: ApplicationDslDiagnostic): string {
  return `[${diagnostic.code}] line ${diagnostic.line}, column ${diagnostic.column}: ${diagnostic.message}`;
}

export function parseApplicationDsl(source: string): ApplicationDocument {
  const result = parseApplicationDslWithDiagnostics(source);
  if (result.diagnostics.length) throw new ApplicationDslError(result.diagnostics[0]);
  return result.document;
}

export function parseApplicationDslWithDiagnostics(source: string, lineOffset = 0): ApplicationDslParseResult {
  let application: { id: string; title: string } | undefined;
  let applicationPurpose: string | undefined;
  let activePage: ParsedPage | undefined;
  let pagePurpose: string | undefined;
  const objects: ApplicationObject[] = [];
  const ownership: ApplicationOwnership[] = [];
  const pages: ApplicationPage[] = [];
  const navigation: ApplicationNavigation[] = [];
  const ids = new Set<string>();
  const diagnostics: ApplicationDslDiagnostic[] = [];

  const fail = (code: string, category: ApplicationDslDiagnostic["category"], token: Token, message: string, detail: Partial<ApplicationDslDiagnostic> = {}): never => {
    throw new ApplicationDslError({ code, category, message, line: token.line + lineOffset, column: token.start + 1, length: Math.max(1, token.end - token.start), ...detail });
  };
  const catchError = (error: unknown) => {
    if (error instanceof ApplicationDslError) diagnostics.push(error.diagnostic);
    else throw error;
  };
  const register = (id: string, token: Token, kind: string) => {
    if (ids.has(id)) fail("APPLICATION201", "identifier", token, `Duplicate ${kind} ID "${id}".`, { relatedId: id });
    ids.add(id);
  };

  source.split(/\r?\n/).forEach((rawLine, index) => {
    let tokens: Token[];
    try { tokens = tokenize(rawLine, index + 1); }
    catch (error) { catchError(error); return; }
    if (!tokens.length) return;
    const command = tokens[0].value;
    try {
      if (activePage) {
        if (command === "}") {
          requireCount(tokens, 1, "}", fail);
          activePage = { ...activePage, ...(pagePurpose !== undefined ? { purpose: pagePurpose } : {}) };
          pages.push(activePage);
          activePage = undefined;
          pagePurpose = undefined;
          return;
        }
        if (command === "purpose") {
          requireCount(tokens, 2, 'purpose "<text>"', fail);
          if (pagePurpose !== undefined) fail("APPLICATION106", "structure", tokens[0], "Page purpose appears more than once.");
          pagePurpose = tokens[1].value;
          return;
        }
        if (command === "state") {
          requireRange(tokens, 3, 4, 'state <id> "<title>" [detail="<text>"]', fail);
          const id = identifier(tokens[1], fail);
          register(id, tokens[1], "state");
          ensureOptions(tokens, 3, ["detail"], fail);
          const detail = option(tokens, "detail", fail);
          activePage.states = [...activePage.states, { id, title: tokens[2].value, ...(detail !== undefined ? { detail } : {}) }];
          return;
        }
        if (command === "overview" || command === "flow" || command === "wireframe" || command === "document") {
          activePage.references = [...activePage.references, parseReference(command, tokens, fail)];
          return;
        }
        fail("APPLICATION101", "syntax", tokens[0], `Unknown application page command "${command}".`, { actual: command, expected: "purpose, state, overview, flow, wireframe, document, or }" });
      }

      if (command === "application") {
        requireCount(tokens, 3, 'application <id> "<title>"', fail);
        if (application) fail("APPLICATION106", "structure", tokens[0], "The application declaration appears more than once.");
        const id = identifier(tokens[1], fail);
        register(id, tokens[1], "application");
        application = { id, title: tokens[2].value };
        return;
      }
      if (command === "purpose") {
        requireApplication(application, tokens[0], fail);
        requireCount(tokens, 2, 'purpose "<text>"', fail);
        if (applicationPurpose !== undefined) fail("APPLICATION106", "structure", tokens[0], "Application purpose appears more than once.");
        applicationPurpose = tokens[1].value;
        return;
      }
      if (command === "object") {
        requireApplication(application, tokens[0], fail);
        requireRange(tokens, 3, 4, 'object <id> "<title>" [detail="<text>"]', fail);
        const id = identifier(tokens[1], fail);
        register(id, tokens[1], "object");
        ensureOptions(tokens, 3, ["detail"], fail);
        const detail = option(tokens, "detail", fail);
        objects.push({ id, title: tokens[2].value, ...(detail !== undefined ? { detail } : {}) });
        return;
      }
      if (command === "owns") {
        requireApplication(application, tokens[0], fail);
        requireCount(tokens, 5, "owns <id> <owner-id> <object-id> <cardinality>", fail);
        const id = identifier(tokens[1], fail);
        register(id, tokens[1], "ownership");
        const cardinality = cardinalityValue(tokens[4], fail);
        ownership.push({ id, ownerId: identifier(tokens[2], fail), objectId: identifier(tokens[3], fail), cardinality });
        return;
      }
      if (command === "page") {
        requireApplication(application, tokens[0], fail);
        requireRange(tokens, 4, 6, 'page <id> "<title>" [route="<path>"] [primary=<object-id>] {', fail);
        const openBrace = tokens.findIndex((token) => token.value === "{");
        if (openBrace < 0 || openBrace !== tokens.length - 1) fail("APPLICATION107", "syntax", tokens[tokens.length - 1], 'Page declaration must end with "{".');
        ensureOptions(tokens, 3, ["route", "primary"], fail);
        const id = identifier(tokens[1], fail);
        register(id, tokens[1], "page");
        const route = option(tokens, "route", fail);
        const primaryObjectId = option(tokens, "primary", fail);
        if (primaryObjectId !== undefined) identifierValue(primaryObjectId, tokens.find((token) => optionToken(token, "primary")) || tokens[1], fail);
        activePage = { id, title: tokens[2].value, ...(route !== undefined ? { route } : {}), ...(primaryObjectId !== undefined ? { primaryObjectId } : {}), states: [], references: [] };
        pagePurpose = undefined;
        return;
      }
      if (command === "nav") {
        requireApplication(application, tokens[0], fail);
        requireRange(tokens, 6, 7, "nav <id> <from-page> -> <to-page> trigger=\"<text>\" [condition=\"<text>\"]", fail);
        if (tokens[3].value !== "->") fail("APPLICATION108", "syntax", tokens[3], 'Navigation must use "->" between page IDs.');
        const id = identifier(tokens[1], fail);
        register(id, tokens[1], "navigation");
        ensureOptions(tokens, 5, ["trigger", "condition", "label"], fail);
        const trigger = option(tokens, "trigger", fail) ?? option(tokens, "label", fail);
        if (!trigger) fail("APPLICATION412", "structure", tokens[0], 'Navigation requires trigger="<text>".');
        const condition = option(tokens, "condition", fail);
        navigation.push({ id, fromPageId: identifier(tokens[2], fail), toPageId: identifier(tokens[4], fail), trigger, ...(condition !== undefined ? { condition } : {}) });
        return;
      }
      fail("APPLICATION101", "syntax", tokens[0], `Unknown application command "${command}".`, { actual: command, expected: "application, purpose, object, owns, page, or nav" });
    } catch (error) { catchError(error); }
  });

  if (activePage) diagnostics.push({ code: "APPLICATION109", category: "structure", message: `Page "${activePage.id}" is missing its closing brace.`, line: activePage.id ? lineOffset + 1 : lineOffset + 1, column: 1, length: 1 });
  if (!application) diagnostics.push({ code: "APPLICATION102", category: "structure", message: "Missing application declaration.", line: lineOffset + 1, column: 1, length: 1 });
  const knownPages = new Set(pages.map((page) => page.id));
  for (const relation of ownership) {
    if (relation.ownerId !== application?.id && !objects.some((object) => object.id === relation.ownerId)) diagnostics.push(referenceDiagnostic("APPLICATION401", `Unknown ownership owner ID "${relation.ownerId}".`, relation.id, lineOffset));
    if (!objects.some((object) => object.id === relation.objectId)) diagnostics.push(referenceDiagnostic("APPLICATION401", `Unknown ownership object ID "${relation.objectId}".`, relation.id, lineOffset));
  }
  for (const relation of navigation) {
    if (!knownPages.has(relation.fromPageId)) diagnostics.push(referenceDiagnostic("APPLICATION401", `Unknown navigation source page ID "${relation.fromPageId}".`, relation.id, lineOffset));
    if (!knownPages.has(relation.toPageId)) diagnostics.push(referenceDiagnostic("APPLICATION401", `Unknown navigation target page ID "${relation.toPageId}".`, relation.id, lineOffset));
  }
  for (const page of pages) if (page.primaryObjectId && !objects.some((object) => object.id === page.primaryObjectId)) diagnostics.push(referenceDiagnostic("APPLICATION402", `Unknown page primary object ID "${page.primaryObjectId}".`, page.id, lineOffset));
  const document: ApplicationDocument = { id: application?.id || "untitled-application", title: application?.title || "Untitled application", ...(applicationPurpose !== undefined ? { purpose: applicationPurpose } : {}), objects, ownership, pages, navigation };
  return { document, diagnostics: diagnostics.sort((a, b) => a.line - b.line || a.column - b.column || a.code.localeCompare(b.code)) };
}

export function applicationToDsl(document: ApplicationDocument): string {
  const lines = [`application ${document.id} ${quote(document.title)}`];
  if (document.purpose !== undefined) lines.push(`purpose ${quote(document.purpose)}`);
  for (const object of document.objects) lines.push(`object ${object.id} ${quote(object.title)}${object.detail !== undefined ? ` detail=${quote(object.detail)}` : ""}`);
  for (const relation of document.ownership) lines.push(`owns ${relation.id} ${relation.ownerId} ${relation.objectId} ${relation.cardinality}`);
  for (const page of document.pages) {
    lines.push(`page ${page.id} ${quote(page.title)}${page.route !== undefined ? ` route=${quote(page.route)}` : ""}${page.primaryObjectId !== undefined ? ` primary=${page.primaryObjectId}` : ""} {`);
    if (page.purpose !== undefined) lines.push(`  purpose ${quote(page.purpose)}`);
    for (const state of page.states) lines.push(`  state ${state.id} ${quote(state.title)}${state.detail !== undefined ? ` detail=${quote(state.detail)}` : ""}`);
    for (const reference of page.references) {
      if (reference.kind === "overview") lines.push(`  overview ${quote(reference.path)} capability=${reference.capabilityId}`);
      else if (reference.kind === "flow") lines.push(`  flow ${quote(reference.path)} node=${reference.nodeId}`);
      else if (reference.kind === "wireframe") lines.push(`  wireframe ${quote(reference.path)} screen=${reference.screenId}`);
      else lines.push(`  document ${quote(reference.path)}${reference.heading !== undefined ? ` heading=${quote(reference.heading)}` : ""}`);
    }
    lines.push("}");
  }
  for (const relation of document.navigation) lines.push(`nav ${relation.id} ${relation.fromPageId} -> ${relation.toPageId} trigger=${quote(relation.trigger)}${relation.condition !== undefined ? ` condition=${quote(relation.condition)}` : ""}`);
  return `${lines.join("\n")}\n`;
}

function parseReference(command: string, tokens: Token[], fail: Fail): ApplicationReference {
  const token = tokens[0];
  requireRange(tokens, command === "document" ? 2 : 3, command === "document" ? 3 : 3, `${command} "<path>" ${command === "document" ? "[heading=\"<text>\"]" : `${command === "overview" ? "capability" : command === "flow" ? "node" : "screen"}=<id>`}`, fail);
  const path = tokens[1].value;
  if (!safePath(path) || (command !== "document" && !DIAGRAM_PATH.test(path)) || (command === "document" && !DOCUMENT_PATH.test(path))) fail("APPLICATION410", "reference", tokens[1], `Invalid safe ${command} reference path "${path}".`);
  const optionName = command === "overview" ? "capability" : command === "flow" ? "node" : command === "wireframe" ? "screen" : "heading";
  ensureOptions(tokens, 2, [optionName], fail);
  const value = command === "document" ? option(tokens, optionName, fail) : option(tokens, optionName, fail);
  if (command !== "document" && !value) fail("APPLICATION411", "reference", token, `${command} references require ${optionName}=<id>.`);
  if (value !== undefined && command !== "document") identifierValue(value, token, fail);
  return command === "overview" ? { kind: "overview", path, capabilityId: value! } : command === "flow" ? { kind: "flow", path, nodeId: value! } : command === "wireframe" ? { kind: "wireframe", path, screenId: value! } : { kind: "document", path, ...(value !== undefined ? { heading: value } : {}) };
}

function tokenize(source: string, line: number): Token[] {
  const tokens: Token[] = [];
  for (let index = 0; index < source.length;) {
    while (index < source.length && /\s/.test(source[index])) index += 1;
    if (index >= source.length || source[index] === "#") break;
    const start = index;
    let value = "";
    while (index < source.length && !/\s/.test(source[index])) {
      const char = source[index++];
      if (char !== '"') { value += char; continue; }
      let closed = false;
      while (index < source.length) {
        const quoted = source[index++];
        if (quoted === '"') { closed = true; break; }
        if (quoted === "\\") {
          const escaped = source[index++];
          if (escaped === "n") value += "\n";
          else if (escaped === "r") value += "\r";
          else if (escaped === "t") value += "\t";
          else value += escaped || "\\";
        } else value += quoted;
      }
      if (!closed) throw new ApplicationDslError({ code: "APPLICATION103", category: "syntax", message: "Unterminated quoted string.", line, column: start + 1, length: Math.max(1, source.length - start) });
    }
    tokens.push({ value, start, end: index, line });
  }
  return tokens;
}

function requireCount(tokens: Token[], count: number, expected: string, fail: Fail): void {
  if (tokens.length !== count) fail("APPLICATION104", "syntax", tokens[0], `Expected ${expected}.`);
}
function requireRange(tokens: Token[], minimum: number, maximum: number, expected: string, fail: Fail): void {
  if (tokens.length < minimum || tokens.length > maximum) fail("APPLICATION104", "syntax", tokens[0], `Expected ${expected}.`);
}
function requireApplication(application: { id: string; title: string } | undefined, token: Token, fail: Fail): asserts application is { id: string; title: string } {
  if (!application) fail("APPLICATION106", "structure", token, "The application declaration must precede its records.");
}
function identifier(token: Token, fail: Fail): string { identifierValue(token.value, token, fail); return token.value; }
function identifierValue(value: string, token: Token, fail: Fail): void {
  if (!IDENTIFIER.test(value)) fail("APPLICATION200", "identifier", token, `Invalid identifier "${value}".`);
}
function cardinalityValue(token: Token, fail: Fail): ApplicationCardinality {
  const value = CARDINALITIES[token.value];
  if (!value) fail("APPLICATION300", "cardinality", token, `Malformed cardinality "${token.value}". Use one, many, optional, or one-or-many.`);
  return value;
}
function optionToken(token: Token, name: string): boolean { return token.value.startsWith(`${name}=`); }
function option(tokens: Token[], name: string, fail: Fail): string | undefined {
  const match = tokens.slice(2).find((token) => optionToken(token, name));
  if (!match) return undefined;
  const value = match.value.slice(name.length + 1);
  if (!value) fail("APPLICATION104", "syntax", match, `${name}= requires a value.`);
  return value;
}
function ensureOptions(tokens: Token[], start: number, names: string[], fail: Fail): void {
  for (const token of tokens.slice(start)) {
    if (token.value === "{") continue;
    if (!token.value.includes("=") || !names.some((name) => optionToken(token, name))) fail("APPLICATION104", "syntax", token, `Unknown or malformed option "${token.value}".`);
  }
}
function safePath(path: string): boolean {
  if (!path || path.includes("\0") || path.startsWith("/") || path.includes("\\")) return false;
  const segments = path.split("/");
  return !segments.some((segment) => !segment || segment === "." || segment === ".." || IGNORED_SEGMENTS.has(segment));
}
function referenceDiagnostic(code: string, message: string, relatedId: string, lineOffset: number): ApplicationDslDiagnostic {
  return { code, category: "reference", message, line: lineOffset + 1, column: 1, length: 1, relatedId };
}
function quote(value: string): string { return `"${value.replace(/\\/g, "\\\\").replace(/"/g, '\\"').replace(/\n/g, "\\n").replace(/\r/g, "\\r").replace(/\t/g, "\\t")}"`; }
