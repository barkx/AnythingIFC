import { BUILDING_TYPES, BUILDING_TYPE_LABELS, type BuildingType, type PublicProject } from "@ifcwise/shared";
import Link from "next/link";
import { Suspense } from "react";
import { ProjectCard } from "@/components/project-card";
import { listPublishedProjects, thumbnailUrl } from "@/lib/project-list";

const STATUS_FILTERS = {
  all: { label: "All", match: () => true },
  completed: { label: "Completed", match: (p: PublicProject) => p.status === "completed" },
  in_progress: { label: "In progress", match: (p: PublicProject) => p.status !== "completed" },
} as const;
type StatusFilter = keyof typeof STATUS_FILTERS;

export default function GalleryPage({ searchParams }: PageProps<"/">) {
  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-mono text-xs tracking-widest text-accent uppercase">Public projects</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">From drawings to IFC</h1>
          <p className="mt-2 max-w-2xl text-muted">
            Every project here started as drawings, sketches or a description and was modelled as IFC.
          </p>
        </div>
        <Link href="/new" className="rounded-md bg-accent px-5 py-2.5 text-sm font-medium text-accent-foreground">
          Start a project
        </Link>
      </div>
      <Suspense fallback={<p className="mt-10 text-muted">Loading projects…</p>}>
        <Gallery searchParams={searchParams} />
      </Suspense>
    </main>
  );
}

async function Gallery({ searchParams }: { searchParams: PageProps<"/">["searchParams"] }) {
  const params = await searchParams;
  const status: StatusFilter = params.status === "completed" || params.status === "in_progress" ? params.status : "all";
  const type = BUILDING_TYPES.find((t) => t === params.type);

  const all = await listPublishedProjects();
  const projects = all.filter((p) => STATUS_FILTERS[status].match(p) && (!type || p.buildingType === type));

  const href = (next: { status?: StatusFilter; type?: BuildingType }) => {
    const q = new URLSearchParams();
    const s = "status" in next ? next.status : status;
    const t = "type" in next ? next.type : type;
    if (s && s !== "all") q.set("status", s);
    if (t) q.set("type", t);
    const query = q.toString();
    return query ? `/?${query}` : "/";
  };

  return (
    <>
      <nav aria-label="Filters" className="mt-8 flex flex-wrap items-center gap-2 text-sm">
        {(Object.keys(STATUS_FILTERS) as StatusFilter[]).map((key) => (
          <Chip key={key} href={href({ status: key })} active={status === key}>
            {STATUS_FILTERS[key].label}
          </Chip>
        ))}
        <span className="mx-2 h-5 w-px bg-border" aria-hidden="true" />
        <Chip href={href({ type: undefined })} active={!type}>
          Any type
        </Chip>
        {BUILDING_TYPES.map((t) => (
          <Chip key={t} href={href({ type: t })} active={type === t}>
            {BUILDING_TYPE_LABELS[t]}
          </Chip>
        ))}
      </nav>

      {projects.length ? (
        <ul className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <li key={project.id} className="flex">
              <ProjectCard project={project} thumbnail={thumbnailUrl(project)} />
            </li>
          ))}
        </ul>
      ) : (
        <div className="mt-8 rounded-xl border border-dashed border-border p-12 text-center">
          <p className="font-medium">{all.length ? "No projects match these filters." : "No public projects yet."}</p>
          <p className="mt-2 text-sm text-muted">
            {all.length ? (
              <Link href="/" className="text-accent hover:underline">
                Clear filters
              </Link>
            ) : (
              "Be the first — start a project and it will appear here once reviewed."
            )}
          </p>
        </div>
      )}
    </>
  );
}

function Chip({ href, active, children }: { href: string; active: boolean; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={`rounded-full border px-3 py-1 ${
        active ? "border-foreground bg-foreground text-background" : "border-border bg-surface text-muted hover:text-foreground"
      }`}
    >
      {children}
    </Link>
  );
}
