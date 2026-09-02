import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { parseDiagramWithDiagnostics } from "./diagram-dsl.ts";

test("parses disclosure states and rejects broken references", async () => {
  const source = await readFile("src/data/wireframes/sharing-disclosure.diagram", "utf8");
  const parsed = parseDiagramWithDiagnostics(source);
  assert.equal(parsed.type, "wireframe");
  assert.deepEqual(parsed.diagnostics, []);
  if (parsed.document.type !== "wireframe") assert.fail("Expected a wireframe.");
  assert.deepEqual(parsed.document.document.screens[0].shots.map(shot => shot.id), ["rest", "trigger-hover", "popover-open"]);

  const broken = parseDiagramWithDiagnostics(source.replace("goto=settings", "goto=missing"));
  assert.equal(broken.diagnostics[0]?.code, "WIREFRAME101");
  assert.match(broken.diagnostics[0]?.message || "", /Unknown screen/);

  const withTable = parseDiagramWithDiagnostics(`diagram 1\ntype wireframe\n\nwireframe table-proof "Table proof"\nviewport 800 600\nscreen table "Table" basis=proposed {\n  frame page {\n    body {\n      table allocations {\n        columns actions="Actions" item="Item" category="Category" amount="Amount"\n        row original actions=@original-actions item="Target balance" category="Shopping" amount="$25.00" state=parent\n        row groceries item="Groceries" category="Food" amount="$84.15" state=child\n      }\n      popover original-menu trigger=original-actions {\n        button edit "Edit"\n      }\n    }\n  }\n}`);
  assert.deepEqual(withTable.diagnostics, []);

  const withForm = parseDiagramWithDiagnostics(`diagram 1\ntype wireframe\n\nwireframe form-proof "Form proof"\nviewport 800 600\nscreen form "Form" basis=proposed {\n  frame page {\n    body {\n      form details labels=left {\n        field date "Date" value="8 / 29 / 2026"\n        field amount "Amount" value="-$27.01"\n      }\n    }\n  }\n}`);
  assert.deepEqual(withForm.diagnostics, []);
  if (withForm.document.type !== "wireframe") assert.fail("Expected a wireframe.");
  assert.equal(withForm.document.document.screens[0].frame.kind === "page" && withForm.document.document.screens[0].frame.body[0].kind === "form" ? withForm.document.document.screens[0].frame.body[0].labels : undefined, "left");

  const withPanel = parseDiagramWithDiagnostics(`diagram 1\ntype wireframe\n\nwireframe panel-proof "Panel proof"\nviewport 800 600\nscreen home "Home" {\n  frame page {\n    body {\n      panel details {\n        text "Nested content"\n        panel inner {\n          button action "Action"\n        }\n      }\n    }\n  }\n}`);
  assert.deepEqual(withPanel.diagnostics, []);
  if (withPanel.document.type !== "wireframe") assert.fail("Expected a wireframe.");
  const panel = withPanel.document.document.screens[0].frame.kind === "page" ? withPanel.document.document.screens[0].frame.body[0] : undefined;
  assert.equal(panel?.kind, "panel");
  assert.equal(panel?.kind === "panel" && panel.children[0]?.kind, "text");
  assert.equal(panel?.kind === "panel" && panel.children[1]?.kind, "panel");
});

test("parses wireframe themes and rejects unknown names", () => {
  const source = `diagram 1\ntype wireframe\n\nwireframe recipe "Recipe"\nviewport 800 600\ntheme recipe\nscreen home "Home" {\n  frame page {\n    body {\n      text "Hello"\n    }\n  }\n}`;
  const parsed = parseDiagramWithDiagnostics(source);
  assert.deepEqual(parsed.diagnostics, []);
  if (parsed.document.type !== "wireframe") assert.fail("Expected a wireframe.");
  assert.equal(parsed.document.document.theme, "recipe");

  const unknown = parseDiagramWithDiagnostics(source.replace("theme recipe", "theme unknown"));
  assert.equal(unknown.diagnostics[0]?.code, "WIREFRAME101");

  const duplicate = parseDiagramWithDiagnostics(source.replace("theme recipe", "theme recipe\ntheme default"));
  assert.equal(duplicate.diagnostics[0]?.code, "WIREFRAME101");
});

test("parses semantic controls and rejects unsupported control vocabulary", () => {
  const source = `diagram 1\ntype wireframe\n\nwireframe controls "Controls"\nviewport 800 600\nscreen home "Home" {\n  frame page {\n    body {\n      field search "Search" value="Recipes" icon=search\n      select sort "Sort" value="Newest" state=disabled\n      toggle alerts "Alerts" state=on\n      checkbox saved "Saved" state=checked\n      button add "Add recipe" icon=add tone=destructive state=selected\n      button menu "Menu" icon=chevron-right iconOnly=true\n    }\n  }\n}`;
  const parsed = parseDiagramWithDiagnostics(source);
  assert.deepEqual(parsed.diagnostics, []);
  if (parsed.document.type !== "wireframe") assert.fail("Expected a wireframe.");
  const body = parsed.document.document.screens[0].frame.kind === "page" ? parsed.document.document.screens[0].frame.body : [];
  assert.deepEqual(body.map(element => element.kind), ["field", "select", "toggle", "checkbox", "button", "button"]);
  assert.equal(body[0]?.kind === "field" && body[0].icon, "search");
  assert.equal(body[1]?.kind === "select" && body[1].state, "disabled");
  assert.equal(body[2]?.kind === "toggle" && body[2].state, "on");
  assert.equal(body[3]?.kind === "checkbox" && body[3].state, "checked");
  assert.equal(body[4]?.kind === "button" && body[4].tone, "destructive");
  assert.equal(body[5]?.kind === "button" && body[5].iconOnly, true);

  for (const [option, message] of [["icon=unknown", /Unsupported button icon/], ["state=loading", /Unsupported button state/], ["tone=primary", /Unsupported button tone/], ["iconOnly=true", /requires an icon/]] as const) {
    const invalid = parseDiagramWithDiagnostics(source.replace("icon=add tone=destructive state=selected", option));
    assert.equal(invalid.diagnostics[0]?.code, "WIREFRAME101");
    assert.match(invalid.diagnostics[0]?.message || "", message);
  }
});

