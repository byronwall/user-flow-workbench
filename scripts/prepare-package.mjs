import { cp, rm } from "node:fs/promises";
import { resolve } from "node:path";

const source = resolve(".output");
const destination = resolve("dist/app");

await rm(destination, { recursive: true, force: true });
await cp(source, destination, { recursive: true });
