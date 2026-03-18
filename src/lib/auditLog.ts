import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

const SENSITIVE_FIELDS = new Set(["password", "nid"]);

function stripSensitive(
  obj: Record<string, unknown> | null | undefined,
): Record<string, unknown> | null {
  if (!obj) return null;
  const clean: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (!SENSITIVE_FIELDS.has(key)) {
      clean[key] = value;
    }
  }
  return clean;
}

/** Returns only keys that differ between before and after snapshots */
export function getChangedFields(
  before: Record<string, unknown> | null,
  after: Record<string, unknown> | null,
): { before: Record<string, unknown> | null; after: Record<string, unknown> | null } {
  if (!before || !after) return { before: stripSensitive(before), after: stripSensitive(after) };

  const changedBefore: Record<string, unknown> = {};
  const changedAfter: Record<string, unknown> = {};

  for (const key of Object.keys(after)) {
    if (SENSITIVE_FIELDS.has(key)) continue;
    const bVal = JSON.stringify(before[key] ?? null);
    const aVal = JSON.stringify(after[key] ?? null);
    if (bVal !== aVal) {
      changedBefore[key] = before[key] ?? null;
      changedAfter[key] = after[key] ?? null;
    }
  }

  return {
    before: Object.keys(changedBefore).length > 0 ? changedBefore : null,
    after: Object.keys(changedAfter).length > 0 ? changedAfter : null,
  };
}

/** Extract IP address and user agent from request headers */
export function extractRequestMeta(request: Request): {
  ipAddress: string | null;
  userAgent: string | null;
} {
  const forwarded = request.headers.get("x-forwarded-for");
  const ipAddress = forwarded ? forwarded.split(",")[0].trim() : null;
  const userAgent = request.headers.get("user-agent") || null;
  return { ipAddress, userAgent };
}

interface LogAuditParams {
  userId: string;
  action: string;
  resource: string;
  resourceId: string;
  before?: Record<string, unknown> | null;
  after?: Record<string, unknown> | null;
  ipAddress?: string | null;
  userAgent?: string | null;
}

/**
 * Persist an audit log entry to the database.
 * Fire-and-forget: errors are logged but never thrown,
 * so the calling API operation is never blocked.
 */
export function logAudit(params: LogAuditParams): void {
  const cleanBefore = stripSensitive(params.before ?? null);
  const cleanAfter = stripSensitive(params.after ?? null);

  // Structured stdout for redundancy / log aggregation
  const entry = {
    level: "AUDIT",
    timestamp: new Date().toISOString(),
    userId: params.userId,
    action: params.action,
    resource: params.resource,
    resourceId: params.resourceId,
  };
  console.log(JSON.stringify(entry));

  // Persist to database — fire and forget
  prisma.auditLog
    .create({
      data: {
        userId: params.userId,
        action: params.action,
        resource: params.resource,
        resourceId: params.resourceId,
        before: cleanBefore !== null ? (cleanBefore as Prisma.InputJsonValue) : undefined,
        after: cleanAfter !== null ? (cleanAfter as Prisma.InputJsonValue) : undefined,
        ipAddress: params.ipAddress ?? null,
        userAgent: params.userAgent ?? null,
      },
    })
    .catch((err) => {
      console.error(
        JSON.stringify({
          level: "ERROR",
          message: "Failed to persist audit log",
          error: err instanceof Error ? err.message : String(err),
        }),
      );
    });
}