test("parses configurable grid minimums and keeps the default", () => {
  const source = `diagram 1\ntype wireframe\n\nwireframe grid-proof "Grid proof"\nviewport 800 600\nscreen home "Home" {\n  frame page {\n    body {\n      grid wide columns=7 min=120 {\n        text "Configured"\n      }\n      grid legacy columns=7 {\n        text "Default"\n      }\n    }\n  }\n}`;
  const parsed = parseDiagramWithDiagnostics(source);
  assert.deepEqual(parsed.diagnostics, []);
  if (parsed.document.type !== "wireframe") assert.fail("Expected a wireframe.");
  const body = parsed.document.document.screens[0].frame.kind === "page" ? parsed.document.document.screens[0].frame.body : [];
  assert.equal(body[0]?.kind === "grid" && body[0].columns, 7);
  assert.equal(body[0]?.kind === "grid" && body[0].min, 120);
  assert.equal(body[1]?.kind === "grid" && body[1].columns, 7);
  assert.equal(body[1]?.kind === "grid" && body[1].min, undefined);
});

test("rejects invalid grid minimums", () => {
  const source = `diagram 1\ntype wireframe\n\nwireframe invalid-grid "Invalid grid"\nviewport 800 600\nscreen home "Home" {\n  frame page {\n    body {\n      grid cards columns=7 min=120 {\n        text "Cards"\n      }\n    }\n  }\n}`;
  for (const min of ["119", "120.5", "-1"]) {
    const parsed = parseDiagramWithDiagnostics(source.replace("min=120", `min=${min}`));
    assert.equal(parsed.diagnostics[0]?.code, "WIREFRAME101");
    assert.match(parsed.diagnostics[0]?.message || "", /grid minimum must be an integer of at least 120/);
  }
  const unknown = parseDiagramWithDiagnostics(source.replace("min=120", "gap=12"));
  assert.equal(unknown.diagnostics[0]?.code, "WIREFRAME101");
  assert.match(unknown.diagnostics[0]?.message || "", /Unknown grid option/);
});

test("rejects non-integer grid columns", () => {
  const source = `diagram 1\ntype wireframe\n\nwireframe invalid-grid "Invalid grid"\nviewport 800 600\nscreen home "Home" {\n  frame page {\n    body {\n      grid cards columns=2.5 {\n        text "Cards"\n      }\n    }\n  }\n}`;
  const parsed = parseDiagramWithDiagnostics(source);
  assert.equal(parsed.diagnostics[0]?.code, "WIREFRAME101");
  assert.match(parsed.diagnostics[0]?.message || "", /grid columns must be an integer of at least 1/);
});

test("parses textarea and list modes with strict item options", () => {
  const source = `diagram 1\ntype wireframe\n\nwireframe fields "Fields"\nviewport 800 600\nscreen home "Home" {\n  frame page {\n    body {\n      form details labels=left {\n        textarea notes "Notes" value="A long read-only note"\n      }\n      list plain {\n        item one "One" detail="First" action=remove\n        item two "Two" goto=home\n      }\n      list ordered mode=ordered {\n        item first "First"\n      }\n      list checks mode=checkable {\n        item done "Done" state=checked\n        item next "Next" state=unchecked\n      }\n    }\n  }\n}`;
  const parsed = parseDiagramWithDiagnostics(source);
  assert.deepEqual(parsed.diagnostics, []);
  if (parsed.document.type !== "wireframe") assert.fail("Expected a wireframe.");
  const body = parsed.document.document.screens[0].frame.kind === "page" ? parsed.document.document.screens[0].frame.body : [];
  const form = body[0];
  assert.equal(form.kind, "form");
  assert.equal(form.kind === "form" && form.children[0]?.kind, "textarea");
  assert.equal(body[1]?.kind, "list");
  assert.equal(body[1]?.kind === "list" && body[1].mode, "plain");
  assert.equal(body[2]?.kind === "list" && body[2].mode, "ordered");
  assert.equal(body[3]?.kind === "list" && body[3].mode, "checkable");
  assert.equal(body[1]?.kind === "list" && body[1].items[0]?.action, "remove");

  const invalidSource = (bodyText: string) => `diagram 1\ntype wireframe\n\nwireframe invalid "Invalid"\nviewport 800 600\nscreen home "Home" {\n  frame page {\n    body {\n      ${bodyText}\n    }\n  }\n}`;
  for (const [bodyText, message] of [
    [`list items mode=unknown { item one "One" }`, /Unsupported list mode/],
    [`list items { item one "One" state=checked }`, /plain lists do not support/],
    [`list items mode=ordered { item one "One" state=unchecked }`, /ordered lists do not support/],
    [`list items mode=checkable { item one "One" }`, /require checked or unchecked/],
    [`list items mode=checkable { item one "One" state=checked action=delete }`, /Unsupported list item action/],
    [`textarea notes "Notes" value="x" extra=true`, /Unknown textarea option/],
    [`list items { item one "One" goto=missing }`, /List "items" links to an unknown screen/],
  ] as const) {
    const invalid = parseDiagramWithDiagnostics(invalidSource(bodyText));
    assert.equal(invalid.diagnostics[0]?.code, "WIREFRAME101");
    assert.match(invalid.diagnostics[0]?.message || "", message);
  }
});
