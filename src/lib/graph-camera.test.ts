import assert from "node:assert/strict";
import test from "node:test";
import { fitCamera, zoomCamera } from "./graph-camera.ts";

test("fit contains the graph and zoom preserves the world point under the pointer", () => {
  const camera = fitCamera(680, 780, 1000, 420);
  assert.ok(camera.x >= 16 && camera.y >= 16);
  assert.ok(camera.x + 680 * camera.scale <= 984);
  assert.ok(camera.y + 780 * camera.scale <= 404);
  const point = { x: 317, y: 203 };
  for (const factor of [.5, 2, 100, .001]) {
    const next = zoomCamera(camera, point, factor);
    assert.ok(Math.abs((point.x - camera.x) / camera.scale - (point.x - next.x) / next.scale) < 1e-8);
    assert.ok(Math.abs((point.y - camera.y) / camera.scale - (point.y - next.y) / next.scale) < 1e-8);
    assert.ok(next.scale >= .1 && next.scale <= 3);
  }
  assert.ok(Number.isFinite(fitCamera(0, 0, 0, 0).scale));
});
