import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { chargeMobileMoney, chargeBankTransfer } from "@/lib/payments/paystack";

// ───────────────────────────────────────
// POST /api/donate/charge — Charge via Mobile Money or Bank Transfer
// ───────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { donationId, channel, phone, provider } = body;

    if (!donationId || typeof donationId !== "string") {
      return NextResponse.json(
        { error: "Donation ID is required" },
        { status: 400 }
      );
    }

    const donation = await prisma.donation.findUnique({
      where: { id: donationId },
      include: { user: { select: { email: true } } },
    });

    if (!donation) {
      return NextResponse.json(
        { error: "Donation not found" },
        { status: 404 }
      );
    }

    const email = donation.user?.email || body.email;
    if (!email) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    const suffix = Date.now().toString(36);
    const reference = `DON-${donation.id}-${suffix}`;
    const metadata = { donationId: donation.id, type: "donation" };

    if (channel === "mobile_money") {
      if (!phone || !provider) {
        return NextResponse.json(
          { error: "Phone number and provider are required for mobile money" },
          { status: 400 }
        );
      }

      const result = await chargeMobileMoney({
        email,
        amount: Number(donation.amount),
        reference,
        phone,
        provider,
        metadata,
      });

      await prisma.donation.update({
        where: { id: donationId },
        data: { paymentId: result.reference },
      });

      return NextResponse.json({
        status: result.status,
        reference: result.reference,
        displayText: result.display_text,
      });
    }

    if (channel === "bank_transfer") {
      const result = await chargeBankTransfer({
        email,
        amount: Number(donation.amount),
        reference,
        metadata,
      });

      await prisma.donation.update({
        where: { id: donationId },
        data: { paymentId: result.reference },
      });

      return NextResponse.json({
        status: result.status,
        reference: result.reference,
        displayText: result.display_text,
      });
    }

    return NextResponse.json(
      { error: "Unsupported payment channel. Use mobile_money or bank_transfer." },
      { status: 400 }
    );
  } catch (error) {
    console.error("[DONATE_CHARGE_ERROR]", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Charge failed" },
      { status: 500 }
    );
  }
}
