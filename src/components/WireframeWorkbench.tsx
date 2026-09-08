import { createEffect, createMemo, createSignal, For, onCleanup, onMount, Show } from "solid-js";
import type { WireframeDocument, WireframeElement, WireframeIcon, WireframeScreen, WireframeShot } from "../types/wireframe";

const EMBED_CAPTURE_RETRY_MS = 120;
const EMBED_CAPTURE_MAX_ATTEMPTS = 50;
const EMBED_CAPTURE_WAIT_MS = 15_000;

const iconGlyph: Record<WireframeIcon, string> = {
  add: "+", "calendar-add": "▣+", cart: "🛒", "chef-hat": "♨", "chevron-left": "‹", "chevron-right": "›",
  copy: "⧉", download: "⇩", edit: "✎", mic: "●", search: "⌕", sparkles: "✦", trash: "⌫", upload: "⇧",
};

function Icon(props: { name: WireframeIcon }) {
  return <span class={`wf-icon wf-icon-${props.name}`} data-icon={props.name} aria-hidden="true">{iconGlyph[props.name]}</span>;
}

function DiagramEmbed(props: { element: Extract<WireframeElement, { kind: "diagram" }>; marked?: boolean }) {
  const [svg, setSvg] = createSignal("");
  const [sceneStatus, setSceneStatus] = createSignal<"loading" | "ready" | "fallback">("loading");
  let frame!: HTMLIFrameElement;
  let retryTimer: number | undefined;
  let disposed = false;
  let attempts = 0;
  const retry = () => {
    attempts += 1;
    if (attempts >= EMBED_CAPTURE_MAX_ATTEMPTS) { setSceneStatus("fallback"); return; }
    retryTimer = window.setTimeout(capture, EMBED_CAPTURE_RETRY_MS);
  };
  const capture = () => {
    if (disposed) return;
    if (!frame?.contentWindow) { retry(); return; }
    const target = frame.contentWindow as Window & {
      flow?: { select?: (id: string | null) => void; selectVariant?: (id: string | null) => void; captureScene?: () => { svg: string } };
      flowOverview?: { select?: (id: string | null) => void; captureScene?: () => { svg: string } };
    };
    const api = target.flowOverview || target.flow;
    if (!api?.captureScene) { retry(); return; }
    try {
      if (props.element.view !== "base") target.flow?.selectVariant?.(props.element.view);
      api.select?.(props.element.focus || null);
      requestAnimationFrame(() => requestAnimationFrame(() => {
        if (disposed) return;
        try {
          setSvg(api.captureScene!().svg);
          setSceneStatus("ready");
        } catch {
          retry();
        }
      }));
    } catch {
      retry();
    }
  };
  onCleanup(() => { disposed = true; if (retryTimer !== undefined) window.clearTimeout(retryTimer); });
  return (
    <div class="wf-diagram" classList={{ "wf-marked": props.marked }} data-wf-id={props.element.id} data-wf-scene-status={sceneStatus()}>
      <Show when={svg()} fallback={<div class="wf-diagram-loading">{sceneStatus() === "fallback" ? `Embedded diagram unavailable: ${props.element.source}.` : `Rendering ${props.element.source}…`}</div>}>
        <div class="wf-diagram-svg" innerHTML={svg()} />
      </Show>
      <iframe ref={frame} title={`Renderer for ${props.element.source}`} src={`/?diagram=${encodeURIComponent(props.element.source)}&render=1${props.element.view !== "base" ? `&variant=${encodeURIComponent(props.element.view)}` : ""}`} onLoad={capture} />
    </div>
  );
}

function hasEmbeddedScene(document: WireframeDocument, screen: WireframeScreen) {
  const queue = [...screenElements(screen)];
  const visitedParts = new Set<string>();
  while (queue.length) {
    const element = queue.shift()!;
    if (element.kind === "diagram") return true;
    if (element.kind === "use" && !visitedParts.has(element.partId)) {
      visitedParts.add(element.partId);
      queue.push(...(document.parts.find(part => part.id === element.partId)?.children || []));
    }
    if (element.kind === "stack" || element.kind === "grid" || element.kind === "form" || element.kind === "panel" || element.kind === "popover") queue.push(...element.children);
    if (element.kind === "bar") queue.push(...element.start, ...element.end);
  }
  return false;
}

