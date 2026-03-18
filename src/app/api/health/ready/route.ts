import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

const DB_TIMEOUT_MS = 2000;

// Readiness probe — verifies the app can serve traffic (DB reachable)
export async function GET() {
  const timestamp = new Date().toISOString();
  const uptime = process.uptime();
  const mem = process.memoryUsage();
  const headers = { "Cache-Control": "no-store" };

  // Memory stats in MB, rounded to 2 decimals
  const memory = {
    rss: Math.round((mem.rss / 1024 / 1024) * 100) / 100,
    heapUsed: Math.round((mem.heapUsed / 1024 / 1024) * 100) / 100,
  };

  try {
    const start = performance.now();

    // Race the DB query against a 2s timeout
    await Promise.race([
      prisma.$queryRaw`SELECT 1`,
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error("DB_TIMEOUT")), DB_TIMEOUT_MS),
      ),
    ]);

    const responseTimeMs = Math.round(performance.now() - start);

    return NextResponse.json(
      {
        status: "ok",
        timestamp,
        uptime,
        memory,
        services: {
          database: { status: "connected", responseTimeMs },
        },
      },
      { headers },
    );
  } catch (error) {
    const isTimeout =
      error instanceof Error && error.message === "DB_TIMEOUT";

    return NextResponse.json(
      {
        status: isTimeout ? "degraded" : "error",
        timestamp,
        uptime,
        memory,
        services: {
          database: {
            status: "disconnected",
            responseTimeMs: isTimeout ? DB_TIMEOUT_MS : -1,
          },
        },
      },
      { status: 503, headers },
    );
  }
}
