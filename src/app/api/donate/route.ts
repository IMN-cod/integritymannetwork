import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { z } from "zod";
import { createStripeDonationSession } from "@/lib/payments/stripe";
import { initializePaystackTransaction } from "@/lib/payments/paystack";
import { createPayPalOrder } from "@/lib/payments/paypal";

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

const donationSchema = z.object({
  amount: z.number().positive("Amount must be greater than 0"),
  currency: z.string().default("GHS"),
  isRecurring: z.boolean().default(false),
  paymentMethod: z.enum(["PAYSTACK", "STRIPE", "PAYPAL"]),
  campaignId: z.string().optional(),
  message: z.string().optional(),
  donorEmail: z.string().email().optional(),
  skipInit: z.boolean().default(false),
});

// ───────────────────────────────────────
// POST /api/donate — Create donation record & initialize payment
// ───────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
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

    let paymentUrl: string;
    let accessCode: string | undefined;

    switch (data.paymentMethod) {
      case "STRIPE": {
        const stripeSession = await createStripeDonationSession({
          amount: data.amount,
          donorEmail: email,
          donationId: donation.id,
          recurring: data.isRecurring,
          successUrl: `${BASE_URL}/donate?status=success&ref=${donation.id}`,
          cancelUrl: `${BASE_URL}/donate?status=cancelled`,
        });
        paymentUrl = stripeSession.url!;
        // Store Stripe session ID for reference
        await prisma.donation.update({
          where: { id: donation.id },
          data: { paymentId: stripeSession.id },
        });
        break;
      }

      case "PAYSTACK": {
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
        paymentUrl = paystackResult.authorization_url;
        accessCode = paystackResult.access_code;
        await prisma.donation.update({
          where: { id: donation.id },
          data: { paymentId: paystackResult.reference },
        });
        break;
      }

      case "PAYPAL": {
        const paypalOrder = await createPayPalOrder({
          amount: data.amount,
          currency: data.currency,
          description: "Donation — The Integrity Man Network",
          orderId: donation.id,
          returnUrl: `${BASE_URL}/donate?status=success&ref=${donation.id}`,
          cancelUrl: `${BASE_URL}/donate?status=cancelled`,
        });
        const approveLink = paypalOrder.links.find(
          (l) => l.rel === "approve"
        );
        paymentUrl = approveLink?.href || "";
        await prisma.donation.update({
          where: { id: donation.id },
          data: { paymentId: paypalOrder.id },
        });
        break;
      }

      default:
        return NextResponse.json(
          { error: "Unsupported payment method" },
          { status: 400 }
        );
    }

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
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");

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
