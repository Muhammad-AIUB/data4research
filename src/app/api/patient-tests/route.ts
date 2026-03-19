import { Prisma } from "@prisma/client";
import * as Sentry from "@sentry/nextjs";
import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { authorizeRole } from "@/lib/authorizeRole";
import { logAudit, extractRequestMeta } from "@/lib/auditLog";
import { checkRateLimit } from "@/lib/rateLimit";
import { scopePatientAccess, scopePatientTestAccess } from "@/lib/rbac";
import { createRequestId } from "@/lib/requestId";
import { createPatientTestSchema } from "@/lib/validations";

async function findAccessiblePatient(patientId: string, userId: Parameters<typeof scopePatientAccess>[0]) {
  const isUUID =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      patientId,
    );

  return prisma.patient.findFirst({
    where: scopePatientAccess(
      userId,
      isUUID ? { id: patientId } : { patientId },
    ),
    select: { id: true },
  });
}

export async function GET(request: Request) {
  const requestId = createRequestId();

  try {
    const auth = await authorizeRole();
    if (auth.error) return auth.error;

    const user = auth.session.user;
    const { searchParams } = new URL(request.url);
    const patientId = searchParams.get("patientId");
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(
      100,
      Math.max(1, parseInt(searchParams.get("limit") || "50", 10)),
    );
    const offset = (page - 1) * limit;
    let whereClause = scopePatientTestAccess(user);

    if (patientId?.trim()) {
      const patient = await findAccessiblePatient(patientId.trim(), user);

      if (!patient) {
        return NextResponse.json(
          { tests: [], hasMore: false, page, limit },
          {
            status: 200,
            headers: {
              "Cache-Control":
                "private, s-maxage=60, stale-while-revalidate=120",
            },
          },
        );
      }

      whereClause = scopePatientTestAccess(user, { patientId: patient.id });
    }

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
      orderBy: [{ createdAt: "desc" }, { sampleDate: "desc" }],
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
    Sentry.captureException(error, {
      tags: { requestId, route: "GET /api/patient-tests" },
    });
    console.error(
      JSON.stringify({
        level: "ERROR",
        requestId,
        route: "GET /api/patient-tests",
        error: error instanceof Error ? error.message : String(error),
      }),
    );

    return NextResponse.json(
      {
        message:
          error instanceof Error
            ? error.message
            : "Failed to fetch patient test data",
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

    const body = await request.json();
    const parsed = createPatientTestSchema.safeParse(body);

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

    const { patientId, sampleDate, ...testData } = parsed.data;
    let patient = null;

    if (patientId?.trim()) {
      patient = await findAccessiblePatient(patientId.trim(), user);

      if (!patient) {
        return NextResponse.json(
          { message: "Patient not found", requestId },
          { status: 404 },
        );
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

    const reportDate = sampleDate || new Date().toISOString();
    let localDate: Date;
    if (typeof reportDate === "string" && /^\d{4}-\d{2}-\d{2}$/.test(reportDate)) {
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

    const { ipAddress, userAgent } = extractRequestMeta(request);
    logAudit({
      userId: user.id,
      action: "CREATE_PATIENT_TEST",
      resource: "PatientTest",
      resourceId: savedTest.id,
      after: { patientId: savedTest.patientId, sampleDate: savedTest.sampleDate },
      ipAddress,
      userAgent,
    });

    return NextResponse.json(
      {
        success: true,
        message: "Test data saved successfully",
        test: savedTest,
      },
      { status: 201 },
    );
  } catch (error: unknown) {
    Sentry.captureException(error, {
      tags: { requestId, route: "POST /api/patient-tests" },
    });
    console.error(
      JSON.stringify({
        level: "ERROR",
        requestId,
        route: "POST /api/patient-tests",
        error: error instanceof Error ? error.message : String(error),
      }),
    );

    return NextResponse.json(
      {
        message:
          error instanceof Error
            ? error.message
            : "Failed to save patient test data",
        requestId,
      },
      { status: 500 },
    );
  }
}
