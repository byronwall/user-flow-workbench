import assert from "node:assert/strict";
import { createServer } from "node:net";
import test from "node:test";
import { startOwnedServer } from "./runtime.ts";

test("owned server advances when the requested port is occupied", async () => {
  const occupied = createServer();
  await new Promise<void>((resolve, reject) => {
    occupied.once("error", reject);
    occupied.listen(0, "127.0.0.1", resolve);
  });
  const address = occupied.address();
  if (!address || typeof address === "string") throw new Error("Could not determine the occupied port.");

  let server: Awaited<ReturnType<typeof startOwnedServer>> | undefined;
  try {
    server = await startOwnedServer("/tmp", address.port);
    assert.ok(server.port > address.port);
  } finally {
    await server?.close();
    await new Promise<void>(resolve => occupied.close(() => resolve()));
  }
});
