import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { checkChargeStatus, submitChargeOTP } from "@/lib/payments/paystack";
import { finalizePaystackDonation } from "@/lib/payments/finalize";
import { rateLimit, rateLimitResponse } from "@/lib/rate-limit";

const otpSchema = z.object({
  reference: z.string().min(1).max(200),
  otp: z.string().regex(/^\d{4,12}$/, "Enter a valid OTP"),
});

export async function POST(req: NextRequest) {
  try {
    const rl = rateLimit(req, { key: "donate:charge:otp", limit: 5, windowMs: 60 * 1000 });
    if (!rl.ok) return rateLimitResponse(rl);

    const parsed = otpSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message || "Invalid OTP request" },
        { status: 400 }
      );
    }

    const donation = await prisma.donation.findFirst({
      where: {
        paymentId: parsed.data.reference,
        paymentMethod: "PAYSTACK",
        status: "PENDING",
      },
      select: { id: true },
    });
    if (!donation) {
      return NextResponse.json({ error: "Pending donation not found" }, { status: 404 });
    }

    const result = await submitChargeOTP(parsed.data);
    if (result.status === "success") {
      const charge = await checkChargeStatus(result.reference);
      await finalizePaystackDonation(charge);
    }

    return NextResponse.json({
      status: result.status,
      reference: result.reference,
      displayText: result.display_text,
    });
  } catch (error) {
    console.error("[DONATE_OTP_ERROR]", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "OTP submission failed" },
      { status: 502 }
    );
  }
}
