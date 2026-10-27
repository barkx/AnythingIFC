import { BUILDING_TYPE_LABELS, SAMPLE_PROJECTS } from "@ifcwise/shared";
import { ButtonLink, Pill, buttonClass } from "@ifcwise/ui";
import { ArrowRight, Download, FileCode2, FileJson, FileText, Image as ImageIcon } from "lucide-react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Assumptions, StatTiles, SummaryTable } from "@/components/model-details";
import { ModelViewer } from "@/components/model-viewer";
import { PageHeader, Panel, formatBytes } from "@/components/ui";
import { getSample, getSampleDetails, sampleFile } from "@/lib/samples";

export function generateStaticParams() {
  return SAMPLE_PROJECTS.map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({ params }: PageProps<"/samples/[slug]">): Promise<Metadata> {
  const sample = getSample((await params).slug);
  return sample
    ? { title: `${sample.title} — reference project`, description: sample.description, openGraph: { images: [sampleFile(sample.slug, "plan.svg")] } }
    : { title: "Reference project not found" };
}

export default function SamplePage({ params }: PageProps<"/samples/[slug]">) {
  return (
    <Suspense fallback={<main className="mx-auto w-full max-w-6xl px-4 py-16 text-muted sm:px-6">Loading…</main>}>
      <SampleContent params={params} />
    </Suspense>
  );
}

async function SampleContent({ params }: Pick<PageProps<"/samples/[slug]">, "params">) {
  const sample = getSample((await params).slug);
  if (!sample) notFound();
  const files = [
    { name: "model.ifc", label: "IFC4 model", icon: FileCode2, size: formatBytes(sample.ifcBytes) },
    { name: "plan.svg", label: "Ground floor plan (input)", icon: ImageIcon },
    { name: "summary.json", label: "Element summary", icon: FileJson },
    { name: "assumptions.md", label: "Assumptions", icon: FileText },
    { name: "model-spec.json", label: "Model spec (Route B)", icon: FileJson },
  ];

  return (
    <main>
      <PageHeader
        eyebrow={
          <div className="flex flex-wrap gap-2">
            <Pill>Reference project</Pill>
            <Pill>{BUILDING_TYPE_LABELS[sample.buildingType]}</Pill>
          </div>
        }
        title={sample.title}
        description={sample.description}
        actions={
          <>
            <a href={`${sampleFile(sample.slug, "model.ifc")}`} download className={buttonClass("accent", "lg")}>
              <Download className="size-4" aria-hidden="true" />
              Download IFC
            </a>
            <ButtonLink href="/new" variant="secondary" size="lg">
              Start a similar project
            </ButtonLink>
          </>
        }
      />

      <div className="mx-auto grid w-full max-w-6xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[1fr_320px]">
        <div className="min-w-0 space-y-10">
          <ModelViewer url={sampleFile(sample.slug, "model.ifc")} />

          <section className="grid gap-4 sm:grid-cols-[1fr_auto_1fr] sm:items-center">
            <Panel title="Input" description={sample.input}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={sampleFile(sample.slug, "plan.svg")} alt={`${sample.title} ground floor plan`} className="w-full rounded-lg border border-border bg-white" />
            </Panel>
            <ArrowRight className="mx-auto size-6 rotate-90 text-subtle sm:rotate-0" aria-hidden="true" />
            <Panel title="Output" description="IFC4 · LOD 100–200, validated">
              <ul className="space-y-2 text-sm">
                {["Storeys and levels", "Typed walls and slabs", "Doors and windows in openings", "Rooms with floor areas", "Flat roof"].map((item) => (
                  <li key={item} className="flex items-center gap-2">
                    <span className="size-1.5 rounded-full bg-accent" aria-hidden="true" />
                    {item}
                  </li>
                ))}
              </ul>
            </Panel>
          </section>

          <Suspense fallback={<p className="text-muted">Loading model details…</p>}>
            <Details slug={sample.slug} />
          </Suspense>
        </div>

        <aside className="space-y-5 lg:sticky lg:top-24 lg:self-start">
          <Panel title="Files">
            <ul className="-mx-2 space-y-1">
              {files.map(({ name, label, icon: Icon, size }) => (
                <li key={name}>
                  <a href={sampleFile(sample.slug, name)} download className="flex items-center gap-3 rounded-lg px-2 py-2 text-sm hover:bg-surface-2">
                    <Icon className="size-4 shrink-0 text-muted" aria-hidden="true" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-medium">{name}</span>
                      <span className="block text-xs text-muted">{label}</span>
                    </span>
                    {size && <span className="font-mono text-xs text-muted">{size}</span>}
                  </a>
                </li>
              ))}
            </ul>
          </Panel>
          <Panel title="About reference projects">
            <p className="text-sm text-muted">
              Generated with the same pipeline as customer projects (model spec → IfcOpenShell → validation). They aren&apos;t real
              buildings — use them to judge the output before starting your own project.
            </p>
          </Panel>
        </aside>
      </div>
    </main>
  );
}

async function Details({ slug }: { slug: string }) {
  const { summary, assumptions } = await getSampleDetails(slug);
  return (
    <>
      <section className="space-y-4">
        <h2 className="text-xl font-semibold tracking-tight">What&apos;s in the model</h2>
        <StatTiles summary={summary} />
        <SummaryTable summary={summary} />
      </section>
      <section className="space-y-3">
        <h2 className="text-xl font-semibold tracking-tight">Assumptions</h2>
        <Assumptions markdown={assumptions} />
      </section>
    </>
  );
}
