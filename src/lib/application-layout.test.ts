import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { parseApplicationDsl } from "./application-dsl.ts";
import { applicationNetwork, edgeMarkerPosition, fallbackApplicationLayout, fallbackApplicationNetwork, layoutApplicationNetwork, layoutApplicationPages } from "./application-layout.ts";
import type { ApplicationDocument } from "../types/application.ts";

test("page layout follows links and preserves branches, cycles, and isolated pages", async () => {
  const document: ApplicationDocument = {
    id: "test", title: "Test", objects: [], ownership: [],
    pages: ["finish", "branch", "start", "middle", "isolated"].map((id) => ({ id, title: id, states: [], references: [] })),
    navigation: [["start", "middle"], ["middle", "finish"], ["start", "branch"]].map(([fromPageId, toPageId], index) => ({ id: `edge-${index}`, fromPageId, toPageId, trigger: "Go" })),
  };
  const layout = await layoutApplicationPages(document);
  const x = (id: string) => layout.children!.find((node) => node.id === id)!.x!;
  assert.ok(x("start") < x("middle") && x("middle") < x("finish"));
  assert.ok(x("start") < x("branch"));
  document.navigation.push({ id: "back", fromPageId: "finish", toPageId: "start", trigger: "Restart" }, { id: "self", fromPageId: "middle", toPageId: "middle", trigger: "Retry" });
  for (const result of [await layoutApplicationPages(document), fallbackApplicationLayout(document)]) {
    assert.equal(result.children!.length, document.pages.length);
    assert.equal(result.edges!.length, document.navigation.length);
    for (const node of result.children!) {
      assert.ok(Number.isFinite(node.x) && Number.isFinite(node.y));
      assert.ok(node.x! + node.width! <= result.width!);
      assert.ok(node.y! + node.height! <= result.height!);
    }
    for (const edge of result.edges!) {
      assert.ok(edge.sections?.length, `Missing route: ${edge.id}`);
      const marker = edgeMarkerPosition(edge);
      assert.ok(Number.isFinite(marker.x) && Number.isFinite(marker.y));
      assert.ok(edge.sections!.some((section) => {
        const points = [section.startPoint, ...(section.bendPoints || []), section.endPoint];
        return points.slice(1).some((point, index) => {
          const previous = points[index];
          return (marker.x === point.x && marker.x === previous.x && marker.y >= Math.min(point.y, previous.y) && marker.y <= Math.max(point.y, previous.y))
            || (marker.y === point.y && marker.y === previous.y && marker.x >= Math.min(point.x, previous.x) && marker.x <= Math.max(point.x, previous.x));
        });
      }), `Marker must sit on its edge: ${edge.id}`);
    }
  }
  assert.equal((await layoutApplicationPages({ ...document, pages: [], navigation: [] })).children!.length, 0);
});

test("network keeps typed nodes and authored relationships, with stable left-to-right hierarchy", async () => {
  const document = parseApplicationDsl(readFileSync(new URL("../../docs/intent/application-map/resume-studio.diagram", import.meta.url), "utf8").replace("diagram 1\ntype application", ""));
  const original = JSON.stringify(document);
  const graph = applicationNetwork(document);
  assert.equal(graph.nodes.length, 11);
  assert.equal(graph.edges.length, 10);
  assert.equal(graph.edges.filter((edge) => edge.kind === "ownership").length, 0);
  assert.equal(graph.edges.filter((edge) => edge.kind === "primary").length, 5);
  assert.ok(!graph.nodes.some((node) => node.kind === "application" || node.sourceId === "project"));
  const withOwnership = applicationNetwork({ ...document, ownership: [
    { id: "root", ownerId: document.id, objectId: "posting", cardinality: "one" },
    { id: "child", ownerId: "posting", objectId: "evidence", cardinality: "many" },
  ] });
  assert.ok(withOwnership.nodes.some((node) => node.kind === "application"));
  assert.ok(withOwnership.edges.some((edge) => edge.fromPageId === "application" && edge.toPageId === "object:posting"));
  assert.ok(withOwnership.edges.some((edge) => edge.fromPageId === "object:posting" && edge.toPageId === "object:evidence"));
  assert.ok(graph.edges.some((edge) => edge.fromPageId === "page:assessment" && edge.toPageId === "object:posting"));
  const layout = await layoutApplicationNetwork(document);
  assert.ok(layout.width! * layout.height! < 800_000, "The sample hierarchy should remain compact.");
  // Authored list order must not override directed relationships.
  const reordered = await layoutApplicationNetwork({ ...document, pages: [...document.pages].reverse(), objects: [...document.objects].reverse() });
  for (const result of [layout, reordered]) {
    const nodes = new Map(result.children!.map((node) => [node.id, node]));
    for (const edge of graph.edges) {
      const from = nodes.get(edge.fromPageId)!, to = nodes.get(edge.toPageId)!;
      assert.ok(from.x! + from.width! < to.x!, `Expected left-to-right link: ${edge.id}`);
    }
  }
  const repeated = await layoutApplicationNetwork(document);
  assert.deepEqual(layout.children!.map(({ x, y }) => [x, y]), repeated.children!.map(({ x, y }) => [x, y]));
  for (const result of [layout, fallbackApplicationNetwork(document)]) {
    assert.equal(result.children!.length, 11);
    assert.equal(result.edges!.length, 10);
    for (const [index, node] of result.children!.entries()) {
      assert.ok(Number.isFinite(node.x) && Number.isFinite(node.y));
      for (const other of result.children!.slice(index + 1)) {
        assert.ok(node.x! + node.width! <= other.x! || other.x! + other.width! <= node.x! || node.y! + node.height! <= other.y! || other.y! + other.height! <= node.y!, `Overlapping nodes: ${node.id}, ${other.id}`);
      }
    }
    for (const edge of result.edges!) assert.ok(edge.sections?.length);
  }
  assert.equal(JSON.stringify(document), original);
  const markers: { x: number; y: number }[] = [];
  for (const edge of layout.edges!) {
    const marker = edgeMarkerPosition(edge, layout.children, markers);
    assert.ok(markers.every((other) => Math.hypot(marker.x - other.x, marker.y - other.y) >= 48));
    assert.ok(layout.children!.every((node) => marker.x + 24 <= node.x! || marker.x - 24 >= node.x! + node.width! || marker.y + 24 <= node.y! || marker.y - 24 >= node.y! + node.height!));
    markers.push(marker);
  }
  const selfLink = await layoutApplicationNetwork({ ...document, navigation: [{ id: "retry", fromPageId: "projects", toPageId: "projects", trigger: "Retry" }] });
  assert.ok(selfLink.edges!.find((edge) => edge.id === "navigation:retry")?.sections?.length);
});

test("edge markers use a clear part of the edge when its midpoint is covered", () => {
  const position = edgeMarkerPosition({ id: "edge", sources: ["a"], targets: ["b"], sections: [{ id: "section", startPoint: { x: 0, y: 0 }, endPoint: { x: 100, y: 0 } }] }, [{ id: "obstacle", x: 45, y: -10, width: 10, height: 20 }]);
  assert.equal(position.y, 0);
  assert.ok(position.x + 24 <= 45 || position.x - 24 >= 55);
});
