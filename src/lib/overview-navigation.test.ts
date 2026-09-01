import assert from "node:assert/strict";
import test from "node:test";
import { composeFlowUrl, composeOverviewUrl, parseOverviewOrigin } from "./overview-navigation.ts";

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
