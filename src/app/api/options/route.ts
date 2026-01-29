import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const religions = await prisma.option.findMany({
      where: { category: "religion" },
      orderBy: { order: "asc" },
    });

    const ethnicities = await prisma.option.findMany({
      where: { category: "ethnicity" },
      orderBy: { order: "asc" },
    });

    const districts = await prisma.option.findMany({
      where: { category: "district" },
      orderBy: { order: "asc" },
    });

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
