import Link from "next/link";

// Phase 3 replaces this with the public gallery.
export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col justify-center gap-6 px-4 py-24 sm:px-6">
      <p className="font-mono text-xs tracking-widest text-accent uppercase">Public projects</p>
      <h1 className="text-3xl font-semibold tracking-tight">The project gallery is coming soon.</h1>
      <p className="text-muted">
        Start a project now — once it&apos;s reviewed it will appear here for everyone to see.
      </p>
      <div>
        <Link href="/new" className="inline-block rounded-md bg-accent px-5 py-3 text-sm font-medium text-accent-foreground">
          Start a project
        </Link>
      </div>
    </main>
  );
}
