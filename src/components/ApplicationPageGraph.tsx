import { createEffect, createMemo, createSignal, createUniqueId, For, onCleanup, onMount, Show } from "solid-js";
import { applicationNetwork, edgeMarkerPosition, fallbackApplicationLayout, fallbackApplicationNetwork, layoutApplicationNetwork, layoutApplicationPages } from "../lib/application-layout";
import { createGraphCamera, fitCamera } from "../lib/graph-camera";
import type { ApplicationDocument } from "../types/application";

function EdgeMarker(props: { number: number; label: string; x: number; y: number; kind?: string }) {
  const id = `edge-label-${createUniqueId()}`;
  let button!: HTMLButtonElement;
  let tooltip!: HTMLDivElement;
  const show = () => {
    tooltip.showPopover();
    const rect = button.getBoundingClientRect();
    tooltip.style.left = `${Math.max(8, Math.min(rect.left + rect.width / 2 - tooltip.offsetWidth / 2, window.innerWidth - tooltip.offsetWidth - 8))}px`;
    tooltip.style.top = `${Math.max(8, Math.min(rect.bottom, window.innerHeight - tooltip.offsetHeight - 8))}px`;
  };
  const hide = (event: FocusEvent | MouseEvent) => {
    if (event.relatedTarget instanceof Node && (button.contains(event.relatedTarget) || tooltip.contains(event.relatedTarget))) return;
    if (event.type === "mouseleave" && document.activeElement === button) return;
    tooltip.hidePopover();
  };
  return <>
    <button ref={button} class={`application-edge-marker ${props.kind || "navigation"}`} style={{ left: `${props.x}px`, top: `${props.y}px` }} type="button" aria-label={`Relationship ${props.number}: ${props.label}`} aria-describedby={id} onMouseEnter={show} onMouseLeave={hide} onFocus={show} onBlur={hide} onClick={show}>{props.number}</button>
    <div ref={tooltip} id={id} class="application-edge-tooltip" role="tooltip" popover="auto" onMouseLeave={hide}>{props.label}</div>
  </>;
}

