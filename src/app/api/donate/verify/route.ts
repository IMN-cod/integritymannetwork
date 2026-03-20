import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyPaystackTransaction } from "@/lib/payments/paystack";

// ───────────────────────────────────────
// POST /api/donate/verify — Verify payment after Paystack popup
// ───────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const { reference } = await req.json();

    if (!reference || typeof reference !== "string") {
      return NextResponse.json(
        { error: "Payment reference is required" },
        { status: 400 }
      );
    }

    const verification = await verifyPaystackTransaction(reference);

    if (verification.status !== "success") {
      return NextResponse.json(
        { error: "Payment was not successful", status: verification.status },
        { status: 400 }
      );
    }

    // Update donation record
    const donationId =
      (verification.metadata?.donationId as string) || null;

    if (donationId) {
      await prisma.donation.update({
        where: { id: donationId },
        data: {
          status: "PAID",
          paymentId: verification.reference,
        },
      });
    }

    return NextResponse.json({
      success: true,
      donationId,
      reference: verification.reference,
      amount: verification.amount / 100, // Pesewas → GHS
      channel: verification.channel,
    });
  } catch (error) {
    console.error("[DONATE_VERIFY_ERROR]", error);
    return NextResponse.json(
      { error: "Verification failed" },
      { status: 500 }
    );
  }
}
