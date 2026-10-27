"use client";

import * as OBC from "@thatopen/components";
import { useEffect, useRef, useState } from "react";

type Storey = { name: string; get: () => Promise<OBC.ModelIdMap> };
type ViewerState =
  | { kind: "loading"; step: string }
  | { kind: "ready"; storeys: Storey[] }
  | { kind: "error"; message: string };

type World = OBC.SimpleWorld<OBC.SimpleScene, OBC.OrthoPerspectiveCamera, OBC.SimpleRenderer>;

// Renders an IFC file from a URL with That Open Engine. All assets are self-hosted in /vendor
// (copied by scripts/copy-viewer-assets.mjs).
export default function IfcViewer({ url }: { url: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<{ components: OBC.Components; world: World } | null>(null);
  const [state, setState] = useState<ViewerState>({ kind: "loading", step: "Starting viewer…" });
  const [activeStorey, setActiveStorey] = useState<string | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    let cancelled = false;

    const components = new OBC.Components();
    const world = components.get(OBC.Worlds).create<OBC.SimpleScene, OBC.OrthoPerspectiveCamera, OBC.SimpleRenderer>();
    world.scene = new OBC.SimpleScene(components);
    world.scene.setup();
    world.scene.three.background = null;
    world.renderer = new OBC.SimpleRenderer(components, container);
    world.camera = new OBC.OrthoPerspectiveCamera(components);
    components.init();
    components.get(OBC.Grids).create(world);
    engineRef.current = { components, world };

    const fragments = components.get(OBC.FragmentsManager);
    fragments.init("/vendor/fragments/worker.mjs");
    world.camera.controls.addEventListener("rest", () => fragments.core.update(true));
    fragments.list.onItemSet.add(({ value: model }) => {
      model.useCamera(world.camera.three);
      world.scene.three.add(model.object);
      fragments.core.update(true);
    });

    (async () => {
      try {
        const loader = components.get(OBC.IfcLoader);
        await loader.setup({ autoSetWasm: false, wasm: { path: "/vendor/web-ifc/", absolute: true } });

        setState({ kind: "loading", step: "Downloading model…" });
        const response = await fetch(url);
        if (!response.ok) throw new Error(`Download failed (${response.status}).`);
        const bytes = new Uint8Array(await response.arrayBuffer());
        if (cancelled) return;

        setState({ kind: "loading", step: "Processing IFC…" });
        await loader.load(bytes, true, "model");
        if (cancelled) return;

        await world.camera.fitToItems();

        const classifier = components.get(OBC.Classifier);
        await classifier.byIfcBuildingStorey({ classificationName: "Storeys" });
        const groups = classifier.list.get("Storeys");
        const storeys: Storey[] = groups ? [...groups.entries()].map(([name, group]) => ({ name, get: () => group.get() })) : [];
        setState({ kind: "ready", storeys });
      } catch (error) {
        if (!cancelled) setState({ kind: "error", message: error instanceof Error ? error.message : "Could not load the model." });
      }
    })();

    return () => {
      cancelled = true;
      engineRef.current = null;
      components.dispose();
    };
  }, [url]);

  async function showStorey(storey: Storey | null) {
    const engine = engineRef.current;
    if (!engine) return;
    const hider = engine.components.get(OBC.Hider);
    if (storey) await hider.isolate(await storey.get());
    else await hider.set(true);
    setActiveStorey(storey?.name ?? null);
    await engine.components.get(OBC.FragmentsManager).core.update(true);
  }

  async function fit() {
    await engineRef.current?.world.camera.fitToItems();
  }

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-surface">
      <div className="relative aspect-[4/3] w-full sm:aspect-[16/10]">
        <div ref={containerRef} className="absolute inset-0" />
        {state.kind !== "ready" && (
          <div className="absolute inset-0 flex items-center justify-center p-6 text-center text-sm text-muted">
            {state.kind === "loading" ? state.step : <span className="text-red-600 dark:text-red-400">{state.message}</span>}
          </div>
        )}
      </div>
      {state.kind === "ready" && (
        <div className="flex flex-wrap items-center gap-2 border-t border-border p-3 text-xs">
          <button type="button" onClick={fit} className="rounded-full border border-border px-3 py-1 hover:border-subtle">
            Fit
          </button>
          {state.storeys.length > 0 && <span className="mx-1 h-4 w-px bg-border" aria-hidden="true" />}
          {state.storeys.length > 0 && (
            <button
              type="button"
              onClick={() => showStorey(null)}
              className={`rounded-full border px-3 py-1 ${activeStorey === null ? "border-foreground bg-foreground text-background" : "border-border hover:border-subtle"}`}
            >
              All storeys
            </button>
          )}
          {state.storeys.map((storey) => (
            <button
              key={storey.name}
              type="button"
              onClick={() => showStorey(storey)}
              className={`rounded-full border px-3 py-1 ${activeStorey === storey.name ? "border-foreground bg-foreground text-background" : "border-border hover:border-subtle"}`}
            >
              {storey.name}
            </button>
          ))}
          <span className="ml-auto text-muted">Drag to orbit · scroll to zoom · right-drag to pan</span>
        </div>
      )}
    </div>
  );
}
