import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";
import type { Session } from "next-auth";

export async function GET(request: Request) {
  try {
    // @ts-expect-error
    const session = (await getServerSession(authOptions)) as Session | null;
    if (!session || !session.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    const { searchParams } = new URL(request.url);
    const patientId = searchParams.get("patientId");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = (page - 1) * limit;
    let whereClause: Record<string, unknown> = {};
    let patientDbId: string | null = null;
    if (patientId && patientId.trim() !== "") {
      const patient = await prisma.patient.findUnique({
        where: { patientId },
        select: { id: true },
      });
      if (patient) {
        patientDbId = patient.id;
        whereClause.patientId = patient.id;
      } else {
        return NextResponse.json(
          { tests: [], total: 0, page, limit },
          {
            status: 200,
            headers: {
              "Cache-Control": "private, s-maxage=60, stale-while-revalidate=120",
            },
          },
        );
      }
    }
    const [tests, total] = await Promise.all([
      prisma.patientTest.findMany({
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
        take: limit,
      }),
      prisma.patientTest.count({ where: whereClause }),
    ]);
    return NextResponse.json(
      { tests, total, page, limit },
      {
        status: 200,
        headers: {
          "Cache-Control": "private, s-maxage=60, stale-while-revalidate=120",
        },
      },
    );
  } catch (error: unknown) {
    console.error("Error fetching patient test data:", error);
    const message =
      error instanceof Error
        ? error.message
        : "Failed to fetch patient test data";
    return NextResponse.json({ message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    // @ts-expect-error
    const session = (await getServerSession(authOptions)) as Session | null;
    if (!session || !session.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    const body = await request.json();
    const { patientId, sampleDate, ...testData } = body;
    let patient = null;
    if (patientId && patientId.trim() !== "") {
      patient = await prisma.patient.findUnique({
        where: { patientId },
        select: { id: true },
      });
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
      testData.sampleDate || sampleDate || new Date().toISOString();
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
    const savedTest = await prisma.patientTest.create({
      data: {
        patientId: patient?.id || null,
        sampleDate: localDate,
        autoimmunoProfile: parsedTestData.autoimmunoProfile || null,
        cardiology: parsedTestData.cardiology || null,
        rft: parsedTestData.rft || null,
        lft: parsedTestData.lft || null,
        diseaseHistory: parsedTestData.diseaseHistory || null,
        imaging: parsedTestData.imaging || null,
        hematology: parsedTestData.hematology || null,
        basdai: parsedTestData.basdai || null,
      },
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
    console.error("Error saving patient test data:", error);
    const message =
      error instanceof Error
        ? error.message
        : "Failed to save patient test data";
    return NextResponse.json({ message }, { status: 500 });
  }
}
