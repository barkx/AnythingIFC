import type { ModelSummary, PublicProject } from "@ifcwise/shared";
import { cacheLife } from "next/cache";
import { ModelViewer } from "@/components/model-viewer";
import { formatBytes } from "@/components/ui";

// Output blobs have random suffixes and never change, so their contents can be cached for good.
async function loadText(url: string): Promise<string | null> {
  "use cache";
  cacheLife("max");
  const response = await fetch(url);
  return response.ok ? response.text() : null;
}

async function loadSummary(url: string): Promise<ModelSummary | null> {
  const text = await loadText(url);
  if (!text) return null;
  try {
    return JSON.parse(text) as ModelSummary;
  } catch {
    return null;
  }
}

const byName = (files: PublicProject["outputs"], pattern: RegExp) => files.find((f) => pattern.test(f.filename));

export async function ModelSection({ project }: { project: PublicProject }) {
  const ifc = byName(project.outputs, /\.ifc$/i);
  const summaryFile = byName(project.outputs, /summary.*\.json$/i);
  const assumptionsFile = byName(project.outputs, /assumptions.*\.md$/i);
  const [summary, assumptions] = await Promise.all([
    summaryFile ? loadSummary(summaryFile.url) : null,
    assumptionsFile ? loadText(assumptionsFile.url) : null,
  ]);

  if (!ifc) {
    return (
      <p className="mt-2 rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted">
        The IFC model will appear here when it&apos;s ready.
      </p>
    );
  }

  return (
    <div className="mt-3 space-y-6">
      <ModelViewer url={ifc.url} />

      <div className="flex flex-wrap gap-3">
        <a
          href={`${ifc.url}?download=1`}
          className="rounded-md bg-accent px-5 py-2.5 text-sm font-medium text-accent-foreground hover:opacity-90"
        >
          Download IFC ({formatBytes(ifc.size)})
        </a>
        {project.outputs
          .filter((f) => f !== ifc)
          .map((f) => (
            <a key={f.pathname} href={`${f.url}?download=1`} className="rounded-md border border-border bg-surface px-4 py-2.5 text-sm hover:border-subtle">
              {f.filename}
            </a>
          ))}
      </div>

      {summary && <SummaryTable summary={summary} />}

      {assumptions && (
        <div>
          <h3 className="font-semibold">Assumptions</h3>
          <p className="mt-1 text-sm text-muted">What we had to guess while modelling — check these before relying on the model.</p>
          <pre className="mt-3 rounded-lg border border-border bg-surface p-4 font-sans text-sm whitespace-pre-wrap">{assumptions}</pre>
        </div>
      )}
    </div>
  );
}

function SummaryTable({ summary }: { summary: ModelSummary }) {
  const classes = Object.entries(summary.counts).sort((a, b) => b[1] - a[1]);
  return (
    <div>
      <h3 className="font-semibold">What&apos;s in the model</h3>
      <p className="mt-1 text-sm text-muted">
        {summary.schema} · {summary.storeys.length} storey{summary.storeys.length === 1 ? "" : "s"}
        {summary.floorAreaM2 ? ` · ${Math.round(summary.floorAreaM2)} m² floor area` : ""}
      </p>
      <div className="mt-3 overflow-x-auto rounded-lg border border-border bg-surface">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-border text-xs text-muted">
            <tr>
              <th className="px-3 py-2 font-medium">Element</th>
              <th className="px-3 py-2 text-right font-medium">Total</th>
              {summary.storeys.map((s) => (
                <th key={s.name} className="px-3 py-2 text-right font-medium whitespace-nowrap">
                  {s.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border font-mono text-xs">
            {classes.map(([ifcClass, total]) => (
              <tr key={ifcClass}>
                <td className="px-3 py-2">{ifcClass}</td>
                <td className="px-3 py-2 text-right">{total}</td>
                {summary.storeys.map((s) => (
                  <td key={s.name} className="px-3 py-2 text-right text-muted">
                    {s.counts[ifcClass] ?? "–"}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {summary.warnings.length > 0 && (
        <ul className="mt-3 space-y-1 text-xs text-amber-700 dark:text-amber-300">
          {summary.warnings.map((w) => (
            <li key={w}>⚠ {w}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
