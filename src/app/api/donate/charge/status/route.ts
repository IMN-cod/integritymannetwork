import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyPaystackTransaction } from "@/lib/payments/paystack";

// ───────────────────────────────────────
// GET /api/donate/charge/status?reference=xxx — Poll charge status
// ───────────────────────────────────────

export async function GET(req: NextRequest) {
  try {
    const reference = req.nextUrl.searchParams.get("reference");

    if (!reference) {
      return NextResponse.json(
        { error: "Reference is required" },
        { status: 400 }
      );
    }

    const verification = await verifyPaystackTransaction(reference);

    // Update donation if payment is successful
    if (verification.status === "success") {
      const donationId = verification.metadata?.donationId as string;
      if (donationId) {
        await prisma.donation.update({
          where: { id: donationId },
          data: { status: "PAID", paymentId: verification.reference },
        });
      }
    }

    // Update donation if payment failed
    if (verification.status === "failed") {
      const donationId = verification.metadata?.donationId as string;
      if (donationId) {
        await prisma.donation.update({
          where: { id: donationId },
          data: { status: "FAILED" },
        });
      }
    }

    return NextResponse.json({
      status: verification.status,
      reference: verification.reference,
      amount: verification.amount / 100,
      channel: verification.channel,
      currency: verification.currency,
    });
  } catch (error) {
    console.error("[DONATE_STATUS_ERROR]", error);
    return NextResponse.json(
      { error: "Could not check payment status" },
      { status: 500 }
    );
  }
}
