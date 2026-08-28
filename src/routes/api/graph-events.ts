import { watch } from "node:fs";
import { resolve } from "node:path";

const FLOW_DIRECTORY = resolve("src/data/flows");
const FLOW_FILENAME = "resume-alignment.flow";

export function GET({ request }: { request: Request }) {
  if (!import.meta.env.DEV) return new Response(null, { status: 404 });

  const encoder = new TextEncoder();
  let changeTimer: ReturnType<typeof setTimeout> | undefined;
  let isClosed = false;

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      const flowWatcher = watch(FLOW_DIRECTORY, { persistent: false }, (_event, filename) => {
        if (filename?.toString() !== FLOW_FILENAME) return;

        clearTimeout(changeTimer);
        changeTimer = setTimeout(() => {
          if (isClosed) return;
          controller.enqueue(encoder.encode(`event: flow-change\ndata: ${Date.now()}\n\n`));
        }, 75);
      });

      const close = () => {
        if (isClosed) return;
        isClosed = true;
        clearTimeout(changeTimer);
        flowWatcher.close();
        controller.close();
      };

      request.signal.addEventListener("abort", close, { once: true });
      controller.enqueue(encoder.encode("retry: 1000\n\n"));
    },
  });

  return new Response(stream, {
    headers: {
      "Cache-Control": "no-cache, no-transform",
      "Content-Type": "text/event-stream",
      "X-Accel-Buffering": "no",
    },
  });
}
