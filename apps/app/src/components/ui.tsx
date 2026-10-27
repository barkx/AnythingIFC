import { PROJECT_STATUS_LABELS, type ProjectStatus } from "@ifcwise/shared";
import type { ComponentProps, ReactNode } from "react";

export const inputClass =
  "mt-1.5 w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/30";

export function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <label className="block text-sm font-medium">
      {label} {hint && <span className="font-normal text-muted">{hint}</span>}
      {children}
    </label>
  );
}

export function Button({ variant = "primary", className = "", ...props }: ComponentProps<"button"> & { variant?: "primary" | "secondary" | "danger" }) {
  const styles = {
    primary: "bg-accent text-accent-foreground hover:opacity-90",
    secondary: "border border-border bg-surface hover:border-subtle",
    danger: "border border-red-300 text-red-700 hover:bg-red-50 dark:border-red-900 dark:text-red-400 dark:hover:bg-red-950",
  }[variant];
  return (
    <button
      {...props}
      className={`rounded-md px-5 py-2.5 text-sm font-medium disabled:opacity-60 ${styles} ${className}`}
    />
  );
}

const STATUS_STYLES: Record<ProjectStatus, string> = {
  draft: "bg-border text-muted",
  submitted: "bg-border text-foreground",
  in_progress: "bg-accent-soft text-foreground",
  needs_info: "bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200",
  completed: "bg-accent text-accent-foreground",
  rejected: "bg-red-100 text-red-900 dark:bg-red-950 dark:text-red-200",
};

export function StatusBadge({ status }: { status: ProjectStatus }) {
  return (
    <span className={`inline-flex rounded-full px-2.5 py-0.5 font-mono text-xs ${STATUS_STYLES[status]}`}>
      {PROJECT_STATUS_LABELS[status]}
    </span>
  );
}

export function ErrorText({ children }: { children: ReactNode }) {
  return (
    <p role="alert" className="text-sm text-red-600 dark:text-red-400">
      {children}
    </p>
  );
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}
