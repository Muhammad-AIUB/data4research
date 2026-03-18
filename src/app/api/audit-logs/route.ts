import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { authorizeRole } from "@/lib/authorizeRole";
import { createRequestId } from "@/lib/requestId";
import * as Sentry from "@sentry/nextjs";

export async function GET(request: Request) {
  const requestId = createRequestId();
  try {
    const auth = await authorizeRole();
    if (auth.error) return auth.error;

    // Only ADMIN can view audit logs
    if (auth.session.user.role !== "ADMIN") {
      return NextResponse.json(
        { message: "Forbidden: Admin access required", requestId },
        { status: 403 },
      );
    }

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20")));
    const offset = (page - 1) * limit;
    const resource = searchParams.get("resource");
    const action = searchParams.get("action");

    const where: Record<string, unknown> = {};
    if (resource) where.resource = resource;
    if (action) where.action = action;

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: offset,
        take: limit,
      }),
      prisma.auditLog.count({ where }),
    ]);

    // Batch-fetch user info for all unique userIds in this page
    const userIds = [...new Set(logs.map((l) => l.userId))];
    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, name: true, email: true },
    });
    const userMap = new Map(users.map((u) => [u.id, u]));

    const data = logs.map((log) => {
      const user = userMap.get(log.userId);
      return {
        ...log,
        userName: user?.name || user?.email || "Unknown",
      };
    });

    return NextResponse.json(
      { data, pagination: { page, limit, total } },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error: unknown) {
    Sentry.captureException(error, { tags: { requestId, route: "GET /api/audit-logs" } });
    console.error(
      JSON.stringify({
        level: "ERROR",
        requestId,
        route: "GET /api/audit-logs",
        error: error instanceof Error ? error.message : String(error),
      }),
    );
    return NextResponse.json(
      { message: "Failed to fetch audit logs", requestId },
      { status: 500 },
    );
  }
}
