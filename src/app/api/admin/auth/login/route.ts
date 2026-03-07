import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { logAdminAction, logLoginAttempt } from "@/lib/audit";

const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

// POST /api/admin/auth/login — Admin-only login validation
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validation = loginSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors[0].message },
        { status: 400 }
      );
    }

    const { email, password } = validation.data;

    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        password: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
        avatar: true,
        failedLogins: true,
        lockedUntil: true,
      },
    });

    if (!user || !user.password) {
      await logLoginAttempt({ email, success: false, reason: "User not found" });
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }

    // Check if account is locked
    if (user.lockedUntil && user.lockedUntil > new Date()) {
      const minutesLeft = Math.ceil(
        (user.lockedUntil.getTime() - Date.now()) / 60000
      );
      await logLoginAttempt({ email, success: false, reason: "Account locked" });
      return NextResponse.json(
        { error: `Account locked. Try again in ${minutesLeft} minute(s).` },
        { status: 423 }
      );
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      const newFailedCount = (user.failedLogins || 0) + 1;
      const updateData: Record<string, unknown> = { failedLogins: newFailedCount };

      if (newFailedCount >= MAX_FAILED_ATTEMPTS) {
        updateData.lockedUntil = new Date(Date.now() + LOCKOUT_DURATION_MS);
      }

      await prisma.user.update({ where: { id: user.id }, data: updateData });
      await logLoginAttempt({ email, success: false, reason: "Invalid password" });

      const remaining = MAX_FAILED_ATTEMPTS - newFailedCount;
      if (remaining > 0) {
        return NextResponse.json(
          { error: `Invalid credentials. ${remaining} attempt(s) remaining.` },
          { status: 401 }
        );
      }
      return NextResponse.json(
        { error: "Account locked due to too many failed attempts. Try again in 15 minutes." },
        { status: 423 }
      );
    }

    // Check admin role
    if (!["ADMIN", "SUPER_ADMIN"].includes(user.role)) {
      await logLoginAttempt({ email, success: false, reason: "Not an admin" });
      return NextResponse.json(
        { error: "Access denied. Admin privileges required." },
        { status: 403 }
      );
    }

    // Check if account is active
    if (!user.isActive) {
      await logLoginAttempt({ email, success: false, reason: "Account deactivated" });
      return NextResponse.json(
        { error: "Account is deactivated. Contact a super admin." },
        { status: 403 }
      );
    }

    // Success — reset failed login counter and update login stats
    await prisma.user.update({
      where: { id: user.id },
      data: {
        failedLogins: 0,
        lockedUntil: null,
        lastLoginAt: new Date(),
        loginCount: { increment: 1 },
      },
    });

    await logLoginAttempt({ email, success: true });
    await logAdminAction({
      action: "LOGIN",
      entity: "Session",
      adminId: user.id,
      details: { email: user.email },
    });

    // Return success (actual session is created by NextAuth signIn on the client)
    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        avatar: user.avatar,
      },
    });
  } catch (error) {
    console.error("[ADMIN_AUTH_LOGIN]", error);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
