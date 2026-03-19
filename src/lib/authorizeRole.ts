// ====================================================
// TASK 2 — Reusable role-based authorization helper
// ====================================================
// Centralizes auth + role check for API route handlers.
// Returns the authenticated session or a NextResponse error.

import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";
import type { Session } from "next-auth";
import type { AppRole } from "@/lib/rbac";

const DEFAULT_ALLOWED_ROLES: readonly AppRole[] = ["DOCTOR", "ADMIN"];

/**
 * Authenticate the user and verify they have an allowed role.
 * Returns the session on success, or a NextResponse error to return immediately.
 */
export async function authorizeRole(
  allowedRoles: readonly AppRole[] = DEFAULT_ALLOWED_ROLES,
): Promise<
  { session: Session; error?: never } | { session?: never; error: NextResponse }
> {
  const session = (await getServerSession(authOptions)) as Session | null;

  if (!session?.user) {
    return {
      error: NextResponse.json({ message: "Unauthorized" }, { status: 401 }),
    };
  }

  if (!allowedRoles.includes(session.user.role)) {
    return {
      error: NextResponse.json(
        { message: "Forbidden: insufficient permissions" },
        { status: 403 },
      ),
    };
  }

  return { session };
}
