import { onMount } from "solid-js";

export default function OverviewPreview() {
  onMount(() => {
    window.location.replace("/?diagram=src%2Fdata%2Foverviews%2Fresume-app.diagram");
  });

  return (
    <main class="startup-state">
      <h1>User Flow Workbench</h1>
      <p>Opening the overview…</p>
    </main>
  );
}
