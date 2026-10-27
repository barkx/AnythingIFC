import "server-only";

export class ConfigError extends Error {}

function required(name: string): string {
  const value = process.env[name];
  if (!value) throw new ConfigError(`${name} is not set. See apps/app/.env.example.`);
  return value;
}

export const hasBlobToken = () => Boolean(process.env.BLOB_READ_WRITE_TOKEN);

export const env = {
  blobToken: () => required("BLOB_READ_WRITE_TOKEN"),
  sessionSecret: () => required("SESSION_SECRET"),
  emailKey: () => required("EMAIL_ENCRYPTION_KEY"),
  adminPassword: () => required("ADMIN_PASSWORD"),
  adminApiToken: () => required("ADMIN_API_TOKEN"),
  appUrl: () => process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3001",
};
