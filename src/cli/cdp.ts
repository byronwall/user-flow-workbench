import { spawn, type ChildProcess } from "node:child_process";
import { access, mkdtemp, rm, stat } from "node:fs/promises";
import { constants } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

export interface BrowserPage {
  screenshot(width: number, height: number, scale: number, url: string, readyTimeoutMs?: number): Promise<{ image: Buffer; layoutEngine: "elk" | "fallback" | "authored" }>;
  screenshotDocument(width: number, height: number, scale: number, url: string): Promise<Buffer>;
  close(): Promise<void>;
}

interface CdpMessage {
  id?: number;
  method?: string;
  result?: any;
  error?: { message?: string };
}

class CdpConnection {
  private nextId = 1;
  private pending = new Map<number, { resolve: (value: any) => void; reject: (error: Error) => void }>();
  private socket: WebSocket;
  private signal?: AbortSignal;
  private abortHandler?: () => void;

  private constructor(socket: WebSocket, signal?: AbortSignal) {
    this.socket = socket;
    this.signal = signal;
    this.abortHandler = () => {
      const error = new Error("Render interrupted.");
      for (const request of this.pending.values()) request.reject(error);
      this.pending.clear();
      socket.close();
    };
    signal?.addEventListener("abort", this.abortHandler, { once: true });
  }

  static async open(url: string, signal?: AbortSignal): Promise<CdpConnection> {
    throwIfAborted(signal);
    const socket = new WebSocket(url);
    await new Promise<void>((resolve, reject) => {
      let settled = false;
      const finish = (error?: Error) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        signal?.removeEventListener("abort", abort);
        if (error) reject(error);
        else resolve();
      };
      const abort = () => { socket.close(); finish(new Error("Render interrupted.")); };
      const timer = setTimeout(() => { socket.close(); finish(new Error("Timed out connecting to Chrome DevTools.")); }, 2_000);
      signal?.addEventListener("abort", abort, { once: true });
      socket.addEventListener("open", () => finish(), { once: true });
      socket.addEventListener("error", () => finish(new Error("Cannot connect to Chrome DevTools.")), { once: true });
    });
    throwIfAborted(signal);
    const connection = new CdpConnection(socket, signal);
    socket.addEventListener("message", (event) => {
      const message = JSON.parse(String(event.data)) as CdpMessage;
      if (!message.id) return;
      const request = connection.pending.get(message.id);
      if (!request) return;
      connection.pending.delete(message.id);
      if (message.error) request.reject(new Error(message.error.message || "Chrome DevTools command failed."));
      else request.resolve(message.result);
    });
    socket.addEventListener("close", () => {
      if (connection.abortHandler) signal?.removeEventListener("abort", connection.abortHandler);
      for (const request of connection.pending.values()) request.reject(new Error("Chrome DevTools closed."));
      connection.pending.clear();
    });
    return connection;
  }

  command<T = any>(method: string, params: Record<string, unknown> = {}): Promise<T> {
    throwIfAborted(this.signal);
    const id = this.nextId++;
    return new Promise<T>((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pending.delete(id);
        reject(new Error(`Chrome DevTools command timed out: ${method}.`));
      }, 30_000);
      this.pending.set(id, {
        resolve: value => { clearTimeout(timer); resolve(value); },
        reject: error => { clearTimeout(timer); reject(error); },
      });
      this.socket.send(JSON.stringify({ id, method, params }));
    });
  }

  close(): void {
    if (this.abortHandler) this.signal?.removeEventListener("abort", this.abortHandler);
    this.abortHandler = undefined;
    this.socket.close();
  }
}

function wait(ms: number): Promise<void> { return new Promise(resolve => setTimeout(resolve, ms)); }

function throwIfAborted(signal?: AbortSignal): void {
  if (signal?.aborted) throw new Error("Render interrupted.");
}

