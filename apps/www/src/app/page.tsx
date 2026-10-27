import { USER_TYPE_LABELS } from "@ifcwise/shared";

const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3001";

export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col justify-center gap-8 px-4 py-24 sm:px-8">
      <p className="font-mono text-sm tracking-widest text-zinc-500 uppercase">IFCWise</p>
      <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">From drawings to IFC.</h1>
      <p className="max-w-xl text-lg text-zinc-600 dark:text-zinc-400">
        Upload CAD drawings, PDF plans, sketches or a text description. We model the building and
        send you back an IFC file you can open in any BIM tool.
      </p>
      <p className="text-sm text-zinc-500">
        For {Object.values(USER_TYPE_LABELS).slice(0, 4).join(", ").toLowerCase()}.
      </p>
      <div>
        <a
          href={appUrl}
          className="inline-block rounded-md bg-zinc-900 px-5 py-3 text-sm font-medium text-white hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
        >
          Request access
        </a>
      </div>
    </main>
  );
}
