// ====================================================
// TASK 4 — Zod validation schemas for API request bodies
// ====================================================
// Validates data BEFORE it reaches Prisma. Shared across routes.

import { z } from "zod";

// --- Reusable fragments ---

const bdMobile = z
  .string()
  .regex(/^01[3-9]\d{8}$/, "Valid BD mobile number required (11 digits)");

const optionalString = z.string().optional();
const optionalNullableString = z.string().nullish();

// --- Create Patient (POST /api/patients) ---

export const createPatientSchema = z.object({
  name: z.string().min(1, "Name is required"),
  age: z.coerce.number().int().min(0).max(120, "Age must be 0–120"),
  mobile: bdMobile,
  relativeMobile: bdMobile,
  dateOfBirth: optionalString,
  patientId: optionalNullableString,
  ethnicity: optionalString,
  religion: optionalString,
  nid: optionalNullableString,
  spouseMobile: optionalNullableString,
  district: optionalString,
  address: optionalString,
  shortHistory: optionalNullableString,
  surgicalHistory: optionalNullableString,
  familyHistory: optionalNullableString,
  pastIllness: optionalNullableString,
  tags: z.array(z.string()).optional(),
  specialNotes: optionalNullableString,
  finalDiagnosis: optionalNullableString,
});

export type CreatePatientInput = z.infer<typeof createPatientSchema>;

// --- Update Patient (PUT /api/patients) ---
// All fields optional except `id`. Reuses the create schema via .partial().

export const updatePatientSchema = createPatientSchema.partial().extend({
  id: z.string().uuid("Valid patient UUID required"),
});

export type UpdatePatientInput = z.infer<typeof updatePatientSchema>;

// --- Create Patient Test (POST /api/patient-tests) ---
// Test data fields are arbitrary JSON objects — validate structure, not content.

const jsonField = z.union([z.record(z.string(), z.unknown()), z.null()]).optional();

export const createPatientTestSchema = z.object({
  patientId: z.string().optional(),
  sampleDate: z.string().optional(),
  autoimmunoProfile: jsonField,
  cardiology: jsonField,
  rft: jsonField,
  lft: jsonField,
  diseaseHistory: jsonField,
  imaging: jsonField,
  hematology: jsonField,
  basdai: jsonField,
});

export type CreatePatientTestInput = z.infer<typeof createPatientTestSchema>;
