import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { sendEmail, notifyAdmins, welcomeMemberEmail, brandedEmail, getEmailSettings } from "@/lib/email";
import { z } from "zod";
import { rateLimit, rateLimitResponse } from "@/lib/rate-limit";

const registerSchema = z.object({
  firstName: z.string().min(2, "First name must be at least 2 characters"),
  lastName: z.string().min(2, "Last name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
});

export async function POST(req: NextRequest) {
  try {
    const rl = rateLimit(req, { key: "auth:register", limit: 5, windowMs: 15 * 60 * 1000 });
    if (!rl.ok) return rateLimitResponse(rl, "Too many registration attempts. Please try again in a few minutes.");

    const body = await req.json();
    const validation = registerSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors[0].message },
        { status: 400 }
      );
    }

    const { firstName, lastName, email, password } = validation.data;

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "An account with this email already exists" },
        { status: 409 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user
    const user = await prisma.user.create({
      data: {
        firstName,
        lastName,
        email,
        password: hashedPassword,
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        createdAt: true,
      },
    });

    // Notify admins of new registration
    const admins = await prisma.user.findMany({
      where: { role: { in: ["ADMIN", "SUPER_ADMIN"] }, isActive: true },
      select: { id: true },
    });

    if (admins.length > 0) {
      await prisma.notification.createMany({
        data: admins.map((admin) => ({
          userId: admin.id,
          title: "New Account Registration",
          message: `${firstName} ${lastName} (${email}) created an account.`,
          type: "USER_REGISTRATION",
          link: "/admin/users",
        })),
      });
    }

    // Send welcome email to user + notify admins (non-blocking)
    (async () => {
      try {
        const settings = await getEmailSettings();
        await sendEmail({
          to: email,
          subject: `Welcome to ${settings.siteName || "The Integrity Man Network"} 🎉`,
          html: welcomeMemberEmail(firstName, settings.siteUrl),
        });
      } catch (err) {
        console.error("[REGISTER_WELCOME_EMAIL]", err);
      }
    })();

    notifyAdmins({
      event: "newMember",
      subject: `New account: ${firstName} ${lastName}`,
      html: brandedEmail({
        preheader: "A new user just signed up",
        heading: "New Account Registration",
        intro: `<strong>${firstName} ${lastName}</strong> created an account.`,
        rows: [
          { label: "Name", value: `${firstName} ${lastName}` },
          { label: "Email", value: email },
          { label: "Signed up", value: new Date().toLocaleString() },
        ],
        ctaLabel: "View in admin",
        ctaUrl: `${process.env.NEXT_PUBLIC_APP_URL || ""}/admin/users`,
      }),
    }).catch((err) => console.error("[REGISTER_NOTIFY]", err));

    return NextResponse.json(
      { message: "Account created successfully", user },
      { status: 201 }
    );
  } catch (error) {
    console.error("[REGISTER_ERROR]", error);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
