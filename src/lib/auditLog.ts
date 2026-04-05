import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

import { getRedis } from "@/lib/redis";

const SENSITIVE_FIELDS = new Set(["password", "nid"]);
const AUDIT_QUEUE_KEY = "d4r:audit:queue";
const AUDIT_QUEUE_MAX = 5000;

/** Off by default: Redis queue needs a periodic flush (e.g. external free cron). Without it, logs stay direct DB. */
function auditRedisQueueEnabled(): boolean {
  const v = process.env.AUDIT_REDIS_QUEUE?.trim().toLowerCase();
  return v === "1" || v === "true" || v === "yes";
}

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
  if (!before || !after)
    return { before: stripSensitive(before), after: stripSensitive(after) };

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

function persistAuditDirect(params: LogAuditParams): void {
  const cleanBefore = stripSensitive(params.before ?? null);
  const cleanAfter = stripSensitive(params.after ?? null);
  prisma.auditLog
    .create({
      data: {
        userId: params.userId,
        action: params.action,
        resource: params.resource,
        resourceId: params.resourceId,
        before:
          cleanBefore !== null ? (cleanBefore as Prisma.InputJsonValue) : undefined,
        after:
          cleanAfter !== null ? (cleanAfter as Prisma.InputJsonValue) : undefined,
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

/**
 * By default writes directly to Postgres. Set AUDIT_REDIS_QUEUE=1 to push to Redis; then call
 * /api/cron/audit-queue on a schedule (external free cron, etc.) or logs never reach the DB.
 */
export function logAudit(params: LogAuditParams): void {
  const cleanBefore = stripSensitive(params.before ?? null);
  const cleanAfter = stripSensitive(params.after ?? null);

  const entry = {
    level: "AUDIT",
    timestamp: new Date().toISOString(),
    userId: params.userId,
    action: params.action,
    resource: params.resource,
    resourceId: params.resourceId,
  };
  console.log(JSON.stringify(entry));

  const r = getRedis();
  if (r && auditRedisQueueEnabled()) {
    const payload = JSON.stringify({
      userId: params.userId,
      action: params.action,
      resource: params.resource,
      resourceId: params.resourceId,
      before: cleanBefore,
      after: cleanAfter,
      ipAddress: params.ipAddress ?? null,
      userAgent: params.userAgent ?? null,
    });
    void r
      .lpush(AUDIT_QUEUE_KEY, payload)
      .then(() => r.ltrim(AUDIT_QUEUE_KEY, 0, AUDIT_QUEUE_MAX - 1))
      .catch(() => {
        persistAuditDirect(params);
      });
    return;
  }

  persistAuditDirect(params);
}

type QueuedAuditRow = {
  userId: string;
  action: string;
  resource: string;
  resourceId: string;
  before: Record<string, unknown> | null;
  after: Record<string, unknown> | null;
  ipAddress: string | null;
  userAgent: string | null;
};

/** Drain up to `maxItems` audit rows from Redis into Postgres (cron / internal). */
export async function flushAuditQueue(maxItems: number): Promise<{
  processed: number;
  errors: number;
}> {
  const r = getRedis();
  if (!r) return { processed: 0, errors: 0 };

  const batch: QueuedAuditRow[] = [];
  try {
    for (let i = 0; i < maxItems; i++) {
      const raw = await r.rpop(AUDIT_QUEUE_KEY);
      if (!raw) break;
      try {
        batch.push(JSON.parse(raw) as QueuedAuditRow);
      } catch {
        /* skip malformed */
      }
    }
  } catch {
    return { processed: 0, errors: 1 };
  }

  if (batch.length === 0) return { processed: 0, errors: 0 };

  let errors = 0;
  try {
    await prisma.auditLog.createMany({
      data: batch.map((row) => ({
        userId: row.userId,
        action: row.action,
        resource: row.resource,
        resourceId: row.resourceId,
        before:
          row.before !== null ? (row.before as Prisma.InputJsonValue) : undefined,
        after:
          row.after !== null ? (row.after as Prisma.InputJsonValue) : undefined,
        ipAddress: row.ipAddress,
        userAgent: row.userAgent,
      })),
    });
  } catch {
    errors = 1;
    for (const row of batch) {
      try {
        await prisma.auditLog.create({
          data: {
            userId: row.userId,
            action: row.action,
            resource: row.resource,
            resourceId: row.resourceId,
            before:
              row.before !== null
                ? (row.before as Prisma.InputJsonValue)
                : undefined,
            after:
              row.after !== null
                ? (row.after as Prisma.InputJsonValue)
                : undefined,
            ipAddress: row.ipAddress,
            userAgent: row.userAgent,
          },
        });
      } catch {
        errors++;
      }
    }
  }

  return { processed: batch.length, errors };
}
