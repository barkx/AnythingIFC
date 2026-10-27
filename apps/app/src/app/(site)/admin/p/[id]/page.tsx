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
    <main>
      <Link href="/admin" className="mx-auto block w-full max-w-6xl px-4 pt-6 text-sm text-muted hover:text-foreground sm:px-6">
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
    <ProjectView project={project} aside={<AdminPanel project={project} email={email} />} />
  );
}
