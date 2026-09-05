import { createSignal, onCleanup, onMount } from "solid-js";

export interface GraphCamera { x: number; y: number; scale: number }

export function zoomCamera(camera: GraphCamera, point: { x: number; y: number }, factor: number): GraphCamera {
  const scale = Math.max(.1, Math.min(3, camera.scale * factor));
  return { x: point.x - (point.x - camera.x) * scale / camera.scale, y: point.y - (point.y - camera.y) * scale / camera.scale, scale };
}

export function fitCamera(width: number, height: number, viewportWidth: number, viewportHeight: number): GraphCamera {
  const scale = Math.max(.01, Math.min(1, (viewportWidth - 32) / Math.max(1, width), (viewportHeight - 32) / Math.max(1, height)));
  return { x: (viewportWidth - width * scale) / 2, y: (viewportHeight - height * scale) / 2, scale };
}

export function createGraphCamera(viewport: () => HTMLDivElement, enabled: () => boolean, reset: () => void) {
  const [camera, setCamera] = createSignal<GraphCamera>({ x: 0, y: 0, scale: 1 });
  const [panning, setPanning] = createSignal(false);
  const dismissLabels = () => viewport().querySelectorAll<HTMLElement>(".application-edge-tooltip:popover-open").forEach((label) => label.hidePopover());
  const zoom = (factor: number) => {
    dismissLabels();
    setCamera((current) => zoomCamera(current, { x: viewport().clientWidth / 2, y: viewport().clientHeight / 2 }, factor));
  };
  onMount(() => {
    const element = viewport();
    const pointers = new Map<number, { x: number; y: number }>();
    const gesture = () => {
      const points = [...pointers.values()];
      const first = points[0], second = points[1] || first;
      return { x: (first.x + second.x) / 2, y: (first.y + second.y) / 2, distance: Math.hypot(first.x - second.x, first.y - second.y) };
    };
    let start: ReturnType<typeof gesture>;
    let saved: GraphCamera;
    const down = (event: PointerEvent) => {
      if (!enabled() || (event.button !== 0 && event.button !== 1)) return;
      if (event.button === 0 && (event.target as Element).closest("button, [popover]")) return;
      event.preventDefault();
      dismissLabels();
      element.focus({ preventScroll: true });
      pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
      element.setPointerCapture(event.pointerId);
      start = gesture(); saved = camera();
    };
    const move = (event: PointerEvent) => {
      if (!pointers.has(event.pointerId)) return;
      pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
      const current = gesture();
      if (!panning() && Math.hypot(current.x - start.x, current.y - start.y) < 3 && Math.abs(current.distance - start.distance) < 3) return;
      setPanning(true);
      const rect = element.getBoundingClientRect();
      const next = zoomCamera(saved, { x: start.x - rect.left, y: start.y - rect.top }, start.distance ? current.distance / start.distance : 1);
      setCamera({ ...next, x: next.x + current.x - start.x, y: next.y + current.y - start.y });
    };
    const up = (event: PointerEvent) => {
      if (!pointers.delete(event.pointerId)) return;
      if (element.hasPointerCapture(event.pointerId)) element.releasePointerCapture(event.pointerId);
      if (pointers.size) { start = gesture(); saved = camera(); }
      else setPanning(false);
    };
    const wheel = (event: WheelEvent) => {
      if (!enabled()) return;
      event.preventDefault();
      dismissLabels();
      const rect = element.getBoundingClientRect();
      const delta = event.deltaY * (event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? element.clientHeight : 1);
      const factor = Math.exp(-Math.max(-240, Math.min(240, delta)) * (event.ctrlKey ? .006 : .0015));
      setCamera((current) => zoomCamera(current, { x: event.clientX - rect.left, y: event.clientY - rect.top }, factor));
    };
    const key = (event: KeyboardEvent) => {
      if (!enabled() || event.target !== element) return;
      const directions = { ArrowLeft: [40, 0], ArrowRight: [-40, 0], ArrowUp: [0, 40], ArrowDown: [0, -40] };
      if (event.key in directions) {
        event.preventDefault(); dismissLabels();
        const [x, y] = directions[event.key];
        setCamera((current) => ({ ...current, x: current.x + x, y: current.y + y }));
      } else if (["+", "=", "-", "0"].includes(event.key)) {
        event.preventDefault();
        if (event.key === "0") reset(); else zoom(event.key === "-" ? .8 : 1.25);
      }
    };
    element.addEventListener("pointerdown", down);
    element.addEventListener("pointermove", move);
    element.addEventListener("pointerup", up);
    element.addEventListener("pointercancel", up);
    element.addEventListener("lostpointercapture", up);
    element.addEventListener("wheel", wheel, { passive: false });
    element.addEventListener("keydown", key);
    onCleanup(() => {
      element.removeEventListener("pointerdown", down);
      element.removeEventListener("pointermove", move);
      element.removeEventListener("pointerup", up);
      element.removeEventListener("pointercancel", up);
      element.removeEventListener("lostpointercapture", up);
      element.removeEventListener("wheel", wheel);
      element.removeEventListener("keydown", key);
    });
  });
  return { camera, setCamera, panning, zoom, dismissLabels };
}
