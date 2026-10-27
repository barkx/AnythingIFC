import { ButtonLink, SiteFooter, SiteHeader } from "@ifcwise/ui";
import { Plus } from "lucide-react";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
const CONTACT_EMAIL = process.env.NEXT_PUBLIC_CONTACT_EMAIL ?? "hello@ifcwise.com";

export default function SiteLayout({ children }: LayoutProps<"/">) {
  return (
    <>
      <SiteHeader
        logoSuffix="Projects"
        nav={[
          { href: "/", label: "Gallery" },
          { href: "/#reference-projects", label: "Reference projects" },
          { href: `${SITE_URL}/#how-it-works`, label: "How it works" },
        ]}
        actions={
          <ButtonLink href="/new" variant="accent" size="sm">
            <Plus className="size-4" aria-hidden="true" />
            Start a project
          </ButtonLink>
        }
      />
      <div className="flex flex-1 flex-col">{children}</div>
      <SiteFooter
        columns={[
          {
            title: "Projects",
            links: [
              { href: "/", label: "Gallery" },
              { href: "/#reference-projects", label: "Reference projects" },
              { href: "/new", label: "Start a project" },
            ],
          },
          {
            title: "IFCWise",
            links: [
              { href: `${SITE_URL}/#how-it-works`, label: "How it works" },
              { href: `${SITE_URL}/#faq`, label: "FAQ" },
              { href: `mailto:${CONTACT_EMAIL}`, label: "Contact" },
            ],
          },
          {
            title: "Legal",
            links: [
              { href: `${SITE_URL}/privacy`, label: "Privacy" },
              { href: `${SITE_URL}/terms`, label: "Terms" },
              { href: `${SITE_URL}/imprint`, label: "Imprint" },
            ],
          },
        ]}
        note="© 2026 IFCWise · Early access — every project is public."
      />
    </>
  );
}
