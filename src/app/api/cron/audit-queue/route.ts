/**
 * Drains Redis audit queue into Postgres. Only needed when AUDIT_REDIS_QUEUE=1.
 * Vercel Cron is optional; a free external scheduler (e.g. cron-job.org) can GET this URL with Bearer CRON_SECRET.
 */
import { NextResponse } from "next/server";

import { flushAuditQueue } from "@/lib/auditLog";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) {
    return NextResponse.json(
      { message: "CRON_SECRET is not configured" },
      { status: 503 },
    );
  }

  const auth = request.headers.get("authorization");
  if (auth !== `Bearer ${secret}`) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const result = await flushAuditQueue(200);
  return NextResponse.json({ ok: true, ...result });
}
