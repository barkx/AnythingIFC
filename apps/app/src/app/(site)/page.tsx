import { BUILDING_TYPES, BUILDING_TYPE_LABELS, SAMPLE_PROJECTS, type BuildingType, type PublicProject } from "@ifcwise/shared";
import { ButtonLink, Pill, cx } from "@ifcwise/ui";
import { Plus, Sparkles, Upload } from "lucide-react";
import Link from "next/link";
import { Suspense, type ReactNode } from "react";
import { ProjectCard, SampleCard } from "@/components/project-card";
import { PageHeader } from "@/components/ui";
import { listPublishedProjects, thumbnailUrl } from "@/lib/project-list";

const STATUS_FILTERS = {
  all: { label: "All", match: () => true },
  completed: { label: "Completed", match: (p: PublicProject) => p.status === "completed" },
  in_progress: { label: "In progress", match: (p: PublicProject) => p.status !== "completed" },
} as const;
type StatusFilter = keyof typeof STATUS_FILTERS;

export default function GalleryPage({ searchParams }: PageProps<"/">) {
  return (
    <main>
      <PageHeader
        eyebrow={
          <Pill>
            <Sparkles className="size-3.5 text-accent" aria-hidden="true" />
            Public gallery · early access
          </Pill>
        }
        title={
          <>
            Drawings in, <span className="text-gradient">IFC models</span> out.
          </>
        }
        description="Every project here started as CAD drawings, PDF plans, sketches or a description — and came back as an IFC model you can open in any BIM tool."
        actions={
          <ButtonLink href="/new" variant="accent" size="lg">
            <Upload className="size-4" aria-hidden="true" />
            Start a project
          </ButtonLink>
        }
      />

      <section id="reference-projects" className="mx-auto w-full max-w-6xl scroll-mt-20 px-4 py-14 sm:px-6">
        <SectionTitle
          title="Reference projects"
          description="Built with the same pipeline as every customer project. Open one to explore the model in 3D, check the element summary or download the IFC."
        />
        <ul className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {SAMPLE_PROJECTS.map((sample) => (
            <li key={sample.slug} className="flex">
              <SampleCard sample={sample} />
            </li>
          ))}
        </ul>
      </section>

      <section className="border-t border-border bg-surface">
        <div className="mx-auto w-full max-w-6xl px-4 py-14 sm:px-6">
          <SectionTitle title="Community projects" description="Reviewed projects from people using IFCWise." />
          <Suspense fallback={<p className="mt-8 text-muted">Loading projects…</p>}>
            <Gallery searchParams={searchParams} />
          </Suspense>
        </div>
      </section>
    </main>
  );
}

function SectionTitle({ title, description }: { title: string; description: string }) {
  return (
    <div className="max-w-2xl">
      <h2 className="text-2xl font-semibold tracking-tight">{title}</h2>
      <p className="mt-2 text-muted">{description}</p>
    </div>
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

  if (all.length === 0) {
    return (
      <div className="mt-8 flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border bg-background px-6 py-14 text-center">
        <span className="flex size-12 items-center justify-center rounded-xl bg-accent-soft text-accent">
          <Plus className="size-6" aria-hidden="true" />
        </span>
        <p className="font-semibold">Be the first community project</p>
        <p className="max-w-sm text-sm text-muted">Upload a drawing, sketch or description. Once reviewed, it appears here with its IFC model.</p>
        <ButtonLink href="/new" variant="primary" className="mt-2">
          Start a project
        </ButtonLink>
      </div>
    );
  }

  return (
    <>
      <nav aria-label="Filters" className="mt-6 flex flex-wrap items-center gap-2 text-sm">
        {(Object.keys(STATUS_FILTERS) as StatusFilter[]).map((key) => (
          <Chip key={key} href={href({ status: key })} active={status === key}>
            {STATUS_FILTERS[key].label}
          </Chip>
        ))}
        <span className="mx-1 h-5 w-px bg-border" aria-hidden="true" />
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
        <ul className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <li key={project.id} className="flex">
              <ProjectCard project={project} thumbnail={thumbnailUrl(project)} />
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-8 text-sm text-muted">
          No projects match these filters.{" "}
          <Link href="/" className="text-accent hover:underline">
            Clear filters
          </Link>
        </p>
      )}
    </>
  );
}

function Chip({ href, active, children }: { href: string; active: boolean; children: ReactNode }) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cx(
        "rounded-full px-3 py-1 font-medium ring-1 ring-inset transition",
        active ? "bg-foreground text-background ring-foreground" : "bg-background text-muted ring-border hover:text-foreground",
      )}
    >
      {children}
    </Link>
  );
}
