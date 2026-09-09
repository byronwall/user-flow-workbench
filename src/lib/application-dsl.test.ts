import assert from "node:assert/strict";
import test from "node:test";
import { applicationToDsl, parseApplicationDsl, parseApplicationDslWithDiagnostics } from "./application-dsl.ts";

const SOURCE = `application studio "Evidence Studio"
purpose "Turn evidence into a defensible resume."
object project "Project" detail="A workspace"
object evidence "Evidence"
owns project-evidence project evidence one-or-many
page projects "Projects" route="/projects" primary=project {
  purpose "Choose a project."
  state empty "Empty" detail="No projects yet."
  overview "scope.diagram" capability=projects
  flow "alignment.diagram" node=start
  wireframe "studio.diagram" screen=projects
  document "docs/plan.json" heading="Project scope"
}
page review "Review" {
  state ready "Ready"
}
nav projects-review projects -> review trigger="Open review" condition="Project is selected"
`;

test("parses and canonically formats application records", () => {
  const document = parseApplicationDsl(SOURCE);
  assert.equal(document.id, "studio");
  assert.equal(document.purpose, "Turn evidence into a defensible resume.");
  assert.equal(document.objects[0]?.detail, "A workspace");
  assert.equal(document.ownership[0]?.cardinality, "one-or-many");
  assert.equal(document.pages[0]?.primaryObjectId, "project");
  assert.equal(document.navigation[0]?.trigger, "Open review");
  assert.equal(document.navigation[0]?.condition, "Project is selected");
  assert.equal(document.pages[0]?.references.length, 4);
  const formatted = applicationToDsl(document);
  assert.equal(applicationToDsl(parseApplicationDsl(formatted)), formatted);
});

test("reports duplicate IDs and unknown local references", () => {
  const result = parseApplicationDslWithDiagnostics(`application app "App"
object item "Item"
object item "Duplicate"
owns ownership missing item one
page home "Home" {
}
nav go home -> missing trigger="Open"
`);
  assert.ok(result.diagnostics.some((diagnostic) => diagnostic.code === "APPLICATION201"));
  assert.ok(result.diagnostics.filter((diagnostic) => diagnostic.code === "APPLICATION401").length >= 2);
});

test("reports malformed cardinality, commands, and unsafe paths", () => {
  const result = parseApplicationDslWithDiagnostics(`application app "App"
object item "Item"
owns owns app item never
page home "Home" primary=missing {
  unknown thing
  flow "../outside.diagram" node=start
}
`);
  assert.ok(result.diagnostics.some((diagnostic) => diagnostic.code === "APPLICATION300"));
  assert.ok(result.diagnostics.some((diagnostic) => diagnostic.code === "APPLICATION101"));
  assert.ok(result.diagnostics.some((diagnostic) => diagnostic.code === "APPLICATION410"));
  assert.ok(result.diagnostics.some((diagnostic) => diagnostic.code === "APPLICATION402"));
});

test("accepts only named cardinalities and trigger options", () => {
  const result = parseApplicationDslWithDiagnostics(`application app "App"
object item "Item"
owns owns app item 1
page home "Home" {
}
nav go home -> home label="Open"
`);
  assert.equal(result.diagnostics.filter((diagnostic) => diagnostic.code === "APPLICATION300").length, 1);
  assert.equal(result.diagnostics.filter((diagnostic) => diagnostic.code === "APPLICATION104").length, 1);
});

test("rejects duplicate options, quoted identifiers, and unsupported escapes", () => {
  const quotedIdentifier = parseApplicationDslWithDiagnostics(`application app "App"
page home "Home" primary="item" {
}
`);
  const duplicate = parseApplicationDslWithDiagnostics(`application app "App"
page home "Home" route="/home" route="/again" {
}
`);
  const unsupportedEscape = parseApplicationDslWithDiagnostics(`application app "App\\t"\n`);
  assert.ok(quotedIdentifier.diagnostics.some((diagnostic) => diagnostic.code === "APPLICATION200"));
  assert.ok(duplicate.diagnostics.some((diagnostic) => diagnostic.code === "APPLICATION104"));
  assert.ok(unsupportedEscape.diagnostics.some((diagnostic) => diagnostic.code === "APPLICATION103"));
});

test("offsets unterminated quoted-string diagnostics through the envelope", () => {
  const result = parseApplicationDslWithDiagnostics(`application app "App"
object item "Unterminated
`, 2);
  assert.equal(result.diagnostics.find((diagnostic) => diagnostic.code === "APPLICATION103")?.line, 4);
});
