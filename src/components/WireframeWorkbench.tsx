import { createEffect, createMemo, createSignal, For, onCleanup, onMount, Show } from "solid-js";
import type { WireframeDocument, WireframeElement, WireframeIcon, WireframeScreen, WireframeShot } from "../types/wireframe";

const iconGlyph: Record<WireframeIcon, string> = {
  add: "+", "calendar-add": "▣+", cart: "🛒", "chef-hat": "♨", "chevron-left": "‹", "chevron-right": "›",
  copy: "⧉", edit: "✎", search: "⌕", sparkles: "✦", trash: "⌫",
};

function Icon(props: { name: WireframeIcon }) {
  return <span class={`wf-icon wf-icon-${props.name}`} data-icon={props.name} aria-hidden="true">{iconGlyph[props.name]}</span>;
}

function DiagramEmbed(props: { element: Extract<WireframeElement, { kind: "diagram" }> }) {
  const [svg, setSvg] = createSignal("");
  let frame!: HTMLIFrameElement;
  const capture = () => {
    const target = frame.contentWindow as Window & {
      flow?: { select?: (id: string | null) => void; selectVariant?: (id: string | null) => void; captureScene?: () => { svg: string } };
      flowOverview?: { select?: (id: string | null) => void; captureScene?: () => { svg: string } };
    };
    const api = target.flowOverview || target.flow;
    if (!api?.captureScene) return window.setTimeout(capture, 120);
    if (props.element.view !== "base") target.flow?.selectVariant?.(props.element.view);
    api.select?.(props.element.focus || null);
    requestAnimationFrame(() => requestAnimationFrame(() => setSvg(api.captureScene!().svg)));
  };
  return (
    <div class="wf-diagram" data-wf-id={props.element.id}>
      <Show when={svg()} fallback={<div class="wf-diagram-loading">Rendering {props.element.source}…</div>}>
        <div class="wf-diagram-svg" innerHTML={svg()} />
      </Show>
      <iframe ref={frame} title={`Renderer for ${props.element.source}`} src={`/?diagram=${encodeURIComponent(props.element.source)}&render=1${props.element.view !== "base" ? `&variant=${encodeURIComponent(props.element.view)}` : ""}`} onLoad={capture} />
    </div>
  );
}

