import type { Prisma } from "@prisma/client";
import * as Sentry from "@sentry/nextjs";
import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { authorizeRole } from "@/lib/authorizeRole";
import { logAudit, getChangedFields, extractRequestMeta } from "@/lib/auditLog";
import { checkRateLimit } from "@/lib/rateLimit";
import { isAdmin, scopePatientAccess } from "@/lib/rbac";
import { createRequestId } from "@/lib/requestId";
import { createPatientSchema, updatePatientSchema } from "@/lib/validations";

const patientSummarySelect = {
  id: true,
  name: true,
  mobile: true,
  patientId: true,
} as const;

const patientCreatorSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
} as const;

const patientDetailSelect = {
  id: true,
  name: true,
  age: true,
  mobile: true,
  patientId: true,
  dateOfBirth: true,
  ethnicity: true,
  religion: true,
  nid: true,
  spouseMobile: true,
  relativeMobile: true,
  district: true,
  address: true,
  shortHistory: true,
  surgicalHistory: true,
  familyHistory: true,
  pastIllness: true,
  tags: true,
  specialNotes: true,
  finalDiagnosis: true,
  createdAt: true,
} as const;

export async function GET(request: Request) {
  const requestId = createRequestId();

  try {
    const auth = await authorizeRole();
    if (auth.error) return auth.error;

    const user = auth.session.user;
    const admin = isAdmin(user);
    const { searchParams } = new URL(request.url);
    const singleId = searchParams.get("id");

    if (singleId) {
      const isUUID =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
          singleId,
        );

      const patient = await prisma.patient.findFirst({
        where: scopePatientAccess(
          user,
          isUUID ? { id: singleId } : { patientId: singleId },
        ),
        select: admin
          ? {
              ...patientDetailSelect,
              createdByUser: {
                select: patientCreatorSelect,
              },
            }
          : patientDetailSelect,
      });

      if (!patient) {
        return NextResponse.json(
          { message: "Patient not found", requestId },
          { status: 404 },
        );
      }

      return NextResponse.json({ patient }, { status: 200 });
    }

    const searchQuery = searchParams.get("search");
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(
      100,
      Math.max(1, parseInt(searchParams.get("limit") || "50", 10)),
    );
    const offset = (page - 1) * limit;
    let whereClause: Prisma.PatientWhereInput = {};

    if (searchQuery?.trim()) {
      const searchTerm = searchQuery.trim();
      const isNumeric = /^[\d+\-() ]+$/.test(searchTerm);

      whereClause = isNumeric
        ? {
            OR: [
              { mobile: { startsWith: searchTerm } },
              { patientId: { startsWith: searchTerm } },
              { relativeMobile: { startsWith: searchTerm } },
              { spouseMobile: { startsWith: searchTerm } },
            ],
          }
        : {
            OR: [
              { name: { contains: searchTerm, mode: "insensitive" } },
              {
                finalDiagnosis: {
                  contains: searchTerm,
                  mode: "insensitive",
                },
              },
              { tags: { has: searchTerm } },
            ],
          };
    }

    const rows = await prisma.patient.findMany({
      where: scopePatientAccess(user, whereClause),
      select: admin
        ? {
            ...patientSummarySelect,
            createdByUser: {
              select: patientCreatorSelect,
            },
          }
        : patientSummarySelect,
      orderBy: { createdAt: "desc" },
      skip: offset,
      take: limit + 1,
    });

    const hasMore = rows.length > limit;
    const patients = hasMore ? rows.slice(0, limit) : rows;

    return NextResponse.json(
      { patients, hasMore, page, limit },
      {
        status: 200,
        headers: {
          "Cache-Control": "private, s-maxage=60, stale-while-revalidate=120",
        },
      },
    );
  } catch (error: unknown) {
    Sentry.captureException(error, {
      tags: { requestId, route: "GET /api/patients" },
    });
    console.error(
      JSON.stringify({
        level: "ERROR",
        requestId,
        route: "GET /api/patients",
        error: error instanceof Error ? error.message : String(error),
      }),
    );

    return NextResponse.json(
      {
        message:
          error instanceof Error ? error.message : "Failed to fetch patients",
        requestId,
      },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  const requestId = createRequestId();

  try {
    const auth = await authorizeRole();
    if (auth.error) return auth.error;

    const user = auth.session.user;
    const rateLimited = checkRateLimit(user.id);
    if (rateLimited) return rateLimited;

    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { id: true },
    });

    if (!dbUser) {
      return NextResponse.json(
        { message: "User account not found. Please log in again.", requestId },
        { status: 401 },
      );
    }

    const body = await request.json();
    const parsed = createPatientSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          message: "Validation failed",
          errors: parsed.error.flatten().fieldErrors,
          requestId,
        },
        { status: 400 },
      );
    }

    const {
      name,
      dateOfBirth,
      age,
      ethnicity,
      religion,
      nid,
      patientId,
      mobile,
      spouseMobile,
      relativeMobile,
      district,
      address,
      shortHistory,
      surgicalHistory,
      familyHistory,
      pastIllness,
      tags,
      specialNotes,
      finalDiagnosis,
    } = parsed.data;

    const patient = await prisma.patient.create({
      data: {
        name,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : new Date(),
        age,
        ethnicity: ethnicity || "",
        religion: religion || "islam",
        nid: nid || null,
        patientId: patientId?.trim() ? patientId.trim() : null,
        mobile,
        spouseMobile: spouseMobile || null,
        relativeMobile: relativeMobile || null,
        district: district || "",
        address: address || "",
        shortHistory: shortHistory || null,
        surgicalHistory: surgicalHistory || null,
        familyHistory: familyHistory || null,
        pastIllness: pastIllness || null,
        tags: tags || [],
        specialNotes: specialNotes || null,
        finalDiagnosis: finalDiagnosis || null,
        createdBy: user.id,
      },
    });

    const { ipAddress, userAgent } = extractRequestMeta(request);
    logAudit({
      userId: user.id,
      action: "CREATE_PATIENT",
      resource: "Patient",
      resourceId: patient.id,
      after: {
        name: patient.name,
        age: patient.age,
        mobile: patient.mobile,
        patientId: patient.patientId,
      },
      ipAddress,
      userAgent,
    });

    return NextResponse.json({ success: true, patient }, { status: 201 });
  } catch (error: unknown) {
    Sentry.captureException(error, {
      tags: { requestId, route: "POST /api/patients" },
    });
    console.error(
      JSON.stringify({
        level: "ERROR",
        requestId,
        route: "POST /api/patients",
        error: error instanceof Error ? error.message : String(error),
      }),
    );

    if (error && typeof error === "object" && "code" in error) {
      const prismaError = error as { code: string };

      if (prismaError.code === "P2002") {
        return NextResponse.json(
          {
            message:
              "Patient ID already exists. Please use a different Patient ID.",
            requestId,
          },
          { status: 409 },
        );
      }

      if (prismaError.code === "P2003") {
        return NextResponse.json(
          {
            message: "User account not found. Please log out and log in again.",
            requestId,
          },
          { status: 401 },
        );
      }
    }

    const message =
      error instanceof Error ? error.message : "Failed to create patient";

    return NextResponse.json(
      {
        message,
        requestId,
        ...(process.env.NODE_ENV === "development"
          ? { error: error instanceof Error ? error.stack : String(error) }
          : {}),
      },
      { status: 500 },
    );
  }
}

