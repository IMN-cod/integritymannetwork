import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email";
import crypto from "crypto";

// POST /api/auth/forgot-password — Request password reset
export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email || typeof email !== "string") {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    // Always return success to prevent email enumeration
    const successResponse = NextResponse.json({
      message: "If an account exists with that email, a reset link has been sent.",
    });

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
      select: { id: true, email: true, firstName: true },
    });

    if (!user) {
      return successResponse;
    }

    // Generate a secure token
    const token = crypto.randomBytes(32).toString("hex");
    const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    // Remove any existing tokens for this email
    await prisma.verificationToken.deleteMany({
      where: { identifier: user.email },
    });

    // Create new verification token
    await prisma.verificationToken.create({
      data: {
        identifier: user.email,
        token,
        expires,
      },
    });

    // Build reset URL
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const resetUrl = `${baseUrl}/auth/reset-password?token=${token}&email=${encodeURIComponent(user.email)}`;

    // Send reset email
    await sendEmail({
      to: user.email,
      subject: "Reset Your Password — The Integrity Man Network",
      html: passwordResetEmail({
        name: user.firstName || "there",
        resetUrl,
      }),
    });

    return successResponse;
  } catch (error) {
    console.error("[FORGOT_PASSWORD_ERROR]", error);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}

function passwordResetEmail({ name, resetUrl }: { name: string; resetUrl: string }) {
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <div style="max-width:560px;margin:0 auto;padding:40px 20px;">
    <div style="background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
      <div style="background:linear-gradient(135deg,#f97316,#ea580c);padding:32px 24px;text-align:center;">
        <h1 style="color:#fff;font-size:22px;margin:0 0 8px;">Password Reset</h1>
        <p style="color:rgba(255,255,255,0.85);font-size:14px;margin:0;">You requested a password reset</p>
      </div>
      <div style="padding:32px 24px;">
        <p style="color:#374151;font-size:15px;line-height:1.6;margin:0 0 20px;">
          Hi <strong>${name}</strong>,
        </p>
        <p style="color:#374151;font-size:15px;line-height:1.6;margin:0 0 24px;">
          Click the button below to reset your password. This link will expire in 1 hour.
        </p>
        <div style="text-align:center;margin:32px 0;">
          <a href="${resetUrl}" style="display:inline-block;background:linear-gradient(135deg,#f97316,#ea580c);color:#fff;font-size:15px;font-weight:600;padding:14px 32px;border-radius:8px;text-decoration:none;">
            Reset Password
          </a>
        </div>
        <p style="color:#6b7280;font-size:13px;line-height:1.6;margin:0 0 16px;">
          If the button doesn't work, copy and paste this link into your browser:
        </p>
        <p style="color:#f97316;font-size:12px;word-break:break-all;margin:0 0 24px;">${resetUrl}</p>
        <p style="color:#9ca3af;font-size:12px;line-height:1.6;margin:0;">
          If you didn't request this reset, you can safely ignore this email.
        </p>
      </div>
      <div style="border-top:1px solid #f3f4f6;padding:20px 24px;text-align:center;">
        <p style="color:#9ca3af;font-size:11px;margin:0;">The Integrity Man Network</p>
      </div>
    </div>
  </div>
</body>
</html>`;
}
