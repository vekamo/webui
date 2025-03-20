import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Adjust these to your actual login path & protected routes
const PROTECTED_PATHS = ["/miners", "/rigs", "/payout"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1) If path is not protected, we do nothing
  if (!PROTECTED_PATHS.some((path) => pathname.startsWith(path))) {
    return NextResponse.next();
  }

  // 2) Log all cookies
  const allCookies = request.cookies.getAll();
  console.log("Middleware sees all cookies:", allCookies);

  // 3) Check 'token' cookie
  const token = request.cookies.get("token")?.value;
  console.log("Middleware sees token:", token);

  // 4) If no token => redirect => /login
  if (!token) {
    const loginUrl = new URL("/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  // 5) Otherwise, allow
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/miners/:path*",
    "/rigs/:path*",
    "/payout/:path*",
  ],
};
