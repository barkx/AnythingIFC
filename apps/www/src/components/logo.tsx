import Link from "next/link";

export function LogoMark({ className = "size-6" }: { className?: string }) {
  // Isometric cube: a 2D outline (plan) becoming a solid (model).
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden="true">
      <path d="M16 3 28 10v12l-12 7-12-7V10z" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      <path d="M16 17 28 10M16 17 4 10M16 17v12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      <path d="M16 17 28 10v12l-12 7z" className="fill-accent" />
    </svg>
  );
}

export function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight" aria-label="IFCWise home">
      <LogoMark />
      <span className="text-lg">
        IFC<span className="text-accent">Wise</span>
      </span>
    </Link>
  );
}
