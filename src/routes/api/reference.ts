import { readFile } from "node:fs/promises";
import { extname } from "node:path";
import { FlowCatalogError, resolveFlowRoot, resolveReferenceImagePath } from "../../server/flow-catalog";

const TYPES: Record<string, string> = { ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".webp": "image/webp" };

export async function GET({ request }: { request: Request }) {
  const path = new URL(request.url).searchParams.get("path") || "";
  try {
    const image = await resolveReferenceImagePath(await resolveFlowRoot(), path);
    return new Response(await readFile(image), { headers: { "Cache-Control": "no-store", "Content-Type": TYPES[extname(image).toLowerCase()] } });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : String(error) }, { status: error instanceof FlowCatalogError ? error.status : 500 });
  }
}