async function waitForEmbeddedScenes(required: boolean, timeoutMs = EMBED_CAPTURE_WAIT_MS) {
  if (!required) return;
  const deadline = Date.now() + timeoutMs;
  await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
  while (Date.now() < deadline) {
    const embeds = [...document.querySelectorAll<HTMLElement>("[data-wf-scene-status]")];
    if (embeds.length && embeds.every((embed) => embed.dataset.wfSceneStatus !== "loading")) return;
    await new Promise((resolve) => window.setTimeout(resolve, 50));
  }
}

interface ElementViewProps {
  element: WireframeElement;
  document: WireframeDocument;
  screen: WireframeScreen;
  shot?: WireframeShot;
  prefix: string;
  interactive: boolean;
  markedTargets: Set<string>;
  onGoto: (id: string) => void;
}

function placePopover(id: string | undefined, trigger: HTMLElement) {
  if (!id) return;
  const target = document.getElementById(id);
  if (!target) return;
  const rect = trigger.getBoundingClientRect();
  target.style.setProperty("--wf-popover-left", `${Math.max(12, Math.min(rect.left, window.innerWidth - 360))}px`);
  target.style.setProperty("--wf-popover-top", `${Math.min(rect.bottom + 8, window.innerHeight - 260)}px`);
}

function shotOverride(shot: WireframeShot | undefined, id: string) {
  return shot?.overrides?.find(override => override.target === id);
}

function overlayElement(element: WireframeElement, shot: WireframeShot | undefined): WireframeElement {
  const override = "id" in element && element.id ? shotOverride(shot, element.id) : undefined;
  if (!override) return element;
  if ("value" in override && (element.kind === "field" || element.kind === "select" || element.kind === "textarea")) return { ...element, value: override.value };
  if ("state" in override) {
    if (element.kind === "button") return { ...element, state: override.state as "selected" | "disabled" };
    if (element.kind === "link") return { ...element, disabled: override.state === "disabled" };
    if (element.kind === "select") return { ...element, state: override.state as "disabled" };
    if (element.kind === "toggle") return { ...element, state: override.state as "on" | "off" | "disabled" };
    if (element.kind === "checkbox") return { ...element, state: override.state as "checked" | "unchecked" | "disabled" };
    if (element.kind === "card") return { ...element, selected: override.state === "selected" };
  }
  return element;
}

function overlayListItem(item: Extract<WireframeElement, { kind: "list" }>['items'][number], shot: WireframeShot | undefined) {
  const override = shotOverride(shot, item.id);
  return override && "state" in override ? { ...item, state: override.state as "checked" | "unchecked" | "selected" } : item;
}

function overlayTab(tab: Extract<WireframeElement, { kind: "tabs" }>['tabs'][number], shot: WireframeShot | undefined) {
  const override = shotOverride(shot, tab.id);
  return override && "state" in override ? { ...tab, active: override.state === "active" } : tab;
}

function overlayRow(row: Extract<WireframeElement, { kind: "table" }>['rows'][number], shot: WireframeShot | undefined) {
  const override = shotOverride(shot, row.id);
  return override && "state" in override ? { ...row, state: override.state as "parent" | "child" | "selected" | "error" } : row;
}

