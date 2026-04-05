import { prisma } from "@/lib/prisma";
import { getRedis } from "@/lib/redis";
import { NextResponse } from "next/server";

const OPTIONS_CACHE_KEY = "d4r:options:v1";
const OPTIONS_TTL_SEC = 3600;

export async function GET() {
  const r = getRedis();
  if (r) {
    try {
      const hit = await r.get(OPTIONS_CACHE_KEY);
      if (hit) {
        return new NextResponse(hit, {
          status: 200,
          headers: {
            "Content-Type": "application/json",
            "Cache-Control":
              "public, s-maxage=3600, stale-while-revalidate=86400",
            "X-Cache": "HIT",
          },
        });
      }
    } catch {
      /* fall through to DB */
    }
  }

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
    const body = JSON.stringify({ religions, ethnicities, districts });
    if (r) {
      try {
        await r.setex(OPTIONS_CACHE_KEY, OPTIONS_TTL_SEC, body);
      } catch {
        /* ignore */
      }
    }
    return new NextResponse(body, {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
        "X-Cache": "MISS",
      },
    });
  } catch (error: unknown) {
    console.error("Error fetching options:", error);
    const message =
      error instanceof Error ? error.message : "Failed to fetch options";
    return NextResponse.json({ message }, { status: 500 });
  }
}