async function chromeJson(port: number, path: string, timeoutMs: number): Promise<any> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), Math.max(1, timeoutMs));
  let response: Response;
  try {
    response = await fetch(`http://127.0.0.1:${port}${path}`, { signal: controller.signal });
    if (!response.ok) throw new Error(`Chrome DevTools returned HTTP ${response.status}.`);
    return await response.json();
  } finally { clearTimeout(timer); }
}

async function waitForChrome(child: ChildProcess, timeoutMs: number, signal?: AbortSignal): Promise<{ port: number; pageUrl: string }> {
  const started = Date.now();
  let output = "";
  let startupError: Error | undefined;
  const collect = (chunk: Buffer | string) => { output += String(chunk); };
  child.stderr?.on("data", collect);
  child.stdout?.on("data", collect);
  child.once("error", error => { startupError = error; });
  while (Date.now() - started < timeoutMs) {
    throwIfAborted(signal);
    if (startupError) throw new Error(`Could not start browser: ${startupError.message}`);
    const remaining = timeoutMs - (Date.now() - started);
    const match = output.match(/DevTools listening on ws:\/\/127\.0\.0\.1:(\d+)\//);
    if (match) {
      const port = Number(match[1]);
      try {
        const pages = await chromeJson(port, "/json/list", Math.min(750, remaining)) as Array<{ type: string; url: string; webSocketDebuggerUrl?: string }>;
        const page = pages.find(item => item.type === "page" && item.webSocketDebuggerUrl);
        if (page?.webSocketDebuggerUrl) return { port, pageUrl: page.webSocketDebuggerUrl };
      } catch { /* Chrome is still starting. */ }
    }
    if (child.exitCode !== null || child.signalCode !== null) {
      const termination = child.signalCode ? `signal ${child.signalCode}` : `code ${child.exitCode}`;
      const detail = output.trim().slice(-500).replace(/\s+/g, " ");
      throw new Error(`The browser exited before startup (${termination}).${detail ? ` ${detail}` : ""}`);
    }
    await wait(Math.min(30, Math.max(1, timeoutMs - (Date.now() - started))));
  }
  throw new Error("Timed out waiting for the browser DevTools endpoint.");
}

export async function terminateChild(child: ChildProcess): Promise<boolean> {
  if (child.exitCode === null && child.signalCode === null) child.kill("SIGTERM");
  return new Promise<boolean>(resolve => {
    let killTimer: ReturnType<typeof setTimeout> | undefined;
    const finished = () => child.exitCode !== null || child.signalCode !== null;
    const finish = (confirmed: boolean) => { if (killTimer) clearTimeout(killTimer); clearTimeout(termTimer); child.removeListener("exit", onExit); resolve(confirmed); };
    const onExit = () => finish(true);
    const termTimer = setTimeout(() => {
      if (child.exitCode === null && child.signalCode === null) child.kill("SIGKILL");
      if (finished()) finish(true);
      else killTimer = setTimeout(() => finish(finished()), 1_000);
    }, 1_000);
    if (finished()) finish(true);
    else child.once("exit", onExit);
  });
}

export async function launchBrowser(executable: string, timeoutMs = 10_000, signal?: AbortSignal): Promise<{ page: BrowserPage; close: () => Promise<void> }> {
  const executableInfo = await stat(executable).catch(() => null);
  if (!executableInfo?.isFile() || (executableInfo.mode & constants.X_OK) === 0) {
    throw new Error(`Browser executable is not a regular executable file: ${executable}`);
  }
  throwIfAborted(signal);
  const profile = await mkdtemp(join(tmpdir(), "flow-render-browser-"));
  let child: ChildProcess | undefined;
  let connection: CdpConnection | undefined;
  try {
    child = spawn(executable, [
      "--headless=new", "--remote-debugging-port=0", "--no-first-run", "--no-default-browser-check",
      "--disable-background-networking", "--disable-component-update", "--disable-extensions",
      "--disable-gpu", `--user-data-dir=${profile}`, "about:blank",
    ], { stdio: ["ignore", "pipe", "pipe"] });
    const endpoint = await waitForChrome(child, timeoutMs, signal);
    throwIfAborted(signal);
    connection = await CdpConnection.open(endpoint.pageUrl, signal);
    await connection.command("Page.enable");
    await connection.command("Runtime.enable");
    const capturePage = async (width: number, height: number, scale: number, url: string, waitForWorkbench: boolean, readyTimeout: number, documentContent?: { html: string; marker: string }): Promise<{ image: Buffer; layoutEngine: "elk" | "fallback" | "authored" }> => {
        throwIfAborted(signal);
        await connection!.command("Emulation.setDeviceMetricsOverride", {
          width, height, deviceScaleFactor: scale, mobile: false,
        });
        if (documentContent) {
          const frameTree = await connection!.command<any>("Page.getFrameTree");
          const frameId = frameTree?.frameTree?.frame?.id;
          if (!frameId) throw new Error("Chrome did not expose a capture frame.");
          await connection!.command("Page.setDocumentContent", { frameId, html: documentContent.html });
        } else {
          const navigation = await connection!.command<any>("Page.navigate", { url });
          if (navigation?.errorText) throw new Error(`Chrome could not navigate to the capture document: ${navigation.errorText}`);
        }
        let layoutEngine: "elk" | "fallback" | "authored" = "fallback";
        if (waitForWorkbench) {
          const started = Date.now();
          let lastState: any;
          let matchedReady = false;
          while (Date.now() - started < readyTimeout) {
            throwIfAborted(signal);
            const state = await connection!.command<any>("Runtime.evaluate", {
              expression: `(() => {
                const ready = window.__flowWorkbenchReady;
                const error = document.querySelector('[role="alert"], .startup-state')?.textContent?.trim();
                return { status: ready?.status || 'loading', ready, error, href: location.href };
              })()`, returnByValue: true,
            });
            const value = state?.result?.value;
            lastState = value;
            // Ignore the old page while a navigation is still in flight. A
            // stale ready flag is usable only after the requested URL is live.
            if (value?.href !== url) { await wait(50); continue; }
            if (value?.status === "ready") { matchedReady = true; break; }
            if (value?.error && value.status !== "loading") throw new Error(value.error);
            await wait(50);
          }
          const state = await connection!.command<any>("Runtime.evaluate", {
            expression: "({ href: location.href, ready: window.__flowWorkbenchReady })", returnByValue: true,
          });
          if (!matchedReady || state?.result?.value?.href !== url || state?.result?.value?.ready?.status !== "ready") {
            const detail = lastState?.error ? ` ${lastState.error}` : "";
            throw new Error(`Timed out waiting for the flow layout and final paint.${detail}`);
          }
          const readyState = state?.result?.value?.ready;
          const detected = readyState?.layoutEngine;
          layoutEngine = detected === "elk" || detected === "authored" ? detected : "fallback";
        } else {
          const started = Date.now();
          let documentReady = false;
          while (Date.now() - started < 2_000) {
            throwIfAborted(signal);
            const state = await connection!.command<any>("Runtime.evaluate", {
              expression: `(() => ({ href: location.href, state: document.readyState, marker: document.querySelector('svg[data-flow-contact-sheet]')?.getAttribute('data-flow-contact-sheet') }))()`, returnByValue: true,
            });
            const value = state?.result?.value;
            if (documentContent) {
              if (value?.marker !== documentContent.marker) throw new Error("Capture document identity did not match the requested sheet.");
            } else if (value?.href !== url) { await wait(10); continue; }
            if (value?.state === "complete") { documentReady = true; break; }
            await wait(10);
          }
          if (!documentReady) throw new Error("Timed out waiting for the contact sheet document to load.");
          const documentReadyExpression = (async function captureDocumentReady() {
            const images = [...document.querySelectorAll("image")];
            const decodeImage = (image) => new Promise(resolve => {
              const href = image.getAttribute("href") || image.getAttribute("xlink:href");
              if (!href) { resolve(false); return; }
              const probe = new Image();
              const timer = setTimeout(() => resolve(false), 1_500);
              probe.onload = () => { clearTimeout(timer); resolve(probe.naturalWidth > 0 && probe.naturalHeight > 0); };
              probe.onerror = () => { clearTimeout(timer); resolve(false); };
              probe.src = href;
            });
            const decoded = await Promise.all(images.map(decodeImage));
            if (document.fonts) await Promise.race([document.fonts.ready, new Promise(resolve => setTimeout(resolve, 1_500))]);
            await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
            return { href: location.href, marker: document.querySelector("svg[data-flow-contact-sheet]")?.getAttribute("data-flow-contact-sheet"), images: decoded.every(Boolean), fonts: !document.fonts || document.fonts.status === "loaded" };
          }).toString();
          const ready = await connection!.command<any>("Runtime.evaluate", {
            expression: `(${documentReadyExpression})()`, awaitPromise: true, returnByValue: true,
          });
          const readyValue = ready?.result?.value;
          if (documentContent) {
            if (readyValue?.marker !== documentContent.marker) throw new Error("Capture document identity did not match the requested sheet.");
          } else if (readyValue?.href !== url) throw new Error("Capture navigation ended at an unexpected URL.");
          if (!readyValue?.images) throw new Error("Timed out waiting for contact sheet images to decode.");
          if (!readyValue?.fonts) throw new Error("Timed out waiting for contact sheet fonts to load.");
        }
        throwIfAborted(signal);
        const result = await connection!.command<any>("Page.captureScreenshot", { format: "png", captureBeyondViewport: false });
        return { image: Buffer.from(result.data, "base64"), layoutEngine };
    };
    const page: BrowserPage = {
      async screenshot(width, height, scale, url, readyTimeout = 20_000) {
        return capturePage(width, height, scale, url, true, readyTimeout);
      },
      async screenshotDocument(width, height, scale, url) {
        if (!url.startsWith("data:image/svg+xml;base64,")) throw new Error("Capture document must be a base64 SVG data URL.");
        const svg = Buffer.from(url.slice("data:image/svg+xml;base64,".length), "base64").toString("utf8");
        const marker = svg.match(/data-flow-contact-sheet="([^"]+)"/)?.[1];
        if (!marker) throw new Error("Capture document is missing its identity marker.");
        const html = `<!doctype html><html><head><style>html,body{margin:0;padding:0}svg[data-flow-contact-sheet]{display:block}</style></head><body>${svg}</body></html>`;
        const capture = await capturePage(width, height, scale, url, false, 5_000, { html, marker });
        return capture.image;
      },
      async close() { connection?.close(); connection = undefined; },
    };
    let closed: Promise<void> | undefined;
    return {
      page,
      async close() {
        closed ||= (async () => {
          page.close();
          const exited = await terminateChild(child);
          if (!exited) throw new Error(`Browser cleanup could not confirm process exit; temporary profile was retained at ${profile}`);
          await rm(profile, { recursive: true, force: true });
        })();
        await closed;
      },
    };
  } catch (error) {
    connection?.close();
    const exited = child ? await terminateChild(child) : true;
    if (exited) await rm(profile, { recursive: true, force: true });
    if (!exited) {
      const primary = error instanceof Error ? error.message : String(error);
      throw new Error(`${primary}; browser cleanup could not confirm process exit, so its temporary profile was retained at ${profile}`);
    }
    throw error;
  }
}

export function browserExecutableCandidates(): string[] {
  return [
    process.env.FLOW_WORKBENCH_BROWSER,
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/Applications/Chromium.app/Contents/MacOS/Chromium",
    "/usr/bin/google-chrome", "/usr/bin/chromium", "/usr/bin/chromium-browser",
  ].filter((value): value is string => Boolean(value));
}

export async function browserExists(path: string): Promise<boolean> {
  try { const info = await stat(path); return info.isFile() && (info.mode & constants.X_OK) !== 0; } catch { return false; }
}
