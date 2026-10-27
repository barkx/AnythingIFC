import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  return ["", "/privacy", "/terms", "/imprint"].map((path) => ({
    url: `${SITE_URL}${path}`,
    changeFrequency: path ? "yearly" : "monthly",
    priority: path ? 0.3 : 1,
  }));
}
