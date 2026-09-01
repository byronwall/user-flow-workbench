export interface SourceRefreshState<T> {
  status: "idle" | "loading" | "ready" | "error";
  value?: T;
  error?: Error;
  revision: number;
  stale: boolean;
}

export interface SourceRefreshOptions<T> {
  load: (signal: AbortSignal) => Promise<T>;
  onState: (state: SourceRefreshState<T>) => void;
  initialValue?: T;
  intervalMs?: number;
  isVisible?: () => boolean;
  setTimeout?: (callback: () => void, delay: number) => unknown;
  clearTimeout?: (handle: unknown) => void;
}

export interface SourceRefreshController {
  refresh: () => Promise<void>;
  setVisible: (visible: boolean) => void;
  start: () => void;
  stop: () => void;
  dispose: () => void;
}

/**
 * Coordinates source reads for a selected document.
 *
 * A refresh always owns one revision. An older read cannot publish after a
 * newer read, even when a loader ignores AbortSignal.
 */
export function createSourceRefresh<T>(options: SourceRefreshOptions<T>): SourceRefreshController {
  const intervalMs = options.intervalMs ?? 2_000;
  const isVisible = options.isVisible ?? (() => true);
  const schedule = options.setTimeout ?? globalThis.setTimeout;
  const cancel = options.clearTimeout ?? ((handle: unknown) => globalThis.clearTimeout(handle as number));
  let revision = 0;
  let active: { revision: number; controller: AbortController } | undefined;
  let timer: unknown;
  let visible = isVisible();
  let started = false;
  let disposed = false;
  let latest: SourceRefreshState<T> = {
    status: options.initialValue === undefined ? "idle" : "ready",
    value: options.initialValue,
    revision: 0,
    stale: false,
  };

  const publish = (state: SourceRefreshState<T>) => {
    if (disposed) return;
    latest = state;
    options.onState(state);
  };

  const clearTimer = () => {
    if (timer === undefined) return;
    cancel(timer);
    timer = undefined;
  };

  const scheduleNext = () => {
    clearTimer();
    if (!started || !visible || disposed) return;
    timer = schedule(() => {
      timer = undefined;
      if (!started || !visible || disposed || active) return;
      void refresh();
    }, intervalMs);
  };

  const invalidateActive = () => {
    revision += 1;
    active?.controller.abort();
    active = undefined;
  };

  const refresh = async () => {
    if (disposed) return;
    clearTimer();
    active?.controller.abort();
    const currentRevision = ++revision;
    const controller = new AbortController();
    active = { revision: currentRevision, controller };
    publish({
      status: "loading",
      value: latest.value,
      revision: currentRevision,
      stale: latest.value !== undefined,
    });

    try {
      const value = await options.load(controller.signal);
      if (disposed || active?.revision !== currentRevision || controller.signal.aborted) return;
      active = undefined;
      publish({ status: "ready", value, revision: currentRevision, stale: false });
    } catch (error) {
      if (disposed || active?.revision !== currentRevision || controller.signal.aborted) return;
      active = undefined;
      const normalized = error instanceof Error ? error : new Error(String(error));
      publish({
        status: "error",
        value: latest.value,
        error: normalized,
        revision: currentRevision,
        stale: latest.value !== undefined,
      });
    } finally {
      if (active?.revision === currentRevision) active = undefined;
      if (!disposed && started && visible) scheduleNext();
    }
  };

  const setVisible = (nextVisible: boolean) => {
    visible = nextVisible;
    if (!visible) {
      clearTimer();
      invalidateActive();
      return;
    }
    if (started && !active) void refresh();
  };

  const start = () => {
    if (disposed || started) return;
    started = true;
    if (visible && !active) {
      if (latest.status === "ready" && latest.value !== undefined) scheduleNext();
      else void refresh();
    }
  };

  const stop = () => {
    started = false;
    clearTimer();
    invalidateActive();
  };

  const dispose = () => {
    if (disposed) return;
    disposed = true;
    started = false;
    clearTimer();
    active?.controller.abort();
  };

  return { refresh, setVisible, start, stop, dispose };
}
