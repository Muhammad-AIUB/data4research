import type { Prisma } from "@prisma/client";

export type AppRole = "ADMIN" | "DOCTOR";

export type AppUser = {
  id: string;
  email?: string | null;
  role: AppRole;
};

export function isAdmin(user: Pick<AppUser, "role"> | null | undefined): user is AppUser & { role: "ADMIN" } {
  return user?.role === "ADMIN";
}

export function scopePatientAccess(
  user: AppUser,
  where: Prisma.PatientWhereInput = {},
): Prisma.PatientWhereInput {
  if (isAdmin(user)) {
    return where;
  }

  return {
    AND: [where, { createdBy: user.id }],
  };
}

export function scopePatientTestAccess(
  user: AppUser,
  where: Prisma.PatientTestWhereInput = {},
): Prisma.PatientTestWhereInput {
  if (isAdmin(user)) {
    return where;
  }

  return {
    AND: [where, { patient: { is: { createdBy: user.id } } }],
  };
}
