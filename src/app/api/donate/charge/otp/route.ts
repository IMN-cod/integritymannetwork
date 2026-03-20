import { NextRequest, NextResponse } from "next/server";
import { submitChargeOTP } from "@/lib/payments/paystack";

// ───────────────────────────────────────
// POST /api/donate/charge/otp — Submit OTP for a pending charge
// ───────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { reference, otp } = body;

    if (!reference || !otp) {
      return NextResponse.json(
        { error: "Reference and OTP are required" },
        { status: 400 }
      );
    }

    const result = await submitChargeOTP({ reference, otp });

    return NextResponse.json({
      status: result.status,
      reference: result.reference,
      displayText: result.display_text,
    });
  } catch (error) {
    console.error("[DONATE_OTP_ERROR]", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "OTP submission failed" },
      { status: 500 }
    );
  }
}
