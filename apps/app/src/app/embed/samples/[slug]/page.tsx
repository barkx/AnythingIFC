import { SAMPLE_PROJECTS } from "@ifcwise/shared";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ModelViewer } from "@/components/model-viewer";
import { getSample, sampleFile } from "@/lib/samples";

// Chrome-free viewer for embedding (the ifcwise.com hero shows this in an iframe).
export const metadata: Metadata = { title: "Model viewer", robots: { index: false } };

export function generateStaticParams() {
  return SAMPLE_PROJECTS.map((s) => ({ slug: s.slug }));
}

export default function EmbedSample({ params }: PageProps<"/embed/samples/[slug]">) {
  return (
    <Suspense>
      <EmbedContent params={params} />
    </Suspense>
  );
}

async function EmbedContent({ params }: Pick<PageProps<"/embed/samples/[slug]">, "params">) {
  const sample = getSample((await params).slug);
  if (!sample) notFound();
  return (
    <main className="h-dvh w-full bg-transparent">
      <ModelViewer url={sampleFile(sample.slug, "model.ifc")} bare />
    </main>
  );
}
