import { Pill } from "@ifcwise/ui";
import { CheckCircle2, Clock, Eye, Lightbulb } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader, Panel } from "@/components/ui";
import { NewProjectForm } from "./new-project-form";

export const metadata: Metadata = { title: "Start a project" };

const NEXT_STEPS = [
  { icon: Eye, title: "We review it", body: "Usually the same day. We ask on your project page if something is unclear." },
  { icon: Clock, title: "We model it", body: "IFC4 at LOD 100–200, within 24–48 hours, with a list of assumptions." },
  { icon: CheckCircle2, title: "You download it", body: "View it in 3D on the project page and download the IFC." },
];

export default function NewProjectPage() {
  return (
    <main>
      <PageHeader
        eyebrow={<Pill>Free during early access</Pill>}
        title="Start a project"
        description="Upload drawings, sketches or just describe the building. We'll send back an IFC model you can open in any BIM tool."
      />
      <div className="mx-auto grid w-full max-w-6xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[1fr_320px]">
        <NewProjectForm />
        <aside className="space-y-5 lg:sticky lg:top-24 lg:self-start">
          <Panel title="What happens next">
            <ol className="space-y-4">
              {NEXT_STEPS.map(({ icon: Icon, title, body }) => (
                <li key={title} className="flex gap-3">
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-accent-soft text-accent">
                    <Icon className="size-4" aria-hidden="true" />
                  </span>
                  <div className="text-sm">
                    <p className="font-medium">{title}</p>
                    <p className="text-muted">{body}</p>
                  </div>
                </li>
              ))}
            </ol>
          </Panel>
          <Panel>
            <div className="flex gap-3 text-sm">
              <Lightbulb className="mt-0.5 size-4 shrink-0 text-accent" aria-hidden="true" />
              <p className="text-muted">
                <span className="font-medium text-foreground">Tip:</span> a plan with one written dimension beats three photos.
                Not sure what to send?{" "}
                <Link href="/#reference-projects" className="font-medium text-accent hover:underline">
                  See reference projects
                </Link>
                .
              </p>
            </div>
          </Panel>
        </aside>
      </div>
    </main>
  );
}
