// Blob path rules. Shared by server code and the upload form, so no server-only imports here.
import { ALLOWED_UPLOAD_EXTENSIONS } from "@ifcwise/shared";

export const projectPrefix = (id: string) => `projects/${id}/`;
export const projectJsonPath = (id: string) => `projects/${id}/project.json`;
export const inputPrefix = (id: string) => `projects/${id}/input/`;
export const outputPrefix = (id: string) => `projects/${id}/output/`;

export function fileExtension(filename: string): string {
  const dot = filename.lastIndexOf(".");
  return dot === -1 ? "" : filename.slice(dot).toLowerCase();
}

export function isAllowedInput(filename: string): boolean {
  return (ALLOWED_UPLOAD_EXTENSIONS as readonly string[]).includes(fileExtension(filename));
}

// Keep names readable but safe for URLs and Windows paths.
export function sanitizeFilename(filename: string): string {
  const ext = fileExtension(filename);
  const base = filename
    .slice(0, filename.length - ext.length)
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/^[-.]+|[-.]+$/g, "")
    .slice(0, 80);
  return `${base || "file"}${ext}`;
}

export const ID_PATTERN = /^[a-z2-9]{10}$/;
