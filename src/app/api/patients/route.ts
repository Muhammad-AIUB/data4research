import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";
import type { Session } from "next-auth";

export async function GET(request: Request) {
  try {
    // @ts-expect-error - authOptions type mismatch with next-auth overloads
    const session = (await getServerSession(authOptions)) as Session | null;
    if (!session || !session.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    const { searchParams } = new URL(request.url);
    const singleId = searchParams.get("id");

    // Single patient fetch by id
    if (singleId) {
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(singleId);
      const whereClause = isUUID ? { id: singleId } : { patientId: singleId };
      const patient = await prisma.patient.findUnique({
        where: whereClause,
      });
      if (!patient) {
        return NextResponse.json({ message: "Patient not found" }, { status: 404 });
      }
      return NextResponse.json({ patient }, { status: 200 });
    }

    const searchQuery = searchParams.get("search");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = (page - 1) * limit;
    let whereClause: Record<string, unknown> = {};
    if (searchQuery && searchQuery.trim() !== "") {
      const searchTerm = searchQuery.trim();
      whereClause = {
        OR: [
          { name: { contains: searchTerm, mode: "insensitive" } },
          { mobile: { contains: searchTerm, mode: "insensitive" } },
          { patientId: { contains: searchTerm, mode: "insensitive" } },
          { finalDiagnosis: { contains: searchTerm, mode: "insensitive" } },
          { tags: { has: searchTerm } },
          { relativeMobile: { contains: searchTerm, mode: "insensitive" } },
          { spouseMobile: { contains: searchTerm, mode: "insensitive" } },
        ],
      };
    }
    const [patients, total] = await Promise.all([
      prisma.patient.findMany({
        where: whereClause,
        select: {
          id: true,
          name: true,
          age: true,
          mobile: true,
          patientId: true,
          finalDiagnosis: true,
          tags: true,
          createdAt: true,
        },
        orderBy: {
          createdAt: "desc",
        },
        skip: offset,
        take: limit,
      }),
      prisma.patient.count({ where: whereClause }),
    ]);
    return NextResponse.json(
      { patients, total, page, limit },
      {
        status: 200,
        headers: {
          "Cache-Control": "private, s-maxage=60, stale-while-revalidate=120",
        },
      },
    );
  } catch (error: unknown) {
    console.error("Error fetching patients:", error);
    const message =
      error instanceof Error ? error.message : "Failed to fetch patients";
    return NextResponse.json({ message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    // @ts-expect-error - authOptions type mismatch with next-auth overloads
    const session = (await getServerSession(authOptions)) as Session | null;
    if (!session || !session.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
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
        { message: "User account not found. Please log in again." },
        { status: 401 },
      );
    }

    const body = await request.json();
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
    } = body;
    // Allow age 0 — check for undefined/null instead of falsy value
    if (!name || typeof age === 'undefined' || age === null || !mobile || !relativeMobile) {
      return NextResponse.json(
        {
          message:
            "Missing required fields: Name, Age, Mobile, and Relative Mobile are required",
        },
        { status: 400 },
      );
    }
    const ageNum = parseInt(age);
    if (isNaN(ageNum) || ageNum < 0 || ageNum > 120) {
      return NextResponse.json(
        { message: "Age must be a valid number between 0 and 120" },
        { status: 400 },
      );
    }
    const patientData = {
      name,
      dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : new Date(),
      age: ageNum,
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

    return NextResponse.json({ success: true, patient }, { status: 201 });
  } catch (error: unknown) {
    console.error("Error creating patient:", error);
    if (error && typeof error === "object") {
      console.error("Error details:", JSON.stringify(error, null, 2));
      if ("code" in error) {
        console.error("Prisma error code:", error.code);
      }
      if ("meta" in error) {
        console.error("Prisma error meta:", error.meta);
      }
    }
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
          },
          { status: 409 },
        );
      }
      if (prismaError.code === "P2003") {
        return NextResponse.json(
          {
            message: "User account not found. Please log out and log in again.",
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
    const errorResponse: { message: string; error?: string } = { message };
    if (process.env.NODE_ENV === "development") {
      errorResponse.error =
        error instanceof Error ? error.stack : String(error);
    }
    return NextResponse.json(errorResponse, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    // @ts-expect-error - authOptions type mismatch with next-auth overloads
    const session = (await getServerSession(authOptions)) as Session | null;
    if (!session || !session.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { message: "Patient ID is required" },
        { status: 400 },
      );
    }

    // Delete related test reports first (cascade should handle it, but be explicit)
    await prisma.patientTest.deleteMany({
      where: { patientId: id },
    });

    await prisma.patient.delete({
      where: { id },
    });

    return NextResponse.json(
      { success: true, message: "Patient deleted successfully" },
      { status: 200 },
    );
  } catch (error: unknown) {
    console.error("Error deleting patient:", error);
    if (error && typeof error === "object" && "code" in error) {
      const prismaError = error as { code: string };
      if (prismaError.code === "P2025") {
        return NextResponse.json(
          { message: "Patient not found" },
          { status: 404 },
        );
      }
    }
    const message =
      error instanceof Error ? error.message : "Failed to delete patient";
    return NextResponse.json({ message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    // @ts-expect-error - authOptions type mismatch with next-auth overloads
    const session = (await getServerSession(authOptions)) as Session | null;
    if (!session || !session.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { id, ...updateFields } = body;

    if (!id) {
      return NextResponse.json(
        { message: "Patient ID is required" },
        { status: 400 },
      );
    }

    // Build update data — only include provided fields
    const updateData: Record<string, unknown> = {};
    if (updateFields.name !== undefined) updateData.name = updateFields.name;
    if (updateFields.age !== undefined) updateData.age = parseInt(updateFields.age);
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

    return NextResponse.json({ success: true, patient }, { status: 200 });
  } catch (error: unknown) {
    console.error("Error updating patient:", error);
    if (error && typeof error === "object" && "code" in error) {
      const prismaError = error as { code: string };
      if (prismaError.code === "P2025") {
        return NextResponse.json(
          { message: "Patient not found" },
          { status: 404 },
        );
      }
      if (prismaError.code === "P2002") {
        return NextResponse.json(
          { message: "Patient ID already exists. Please use a different one." },
          { status: 409 },
        );
      }
    }
    const message =
      error instanceof Error ? error.message : "Failed to update patient";
    return NextResponse.json({ message }, { status: 500 });
  }
}
