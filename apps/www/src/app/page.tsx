import { BUILDING_TYPE_LABELS, SAMPLE_PROJECTS } from "@ifcwise/shared";
import { ButtonLink, Container, Pill, SectionHeader } from "@ifcwise/ui";
import {
  ArrowRight,
  Box,
  Building2,
  CheckCircle2,
  Eye,
  FileImage,
  FileText,
  FileType2,
  Globe,
  HardHat,
  Home as HomeIcon,
  Layers,
  ListChecks,
  PenTool,
  Ruler,
  ShieldCheck,
  Type,
  UploadCloud,
  UserCheck,
  Wand2,
} from "lucide-react";
import type { ReactNode } from "react";
import { FAQ } from "@/content/home";
import { APP_URL } from "@/lib/site";

const HERO_SAMPLE = "family-house";

const STEPS = [
  { icon: UploadCloud, title: "Upload", body: "Drop DWG/DXF drawings, PDF plans, sketches or photos — or just describe the building." },
  { icon: Wand2, title: "We model", body: "We build an IFC4 model at LOD 100–200, check it against your inputs and list every assumption." },
  { icon: Box, title: "Download", body: "Explore it in 3D on your project page and download an IFC that opens in any BIM tool." },
];

const INPUTS = [
  { icon: FileType2, label: "DWG / DXF" },
  { icon: FileText, label: "PDF plans" },
  { icon: FileImage, label: "Sketches & photos" },
  { icon: Type, label: "Text description" },
];

const USE_CASES = [
  { icon: PenTool, title: "Architects & designers", body: "Turn legacy 2D drawings into a BIM starting point instead of redrawing them." },
  { icon: HardHat, title: "Contractors & estimators", body: "Get quantities and a coordination model when the client only has PDFs." },
  { icon: HomeIcon, title: "Homeowners", body: "See your sketch or old house plan as a 3D model you can share with builders." },
  { icon: Building2, title: "Facility managers", body: "Build an IFC of existing buildings from archive drawings for operations." },
];

