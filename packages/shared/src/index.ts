// Constants shared by apps/www and apps/app. See PLAN.md §5–6.

export const JOB_STATUSES = [
  "submitted",
  "processing",
  "review",
  "needs_info",
  "completed",
  "failed",
  "cancelled",
  "expired",
] as const;
export type JobStatus = (typeof JOB_STATUSES)[number];

export const USER_TYPES = [
  "architect",
  "contractor",
  "homeowner",
  "facility_manager",
  "other",
] as const;
export type UserType = (typeof USER_TYPES)[number];

export const USER_TYPE_LABELS: Record<UserType, string> = {
  architect: "Architect / designer",
  contractor: "Contractor / estimator",
  homeowner: "Homeowner",
  facility_manager: "Facility manager",
  other: "Other",
};

export const CONVERSION_ROUTES = ["revit", "bonsai"] as const;
export type ConversionRoute = (typeof CONVERSION_ROUTES)[number];

export const ALLOWED_UPLOAD_EXTENSIONS = [
  ".dwg",
  ".dxf",
  ".pdf",
  ".png",
  ".jpg",
  ".jpeg",
  ".webp",
  ".heic",
  ".txt",
  ".md",
] as const;

// Cloudflare free plan caps a single request at 100 MB.
export const MAX_FILE_BYTES = 100 * 1024 * 1024;
export const MAX_FILES_PER_JOB = 20;
export const MAX_JOBS_PER_DAY = 5;
export const RETENTION_DAYS = 30;
