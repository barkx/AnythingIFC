import { upload } from "@vercel/blob/client";
import { inputPrefix, outputPrefix, sanitizeFilename } from "@/lib/blob-paths";

export type UploadedFile = { pathname: string; url: string; filename: string };
type Progress = (index: number, percentage: number) => void;

const MULTIPART_FROM_BYTES = 8 * 1024 * 1024;

// Uploads files one by one straight from the browser to Vercel Blob; /api/upload authorises each one.
async function uploadAll(prefix: string, payload: object, files: File[], onProgress: Progress): Promise<UploadedFile[]> {
  const uploaded: UploadedFile[] = [];
  for (const [index, file] of files.entries()) {
    const blob = await upload(`${prefix}${sanitizeFilename(file.name)}`, file, {
      access: "public",
      handleUploadUrl: "/api/upload",
      clientPayload: JSON.stringify({ ...payload, fileCount: files.length }),
      multipart: file.size >= MULTIPART_FROM_BYTES,
      onUploadProgress: ({ percentage }) => onProgress(index, percentage),
    });
    uploaded.push({ pathname: blob.pathname, url: blob.url, filename: file.name });
    onProgress(index, 100);
  }
  return uploaded;
}

export function uploadInputs(projectId: string, manageToken: string, files: File[], onProgress: Progress) {
  return uploadAll(inputPrefix(projectId), { target: "input", projectId, manageToken }, files, onProgress);
}

// Authorised by the admin session cookie, which the browser sends to /api/upload automatically.
export function uploadOutputs(projectId: string, files: File[], onProgress: Progress) {
  return uploadAll(outputPrefix(projectId), { target: "output", projectId }, files, onProgress);
}
