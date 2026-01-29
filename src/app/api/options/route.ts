import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
export async function GET() {
  try {
    const [religions, ethnicities, districts] = await Promise.all([
      prisma.option.findMany({
        where: { category: "religion" },
        select: {
          id: true,
          label: true,
          value: true,
          order: true,
        },
        orderBy: { order: "asc" },
      }),
      prisma.option.findMany({
        where: { category: "ethnicity" },
        select: {
          id: true,
          label: true,
          value: true,
          order: true,
        },
        orderBy: { order: "asc" },
      }),
      prisma.option.findMany({
        where: { category: "district" },
        select: {
          id: true,
          label: true,
          value: true,
          order: true,
        },
        orderBy: { order: "asc" },
      }),
    ]);
    return NextResponse.json(
      { religions, ethnicities, districts },
      {
        headers: {
          "Cache-Control":
            "public, s-maxage=3600, stale-while-revalidate=86400",
        },
      },
    );
  } catch (error: unknown) {
    console.error("Error fetching options:", error);
    const message =
      error instanceof Error ? error.message : "Failed to fetch options";
    return NextResponse.json({ message }, { status: 500 });
  }
}
