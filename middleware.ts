import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const ADMIN_ONLY_PREFIXES = ["/dashboard/audit-logs", "/api/audit-logs"];
const AUTH_REQUIRED_PREFIXES = [
  "/dashboard",
  "/api/patients",
  "/api/patient-tests",
  "/api/audit-logs",
  "/api/options",
];

function isApiRoute(pathname: string) {
  return pathname.startsWith("/api/");
}

function isProtectedPath(pathname: string) {
  return AUTH_REQUIRED_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

function isAdminOnlyPath(pathname: string) {
  return ADMIN_ONLY_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (!isProtectedPath(pathname)) {
    return NextResponse.next();
  }

  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  if (!token?.sub) {
    if (isApiRoute(pathname)) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/";
    return NextResponse.redirect(loginUrl);
  }

  if (isAdminOnlyPath(pathname) && token.role !== "ADMIN") {
    if (isApiRoute(pathname)) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const dashboardUrl = request.nextUrl.clone();
    dashboardUrl.pathname = "/dashboard";
    return NextResponse.redirect(dashboardUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/api/patients/:path*", "/api/patient-tests/:path*", "/api/audit-logs/:path*", "/api/options/:path*"],
};
