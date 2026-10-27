import Link from "next/link";
import { Logo } from "@/components/logo";
import { APP_URL, NAV_LINKS } from "@/lib/site";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-10 border-b border-border bg-background/85 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-6 px-4 sm:px-6">
        <Logo />
        <nav aria-label="Main" className="hidden items-center gap-6 text-sm text-muted md:flex">
          {NAV_LINKS.map((link) => (
            <Link key={link.href} href={link.href} className="hover:text-foreground">
              {link.label}
            </Link>
          ))}
        </nav>
        <a
          href={`${APP_URL}/new`}
          className="rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background hover:opacity-85"
        >
          Start a project
        </a>
      </div>
    </header>
  );
}
