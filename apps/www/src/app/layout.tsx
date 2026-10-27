import { ButtonLink, SiteFooter, SiteHeader } from "@ifcwise/ui";
import { ArrowRight } from "lucide-react";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { APP_URL, CONTACT_EMAIL, LEGAL, NAV_LINKS, SITE_URL } from "@/lib/site";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin", "latin-ext"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const description =
  "Upload CAD drawings, PDF plans, sketches or a text description and get an IFC building model back — checked by people, ready for any BIM tool.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "IFCWise — From drawings to IFC",
    template: "%s · IFCWise",
  },
  description,
  openGraph: {
    type: "website",
    siteName: "IFCWise",
    title: "IFCWise — From drawings to IFC",
    description,
    url: "/",
  },
  twitter: { card: "summary_large_image" },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        <SiteHeader
          nav={[...NAV_LINKS, { href: APP_URL, label: "Gallery" }]}
          actions={
            <>
              {/* Wrapper, not a class on the button: the button's own inline-flex would override `hidden`. */}
              <span className="hidden sm:block">
                <ButtonLink href={APP_URL} variant="ghost" size="sm">
                  Browse projects
                </ButtonLink>
              </span>
              <ButtonLink href={`${APP_URL}/new`} variant="accent" size="sm">
                Start a project
                <ArrowRight className="size-3.5" aria-hidden="true" />
              </ButtonLink>
            </>
          }
        />
        <div className="flex flex-1 flex-col">{children}</div>
        <SiteFooter
          columns={[
            {
              title: "Product",
              links: [
                { href: "/#how-it-works", label: "How it works" },
                { href: "/#reference-projects", label: "Reference projects" },
                { href: APP_URL, label: "Project gallery" },
                { href: `${APP_URL}/new`, label: "Start a project" },
              ],
            },
            {
              title: "Company",
              links: [
                { href: "/#faq", label: "FAQ" },
                { href: `mailto:${CONTACT_EMAIL}`, label: "Contact" },
              ],
            },
            {
              title: "Legal",
              links: [
                { href: "/privacy", label: "Privacy" },
                { href: "/terms", label: "Terms" },
                { href: "/imprint", label: "Imprint" },
              ],
            },
          ]}
          note={`© 2026 ${LEGAL.company} · IFC is an open standard by buildingSMART International.`}
        />
      </body>
    </html>
  );
}
