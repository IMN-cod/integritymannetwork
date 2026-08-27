import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkChargeStatus } from "@/lib/payments/paystack";
import {
  finalizePaystackDonation,
  PaymentValidationError,
} from "@/lib/payments/finalize";
import { rateLimit, rateLimitResponse } from "@/lib/rate-limit";

// GET /api/donate/charge/status?reference=xxx - Poll a MoMo/bank charge.
export async function GET(req: NextRequest) {
  try {
    const rl = rateLimit(req, {
      key: "donate:charge:status",
      limit: 30,
      windowMs: 60 * 1000,
    });
    if (!rl.ok) return rateLimitResponse(rl);

    const reference = req.nextUrl.searchParams.get("reference");
    if (!reference || reference.length > 200) {
      return NextResponse.json({ error: "Reference is required" }, { status: 400 });
    }

    const charge = await checkChargeStatus(reference);

    if (charge.status === "success") {
      await finalizePaystackDonation(charge);
    } else if (charge.status === "failed" || charge.status === "timeout") {
      await prisma.donation.updateMany({
        where: {
          paymentId: charge.reference,
          paymentMethod: "PAYSTACK",
          status: "PENDING",
        },
        data: { status: "FAILED" },
      });
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
    if (error instanceof PaymentValidationError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    // Transient gateway errors keep the client polling. The signed webhook
    // remains the authoritative fallback if the customer closes the page.
    return NextResponse.json({ status: "pending" });
  }
}
