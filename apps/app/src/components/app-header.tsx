import Link from "next/link";
import { Logo } from "@/components/logo";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export function AppHeader() {
  return (
    <header className="border-b border-border bg-background">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Logo />
        <nav aria-label="Main" className="flex items-center gap-5 text-sm">
          <Link href="/" className="text-muted hover:text-foreground">
            Projects
          </Link>
          <a href={SITE_URL} className="hidden text-muted hover:text-foreground sm:inline">
            About
          </a>
          <Link
            href="/new"
            className="rounded-md bg-foreground px-4 py-2 font-medium text-background hover:opacity-85"
          >
            Start a project
          </Link>
        </nav>
      </div>
    </header>
  );
}
