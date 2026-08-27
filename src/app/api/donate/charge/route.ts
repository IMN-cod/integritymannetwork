import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import {
  chargeMobileMoney,
  chargeBankTransfer,
  checkChargeStatus,
} from "@/lib/payments/paystack";
import { finalizePaystackDonation } from "@/lib/payments/finalize";
import { rateLimit, rateLimitResponse } from "@/lib/rate-limit";

const chargeSchema = z.discriminatedUnion("channel", [
  z.object({
    donationId: z.string().min(1).max(100),
    channel: z.literal("mobile_money"),
    phone: z.string().regex(/^0\d{9}$/, "Use a valid Ghana mobile number"),
    provider: z.enum(["mtn", "vod", "tgo"]),
  }),
  z.object({
    donationId: z.string().min(1).max(100),
    channel: z.literal("bank_transfer"),
  }),
]);

// POST /api/donate/charge - Start a Paystack MoMo or bank charge.
export async function POST(req: NextRequest) {
  try {
    const rl = rateLimit(req, { key: "donate:charge", limit: 10, windowMs: 60 * 1000 });
    if (!rl.ok) return rateLimitResponse(rl);

    const parsed = chargeSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message || "Invalid charge request" },
        { status: 400 }
      );
    }

    const donation = await prisma.donation.findUnique({
      where: { id: parsed.data.donationId },
      include: { user: { select: { email: true } } },
    });

    if (!donation) {
      return NextResponse.json({ error: "Donation not found" }, { status: 404 });
    }
    if (donation.paymentMethod !== "PAYSTACK" || donation.status !== "PENDING") {
      return NextResponse.json(
        { error: "Donation is not available for a new Paystack charge" },
        { status: 409 }
      );
    }

    const email = donation.donorEmail || donation.user?.email;
    if (!email) {
      return NextResponse.json({ error: "Donation has no associated email" }, { status: 400 });
    }

    const reference = `DON-${donation.id}-${Date.now().toString(36)}`;
    const metadata = { donationId: donation.id, type: "donation" };
    const result = parsed.data.channel === "mobile_money"
      ? await chargeMobileMoney({
          email,
          amount: Number(donation.amount),
          reference,
          phone: parsed.data.phone,
          provider: parsed.data.provider,
          metadata,
        })
      : await chargeBankTransfer({
          email,
          amount: Number(donation.amount),
          reference,
          metadata,
        });

    await prisma.donation.update({
      where: { id: donation.id },
      data: { paymentId: result.reference },
    });

    if (result.status === "success") {
      const verifiedCharge = await checkChargeStatus(result.reference);
      await finalizePaystackDonation(verifiedCharge);
    }

    return NextResponse.json({
      status: result.status,
      reference: result.reference,
      displayText: result.display_text,
    });
  } catch (error) {
    console.error("[DONATE_CHARGE_ERROR]", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Charge failed" },
      { status: 502 }
    );
  }
}
