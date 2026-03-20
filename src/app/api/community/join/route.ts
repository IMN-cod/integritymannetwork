import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const joinSchema = z.object({
  firstName: z.string().min(2, "First name is required"),
  lastName: z.string().min(2, "Last name is required"),
  email: z.string().email("Valid email is required"),
  phone: z.string().optional(),
  city: z.string().min(2, "City is required"),
  country: z.string().min(2, "Country is required"),
  occupation: z.string().optional(),
  reason: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validation = joinSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors[0].message },
        { status: 400 }
      );
    }

    const { firstName, lastName, email, phone, city, country, occupation, reason } = validation.data;

    // Build a detailed message for the admin
    const details = [
      `Name: ${firstName} ${lastName}`,
      `Email: ${email}`,
      phone ? `Phone: ${phone}` : null,
      `Location: ${city}, ${country}`,
      occupation ? `Occupation: ${occupation}` : null,
      reason ? `\nReason for joining:\n${reason}` : null,
    ].filter(Boolean).join("\n");

    // Store as a ContactMessage so it shows up in admin messages
    const message = await prisma.contactMessage.create({
      data: {
        name: `${firstName} ${lastName}`,
        email,
        subject: `New Member Registration: ${firstName} ${lastName}`,
        message: details,
      },
    });

    // Create notifications for all admin users
    const admins = await prisma.user.findMany({
      where: { role: { in: ["ADMIN", "SUPER_ADMIN"] }, isActive: true },
      select: { id: true },
    });

    if (admins.length > 0) {
      await prisma.notification.createMany({
        data: admins.map((admin) => ({
          userId: admin.id,
          title: "New Member Registration",
          message: `${firstName} ${lastName} (${email}) from ${city}, ${country} wants to join the network.`,
          type: "MEMBER_REGISTRATION",
          link: "/admin/messages",
        })),
      });
    }

    return NextResponse.json(
      { message: "Registration submitted successfully", id: message.id },
      { status: 201 }
    );
  } catch (error) {
    console.error("[JOIN_ERROR]", error);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