export async function DELETE(request: Request) {
  const requestId = createRequestId();

  try {
    const auth = await authorizeRole();
    if (auth.error) return auth.error;

    const user = auth.session.user;
    const rateLimited = checkRateLimit(user.id);
    if (rateLimited) return rateLimited;

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { message: "Patient ID is required", requestId },
        { status: 400 },
      );
    }

    const patient = await prisma.patient.findFirst({
      where: scopePatientAccess(user, { id }),
      select: {
        id: true,
        name: true,
        age: true,
        mobile: true,
        patientId: true,
      },
    });

    if (!patient) {
      return NextResponse.json(
        { message: "Patient not found", requestId },
        { status: 404 },
      );
    }

    await prisma.patient.delete({
      where: { id: patient.id },
    });

    const { ipAddress, userAgent } = extractRequestMeta(request);
    logAudit({
      userId: user.id,
      action: "DELETE_PATIENT",
      resource: "Patient",
      resourceId: patient.id,
      before: patient as Record<string, unknown>,
      ipAddress,
      userAgent,
    });

    return NextResponse.json(
      { success: true, message: "Patient deleted successfully" },
      { status: 200 },
    );
  } catch (error: unknown) {
    Sentry.captureException(error, {
      tags: { requestId, route: "DELETE /api/patients" },
    });
    console.error(
      JSON.stringify({
        level: "ERROR",
        requestId,
        route: "DELETE /api/patients",
        error: error instanceof Error ? error.message : String(error),
      }),
    );

    return NextResponse.json(
      {
        message:
          error instanceof Error ? error.message : "Failed to delete patient",
        requestId,
      },
      { status: 500 },
    );
  }
}

