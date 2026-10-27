import type { Metadata } from "next";
import { NewProjectForm } from "./new-project-form";

export const metadata: Metadata = { title: "Start a project" };

export default function NewProjectPage() {
  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-12 sm:px-6">
      <h1 className="text-3xl font-semibold tracking-tight">Start a project</h1>
      <p className="mt-3 text-muted">
        Upload DWG/DXF drawings, PDF plans, images or sketches — or just describe the building. We&apos;ll model it as
        IFC (LOD 100–200), usually within 24–48 hours. Projects are public once we&apos;ve reviewed them.
      </p>
      <div className="mt-8">
        <NewProjectForm />
      </div>
    </main>
  );
}
