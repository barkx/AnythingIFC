import "server-only";
import { list, put } from "@vercel/blob";
import { headers } from "next/headers";
import { env } from "@/lib/env";
import { hashIp } from "@/lib/crypto";

// No database, so each creation leaves a tiny marker blob: ratelimit/<day>/<ip-hash>/<n>.
// Good enough for a PoC; markers older than a day can be swept by the admin cleanup later.
export async function takeDailySlot(bucket: string, limit: number): Promise<boolean> {
  const h = await headers();
  const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "local";
  const day = new Date().toISOString().slice(0, 10);
  const prefix = `ratelimit/${bucket}/${day}/${hashIp(ip)}/`;

  const { blobs } = await list({ prefix, limit: limit + 1, token: env.blobToken() });
  if (blobs.length >= limit) return false;

  await put(`${prefix}${blobs.length}`, "1", {
    access: "public",
    addRandomSuffix: true,
    token: env.blobToken(),
  });
  return true;
}