export default function Home() {
  return (
    <main>
      {/* ---------- Hero ---------- */}
      <section className="relative overflow-hidden">
        <div className="bg-blueprint absolute inset-0" aria-hidden="true" />
        <div className="glow absolute inset-0" aria-hidden="true" />
        <Container className="relative pt-16 pb-12 text-center sm:pt-24">
          <Pill className="mx-auto">
            <span className="size-1.5 rounded-full bg-accent" aria-hidden="true" />
            Early access · free while in beta
          </Pill>
          <h1 className="mx-auto mt-6 max-w-4xl text-5xl font-semibold tracking-tight text-balance sm:text-7xl">
            From drawings to <span className="text-gradient">IFC models</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-pretty text-muted sm:text-xl">
            Upload CAD drawings, PDF plans, sketches or a description. Get back a validated IFC4 model you can open in any
            BIM tool — usually within 48 hours.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <ButtonLink href={`${APP_URL}/new`} variant="accent" size="lg">
              Start a project
              <ArrowRight className="size-4" aria-hidden="true" />
            </ButtonLink>
            <ButtonLink href="#reference-projects" variant="secondary" size="lg">
              See reference projects
            </ButtonLink>
          </div>
          <p className="mt-6 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-sm text-muted">
            {["Revit", "ArchiCAD", "Tekla", "Solibri", "BIMcollab Zoom"].map((tool) => (
              <span key={tool} className="flex items-center gap-1.5">
                <CheckCircle2 className="size-3.5 text-accent" aria-hidden="true" />
                {tool}
              </span>
            ))}
          </p>
        </Container>

        <Container className="relative pb-20">
          <ProductFrame />
        </Container>
      </section>

      {/* ---------- Stats ---------- */}
      <section className="border-y border-border bg-surface">
        <Container className="grid grid-cols-2 divide-border py-8 text-center sm:grid-cols-4 sm:divide-x">
          {[
            ["IFC4", "Open standard output"],
            ["LOD 100–200", "Storeys, walls, openings, rooms"],
            ["24–48 h", "Typical turnaround"],
            ["Free", "During early access"],
          ].map(([value, label]) => (
            <div key={value} className="px-4 py-3">
              <p className="text-2xl font-semibold tracking-tight sm:text-3xl">{value}</p>
              <p className="mt-1 text-sm text-muted">{label}</p>
            </div>
          ))}
        </Container>
      </section>

      {/* ---------- How it works ---------- */}
      <section id="how-it-works" className="scroll-mt-16">
        <Container className="py-24">
          <SectionHeader
            center
            eyebrow="How it works"
            title="Three steps to a BIM model"
            description="No software to install and no BIM skills needed. You send what you have; we send back IFC."
          />
          <ol className="relative mt-14 grid gap-10 md:grid-cols-3 md:gap-6">
            <div
              className="absolute top-7 right-[16%] left-[16%] hidden h-px bg-[linear-gradient(90deg,transparent,var(--border),var(--accent),var(--border),transparent)] md:block"
              aria-hidden="true"
            />
            {STEPS.map(({ icon: Icon, title, body }, i) => (
              <li key={title} className="relative flex flex-col items-center text-center">
                <span className="relative flex size-14 items-center justify-center rounded-2xl border border-border bg-background shadow-soft">
                  <Icon className="size-6 text-accent" aria-hidden="true" />
                  <span className="absolute -top-2 -right-2 flex size-6 items-center justify-center rounded-full bg-foreground text-xs font-semibold text-background">
                    {i + 1}
                  </span>
                </span>
                <h3 className="mt-5 text-lg font-semibold">{title}</h3>
                <p className="mt-2 max-w-xs text-muted">{body}</p>
              </li>
            ))}
          </ol>
        </Container>
      </section>

      {/* ---------- Features bento ---------- */}
      <section className="border-t border-border bg-surface">
        <Container className="py-24">
          <SectionHeader eyebrow="What you get" title="Whatever you have in, a clean IFC model out" />
          <div className="mt-12 grid gap-4 md:grid-cols-6">
            <Bento
              className="md:col-span-4"
              icon={UploadCloud}
              title="Any input, mixed in one project"
              body="Combine drawings with a few written dimensions — a sketch plus a note beats either one alone."
            >
              <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
                {INPUTS.map(({ icon: Icon, label }) => (
                  <div key={label} className="flex flex-col items-center gap-2 rounded-xl border border-border bg-surface px-3 py-4 text-center text-sm font-medium">
                    <Icon className="size-5 text-accent" aria-hidden="true" />
                    {label}
                  </div>
                ))}
              </div>
            </Bento>
            <Bento className="md:col-span-2" icon={ListChecks} title="Validated IFC4" body="Every model passes automatic checks before delivery.">
              <ul className="mt-5 space-y-2 text-sm">
                {["One project, site & building", "Every element on a storey", "Metric units", "Typed walls, doors, windows"].map((item) => (
                  <li key={item} className="flex gap-2">
                    <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-accent" aria-hidden="true" />
                    {item}
                  </li>
                ))}
              </ul>
            </Bento>
            <Bento
              className="md:col-span-2"
              icon={Eye}
              title="3D viewer in the browser"
              body="Orbit the model, isolate storeys and check the element summary — before you download anything."
            />
            <Bento
              className="md:col-span-2"
              icon={UserCheck}
              title="Checked by people"
              body="Every model is reviewed, and every guess — heights, thicknesses, roof — is written down for you."
            />
            <Bento
              className="md:col-span-2"
              icon={ShieldCheck}
              title="Public, but private where it counts"
              body="Projects build a public gallery; your email is encrypted and only used to tell you the model is ready."
            />
          </div>
        </Container>
      </section>

      {/* ---------- Reference projects ---------- */}
      <section id="reference-projects" className="scroll-mt-16">
        <Container className="py-24">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <SectionHeader
              eyebrow="Reference projects"
              title="See the output before you upload"
              description="Four buildings made with the same pipeline as customer projects. Open one to explore it in 3D or download the IFC."
            />
            <ButtonLink href={`${APP_URL}/#reference-projects`} variant="secondary">
              Open the gallery
              <ArrowRight className="size-4" aria-hidden="true" />
            </ButtonLink>
          </div>
          <ul className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {SAMPLE_PROJECTS.map((s) => (
              <li key={s.slug} className="flex">
                <a
                  href={`${APP_URL}/samples/${s.slug}`}
                  className="group flex w-full flex-col overflow-hidden rounded-2xl border border-border bg-background shadow-soft transition hover:-translate-y-0.5 hover:shadow-float"
                >
                  <div className="aspect-[4/3] overflow-hidden border-b border-border bg-white">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={`${APP_URL}/samples/${s.slug}/plan.svg`}
                      alt={`${s.title} plan`}
                      loading="lazy"
                      className="size-full object-contain p-2 transition duration-500 group-hover:scale-[1.03]"
                    />
                  </div>
                  <div className="flex flex-1 flex-col p-4">
                    <p className="text-xs font-medium text-accent">{BUILDING_TYPE_LABELS[s.buildingType]}</p>
                    <h3 className="mt-1 font-semibold tracking-tight">{s.title}</h3>
                    <p className="mt-1 text-sm text-muted">From: {s.input}</p>
                    <div className="mt-auto flex items-center gap-4 pt-4 text-xs text-muted">
                      <span className="flex items-center gap-1.5">
                        <Layers className="size-3.5" aria-hidden="true" />
                        {s.storeys} storey{s.storeys > 1 ? "s" : ""}
                      </span>
                      {s.floorAreaM2 && (
                        <span className="flex items-center gap-1.5">
                          <Ruler className="size-3.5" aria-hidden="true" />
                          {Math.round(s.floorAreaM2)} m²
                        </span>
                      )}
                      <ArrowRight className="ml-auto size-4 transition group-hover:translate-x-0.5 group-hover:text-accent" aria-hidden="true" />
                    </div>
                  </div>
                </a>
              </li>
            ))}
          </ul>
        </Container>
      </section>

      {/* ---------- Use cases ---------- */}
      <section className="border-t border-border bg-surface">
        <Container className="py-24">
          <SectionHeader center eyebrow="Use cases" title="Built for everyone who works with buildings" />
          <ul className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {USE_CASES.map(({ icon: Icon, title, body }) => (
              <li key={title} className="rounded-2xl border border-border bg-background p-6 shadow-soft">
                <span className="flex size-10 items-center justify-center rounded-xl bg-accent-soft text-accent">
                  <Icon className="size-5" aria-hidden="true" />
                </span>
                <h3 className="mt-4 font-semibold">{title}</h3>
                <p className="mt-2 text-sm text-muted">{body}</p>
              </li>
            ))}
          </ul>
        </Container>
      </section>

      {/* ---------- FAQ ---------- */}
      <section id="faq" className="scroll-mt-16">
        <Container className="grid gap-12 py-24 lg:grid-cols-[1fr_2fr]">
          <SectionHeader eyebrow="FAQ" title="Questions & answers" description="Anything else? Write to us — we read every message." />
          <div className="divide-y divide-border border-y border-border">
            {FAQ.map((item) => (
              <details key={item.q} className="group py-5">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-6 font-medium">
                  {item.q}
                  <span
                    aria-hidden="true"
                    className="flex size-6 shrink-0 items-center justify-center rounded-full border border-border text-muted transition group-open:rotate-45"
                  >
                    +
                  </span>
                </summary>
                <p className="mt-3 pr-10 text-muted">{item.a}</p>
              </details>
            ))}
          </div>
        </Container>
      </section>

      {/* ---------- CTA ---------- */}
      <section className="pb-24">
        <Container>
          <div className="relative overflow-hidden rounded-3xl bg-zinc-950 px-6 py-16 text-center text-white sm:px-16">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_80%_at_50%_120%,rgba(45,212,191,0.35),transparent)]" aria-hidden="true" />
            <div className="relative">
              <Globe className="mx-auto size-8 text-teal-300" aria-hidden="true" />
              <h2 className="mt-4 text-3xl font-semibold tracking-tight text-balance sm:text-4xl">Your first model is on us</h2>
              <p className="mx-auto mt-4 max-w-xl text-zinc-300">Early access is free. Upload a drawing today and get an IFC model back this week.</p>
              <div className="mt-8 flex flex-wrap justify-center gap-3">
                <a href={`${APP_URL}/new`} className="inline-flex h-12 items-center gap-2 rounded-lg bg-white px-6 text-[15px] font-medium text-zinc-950 hover:bg-zinc-200">
                  Start a project
                  <ArrowRight className="size-4" aria-hidden="true" />
                </a>
                <a href={APP_URL} className="inline-flex h-12 items-center rounded-lg border border-white/20 px-6 text-[15px] font-medium hover:bg-white/10">
                  Browse projects
                </a>
              </div>
            </div>
          </div>
        </Container>
      </section>
    </main>
  );
}

