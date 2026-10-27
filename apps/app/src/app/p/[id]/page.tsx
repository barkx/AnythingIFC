import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ProjectView } from "@/components/project-view";
import { ID_PATTERN } from "@/lib/blob-paths";
import { readProject, toPublic } from "@/lib/projects";

// TODO(Phase 3): index published projects with per-project metadata.
export const metadata: Metadata = { title: "Project", robots: { index: false } };

export default function ProjectPage({ params }: PageProps<"/p/[id]">) {
  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-12 sm:px-6">
      <Suspense fallback={<p className="text-muted">Loading project…</p>}>
        <ProjectContent params={params} />
      </Suspense>
    </main>
  );
}

async function ProjectContent({ params }: { params: PageProps<"/p/[id]">["params"] }) {
  const { id } = await params;
  if (!ID_PATTERN.test(id)) notFound();
  const loaded = await readProject(id);
  if (!loaded) notFound();
  return <ProjectView project={toPublic(loaded.project)} />;
}
