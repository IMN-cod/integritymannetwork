import { NextRequest, NextResponse } from "next/server";
import { verifyPaystackTransaction } from "@/lib/payments/paystack";
import {
  finalizePaystackDonation,
  PaymentValidationError,
} from "@/lib/payments/finalize";
import { rateLimit, rateLimitResponse } from "@/lib/rate-limit";

// ───────────────────────────────────────
// POST /api/donate/verify — Verify payment after Paystack popup
// ───────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const rl = rateLimit(req, { key: "donate:verify", limit: 10, windowMs: 60 * 1000 });
    if (!rl.ok) return rateLimitResponse(rl);

    const { reference } = await req.json();

    if (!reference || typeof reference !== "string" || reference.length > 200) {
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

    const result = await finalizePaystackDonation(verification);

    return NextResponse.json({
      success: true,
      donationId: result.id,
      reference: verification.reference,
      amount: verification.amount / 100,
      channel: verification.channel,
    });
  } catch (error) {
    console.error("[DONATE_VERIFY_ERROR]", error);
    if (error instanceof PaymentValidationError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json(
      { error: "Verification failed" },
      { status: 500 }
    );
  }
}
