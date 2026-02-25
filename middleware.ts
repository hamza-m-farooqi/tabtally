import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE } from "@/lib/constants";

const PUBLIC_PATHS = new Set([
  "/",
  "/signin",
  "/signup",
  "/api/auth/signin",
  "/api/auth/signup",
  "/api/auth/signout",
  "/api/auth/me",
]);

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.startsWith("/public")
  ) {
    return NextResponse.next();
  }

  const token = req.cookies.get(SESSION_COOKIE)?.value;
  const isPublic = PUBLIC_PATHS.has(pathname);

  if (!token && pathname.startsWith("/api")) {
    return NextResponse.next();
  }

  if (!token && !isPublic) {
    const url = req.nextUrl.clone();
    url.pathname = "/";
    return NextResponse.redirect(url);
  }

  if (token && (pathname === "/" || pathname === "/signin" || pathname === "/signup")) {
    const url = req.nextUrl.clone();
    url.pathname = "/expenses";
    return NextResponse.redirect(url);
  }

  if (isPublic) {
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