interface ElementViewProps {
  element: WireframeElement;
  document: WireframeDocument;
  screen: WireframeScreen;
  shot?: WireframeShot;
  prefix: string;
  interactive: boolean;
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

function ElementView(props: ElementViewProps): any {
  const element = () => props.element;
  const goto = (id?: string) => id && props.interactive ? props.onGoto(id) : undefined;
  const children = (items: WireframeElement[]) => <For each={items}>{(item) => <ElementView {...props} element={item} />}</For>;
  switch (element().kind) {
    case "stack": case "grid": case "form": {
      const container = element() as Extract<WireframeElement, { kind: "stack" | "grid" | "form" }>;
      if (container.kind === "form") return <div class="wf-form" classList={{ "labels-left": container.labels === "left" }} data-wf-id={container.id}>{children(container.children)}</div>;
      return <div class={`wf-${container.kind}`} data-wf-id={container.id} style={container.kind === "grid" ? { "grid-template-columns": `repeat(${container.columns}, minmax(${container.min ?? 180}px, 1fr))` } : undefined}>{children(container.children)}</div>;
    }
    case "panel": { const panel = element() as Extract<WireframeElement, { kind: "panel" }>; return <div class="wf-panel" data-wf-id={panel.id}>{children(panel.children)}</div>; }
    case "bar": {
      const bar = element() as Extract<WireframeElement, { kind: "bar" }>;
      return <div class="wf-bar" data-wf-id={bar.id}><div class="wf-bar-start">{children(bar.start)}</div><div class="wf-bar-end">{children(bar.end)}</div></div>;
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
      return <button class={`wf-control wf-${control.kind}`} classList={{ "wf-sim-hover": props.shot?.hoverId === control.id, selected: control.kind === "button" && control.state === "selected", destructive: control.kind === "button" && control.tone === "destructive", "icon-only": Boolean(iconOnly) }} type="button" disabled={disabled || !actionable} aria-disabled={!actionable} aria-label={iconOnly ? control.label : undefined} popovertarget={props.interactive && actionable ? targetId : undefined} onClick={(event) => { placePopover(targetId, event.currentTarget); goto(control.goto); }} data-wf-id={control.id}>{icon ? <Icon name={icon} /> : undefined}<span classList={{ "wf-control-label": true, "wf-visually-hidden": Boolean(iconOnly) }}>{control.label}</span></button>;
    }
    case "field": { const field = element() as Extract<WireframeElement, { kind: "field" }>; return <label class="wf-field" data-wf-id={field.id}><span>{field.label}</span><span class="wf-field-control">{field.icon ? <Icon name={field.icon} /> : undefined}<input value={field.value || ""} aria-label={field.label} readOnly /></span></label>; }
    case "select": { const select = element() as Extract<WireframeElement, { kind: "select" }>; return <label class="wf-field wf-select" classList={{ disabled: select.state === "disabled" }} data-wf-id={select.id}><span>{select.label}</span><select value={select.value} aria-label={select.label} disabled><option>{select.value}</option></select></label>; }
    case "toggle": { const toggle = element() as Extract<WireframeElement, { kind: "toggle" }>; const disabled = toggle.state === "disabled"; return <div class="wf-toggle" classList={{ on: toggle.state === "on", disabled }} data-wf-id={toggle.id} role="switch" aria-checked={toggle.state === "on"} aria-disabled="true" aria-label={toggle.label}><span class="wf-toggle-track"><span class="wf-toggle-thumb" /></span><span>{toggle.label}</span></div>; }
    case "checkbox": { const checkbox = element() as Extract<WireframeElement, { kind: "checkbox" }>; const checked = checkbox.state === "checked"; const disabled = checkbox.state === "disabled"; return <div class="wf-checkbox" classList={{ checked, disabled }} data-wf-id={checkbox.id} role="checkbox" aria-checked={checked} aria-disabled="true" aria-label={checkbox.label}><span class="wf-checkbox-box" aria-hidden="true">{checked ? "✓" : ""}</span><span>{checkbox.label}</span></div>; }
    case "textarea": { const textarea = element() as Extract<WireframeElement, { kind: "textarea" }>; return <label class="wf-field wf-textarea" data-wf-id={textarea.id}><span>{textarea.label}</span><textarea value={textarea.value} aria-label={textarea.label} readOnly wrap="soft" /></label>; }
    case "card": { const card = element() as Extract<WireframeElement, { kind: "card" }>; return <button class="wf-card" classList={{ selected: card.selected }} type="button" disabled={!card.goto} aria-disabled={!card.goto} onClick={() => goto(card.goto)} data-wf-id={card.id}><strong>{card.title}</strong><Show when={card.detail}><span>{card.detail}</span></Show></button>; }
    case "notice": { const notice = element() as Extract<WireframeElement, { kind: "notice" }>; return <div class={`wf-notice ${notice.noticeKind}`} data-wf-id={notice.id}><strong>{notice.title}</strong><Show when={notice.detail}><span>{notice.detail}</span></Show></div>; }
    case "popover": {
      const popover = element() as Extract<WireframeElement, { kind: "popover" }>;
      return <div id={`${props.prefix}-${popover.id}`} class="wf-popover" classList={{ "force-open": props.shot?.openPopoverId === popover.id }} popover={props.interactive ? "auto" : undefined} data-wf-id={popover.id}>{children(popover.children)}</div>;
    }
    case "rule": return <hr class="wf-rule" />;
    case "tabs": { const tabs = element() as Extract<WireframeElement, { kind: "tabs" }>; return <div class="wf-tabs" role="tablist" data-wf-id={tabs.id}><For each={tabs.tabs}>{tab => <button type="button" role="tab" disabled={!tab.goto} aria-disabled={!tab.goto} aria-selected={tab.active} classList={{ active: tab.active }} onClick={() => goto(tab.goto)}>{tab.label}</button>}</For></div>; }
    case "list": {
      const list = element() as Extract<WireframeElement, { kind: "list" }>;
      const itemContent = (item: (typeof list.items)[number]) => <><span class="wf-list-copy"><strong>{item.label}</strong><Show when={item.detail}><span>{item.detail}</span></Show></span><Show when={item.state === "checked" || item.state === "unchecked"}><span class="wf-list-check" aria-hidden="true">{item.state === "checked" ? "✓" : ""}</span></Show><Show when={item.action === "remove"}><span class="wf-list-remove" role="img" aria-label={`Remove ${item.label}`}>×</span></Show></>;
      const items = () => <For each={list.items}>{item => <li classList={{ selected: item.state === "selected" || item.state === "checked" }}><Show when={item.goto} fallback={<div class="wf-list-item">{itemContent(item)}</div>}><button type="button" class="wf-list-item" onClick={() => goto(item.goto)}>{itemContent(item)}</button></Show></li>}</For>;
      return list.mode === "ordered" ? <ol class="wf-list wf-list-ordered" data-wf-id={list.id}>{items()}</ol> : <ul class="wf-list" classList={{ "wf-list-checkable": list.mode === "checkable" }} data-wf-id={list.id}>{items()}</ul>;
    }
    case "table": { const table = element() as Extract<WireframeElement, { kind: "table" }>; return <div class="wf-table-wrap" data-wf-id={table.id}><table class="wf-table"><thead><tr><For each={table.columns}>{column => <th scope="col">{column.label}</th>}</For></tr></thead><tbody><For each={table.rows}>{row => <tr classList={{ [`wf-row-${row.state}`]: Boolean(row.state), "wf-row-linked": Boolean(row.goto) }} onClick={() => goto(row.goto)}><For each={table.columns}>{column => { const cell = row.cells[column.id]; if (typeof cell !== "object") return <td>{cell || "—"}</td>; const popover = findPopover(props.document, props.screen, cell.actionId); const targetId = popover ? `${props.prefix}-${popover.id}` : undefined; return <td class="wf-table-action"><button type="button" disabled={!targetId} aria-label={`Actions for ${row.id}`} popovertarget={props.interactive ? targetId : undefined} onClick={(event) => { event.stopPropagation(); placePopover(targetId, event.currentTarget); }}>•••</button></td>; }}</For></tr>}</For></tbody></table></div>; }
    case "use": { const use = element() as Extract<WireframeElement, { kind: "use" }>; const part = props.document.parts.find(candidate => candidate.id === use.partId); return <div class="wf-use" data-wf-id={use.id}>{children(part?.children || [])}</div>; }
    case "diagram": return <DiagramEmbed element={element() as Extract<WireframeElement, { kind: "diagram" }>} />;
  }
}

function screenElements(screen: WireframeScreen): WireframeElement[] {
  return screen.frame.kind === "page" ? screen.frame.body : [screen.frame.header, screen.frame.top, screen.frame.main, screen.frame.aside].flat();
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

function ScreenView(props: { document: WireframeDocument; screen: WireframeScreen; shot?: WireframeShot; prefix: string; interactive: boolean; contentFit?: boolean; showInteractions?: boolean; rootRef?: (element: HTMLDivElement) => void; onGoto: (id: string) => void }) {
  const render = (items: WireframeElement[]) => <For each={items}>{element => <ElementView element={element} {...props} />}</For>;
  const frame = props.screen.frame;
  return <div ref={props.rootRef} class={`wf-screen wf-frame-${frame.kind}`} classList={{ "wf-content-fit": Boolean(props.contentFit && frame.kind === "page"), "wf-show-interactions": props.showInteractions }} style={{ width: `${props.document.viewport.width}px`, height: props.contentFit && frame.kind === "page" ? "auto" : `${props.document.viewport.height}px`, ...(frame.kind === "workbench" ? { "grid-template-columns": `minmax(560px, 1fr) ${frame.inspector}px` } : {}) }}>
    <Show when={frame.kind === "page"} fallback={
      <><header class="wf-region-header">{render((frame as Extract<typeof frame, { kind: "workbench" }>).header)}</header><div class="wf-region-top">{render((frame as Extract<typeof frame, { kind: "workbench" }>).top)}</div><main class="wf-region-main">{render((frame as Extract<typeof frame, { kind: "workbench" }>).main)}</main><aside class="wf-region-aside">{render((frame as Extract<typeof frame, { kind: "workbench" }>).aside)}</aside></>
    }><main class="wf-page"><div class="wf-page-panel" style={{ "max-width": `${(frame as Extract<typeof frame, { kind: "page" }>).content}px` }}>{render((frame as Extract<typeof frame, { kind: "page" }>).body)}</div></main></Show>
  </div>;
}

export function WireframeWorkbench(props: { document: WireframeDocument; documentPath?: string; sourceText?: string }) {
  const [screenId, setScreenId] = createSignal(props.document.screens[0]?.id || "");
  const screen = createMemo(() => props.document.screens.find(candidate => candidate.id === screenId()) || props.document.screens[0]);
  const reference = createMemo(() => props.document.references.find(candidate => candidate.id === screen()?.referenceId));
  const [shotId, setShotId] = createSignal("rest");
  const shot = createMemo(() => screen()?.shots.find(candidate => candidate.id === shotId()));
  const [scale, setScale] = createSignal(1);
  const [displayMode, setDisplayMode] = createSignal<"content" | "viewport">("content");
  const [showInteractions, setShowInteractions] = createSignal(false);
  const [referenceMode, setReferenceMode] = createSignal<"mockup" | "actual" | "compare">("mockup");
  const [renderHeight, setRenderHeight] = createSignal(props.document.viewport.height);
  let viewport!: HTMLDivElement;
  let sceneElement!: HTMLDivElement;
  const measure = () => setRenderHeight(displayMode() === "content" && screen()?.frame.kind === "page" ? sceneElement?.scrollHeight || props.document.viewport.height : props.document.viewport.height);
  const fit = () => { setScale(Math.min(1, Math.max(.2, (viewport.clientWidth - 2) / props.document.viewport.width))); requestAnimationFrame(measure); };
  onMount(() => { fit(); window.addEventListener("resize", fit); onCleanup(() => window.removeEventListener("resize", fit)); });
  createEffect(() => { screenId(); setShotId(screen()?.shots[0]?.id || "rest"); setShowInteractions(false); requestAnimationFrame(measure); });
  createEffect(() => { displayMode(); requestAnimationFrame(measure); });
  createEffect(() => { if (!reference()) setReferenceMode("mockup"); });
  createEffect(() => { referenceMode(); requestAnimationFrame(() => viewport && fit()); });
  const navigate = (id: string) => { setScreenId(id); window.history.replaceState(null, "", `#${id}`); };
  return <main class="wireframe-app" classList={{ "wireframe-theme-default": props.document.theme === "default", "wireframe-theme-recipe": props.document.theme === "recipe" }}>
    <header class="wireframe-toolbar"><div><strong>{props.document.title}</strong><span>{props.documentPath}</span></div><nav aria-label="Wireframe screens"><For each={props.document.screens}>{item => <button type="button" aria-pressed={item.id === screen()?.id} onClick={() => navigate(item.id)}>{item.title}</button>}</For></nav><a class="btn" href="/" rel="external">Project index</a></header>
    <Show when={screen()} keyed>{current => <>
      <section class="wireframe-statebar"><div><strong>{current.title}</strong><span>{current.basis} · {props.document.viewport.width} × {props.document.viewport.height}</span></div><div class="wireframe-view-controls"><Show when={reference()}><div class="wireframe-shots" aria-label="Reference view"><For each={(["mockup", "actual", "compare"] as const)}>{mode => <button type="button" aria-pressed={referenceMode() === mode} onClick={() => setReferenceMode(mode)}>{mode}</button>}</For></div></Show><Show when={current.frame.kind === "page" && referenceMode() !== "actual"}><div class="wireframe-shots" aria-label="Canvas sizing"><button type="button" aria-pressed={displayMode() === "content"} onClick={() => setDisplayMode("content")}>Content fit</button><button type="button" aria-pressed={displayMode() === "viewport"} onClick={() => setDisplayMode("viewport")}>Full viewport</button></div></Show><Show when={referenceMode() !== "actual"}><button class="wireframe-interactions" type="button" aria-pressed={showInteractions()} onClick={() => setShowInteractions(value => !value)}>{showInteractions() ? "Hide interactions" : "Highlight interactions"}</button></Show><Show when={current.shots.length && referenceMode() !== "actual"}><div class="wireframe-shots" aria-label="Disclosure state"><For each={current.shots}>{item => <button type="button" aria-pressed={shotId() === item.id} onClick={() => setShotId(item.id)}>{item.id.replaceAll("-", " ")}</button>}</For></div></Show></div></section>
      <div class="wireframe-stage" classList={{ "with-reference": Boolean(reference() && referenceMode() === "compare"), "reference-only": Boolean(reference() && referenceMode() === "actual") }}>
        <Show when={referenceMode() !== "mockup" ? reference() : undefined}>{actual => <figure class="wireframe-reference"><figcaption><strong>Actual site</strong><span>{actual().state || actual().captured || "Reference"}</span></figcaption><a href={`/api/reference?path=${encodeURIComponent(actual().image)}`} target="_blank" rel="noreferrer"><img src={`/api/reference?path=${encodeURIComponent(actual().image)}`} width={actual().width} height={actual().height} alt={`Actual site reference for ${current.title}`} /></a></figure>}</Show>
        <Show when={referenceMode() !== "actual"}><div class="wireframe-viewport" ref={viewport}><div class="wireframe-scaled" style={{ width: `${props.document.viewport.width * scale()}px`, height: `${renderHeight() * scale()}px` }}><div class="wireframe-transform" style={{ transform: `scale(${scale()})`, "transform-origin": "top left" }}><ScreenView document={props.document} screen={current} shot={shot()} prefix="live" interactive contentFit={displayMode() === "content"} showInteractions={showInteractions()} rootRef={element => { sceneElement = element; requestAnimationFrame(measure); }} onGoto={navigate} /></div></div></div></Show>
      </div>
    </>}</Show>
  </main>;
}
