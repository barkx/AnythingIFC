"use server";

import { MAX_FILES_PER_PROJECT, MAX_PROJECTS_PER_IP_PER_DAY } from "@ifcwise/shared";
import { updateTag } from "next/cache";
import { z } from "zod";
import { ID_PATTERN, inputPrefix } from "@/lib/blob-paths";
import { encryptEmail, hashToken, newManageToken, newProjectId } from "@/lib/crypto";
import { ConfigError } from "@/lib/env";
import { PROJECTS_TAG } from "@/lib/project-list";
import { newProjectSchema, projectDetailsSchema, uploadedFileSchema } from "@/lib/project-schema";
import {
  addEvent,
  canManage,
  deleteProjectBlobs,
  readProject,
  updateProject,
  verifyUploads,
  writeProject,
  type StoredProject,
} from "@/lib/projects";
import { takeDailySlot } from "@/lib/rate-limit";

export type ActionResult<T = object> = ({ ok: true } & T) | { ok: false; error: string };

function fail(error: unknown): { ok: false; error: string } {
  if (error instanceof z.ZodError) return { ok: false, error: error.issues[0]?.message ?? "Invalid input." };
  if (error instanceof ConfigError) return { ok: false, error: `Server not configured: ${error.message}` };
  console.error(error);
  return { ok: false, error: error instanceof Error ? error.message : "Something went wrong." };
}

const auth = z.object({ projectId: z.string().regex(ID_PATTERN), manageToken: z.string().min(20).max(100) });

async function loadManaged(projectId: string, manageToken: string) {
  auth.parse({ projectId, manageToken });
  const loaded = await readProject(projectId);
  if (!loaded || !canManage(loaded.project, manageToken)) throw new Error("Project not found or link invalid.");
  return loaded;
}

export async function createProject(input: unknown): Promise<ActionResult<{ projectId: string; manageToken: string }>> {
  try {
    const data = newProjectSchema.parse(input);
    if (!(await takeDailySlot("create", MAX_PROJECTS_PER_IP_PER_DAY))) {
      return { ok: false, error: `You can create ${MAX_PROJECTS_PER_IP_PER_DAY} projects per day. Please try again tomorrow.` };
    }
    const id = newProjectId();
    const manageToken = newManageToken();
    const now = new Date().toISOString();
    const project: StoredProject = {
      id,
      createdAt: now,
      updatedAt: now,
      title: data.title,
      description: data.description,
      buildingType: data.buildingType,
      storeys: data.storeys,
      approxAreaM2: data.approxAreaM2,
      units: data.units,
      authorName: data.authorName,
      status: "draft",
      published: false,
      inputs: [],
      outputs: [],
      events: [{ at: now, by: "creator", status: "draft" }],
      contactEmailEnc: encryptEmail(data.email),
      manageTokenHash: hashToken(manageToken),
    };
    await writeProject(project);
    return { ok: true, projectId: id, manageToken };
  } catch (error) {
    return fail(error);
  }
}

// Called after the browser finished uploading files straight to Blob.
export async function attachFiles(
  projectId: string,
  manageToken: string,
  files: unknown,
  submit: boolean,
): Promise<ActionResult> {
  try {
    await loadManaged(projectId, manageToken);
    const parsed = z.array(uploadedFileSchema).max(MAX_FILES_PER_PROJECT).parse(files);
    const verified = await verifyUploads(inputPrefix(projectId), parsed);
    await updateProject(projectId, (p) => {
      const known = new Set(p.inputs.map((f) => f.pathname));
      p.inputs.push(...verified.filter((f) => !known.has(f.pathname)).slice(0, MAX_FILES_PER_PROJECT - p.inputs.length));
      if (submit && p.status === "draft") addEvent(p, "creator", "submitted");
      else if (verified.length) p.events.push({ at: new Date().toISOString(), by: "creator", status: p.status, note: `Added ${verified.length} file(s).` });
    });
    updateTag(PROJECTS_TAG);
    return { ok: true };
  } catch (error) {
    return fail(error);
  }
}

export async function submitDraft(projectId: string, manageToken: string): Promise<ActionResult> {
  try {
    await loadManaged(projectId, manageToken);
    await updateProject(projectId, (p) => {
      if (p.status === "draft") addEvent(p, "creator", "submitted");
    });
    updateTag(PROJECTS_TAG);
    return { ok: true };
  } catch (error) {
    return fail(error);
  }
}

export async function updateDetails(projectId: string, manageToken: string, input: unknown): Promise<ActionResult> {
  try {
    await loadManaged(projectId, manageToken);
    const data = projectDetailsSchema.parse(input);
    await updateProject(projectId, (p) => {
      Object.assign(p, data);
    });
    updateTag(PROJECTS_TAG);
    return { ok: true };
  } catch (error) {
    return fail(error);
  }
}

export async function replyToAdmin(projectId: string, manageToken: string, message: unknown): Promise<ActionResult> {
  try {
    await loadManaged(projectId, manageToken);
    const note = z.string().trim().min(2, "Reply is empty").max(3000).parse(message);
    await updateProject(projectId, (p) => {
      addEvent(p, "creator", p.status === "needs_info" ? "in_progress" : p.status, note);
    });
    updateTag(PROJECTS_TAG);
    return { ok: true };
  } catch (error) {
    return fail(error);
  }
}

export async function deleteProject(projectId: string, manageToken: string): Promise<ActionResult> {
  try {
    await loadManaged(projectId, manageToken);
    await deleteProjectBlobs(projectId);
    updateTag(PROJECTS_TAG);
    return { ok: true };
  } catch (error) {
    return fail(error);
  }
}
