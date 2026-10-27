import { PROJECT_STATUS_LABELS, type ProjectStatus } from "@ifcwise/shared";
import { buttonClass, cx } from "@ifcwise/ui";
import type { ComponentProps, ReactNode } from "react";

export const inputClass =
  "mt-1.5 block w-full rounded-lg border border-border bg-background px-3 py-2 text-sm shadow-xs outline-none transition placeholder:text-subtle focus:border-accent focus:ring-4 focus:ring-accent/15";

export function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <label className="block text-sm font-medium">
      {label} {hint && <span className="font-normal text-muted">{hint}</span>}
      {children}
    </label>
  );
}

type Variant = "primary" | "secondary" | "danger" | "ghost";

export function Button({ variant = "primary", className = "", ...props }: ComponentProps<"button"> & { variant?: Variant }) {
  if (variant === "danger") {
    return (
      <button
        {...props}
        className={cx(
          buttonClass("secondary", "md"),
          "border-red-300 text-red-700 hover:bg-red-50 dark:border-red-900 dark:text-red-400 dark:hover:bg-red-950/50",
          className,
        )}
      />
    );
  }
  return <button {...props} className={buttonClass(variant === "primary" ? "accent" : variant, "md", className)} />;
}

const STATUS_STYLES: Record<ProjectStatus, string> = {
  draft: "bg-surface-2 text-muted ring-border",
  submitted: "bg-sky-50 text-sky-700 ring-sky-200 dark:bg-sky-950/50 dark:text-sky-300 dark:ring-sky-900",
  in_progress: "bg-violet-50 text-violet-700 ring-violet-200 dark:bg-violet-950/50 dark:text-violet-300 dark:ring-violet-900",
  needs_info: "bg-amber-50 text-amber-800 ring-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:ring-amber-900",
  completed: "bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:ring-emerald-900",
  rejected: "bg-red-50 text-red-700 ring-red-200 dark:bg-red-950/50 dark:text-red-300 dark:ring-red-900",
};

export function StatusBadge({ status, className }: { status: ProjectStatus; className?: string }) {
  return (
    <span className={cx("inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset", STATUS_STYLES[status], className)}>
      <span className="size-1.5 rounded-full bg-current" aria-hidden="true" />
      {PROJECT_STATUS_LABELS[status]}
    </span>
  );
}

export function ErrorText({ children }: { children: ReactNode }) {
  return (
    <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
      {children}
    </p>
  );
}

export function SuccessText({ children }: { children: ReactNode }) {
  return (
    <p role="status" className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300">
      {children}
    </p>
  );
}

export function Panel({ title, description, children, className }: { title?: string; description?: string; children: ReactNode; className?: string }) {
  return (
    <section className={cx("rounded-2xl border border-border bg-background p-5 shadow-soft sm:p-6", className)}>
      {title && <h2 className="font-semibold">{title}</h2>}
      {description && <p className="mt-1 text-sm text-muted">{description}</p>}
      <div className={title || description ? "mt-4" : ""}>{children}</div>
    </section>
  );
}

export function PageHeader({ eyebrow, title, description, actions }: { eyebrow?: ReactNode; title: ReactNode; description?: ReactNode; actions?: ReactNode }) {
  return (
    <div className="relative border-b border-border">
      <div className="bg-blueprint absolute inset-0" aria-hidden="true" />
      <div className="relative mx-auto flex w-full max-w-6xl flex-wrap items-end justify-between gap-6 px-4 pt-12 pb-10 sm:px-6">
        <div className="max-w-2xl">
          {eyebrow && <div className="mb-3">{eyebrow}</div>}
          <h1 className="text-3xl font-semibold tracking-tight text-balance break-words sm:text-4xl">{title}</h1>
          {description && <p className="mt-3 text-lg text-pretty text-muted">{description}</p>}
        </div>
        {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
      </div>
    </div>
  );
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}
