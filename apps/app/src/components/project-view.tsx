import { BUILDING_TYPE_LABELS, PROJECT_STATUS_LABELS, type PublicProject } from "@ifcwise/shared";
import { Pill } from "@ifcwise/ui";
import { Download, FileText, MessageSquareWarning } from "lucide-react";
import type { ReactNode } from "react";
import { ModelSection } from "@/components/model-section";
import { PageHeader, Panel, StatusBadge, formatBytes } from "@/components/ui";

const dateFormat = new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "short", timeZone: "UTC" });
const formatDate = (iso: string) => `${dateFormat.format(new Date(iso))} UTC`;

export function ProjectView({ project, aside, footer }: { project: PublicProject; aside?: ReactNode; footer?: ReactNode }) {
  const facts: [string, string][] = [
    ["Created by", project.authorName],
    ["Created", formatDate(project.createdAt)],
    ...(project.buildingType ? ([["Building type", BUILDING_TYPE_LABELS[project.buildingType]]] as [string, string][]) : []),
    ...(project.storeys ? ([["Storeys", String(project.storeys)]] as [string, string][]) : []),
    ...(project.approxAreaM2
      ? ([["Approx. area", `${project.approxAreaM2} ${project.units === "ft" ? "ft²" : "m²"}`]] as [string, string][])
      : []),
  ];

  return (
    <article>
      <PageHeader
        eyebrow={
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={project.status} />
            {!project.published && project.status !== "draft" && <Pill>Awaiting review · not listed yet</Pill>}
          </div>
        }
        title={project.title}
      />

      <div className="mx-auto grid w-full max-w-6xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[1fr_340px]">
        <div className="min-w-0 space-y-10">
          {project.adminMessage && (
            <div className="flex gap-3 rounded-2xl border border-amber-300 bg-amber-50 p-5 text-sm dark:border-amber-900 dark:bg-amber-950/40">
              <MessageSquareWarning className="mt-0.5 size-5 shrink-0 text-amber-600" aria-hidden="true" />
              <div>
                <p className="font-semibold">Message from IFCWise</p>
                <p className="mt-1 whitespace-pre-wrap">{project.adminMessage}</p>
              </div>
            </div>
          )}

          <section className="space-y-4">
            <h2 className="text-xl font-semibold tracking-tight">Model</h2>
            <ModelSection project={project} />
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold tracking-tight">Description</h2>
            <p className="whitespace-pre-wrap text-muted">{project.description}</p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold tracking-tight">Input files</h2>
            {project.inputs.length ? (
              <ul className="divide-y divide-border overflow-hidden rounded-xl border border-border">
                {project.inputs.map((file) => (
                  <li key={file.pathname} className="flex items-center gap-3 px-4 py-3 text-sm">
                    <FileText className="size-4 shrink-0 text-muted" aria-hidden="true" />
                    <span className="min-w-0 flex-1 truncate font-medium">{file.filename}</span>
                    <span className="shrink-0 font-mono text-xs text-muted">{formatBytes(file.size)}</span>
                    <a href={`${file.url}?download=1`} className="shrink-0 rounded-md p-1.5 text-muted hover:bg-surface-2 hover:text-foreground" aria-label={`Download ${file.filename}`}>
                      <Download className="size-4" aria-hidden="true" />
                    </a>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted">No files — modelled from the description.</p>
            )}
          </section>
          {footer}
        </div>

        <aside className="space-y-5 lg:sticky lg:top-24 lg:self-start">
          {aside}
          <Panel title="Details">
            <dl className="space-y-2.5 text-sm">
              {facts.map(([k, v]) => (
                <div key={k} className="flex justify-between gap-4">
                  <dt className="text-muted">{k}</dt>
                  <dd className="text-right font-medium">{v}</dd>
                </div>
              ))}
            </dl>
          </Panel>
          <Panel title="History">
            <ol className="relative space-y-4 border-l border-border pl-5 text-sm">
              {project.events.map((event, i) => (
                <li key={i} className="relative">
                  <span className="absolute top-1.5 -left-[25px] size-2.5 rounded-full border-2 border-background bg-accent ring-1 ring-border" aria-hidden="true" />
                  <p className="font-medium">
                    {PROJECT_STATUS_LABELS[event.status]} <span className="font-normal text-muted">· {event.by}</span>
                  </p>
                  <p className="text-xs text-muted">{formatDate(event.at)}</p>
                  {event.note && <p className="mt-1 whitespace-pre-wrap text-muted">{event.note}</p>}
                </li>
              ))}
            </ol>
          </Panel>
        </aside>
      </div>
    </article>
  );
}