function ElementView(props: ElementViewProps): any {
  const element = () => overlayElement(props.element, props.shot);
  const marked = (id?: string) => Boolean(id && props.markedTargets.has(id));
  const goto = (id?: string) => id && props.interactive ? props.onGoto(id) : undefined;
  const children = (items: WireframeElement[]) => <For each={items}>{(item) => <ElementView {...props} element={item} />}</For>;
  switch (element().kind) {
    case "stack": case "grid": case "form": {
      const container = element() as Extract<WireframeElement, { kind: "stack" | "grid" | "form" }>;
      if (container.kind === "form") return <div class="wf-form" classList={{ "labels-left": container.labels === "left", "wf-marked": marked(container.id) }} data-wf-id={container.id}>{children(container.children)}</div>;
      return <div class={`wf-${container.kind}`} classList={{ "wf-marked": marked(container.id) }} data-wf-id={container.id} style={container.kind === "grid" ? { "grid-template-columns": `repeat(${container.columns}, minmax(${container.min ?? 180}px, 1fr))` } : undefined}>{children(container.children)}</div>;
    }
    case "panel": { const panel = element() as Extract<WireframeElement, { kind: "panel" }>; return <div class="wf-panel" classList={{ "wf-marked": marked(panel.id) }} data-wf-id={panel.id}>{children(panel.children)}</div>; }
    case "bar": {
      const bar = element() as Extract<WireframeElement, { kind: "bar" }>;
      return <div class="wf-bar" classList={{ "wf-marked": marked(bar.id) }} data-wf-id={bar.id}><div class="wf-bar-start">{children(bar.start)}</div><div class="wf-bar-end">{children(bar.end)}</div></div>;
    }
    case "text": { const text = element() as Extract<WireframeElement, { kind: "text" }>; return <div class={`wf-text wf-${text.role}`}>{text.text}</div>; }
    case "badge": return <span class="wf-badge">{(element() as Extract<WireframeElement, { kind: "badge" }>).text}</span>;
    case "button": case "link": {
      const control = element() as Extract<WireframeElement, { kind: "button" | "link" }>;
      const popover = findPopover(props.document, props.screen, control.id);
      const targetId = popover ? `${props.prefix}-${popover.id}` : undefined;
      const disabled = control.kind === "button" ? control.state === "disabled" : control.disabled;
      const actionable = !disabled && Boolean(control.goto || popover);
      const icon = control.kind === "button" ? control.icon : undefined;
      const iconOnly = control.kind === "button" && control.iconOnly;
      return <button class={`wf-control wf-${control.kind}`} classList={{ "wf-sim-hover": props.shot?.hoverId === control.id, "wf-marked": marked(control.id), selected: control.kind === "button" && control.state === "selected", "variant-primary": control.kind === "button" && (control.variant || "secondary") === "primary", "variant-secondary": control.kind === "button" && (control.variant || "secondary") === "secondary", "variant-quiet": control.kind === "button" && control.variant === "quiet", destructive: control.kind === "button" && control.tone === "destructive", "icon-only": Boolean(iconOnly) }} type="button" disabled={disabled || !actionable} aria-disabled={!actionable} aria-label={iconOnly ? control.label : undefined} popovertarget={props.interactive && actionable ? targetId : undefined} onClick={(event) => { placePopover(targetId, event.currentTarget); goto(control.goto); }} data-wf-id={control.id}>{icon ? <Icon name={icon} /> : undefined}<span classList={{ "wf-control-label": true, "wf-visually-hidden": Boolean(iconOnly) }}>{control.label}</span></button>;
    }
    case "field": { const field = element() as Extract<WireframeElement, { kind: "field" }>; return <label class="wf-field" classList={{ "wf-marked": marked(field.id) }} data-wf-id={field.id}><span>{field.label}</span><span class="wf-field-control">{field.icon ? <Icon name={field.icon} /> : undefined}<input value={field.value || ""} aria-label={field.label} readOnly /></span></label>; }
    case "select": { const select = element() as Extract<WireframeElement, { kind: "select" }>; return <label class="wf-field wf-select" classList={{ disabled: select.state === "disabled", "wf-marked": marked(select.id) }} data-wf-id={select.id}><span>{select.label}</span><select value={select.value} aria-label={select.label} disabled><option>{select.value}</option></select></label>; }
    case "toggle": { const toggle = element() as Extract<WireframeElement, { kind: "toggle" }>; const disabled = toggle.state === "disabled"; return <div class="wf-toggle" classList={{ on: toggle.state === "on", disabled, "wf-marked": marked(toggle.id) }} data-wf-id={toggle.id} role="switch" aria-checked={toggle.state === "on"} aria-disabled="true" aria-label={toggle.label}><span class="wf-toggle-track"><span class="wf-toggle-thumb" /></span><span>{toggle.label}</span></div>; }
    case "checkbox": { const checkbox = element() as Extract<WireframeElement, { kind: "checkbox" }>; const checked = checkbox.state === "checked"; const disabled = checkbox.state === "disabled"; return <div class="wf-checkbox" classList={{ checked, disabled, "wf-marked": marked(checkbox.id) }} data-wf-id={checkbox.id} role="checkbox" aria-checked={checked} aria-disabled="true" aria-label={checkbox.label}><span class="wf-checkbox-box" aria-hidden="true">{checked ? "✓" : ""}</span><span>{checkbox.label}</span></div>; }
    case "textarea": { const textarea = element() as Extract<WireframeElement, { kind: "textarea" }>; return <label class="wf-field wf-textarea" classList={{ "wf-marked": marked(textarea.id) }} data-wf-id={textarea.id}><span>{textarea.label}</span><textarea value={textarea.value} aria-label={textarea.label} readOnly wrap="soft" /></label>; }
    case "card": {
      const card = element() as Extract<WireframeElement, { kind: "card" }>;
      const content = <><strong>{card.title}</strong><Show when={card.detail}><span>{card.detail}</span></Show></>;
      return card.goto
        ? <button class="wf-card" classList={{ selected: card.selected, "wf-marked": marked(card.id) }} type="button" onClick={() => goto(card.goto)} data-wf-id={card.id}>{content}</button>
        : <div class="wf-card wf-card-static" classList={{ selected: card.selected, "wf-marked": marked(card.id) }} data-wf-id={card.id}>{content}</div>;
    }
    case "notice": { const notice = element() as Extract<WireframeElement, { kind: "notice" }>; return <div class={`wf-notice ${notice.noticeKind}`} classList={{ "wf-marked": marked(notice.id) }} data-wf-id={notice.id}><strong>{notice.title}</strong><Show when={notice.detail}><span>{notice.detail}</span></Show></div>; }
    case "popover": {
      const popover = element() as Extract<WireframeElement, { kind: "popover" }>;
      return <div id={`${props.prefix}-${popover.id}`} class="wf-popover" classList={{ "force-open": props.shot?.openPopoverId === popover.id, "wf-marked": marked(popover.id) }} popover={props.interactive ? "auto" : undefined} data-wf-id={popover.id}>{children(popover.children)}</div>;
    }
    case "rule": return <hr class="wf-rule" />;
    case "tabs": { const tabs = element() as Extract<WireframeElement, { kind: "tabs" }>; return <div class="wf-tabs" role="tablist" classList={{ "wf-marked": marked(tabs.id) }} data-wf-id={tabs.id}><For each={tabs.tabs}>{baseTab => { const tab = overlayTab(baseTab, props.shot); return <button type="button" role="tab" disabled={!tab.goto} aria-disabled={!tab.goto} aria-selected={tab.active} classList={{ active: tab.active, "wf-marked": marked(tab.id) }} data-wf-id={tab.id} onClick={() => goto(tab.goto)}>{tab.label}</button>; }}</For></div>; }
    case "list": {
      const list = element() as Extract<WireframeElement, { kind: "list" }>;
      const itemContent = (item: (typeof list.items)[number]) => <><span class="wf-list-copy"><strong>{item.label}</strong><Show when={item.detail}><span>{item.detail}</span></Show></span><Show when={item.state === "checked" || item.state === "unchecked"}><span class="wf-list-check" aria-hidden="true">{item.state === "checked" ? "✓" : ""}</span></Show><Show when={item.action === "remove"}><span class="wf-list-remove" role="img" aria-label={`Remove ${item.label}`}>×</span></Show></>;
      const items = () => <For each={list.items}>{baseItem => { const item = overlayListItem(baseItem, props.shot); return <li classList={{ selected: item.state === "selected" || item.state === "checked", "wf-marked": marked(item.id) }} data-wf-id={item.id}><Show when={item.goto} fallback={<div class="wf-list-item">{itemContent(item)}</div>}><button type="button" class="wf-list-item" onClick={() => goto(item.goto)}>{itemContent(item)}</button></Show></li>; }}</For>;
      return list.mode === "ordered" ? <ol class="wf-list wf-list-ordered" classList={{ "wf-marked": marked(list.id) }} data-wf-id={list.id}>{items()}</ol> : <ul class="wf-list" classList={{ "wf-list-checkable": list.mode === "checkable", "wf-marked": marked(list.id) }} data-wf-id={list.id}>{items()}</ul>;
    }
    case "table": { const table = element() as Extract<WireframeElement, { kind: "table" }>; return <div class="wf-table-wrap" classList={{ "wf-marked": marked(table.id) }} data-wf-id={table.id}><table class="wf-table"><thead><tr><For each={table.columns}>{column => <th scope="col">{column.label}</th>}</For></tr></thead><tbody><For each={table.rows}>{baseRow => { const row = overlayRow(baseRow, props.shot); return <tr classList={{ [`wf-row-${row.state}`]: Boolean(row.state), "wf-row-linked": Boolean(row.goto), "wf-marked": marked(row.id) }} data-wf-id={row.id} onClick={() => goto(row.goto)}><For each={table.columns}>{column => { const cell = row.cells[column.id]; if (typeof cell !== "object") return <td>{cell || "—"}</td>; const popover = findPopover(props.document, props.screen, cell.actionId); const targetId = popover ? `${props.prefix}-${popover.id}` : undefined; return <td class="wf-table-action"><button type="button" classList={{ "wf-marked": marked(cell.actionId) }} data-wf-id={cell.actionId} disabled={!targetId} aria-label={`Actions for ${row.id}`} popovertarget={props.interactive ? targetId : undefined} onClick={(event) => { event.stopPropagation(); placePopover(targetId, event.currentTarget); }}>•••</button></td>; }}</For></tr>; }}</For></tbody></table></div>; }
    case "use": { const use = element() as Extract<WireframeElement, { kind: "use" }>; const part = props.document.parts.find(candidate => candidate.id === use.partId); return <div class="wf-use" classList={{ "wf-marked": marked(use.id) }} data-wf-id={use.id}>{children(part?.children || [])}</div>; }
    case "diagram": { const diagram = element() as Extract<WireframeElement, { kind: "diagram" }>; return <DiagramEmbed element={diagram} marked={marked(diagram.id)} />; }
  }
}

