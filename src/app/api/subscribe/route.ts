import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { rateLimit, rateLimitResponse } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  try {
    const rl = rateLimit(req, { key: "subscribe", limit: 10, windowMs: 60 * 60 * 1000 });
    if (!rl.ok) return rateLimitResponse(rl);

    const { email, name } = await req.json();

    if (!email || typeof email !== "string") {
      return NextResponse.json({ error: "Valid email is required." }, { status: 400 });
    }

    const normalised = email.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(normalised)) {
      return NextResponse.json({ error: "Invalid email address." }, { status: 400 });
    }

    await prisma.newsletterSubscriber.upsert({
      where: { email: normalised },
      update: { isActive: true, name: name?.trim() || undefined },
      create: { email: normalised, name: name?.trim() || undefined, isActive: true },
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
