// Constants shared by apps/www and apps/app. See PLAN.md §5–6.

// "draft" = created, files still uploading; never listed publicly.
export const PROJECT_STATUSES = [
  "draft",
  "submitted",
  "in_progress",
  "needs_info",
  "completed",
  "rejected",
] as const;
export type ProjectStatus = (typeof PROJECT_STATUSES)[number];

export const PROJECT_STATUS_LABELS: Record<ProjectStatus, string> = {
  draft: "Draft",
  submitted: "Submitted",
  in_progress: "In progress",
  needs_info: "Needs info",
  completed: "Completed",
  rejected: "Rejected",
};

export const BUILDING_TYPES = [
  "house",
  "apartment_building",
  "office",
  "industrial",
  "public",
  "other",
] as const;
export type BuildingType = (typeof BUILDING_TYPES)[number];

export const BUILDING_TYPE_LABELS: Record<BuildingType, string> = {
  house: "House",
  apartment_building: "Apartment building",
  office: "Office",
  industrial: "Industrial / warehouse",
  public: "Public building",
  other: "Other",
};

export type ProjectFile = {
  pathname: string;
  url: string;
  filename: string;
  size: number;
  contentType: string;
};

export type ProjectEvent = {
  at: string;
  by: "creator" | "admin" | "system";
  status: ProjectStatus;
  note?: string;
};

// Everything here is safe to show to any visitor.
export type PublicProject = {
  id: string;
  createdAt: string;
  updatedAt: string;
  title: string;
  description: string;
  buildingType?: BuildingType;
  storeys?: number;
  approxAreaM2?: number;
  units: "m" | "ft";
  authorName: string;
  status: ProjectStatus;
  published: boolean;
  adminMessage?: string;
  inputs: ProjectFile[];
  outputs: ProjectFile[];
  events: ProjectEvent[];
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

// output/summary.json, written by `ifc-tools validate` (tools/ifc-tools) and shown on the project page.
export type ModelSummary = {
  schema: string; // e.g. "IFC4"
  counts: Record<string, number>; // IFC class → element count, e.g. { IfcWall: 24 }
  storeys: { name: string; elevation?: number; counts: Record<string, number> }[];
  floorAreaM2?: number;
  warnings: string[];
};

export * from "./samples";
