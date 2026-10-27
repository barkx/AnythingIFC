import "server-only";
import { createCipheriv, createDecipheriv, createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { env } from "@/lib/env";

const ID_ALPHABET = "abcdefghijkmnopqrstuvwxyz23456789"; // no l, 0, 1 — easy to read aloud

export function newProjectId(length = 10): string {
  const bytes = randomBytes(length);
  return Array.from(bytes, (b) => ID_ALPHABET[b % ID_ALPHABET.length]).join("");
}

export function newManageToken(): string {
  return randomBytes(32).toString("base64url");
}

export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function tokenMatches(token: string, expectedHash: string): boolean {
  const a = Buffer.from(hashToken(token), "hex");
  const b = Buffer.from(expectedHash, "hex");
  return a.length === b.length && timingSafeEqual(a, b);
}

// Keyed hash so stored rate-limit markers can't be reversed into IP addresses.
export function hashIp(ip: string): string {
  return createHmac("sha256", env.sessionSecret()).update(ip).digest("hex").slice(0, 24);
}

function emailKey(): Buffer {
  const key = Buffer.from(env.emailKey(), "base64");
  if (key.length !== 32) throw new Error("EMAIL_ENCRYPTION_KEY must be 32 bytes, base64-encoded.");
  return key;
}

// Format: base64url(iv).base64url(tag).base64url(ciphertext)
export function encryptEmail(email: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", emailKey(), iv);
  const data = Buffer.concat([cipher.update(email, "utf8"), cipher.final()]);
  return [iv, cipher.getAuthTag(), data].map((b) => b.toString("base64url")).join(".");
}

export function decryptEmail(value: string): string {
  const [iv, tag, data] = value.split(".").map((p) => Buffer.from(p, "base64url"));
  const decipher = createDecipheriv("aes-256-gcm", emailKey(), iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(data), decipher.final()]).toString("utf8");
}
