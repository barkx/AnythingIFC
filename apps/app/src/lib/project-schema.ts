import { BUILDING_TYPES } from "@ifcwise/shared";
import { z } from "zod";

const optionalNumber = (max: number) =>
  z.preprocess(
    (v) => (v === "" || v === null || v === undefined ? undefined : Number(v)),
    z.number().positive().max(max).optional(),
  );

export const projectDetailsSchema = z.object({
  title: z.string().trim().min(3, "Title is too short").max(120),
  description: z.string().trim().min(10, "Please describe the building in a sentence or two").max(5000),
  buildingType: z.preprocess((v) => (v === "" ? undefined : v), z.enum(BUILDING_TYPES).optional()),
  storeys: optionalNumber(100).pipe(z.number().int().optional()),
  approxAreaM2: optionalNumber(1_000_000),
  units: z.enum(["m", "ft"]).default("m"),
});

export const newProjectSchema = projectDetailsSchema.extend({
  authorName: z.string().trim().min(2, "Display name is too short").max(60),
  email: z.email("Enter a valid email").max(200),
  consentRights: z.literal(true, "Please confirm you have the right to share these files"),
  consentPublic: z.literal(true, "Please confirm you understand the project will be public"),
  // Honeypot: real people never see or fill this field.
  website: z.string().max(0).optional(),
});

export type ProjectDetailsInput = z.input<typeof projectDetailsSchema>;
export type NewProjectInput = z.input<typeof newProjectSchema>;

export const uploadedFileSchema = z.object({
  pathname: z.string().min(1).max(300),
  url: z.url(),
  filename: z.string().min(1).max(200),
});
