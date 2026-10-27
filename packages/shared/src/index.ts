// Constants shared by apps/www and apps/app. See PLAN.md §5–6.

export const PROJECT_STATUSES = [
  "submitted",
  "in_progress",
  "needs_info",
  "completed",
  "rejected",
] as const;
export type ProjectStatus = (typeof PROJECT_STATUSES)[number];

export const PROJECT_STATUS_LABELS: Record<ProjectStatus, string> = {
  submitted: "Submitted",
  in_progress: "In progress",
  needs_info: "Needs info",
  completed: "Completed",
  rejected: "Rejected",
};

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

export const ALLOWED_OUTPUT_EXTENSIONS = [".ifc", ".json", ".md", ".png"] as const;

export const MAX_FILE_BYTES = 100 * 1024 * 1024;
export const MAX_FILES_PER_PROJECT = 20;
export const MAX_PROJECTS_PER_IP_PER_DAY = 3;
