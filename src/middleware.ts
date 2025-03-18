import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Adjust these to your actual login path & protected routes
const PROTECTED_PATHS = ["/miners", "/rigs", "/payout"];

export function middleware(request: NextRequest) {
  // 1. Which route is the user trying to visit?
  const { pathname } = request.nextUrl;

  // 2. If path is not protected, do nothing
  if (!PROTECTED_PATHS.some((path) => pathname.startsWith(path))) {
    return NextResponse.next();
  }

  // 3. Check if user is logged in (e.g., via "token" cookie)
  const token = request.cookies.get("token")?.value;

  // 4. If no token, redirect to /login
  if (!token) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // 5. Otherwise, allow them to continue
  return NextResponse.next();
}

// 🟨 CONFIG SECTION: which routes to apply middleware on
export const config = {
  matcher: [
    "/miners/:path*",  // e.g. /miners, /miners/abc
    "/rigs/:path*",    // e.g. /rigs, /rigs/detail
    "/payout/:path*",  // e.g. /payout, /payout/history
  ],
};
