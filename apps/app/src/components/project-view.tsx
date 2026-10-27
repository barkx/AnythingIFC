import { BUILDING_TYPE_LABELS, PROJECT_STATUS_LABELS, type PublicProject } from "@ifcwise/shared";
import { StatusBadge, formatBytes } from "@/components/ui";

const dateFormat = new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "short", timeZone: "UTC" });
const formatDate = (iso: string) => `${dateFormat.format(new Date(iso))} UTC`;

export function ProjectView({ project }: { project: PublicProject }) {
  const facts = [
    project.buildingType && BUILDING_TYPE_LABELS[project.buildingType],
    project.storeys && `${project.storeys} storey${project.storeys > 1 ? "s" : ""}`,
    project.approxAreaM2 && `~${project.approxAreaM2} ${project.units === "ft" ? "ft²" : "m²"}`,
  ].filter(Boolean);

  return (
    <article className="space-y-10">
      <header>
        <div className="flex flex-wrap items-center gap-3">
          <StatusBadge status={project.status} />
          {!project.published && project.status !== "draft" && (
            <span className="font-mono text-xs text-muted">Awaiting review · not listed yet</span>
          )}
        </div>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight break-words">{project.title}</h1>
        <p className="mt-2 text-sm text-muted">
          by {project.authorName} · {formatDate(project.createdAt)}
          {facts.length > 0 && ` · ${facts.join(" · ")}`}
        </p>
      </header>

      {project.adminMessage && (
        <section className="rounded-xl border border-amber-300 bg-amber-50 p-5 text-sm dark:border-amber-900 dark:bg-amber-950/40">
          <p className="font-medium">Message from IFCWise</p>
          <p className="mt-1 whitespace-pre-wrap">{project.adminMessage}</p>
        </section>
      )}

      <section>
        <h2 className="text-lg font-semibold">Description</h2>
        <p className="mt-2 whitespace-pre-wrap text-muted">{project.description}</p>
      </section>

      <section>
        <h2 className="text-lg font-semibold">Model</h2>
        {project.outputs.length ? (
          <FileList files={project.outputs} />
        ) : (
          <p className="mt-2 rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted">
            The IFC model will appear here when it&apos;s ready.
          </p>
        )}
      </section>

      <section>
        <h2 className="text-lg font-semibold">Input files</h2>
        {project.inputs.length ? (
          <FileList files={project.inputs} />
        ) : (
          <p className="mt-2 text-sm text-muted">No files — modelled from the description.</p>
        )}
      </section>

      <section>
        <h2 className="text-lg font-semibold">History</h2>
        <ol className="mt-3 space-y-3 border-l border-border pl-5 text-sm">
          {project.events.map((event, i) => (
            <li key={i}>
              <p>
                <span className="font-medium">{PROJECT_STATUS_LABELS[event.status]}</span>{" "}
                <span className="text-muted">
                  · {event.by} · {formatDate(event.at)}
                </span>
              </p>
              {event.note && <p className="mt-1 whitespace-pre-wrap text-muted">{event.note}</p>}
            </li>
          ))}
        </ol>
      </section>
    </article>
  );
}

function FileList({ files }: { files: PublicProject["inputs"] }) {
  return (
    <ul className="mt-3 divide-y divide-border rounded-lg border border-border bg-surface text-sm">
      {files.map((file) => (
        <li key={file.pathname} className="flex items-center gap-3 px-4 py-2.5">
          <span className="min-w-0 flex-1 truncate">{file.filename}</span>
          <span className="shrink-0 font-mono text-xs text-muted">{formatBytes(file.size)}</span>
          <a href={`${file.url}?download=1`} className="shrink-0 font-medium text-accent hover:underline">
            Download
          </a>
        </li>
      ))}
    </ul>
  );
}
