import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE_NAME, verifySessionToken } from "@/lib/auth";

const PROTECTED_PAGE_PREFIXES = ["/daily", "/statistics", "/comments", "/improvements"];
const PUBLIC_API_PREFIXES = ["/api/auth/login"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const session = token ? await verifySessionToken(token) : null;

  // Root path: redirect based on auth status.
  if (pathname === "/") {
    const target = session ? "/daily" : "/login";
    return NextResponse.redirect(new URL(target, request.url));
  }

  // Login page: redirect to /daily if already authenticated.
  if (pathname === "/login") {
    if (session) {
      return NextResponse.redirect(new URL("/daily", request.url));
    }
    return NextResponse.next();
  }

  // Protected pages.
  if (PROTECTED_PAGE_PREFIXES.some((prefix) => pathname.startsWith(prefix))) {
    if (!session) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
    return NextResponse.next();
  }

  // Protected API routes (everything under /api except the public ones).
  if (pathname.startsWith("/api")) {
    if (PUBLIC_API_PREFIXES.some((prefix) => pathname.startsWith(prefix))) {
      return NextResponse.next();
    }
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/",
    "/login",
    "/daily/:path*",
    "/statistics/:path*",
    "/comments/:path*",
    "/improvements/:path*",
    "/api/:path*",
  ],
};
