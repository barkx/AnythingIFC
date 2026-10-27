"use client";

import dynamic from "next/dynamic";

// The engine needs WebGL and workers, so it only ever runs in the browser.
const IfcViewer = dynamic(() => import("@/components/ifc-viewer"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full min-h-64 w-full items-center justify-center text-sm text-muted">Loading viewer…</div>
  ),
});

export function ModelViewer({ url, bare }: { url: string; bare?: boolean }) {
  return <IfcViewer url={url} bare={bare} />;
}
