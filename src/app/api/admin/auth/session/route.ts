import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

// GET /api/admin/auth/session — Return current admin session info
export async function GET() {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json(
        { authenticated: false, error: "Not authenticated" },
        { status: 401 }
      );
    }

    if (!["ADMIN", "SUPER_ADMIN"].includes(session.user.role)) {
      return NextResponse.json(
        { authenticated: false, error: "Insufficient privileges" },
        { status: 403 }
      );
    }

    return NextResponse.json({
      authenticated: true,
      user: {
        id: session.user.id,
        name: session.user.name,
        email: session.user.email,
        role: session.user.role,
        image: session.user.image,
      },
    });
  } catch (error) {
    console.error("[ADMIN_AUTH_SESSION]", error);
    return NextResponse.json(
      { authenticated: false, error: "Session check failed" },
      { status: 500 }
    );
  }
}