function screenElements(screen: WireframeScreen): WireframeElement[] {
  return screen.frame.kind === "page" ? screen.frame.body : [screen.frame.header, screen.frame.top, screen.frame.main, screen.frame.aside, ...(screen.frame.footer ? [screen.frame.footer] : [])].flat();
}

function findPopover(document: WireframeDocument, screen: WireframeScreen, triggerId: string) {
  const queue = [...screenElements(screen)];
  const visitedParts = new Set<string>();
  while (queue.length) {
    const element = queue.shift()!;
    if (element.kind === "popover" && element.triggerId === triggerId) return element;
    if (element.kind === "use" && !visitedParts.has(element.partId)) {
      visitedParts.add(element.partId);
      queue.push(...(document.parts.find(part => part.id === element.partId)?.children || []));
    }
    if (element.kind === "stack" || element.kind === "grid" || element.kind === "form" || element.kind === "panel" || element.kind === "popover") queue.push(...element.children);
    if (element.kind === "bar") queue.push(...element.start, ...element.end);
  }
}

function ScreenView(props: { document: WireframeDocument; screen: WireframeScreen; shot?: WireframeShot; prefix: string; interactive: boolean; contentFit?: boolean; showInteractions?: boolean; showMarks?: boolean; markedTargets: Set<string>; rootRef?: (element: HTMLDivElement) => void; onGoto: (id: string) => void }) {
  const render = (items: WireframeElement[]) => <For each={items}>{element => <ElementView element={element} {...props} />}</For>;
  const frame = props.screen.frame;
  return <div ref={props.rootRef} class={`wf-screen wf-frame-${frame.kind}`} classList={{ "wf-content-fit": Boolean(props.contentFit), "wf-show-interactions": props.showInteractions, "wf-show-marks": props.showMarks, "has-footer": frame.kind === "workbench" && Boolean(frame.footer?.length) }} style={{ width: `${props.document.viewport.width}px`, height: props.contentFit ? "auto" : `${props.document.viewport.height}px`, ...(frame.kind === "workbench" ? { "grid-template-columns": `minmax(560px, 1fr) ${frame.inspector}px` } : {}) }}>
    <Show when={frame.kind === "page"} fallback={
      <><header class="wf-region-header" classList={{ "wf-marked": props.markedTargets.has("header") }} data-wf-id="header">{render((frame as Extract<typeof frame, { kind: "workbench" }>).header)}</header><div class="wf-region-top" classList={{ "wf-marked": props.markedTargets.has("top") }} data-wf-id="top">{render((frame as Extract<typeof frame, { kind: "workbench" }>).top)}</div><main class="wf-region-main" classList={{ "wf-marked": props.markedTargets.has("main") }} data-wf-id="main">{render((frame as Extract<typeof frame, { kind: "workbench" }>).main)}</main><aside class="wf-region-aside" classList={{ "wf-marked": props.markedTargets.has("aside") }} data-wf-id="aside">{render((frame as Extract<typeof frame, { kind: "workbench" }>).aside)}</aside><Show when={(frame as Extract<typeof frame, { kind: "workbench" }>).footer?.length}><footer class="wf-region-footer" classList={{ "wf-marked": props.markedTargets.has("footer") }} data-wf-id="footer">{render((frame as Extract<typeof frame, { kind: "workbench" }>).footer || [])}</footer></Show></>
    }><main class="wf-page" classList={{ "wf-marked": props.markedTargets.has("body") }} data-wf-id="body"><div class="wf-page-panel" style={{ "max-width": `${(frame as Extract<typeof frame, { kind: "page" }>).content}px` }}>{render((frame as Extract<typeof frame, { kind: "page" }>).body)}</div></main></Show>
  </div>;
}

