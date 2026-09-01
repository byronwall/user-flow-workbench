import { spawn, type ChildProcess } from "node:child_process";
import { randomUUID } from "node:crypto";
import { stat } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import type { FlowCliIO, FlowViewOptions } from "./flow.ts";

export interface OwnedServer {
  url: string;
  port: number;
  waitForExit(): Promise<number>;
  close(): Promise<void>;
}

function packageRoot(): string { return resolve(dirname(fileURLToPath(import.meta.url)), "../.."); }

async function findServerEntry(): Promise<{ cwd: string; entry: string }> {
  const root = packageRoot();
  for (const output of [resolve(root, ".output"), resolve(root, "dist/app")]) {
    try {
      await stat(resolve(output, "server/index.mjs"));
      return { cwd: output, entry: resolve(output, "server/index.mjs") };
    } catch { /* Try the other packaged build location. */ }
  }
  throw new Error("The Flow Workbench server is not built. Run `pnpm build`, then try again.");
}

function wait(ms: number): Promise<void> { return new Promise(resolve => setTimeout(resolve, ms)); }

function throwIfAborted(signal?: AbortSignal): void { if (signal?.aborted) throw new Error("Render interrupted."); }

async function fetchReady(url: string, launchId: string, timeoutMs: number): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), Math.max(1, timeoutMs));
  try { return await fetch(`${url}/api/flows?launch=${encodeURIComponent(launchId)}`, { cache: "no-store", signal: controller.signal }); }
  finally { clearTimeout(timer); }
}

async function waitForServer(child: ChildProcess, requestedPort: number, launchId: string, timeoutMs: number, signal?: AbortSignal): Promise<{ port: number; line: string }> {
  let output = "";
  let startupError: Error | undefined;
  const collect = (chunk: Buffer | string) => { output += String(chunk); };
  child.stdout?.on("data", collect);
  child.stderr?.on("data", collect);
  child.once("error", error => { startupError = error; });
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    throwIfAborted(signal);
    if (startupError) throw new Error(`Could not start the Flow Workbench server: ${startupError.message}`);
    const listening = output.match(/Listening on (https?:\/\/[^\s]+)/i);
    if (listening) {
      const url = new URL(listening[1]);
      const port = Number(url.port || (url.protocol === "https:" ? 443 : 80));
      for (let attempt = 0; attempt < 20 && Date.now() - started < timeoutMs; attempt += 1) {
        throwIfAborted(signal);
        try {
          const response = await fetchReady(url.origin, launchId, Math.min(750, Math.max(1, timeoutMs - (Date.now() - started))));
          if (response.ok) return { port, line: listening[1] };
        } catch { /* The process announced before the socket accepted requests. */ }
        await wait(25);
      }
    }
    if (child.exitCode !== null) {
      if (/EADDRINUSE|address already in use/i.test(output)) {
        throw new Error(`Port ${requestedPort} is already in use. Choose another port with --port.`);
      }
      const detail = output.trim().slice(-1000);
      throw new Error(`The Flow Workbench server exited during startup (code ${child.exitCode}).${detail ? ` ${detail}` : ""}`);
    }
    await wait(Math.min(25, Math.max(1, timeoutMs - (Date.now() - started))));
  }
  if (/EADDRINUSE|address already in use/i.test(output)) {
    throw new Error(`Port ${requestedPort} is already in use. Choose another port with --port.`);
  }
  throw new Error("Timed out waiting for the Flow Workbench server to become ready.");
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

export async function startOwnedServer(root: string, requestedPort?: number, io?: FlowCliIO, signal?: AbortSignal): Promise<OwnedServer> {
  throwIfAborted(signal);
  const { cwd, entry } = await findServerEntry();
  const launchId = randomUUID();
  const zeroPortToken = "__FLOW_WORKBENCH_PORT_ZERO__";
  const preload = `const net=require('node:net');const listen=net.Server.prototype.listen;net.Server.prototype.listen=function(...args){if(args[0]&&typeof args[0]==='object'&&args[0].port==='${zeroPortToken}')args[0]={...args[0],port:0};else if(args[0]==='${zeroPortToken}')args[0]=0;return listen.apply(this,args)};import(process.argv[1]).catch(error=>{console.error(error);process.exitCode=1});`;
  const child = spawn(process.execPath, ["-e", preload, entry], {
    cwd,
    env: { ...process.env, FLOW_WORKBENCH_ROOT: root, FLOW_WORKBENCH_LAUNCH_ID: launchId, HOST: "127.0.0.1", PORT: String(requestedPort || zeroPortToken), NITRO_HOST: "127.0.0.1", NITRO_PORT: String(requestedPort || zeroPortToken) },
    stdio: ["ignore", "pipe", "pipe"],
  });
  let closed: Promise<boolean> | undefined;
  try {
    const ready = await waitForServer(child, requestedPort || 0, launchId, 10_000, signal);
    io?.out(`Listening on ${ready.line}`);
    return {
      url: `http://127.0.0.1:${ready.port}`,
      port: ready.port,
      waitForExit: () => new Promise<number>(resolve => {
        if (child.exitCode !== null) { resolve(child.exitCode ?? 1); return; }
        child.once("exit", (code, signal) => resolve(code ?? (signal ? 1 : 0)));
      }),
      async close() {
        closed ||= terminateChild(child);
        if (!await closed) throw new Error("Server cleanup could not confirm process exit.");
      },
    };
  } catch (error) {
    const exited = await terminateChild(child);
    if (!exited) {
      const primary = error instanceof Error ? error.message : String(error);
      throw new Error(`${primary}; server cleanup could not confirm process exit.`);
    }
    throw error;
  }
}

export async function startViewServer(options: FlowViewOptions, io: FlowCliIO): Promise<number> {
  const controller = new AbortController();
  let server: OwnedServer | undefined;
  const interrupt = () => { controller.abort(); void server?.close().catch(() => undefined); };
  process.once("SIGINT", interrupt);
  process.once("SIGTERM", interrupt);
  try {
    server = await startOwnedServer(options.root, options.port, io, controller.signal);
    io.out(`Serving diagrams from ${options.root}`);
    io.out(`Flow Workbench: ${server.url}`);
    return await server.waitForExit();
  }
  finally {
    process.removeListener("SIGINT", interrupt);
    process.removeListener("SIGTERM", interrupt);
    await server?.close();
  }
}
