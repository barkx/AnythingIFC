import { PROJECT_STATUS_LABELS } from "@ifcwise/shared";

export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col justify-center gap-6 px-4 py-24 sm:px-8">
      <p className="font-mono text-sm tracking-widest text-zinc-500 uppercase">IFCWise App</p>
      <h1 className="text-3xl font-semibold tracking-tight">Proof of concept</h1>
      <p className="text-zinc-600 dark:text-zinc-400">
        Public projects, uploads, admin and the IFC viewer arrive in phases 2–5 (see TASKS.md).
      </p>
      <p className="font-mono text-xs text-zinc-500">Project states: {Object.values(PROJECT_STATUS_LABELS).join(" · ")}</p>
    </main>
  );
}
