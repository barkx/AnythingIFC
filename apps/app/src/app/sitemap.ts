import { SAMPLE_PROJECTS } from "@ifcwise/shared";
import type { MetadataRoute } from "next";
import { listPublishedProjects } from "@/lib/project-list";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3001";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const projects = await listPublishedProjects();
  return [
    { url: APP_URL, changeFrequency: "daily", priority: 1 },
    { url: `${APP_URL}/new`, changeFrequency: "yearly", priority: 0.5 },
    ...SAMPLE_PROJECTS.map((s) => ({ url: `${APP_URL}/samples/${s.slug}`, priority: 0.8 })),
    ...projects.map((p) => ({ url: `${APP_URL}/p/${p.id}`, lastModified: p.updatedAt, priority: 0.7 })),
  ];
}
