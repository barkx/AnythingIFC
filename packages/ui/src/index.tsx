// Shared UI for apps/www and apps/app. Styling relies on the tokens in theme.css.
import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

export function cx(...classes: (string | false | null | undefined)[]): string {
  return classes.filter(Boolean).join(" ");
}

/* ---------- Brand ---------- */

export function LogoMark({ className = "size-7" }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden="true">
      <defs>
        <linearGradient id="ifcwise-mark" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="var(--accent)" />
          <stop offset="1" stopColor="var(--accent-2)" />
        </linearGradient>
      </defs>
      <rect width="32" height="32" rx="8" fill="var(--foreground)" />
      <path d="M16 6 25 11.2v9.6L16 26l-9-5.2v-9.6z" fill="none" stroke="var(--background)" strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M16 16.4 25 11.2M16 16.4 7 11.2M16 16.4V26" fill="none" stroke="var(--background)" strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M16 16.4 25 11.2v9.6L16 26z" fill="url(#ifcwise-mark)" />
    </svg>
  );
}

export function Logo({ href = "/", suffix }: { href?: string; suffix?: string }) {
  return (
    <Link href={href} className="flex items-center gap-2.5 font-semibold tracking-tight" aria-label="IFCWise home">
      <LogoMark />
      <span className="text-[17px]">IFCWise</span>
      {suffix && (
        <span className="rounded-md border border-border px-1.5 py-0.5 font-mono text-[10px] font-medium tracking-wider text-muted uppercase">
          {suffix}
        </span>
      )}
    </Link>
  );
}

/* ---------- Buttons ---------- */

type Variant = "primary" | "accent" | "secondary" | "ghost";
type Size = "sm" | "md" | "lg";

const VARIANTS: Record<Variant, string> = {
  primary: "bg-foreground text-background hover:opacity-90",
  accent:
    "text-accent-foreground bg-[linear-gradient(135deg,var(--accent),var(--accent-2))] hover:brightness-110 shadow-soft",
  secondary: "border border-border bg-background hover:bg-surface-2",
  ghost: "text-muted hover:bg-surface-2 hover:text-foreground",
};

const SIZES: Record<Size, string> = {
  sm: "h-8 gap-1.5 px-3 text-[13px]",
  md: "h-10 gap-2 px-4 text-sm",
  lg: "h-12 gap-2 px-6 text-[15px]",
};

export function buttonClass(variant: Variant = "primary", size: Size = "md", className?: string) {
  return cx(
    "inline-flex shrink-0 items-center justify-center rounded-lg font-medium whitespace-nowrap transition",
    "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:pointer-events-none disabled:opacity-50",
    VARIANTS[variant],
    SIZES[size],
    className,
  );
}

export function Button({
  variant,
  size,
  className,
  ...props
}: ComponentProps<"button"> & { variant?: Variant; size?: Size }) {
  return <button {...props} className={buttonClass(variant, size, className)} />;
}

/** Internal links use next/link; absolute URLs (other app) a plain anchor. */
export function ButtonLink({
  href,
  variant,
  size,
  className,
  children,
}: {
  href: string;
  variant?: Variant;
  size?: Size;
  className?: string;
  children: ReactNode;
}) {
  const cls = buttonClass(variant, size, className);
  return href.startsWith("http") ? (
    <a href={href} className={cls}>
      {children}
    </a>
  ) : (
    <Link href={href} className={cls}>
      {children}
    </Link>
  );
}

/* ---------- Content ---------- */

export function Container({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cx("mx-auto w-full max-w-6xl px-4 sm:px-6", className)}>{children}</div>;
}

export function Pill({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span
      className={cx(
        "inline-flex items-center gap-2 rounded-full border border-border bg-background/70 px-3 py-1 text-xs font-medium text-muted backdrop-blur",
        className,
      )}
    >
      {children}
    </span>
  );
}

export function SectionHeader({
  eyebrow,
  title,
  description,
  center,
}: {
  eyebrow?: string;
  title: ReactNode;
  description?: ReactNode;
  center?: boolean;
}) {
  return (
    <div className={cx("max-w-2xl", center && "mx-auto text-center")}>
      {eyebrow && <p className="text-sm font-semibold text-accent">{eyebrow}</p>}
      <h2 className="mt-2 text-3xl font-semibold tracking-tight text-balance sm:text-4xl">{title}</h2>
      {description && <p className="mt-4 text-lg text-pretty text-muted">{description}</p>}
    </div>
  );
}

export function Card({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cx("rounded-2xl border border-border bg-background shadow-soft", className)}>{children}</div>;
}

/* ---------- Header & footer ---------- */

export type NavItem = { href: string; label: string };

export function SiteHeader({
  logoHref,
  logoSuffix,
  nav,
  actions,
}: {
  logoHref?: string;
  logoSuffix?: string;
  nav: NavItem[];
  actions: ReactNode;
}) {
  return (
    <header className="sticky top-0 z-30 border-b border-border/70 bg-background/75 backdrop-blur-xl">
      <Container className="flex h-16 items-center gap-6">
        <Logo href={logoHref} suffix={logoSuffix} />
        <nav aria-label="Main" className="hidden items-center gap-1 text-sm md:flex">
          {nav.map((item) =>
            item.href.startsWith("http") ? (
              <a key={item.href} href={item.href} className="rounded-md px-3 py-1.5 text-muted hover:text-foreground">
                {item.label}
              </a>
            ) : (
              <Link key={item.href} href={item.href} className="rounded-md px-3 py-1.5 text-muted hover:text-foreground">
                {item.label}
              </Link>
            ),
          )}
        </nav>
        <div className="ml-auto flex items-center gap-2">{actions}</div>
      </Container>
    </header>
  );
}

export function SiteFooter({
  columns,
  note,
}: {
  columns: { title: string; links: NavItem[] }[];
  note: ReactNode;
}) {
  return (
    <footer className="border-t border-border bg-surface">
      <Container className="grid gap-10 py-14 sm:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr_1fr]">
        <div className="max-w-xs">
          <Logo />
          <p className="mt-4 text-sm text-muted">
            Drawings, sketches and descriptions turned into IFC building models — checked by people, open to everyone.
          </p>
        </div>
        {columns.map((col) => (
          <div key={col.title}>
            <p className="text-sm font-semibold">{col.title}</p>
            <ul className="mt-3 space-y-2 text-sm">
              {col.links.map((link) => (
                <li key={link.href}>
                  {link.href.startsWith("http") || link.href.startsWith("mailto:") ? (
                    <a href={link.href} className="text-muted hover:text-foreground">
                      {link.label}
                    </a>
                  ) : (
                    <Link href={link.href} className="text-muted hover:text-foreground">
                      {link.label}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </Container>
      <div className="border-t border-border">
        <Container className="py-6 text-xs text-muted">{note}</Container>
      </div>
    </footer>
  );
}