export async function PUT(request: Request) {
  const requestId = createRequestId();

  try {
    const auth = await authorizeRole();
    if (auth.error) return auth.error;

    const user = auth.session.user;
    const rateLimited = checkRateLimit(user.id);
    if (rateLimited) return rateLimited;

    const body = await request.json();
    const parsed = updatePatientSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          message: "Validation failed",
          errors: parsed.error.flatten().fieldErrors,
          requestId,
        },
        { status: 400 },
      );
    }

    const { id, ...updateFields } = parsed.data;

    if (!id) {
      return NextResponse.json(
        { message: "Patient ID is required", requestId },
        { status: 400 },
      );
    }

    const beforePatient = await prisma.patient.findFirst({
      where: scopePatientAccess(user, { id }),
    });

    if (!beforePatient) {
      return NextResponse.json(
        { message: "Patient not found", requestId },
        { status: 404 },
      );
    }

    const updateData: Record<string, unknown> = {};
    if (updateFields.name !== undefined) updateData.name = updateFields.name;
    if (updateFields.age !== undefined) updateData.age = updateFields.age;
    if (updateFields.dateOfBirth !== undefined) {
      updateData.dateOfBirth = new Date(updateFields.dateOfBirth);
    }
    if (updateFields.ethnicity !== undefined) {
      updateData.ethnicity = updateFields.ethnicity;
    }
    if (updateFields.religion !== undefined) {
      updateData.religion = updateFields.religion;
    }
    if (updateFields.nid !== undefined) updateData.nid = updateFields.nid || null;
    if (updateFields.patientId !== undefined) {
      updateData.patientId = updateFields.patientId?.trim() || null;
    }
    if (updateFields.mobile !== undefined) updateData.mobile = updateFields.mobile;
    if (updateFields.spouseMobile !== undefined) {
      updateData.spouseMobile = updateFields.spouseMobile || null;
    }
    if (updateFields.relativeMobile !== undefined) {
      updateData.relativeMobile = updateFields.relativeMobile || null;
    }
    if (updateFields.district !== undefined) {
      updateData.district = updateFields.district || "";
    }
    if (updateFields.address !== undefined) updateData.address = updateFields.address || "";
    if (updateFields.shortHistory !== undefined) {
      updateData.shortHistory = updateFields.shortHistory || null;
    }
    if (updateFields.surgicalHistory !== undefined) {
      updateData.surgicalHistory = updateFields.surgicalHistory || null;
    }
    if (updateFields.familyHistory !== undefined) {
      updateData.familyHistory = updateFields.familyHistory || null;
    }
    if (updateFields.pastIllness !== undefined) {
      updateData.pastIllness = updateFields.pastIllness || null;
    }
    if (updateFields.tags !== undefined) updateData.tags = updateFields.tags || [];
    if (updateFields.specialNotes !== undefined) {
      updateData.specialNotes = updateFields.specialNotes || null;
    }
    if (updateFields.finalDiagnosis !== undefined) {
      updateData.finalDiagnosis = updateFields.finalDiagnosis || null;
    }

    const patient = await prisma.patient.update({
      where: { id: beforePatient.id },
      data: updateData,
    });

    const { ipAddress, userAgent } = extractRequestMeta(request);
    const diff = getChangedFields(
      beforePatient as Record<string, unknown>,
      updateData,
    );
    logAudit({
      userId: user.id,
      action: "UPDATE_PATIENT",
      resource: "Patient",
      resourceId: beforePatient.id,
      before: diff.before,
      after: diff.after,
      ipAddress,
      userAgent,
    });

    return NextResponse.json({ success: true, patient }, { status: 200 });
  } catch (error: unknown) {
    Sentry.captureException(error, {
      tags: { requestId, route: "PUT /api/patients" },
    });
    console.error(
      JSON.stringify({
        level: "ERROR",
        requestId,
        route: "PUT /api/patients",
        error: error instanceof Error ? error.message : String(error),
      }),
    );

    if (error && typeof error === "object" && "code" in error) {
      const prismaError = error as { code: string };

      if (prismaError.code === "P2002") {
        return NextResponse.json(
          {
            message: "Patient ID already exists. Please use a different one.",
            requestId,
          },
          { status: 409 },
        );
      }
    }

    return NextResponse.json(
      {
        message:
          error instanceof Error ? error.message : "Failed to update patient",
        requestId,
      },
      { status: 500 },
    );
  }
}
