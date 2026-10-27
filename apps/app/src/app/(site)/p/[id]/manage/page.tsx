import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ID_PATTERN } from "@/lib/blob-paths";
import { canManage, readProject, toPublic } from "@/lib/projects";
import { ManagePanel } from "./manage-panel";

export const metadata: Metadata = {
  title: "Manage project",
  robots: { index: false, follow: false },
  referrer: "no-referrer", // the manage token is in the URL
};

export default function ManagePage({ params, searchParams }: PageProps<"/p/[id]/manage">) {
  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
      <Suspense fallback={<p className="text-muted">Loading…</p>}>
        <ManageContent params={params} searchParams={searchParams} />
      </Suspense>
    </main>
  );
}

async function ManageContent({
  params,
  searchParams,
}: Pick<PageProps<"/p/[id]/manage">, "params" | "searchParams">) {
  const { id } = await params;
  const { t } = await searchParams;
  const token = typeof t === "string" ? t : undefined;
  if (!ID_PATTERN.test(id)) notFound();
  const loaded = await readProject(id);
  if (!loaded) notFound();
  if (!canManage(loaded.project, token)) {
    return (
      <div className="space-y-3">
        <h1 className="text-2xl font-semibold">This manage link isn&apos;t valid</h1>
        <p className="text-muted">Check that you copied the whole link. Lost it? Email us from the address you used.</p>
        <Link href={`/p/${id}`} className="text-accent hover:underline">
          View the project
        </Link>
      </div>
    );
  }
  return <ManagePanel project={toPublic(loaded.project)} manageToken={token!} />;
}