export function ApplicationPageGraph(props: { document: ApplicationDocument; network?: boolean; selectedPageId?: string; selectedObjectId?: string; onSelect: (id: string) => void; onSelectObject?: (id: string) => void; onReady: (ready: boolean) => void }) {
  const fallback = () => props.network ? fallbackApplicationNetwork(props.document) : fallbackApplicationLayout(props.document);
  const [layout, setLayout] = createSignal(fallback());
  let viewport!: HTMLDivElement;
  const controls = createGraphCamera(() => viewport, () => Boolean(props.network), () => fit());
  const scale = () => controls.camera().scale;
  const markerId = `page-arrow-${createUniqueId()}`;
  const graph = createMemo(() => props.network ? applicationNetwork(props.document) : {
    nodes: props.document.pages.map((page) => ({ id: page.id, sourceId: page.id, title: page.title, kind: "page" as const })),
    edges: props.document.navigation.map((edge) => ({ id: edge.id, fromPageId: edge.fromPageId, toPageId: edge.toPageId, kind: "navigation" as const, label: `${edge.trigger}${edge.condition ? ` · ${edge.condition}` : ""}` })),
  });
  const nodes = createMemo(() => {
    const positions = new Map((layout().children || []).map((node) => [node.id, node]));
    return graph().nodes.map((item) => ({ ...item, position: positions.get(item.id) }))
      .sort((a, b) => (a.position?.x || 0) - (b.position?.x || 0) || (a.position?.y || 0) - (b.position?.y || 0));
  });
  const edgeMarkers = createMemo(() => {
    const occupied: { x: number; y: number }[] = [];
    return (layout().edges || []).map((edge) => {
      const position = edgeMarkerPosition(edge, props.network ? layout().children : [], occupied);
      occupied.push(position);
      return { edge, position };
    });
  });
  const fit = () => {
    controls.dismissLabels();
    controls.setCamera(props.network ? fitCamera(layout().width || 1, layout().height || 1, viewport.clientWidth, viewport.clientHeight) : { x: 0, y: 0, scale: 1 });
  };
  onMount(() => {
    const resize = () => {
      if (!props.network) return;
      const main = viewport.closest(".application-main")!;
      const available = window.innerHeight - viewport.getBoundingClientRect().top - main.scrollTop - 24;
      viewport.style.setProperty("--network-height", `${Math.max(240, available)}px`);
    };
    const observer = new ResizeObserver(() => { resize(); if (props.network) fit(); });
    window.addEventListener("resize", resize);
    onCleanup(() => window.removeEventListener("resize", resize));
    observer.observe(viewport);
    onCleanup(() => observer.disconnect());
    createEffect(() => {
      const document = props.document;
      const network = props.network;
      let active = true;
      onCleanup(() => { active = false; });
      props.onReady(false);
      setLayout(fallback());
      resize();
      void (network ? layoutApplicationNetwork(document) : layoutApplicationPages(document)).then((result) => {
        if (active) { setLayout(result); fit(); }
      }).catch((error) => console.warn("Application layout failed; using authored order.", error))
        .finally(() => { if (active) requestAnimationFrame(() => { if (active) { fit(); props.onReady(true); } }); });
    });
  });
  return <>
    <Show when={props.network}><div class="application-network-tools">
      <div class="application-network-legend" aria-label="Network key"><span class="page">Page</span><span class="object">Object</span><Show when={graph().nodes.some((node) => node.kind === "application")}><span class="application">Application</span></Show><span class="navigation">Navigation →</span><Show when={props.document.ownership.length}><span class="ownership">Owns →</span></Show><span class="primary">Primary object ⇢</span></div>
      <div class="application-network-zoom"><button class="btn" type="button" aria-label="Zoom out" onClick={() => controls.zoom(.8)}>−</button><button class="btn" type="button" onClick={fit}>Fit</button><button class="btn" type="button" aria-label="Zoom in" onClick={() => controls.zoom(1.25)}>+</button></div>
    </div></Show>
    <div ref={viewport} class="application-graph-scroll" classList={{ "application-network-viewport": props.network, panning: controls.panning() }} role="region" aria-label={props.network ? "Pages and objects network" : "Page graph, flows left to right"} tabIndex={0} aria-description={props.network ? "Drag the background to pan. Scroll or pinch to zoom. Arrow keys pan; plus and minus zoom; zero fits the graph." : undefined}>
      <Show when={graph().nodes.length} fallback={<p class="application-muted">No pages authored yet.</p>}>
      <div style={{ width: props.network ? "100%" : `${layout().width || 196}px`, height: props.network ? "100%" : `${layout().height || 104}px`, overflow: "hidden" }}>
      <div class="application-graph-scene" style={{ width: `${layout().width || 196}px`, height: `${layout().height || 104}px`, transform: `translate(${controls.camera().x}px, ${controls.camera().y}px) scale(${scale()})`, "transform-origin": "top left", "--graph-scale": scale() }}>
        <svg class="application-graph-edges" width={layout().width} height={layout().height} aria-hidden="true">
          <defs><marker id={markerId} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" fill="context-stroke" /></marker></defs>
          <For each={layout().edges}>{(edge) => <For each={edge.sections}>{(section) => <polyline class={graph().edges.find((item) => item.id === edge.id)?.kind} points={[section.startPoint, ...(section.bendPoints || []), section.endPoint].map((point) => `${point.x},${point.y}`).join(" ")} fill="none" stroke="currentColor" stroke-width="1.5" marker-end={`url(#${markerId})`} />}</For>}</For>
          <For each={edgeMarkers()}>{({ edge, position }) => <Show when={position.anchor}>{(anchor) => <line class={graph().edges.find((item) => item.id === edge.id)?.kind} x1={anchor().x} y1={anchor().y} x2={position.x} y2={position.y} stroke="currentColor" stroke-width="1" />}</Show>}</For>
        </svg>
        <For each={nodes()}>{(node) => {
          const style = { left: `${node.position?.x || 0}px`, top: `${node.position?.y || 0}px`, width: `${node.position?.width || 148}px`, height: `${node.position?.height || 72}px` };
          const selected = () => node.kind === "object" ? props.selectedObjectId === node.sourceId : !props.selectedObjectId && props.selectedPageId === node.sourceId;
          return <Show when={node.kind !== "application"} fallback={<div class="application-page-node application" style={style}><strong>{node.title}</strong></div>}>
            <button class={`application-page-node ${node.kind}`} classList={{ selected: selected() }} style={style} type="button" aria-label={props.network ? `${node.kind === "object" ? "Object" : "Page"}: ${node.title}` : undefined} aria-pressed={selected()} onClick={() => node.kind === "object" ? props.onSelectObject?.(node.sourceId) : props.onSelect(node.sourceId)}><strong>{node.title}</strong></button>
          </Show>;
        }}</For>
        <For each={edgeMarkers()}>{({ edge, position }) => {
          const index = graph().edges.findIndex((item) => item.id === edge.id);
          const relationship = graph().edges[index];
          const title = (id: string) => graph().nodes.find((node) => node.id === id)?.title || id;
          return <Show when={relationship}><EdgeMarker number={index + 1} kind={relationship?.kind} label={props.network ? `${title(relationship.fromPageId)} → ${title(relationship.toPageId)} · ${relationship.label}` : relationship?.label} x={position.x} y={position.y} /></Show>;
        }}</For>
      </div>
      </div>
      </Show>
    </div>
  </>;
}
