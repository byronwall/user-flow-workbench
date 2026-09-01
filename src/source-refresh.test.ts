import assert from "node:assert/strict";
import test from "node:test";
import { createSourceRefresh, type SourceRefreshState } from "./source-refresh.ts";

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (error: unknown) => void;
  const promise = new Promise<T>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });
  return { promise, resolve, reject };
}

test("only the newest revision can publish", async () => {
  const requests: Array<ReturnType<typeof deferred<string>>> = [];
  const states: SourceRefreshState<string>[] = [];
  const controller = createSourceRefresh({
    load: () => {
      const request = deferred<string>();
      requests.push(request);
      return request.promise;
    },
    onState: (state) => states.push(state),
  });

  const first = controller.refresh();
  const second = controller.refresh();
  requests[1].resolve("new");
  await second;
  requests[0].resolve("old");
  await first;

  assert.equal(states.at(-1)?.status, "ready");
  assert.equal(states.at(-1)?.value, "new");
  assert.equal(states.filter((state) => state.status === "ready").length, 1);
});

test("a later failure keeps the last valid value and marks it stale", async () => {
  const requests: Array<ReturnType<typeof deferred<string>>> = [];
  const states: SourceRefreshState<string>[] = [];
  const controller = createSourceRefresh({
    load: () => {
      const request = deferred<string>();
      requests.push(request);
      return request.promise;
    },
    onState: (state) => states.push(state),
  });

  const first = controller.refresh();
  requests[0].resolve("valid");
  await first;
  const second = controller.refresh();
  requests[1].reject(new Error("malformed source"));
  await second;

  const state = states.at(-1)!;
  assert.equal(state.status, "error");
  assert.equal(state.value, "valid");
  assert.equal(state.stale, true);
});

test("visibility bounds polling and cancels an in-flight read", async () => {
  const scheduled: Array<() => void> = [];
  const signals: AbortSignal[] = [];
  const pending = deferred<string>();
  let requestCount = 0;
  const controller = createSourceRefresh({
    intervalMs: 10,
    load: (signal) => {
      requestCount += 1;
      signals.push(signal);
      return pending.promise;
    },
    onState: () => undefined,
    setTimeout: (callback) => {
      scheduled.push(callback);
      return scheduled.length as unknown as ReturnType<typeof globalThis.setTimeout>;
    },
    clearTimeout: () => undefined,
  });

  controller.start();
  assert.equal(requestCount, 1);
  controller.setVisible(false);
  assert.equal(signals[0].aborted, true);
  assert.equal(requestCount, 1);
  pending.resolve("ignored");
  await Promise.resolve();
  assert.equal(scheduled.length, 0);
});

test("a loader that ignores abort cannot strand a later visible refresh", async () => {
  const requests: Array<ReturnType<typeof deferred<string>>> = [];
  const states: SourceRefreshState<string>[] = [];
  let visible = true;
  const controller = createSourceRefresh({
    isVisible: () => visible,
    load: () => {
      const request = deferred<string>();
      requests.push(request);
      return request.promise;
    },
    onState: (state) => states.push(state),
  });

  controller.start();
  visible = false;
  controller.setVisible(false);
  visible = true;
  controller.setVisible(true);
  assert.equal(requests.length, 2);

  requests[0].resolve("old");
  await Promise.resolve();
  assert.equal(states.some((state) => state.status === "ready" && state.value === "old"), false);
  requests[1].resolve("new");
  await Promise.resolve();
  assert.equal(states.at(-1)?.value, "new");
  controller.dispose();
});

test("stop invalidates an abort-ignoring request before restart", async () => {
  const requests: Array<ReturnType<typeof deferred<string>>> = [];
  const controller = createSourceRefresh({
    load: () => {
      const request = deferred<string>();
      requests.push(request);
      return request.promise;
    },
    onState: () => undefined,
  });

  controller.start();
  controller.stop();
  controller.start();
  assert.equal(requests.length, 2);
  requests[0].resolve("old");
  requests[1].resolve("new");
  await Promise.resolve();
  controller.dispose();
});
