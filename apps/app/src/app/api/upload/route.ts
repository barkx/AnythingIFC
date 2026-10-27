import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { MAX_FILE_BYTES, MAX_FILES_PER_PROJECT } from "@ifcwise/shared";
import { z } from "zod";
import { isAdmin } from "@/lib/admin-auth";
import { ID_PATTERN, inputPrefix, isAllowedInput, isAllowedOutput, outputPrefix } from "@/lib/blob-paths";
import { env } from "@/lib/env";
import { canManage, readProject } from "@/lib/projects";

// Issues short-lived client-upload tokens.
// - input:  the creator, proven by the project's manage token, into projects/<id>/input/
// - output: the admin, proven by the admin session cookie, into projects/<id>/output/
const payloadSchema = z.discriminatedUnion("target", [
  z.object({
    target: z.literal("input"),
    projectId: z.string().regex(ID_PATTERN),
    manageToken: z.string().min(20).max(100),
    fileCount: z.number().int().min(1).max(MAX_FILES_PER_PROJECT),
  }),
  z.object({
    target: z.literal("output"),
    projectId: z.string().regex(ID_PATTERN),
    fileCount: z.number().int().min(1).max(MAX_FILES_PER_PROJECT),
  }),
]);

export async function POST(request: Request): Promise<Response> {
  const body = (await request.json()) as HandleUploadBody;
  try {
    const result = await handleUpload({
      body,
      request,
      token: env.blobToken(),
      onBeforeGenerateToken: async (pathname, clientPayload) => {
        const payload = payloadSchema.parse(JSON.parse(clientPayload ?? "{}"));
        if (payload.target === "output" && !(await isAdmin())) throw new Error("Not allowed.");
        const loaded = await readProject(payload.projectId);
        if (!loaded) throw new Error("Project not found.");

        if (payload.target === "input") {
          if (!canManage(loaded.project, payload.manageToken)) throw new Error("Not allowed.");
          if (!pathname.startsWith(inputPrefix(payload.projectId))) throw new Error("Wrong upload path.");
          if (!isAllowedInput(pathname)) throw new Error("This file type is not supported.");
          if (loaded.project.inputs.length + payload.fileCount > MAX_FILES_PER_PROJECT) {
            throw new Error(`A project can have at most ${MAX_FILES_PER_PROJECT} files.`);
          }
        } else {
          if (!pathname.startsWith(outputPrefix(payload.projectId))) throw new Error("Wrong upload path.");
          if (!isAllowedOutput(pathname)) throw new Error("Outputs must be .ifc, .json, .md or .png.");
        }

        return {
          maximumSizeInBytes: MAX_FILE_BYTES,
          addRandomSuffix: true,
          validUntil: Date.now() + 30 * 60 * 1000,
        };
      },
    });
    return Response.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Upload failed.";
    return Response.json({ error: message }, { status: 400 });
  }
}
