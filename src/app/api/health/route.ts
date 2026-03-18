import { NextResponse } from "next/server";

// Liveness probe — confirms the process is running, no I/O
export async function GET() {
  return NextResponse.json(
    {
      status: "ok",
      timestamp: new Date().toISOString(),
    },
    {
      headers: { "Cache-Control": "no-store" },
    },
  );
}
