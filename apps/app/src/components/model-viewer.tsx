"use client";

import dynamic from "next/dynamic";

// The engine needs WebGL and workers, so it only ever runs in the browser.
const IfcViewer = dynamic(() => import("@/components/ifc-viewer"), {
  ssr: false,
  loading: () => (
    <div className="flex aspect-[4/3] items-center justify-center rounded-xl border border-border bg-surface text-sm text-muted sm:aspect-[16/10]">
      Loading viewer…
    </div>
  ),
});

export function ModelViewer({ url }: { url: string }) {
  return <IfcViewer url={url} />;
}
