import assert from "node:assert/strict";
import test from "node:test";
import { materializeOverview, overviewToDsl, parseOverviewDsl, parseOverviewDslWithDiagnostics } from "./overview-dsl.ts";

test("formats an empty overview canonically", () => {
  const document = parseOverviewDsl("overview draft \"Draft\"\n");
  assert.equal(overviewToDsl(document), "overview draft \"Draft\"\n");
});

test("rejects duplicate group and capability IDs", () => {
  const source = "overview app \"App\"\ngroup one \"One\" {\n capability same \"Same\"\n}\ngroup same \"Duplicate group\" {\n capability same \"Duplicate capability\"\n}\n";
  const result = parseOverviewDslWithDiagnostics(source);
  assert.equal(result.diagnostics.filter(d => d.code === "OVERVIEW201").length, 2);
});

test("keeps diagnostics on the source line after an envelope offset", () => {
  const result = parseOverviewDslWithDiagnostics("overview app \"App\"\ncapability bad\n", 2);
  assert.equal(result.diagnostics[0]?.line, 4);
});

test("parses many-to-many flow references and preserves them in canonical formatting", () => {
  const source = `overview app "App"
group work "Work" {
  capability tailor "Tailor" detail="Draft"
    flow "flows/resume.diagram"
    flow "flows/resume.diagram" variant=focused
}
`;
  const document = parseOverviewDsl(source);
  const capability = document.groups[0].capabilities[0];
  assert.deepEqual(capability.flowRefs, [
    { path: "flows/resume.diagram" },
    { path: "flows/resume.diagram", variant: "focused" },
  ]);
  assert.match(overviewToDsl(document), /flow "flows\/resume\.diagram" variant=focused/);
});

test("materializes a pure base-derived overview and rejects dangling groups", () => {
  const document = parseOverviewDsl(`overview app "App"
group work "Work" {
  capability tailor "Tailor" detail="Draft"
}
variant focused "Focused" {
  set capability tailor title="Focus"
  add group review "Review"
  add capability approve "Approve" group=review
}
`);
  const view = materializeOverview(document, "focused");
  assert.equal(view.groups[0].capabilities[0].title, "Focus");
  assert.equal(document.groups[0].capabilities[0].title, "Tailor");
  assert.equal(view.groups[1].capabilities[0].id, "approve");

  const invalid = parseOverviewDslWithDiagnostics(`overview app "App"
group work "Work" {
  capability tailor "Tailor"
}
variant broken "Broken" {
  remove group work
}
`);
  assert.ok(invalid.diagnostics.some((diagnostic) => diagnostic.code === "OVERVIEW305"));
});

test("adoption can format a selected view without retaining alternatives", () => {
  const document = parseOverviewDsl(`overview app "App"
capability base "Base"
variant chosen "Chosen" {
  set capability base title="Chosen base"
}
`);
  const adopted = materializeOverview(document, "chosen");
  assert.equal(adopted.variants, undefined);
  assert.equal(overviewToDsl(adopted), `overview app "App"\ncapability base "Chosen base"\n`);
});

test("keeps variant syntax diagnostics anchored after the diagram envelope", () => {
  const result = parseOverviewDslWithDiagnostics(`overview app "App"
capability base "Base"
variant broken "Broken" {
  remove capability
}
`, 2);
  const diagnostic = result.diagnostics.find((candidate) => candidate.code === "OVERVIEW120");
  assert.equal(diagnostic?.line, 6);
});

