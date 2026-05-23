import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { auth } from "@/lib/auth";

// Routes that require any authenticated session
const PROTECTED_PREFIXES = ["/dashboard", "/store/wishlist"];

// Routes that require ADMIN or SUPER_ADMIN role
const ADMIN_PREFIXES = ["/admin"];

// Public admin pages that must not be gated (login page itself)
const ADMIN_PUBLIC = ["/admin/login"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isAdminPublic = ADMIN_PUBLIC.some((p) => pathname === p || pathname.startsWith(p + "/"));
  const isAdminRoute = !isAdminPublic && ADMIN_PREFIXES.some((p) => pathname.startsWith(p));
  const isProtectedRoute = PROTECTED_PREFIXES.some((p) => pathname.startsWith(p));

  if (!isAdminRoute && !isProtectedRoute) {
    return NextResponse.next();
  }

  const session = await auth();

  if (!session?.user?.id) {
    const loginUrl = new URL(
      isAdminRoute ? "/admin/login" : "/auth/login",
      request.url
    );
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (isAdminRoute) {
    const role = (session.user as { role?: string }).role;
    if (!role || !["ADMIN", "SUPER_ADMIN"].includes(role)) {
      return NextResponse.redirect(new URL("/auth/login?error=Forbidden", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/dashboard/:path*",
    "/store/wishlist/:path*",
    "/store/wishlist",
  ],
};
