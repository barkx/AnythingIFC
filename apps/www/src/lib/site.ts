// Site-wide settings. URLs come from env so local dev points at localhost.

export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://ifcwise.com";
export const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3001";
export const CONTACT_EMAIL = process.env.NEXT_PUBLIC_CONTACT_EMAIL ?? "hello@ifcwise.com";

export const NAV_LINKS = [
  { href: "/#how-it-works", label: "How it works" },
  { href: "/#reference-projects", label: "Reference projects" },
  { href: "/#faq", label: "FAQ" },
];

// Placeholders until the legal entity is decided (PLAN.md §15).
export const LEGAL = {
  company: "[Company name]",
  address: "[Street, postcode, city], Slovenia",
  vatId: "[VAT ID]",
  lastUpdated: "27 October 2026",
} as const;
