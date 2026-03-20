import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

const protectedRoutes = ["/dashboard", "/community"];
const authRoutes = ["/auth/login", "/auth/register"];

export default auth((req) => {
  const { nextUrl } = req;
  const isLoggedIn = !!req.auth;
  const isAdmin =
    req.auth?.user?.role === "ADMIN" ||
    req.auth?.user?.role === "SUPER_ADMIN";

  const isProtectedRoute = protectedRoutes.some((route) =>
    nextUrl.pathname.startsWith(route)
  );
  const isAuthRoute = authRoutes.some((route) =>
    nextUrl.pathname.startsWith(route)
  );
  const isAdminLogin = nextUrl.pathname === "/admin/login";
  const isAdminRoute =
    nextUrl.pathname.startsWith("/admin") && !isAdminLogin;

  // ── Admin login page ──
  // If already logged in as admin, skip login page and go to dashboard
  if (isAdminLogin && isLoggedIn && isAdmin) {
    return NextResponse.redirect(new URL("/admin", nextUrl));
  }
  // Allow access to admin login page for everyone (it handles its own auth)
  if (isAdminLogin) {
    return NextResponse.next();
  }

  // ── Admin routes (everything except /admin/login) ──
  // Must be logged in AND be an admin
  if (isAdminRoute && !isLoggedIn) {
    return NextResponse.redirect(new URL("/admin/login", nextUrl));
  }
  if (isAdminRoute && isLoggedIn && !isAdmin) {
    return NextResponse.redirect(new URL("/admin/login", nextUrl));
  }

  // ── Auth pages ──
  // Redirect logged-in users away from auth pages
  if (isAuthRoute && isLoggedIn) {
    // If user is admin, send them to the admin panel
    if (isAdmin) {
      return NextResponse.redirect(new URL("/admin", nextUrl));
    }
    return NextResponse.redirect(new URL("/dashboard", nextUrl));
  }

  // ── Protected member routes ──
  if (isProtectedRoute && !isLoggedIn) {
    const callbackUrl = encodeURIComponent(nextUrl.pathname);
    return NextResponse.redirect(
      new URL(`/auth/login?callbackUrl=${callbackUrl}`, nextUrl)
    );
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    /*
     * Match all paths except:
     * - api routes, Next.js internals, static files
     * - common static file extensions
     */
    "/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|images|videos|fonts|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|mp4|webm|woff|woff2|ttf|eot)$).*)",
  ],
};
