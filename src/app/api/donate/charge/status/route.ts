import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkChargeStatus } from "@/lib/payments/paystack";

// ───────────────────────────────────────
// GET /api/donate/charge/status?reference=xxx — Poll charge status
// Uses Paystack /charge/{reference} endpoint (correct for MoMo/bank-transfer charges)
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

    const charge = await checkChargeStatus(reference);

    if (charge.status === "success") {
      const donationId = charge.metadata?.donationId as string | undefined;
      if (donationId) {
        await prisma.donation.update({
          where: { id: donationId },
          data: { status: "PAID", paymentId: charge.reference },
        });
      } else {
        // Fallback: look up by paymentId reference
        await prisma.donation.updateMany({
          where: { paymentId: charge.reference },
          data: { status: "PAID" },
        });
      }
    }

    if (charge.status === "failed" || charge.status === "timeout") {
      const donationId = charge.metadata?.donationId as string | undefined;
      if (donationId) {
        await prisma.donation.update({
          where: { id: donationId },
          data: { status: "FAILED" },
        });
      } else {
        await prisma.donation.updateMany({
          where: { paymentId: charge.reference },
          data: { status: "FAILED" },
        });
      }
    }

    return NextResponse.json({
      status: charge.status,
      reference: charge.reference,
      amount: charge.amount / 100,
      channel: charge.channel,
      currency: charge.currency,
    });
  } catch (error) {
    console.error("[DONATE_STATUS_ERROR]", error);
    // Return pending so the frontend keeps polling rather than showing an error
    return NextResponse.json({ status: "pending" }, { status: 200 });
  }
}