test("preserves typed wireframe references through parse, format, clone, and variants", () => {
  const document = parseOverviewDsl(`overview app "App"
capability c "Capability"
  flow "flows/a.diagram"
  wireframe "wireframes/a.diagram" screen=home
  wireframe "wireframes/a.diagram" screen=details
variant focused "Focused" {
  set capability c wireframe="wireframes/b.diagram" screen=home
  unset capability c wireframes
}
`);
  assert.deepEqual(document.capabilities?.[0]?.wireframeRefs, [
    { path: "wireframes/a.diagram", screen: "home" },
    { path: "wireframes/a.diagram", screen: "details" },
  ]);
  const formatted = overviewToDsl(document);
  assert.equal(overviewToDsl(parseOverviewDsl(formatted)), formatted);
  const view = materializeOverview(document, "focused");
  assert.deepEqual(view.capabilities?.[0]?.flowRefs, [{ path: "flows/a.diagram" }]);
  assert.equal(view.capabilities?.[0]?.wireframeRefs, undefined);
});

test("rejects unsafe wireframe paths and screen IDs", () => {
  assert.throws(() => parseOverviewDsl(`overview app "App"
capability c "Capability"
  wireframe "../outside.diagram" screen="home"
`));
  assert.throws(() => parseOverviewDsl(`overview app "App"
capability c "Capability"
  wireframe "wireframe.diagram" screen="not safe"
`));
  assert.throws(() => parseOverviewDsl(`overview app "App"
capability c "Capability"
  flow "bad\\u0000.diagram"
`));
});

test("keeps base references on child lines and formats identifiers bare", () => {
  const document = parseOverviewDsl(`overview app "App"
group work "Work" {
  capability c "Capability"
    flow "flows/a.diagram" variant=focused
    wireframe "wireframes/a.diagram" screen=home
}
variant focused "Focused" {
  add capability extra "Extra" group=work flow="flows/b.diagram" variant=other wireframe="wireframes/b.diagram" screen=details
}
`);
  const formatted = overviewToDsl(document);
  assert.match(formatted, /variant=focused/);
  assert.match(formatted, /screen=home/);
  assert.doesNotMatch(formatted, /variant="/);
  assert.doesNotMatch(formatted, /screen="/);
  assert.equal(overviewToDsl(parseOverviewDsl(formatted)), formatted);
});

test("preserves the empty group operation while keeping identifier options bare", () => {
  const document = parseOverviewDsl(`overview app "App"
group work "Work" {
  capability c "Capability"
}
variant focused "Focused" {
  set capability c group=""
}
`);
  const view = materializeOverview(document, "focused");
  assert.equal(view.groups[0]?.capabilities.length, 0);
  assert.equal(view.capabilities?.[0]?.groupId, undefined);
  assert.match(overviewToDsl(document), /group=""/);
});

test("preserves an explicitly empty variant description", () => {
  const document = parseOverviewDsl(`overview app "App"
variant focused "Focused" {
  description ""
}
`);
  const formatted = overviewToDsl(document);
  assert.match(formatted, /description ""/);
  assert.equal(overviewToDsl(parseOverviewDsl(formatted)), formatted);
});

test("rejects inline base references, quoted identifiers, duplicates, and unsupported escapes", () => {
  const inline = parseOverviewDslWithDiagnostics(`overview app "App"
capability c "Capability" flow="flows/a.diagram"
`);
  const quotedIdentifier = parseOverviewDslWithDiagnostics(`overview app "App"
capability c "Capability"
  wireframe "wireframes/a.diagram" screen="home"
`);
  const duplicate = parseOverviewDslWithDiagnostics(`overview app "App"
capability c "Capability" detail="one" detail="two"
`);
  const unsupportedEscape = parseOverviewDslWithDiagnostics(`overview app "App\\t"\n`);
  assert.ok(inline.diagnostics.some((diagnostic) => diagnostic.code === "OVERVIEW122"));
  assert.ok(quotedIdentifier.diagnostics.some((diagnostic) => diagnostic.code === "OVERVIEW202"));
  assert.ok(duplicate.diagnostics.some((diagnostic) => diagnostic.code === "OVERVIEW122"));
  assert.ok(unsupportedEscape.diagnostics.some((diagnostic) => diagnostic.code === "OVERVIEW124"));
});
