if (import.meta.env.DEV) {
  const graphEvents = new EventSource("/api/graph-events");

  graphEvents.addEventListener("flow-change", () => window.location.reload());
  import.meta.hot?.dispose(() => graphEvents.close());
}
