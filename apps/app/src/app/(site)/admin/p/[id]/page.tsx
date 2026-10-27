import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ProjectView } from "@/components/project-view";
import { requireAdmin } from "@/lib/admin-auth";
import { ID_PATTERN } from "@/lib/blob-paths";
import { decryptEmail } from "@/lib/crypto";
import { readProject, toPublic } from "@/lib/projects";
import { AdminPanel } from "./admin-panel";

export const metadata: Metadata = { title: "Admin · project", robots: { index: false, follow: false } };

export default function AdminProjectPage({ params }: PageProps<"/admin/p/[id]">) {
  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6">
      <Link href="/admin" className="text-sm text-muted hover:text-foreground">
        ← All projects
      </Link>
      <Suspense fallback={<p className="mt-8 text-muted">Loading…</p>}>
        <Content params={params} />
      </Suspense>
    </main>
  );
}

async function Content({ params }: { params: PageProps<"/admin/p/[id]">["params"] }) {
  await requireAdmin();
  const { id } = await params;
  if (!ID_PATTERN.test(id)) notFound();
  const loaded = await readProject(id);
  if (!loaded) notFound();
  const project = toPublic(loaded.project);

  let email: string;
  try {
    email = decryptEmail(loaded.project.contactEmailEnc);
  } catch {
    email = "(could not decrypt — EMAIL_ENCRYPTION_KEY changed?)";
  }

  return (
    <div className="mt-6 grid gap-10 lg:grid-cols-[1fr_380px]">
      <ProjectView project={project} />
      <AdminPanel project={project} email={email} />
    </div>
  );
}
