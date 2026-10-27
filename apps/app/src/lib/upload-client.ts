import { upload } from "@vercel/blob/client";
import { inputPrefix, sanitizeFilename } from "@/lib/blob-paths";

export type UploadedFile = { pathname: string; url: string; filename: string };

const MULTIPART_FROM_BYTES = 8 * 1024 * 1024;

// Uploads files one by one straight from the browser to Vercel Blob.
export async function uploadInputs(
  projectId: string,
  manageToken: string,
  files: File[],
  onProgress: (index: number, percentage: number) => void,
): Promise<UploadedFile[]> {
  const uploaded: UploadedFile[] = [];
  for (const [index, file] of files.entries()) {
    const blob = await upload(`${inputPrefix(projectId)}${sanitizeFilename(file.name)}`, file, {
      access: "public",
      handleUploadUrl: "/api/upload",
      clientPayload: JSON.stringify({ projectId, manageToken, fileCount: files.length }),
      multipart: file.size >= MULTIPART_FROM_BYTES,
      onUploadProgress: ({ percentage }) => onProgress(index, percentage),
    });
    uploaded.push({ pathname: blob.pathname, url: blob.url, filename: file.name });
    onProgress(index, 100);
  }
  return uploaded;
}
