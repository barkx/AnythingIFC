"use client";

import * as OBC from "@thatopen/components";
import * as FRAGS from "@thatopen/fragments";
import { useEffect, useRef, useState } from "react";
import * as THREE from "three";

type Storey = { name: string; get: () => Promise<OBC.ModelIdMap> };
type ViewerState =
  | { kind: "loading"; step: string }
  | { kind: "ready"; storeys: Storey[] }
  | { kind: "error"; message: string };

type World = OBC.SimpleWorld<OBC.SimpleScene, OBC.OrthoPerspectiveCamera, OBC.SimpleRenderer>;

// Category colours: glass, timber, concrete. Anything else keeps the model's own (white) material.
const CATEGORY_STYLES: [RegExp, string, number][] = [
  [/WINDOW/i, "#7dd3fc", 0.45],
  [/DOOR/i, "#a16207", 1],
  [/SLAB|ROOF/i, "#d4d4d8", 1],
];

// Renders an IFC file from a URL with That Open Engine. All assets are self-hosted in /vendor
// (copied by scripts/copy-viewer-assets.mjs).
export default function IfcViewer({ url, bare = false }: { url: string; bare?: boolean }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<{ components: OBC.Components; world: World; spaces: OBC.ModelIdMap | null } | null>(null);
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
    engineRef.current = { components, world, spaces: null };

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
        // The model is visible now; colouring and storey grouping follow without blocking the view.
        setState({ kind: "ready", storeys: [] });

        const classifier = components.get(OBC.Classifier);
        await classifier.byCategory({ classificationName: "Categories" });
        for (const [category, group] of classifier.list.get("Categories")?.entries() ?? []) {
          const map = await group.get();
          if (/SPACE/i.test(category)) {
            // Room volumes would fill every room with a solid box; they stay in the data, not the view.
            engineRef.current!.spaces = map;
            await components.get(OBC.Hider).set(false, map);
            continue;
          }
          const style = CATEGORY_STYLES.find(([pattern]) => pattern.test(category));
          if (style) {
            await fragments.highlight(
              { color: new THREE.Color(style[1]), opacity: style[2], transparent: style[2] < 1, renderedFaces: FRAGS.RenderedFaces.TWO },
              map,
            );
          }
        }
        await fragments.core.update(true);

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
    if (engine.spaces) await hider.set(false, engine.spaces);
    setActiveStorey(storey?.name ?? null);
    await engine.components.get(OBC.FragmentsManager).core.update(true);
  }

  async function fit() {
    await engineRef.current?.world.camera.fitToItems();
  }

  const chip = (active: boolean) =>
    `rounded-full px-3 py-1 font-medium backdrop-blur transition ${
      active ? "bg-foreground text-background" : "bg-background/80 text-muted ring-1 ring-border hover:text-foreground"
    }`;

  return (
    <div
      className={
        bare
          ? "relative h-full w-full"
          : "relative overflow-hidden rounded-2xl border border-border bg-surface shadow-soft"
      }
    >
      <div className={bare ? "absolute inset-0" : "relative aspect-[4/3] w-full sm:aspect-[16/10]"}>
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,var(--surface-2),transparent_70%)]" />
        <div ref={containerRef} className="absolute inset-0" />
        {state.kind !== "ready" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-6 text-center text-sm text-muted">
            {state.kind === "loading" ? (
              <>
                <span className="size-6 animate-spin rounded-full border-2 border-border border-t-accent" aria-hidden="true" />
                {state.step}
              </>
            ) : (
              <span className="text-red-600 dark:text-red-400">{state.message}</span>
            )}
          </div>
        )}
        {state.kind === "ready" && (
          <div className="absolute top-3 left-3 flex max-w-[calc(100%-1.5rem)] flex-wrap items-center gap-1.5 text-xs sm:max-w-[70%]">
            <button type="button" onClick={fit} className={chip(false)}>
              Fit view
            </button>
            {state.storeys.length > 1 && (
              <>
                <button type="button" onClick={() => showStorey(null)} className={chip(activeStorey === null)}>
                  All storeys
                </button>
                {state.storeys.map((storey) => (
                  <button key={storey.name} type="button" onClick={() => showStorey(storey)} className={chip(activeStorey === storey.name)}>
                    {storey.name}
                  </button>
                ))}
              </>
            )}
          </div>
        )}
        {state.kind === "ready" && !bare && (
          <p className="pointer-events-none absolute right-3 bottom-3 hidden rounded-full bg-background/80 px-3 py-1 text-xs text-muted ring-1 ring-border backdrop-blur sm:block">
            Drag to orbit · scroll to zoom
          </p>
        )}
      </div>
    </div>
  );
}
