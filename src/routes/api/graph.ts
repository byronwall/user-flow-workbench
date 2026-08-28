import resumeAlignmentFlow from "../../data/flows/resume-alignment.flow?raw";
import { parseGraphDsl } from "../../lib/graph-dsl";

export function GET() {
  return Response.json(parseGraphDsl(resumeAlignmentFlow), {
    headers: {
      "Cache-Control": "no-store",
    },
  });
}
