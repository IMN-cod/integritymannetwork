import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { initializePaystackTransaction } from "@/lib/payments/paystack";
import { rateLimit, rateLimitResponse } from "@/lib/rate-limit";

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

// ───────────────────────────────────────
// POST /api/donate/init-card — Initialize a Paystack card transaction
// for an existing donation record (avoids creating a duplicate)
// ───────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const rl = rateLimit(req, { key: "donate:init-card", limit: 10, windowMs: 60 * 1000 });
    if (!rl.ok) return rateLimitResponse(rl);

    const { donationId } = await req.json();

    if (!donationId || typeof donationId !== "string") {
      return NextResponse.json(
        { error: "donationId is required" },
        { status: 400 }
      );
    }

    const donation = await prisma.donation.findUnique({
      where: { id: donationId },
    });

    if (!donation) {
      return NextResponse.json(
        { error: "Donation not found" },
        { status: 404 }
      );
    }

    if (donation.status !== "PENDING" || donation.paymentMethod !== "PAYSTACK") {
      return NextResponse.json(
        { error: "Donation is not available for a new Paystack transaction" },
        { status: 409 }
      );
    }

    if (!donation.donorEmail) {
      return NextResponse.json(
        { error: "Donation has no associated email" },
        { status: 400 }
      );
    }

    // Unique suffix so retries don't collide with previous Paystack references
    const suffix = Date.now().toString(36);

    const paystackResult = await initializePaystackTransaction({
      email: donation.donorEmail,
      amount: Number(donation.amount),
      reference: `DON-${donation.id}-${suffix}`,
      callbackUrl: `${BASE_URL}/donate?status=success&ref=${donation.id}`,
      metadata: {
        donationId: donation.id,
        type: "donation",
      },
    });

    await prisma.donation.update({
      where: { id: donation.id },
      data: { paymentId: paystackResult.reference },
    });

    return NextResponse.json({
      accessCode: paystackResult.access_code,
      paymentUrl: paystackResult.authorization_url,
    });
  } catch (error) {
    console.error("[INIT_CARD_ERROR]", error);
    return NextResponse.json(
      { error: "Failed to initialize card payment" },
      { status: 500 }
    );
  }
}
