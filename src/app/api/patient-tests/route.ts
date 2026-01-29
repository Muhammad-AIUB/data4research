import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";
import type { Session } from "next-auth";

export async function GET(request: Request) {
  try {
    // @ts-expect-error - getServerSession type inference issue
    const session = (await getServerSession(authOptions)) as Session | null;

    if (!session || !session.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const patientId = searchParams.get("patientId");

    // Build where clause - if patientId provided, filter by it, otherwise get all
    let whereClause: Record<string, unknown> = {};
    if (patientId && patientId.trim() !== "") {
      const patient = await prisma.patient.findUnique({
        where: { patientId },
      });

      if (patient) {
        whereClause.patientId = patient.id;
      } else {
        // If patientId provided but not found, return empty
        return NextResponse.json({ tests: [] }, { status: 200 });
      }
    } else {
      // If no patientId, get all tests (including those without patientId)
      // This allows showing tests saved without patient ID
      whereClause = {};
    }

    // Fetch all tests (filtered by patientId if provided, or all if not)
    // Sort by createdAt (latest first) to ensure newest saves appear first
    const tests = await prisma.patientTest.findMany({
      where: whereClause,
      orderBy: [
        { createdAt: "desc" }, // Latest saves first
        { sampleDate: "desc" }, // Then by sample date
      ],
    });

    console.log(
      `Fetched ${tests.length} tests for patientId: ${patientId || "all"}`,
    );

    return NextResponse.json({ tests }, { status: 200 });
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
    // @ts-expect-error - getServerSession type inference issue
    const session = (await getServerSession(authOptions)) as Session | null;

    if (!session || !session.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { patientId, sampleDate, ...testData } = body;

    // Patient ID is optional - if provided, link to patient, otherwise save without link
    let patient = null;
    if (patientId && patientId.trim() !== "") {
      patient = await prisma.patient.findUnique({
        where: { patientId },
      });

      // If patientId provided but not found, still allow saving (don't block)
      // Just won't link to patient
    }

    // Parse the test data - each section has { data, date } structure
    const parsedTestData: Record<string, unknown> = {};

    // Extract data from each test section
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

    // Use sampleDate from testData or body, default to now
    const reportDate =
      testData.sampleDate || sampleDate || new Date().toISOString();

    // Fix timezone issue - parse date string (YYYY-MM-DD format) and create local date at midnight
    let localDate: Date;
    if (typeof reportDate === "string") {
      // Check if it's YYYY-MM-DD format (from modals) or ISO string
      if (/^\d{4}-\d{2}-\d{2}$/.test(reportDate)) {
        // YYYY-MM-DD format - parse directly to avoid timezone issues
        const [year, month, day] = reportDate.split("-").map(Number);
        localDate = new Date(year, month - 1, day);
      } else {
        // ISO string - parse and use local components
        const dateObj = new Date(reportDate);
        localDate = new Date(
          dateObj.getFullYear(),
          dateObj.getMonth(),
          dateObj.getDate(),
        );
      }
    } else {
      // If it's already a Date object, use local components
      const dateObj = new Date(reportDate);
      localDate = new Date(
        dateObj.getFullYear(),
        dateObj.getMonth(),
        dateObj.getDate(),
      );
    }

    // Store test data in database
    const savedTest = await prisma.patientTest.create({
      data: {
        patientId: patient?.id || null, // Use null if no patient (optional field)
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
