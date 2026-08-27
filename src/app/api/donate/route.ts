import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { z } from "zod";
import { initializePaystackTransaction } from "@/lib/payments/paystack";
import { rateLimit, rateLimitResponse } from "@/lib/rate-limit";

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

const donationSchema = z.object({
  amount: z.number().positive("Amount must be greater than 0").max(1_000_000, "Amount exceeds maximum allowed"),
  currency: z.literal("GHS").default("GHS"),
  isRecurring: z.literal(false).default(false),
  paymentMethod: z.literal("PAYSTACK"),
  campaignId: z.string().optional(),
  message: z.string().max(1000).optional(),
  donorEmail: z.string().email().optional(),
  donorName: z.string().max(200).optional(),
  skipInit: z.boolean().default(false),
});

// ───────────────────────────────────────
// POST /api/donate — Create donation record & initialize payment
// ───────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const rl = rateLimit(req, { key: "donate", limit: 20, windowMs: 60 * 1000 });
    if (!rl.ok) return rateLimitResponse(rl);

    const body = await req.json();
    const validation = donationSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors[0].message },
        { status: 400 }
      );
    }

    const data = validation.data;
    const session = await auth();
    const email = data.donorEmail || session?.user?.email;

    if (!email) {
      return NextResponse.json(
        { error: "Email is required for payment processing" },
        { status: 400 }
      );
    }

    const donation = await prisma.donation.create({
      data: {
        amount: data.amount,
        currency: data.currency,
        isRecurring: data.isRecurring,
        paymentMethod: data.paymentMethod,
        message: data.message,
        donorName: data.donorName || null,
        donorEmail: email,
        status: "PENDING",
        ...(session?.user?.id && {
          user: { connect: { id: session.user.id } },
        }),
        ...(data.campaignId && {
          campaign: { connect: { id: data.campaignId } },
        }),
      },
    });

    // If skipInit is true, just return the donation ID (for MoMo/Bank Transfer flows)
    if (data.skipInit) {
      return NextResponse.json(
        {
          message: "Donation created",
          donationId: donation.id,
        },
        { status: 201 }
      );
    }

    const paystackResult = await initializePaystackTransaction({
      email,
      amount: data.amount,
      reference: `DON-${donation.id}`,
      callbackUrl: `${BASE_URL}/donate?status=success&ref=${donation.id}`,
      metadata: {
        donationId: donation.id,
        type: "donation",
      },
    });
    const paymentUrl = paystackResult.authorization_url;
    const accessCode = paystackResult.access_code;
    await prisma.donation.update({
      where: { id: donation.id },
      data: { paymentId: paystackResult.reference },
    });

    return NextResponse.json(
      {
        message: "Donation initiated",
        donationId: donation.id,
        paymentUrl,
        ...(accessCode && { accessCode }),
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("[DONATE_ERROR]", error);
    return NextResponse.json(
      { error: "Failed to process donation" },
      { status: 500 }
    );
  }
}

// ───────────────────────────────────────
// GET /api/donate — Admin: list donations
// ───────────────────────────────────────

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
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20")));

    const [donations, total] = await Promise.all([
      prisma.donation.findMany({
        include: {
          user: { select: { firstName: true, lastName: true, email: true } },
          campaign: { select: { title: true } },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.donation.count(),
    ]);

    return NextResponse.json({
      donations,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("[DONATE_GET_ERROR]", error);
    return NextResponse.json(
      { error: "Failed to fetch donations" },
      { status: 500 }
    );
  }
}
