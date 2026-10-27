import { BUILDING_TYPE_LABELS, type PublicProject, type SampleProject } from "@ifcwise/shared";
import { LogoMark } from "@ifcwise/ui";
import { ArrowRight, Layers, Ruler } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { StatusBadge } from "@/components/ui";

const cardClass =
  "group flex w-full flex-col overflow-hidden rounded-2xl border border-border bg-background shadow-soft transition hover:-translate-y-0.5 hover:border-subtle hover:shadow-float";

export function ProjectCard({ project, thumbnail }: { project: PublicProject; thumbnail?: string }) {
  return (
    <Link href={`/p/${project.id}`} className={cardClass}>
      <div className="relative flex aspect-[4/3] items-center justify-center border-b border-border bg-surface">
        {thumbnail ? (
          <Image src={thumbnail} alt="" fill sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw" className="object-cover" />
        ) : (
          <LogoMark className="size-12 opacity-30" />
        )}
        <span className="absolute top-3 left-3">
          <StatusBadge status={project.status} className="bg-background/90 backdrop-blur" />
        </span>
      </div>
      <div className="flex flex-1 flex-col gap-1 p-4">
        <h3 className="line-clamp-2 font-semibold tracking-tight group-hover:text-accent">{project.title}</h3>
        <p className="text-sm text-muted">
          {project.authorName}
          {project.buildingType && ` · ${BUILDING_TYPE_LABELS[project.buildingType]}`}
          {project.storeys && ` · ${project.storeys} storey${project.storeys > 1 ? "s" : ""}`}
        </p>
      </div>
    </Link>
  );
}

export function SampleCard({ sample }: { sample: SampleProject }) {
  return (
    <Link href={`/samples/${sample.slug}`} className={cardClass}>
      <div className="relative aspect-[4/3] overflow-hidden border-b border-border bg-white">
        {/* Plans are vector drawings on white paper; next/image doesn't optimise SVG anyway. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={`/samples/${sample.slug}/plan.svg`} alt={`${sample.title} ground floor plan`} className="size-full object-contain p-2 transition duration-500 group-hover:scale-[1.03]" />
        <span className="absolute top-3 left-3 rounded-full bg-foreground px-2.5 py-0.5 text-xs font-medium text-background">
          Reference
        </span>
      </div>
      <div className="flex flex-1 flex-col p-4">
        <p className="text-xs font-medium text-accent">{BUILDING_TYPE_LABELS[sample.buildingType]}</p>
        <h3 className="mt-1 font-semibold tracking-tight">{sample.title}</h3>
        <p className="mt-1 line-clamp-2 text-sm text-muted">{sample.description}</p>
        <div className="mt-auto flex items-center gap-4 pt-4 text-xs text-muted">
          <span className="flex items-center gap-1.5">
            <Layers className="size-3.5" aria-hidden="true" />
            {sample.storeys} storey{sample.storeys > 1 ? "s" : ""}
          </span>
          {sample.floorAreaM2 && (
            <span className="flex items-center gap-1.5">
              <Ruler className="size-3.5" aria-hidden="true" />
              {Math.round(sample.floorAreaM2)} m²
            </span>
          )}
          <ArrowRight className="ml-auto size-4 text-subtle transition group-hover:translate-x-0.5 group-hover:text-accent" aria-hidden="true" />
        </div>
      </div>
    </Link>
  );
}
