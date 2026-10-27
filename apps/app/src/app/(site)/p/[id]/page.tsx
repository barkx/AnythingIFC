import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ProjectView } from "@/components/project-view";
import { ID_PATTERN } from "@/lib/blob-paths";
import { isListed, thumbnailUrl } from "@/lib/project-list";
import { readProject, toPublic } from "@/lib/projects";

const CONTACT_EMAIL = process.env.NEXT_PUBLIC_CONTACT_EMAIL ?? "hello@ifcwise.com";

export async function generateMetadata({ params }: PageProps<"/p/[id]">): Promise<Metadata> {
  const { id } = await params;
  const loaded = ID_PATTERN.test(id) ? await readProject(id) : null;
  if (!loaded) return { title: "Project not found", robots: { index: false } };
  const project = toPublic(loaded.project);
  const image = thumbnailUrl(project);
  return {
    title: project.title,
    description: project.description.slice(0, 160),
    // Only reviewed projects are indexed; unpublished ones are reachable by link only.
    robots: isListed(project) ? undefined : { index: false, follow: false },
    openGraph: { title: project.title, description: project.description.slice(0, 160), images: image ? [image] : undefined },
  };
}

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
  const subject = encodeURIComponent(`Report project ${id}`);
  return (
    <>
      <ProjectView project={toPublic(loaded.project)} />
      <p className="mt-12 border-t border-border pt-6 text-xs text-muted">
        Is this your drawing, or does it show something it shouldn&apos;t?{" "}
        <a href={`mailto:${CONTACT_EMAIL}?subject=${subject}`} className="underline hover:text-foreground">
          Report this project
        </a>
        .
      </p>
    </>
  );
}
