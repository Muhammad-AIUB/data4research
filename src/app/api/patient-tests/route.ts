import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";
import type { Session } from "next-auth";
import { Prisma } from "@prisma/client";
import { authorizeRole } from "@/lib/authorizeRole";
import { createPatientTestSchema } from "@/lib/validations";
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
    const patientId = searchParams.get("patientId");
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "50")));
    const offset = (page - 1) * limit;
    const whereClause: Record<string, unknown> = {};
    if (patientId && patientId.trim() !== "") {
      // Try finding by user-assigned patientId first
      let patient = await prisma.patient.findUnique({
        where: { patientId },
        select: { id: true },
      });
      // If not found, try finding by UUID (id)
      if (!patient) {
        patient = await prisma.patient.findUnique({
          where: { id: patientId },
          select: { id: true },
        });
      }
      if (patient) {
        whereClause.patientId = patient.id;
      } else {
        return NextResponse.json(
          { tests: [], hasMore: false, page, limit },
          {
            status: 200,
            headers: {
              "Cache-Control": "private, s-maxage=60, stale-while-revalidate=120",
            },
          },
        );
      }
    }
    // hasMore strategy: fetch limit+1 to detect next page without COUNT scan
    const rows = await prisma.patientTest.findMany({
        where: whereClause,
        select: {
          id: true,
          patientId: true,
          sampleDate: true,
          autoimmunoProfile: true,
          cardiology: true,
          rft: true,
          lft: true,
          diseaseHistory: true,
          imaging: true,
          hematology: true,
          basdai: true,
          createdAt: true,
          updatedAt: true,
        },
        orderBy: [
          { createdAt: "desc" },
          { sampleDate: "desc" },
        ],
        skip: offset,
        take: limit + 1,
      });

    const hasMore = rows.length > limit;
    const tests = hasMore ? rows.slice(0, limit) : rows;

    return NextResponse.json(
      { tests, hasMore, page, limit },
      {
        status: 200,
        headers: {
          "Cache-Control": "private, s-maxage=60, stale-while-revalidate=120",
        },
      },
    );
  } catch (error: unknown) {
    console.error(JSON.stringify({ level: "ERROR", requestId, route: "GET /api/patient-tests", error: error instanceof Error ? error.message : String(error) }));
    const message =
      error instanceof Error
        ? error.message
        : "Failed to fetch patient test data";
    return NextResponse.json({ message, requestId }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const requestId = createRequestId();
  try {
    // Role-based authorization — only DOCTOR/ADMIN can create tests
    const auth = await authorizeRole();
    if (auth.error) return auth.error;

    // Rate limit — protect write endpoint from abuse
    const rateLimited = checkRateLimit(auth.session.user.id);
    if (rateLimited) return rateLimited;

    const body = await request.json();

    // Zod validation — reject malformed data before hitting Prisma
    const parsed = createPatientTestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { message: "Validation failed", errors: parsed.error.flatten().fieldErrors, requestId },
        { status: 400 },
      );
    }
    const { patientId, sampleDate, ...testData } = parsed.data;
    let patient = null;
    if (patientId && patientId.trim() !== "") {
      // Try finding by user-assigned patientId first
      patient = await prisma.patient.findUnique({
        where: { patientId },
        select: { id: true },
      });
      // If not found, try finding by UUID (id) — handles case when patient has no user-assigned ID
      if (!patient) {
        patient = await prisma.patient.findUnique({
          where: { id: patientId },
          select: { id: true },
        });
      }
    }
    const parsedTestData: Record<string, unknown> = {};
    if (testData.autoimmunoProfile) {
      parsedTestData.autoimmunoProfile =
        testData.autoimmunoProfile.data || testData.autoimmunoProfile;
    }
    if (testData.cardiology) {
      parsedTestData.cardiology =
        testData.cardiology.data || testData.cardiology;
    }
    if (testData.rft) {
      parsedTestData.rft = testData.rft.data || testData.rft;
    }
    if (testData.lft) {
      parsedTestData.lft = testData.lft.data || testData.lft;
    }
    if (testData.diseaseHistory) {
      parsedTestData.diseaseHistory =
        testData.diseaseHistory.data || testData.diseaseHistory;
    }
    if (testData.imaging) {
      parsedTestData.imaging = testData.imaging.data || testData.imaging;
    }
    if (testData.hematology) {
      parsedTestData.hematology =
        testData.hematology.data || testData.hematology;
    }
    if (testData.basdai) {
      parsedTestData.basdai = testData.basdai.data || testData.basdai;
    }

    const reportDate =
      sampleDate || new Date().toISOString();
    let localDate: Date;
    if (typeof reportDate === "string") {
      if (/^\d{4}-\d{2}-\d{2}$/.test(reportDate)) {
        const [year, month, day] = reportDate.split("-").map(Number);
        localDate = new Date(year, month - 1, day);
      } else {
        const dateObj = new Date(reportDate);
        localDate = new Date(
          dateObj.getFullYear(),
          dateObj.getMonth(),
          dateObj.getDate(),
        );
      }
    } else {
      const dateObj = new Date(reportDate);
      localDate = new Date(
        dateObj.getFullYear(),
        dateObj.getMonth(),
        dateObj.getDate(),
      );
    }
    const jsonNull = Prisma.JsonNull;
    const savedTest = await prisma.patientTest.create({
      data: {
        patientId: patient?.id || null,
        sampleDate: localDate,
        autoimmunoProfile: parsedTestData.autoimmunoProfile || jsonNull,
        cardiology: parsedTestData.cardiology || jsonNull,
        rft: parsedTestData.rft || jsonNull,
        lft: parsedTestData.lft || jsonNull,
        diseaseHistory: parsedTestData.diseaseHistory || jsonNull,
        imaging: parsedTestData.imaging || jsonNull,
        hematology: parsedTestData.hematology || jsonNull,
        basdai: parsedTestData.basdai || jsonNull,
      },
    });

    // Audit: test created
    auditLog(requestId, auth.session.user.id, "CREATE_PATIENT_TEST", "PatientTest", savedTest.id);

    return NextResponse.json(
      {
        success: true,
        message: "Test data saved successfully",
        test: savedTest,
      },
      { status: 201 },
    );
  } catch (error: unknown) {
    console.error(JSON.stringify({ level: "ERROR", requestId, route: "POST /api/patient-tests", error: error instanceof Error ? error.message : String(error) }));
    const message =
      error instanceof Error
        ? error.message
        : "Failed to save patient test data";
    return NextResponse.json({ message, requestId }, { status: 500 });
  }
}
