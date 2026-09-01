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
    flow "flows/resume.diagram" variant="focused"
}
`;
  const document = parseOverviewDsl(source);
  const capability = document.groups[0].capabilities[0];
  assert.deepEqual(capability.flowRefs, [
    { path: "flows/resume.diagram" },
    { path: "flows/resume.diagram", variant: "focused" },
  ]);
  assert.match(overviewToDsl(document), /flow "flows\/resume\.diagram" variant="focused"/);
});

test("materializes a pure base-derived overview and rejects dangling groups", () => {
  const document = parseOverviewDsl(`overview app "App"
group work "Work" {
  capability tailor "Tailor" detail="Draft"
}
variant focused "Focused" {
  set capability tailor title="Focus"
  add group review "Review"
  add capability approve "Approve" group="review"
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
