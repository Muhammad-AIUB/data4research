import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";
import type { Session } from "next-auth";
import { authorizeRole } from "@/lib/authorizeRole";
import { createPatientSchema, updatePatientSchema } from "@/lib/validations";
import { createRequestId } from "@/lib/requestId";
import { checkRateLimit } from "@/lib/rateLimit";
import { auditLog } from "@/lib/auditLog";

export async function GET(request: Request) {
  const requestId = createRequestId();
  try {
    // @ts-expect-error - authOptions type mismatch with next-auth overloads
    const session = (await getServerSession(authOptions)) as Session | null;
    if (!session || !session.user) {
      return NextResponse.json({ message: "Unauthorized", requestId }, { status: 401 });
    }
    const { searchParams } = new URL(request.url);
    const singleId = searchParams.get("id");

    // Single patient fetch — select only fields the edit page needs
    if (singleId) {
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(singleId);
      const whereClause = isUUID ? { id: singleId } : { patientId: singleId };
      const patient = await prisma.patient.findUnique({
        where: whereClause,
        // Explicit select avoids transferring large relation data
        select: {
          id: true, name: true, age: true, mobile: true, patientId: true,
          dateOfBirth: true, ethnicity: true, religion: true, nid: true,
          spouseMobile: true, relativeMobile: true, district: true,
          address: true, shortHistory: true, surgicalHistory: true,
          familyHistory: true, pastIllness: true, tags: true,
          specialNotes: true, finalDiagnosis: true, createdAt: true,
        },
      });
      if (!patient) {
        return NextResponse.json({ message: "Patient not found", requestId }, { status: 404 });
      }
      return NextResponse.json({ patient }, { status: 200 });
    }

    const searchQuery = searchParams.get("search");
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "50")));
    const offset = (page - 1) * limit;
    let whereClause: Record<string, unknown> = {};

    if (searchQuery && searchQuery.trim() !== "") {
      const searchTerm = searchQuery.trim();
      // Split search by input type to reduce OR branches.
      // Numeric-looking input → search phone/ID fields (use indexed startsWith).
      // Text input → search name/diagnosis/tags only.
      // This lets PG use the B-tree indexes instead of sequential scans.
      const isNumeric = /^[\d+\-() ]+$/.test(searchTerm);

      if (isNumeric) {
        // Phone numbers & patientId — startsWith uses B-tree index efficiently
        whereClause = {
          OR: [
            { mobile: { startsWith: searchTerm } },
            { patientId: { startsWith: searchTerm } },
            { relativeMobile: { startsWith: searchTerm } },
            { spouseMobile: { startsWith: searchTerm } },
          ],
        };
      } else {
        // Text search — reduced to 3 OR branches (name, diagnosis, tags)
        whereClause = {
          OR: [
            { name: { contains: searchTerm, mode: "insensitive" } },
            { finalDiagnosis: { contains: searchTerm, mode: "insensitive" } },
            { tags: { has: searchTerm } },  // GIN-indexed array lookup
          ],
        };
      }
    }

    // hasMore strategy: fetch limit+1 to detect next page without a COUNT query.
    // COUNT on large tables with WHERE is expensive (full index scan).
    const rows = await prisma.patient.findMany({
      where: whereClause,
      select: {
        id: true,
        name: true,
        mobile: true,
        patientId: true,
      },
      orderBy: { createdAt: "desc" },
      skip: offset,
      take: limit + 1,  // +1 to detect if there's a next page
    });

    const hasMore = rows.length > limit;
    // Trim the extra row before sending response
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
    console.error(JSON.stringify({ level: "ERROR", requestId, route: "GET /api/patients", error: error instanceof Error ? error.message : String(error) }));
    const message =
      error instanceof Error ? error.message : "Failed to fetch patients";
    return NextResponse.json({ message, requestId }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const requestId = createRequestId();
  try {
    // Role-based authorization — only DOCTOR/ADMIN can create patients
    const auth = await authorizeRole();
    if (auth.error) return auth.error;
    const session = auth.session;

    // Rate limit — protect write endpoint from abuse
    const rateLimited = checkRateLimit(session.user.id);
    if (rateLimited) return rateLimited;
    // Log session for debugging
    console.log('Session on create patient:', session);
    console.log('Session user id/email:', session?.user?.id, session?.user?.email);

    // Prefer user id, but fall back to email lookup if id-based lookup fails
    const userId = session?.user?.id as string | undefined;
    let user = null;
    if (userId) {
      user = await prisma.user.findUnique({ where: { id: userId }, select: { id: true } });
    }
    if (!user && session?.user?.email) {
      console.warn('User not found by id; attempting lookup by email:', session.user.email);
      user = await prisma.user.findUnique({ where: { email: session.user.email }, select: { id: true } });
    }
    if (!user) {
      console.error('User not found in database using session id or email:', { id: userId, email: session?.user?.email });
      return NextResponse.json(
        { message: "User account not found. Please log in again.", requestId },
        { status: 401 },
      );
    }

    const body = await request.json();

    // Zod validation — reject malformed data before hitting Prisma
    const parsed = createPatientSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { message: "Validation failed", errors: parsed.error.flatten().fieldErrors, requestId },
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
    const patientData = {
      name,
      dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : new Date(),
      age,
      ethnicity: ethnicity || "",
      religion: religion || "islam",
      nid: nid || null,
      patientId: patientId && patientId.trim() !== "" ? patientId.trim() : null,
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
    };
    if (process.env.NODE_ENV === "development") {
      console.log("Creating patient with data:", JSON.stringify(patientData, null, 2));
    }
    const patient = await prisma.patient.create({
      data: patientData,
    });

    // Audit: patient created
    auditLog(requestId, user.id, "CREATE_PATIENT", "Patient", patient.id);

    return NextResponse.json({ success: true, patient }, { status: 201 });
  } catch (error: unknown) {
    console.error(JSON.stringify({ level: "ERROR", requestId, route: "POST /api/patients", error: error instanceof Error ? error.message : String(error) }));
    if (error && typeof error === "object" && "code" in error) {
      const prismaError = error as {
        code: string;
        meta?: Record<string, unknown>;
        message?: string;
      };
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
    let message = "Failed to create patient";
    if (error instanceof Error) {
      message = error.message;
    } else if (error && typeof error === "object" && "message" in error) {
      message = String(error.message);
    }
    const errorResponse: { message: string; error?: string; requestId: string } = { message, requestId };
    if (process.env.NODE_ENV === "development") {
      errorResponse.error =
        error instanceof Error ? error.stack : String(error);
    }
    return NextResponse.json(errorResponse, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const requestId = createRequestId();
  try {
    // Role-based authorization — only DOCTOR/ADMIN can delete patients
    const auth = await authorizeRole();
    if (auth.error) return auth.error;

    // Rate limit — protect write endpoint from abuse
    const rateLimited = checkRateLimit(auth.session.user.id);
    if (rateLimited) return rateLimited;

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { message: "Patient ID is required", requestId },
        { status: 400 },
      );
    }

    // DESTRUCTIVE: Deletes patient AND all related PatientTest rows (onDelete: Cascade).
    // This cannot be undone. The cascade is defined in schema.prisma on Patient.tests.
    await prisma.patient.delete({
      where: { id },
    });

    // Audit: patient deleted (+ cascaded tests)
    auditLog(requestId, auth.session.user.id, "DELETE_PATIENT", "Patient", id);

    return NextResponse.json(
      { success: true, message: "Patient deleted successfully" },
      { status: 200 },
    );
  } catch (error: unknown) {
    console.error(JSON.stringify({ level: "ERROR", requestId, route: "DELETE /api/patients", error: error instanceof Error ? error.message : String(error) }));
    if (error && typeof error === "object" && "code" in error) {
      const prismaError = error as { code: string };
      if (prismaError.code === "P2025") {
        return NextResponse.json(
          { message: "Patient not found", requestId },
          { status: 404 },
        );
      }
    }
    const message =
      error instanceof Error ? error.message : "Failed to delete patient";
    return NextResponse.json({ message, requestId }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  const requestId = createRequestId();
  try {
    // Role-based authorization — only DOCTOR/ADMIN can update patients
    const auth = await authorizeRole();
    if (auth.error) return auth.error;

    // Rate limit — protect write endpoint from abuse
    const rateLimited = checkRateLimit(auth.session.user.id);
    if (rateLimited) return rateLimited;

    const body = await request.json();

    // Zod validation — reject malformed data before hitting Prisma
    const parsed = updatePatientSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { message: "Validation failed", errors: parsed.error.flatten().fieldErrors, requestId },
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

    // Build update data — only include provided fields
    const updateData: Record<string, unknown> = {};
    if (updateFields.name !== undefined) updateData.name = updateFields.name;
    if (updateFields.age !== undefined) updateData.age = updateFields.age;
    if (updateFields.dateOfBirth !== undefined) updateData.dateOfBirth = new Date(updateFields.dateOfBirth);
    if (updateFields.ethnicity !== undefined) updateData.ethnicity = updateFields.ethnicity;
    if (updateFields.religion !== undefined) updateData.religion = updateFields.religion;
    if (updateFields.nid !== undefined) updateData.nid = updateFields.nid || null;
    if (updateFields.patientId !== undefined) updateData.patientId = updateFields.patientId?.trim() || null;
    if (updateFields.mobile !== undefined) updateData.mobile = updateFields.mobile;
    if (updateFields.spouseMobile !== undefined) updateData.spouseMobile = updateFields.spouseMobile || null;
    if (updateFields.relativeMobile !== undefined) updateData.relativeMobile = updateFields.relativeMobile || null;
    if (updateFields.district !== undefined) updateData.district = updateFields.district || "";
    if (updateFields.address !== undefined) updateData.address = updateFields.address || "";
    if (updateFields.shortHistory !== undefined) updateData.shortHistory = updateFields.shortHistory || null;
    if (updateFields.surgicalHistory !== undefined) updateData.surgicalHistory = updateFields.surgicalHistory || null;
    if (updateFields.familyHistory !== undefined) updateData.familyHistory = updateFields.familyHistory || null;
    if (updateFields.pastIllness !== undefined) updateData.pastIllness = updateFields.pastIllness || null;
    if (updateFields.tags !== undefined) updateData.tags = updateFields.tags || [];
    if (updateFields.specialNotes !== undefined) updateData.specialNotes = updateFields.specialNotes || null;
    if (updateFields.finalDiagnosis !== undefined) updateData.finalDiagnosis = updateFields.finalDiagnosis || null;

    const patient = await prisma.patient.update({
      where: { id },
      data: updateData,
    });

    // Audit: patient updated
    auditLog(requestId, auth.session.user.id, "UPDATE_PATIENT", "Patient", id);

    return NextResponse.json({ success: true, patient }, { status: 200 });
  } catch (error: unknown) {
    console.error(JSON.stringify({ level: "ERROR", requestId, route: "PUT /api/patients", error: error instanceof Error ? error.message : String(error) }));
    if (error && typeof error === "object" && "code" in error) {
      const prismaError = error as { code: string };
      if (prismaError.code === "P2025") {
        return NextResponse.json(
          { message: "Patient not found", requestId },
          { status: 404 },
        );
      }
      if (prismaError.code === "P2002") {
        return NextResponse.json(
          { message: "Patient ID already exists. Please use a different one.", requestId },
          { status: 409 },
        );
      }
    }
    const message =
      error instanceof Error ? error.message : "Failed to update patient";
    return NextResponse.json({ message, requestId }, { status: 500 });
  }
}
