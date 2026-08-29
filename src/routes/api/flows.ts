import { FlowCatalogError, readFlowCatalog } from "../../server/flow-catalog";

export async function GET() {
  try {
    return Response.json(await readFlowCatalog(), {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    const status = error instanceof FlowCatalogError ? error.status : 500;
    return Response.json({ error: error instanceof Error ? error.message : String(error) }, { status });
  }
}
