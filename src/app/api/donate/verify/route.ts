import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyPaystackTransaction } from "@/lib/payments/paystack";
import { rateLimit, rateLimitResponse } from "@/lib/rate-limit";

const TOLERANCE_GHS = 0.5; // allow GHC 0.50 rounding difference

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

    // Resolve the donation record first so we can validate the paid amount
    const donationId = (verification.metadata?.donationId as string) || null;
    let donation = null;

    if (donationId) {
      donation = await prisma.donation.findUnique({
        where: { id: donationId },
        select: { id: true, amount: true, status: true },
      });
    } else {
      donation = await prisma.donation.findFirst({
        where: { paymentId: verification.reference },
        select: { id: true, amount: true, status: true },
      });
    }

    if (!donation) {
      console.error("[DONATE_VERIFY] No matching donation for reference:", reference);
      return NextResponse.json({ error: "Donation record not found" }, { status: 404 });
    }

    // Amount guard: Paystack returns amount in Pesewas; convert to GHS for comparison
    const paidAmountGHS = verification.amount / 100;
    const expectedAmountGHS = Number(donation.amount);
    if (Math.abs(paidAmountGHS - expectedAmountGHS) > TOLERANCE_GHS) {
      console.error(
        `[DONATE_VERIFY] Amount mismatch: paid=${paidAmountGHS} expected=${expectedAmountGHS} ref=${reference}`
      );
      return NextResponse.json({ error: "Payment amount does not match" }, { status: 400 });
    }

    // Idempotent: only update if still PENDING (prevent overwriting later states)
    if (donation.status === "PENDING") {
      await prisma.donation.update({
        where: { id: donation.id },
        data: { status: "PAID", paymentId: verification.reference },
      });
    }

    return NextResponse.json({
      success: true,
      donationId: donation.id,
      reference: verification.reference,
      amount: paidAmountGHS,
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
