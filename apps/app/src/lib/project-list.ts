import "server-only";
import { list } from "@vercel/blob";
import type { PublicProject } from "@ifcwise/shared";
import { cacheLife, cacheTag } from "next/cache";
import { env, hasBlobToken } from "@/lib/env";
import { readProject, toPublic, type StoredProject } from "@/lib/projects";

export const PROJECTS_TAG = "projects";

// Every project.json in the store. Fine for hundreds of projects (PLAN.md §2); move to a DB beyond that.
export async function listAllProjects(): Promise<StoredProject[]> {
  const ids: string[] = [];
  let cursor: string | undefined;
  do {
    const page = await list({ prefix: "projects/", cursor, token: env.blobToken() });
    for (const blob of page.blobs) {
      const match = /^projects\/([^/]+)\/project\.json$/.exec(blob.pathname);
      if (match) ids.push(match[1]);
    }
    cursor = page.hasMore ? page.cursor : undefined;
  } while (cursor);

  const projects: StoredProject[] = [];
  for (let i = 0; i < ids.length; i += 8) {
    const batch = await Promise.all(ids.slice(i, i + 8).map((id) => readProject(id)));
    for (const loaded of batch) if (loaded) projects.push(loaded.project);
  }
  return projects.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function isListed(project: PublicProject): boolean {
  return project.published && project.status !== "draft" && project.status !== "rejected";
}

export async function listPublishedProjects(): Promise<PublicProject[]> {
  "use cache";
  cacheTag(PROJECTS_TAG);
  if (!hasBlobToken()) {
    // Local builds without storage: render an empty gallery instead of failing the build.
    cacheLife("seconds");
    return [];
  }
  cacheLife("minutes");
  const all = await listAllProjects();
  return all.map(toPublic).filter(isListed);
}

export function thumbnailUrl(project: PublicProject): string | undefined {
  const preview = project.outputs.find((f) => f.contentType.startsWith("image/"));
  const image = preview ?? project.inputs.find((f) => /^image\/(png|jpe?g|webp)$/.test(f.contentType));
  return image?.url;
}
