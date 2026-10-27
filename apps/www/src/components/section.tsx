import type { ReactNode } from "react";

export function Section({
  id,
  eyebrow,
  title,
  intro,
  children,
}: {
  id: string;
  eyebrow: string;
  title: string;
  intro?: string;
  children: ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-16 border-t border-border">
      <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <p className="font-mono text-xs font-medium tracking-widest text-accent uppercase">{eyebrow}</p>
        <h2 className="mt-3 max-w-2xl text-3xl font-semibold tracking-tight">{title}</h2>
        {intro && <p className="mt-4 max-w-2xl text-muted">{intro}</p>}
        <div className="mt-12">{children}</div>
      </div>
    </section>
  );
}