export function WireframeWorkbench(props: { document: WireframeDocument }) {
  const [screenId, setScreenId] = createSignal(props.document.screens[0]?.id || "");
  const screen = createMemo(() => props.document.screens.find(candidate => candidate.id === screenId()) || props.document.screens[0]);
  const reference = createMemo(() => props.document.references.find(candidate => candidate.id === screen()?.referenceId));
  const [shotId, setShotId] = createSignal("rest");
  const [scale, setScale] = createSignal(1);
  const [displayMode, setDisplayMode] = createSignal<"content" | "viewport">("content");
  const [showInteractions, setShowInteractions] = createSignal(false);
  const [showMarks, setShowMarks] = createSignal(false);
  const [referenceMode, setReferenceMode] = createSignal<"mockup" | "actual" | "compare">("mockup");
  const [screenNotice, setScreenNotice] = createSignal<string>();
  const [renderHeight, setRenderHeight] = createSignal(props.document.viewport.height);
  let app!: HTMLElement;
  let viewport!: HTMLDivElement;
  let sceneElement!: HTMLDivElement;
  const measure = () => setRenderHeight(displayMode() === "content" ? sceneElement?.scrollHeight || props.document.viewport.height : props.document.viewport.height);
  const fit = () => { setScale(Math.min(1, Math.max(.2, (viewport.clientWidth - 2) / props.document.viewport.width))); requestAnimationFrame(measure); };
  onMount(() => {
    const syncLocation = () => {
      const queryScreen = new URLSearchParams(window.location.search).get("screen");
      const hashScreen = window.location.hash.slice(1);
      const requested = queryScreen || hashScreen;
      const firstScreen = props.document.screens[0]?.id || "";
      if (!requested) { setScreenId(firstScreen); setScreenNotice(undefined); return; }
      if (props.document.screens.some((candidate) => candidate.id === requested)) { setScreenId(requested); setScreenNotice(undefined); return; }
      setScreenId(firstScreen);
      setScreenNotice(`Screen "${requested}" is no longer available. Showing the first screen.`);
      const url = new URL(window.location.href);
      url.searchParams.delete("screen");
      url.hash = "";
      window.history.replaceState(window.history.state, "", url);
    };
    syncLocation();
    fit();
    window.addEventListener("resize", fit);
    window.addEventListener("popstate", syncLocation);
    window.addEventListener("hashchange", syncLocation);
    onCleanup(() => { window.removeEventListener("resize", fit); window.removeEventListener("popstate", syncLocation); window.removeEventListener("hashchange", syncLocation); });
    const readyWindow = window as Window & { __flowWorkbenchReady?: { status: "loading" | "ready"; layoutEngine?: "css-board" } };
    readyWindow.__flowWorkbenchReady = { status: "loading" };
    void (async () => {
      await waitForEmbeddedScenes(Boolean(screen() && hasEmbeddedScene(props.document, screen()!)));
      await new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
      readyWindow.__flowWorkbenchReady = { status: "ready", layoutEngine: "css-board" };
    })();
  });
  createEffect(() => { screenId(); setShotId(screen()?.shots[0]?.id || "rest"); setShowInteractions(false); setShowMarks(false); requestAnimationFrame(() => { if (app) { app.scrollTop = 0; app.scrollLeft = 0; } if (viewport) { viewport.scrollTop = 0; viewport.scrollLeft = 0; } measure(); }); });
  createEffect(() => { displayMode(); requestAnimationFrame(measure); });
  createEffect(() => { if (!reference()) setReferenceMode("mockup"); });
  createEffect(() => { referenceMode(); requestAnimationFrame(() => viewport && fit()); });
  const navigate = (id: string) => { if (!props.document.screens.some((candidate) => candidate.id === id)) return; setScreenId(id); const url = new URL(window.location.href); url.searchParams.delete("screen"); url.hash = id; window.history.pushState(null, "", url); };
  return <main ref={app} class="wireframe-app" classList={{ "wireframe-theme-default": props.document.theme === "default", "wireframe-theme-recipe": props.document.theme === "recipe" }}>
    <header class="wireframe-toolbar"><span class="wireframe-source-status">Wireframe</span><nav aria-label="Wireframe screens"><For each={props.document.screens}>{item => <button type="button" aria-pressed={item.id === screen()?.id} onClick={() => navigate(item.id)}>{item.title}</button>}</For></nav></header>
    <Show when={screen()} keyed>{current => <>
      <section class="wireframe-statebar"><div><strong>{current.title}</strong><span>{current.basis} · {props.document.viewport.width} × {props.document.viewport.height}</span></div><div class="wireframe-view-controls"><Show when={reference()}><div class="wireframe-shots" aria-label="Reference view"><For each={(["mockup", "actual", "compare"] as const)}>{mode => <button type="button" aria-pressed={referenceMode() === mode} onClick={() => setReferenceMode(mode)}>{mode}</button>}</For></div></Show><Show when={referenceMode() !== "actual"}><div class="wireframe-shots" aria-label="Canvas sizing"><button type="button" aria-pressed={displayMode() === "content"} onClick={() => setDisplayMode("content")}>Content fit</button><button type="button" aria-pressed={displayMode() === "viewport"} onClick={() => setDisplayMode("viewport")}>Full viewport</button></div></Show><Show when={referenceMode() !== "actual"}><button class="wireframe-interactions" type="button" aria-pressed={showInteractions()} onClick={() => setShowInteractions(value => !value)}>{showInteractions() ? "Hide interactions" : "Highlight interactions"}</button><Show when={current.marks.length}><button class="wireframe-annotations" type="button" aria-pressed={showMarks()} onClick={() => setShowMarks(value => !value)}>{showMarks() ? "Hide changes" : "Show changes"}</button></Show></Show><Show when={current.shots.length && referenceMode() !== "actual"}><div class="wireframe-shots" aria-label="Disclosure state"><For each={current.shots}>{item => <button type="button" aria-pressed={shotId() === item.id} onClick={() => setShotId(item.id)}>{item.id.replaceAll("-", " ")}</button>}</For></div></Show></div></section>
      <Show when={screenNotice()}><div class="wireframe-screen-notice" role="status">{screenNotice()}</div></Show>
      <Show when={showMarks() && referenceMode() !== "actual"}><section class="wireframe-mark-review" aria-label="Authored changes"><strong>Authored changes</strong><ol><For each={current.marks}>{mark => <li><code>{mark.target}</code><span>{mark.reason}</span></li>}</For></ol></section></Show>
      <div class="wireframe-stage" classList={{ "with-reference": Boolean(reference() && referenceMode() === "compare"), "reference-only": Boolean(reference() && referenceMode() === "actual") }}>
        <Show when={referenceMode() !== "mockup" ? reference() : undefined}>{actual => <figure class="wireframe-reference"><figcaption><strong>Actual site</strong><span>{actual().state || actual().captured || "Reference"}</span></figcaption><a href={`/api/reference?path=${encodeURIComponent(actual().image)}`} target="_blank" rel="noreferrer"><img src={`/api/reference?path=${encodeURIComponent(actual().image)}`} width={actual().width} height={actual().height} alt={`Actual site reference for ${current.title}`} /></a></figure>}</Show>
        <Show when={referenceMode() !== "actual"}><div class="wireframe-viewport" ref={viewport}><div class="wireframe-scaled" style={{ width: `${props.document.viewport.width * scale()}px`, height: `${renderHeight() * scale()}px` }}><div class="wireframe-transform" style={{ transform: `scale(${scale()})`, "transform-origin": "top left" }}><Show when={shotId()} keyed>{selectedShotId => <ScreenView document={props.document} screen={current} shot={current.shots.find(candidate => candidate.id === selectedShotId)} prefix="live" interactive contentFit={displayMode() === "content"} showInteractions={showInteractions()} showMarks={showMarks()} markedTargets={new Set(current.marks.map(mark => mark.target))} rootRef={element => { sceneElement = element; requestAnimationFrame(measure); }} onGoto={navigate} />}</Show></div></div></div></Show>
      </div>
    </>}</Show>
  </main>;
}
