import "server-only";
import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { env } from "@/lib/env";

export const ADMIN_COOKIE = "ifcwise_admin";
const MAX_AGE_SECONDS = 7 * 24 * 60 * 60;

function safeEqual(a: string, b: string): boolean {
  // Hash first so lengths always match and nothing leaks through timing.
  const ha = createHash("sha256").update(a).digest();
  const hb = createHash("sha256").update(b).digest();
  return timingSafeEqual(ha, hb);
}

const sign = (expires: number) =>
  `${expires}.${createHmac("sha256", env.sessionSecret()).update(`admin:${expires}`).digest("base64url")}`;

export function passwordMatches(password: string): boolean {
  return safeEqual(password, env.adminPassword());
}

export async function startAdminSession(): Promise<void> {
  const expires = Math.floor(Date.now() / 1000) + MAX_AGE_SECONDS;
  (await cookies()).set(ADMIN_COOKIE, sign(expires), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE_SECONDS,
  });
}

export async function endAdminSession(): Promise<void> {
  (await cookies()).delete(ADMIN_COOKIE);
}

export async function isAdmin(): Promise<boolean> {
  const value = (await cookies()).get(ADMIN_COOKIE)?.value;
  if (!value) return false;
  const expires = Number(value.split(".")[0]);
  return Number.isFinite(expires) && expires > Date.now() / 1000 && safeEqual(value, sign(expires));
}

// For pages: send visitors without a session to the login page.
export async function requireAdmin(): Promise<void> {
  if (!(await isAdmin())) redirect("/admin/login");
}

// For the ifc-tools CLI: `Authorization: Bearer <ADMIN_API_TOKEN>`.
export function bearerIsAdmin(request: Request): boolean {
  const header = request.headers.get("authorization") ?? "";
  return header.startsWith("Bearer ") && safeEqual(header.slice(7), env.adminApiToken());
}
