import assert from "node:assert/strict";
import test from "node:test";
import { composeApplicationFlowUrl, composeApplicationOverviewUrl, composeApplicationSelectionUrl, composeApplicationUrl, composeApplicationWireframeUrl, composeFlowUrl, composeOverviewCapabilityUrl, composeOverviewUrl, composeWireframeUrl, parseApplicationOrigin, parseApplicationSelection, parseOverviewOrigin } from "./overview-navigation.ts";

test("round-trips a validated overview origin through a flow URL", () => {
  const flowUrl = composeFlowUrl("src/data/flows/resume-alignment.diagram", "per-job-resume", {
    path: "src/data/overviews/resume-app.diagram",
    capabilityId: "tailor-resume-to-role",
    viewId: "guided-interview",
  });
  const params = new URL(flowUrl, "http://localhost").searchParams;
  assert.deepEqual(parseOverviewOrigin(params), {
    path: "src/data/overviews/resume-app.diagram",
    capabilityId: "tailor-resume-to-role",
    viewId: "guided-interview",
  });
  assert.equal(params.get("diagram"), "src/data/flows/resume-alignment.diagram");
  assert.equal(params.get("variant"), "per-job-resume");
});

test("rejects arbitrary return URLs and unsafe paths", () => {
  assert.equal(parseOverviewOrigin(new URLSearchParams("overview=https%3A%2F%2Fevil.test%2F%3Freturn%3D1%26capability%3Dx")), undefined);
  assert.throws(() => composeFlowUrl("../secret.diagram"));
  assert.throws(() => composeOverviewUrl({ path: "src/data/overviews/resume-app.diagram", capabilityId: "bad id" }));
});

test("keeps the selected capability in the overview URL without dropping view context", () => {
  assert.equal(composeOverviewCapabilityUrl("/?diagram=overview.diagram&variant=focused", "resume"), "/?diagram=overview.diagram&variant=focused&capability=resume");
  assert.equal(composeOverviewCapabilityUrl("/?diagram=overview.diagram&variant=focused&capability=resume", null), "/?diagram=overview.diagram&variant=focused");
});

test("composes a validated wireframe screen URL with overview origin", () => {
  const url = composeWireframeUrl("src/data/wireframes/resume-workbench.diagram", "capability", {
    path: "src/data/overviews/resume-app.diagram",
    capabilityId: "tailor-resume-to-role",
    viewId: "focused",
  });
  const params = new URL(url, "http://localhost").searchParams;
  assert.equal(params.get("diagram"), "src/data/wireframes/resume-workbench.diagram");
  assert.equal(params.get("screen"), "capability");
  assert.deepEqual(parseOverviewOrigin(params), {
    path: "src/data/overviews/resume-app.diagram",
    capabilityId: "tailor-resume-to-role",
    viewId: "focused",
  });
  assert.throws(() => composeWireframeUrl("wireframe.diagram", "not safe"));
  assert.throws(() => composeWireframeUrl("wireframe\0.diagram"));
});

test("preserves application page and state context on typed artifact URLs", () => {
  const origin = { path: "docs/intent/application-map/resume-studio.diagram", pageId: "assessment", stateId: "reviewing" };
  const app = new URL(composeApplicationUrl(origin), "http://localhost");
  assert.equal(app.searchParams.get("diagram"), origin.path);
  assert.equal(app.searchParams.get("page"), origin.pageId);
  const overview = new URL(composeApplicationOverviewUrl("scope.diagram", "assessment", origin), "http://localhost");
  assert.equal(overview.searchParams.get("capability"), "assessment");
  assert.deepEqual(parseApplicationOrigin(overview.searchParams), origin);
  const flow = new URL(composeApplicationFlowUrl("flow.diagram", "checkout", origin), "http://localhost");
  assert.equal(flow.hash, "#checkout");
  assert.deepEqual(parseApplicationOrigin(flow.searchParams), origin);
  const chained = new URL(composeFlowUrl("flow.diagram", undefined, { path: "scope.diagram", capabilityId: "assessment" }, origin), "http://localhost");
  assert.deepEqual(parseApplicationOrigin(chained.searchParams), origin);
  const wireframe = new URL(composeApplicationWireframeUrl("wireframe.diagram", "review", origin), "http://localhost");
  assert.equal(wireframe.searchParams.get("screen"), "review");
  assert.deepEqual(parseApplicationOrigin(wireframe.searchParams), origin);
});

test("rejects unsafe application origin and target IDs", () => {
  assert.equal(parseApplicationOrigin(new URLSearchParams("application=app.diagram&page=bad%20id")), undefined);
  assert.throws(() => composeApplicationUrl({ path: "../app.diagram", pageId: "home" }));
  assert.throws(() => composeApplicationFlowUrl("flow.diagram", "bad id", { path: "app.diagram", pageId: "home" }));
});

test("round-trips and validates application page/state selection", () => {
  const url = composeApplicationSelectionUrl("/?diagram=app.diagram&state=old#top", { pageId: "review", stateId: "ready" });
  assert.equal(url, "/?diagram=app.diagram&state=ready&page=review#top");
  assert.deepEqual(parseApplicationSelection(new URL(url, "http://localhost").searchParams), { pageId: "review", stateId: "ready" });
  assert.equal(parseApplicationSelection(new URLSearchParams("page=review&state=bad%20state")), undefined);
  assert.throws(() => composeApplicationSelectionUrl("/?diagram=app.diagram", { pageId: "bad id" }));
});
