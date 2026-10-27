import { BUILDING_TYPE_LABELS, type PublicProject } from "@ifcwise/shared";
import Image from "next/image";
import Link from "next/link";
import { LogoMark } from "@/components/logo";
import { StatusBadge } from "@/components/ui";

export function ProjectCard({ project, thumbnail }: { project: PublicProject; thumbnail?: string }) {
  return (
    <Link
      href={`/p/${project.id}`}
      className="group flex flex-col overflow-hidden rounded-xl border border-border bg-surface hover:border-subtle"
    >
      <div className="relative flex aspect-[4/3] items-center justify-center bg-background">
        {thumbnail ? (
          <Image src={thumbnail} alt="" fill sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw" className="object-cover" />
        ) : (
          <LogoMark className="size-12 text-subtle" />
        )}
        <span className="absolute top-3 left-3">
          <StatusBadge status={project.status} />
        </span>
      </div>
      <div className="flex flex-1 flex-col gap-1 p-4">
        <h2 className="line-clamp-2 font-semibold group-hover:text-accent">{project.title}</h2>
        <p className="text-sm text-muted">
          {project.authorName}
          {project.buildingType && ` · ${BUILDING_TYPE_LABELS[project.buildingType]}`}
          {project.storeys && ` · ${project.storeys} storey${project.storeys > 1 ? "s" : ""}`}
        </p>
      </div>
    </Link>
  );
}
