import Link from "next/link";
import { LogoMark } from "@/components/logo";
import { CONTACT_EMAIL, LEGAL } from "@/lib/site";

export function SiteFooter() {
  return (
    <footer className="border-t border-border">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-10 text-sm text-muted sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div className="flex items-center gap-2">
          <LogoMark className="size-5" />
          <span>© 2026 {LEGAL.company}</span>
        </div>
        <nav aria-label="Legal" className="flex flex-wrap gap-x-6 gap-y-2">
          <Link href="/privacy" className="hover:text-foreground">Privacy</Link>
          <Link href="/terms" className="hover:text-foreground">Terms</Link>
          <Link href="/imprint" className="hover:text-foreground">Imprint</Link>
          <a href={`mailto:${CONTACT_EMAIL}`} className="hover:text-foreground">{CONTACT_EMAIL}</a>
        </nav>
      </div>
    </footer>
  );
}
