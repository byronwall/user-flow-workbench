import { For, Show } from "solid-js";
import type { ApplicationWarning } from "../types/application";

export function ApplicationActions(props: {
  warnings: readonly ApplicationWarning[];
  stale: boolean;
  loading: boolean;
  canExport: boolean;
  onReload: () => void;
  onExport: () => void;
}) {
  let coverageButton!: HTMLButtonElement;
  let coverage!: HTMLDivElement;
  let actions!: HTMLDivElement;
  let dialog!: HTMLDialogElement;
  const place = (panel: HTMLElement, button: HTMLButtonElement) => {
    const rect = button.getBoundingClientRect();
    panel.style.top = `${rect.bottom + 8}px`;
    panel.style.right = `${Math.max(8, window.innerWidth - rect.right)}px`;
  };
  const warningList = (warnings: readonly ApplicationWarning[]) => <ul class="application-warning-list"><For each={warnings}>{(warning) => <li><strong>{warning.message}</strong><Show when={warning.suggestion}><span>{warning.suggestion}</span></Show></li>}</For></ul>;
  return <div class="application-actions">
    <Show when={props.stale}><span role="status">Refresh failed · showing previous version</span></Show>
    <button ref={coverageButton} class="btn" type="button" popovertarget="application-coverage-popover" onClick={(event) => place(coverage, event.currentTarget)}>Coverage · {props.warnings.length}</button>
    <div ref={coverage} id="application-coverage-popover" popover="auto" class="application-nav-popover application-coverage-popover">
      <h2>Coverage warnings</h2>
      <Show when={props.warnings.length} fallback={<p>No coverage warnings.</p>}>
        <p>{props.warnings.length} {props.warnings.length === 1 ? "warning" : "warnings"} to review</p>
        {warningList(props.warnings.slice(0, 3))}
        <button class="btn" type="button" onClick={() => { coverage.hidePopover(); dialog.showModal(); }}>View all warnings</button>
      </Show>
    </div>
    <button class="btn application-actions-trigger" type="button" aria-label="Diagram actions" popovertarget="application-actions-popover" onClick={(event) => place(actions, event.currentTarget)}>•••</button>
    <div ref={actions} id="application-actions-popover" popover="auto" class="application-nav-popover">
      <button class="btn" type="button" disabled={props.loading} onClick={() => { actions.hidePopover(); props.onReload(); }}>{props.loading ? "Reloading…" : "Reload source"}</button>
      <button class="btn" type="button" disabled={!props.canExport} onClick={() => { actions.hidePopover(); props.onExport(); }}>Export source</button>
    </div>
    <dialog ref={dialog} onClose={() => coverageButton.focus()} class="application-coverage-dialog" aria-labelledby="application-coverage-title" onClick={(event) => { if (event.target === dialog) { const rect = dialog.getBoundingClientRect(); if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) dialog.close(); } }}>
      <header><h2 id="application-coverage-title">Coverage warnings · {props.warnings.length}</h2><button class="btn" type="button" autofocus onClick={() => dialog.close()}>Close</button></header>
      <Show when={props.warnings.length} fallback={<p>No coverage warnings.</p>}>{warningList(props.warnings)}</Show>
    </dialog>
  </div>;
}
