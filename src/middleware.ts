import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Paths that require a token to access
const PROTECTED_PATHS = ["/miners", "/rigs", "/payout"];

export function middleware(request: NextRequest) {
  const url = request.nextUrl;
  const { pathname, search } = url;

  // 1) If the path is NOT in PROTECTED_PATHS => allow
  const isProtected = PROTECTED_PATHS.some((protectedPath) =>
    pathname.startsWith(protectedPath)
  );
  if (!isProtected) {
    return NextResponse.next();
  }

  // 2) Check for 'token' cookie
  const token = request.cookies.get("token")?.value;

  // 3) If no token => redirect to /login with "?next=/requested-path"
  if (!token) {
    // Combine pathname + any existing query string:
    const fromPath = pathname + search;

    // Build the login URL on the same origin
    const loginUrl = new URL("/login", url.origin);
    loginUrl.searchParams.set("next", fromPath);

    return NextResponse.redirect(loginUrl);
  }

  // 4) Otherwise => allow the request
  return NextResponse.next();
}

// Only match these routes
export const config = {
  matcher: [
    "/miners/:path*",
    "/rigs/:path*",
    "/payout/:path*",
  ],
};
