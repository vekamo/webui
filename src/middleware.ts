import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// These paths require a token
const PROTECTED_PATHS = ["/miners", "/rigs", "/payout"];

export function middleware(request: NextRequest) {

  // Grab info from the NextRequest
  const url = request.nextUrl;
  const { pathname, search } = url;

  // 1) Check if the requested path is protected
  const isProtected = PROTECTED_PATHS.some((protectedPath) =>
    pathname.startsWith(protectedPath)
  );
  if (!isProtected) {
    // Not a protected route => allow
    return NextResponse.next();
  }

  // 2) Get the token from cookies
  const token = request.cookies.get("token")?.value;
  // 3) If no token => redirect to /login?next=<original-path>
  if (!token) {
    const fromPath = pathname + search; // e.g. "/miners" or "/payout?foo=bar"
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", fromPath);
    return NextResponse.redirect(loginUrl);
  }

  // 4) Otherwise => user has a token; allow the request
  return NextResponse.next();
}

// Only match these routes
export const config = {
  matcher: ["/miners/:path*", "/rigs/:path*", "/payout/:path*"],
};
