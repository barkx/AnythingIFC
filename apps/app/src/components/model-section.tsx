import type { ModelSummary, PublicProject } from "@ifcwise/shared";
import { cacheLife } from "next/cache";
import { buttonClass } from "@ifcwise/ui";
import { Box, Download, FileText } from "lucide-react";
import { Assumptions, StatTiles, SummaryTable } from "@/components/model-details";
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
      <div className="flex aspect-[16/10] flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-border bg-surface p-6 text-center">
        <Box className="size-8 text-subtle" aria-hidden="true" />
        <p className="font-medium">The IFC model will appear here</p>
        <p className="text-sm text-muted">We&apos;ll email the creator as soon as it&apos;s ready.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <ModelViewer url={ifc.url} />
      <div className="flex flex-wrap gap-2">
        <a href={`${ifc.url}?download=1`} className={buttonClass("accent", "md")}>
          <Download className="size-4" aria-hidden="true" />
          Download IFC · {formatBytes(ifc.size)}
        </a>
        {project.outputs
          .filter((f) => f !== ifc)
          .map((f) => (
            <a key={f.pathname} href={`${f.url}?download=1`} className={buttonClass("secondary", "md")}>
              <FileText className="size-4" aria-hidden="true" />
              {f.filename}
            </a>
          ))}
      </div>
      {summary && (
        <section className="space-y-4">
          <h3 className="text-lg font-semibold">What&apos;s in the model</h3>
          <StatTiles summary={summary} />
          <SummaryTable summary={summary} />
        </section>
      )}
      {assumptions && (
        <section className="space-y-3">
          <div>
            <h3 className="text-lg font-semibold">Assumptions</h3>
            <p className="text-sm text-muted">What had to be guessed while modelling — check these before relying on the model.</p>
          </div>
          <Assumptions markdown={assumptions} />
        </section>
      )}
    </div>
  );
}
