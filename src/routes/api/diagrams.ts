import { FlowCatalogError, readDiagramCatalog } from "../../server/flow-catalog";

export async function GET({ request }: { request: Request }) {
  const expectedLaunch = process.env.FLOW_WORKBENCH_LAUNCH_ID;
  const requestedLaunch = new URL(request.url).searchParams.get("launch");
  if (expectedLaunch && requestedLaunch !== null && requestedLaunch !== expectedLaunch) return Response.json({ error: "This server is not the requested Flow Workbench instance." }, { status: 404 });
  try {
    return Response.json(await readDiagramCatalog(), { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    const status = error instanceof FlowCatalogError ? error.status : 500;
    return Response.json({ error: error instanceof Error ? error.message : String(error) }, { status });
  }
}
