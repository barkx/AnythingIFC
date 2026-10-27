"use server";

import { MAX_FILES_PER_PROJECT, PROJECT_STATUSES } from "@ifcwise/shared";
import { del } from "@vercel/blob";
import { updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { endAdminSession, isAdmin, passwordMatches, startAdminSession } from "@/lib/admin-auth";
import { ID_PATTERN, outputPrefix } from "@/lib/blob-paths";
import { ConfigError, env } from "@/lib/env";
import { PROJECTS_TAG } from "@/lib/project-list";
import { uploadedFileSchema } from "@/lib/project-schema";
import { addEvent, deleteProjectBlobs, updateProject, verifyUploads, type StoredProject } from "@/lib/projects";
import { takeDailySlot } from "@/lib/rate-limit";
import type { ActionResult } from "@/lib/project-actions";

function fail(error: unknown): { ok: false; error: string } {
  if (error instanceof z.ZodError) return { ok: false, error: error.issues[0]?.message ?? "Invalid input." };
  if (error instanceof ConfigError) return { ok: false, error: `Server not configured: ${error.message}` };
  console.error(error);
  return { ok: false, error: error instanceof Error ? error.message : "Something went wrong." };
}

export async function login(_: unknown, formData: FormData): Promise<{ error?: string }> {
  try {
    if (!(await takeDailySlot("admin-login", 20))) return { error: "Too many attempts today." };
    if (!passwordMatches(String(formData.get("password") ?? ""))) return { error: "Wrong password." };
    await startAdminSession();
  } catch (error) {
    return { error: fail(error).error };
  }
  redirect("/admin");
}

export async function logout(): Promise<void> {
  await endAdminSession();
  redirect("/admin/login");
}

// Every admin mutation goes through here: session check, update, cache invalidation.
async function adminUpdate(projectId: string, change: (p: StoredProject) => void): Promise<ActionResult> {
  try {
    if (!(await isAdmin())) return { ok: false, error: "Your admin session has expired. Log in again." };
    z.string().regex(ID_PATTERN).parse(projectId);
    const updated = await updateProject(projectId, change);
    if (!updated) return { ok: false, error: "Project not found." };
    updateTag(PROJECTS_TAG);
    return { ok: true };
  } catch (error) {
    return fail(error);
  }
}

export async function setPublished(projectId: string, published: boolean): Promise<ActionResult> {
  return adminUpdate(projectId, (p) => {
    p.published = published;
    p.events.push({ at: new Date().toISOString(), by: "admin", status: p.status, note: published ? "Published." : "Unpublished." });
  });
}

export async function setStatus(projectId: string, status: unknown, note: unknown): Promise<ActionResult> {
  const parsed = z.object({ status: z.enum(PROJECT_STATUSES), note: z.string().trim().max(3000) }).safeParse({ status, note });
  if (!parsed.success) return { ok: false, error: "Invalid status." };
  return adminUpdate(projectId, (p) => addEvent(p, "admin", parsed.data.status, parsed.data.note || undefined));
}

// Public message on the project page. Asking a question also moves the project to needs_info.
export async function setMessage(projectId: string, message: unknown, askQuestion: boolean): Promise<ActionResult> {
  const parsed = z.string().trim().max(3000).safeParse(message);
  if (!parsed.success) return { ok: false, error: "Message is too long." };
  return adminUpdate(projectId, (p) => {
    p.adminMessage = parsed.data || undefined;
    if (askQuestion && parsed.data) addEvent(p, "admin", "needs_info", parsed.data);
  });
}

export async function attachOutputs(projectId: string, files: unknown, complete: boolean): Promise<ActionResult> {
  try {
    if (!(await isAdmin())) return { ok: false, error: "Your admin session has expired. Log in again." };
    const parsed = z.array(uploadedFileSchema).max(MAX_FILES_PER_PROJECT).parse(files);
    const verified = await verifyUploads(outputPrefix(projectId), parsed);
    return adminUpdate(projectId, (p) => {
      p.outputs.push(...verified);
      if (complete) {
        p.adminMessage = undefined;
        addEvent(p, "admin", "completed", "IFC model delivered.");
      }
    });
  } catch (error) {
    return fail(error);
  }
}

export async function removeOutput(projectId: string, pathname: string): Promise<ActionResult> {
  const result = await adminUpdate(projectId, (p) => {
    p.outputs = p.outputs.filter((f) => f.pathname !== pathname);
  });
  if (result.ok && pathname.startsWith(outputPrefix(projectId))) await del(pathname, { token: env.blobToken() });
  return result;
}

export async function adminDeleteProject(projectId: string): Promise<ActionResult> {
  try {
    if (!(await isAdmin())) return { ok: false, error: "Your admin session has expired. Log in again." };
    z.string().regex(ID_PATTERN).parse(projectId);
    await deleteProjectBlobs(projectId);
    updateTag(PROJECTS_TAG);
    return { ok: true };
  } catch (error) {
    return fail(error);
  }
}
