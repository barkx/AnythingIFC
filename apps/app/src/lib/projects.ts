import "server-only";
import { del, get, head, list, put, BlobPreconditionFailedError } from "@vercel/blob";
import type { ProjectEvent, ProjectFile, ProjectStatus, PublicProject } from "@ifcwise/shared";
import { env } from "@/lib/env";
import { projectJsonPath, projectPrefix, sanitizeFilename } from "@/lib/blob-paths";
import { tokenMatches } from "@/lib/crypto";

// The full record as stored in projects/<id>/project.json. The file is publicly reachable by URL,
// so private fields are only ever stored encrypted or hashed.
export type StoredProject = PublicProject & {
  contactEmailEnc: string;
  manageTokenHash: string;
};

type Loaded = { project: StoredProject; etag: string };

export async function readProject(id: string): Promise<Loaded | null> {
  const result = await get(projectJsonPath(id), { access: "public", useCache: false, token: env.blobToken() });
  if (!result || result.statusCode !== 200) return null;
  const project = (await new Response(result.stream).json()) as StoredProject;
  return { project, etag: result.blob.etag };
}

export async function writeProject(project: StoredProject, etag?: string): Promise<void> {
  await put(projectJsonPath(project.id), JSON.stringify(project, null, 2), {
    access: "public",
    contentType: "application/json",
    addRandomSuffix: false,
    allowOverwrite: Boolean(etag),
    cacheControlMaxAge: 60,
    ifMatch: etag,
    token: env.blobToken(),
  });
}

// Read-modify-write with optimistic concurrency; retries once if someone else wrote in between.
export async function updateProject(
  id: string,
  change: (project: StoredProject) => StoredProject | void,
): Promise<StoredProject | null> {
  for (let attempt = 0; attempt < 2; attempt++) {
    const loaded = await readProject(id);
    if (!loaded) return null;
    const next = change(structuredClone(loaded.project)) ?? loaded.project;
    next.updatedAt = new Date().toISOString();
    try {
      await writeProject(next, loaded.etag);
      return next;
    } catch (error) {
      if (!(error instanceof BlobPreconditionFailedError) || attempt === 1) throw error;
    }
  }
  return null;
}

export function toPublic(project: StoredProject): PublicProject {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { contactEmailEnc, manageTokenHash, ...rest } = project;
  return rest;
}

export function canManage(project: StoredProject, token: string | undefined | null): boolean {
  return Boolean(token) && tokenMatches(token!, project.manageTokenHash);
}

export function addEvent(project: StoredProject, by: ProjectEvent["by"], status: ProjectStatus, note?: string) {
  project.status = status;
  project.events.push({ at: new Date().toISOString(), by, status, ...(note ? { note } : {}) });
}

// Confirms each browser-uploaded blob really exists under the given project folder.
export async function verifyUploads(
  prefix: string,
  files: { pathname: string; url: string; filename: string }[],
): Promise<ProjectFile[]> {
  return Promise.all(
    files.map(async (file) => {
      if (!file.pathname.startsWith(prefix)) throw new Error("File does not belong to this project.");
      const meta = await head(file.pathname, { token: env.blobToken() });
      return {
        pathname: meta.pathname,
        url: meta.url,
        filename: sanitizeFilename(file.filename),
        size: meta.size,
        contentType: meta.contentType,
      };
    }),
  );
}

export async function deleteProjectBlobs(id: string): Promise<void> {
  let cursor: string | undefined;
  do {
    const page = await list({ prefix: projectPrefix(id), cursor, token: env.blobToken() });
    if (page.blobs.length) await del(page.blobs.map((b) => b.url), { token: env.blobToken() });
    cursor = page.hasMore ? page.cursor : undefined;
  } while (cursor);
}