function Bento({
  className,
  icon: Icon,
  title,
  body,
  children,
}: {
  className?: string;
  icon: typeof Box;
  title: string;
  body: string;
  children?: ReactNode;
}) {
  return (
    <div className={`rounded-2xl border border-border bg-background p-6 shadow-soft ${className ?? ""}`}>
      <Icon className="size-5 text-accent" aria-hidden="true" />
      <h3 className="mt-4 text-lg font-semibold">{title}</h3>
      <p className="mt-1.5 text-sm text-muted">{body}</p>
      {children}
    </div>
  );
}

// Browser-style frame: the input plan next to the live 3D model (embedded from the app).
function ProductFrame() {
  const sample = SAMPLE_PROJECTS.find((s) => s.slug === HERO_SAMPLE) ?? SAMPLE_PROJECTS[0];
  return (
    <div className="mx-auto max-w-5xl overflow-hidden rounded-2xl border border-border bg-background shadow-float">
      <div className="flex items-center gap-2 border-b border-border bg-surface px-4 py-3">
        <span className="size-3 rounded-full bg-red-400/80" aria-hidden="true" />
        <span className="size-3 rounded-full bg-amber-400/80" aria-hidden="true" />
        <span className="size-3 rounded-full bg-emerald-400/80" aria-hidden="true" />
        <span className="mx-auto truncate rounded-md bg-background px-3 py-1 font-mono text-xs text-muted ring-1 ring-border">
          app.ifcwise.com/samples/{sample.slug}
        </span>
      </div>
      <div className="grid md:grid-cols-[2fr_3fr]">
        <figure className="hidden border-r border-border bg-white p-4 md:block">
          <figcaption className="mb-2 flex items-center gap-2 text-xs font-medium text-zinc-500">
            <FileImage className="size-3.5" aria-hidden="true" />
            Input · {sample.input}
          </figcaption>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={`${APP_URL}/samples/${sample.slug}/plan.svg`} alt={`${sample.title} ground floor plan`} className="w-full" />
        </figure>
        <figure className="relative h-[340px] sm:h-[420px]">
          <figcaption className="pointer-events-none absolute right-3 bottom-3 z-10 flex items-center gap-1.5 rounded-full bg-background/85 px-3 py-1 text-xs font-medium ring-1 ring-border backdrop-blur">
            <span className="size-1.5 rounded-full bg-emerald-500" aria-hidden="true" />
            Output · IFC4 · live
          </figcaption>
          <iframe
            src={`${APP_URL}/embed/samples/${sample.slug}`}
            title={`${sample.title} — interactive 3D IFC model`}
            loading="lazy"
            className="size-full"
          />
        </figure>
      </div>
    </div>
  );
}
