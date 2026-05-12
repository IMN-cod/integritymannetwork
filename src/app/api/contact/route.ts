import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { notifyAdmins, brandedEmail } from "@/lib/email";
import { z } from "zod";

const contactSchema = z.object({
  firstName: z.string().min(2),
  lastName: z.string().min(2),
  email: z.string().email(),
  subject: z.string().min(3),
  message: z.string().min(10),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validation = contactSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors[0].message },
        { status: 400 }
      );
    }

    const { firstName, lastName, email, subject, message } = validation.data;

    const contactMessage = await prisma.contactMessage.create({
      data: {
        name: `${firstName} ${lastName}`,
        email,
        subject,
        message,
      },
    });

    // Notify admins by email (non-blocking)
    notifyAdmins({
      event: "message",
      subject: `New contact message: ${subject}`,
      replyTo: email,
      html: brandedEmail({
        preheader: `Contact message from ${firstName} ${lastName}`,
        heading: "New Contact Message",
        intro: `<strong>${firstName} ${lastName}</strong> sent a message via the contact form.`,
        rows: [
          { label: "Name", value: `${firstName} ${lastName}` },
          { label: "Email", value: email },
          { label: "Subject", value: subject },
        ],
        body: `<p style="margin:0 0 8px;color:#6b7280;font-size:13px;">Message:</p><div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:16px;white-space:pre-wrap;color:#111827;font-size:14px;">${message.replace(/[<>&]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;" }[c]!))}</div>`,
        ctaLabel: "View in admin",
        ctaUrl: `${process.env.NEXT_PUBLIC_APP_URL || ""}/admin/messages`,
      }),
    }).catch((err) => console.error("[CONTACT_NOTIFY]", err));

    return NextResponse.json(
      { message: "Message sent successfully", id: contactMessage.id },
      { status: 201 }
    );
  } catch (error) {
    console.error("[CONTACT_ERROR]", error);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (
      !session?.user ||
      !["ADMIN", "SUPER_ADMIN"].includes(session.user.role)
    ) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get("limit") || "50");

    const messages = await prisma.contactMessage.findMany({
      orderBy: { createdAt: "desc" },
      take: limit,
    });

    return NextResponse.json(messages);
  } catch (error) {
    console.error("[CONTACT_GET_ERROR]", error);
    return NextResponse.json(
      { error: "Failed to fetch messages" },
      { status: 500 }
    );
  }
}
