import { graphToDsl, materializeVariant, parseGraphDsl, parseGraphDslWithDiagnostics } from "./graph-dsl";
import type { CanvasGraph, CanvasNode, FlowDocument, FlowGraph, NodePosition, NodeType } from "../types/graph";

export function mountFlowWorkbench(initialGraph: unknown) {
const TYPE_COLUMNS = {
      actor: 0,
      need: 1,
      process: 2,
      handoff: 3,
      deliverable: 3,
      ux: 4,
      goal: 5,
    };

    const COLUMN_X = [88, 354, 620, 886, 1152, 1418];
    const MAIN_TOP = 72;
    const ROW_GAP = 82;
    const NODE_WIDTH = 216;
    const NODE_HEIGHT = 58;
    const ROUTE_GRID = 10;
    const ROUTE_CLEARANCE = 12;
    const ROUTE_REUSE_PENALTY = 500;
    const LANE_LABELS = ['User', 'Fundamental needs', 'Process', 'Handoffs + deliverables', 'UI / UX considerations', 'Outcome'];
    const STORAGE_KEY = 'user-flow-workbench-v4';

    let flowDocument = normalizeDocument(initialGraph);
    let activeVariantId: string | null = null;
    let graph: CanvasGraph = normalizeGraph(flowDocument.graph);
    let authoredLayoutHintIds = extractLayoutHintIds(flowDocument.graph);
    let includeDslPositions = false;
    let selectedNodeId = null;
    let zoom = 0.72;
    let panX = 20;
    let panY = 16;
    let isPanning = false;
    let panStart = null;
    let dragState = null;
    let edgeRenderFrame = null;
    let variantPositionSyncTimer: ReturnType<typeof setTimeout> | null = null;
    let elkRoutes = new Map();
    let elkLayoutActive = false;
    let elkInstance = null;
    let elkConstructorPromise: Promise<any> | null = null;

    const $ = <T extends Element = HTMLElement>(id: string): T => {
      const element = document.getElementById(id);
      if (!element) throw new Error(`Missing workbench element: ${id}`);
      return element as unknown as T;
    };
    const viewport = $<HTMLDivElement>('viewport');
    const world = $<HTMLDivElement>('world');
    const nodeLayer = $<HTMLDivElement>('nodeLayer');
    const laneLayer = $<HTMLDivElement>('laneLayer');
    const edgeLayer = $<SVGGElement>('edgeLayer');
    const dslEditor = $<HTMLTextAreaElement>('dslEditor');
    const inspector = $<HTMLDivElement>('inspector');
    const variantTabs = $<HTMLDivElement>('variantTabs');
    const variantContext = $<HTMLDivElement>('variantContext');

    function clone<T>(value: T): T { return JSON.parse(JSON.stringify(value)) as T; }

    function extractLayoutHintIds(input: any): Set<string> {
      return new Set(Object.keys(input?.layout?.hints || {}));
    }

    function normalizeDocument(input: any): FlowDocument {
      if (input?.schemaVersion === 4 && input?.graph) {
        return {
          dslVersion: 2,
          schemaVersion: 4,
          graph: clone(input.graph),
          variants: Array.isArray(input.variants) ? clone(input.variants) : [],
        };
      }

      const legacy = clone(input || {});
      const hints = legacy.layout?.hints || Object.fromEntries(
        (legacy.nodes || []).filter(node => node?.layout).map(node => [node.id, node.layout]),
      );
      const positions = legacy.layout?.positions || Object.fromEntries(
        (legacy.nodes || []).filter(node => node?.position).map(node => [node.id, node.position]),
      );
      return {
        dslVersion: 2,
        schemaVersion: 4,
        graph: {
          id: legacy.id || `flow-${Date.now()}`,
          title: legacy.title || 'Untitled flow',
          ...(legacy.description ? { description: legacy.description } : {}),
          nodes: Array.isArray(legacy.nodes) ? legacy.nodes.map(({ layout, position, ...node }) => node) : [],
          edges: Array.isArray(legacy.edges) ? legacy.edges : [],
          layout: { hints, positions },
        },
        variants: [],
      };
    }

    function normalizeGraph(input: any): CanvasGraph {
      const next = clone(input || {});
      next.id ??= `flow-${Date.now()}`;
      next.title ??= 'Untitled flow';
      next.description ??= '';
      next.nodes = Array.isArray(next.nodes) ? next.nodes : [];
      next.edges = Array.isArray(next.edges) ? next.edges : [];

      // Variants remain future graph views. They are not node types.
      const hints = next.layout?.hints || {};
      const positions = next.layout?.positions || {};
      const rowsByColumn = new Map();
      next.nodes = next.nodes
        .filter(node => node?.type !== 'variant')
        .map((node, index) => {
          const nodeId = node.id || `node-${index + 1}`;
          const type = TYPE_COLUMNS[node.type] !== undefined ? node.type : 'process';
          const hint = hints[nodeId] || node.layout;
          const position = positions[nodeId] || node.position;
          const column = Number.isFinite(hint?.column) ? hint.column : TYPE_COLUMNS[type];
          const nextRow = rowsByColumn.get(column) || 0;
          rowsByColumn.set(column, nextRow + 1);
          return {
            id: nodeId,
            type,
            title: node.title || 'Untitled node',
            body: node.body || '',
            tags: Array.isArray(node.tags) ? node.tags : [],
            layout: {
              column,
              row: Number.isFinite(hint?.row) ? hint.row : nextRow,
            },
            position: {
              x: Number.isFinite(position?.x) ? position.x : 0,
              y: Number.isFinite(position?.y) ? position.y : 0,
            },
          };
        });

      const validIds = new Set(next.nodes.map(node => node.id));
      next.edges = next.edges
        .filter(edge => edge?.from && edge?.to && validIds.has(edge.from) && validIds.has(edge.to))
        .map((edge, index) => ({
          id: edge.id || `edge-${index + 1}`,
          from: edge.from,
          to: edge.to,
          label: edge.label || '',
          emphasis: Boolean(edge.emphasis),
        }));

      return next;
    }

    function toFlowGraph(includePositions = true): FlowGraph {
      const hints = Object.fromEntries(
        graph.nodes
          .filter(node => authoredLayoutHintIds.has(node.id))
          .map(node => [node.id, clone(node.layout)]),
      );
      const positions = Object.fromEntries(graph.nodes.map(node => [node.id, clone(node.position)]));
      return {
        id: graph.id,
        title: graph.title,
        ...(graph.description ? { description: graph.description } : {}),
        nodes: graph.nodes.map(({ layout, position, body, tags, ...node }) => ({
          ...clone(node),
          ...(body ? { body } : {}),
          ...(tags.length ? { tags: clone(tags) } : {}),
        })),
        edges: graph.edges.map(({ id, from, to, label, emphasis }) => ({
          id,
          from,
          to,
          ...(label ? { label } : {}),
          ...(emphasis ? { emphasis: true } : {}),
        })),
        layout: {
          hints,
          ...(includePositions ? { positions } : {}),
        },
      };
    }

    function commitBaseGraph() {
      if (activeVariantId === null) flowDocument.graph = toFlowGraph();
    }

    function toFlowDocument(): FlowDocument {
      commitBaseGraph();
      return clone(flowDocument);
    }

    function syncDslEditor() {
      const document = toFlowDocument();
      dslEditor.value = graphToDsl(document, { includePositions: includeDslPositions });
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(document)); } catch {}
    }

    function updatePositionsDslButton() {
      $('positionsDslBtn').textContent = includeDslPositions ? 'Remove positions' : 'Add positions';
    }

    function renderAll({ syncJson = true } = {}) {
      renderNodes();
      renderLanes();
      scheduleEdgeRender();
      renderInspector();
      updateToolbar();
      renderVariantTabs();
      if (syncJson) syncDslEditor();
    }

    function variantImpact(variant) {
      const counts = { added: 0, removed: 0, changed: 0, positioned: 0 };
      for (const operation of variant.operations) {
        if (operation.kind.startsWith('add-')) counts.added += 1;
        else if (operation.kind.startsWith('remove-')) counts.removed += 1;
        else if (operation.kind === 'set-position') counts.positioned += 1;
        else if (operation.kind !== 'clear-all') counts.changed += 1;
      }
      const parts = [
        counts.added && `${counts.added} added`,
        counts.removed && `${counts.removed} removed`,
        counts.changed && `${counts.changed} changed`,
        counts.positioned && `${counts.positioned} positioned`,
        variant.operations.some(operation => operation.kind === 'clear-all') && 'base cleared',
      ].filter(Boolean);
      return parts.join(' · ') || 'No changes';
    }

    function renderVariantTabs() {
      const tabs = [{ id: null, title: 'Base' }, ...flowDocument.variants];
      variantTabs.innerHTML = tabs.map((tab, index) => {
        const selected = tab.id === activeVariantId;
        const id = tab.id || 'base';
        return `<button class="variant-tab" id="variant-tab-${escapeAttr(id)}" role="tab" aria-selected="${selected}" aria-controls="viewport" tabindex="${selected ? 0 : -1}" data-variant-id="${escapeAttr(tab.id || '')}">${escapeHtml(tab.title)}</button>`;
      }).join('');
      variantTabs.querySelectorAll<HTMLButtonElement>('[data-variant-id]').forEach(button => {
        button.addEventListener('click', () => selectVariant(button.dataset.variantId || null));
      });
      const active = flowDocument.variants.find(variant => variant.id === activeVariantId);
      variantContext.innerHTML = active
        ? `<span>${escapeHtml(active.description || 'Variant view')}</span><span class="variant-key">Variant impact highlighted</span><strong>${escapeHtml(variantImpact(active))}</strong>`
        : `<span>Shared graph</span><strong>${graph.nodes.length} nodes · ${graph.edges.length} edges</strong>`;
      viewport.setAttribute('aria-labelledby', `variant-tab-${activeVariantId || 'base'}`);
    }

    function getVariantNodeEffects(): Map<string, 'added' | 'changed' | 'connected'> {
      const effects = new Map<string, 'added' | 'changed' | 'connected'>();
      const variant = flowDocument.variants.find(item => item.id === activeVariantId);
      if (!variant) return effects;
      const edges = new Map(flowDocument.graph.edges.map(edge => [edge.id, edge]));
      const rank = { connected: 1, changed: 2, added: 3 };
      const mark = (nodeId: string, effect: 'added' | 'changed' | 'connected') => {
        const current = effects.get(nodeId);
        if (!current || rank[effect] > rank[current]) effects.set(nodeId, effect);
      };

      for (const operation of variant.operations) {
        if (operation.kind === 'clear-all') graph.nodes.forEach(node => mark(node.id, 'changed'));
        if (operation.kind === 'add-node') mark(operation.node.id, 'added');
        if (operation.kind === 'set-node' || operation.kind === 'unset-node' || operation.kind === 'set-position') {
          mark(operation.nodeId, 'changed');
        }
        if (operation.kind === 'add-edge') {
          mark(operation.edge.from, 'connected');
          mark(operation.edge.to, 'connected');
          edges.set(operation.edge.id, operation.edge);
        }
        if (operation.kind === 'remove-edge') {
          const edge = edges.get(operation.edgeId);
          if (edge) {
            mark(edge.from, 'connected');
            mark(edge.to, 'connected');
            edges.delete(operation.edgeId);
          }
        }
        if (operation.kind === 'set-edge') {
          const edge = edges.get(operation.edgeId);
          if (edge) {
            mark(edge.from, 'connected');
            mark(edge.to, 'connected');
            const next = { ...edge, ...operation.changes };
            mark(next.from, 'connected');
            mark(next.to, 'connected');
            edges.set(operation.edgeId, next);
          }
        }
      }
      return effects;
    }

    function variantIdFromUrl(): string | null {
      const variantId = new URL(window.location.href).searchParams.get('variant');
      return flowDocument.variants.some(variant => variant.id === variantId) ? variantId : null;
    }

    function updateVariantUrl(variantId: string | null) {
      const url = new URL(window.location.href);
      if (variantId) url.searchParams.set('variant', variantId);
      else url.searchParams.delete('variant');
      window.history.replaceState({ ...window.history.state, flowVariant: variantId }, '', url);
    }

    function selectVariant(variantId: string | null, { updateUrl = true } = {}) {
      if (variantId === activeVariantId) return;
      commitBaseGraph();
      activeVariantId = variantId;
      if (updateUrl) updateVariantUrl(variantId);
      const materialized = variantId ? materializeVariant(flowDocument, variantId) : flowDocument.graph;
      graph = normalizeGraph(materialized);
      authoredLayoutHintIds = extractLayoutHintIds(materialized);
      selectedNodeId = null;
      elkRoutes.clear();
      elkLayoutActive = false;
      updateLayoutEngineLabel();
      renderAll();
      const hasAllPositions = graph.nodes.every(node => materialized.layout?.positions?.[node.id]);
      if (hasAllPositions) fitView();
      else void autoLayout();
    }

    function renderLanes() {
      laneLayer.innerHTML = '';
      const positions = LANE_LABELS.map((label, column) => {
        const xs = graph.nodes
          .filter(node => Math.round(node.layout.column) === column)
          .map(node => node.position.x)
          .sort((a, b) => a - b);
        const x = xs.length ? xs[Math.floor(xs.length / 2)] : COLUMN_X[column];
        return { label, column, x };
      });

      positions.forEach((lane, index) => {
        const next = positions[index + 1];
        const width = next ? Math.max(220, next.x - lane.x) : 252;
        const el = document.createElement('div');
        el.className = 'lane';
        el.style.left = `${Math.round(lane.x - 16)}px`;
        el.style.width = `${Math.round(width)}px`;
        el.innerHTML = `<div class="lane-label">${escapeHtml(lane.label)}</div>`;
        laneLayer.appendChild(el);
      });
    }

    function renderNodes() {
      nodeLayer.innerHTML = '';
      const variantEffects = getVariantNodeEffects();
      for (const node of graph.nodes) {
        const el = document.createElement('article');
        const variantEffect = variantEffects.get(node.id);
        el.className = `node${node.id === selectedNodeId ? ' selected' : ''}${variantEffect ? ` variant-affected variant-${variantEffect}` : ''}`;
        el.dataset.id = node.id;
        el.dataset.type = node.type;
        if (variantEffect) el.dataset.variantEffect = variantEffect === 'added' ? 'NEW' : variantEffect === 'changed' ? 'CHANGED' : 'PATH';
        el.style.left = `${node.position.x}px`;
        el.style.top = `${node.position.y}px`;
        el.title = `${node.type}: ${node.title}`;
        el.innerHTML = `
          <span class="node-icon" aria-hidden="true">${iconSvg(node.type)}</span>
          <div class="node-title">${escapeHtml(node.title)}</div>
        `;
        el.addEventListener('pointerdown', (event) => startNodeDrag(event, node.id));
        nodeLayer.appendChild(el);
      }
    }

    function scheduleEdgeRender() {
      if (edgeRenderFrame) return;
      edgeRenderFrame = requestAnimationFrame(() => {
        edgeRenderFrame = null;
        renderEdges();
      });
    }

    function renderEdges() {
      edgeLayer.innerHTML = '';
      const rects = getNodeRects();
      const nodesById = new Map(graph.nodes.map(node => [node.id, node]));
      const segmentUsage = new Map();
      const portLaneOffsets = buildPortLaneOffsets(graph.edges, rects);

      // Stable ordering makes lane assignment deterministic.
      const edges = [...graph.edges].sort((a, b) => {
        const af = nodesById.get(a.from)?.layout.column ?? 0;
        const bf = nodesById.get(b.from)?.layout.column ?? 0;
        return af - bf || a.from.localeCompare(b.from) || a.to.localeCompare(b.to);
      });

      for (const edge of edges) {
        const from = nodesById.get(edge.from);
        const to = nodesById.get(edge.to);
        const fromRect = rects.get(edge.from);
        const toRect = rects.get(edge.to);
        if (!from || !to || !fromRect || !toRect) continue;

        const route = routeEdge(edge, fromRect, toRect, rects, segmentUsage, portLaneOffsets);
        if (!route.points.length) continue;

        const path = svgEl('path', {
          d: pointsToPath(route.points),
          class: `edge-path${edge.emphasis ? ' emphasis' : ''}`,
        });
        edgeLayer.appendChild(path);

        for (const segmentKey of route.gridSegments || []) {
          segmentUsage.set(segmentKey, (segmentUsage.get(segmentKey) || 0) + 1);
        }

        if (edge.label) renderEdgeLabel(edge.label, route.points, route.labelPosition);
      }
    }

    function getNodeRects() {
      const rects = new Map();
      for (const node of graph.nodes) {
        const el = nodeLayer.querySelector<HTMLElement>(`[data-id="${cssEscape(node.id)}"]`);
        rects.set(node.id, {
          id: node.id,
          x: node.position.x,
          y: node.position.y,
          w: el?.offsetWidth || NODE_WIDTH,
          h: el?.offsetHeight || NODE_HEIGHT,
        });
      }
      return rects;
    }

    function routeEdge(edge, fromRect, toRect, rects, segmentUsage, portLaneOffsets) {
      const ports = choosePorts(fromRect, toRect, {
        start: portLaneOffsets.get(`${edge.id}:start`) || 0,
        end: portLaneOffsets.get(`${edge.id}:end`) || 0,
      });
      const obstacles = [...rects.values()].map(rect => inflateRect(rect, ROUTE_CLEARANCE));
      const bounds = routeBounds(rects);

      let startGrid = snapPoint(ports.startPort);
      let endGrid = snapPoint(ports.endPort);
      startGrid = pushGridPointOutside(startGrid, ports.startSide, obstacles, bounds);
      endGrid = pushGridPointOutside(endGrid, ports.endSide, obstacles, bounds);

      const rawGrid = aStarOrthogonal(startGrid, endGrid, obstacles, bounds, segmentUsage);
      const fallback = [startGrid, { x: startGrid.x, y: endGrid.y }, endGrid];
      const gridPoints = rawGrid.length ? rawGrid : fallback;
      const compressedGrid = compressOrthogonal(gridPoints);

      const points = dedupePoints([
        ports.startAnchor,
        ports.startPort,
        ...compressedGrid,
        ports.endPort,
        ports.endAnchor,
      ]);

      return {
        points: compressOrthogonal(points),
        gridSegments: rawGrid.length ? gridSegmentKeys(rawGrid) : [],
        labelPosition: null,
      };
    }

    function buildPortLaneOffsets(edges, rects) {
      const groups = new Map();

      for (const edge of edges) {
        const fromRect = rects.get(edge.from);
        const toRect = rects.get(edge.to);
        if (!fromRect || !toRect) continue;
        const ports = choosePorts(fromRect, toRect);
        const fromCenter = rectCenter(fromRect);
        const toCenter = rectCenter(toRect);

        addPortLane(groups, `${edge.from}:${ports.startSide}`, {
          key: `${edge.id}:start`,
          order: portOrder(ports.startSide, toCenter),
          id: edge.id,
          rect: fromRect,
          side: ports.startSide,
        });
        addPortLane(groups, `${edge.to}:${ports.endSide}`, {
          key: `${edge.id}:end`,
          order: portOrder(ports.endSide, fromCenter),
          id: edge.id,
          rect: toRect,
          side: ports.endSide,
        });
      }

      const offsets = new Map();
      for (const entries of groups.values()) {
        entries.sort((a, b) => a.order - b.order || a.id.localeCompare(b.id));
        const verticalSide = ['left', 'right'].includes(entries[0].side);
        const axisStart = verticalSide ? entries[0].rect.y : entries[0].rect.x;
        const dimension = verticalSide ? entries[0].rect.h : entries[0].rect.w;
        const center = axisStart + dimension / 2;
        const firstLane = Math.ceil((axisStart + 4) / ROUTE_GRID) * ROUTE_GRID;
        const lastLane = Math.floor((axisStart + dimension - 4) / ROUTE_GRID) * ROUTE_GRID;
        const laneCount = Math.max(1, Math.floor((lastLane - firstLane) / ROUTE_GRID) + 1);
        entries.forEach((entry, index) => {
          const laneIndex = entries.length > 1
            ? Math.round(index * (laneCount - 1) / (entries.length - 1))
            : Math.round((laneCount - 1) / 2);
          offsets.set(entry.key, firstLane + laneIndex * ROUTE_GRID - center);
        });
      }
      return offsets;
    }

    function addPortLane(groups, groupKey, entry) {
      if (!groups.has(groupKey)) groups.set(groupKey, []);
      groups.get(groupKey).push(entry);
    }

    function portOrder(side, point) {
      return ['left', 'right'].includes(side) ? point.y : point.x;
    }

    function rectCenter(rect) {
      return { x: rect.x + rect.w / 2, y: rect.y + rect.h / 2 };
    }

    function offsetAnchor(anchor, side, amount) {
      return ['left', 'right'].includes(side)
        ? { x: anchor.x, y: anchor.y + amount }
        : { x: anchor.x + amount, y: anchor.y };
    }

    function choosePorts(a, b, laneOffsets = { start: 0, end: 0 }) {
      const ac = { x: a.x + a.w / 2, y: a.y + a.h / 2 };
      const bc = { x: b.x + b.w / 2, y: b.y + b.h / 2 };
      const dx = bc.x - ac.x;
      const dy = bc.y - ac.y;
      const horizontal = Math.abs(dx) >= Math.abs(dy) * 0.72;

      if (horizontal) {
        const rightward = dx >= 0;
        const startSide = rightward ? 'right' : 'left';
        const endSide = rightward ? 'left' : 'right';
        const startAnchor = offsetAnchor(
          { x: rightward ? a.x + a.w : a.x, y: ac.y },
          startSide,
          laneOffsets.start,
        );
        const endAnchor = offsetAnchor(
          { x: rightward ? b.x : b.x + b.w, y: bc.y },
          endSide,
          laneOffsets.end,
        );
        return {
          startAnchor,
          endAnchor,
          startPort: { x: startAnchor.x + (rightward ? ROUTE_CLEARANCE + 8 : -ROUTE_CLEARANCE - 8), y: startAnchor.y },
          endPort: { x: endAnchor.x + (rightward ? -ROUTE_CLEARANCE - 8 : ROUTE_CLEARANCE + 8), y: endAnchor.y },
          startSide,
          endSide,
        };
      }

      const downward = dy >= 0;
      const startSide = downward ? 'bottom' : 'top';
      const endSide = downward ? 'top' : 'bottom';
      const startAnchor = offsetAnchor(
        { x: ac.x, y: downward ? a.y + a.h : a.y },
        startSide,
        laneOffsets.start,
      );
      const endAnchor = offsetAnchor(
        { x: bc.x, y: downward ? b.y : b.y + b.h },
        endSide,
        laneOffsets.end,
      );
      return {
        startAnchor,
        endAnchor,
        startPort: { x: startAnchor.x, y: startAnchor.y + (downward ? ROUTE_CLEARANCE + 8 : -ROUTE_CLEARANCE - 8) },
        endPort: { x: endAnchor.x, y: endAnchor.y + (downward ? -ROUTE_CLEARANCE - 8 : ROUTE_CLEARANCE + 8) },
        startSide,
        endSide,
      };
    }

    function aStarOrthogonal(start, goal, obstacles, bounds, segmentUsage) {
      const heap = new MinHeap(item => item.f);
      const gScore = new Map();
      const cameFrom = new Map();
      const stateByKey = new Map();
      const startState = { x: start.x, y: start.y, dir: 'n', g: 0, f: manhattan(start, goal) / ROUTE_GRID };
      const startKey = stateKey(startState);
      heap.push(startState);
      gScore.set(startKey, 0);
      stateByKey.set(startKey, startState);

      const directions = [
        { dx: ROUTE_GRID, dy: 0, dir: 'h' },
        { dx: -ROUTE_GRID, dy: 0, dir: 'h' },
        { dx: 0, dy: ROUTE_GRID, dir: 'v' },
        { dx: 0, dy: -ROUTE_GRID, dir: 'v' },
      ];

      let iterations = 0;
      while (heap.size && iterations++ < 30000) {
        const current = heap.pop();
        const currentKey = stateKey(current);
        if (current.g !== gScore.get(currentKey)) continue;

        if (current.x === goal.x && current.y === goal.y) {
          return reconstructGridPath(currentKey, cameFrom, stateByKey);
        }

        for (const move of directions) {
          const next: { x: number; y: number; dir: string; g?: number; f?: number } = {
            x: current.x + move.dx,
            y: current.y + move.dy,
            dir: move.dir,
          };
          if (!insideBounds(next, bounds)) continue;
          if (isBlocked(next, obstacles) && !(next.x === goal.x && next.y === goal.y)) continue;

          const segKey = normalizedSegmentKey(current, next);
          const reuse = segmentUsage.get(segKey) || 0;
          const bendPenalty = current.dir !== 'n' && current.dir !== next.dir ? 2.2 : 0;
          const reusePenalty = reuse * ROUTE_REUSE_PENALTY;
          const tentative = current.g + 1 + bendPenalty + reusePenalty;
          const nextKey = stateKey(next);
          if (tentative >= (gScore.get(nextKey) ?? Infinity)) continue;

          next.g = tentative;
          next.f = tentative + manhattan(next, goal) / ROUTE_GRID;
          gScore.set(nextKey, tentative);
          cameFrom.set(nextKey, currentKey);
          stateByKey.set(nextKey, next);
          heap.push(next);
        }
      }
      return [];
    }

    class MinHeap {
      items: any[];
      score: (item: any) => number;
      constructor(score: (item: any) => number) { this.items = []; this.score = score; }
      get size() { return this.items.length; }
      push(item) {
        const a = this.items;
        a.push(item);
        let i = a.length - 1;
        while (i > 0) {
          const p = (i - 1) >> 1;
          if (this.score(a[p]) <= this.score(item)) break;
          a[i] = a[p];
          i = p;
        }
        a[i] = item;
      }
      pop() {
        const a = this.items;
        const root = a[0];
        const last = a.pop();
        if (!a.length) return root;
        let i = 0;
        while (true) {
          let child = i * 2 + 1;
          if (child >= a.length) break;
          if (child + 1 < a.length && this.score(a[child + 1]) < this.score(a[child])) child++;
          if (this.score(a[child]) >= this.score(last)) break;
          a[i] = a[child];
          i = child;
        }
        a[i] = last;
        return root;
      }
    }

    function reconstructGridPath(endKey, cameFrom, stateByKey) {
      const points = [];
      let key = endKey;
      while (key) {
        const state = stateByKey.get(key);
        if (!state) break;
        points.push({ x: state.x, y: state.y });
        key = cameFrom.get(key);
      }
      return points.reverse();
    }

    function gridSegmentKeys(points) {
      const keys = [];
      for (let i = 1; i < points.length; i++) keys.push(normalizedSegmentKey(points[i - 1], points[i]));
      return keys;
    }

    function normalizedSegmentKey(a, b) {
      if (a.x < b.x || (a.x === b.x && a.y <= b.y)) return `${a.x},${a.y}|${b.x},${b.y}`;
      return `${b.x},${b.y}|${a.x},${a.y}`;
    }

    function stateKey(p) { return `${p.x},${p.y},${p.dir}`; }
    function manhattan(a, b) { return Math.abs(a.x - b.x) + Math.abs(a.y - b.y); }
    function snapPoint(p) { return { x: Math.round(p.x / ROUTE_GRID) * ROUTE_GRID, y: Math.round(p.y / ROUTE_GRID) * ROUTE_GRID }; }
    function inflateRect(rect, amount) { return { x: rect.x - amount, y: rect.y - amount, w: rect.w + amount * 2, h: rect.h + amount * 2 }; }
    function isBlocked(point, obstacles) { return obstacles.some(rect => point.x > rect.x && point.x < rect.x + rect.w && point.y > rect.y && point.y < rect.y + rect.h); }
    function insideBounds(p, b) { return p.x >= b.minX && p.x <= b.maxX && p.y >= b.minY && p.y <= b.maxY; }

    function routeBounds(rects) {
      const values = [...rects.values()];
      const minX = Math.min(...values.map(r => r.x)) - 160;
      const minY = Math.min(...values.map(r => r.y)) - 150;
      const maxX = Math.max(...values.map(r => r.x + r.w)) + 160;
      const maxY = Math.max(...values.map(r => r.y + r.h)) + 150;
      return {
        minX: Math.floor(minX / ROUTE_GRID) * ROUTE_GRID,
        minY: Math.floor(minY / ROUTE_GRID) * ROUTE_GRID,
        maxX: Math.ceil(maxX / ROUTE_GRID) * ROUTE_GRID,
        maxY: Math.ceil(maxY / ROUTE_GRID) * ROUTE_GRID,
      };
    }

    function pushGridPointOutside(point, side, obstacles, bounds) {
      const step = side === 'left' ? { x: -ROUTE_GRID, y: 0 }
        : side === 'right' ? { x: ROUTE_GRID, y: 0 }
        : side === 'top' ? { x: 0, y: -ROUTE_GRID }
        : { x: 0, y: ROUTE_GRID };
      const next = { ...point };
      let guard = 0;
      while (isBlocked(next, obstacles) && guard++ < 20) {
        next.x += step.x;
        next.y += step.y;
      }
      next.x = clamp(next.x, bounds.minX, bounds.maxX);
      next.y = clamp(next.y, bounds.minY, bounds.maxY);
      return next;
    }

    function compressOrthogonal(points) {
      if (points.length <= 2) return points;
      const out = [points[0]];
      for (let i = 1; i < points.length - 1; i++) {
        const a = out[out.length - 1];
        const b = points[i];
        const c = points[i + 1];
        const collinear = (a.x === b.x && b.x === c.x) || (a.y === b.y && b.y === c.y);
        if (!collinear) out.push(b);
      }
      out.push(points[points.length - 1]);
      return out;
    }

    function dedupePoints(points) {
      return points.filter((point, index) => !index || point.x !== points[index - 1].x || point.y !== points[index - 1].y);
    }

    function pointsToPath(points) {
      if (!points.length) return '';
      return `M ${points[0].x} ${points[0].y} ` + points.slice(1).map(point => `L ${point.x} ${point.y}`).join(' ');
    }

    function renderEdgeLabel(label, points, explicitPosition = null) {
      if (explicitPosition) {
        const width = Math.max(62, label.length * 6.4 + 18);
        const mx = explicitPosition.x;
        const my = explicitPosition.y;
        const rect = svgEl('rect', { x: mx - width / 2, y: my - 10, width, height: 20, rx: 7, class: 'edge-label-bg' });
        const text = svgEl('text', { x: mx, y: my + .5, class: 'edge-label' });
        text.textContent = label;
        edgeLayer.appendChild(rect);
        edgeLayer.appendChild(text);
        return;
      }

      let best = null;
      for (let i = 1; i < points.length; i++) {
        const a = points[i - 1];
        const b = points[i];
        const length = manhattan(a, b);
        if (!best || length > best.length) best = { a, b, length };
      }
      if (!best) return;
      const mx = (best.a.x + best.b.x) / 2;
      const my = (best.a.y + best.b.y) / 2;
      const width = Math.max(62, label.length * 6.4 + 18);
      const rect = svgEl('rect', { x: mx - width / 2, y: my - 10, width, height: 20, rx: 7, class: 'edge-label-bg' });
      const text = svgEl('text', { x: mx, y: my + .5, class: 'edge-label' });
      text.textContent = label;
      edgeLayer.appendChild(rect);
      edgeLayer.appendChild(text);
    }

    function renderInspector() {
      const node = graph.nodes.find(item => item.id === selectedNodeId);
      if (!node) {
        inspector.innerHTML = `
          ${activeVariantId ? '<div class="variant-readonly-note">This tab is a materialized variant. Edit its semantic changes in the DSL.</div>' : ''}
          <div class="empty-state">Select a node to see its detail and edit it. The canvas intentionally shows only the node title.</div>
          <div class="divider"></div>
          <div class="legend">
            ${Object.keys(TYPE_COLUMNS).map(type => `<span>${iconSvg(type)}${escapeHtml(type)}</span>`).join('')}
          </div>
        `;
        return;
      }

      inspector.innerHTML = `
        ${activeVariantId ? '<div class="variant-readonly-note">Edit semantic changes in the DSL. Drag this node to save a position for this tab.</div>' : ''}
        <div class="inspector-summary">
          <span class="node-icon" aria-hidden="true">${iconSvg(node.type)}</span>
          <div><strong>${escapeHtml(node.title)}</strong><span>${escapeHtml(node.type)} · ${escapeHtml(node.id)}</span></div>
        </div>
        <div class="field">
          <label>ID</label>
          <input data-field="id" value="${escapeAttr(node.id)}" />
        </div>
        <div class="field">
          <label>Type</label>
          <select data-field="type">
            ${Object.keys(TYPE_COLUMNS).map(type => `<option value="${type}" ${type === node.type ? 'selected' : ''}>${type}</option>`).join('')}
          </select>
        </div>
        <div class="field">
          <label>Title</label>
          <input data-field="title" value="${escapeAttr(node.title)}" />
        </div>
        <div class="field">
          <label>Detail</label>
          <textarea data-field="body">${escapeHtml(node.body)}</textarea>
        </div>
        <div class="field">
          <label>Tags (comma separated)</label>
          <input data-field="tags" value="${escapeAttr(node.tags.join(', '))}" />
        </div>
        <div class="field-grid">
          <div class="field"><label>Column</label><input type="number" data-field="layout.column" value="${node.layout.column}" /></div>
          <div class="field"><label>Row</label><input type="number" step="0.5" data-field="layout.row" value="${node.layout.row}" /></div>
        </div>
        <div class="field-grid">
          <div class="field"><label>X</label><input type="number" data-field="position.x" value="${Math.round(node.position.x)}" /></div>
          <div class="field"><label>Y</label><input type="number" data-field="position.y" value="${Math.round(node.position.y)}" /></div>
        </div>
        <div class="small">Dragging changes <code>position</code>. Auto layout recomputes positions from <code>layout</code>.</div>
      `;

      inspector.querySelectorAll<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>('[data-field]').forEach(input => {
        if (activeVariantId) {
          input.disabled = true;
          return;
        }
        input.addEventListener('change', () => updateSelectedFromField(input.dataset.field, input.value));
        if (['title', 'body', 'tags'].includes(input.dataset.field)) {
          input.addEventListener('input', () => updateSelectedFromField(input.dataset.field, input.value, { rerenderInspector: false }));
        }
      });
    }

    function saveVariantPosition(nodeId: string, position: NodePosition) {
      const variant = flowDocument.variants.find(item => item.id === activeVariantId);
      if (!variant) return;
      const operation = variant.operations.find(item => item.kind === 'set-position' && item.nodeId === nodeId);
      if (operation?.kind === 'set-position') operation.position = clone(position);
      else variant.operations.push({ kind: 'set-position', nodeId, position: clone(position) });
    }

    function updateSelectedFromField(path, rawValue, { rerenderInspector = true } = {}) {
      const node = graph.nodes.find(item => item.id === selectedNodeId);
      if (!node) return;

      if (path === 'id') {
        const nextId = rawValue.trim();
        if (!nextId || graph.nodes.some(item => item.id === nextId && item !== node)) {
          renderInspector();
          return;
        }
        const oldId = node.id;
        node.id = nextId;
        graph.edges.forEach(edge => {
          if (edge.from === oldId) edge.from = nextId;
          if (edge.to === oldId) edge.to = nextId;
        });
        if (authoredLayoutHintIds.delete(oldId)) authoredLayoutHintIds.add(nextId);
        selectedNodeId = nextId;
      } else if (path === 'type') {
        node.type = TYPE_COLUMNS[rawValue] !== undefined ? rawValue : 'process';
        node.layout.column = TYPE_COLUMNS[node.type];
      } else if (path === 'tags') {
        node.tags = rawValue.split(',').map(value => value.trim()).filter(Boolean);
      } else if (path === 'layout.column') {
        node.layout.column = Number(rawValue) || 0;
        authoredLayoutHintIds.add(node.id);
      } else if (path === 'layout.row') {
        node.layout.row = Number(rawValue) || 0;
        authoredLayoutHintIds.add(node.id);
      } else if (path === 'position.x') {
        node.position.x = Number(rawValue) || 0;
      } else if (path === 'position.y') {
        node.position.y = Number(rawValue) || 0;
      } else {
        node[path] = rawValue;
      }

      elkRoutes.clear();
      elkLayoutActive = false;
      updateLayoutEngineLabel();
      renderNodes();
      renderLanes();
      scheduleEdgeRender();
      if (rerenderInspector) renderInspector();
      syncDslEditor();
    }

    function selectNode(id, { updateInspector = true } = {}) {
      selectedNodeId = id;
      nodeLayer.querySelectorAll<HTMLElement>('.node').forEach(el => el.classList.toggle('selected', el.dataset.id === id));
      if (updateInspector) renderInspector();
      updateToolbar();
    }

    function startNodeDrag(event, id) {
      if (event.button !== 0) return;
      event.preventDefault();
      event.stopPropagation();

      const node = graph.nodes.find(item => item.id === id);
      const el = event.currentTarget;
      if (!node || !el) return;

      // Important: selection does not re-render the node layer here. Pointer capture stays on the same DOM element.
      selectNode(id);
      el.setPointerCapture(event.pointerId);
      el.classList.add('dragging');

      dragState = {
        id,
        pointerId: event.pointerId,
        startClientX: event.clientX,
        startClientY: event.clientY,
        startX: node.position.x,
        startY: node.position.y,
        el,
        moved: false,
      };

      const onMove = (moveEvent) => {
        if (!dragState || moveEvent.pointerId !== dragState.pointerId) return;
        const dx = (moveEvent.clientX - dragState.startClientX) / zoom;
        const dy = (moveEvent.clientY - dragState.startClientY) / zoom;
        if (Math.abs(dx) + Math.abs(dy) > 2) {
          dragState.moved = true;
          if (elkRoutes.size || elkLayoutActive) {
            elkRoutes.clear();
            elkLayoutActive = false;
            updateLayoutEngineLabel();
          }
        }
        node.position.x = Math.round(dragState.startX + dx);
        node.position.y = Math.round(dragState.startY + dy);
        if (activeVariantId && dragState.moved) {
          saveVariantPosition(node.id, node.position);
          if (variantPositionSyncTimer) clearTimeout(variantPositionSyncTimer);
          variantPositionSyncTimer = setTimeout(() => {
            variantPositionSyncTimer = null;
            syncDslEditor();
          }, 120);
        }
        dragState.el.style.left = `${node.position.x}px`;
        dragState.el.style.top = `${node.position.y}px`;
        scheduleEdgeRender();
      };

      const onUp = (upEvent) => {
        if (!dragState || upEvent.pointerId !== dragState.pointerId) return;
        const state = dragState;
        state.el.classList.remove('dragging');
        if (state.el.hasPointerCapture(upEvent.pointerId)) state.el.releasePointerCapture(upEvent.pointerId);
        state.el.removeEventListener('pointermove', onMove);
        state.el.removeEventListener('pointerup', onUp);
        state.el.removeEventListener('pointercancel', onUp);
        dragState = null;
        if (activeVariantId && state.moved) saveVariantPosition(state.id, node.position);
        renderInspector();
        syncDslEditor();
        scheduleEdgeRender();
      };

      el.addEventListener('pointermove', onMove);
      el.addEventListener('pointerup', onUp);
      el.addEventListener('pointercancel', onUp);
    }

    async function autoLayout() {
      const button = $<HTMLButtonElement>('autoLayoutBtn');
      const originalText = button.textContent;
      button.disabled = true;
      button.textContent = 'Laying out…';

      try {
        const ElkConstructor = await loadElkConstructor();
        if (typeof ElkConstructor === 'function') {
          elkInstance ||= new ElkConstructor();
          await autoLayoutWithElk();
          elkLayoutActive = true;
          updateLayoutEngineLabel();
          renderAll();
          fitView(.58);
          return;
        }

        autoLayoutFallback();
        elkLayoutActive = false;
        elkRoutes.clear();
        updateLayoutEngineLabel('ELK unavailable · local layout');
        renderAll();
        fitView(.58);
      } catch (error) {
        console.warn('[flow] ELK layout failed; using local layout fallback.', error);
        autoLayoutFallback();
        elkLayoutActive = false;
        elkRoutes.clear();
        updateLayoutEngineLabel('ELK failed · local layout');
        renderAll();
        fitView(.58);
      } finally {
        button.disabled = false;
        button.textContent = originalText;
      }
    }

    async function loadElkConstructor() {
      elkConstructorPromise ||= import('elkjs/lib/elk.bundled.js')
        .then(module => module.default)
        .catch(() => null);
      return elkConstructorPromise;
    }

    async function autoLayoutWithElk() {
      const rects = getNodeRects();
      const nodesById = new Map(graph.nodes.map(node => [node.id, node]));
      const sortedNodes = [...graph.nodes].sort((a, b) =>
        a.layout.column - b.layout.column || a.layout.row - b.layout.row || a.id.localeCompare(b.id)
      );

      const elkGraph = {
        id: 'root',
        layoutOptions: {
          'elk.algorithm': 'layered',
          'elk.direction': 'RIGHT',
          'elk.edgeRouting': 'ORTHOGONAL',
          'elk.partitioning.activate': 'true',
          'elk.spacing.nodeNode': '18',
          'elk.spacing.edgeNode': '14',
          'elk.spacing.edgeEdge': '8',
          'elk.spacing.edgeLabel': '4',
          'elk.layered.spacing.nodeNodeBetweenLayers': '42',
          'elk.layered.spacing.edgeNodeBetweenLayers': '14',
          'elk.layered.spacing.edgeEdgeBetweenLayers': '8',
          'elk.layered.nodePlacement.strategy': 'BRANDES_KOEPF',
          'elk.layered.nodePlacement.favorStraightEdges': 'true',
          'elk.layered.crossingMinimization.forceNodeModelOrder': 'true',
          'elk.layered.considerModelOrder.strategy': 'NODES_AND_EDGES',
          'elk.layered.mergeEdges': 'false',
          'elk.layered.cycleBreaking.strategy': 'MODEL_ORDER',
        },
        children: sortedNodes.map(node => {
          const rect = rects.get(node.id) || { w: NODE_WIDTH, h: NODE_HEIGHT };
          return {
            id: node.id,
            width: rect.w,
            height: rect.h,
            layoutOptions: {
              'elk.partitioning.partition': String(clamp(Math.round(node.layout.column), 0, COLUMN_X.length - 1)),
              'elk.portConstraints': 'FIXED_SIDE',
            },
            ports: [
              elkPort(node.id, 'west', 'WEST'),
              elkPort(node.id, 'east', 'EAST'),
              elkPort(node.id, 'north', 'NORTH'),
              elkPort(node.id, 'south', 'SOUTH'),
            ],
          };
        }),
        edges: graph.edges
          .filter(edge => {
            const source = nodesById.get(edge.from);
            const target = nodesById.get(edge.to);
            if (!source || !target) return false;
            return target.layout.column >= source.layout.column;
          })
          .map(edge => {
          const source = nodesById.get(edge.from);
          const target = nodesById.get(edge.to);
          const ports = chooseElkPorts(source, target);
          const elkEdge: any = {
            id: edge.id,
            sources: [`${edge.from}::${ports.source}`],
            targets: [`${edge.to}::${ports.target}`],
          };
          if (edge.label) {
            elkEdge.labels = [{
              id: `${edge.id}::label`,
              text: edge.label,
              width: Math.max(62, edge.label.length * 6.4 + 18),
              height: 20,
            }];
          }
          return elkEdge;
        }),
      };

      console.info('[flow] ELK auto layout', {
        nodes: elkGraph.children.length,
        edges: elkGraph.edges.length,
        spacing: { node: 18, layers: 42 },
      });

      const result: any = await elkInstance.layout(elkGraph);
      const resultNodes = new Map<string, any>((result.children || []).map((node: any) => [node.id, node]));
      for (const node of graph.nodes) {
        const laidOut = resultNodes.get(node.id);
        if (!laidOut) continue;
        node.position.x = Math.round((laidOut.x || 0) + 46);
        node.position.y = Math.round((laidOut.y || 0) + 58);
      }

      // ELK places nodes. The local router owns all visible routes so it can
      // keep every edge in a separate lane after layout and manual movement.
      elkRoutes.clear();
    }

    function elkPort(nodeId, name, side) {
      return {
        id: `${nodeId}::${name}`,
        width: 1,
        height: 1,
        layoutOptions: { 'elk.port.side': side },
      };
    }

    function chooseElkPorts(source, target) {
      if (!source || !target) return { source: 'east', target: 'west' };
      const dc = target.layout.column - source.layout.column;
      if (dc > 0) return { source: 'east', target: 'west' };
      if (dc < 0) return { source: 'west', target: 'east' };
      const dr = target.layout.row - source.layout.row;
      return dr >= 0 ? { source: 'south', target: 'north' } : { source: 'north', target: 'south' };
    }

    function autoLayoutFallback() {
      const columns = new Map();
      for (const node of graph.nodes) {
        const column = clamp(Math.round(node.layout.column), 0, COLUMN_X.length - 1);
        if (!columns.has(column)) columns.set(column, []);
        columns.get(column).push(node);
      }

      for (const [column, nodes] of columns) {
        nodes.sort((a, b) => a.layout.row - b.layout.row || a.id.localeCompare(b.id));
        let previousBottom = -Infinity;
        for (const node of nodes) {
          const preferredY = MAIN_TOP + node.layout.row * ROW_GAP;
          const y = Math.max(preferredY, previousBottom + 18);
          node.position.x = COLUMN_X[column];
          node.position.y = Math.round(y);
          previousBottom = node.position.y + getNodeHeight(node.id);
        }
      }
    }

    function getNodeHeight(nodeId) {
      const el = nodeLayer.querySelector<HTMLElement>(`[data-id="${cssEscape(nodeId)}"]`);
      return el?.offsetHeight || NODE_HEIGHT;
    }

    function updateLayoutEngineLabel(message = null) {
      const el = $('layoutEngineLabel');
      if (!el) return;
      el.textContent = message || (elkLayoutActive ? 'ELK layout · separated local routes' : 'Separated local routes');
    }

    function fitView(minZoom = .34) {
      if (!graph.nodes.length) return;
      const rects = getNodeRects();
      const bounds = graph.nodes.reduce((acc, node) => {
        const rect = rects.get(node.id) || { w: NODE_WIDTH, h: NODE_HEIGHT };
        acc.minX = Math.min(acc.minX, node.position.x);
        acc.minY = Math.min(acc.minY, node.position.y);
        acc.maxX = Math.max(acc.maxX, node.position.x + rect.w);
        acc.maxY = Math.max(acc.maxY, node.position.y + rect.h);
        return acc;
      }, { minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity });

      const pad = 64;
      const vw = viewport.clientWidth;
      const vh = viewport.clientHeight;
      const contentW = bounds.maxX - bounds.minX;
      const contentH = bounds.maxY - bounds.minY;
      zoom = clamp(Math.min((vw - pad * 2) / contentW, (vh - pad * 2) / contentH), minZoom, 1.25);
      panX = pad - bounds.minX * zoom + Math.max(0, (vw - pad * 2 - contentW * zoom) / 2);
      panY = pad - bounds.minY * zoom + Math.max(0, (vh - pad * 2 - contentH * zoom) / 2);
      applyTransform();
    }

    function applyTransform() {
      world.style.transform = `translate(${panX}px, ${panY}px) scale(${zoom})`;
      $('zoomLabel').textContent = `${Math.round(zoom * 100)}%`;
    }

    function addNode(partial: Partial<CanvasNode> = {}) {
      if (activeVariantId) return null;
      const type: NodeType = partial.type && TYPE_COLUMNS[partial.type] !== undefined ? partial.type : 'process';
      const idBase = partial.id || type;
      let index = 1;
      let id = `${idBase}-${index}`;
      while (graph.nodes.some(node => node.id === id)) id = `${idBase}-${++index}`;

      const node = {
        id,
        type,
        title: partial.title || 'New node',
        body: partial.body || 'Describe the need, handoff, deliverable, process step, or UX consideration.',
        tags: partial.tags || [],
        layout: partial.layout || { column: TYPE_COLUMNS[type], row: graph.nodes.length % 7 },
        position: partial.position || { x: 900, y: 500 },
      };
      graph.nodes.push(node);
      if (partial.layout) authoredLayoutHintIds.add(node.id);
      elkRoutes.clear();
      elkLayoutActive = false;
      updateLayoutEngineLabel();
      selectedNodeId = node.id;
      renderAll();
      return node;
    }

    function addEdge(edge) {
      if (activeVariantId) return null;
      const next = {
        id: edge.id || `edge-${Date.now()}`,
        from: edge.from,
        to: edge.to,
        label: edge.label || '',
        emphasis: Boolean(edge.emphasis),
      };
      graph.edges.push(next);
      elkRoutes.clear();
      elkLayoutActive = false;
      updateLayoutEngineLabel();
      renderAll();
      return next;
    }

    function duplicateSelected() {
      if (activeVariantId) return;
      const source = graph.nodes.find(node => node.id === selectedNodeId);
      if (!source) return;
      const copy = clone(source);
      let n = 2;
      let id = `${source.id}-copy`;
      while (graph.nodes.some(node => node.id === id)) id = `${source.id}-copy-${n++}`;
      copy.id = id;
      copy.title = `${source.title} (copy)`;
      copy.position.x += 34;
      copy.position.y += 34;
      copy.layout.row += .25;
      graph.nodes.push(copy);
      if (authoredLayoutHintIds.has(source.id)) authoredLayoutHintIds.add(copy.id);
      elkRoutes.clear();
      elkLayoutActive = false;
      updateLayoutEngineLabel();
      selectedNodeId = copy.id;
      renderAll();
    }

    function deleteSelected() {
      if (activeVariantId) return;
      if (!selectedNodeId) return;
      graph.nodes = graph.nodes.filter(node => node.id !== selectedNodeId);
      graph.edges = graph.edges.filter(edge => edge.from !== selectedNodeId && edge.to !== selectedNodeId);
      authoredLayoutHintIds.delete(selectedNodeId);
      elkRoutes.clear();
      elkLayoutActive = false;
      updateLayoutEngineLabel();
      selectedNodeId = null;
      renderAll();
    }

    function applyDsl() {
      $('dslError').textContent = '';
      try {
        const parsed = parseGraphDsl(dslEditor.value);
        const hasPositions = Boolean(parsed.graph.layout?.positions && Object.keys(parsed.graph.layout.positions).length);
        flowDocument = parsed;
        activeVariantId = null;
        updateVariantUrl(null);
        includeDslPositions = hasPositions;
        authoredLayoutHintIds = extractLayoutHintIds(parsed.graph);
        updatePositionsDslButton();
        graph = normalizeGraph(parsed.graph);
        elkRoutes.clear();
        elkLayoutActive = false;
        updateLayoutEngineLabel();
        selectedNodeId = null;
        renderAll();
        if (hasPositions) fitView();
        else void autoLayout();
      } catch (error) {
        $('dslError').textContent = error instanceof Error ? error.message : String(error);
      }
    }

    function exportJson() {
      const blob = new Blob([JSON.stringify(toFlowDocument(), null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${graph.id || 'user-flow'}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    }

    function updateToolbar() {
      const hasSelection = Boolean(selectedNodeId);
      const variantActive = activeVariantId !== null;
      $<HTMLButtonElement>('addBtn').disabled = variantActive;
      $<HTMLButtonElement>('duplicateBtn').disabled = variantActive || !hasSelection;
      $<HTMLButtonElement>('deleteBtn').disabled = variantActive || !hasSelection;
      $<HTMLButtonElement>('positionsDslBtn').disabled = variantActive;
    }

    viewport.addEventListener('pointerdown', (event) => {
      if (event.button !== 0 || (event.target as Element).closest('.node')) return;
      selectedNodeId = null;
      nodeLayer.querySelectorAll('.node').forEach(el => el.classList.remove('selected'));
      renderInspector();
      updateToolbar();

      isPanning = true;
      viewport.classList.add('panning');
      viewport.setPointerCapture(event.pointerId);
      panStart = { x: event.clientX, y: event.clientY, panX, panY, pointerId: event.pointerId };
    });

    viewport.addEventListener('pointermove', (event) => {
      if (!isPanning || !panStart || event.pointerId !== panStart.pointerId) return;
      panX = panStart.panX + (event.clientX - panStart.x);
      panY = panStart.panY + (event.clientY - panStart.y);
      applyTransform();
    });

    function endPan(event) {
      if (!isPanning || !panStart || event.pointerId !== panStart.pointerId) return;
      isPanning = false;
      viewport.classList.remove('panning');
      if (viewport.hasPointerCapture(event.pointerId)) viewport.releasePointerCapture(event.pointerId);
      panStart = null;
    }
    viewport.addEventListener('pointerup', endPan);
    viewport.addEventListener('pointercancel', endPan);

    viewport.addEventListener('wheel', (event) => {
      event.preventDefault();
      const rect = viewport.getBoundingClientRect();
      const mx = event.clientX - rect.left;
      const my = event.clientY - rect.top;
      const worldX = (mx - panX) / zoom;
      const worldY = (my - panY) / zoom;

      // Continuous trackpad-friendly zoom. 0.0007 is ~30% less sensitive than the previous 0.001 baseline.
      const delta = clamp(event.deltaY, -120, 120);
      const factor = Math.exp(-delta * 0.0007);
      const nextZoom = clamp(zoom * factor, .28, 1.7);

      panX = mx - worldX * nextZoom;
      panY = my - worldY * nextZoom;
      zoom = nextZoom;
      applyTransform();
    }, { passive: false });

    $('autoLayoutBtn').addEventListener('click', autoLayout);
    $('fitBtn').addEventListener('click', () => fitView());
    $('addBtn').addEventListener('click', () => addNode());
    $('duplicateBtn').addEventListener('click', duplicateSelected);
    $('deleteBtn').addEventListener('click', deleteSelected);
    $('applyDslBtn').addEventListener('click', applyDsl);
    $('formatDslBtn').addEventListener('click', () => {
      try {
        const parsed = parseGraphDsl(dslEditor.value);
        includeDslPositions = Boolean(parsed.graph.layout?.positions && Object.keys(parsed.graph.layout.positions).length);
        updatePositionsDslButton();
        dslEditor.value = graphToDsl(parsed, { includePositions: includeDslPositions });
        $('dslError').textContent = '';
      } catch (error) {
        $('dslError').textContent = error instanceof Error ? error.message : String(error);
      }
    });
    $('copyDslBtn').addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(dslEditor.value);
        $('copyDslBtn').textContent = 'Copied';
        setTimeout(() => $('copyDslBtn').textContent = 'Copy', 900);
      } catch {
        dslEditor.select();
        document.execCommand('copy');
      }
    });
    $('positionsDslBtn').addEventListener('click', () => {
      includeDslPositions = !includeDslPositions;
      updatePositionsDslButton();
      syncDslEditor();
    });
    $('exportBtn').addEventListener('click', exportJson);
    $('resetBtn').addEventListener('click', () => {
      flowDocument = normalizeDocument(initialGraph);
      activeVariantId = null;
      updateVariantUrl(null);
      graph = normalizeGraph(flowDocument.graph);
      authoredLayoutHintIds = extractLayoutHintIds(flowDocument.graph);
      includeDslPositions = false;
      updatePositionsDslButton();
      elkRoutes.clear();
      elkLayoutActive = false;
      updateLayoutEngineLabel();
      selectedNodeId = null;
      renderAll();
      autoLayout();
    });

    window.addEventListener('keydown', (event) => {
      if (event.key === 'Delete' && selectedNodeId && !['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName)) deleteSelected();
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'd' && selectedNodeId) {
        event.preventDefault();
        duplicateSelected();
      }
    });

    variantTabs.addEventListener('keydown', (event) => {
      const buttons = [...variantTabs.querySelectorAll<HTMLButtonElement>('[role="tab"]')];
      const current = buttons.indexOf(document.activeElement as HTMLButtonElement);
      if (current < 0) return;
      let next = current;
      if (event.key === 'ArrowRight') next = (current + 1) % buttons.length;
      else if (event.key === 'ArrowLeft') next = (current - 1 + buttons.length) % buttons.length;
      else if (event.key === 'Home') next = 0;
      else if (event.key === 'End') next = buttons.length - 1;
      else return;
      event.preventDefault();
      buttons[next].focus();
      selectVariant(buttons[next].dataset.variantId || null);
    });

    window.addEventListener('popstate', () => {
      selectVariant(variantIdFromUrl(), { updateUrl: false });
    });

    (window as any).flow = {
      get: () => clone(toFlowDocument()),
      getGraph: () => clone(toFlowGraph()),
      set: (nextDocument) => {
        flowDocument = normalizeDocument(nextDocument);
        activeVariantId = null;
        updateVariantUrl(null);
        const hasPositions = Boolean(flowDocument.graph.layout?.positions && Object.keys(flowDocument.graph.layout.positions).length);
        graph = normalizeGraph(flowDocument.graph);
        authoredLayoutHintIds = extractLayoutHintIds(flowDocument.graph);
        elkRoutes.clear();
        elkLayoutActive = false;
        updateLayoutEngineLabel();
        selectedNodeId = null;
        renderAll();
        if (hasPositions) fitView();
        else void autoLayout();
        return clone(toFlowDocument());
      },
      addNode,
      addEdge,
      autoLayout,
      fitView,
      select: selectNode,
      parse: (source) => clone(parseGraphDsl(source)),
      validate: (source) => clone(parseGraphDslWithDiagnostics(source)),
      materialize: (variantId) => clone(materializeVariant(flowDocument, variantId)),
      selectVariant,
      activeVariant: () => activeVariantId,
      toDSL: (options = {}) => graphToDsl(toFlowDocument(), options),
      exportJSON: () => JSON.stringify(toFlowDocument(), null, 2),
      schema: {
        dslVersion: 2,
        schemaVersion: 4,
        nodeTypes: Object.keys(TYPE_COLUMNS),
        node: 'node <id> <type> "<title>" body="..." tags=["a","b"] layout=<column>,<row>',
        edge: 'edge <id> <from> -> <to> label="..." emphasis=true',
        position: 'position <node-id> <x>,<y> (optional)',
        variant: 'variant <id> "<title>" { add|remove|set|unset|position|clear all }',
      },
    };

    function restore() {
      let hasSavedGraph = false;
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        hasSavedGraph = Boolean(saved);
        flowDocument = normalizeDocument(saved ? JSON.parse(saved) : initialGraph);
        activeVariantId = variantIdFromUrl();
        const restoredGraph = activeVariantId ? materializeVariant(flowDocument, activeVariantId) : flowDocument.graph;
        graph = normalizeGraph(restoredGraph);
        authoredLayoutHintIds = extractLayoutHintIds(restoredGraph);
      } catch {
        flowDocument = normalizeDocument(initialGraph);
        activeVariantId = variantIdFromUrl();
        const restoredGraph = activeVariantId ? materializeVariant(flowDocument, activeVariantId) : flowDocument.graph;
        graph = normalizeGraph(restoredGraph);
        authoredLayoutHintIds = extractLayoutHintIds(restoredGraph);
      }
      updateLayoutEngineLabel();
      renderAll();
      requestAnimationFrame(() => hasSavedGraph ? fitView() : autoLayout());
    }

    function iconSvg(type) {
      const common = 'viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"';
      const icons = {
        actor: `<svg ${common}><circle cx="12" cy="7.5" r="3.2"/><path d="M5.5 20c.7-4.2 3-6.4 6.5-6.4s5.8 2.2 6.5 6.4"/></svg>`,
        need: `<svg ${common}><path d="M9 18h6"/><path d="M10 21h4"/><path d="M8.2 14.2A6 6 0 1 1 15.8 14c-1 .8-1.6 1.6-1.8 2.4h-4c-.2-.8-.8-1.5-1.8-2.2Z"/></svg>`,
        process: `<svg ${common}><rect x="4" y="5" width="16" height="14" rx="3"/><path d="m9 9 3 3-3 3"/><path d="M13 15h3"/></svg>`,
        handoff: `<svg ${common}><path d="M4 8h12"/><path d="m13 5 3 3-3 3"/><path d="M20 16H8"/><path d="m11 13-3 3 3 3"/></svg>`,
        deliverable: `<svg ${common}><path d="M7 3h7l4 4v14H7z"/><path d="M14 3v5h5"/><path d="M10 13h5"/><path d="M10 17h5"/></svg>`,
        ux: `<svg ${common}><path d="m5 4 12 8-6 1-3 6Z"/><path d="m13 13 4 5"/></svg>`,
        goal: `<svg ${common}><circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="4"/><path d="M12 4v4"/><path d="M20 12h-4"/></svg>`,
      };
      return icons[type] || icons.process;
    }

    function svgEl(tag, attrs) {
      const el = document.createElementNS('http://www.w3.org/2000/svg', tag);
      for (const [key, value] of Object.entries(attrs)) el.setAttribute(key, value);
      return el;
    }

    function clamp(value, min, max) { return Math.min(max, Math.max(min, value)); }
    function cssEscape(value) { return CSS.escape(String(value)); }
    function escapeHtml(value) {
      return String(value ?? '').replace(/[&<>'"]/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[char]));
    }
    function escapeAttr(value) { return escapeHtml(value).replace(/\n/g, '&#10;'); }
    restore();

  return () => {
    if (edgeRenderFrame) cancelAnimationFrame(edgeRenderFrame);
    delete (window as any).flow;
  };
}
