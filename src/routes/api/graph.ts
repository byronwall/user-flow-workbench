import { FlowCatalogError, readFlowDocument } from "../../server/flow-catalog";

export async function GET({ request }: { request: Request }) {
  const path = new URL(request.url).searchParams.get("path") || "";
  try {
    return Response.json(await readFlowDocument(path), {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    const status = error instanceof FlowCatalogError ? error.status : 500;
    const body = error instanceof FlowCatalogError && error.details
      ? error.details
      : { error: error instanceof Error ? error.message : String(error) };
    return Response.json(body, { status });
  }
}
