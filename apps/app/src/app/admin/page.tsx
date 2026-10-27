import { PROJECT_STATUSES, PROJECT_STATUS_LABELS } from "@ifcwise/shared";
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { StatusBadge } from "@/components/ui";
import { logout } from "@/lib/admin-actions";
import { requireAdmin } from "@/lib/admin-auth";
import { listAllProjects } from "@/lib/project-list";
import type { StoredProject } from "@/lib/projects";

export const metadata: Metadata = { title: "Admin", robots: { index: false, follow: false } };

export default function AdminPage() {
  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-3xl font-semibold tracking-tight">Admin</h1>
        <form action={logout}>
          <button className="text-sm text-muted hover:text-foreground">Log out</button>
        </form>
      </div>
      <Suspense fallback={<p className="mt-8 text-muted">Loading projects…</p>}>
        <Queue />
      </Suspense>
    </main>
  );
}

// Waiting for review first (oldest first), then everything else (newest first), drafts last.
function queueOrder(a: StoredProject, b: StoredProject): number {
  const rank = (p: StoredProject) => (p.status === "draft" ? 2 : !p.published && p.status !== "rejected" ? 0 : 1);
  return rank(a) - rank(b) || (rank(a) === 0 ? a.createdAt.localeCompare(b.createdAt) : b.createdAt.localeCompare(a.createdAt));
}

function age(iso: string): string {
  const hours = (Date.now() - new Date(iso).getTime()) / 36e5;
  return hours < 24 ? `${Math.max(1, Math.round(hours))} h` : `${Math.round(hours / 24)} d`;
}

async function Queue() {
  await requireAdmin();
  const projects = (await listAllProjects()).sort(queueOrder);
  const counts = Object.fromEntries(PROJECT_STATUSES.map((s) => [s, projects.filter((p) => p.status === s).length]));
  const waiting = projects.filter((p) => !p.published && p.status !== "draft" && p.status !== "rejected").length;

  return (
    <>
      <dl className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
        <Stat label="Awaiting review" value={waiting} highlight={waiting > 0} />
        {PROJECT_STATUSES.map((s) => (
          <Stat key={s} label={PROJECT_STATUS_LABELS[s]} value={counts[s]} />
        ))}
      </dl>

      {projects.length === 0 ? (
        <p className="mt-10 text-muted">No projects yet.</p>
      ) : (
        <div className="mt-8 overflow-x-auto rounded-xl border border-border bg-surface">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="border-b border-border text-xs text-muted uppercase">
              <tr>
                <th className="px-4 py-3 font-medium">Project</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Public</th>
                <th className="px-4 py-3 font-medium">Files</th>
                <th className="px-4 py-3 font-medium">Age</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {projects.map((p) => (
                <tr key={p.id} className="hover:bg-background">
                  <td className="px-4 py-3">
                    <Link href={`/admin/p/${p.id}`} className="font-medium hover:text-accent">
                      {p.title}
                    </Link>
                    <p className="text-xs text-muted">
                      {p.authorName} · <span className="font-mono">{p.id}</span>
                    </p>
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={p.status} />
                  </td>
                  <td className="px-4 py-3">{p.published ? "Yes" : <span className="text-muted">No</span>}</td>
                  <td className="px-4 py-3 font-mono text-xs">
                    {p.inputs.length} in · {p.outputs.length} out
                  </td>
                  <td className="px-4 py-3 font-mono text-xs">{age(p.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}

function Stat({ label, value, highlight }: { label: string; value: number; highlight?: boolean }) {
  return (
    <div className={`rounded-lg border p-3 ${highlight ? "border-accent bg-accent-soft/40" : "border-border bg-surface"}`}>
      <dt className="text-xs text-muted">{label}</dt>
      <dd className="mt-1 text-2xl font-semibold">{value}</dd>
    </div>
  );
}
