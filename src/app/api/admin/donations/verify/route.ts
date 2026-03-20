import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { verifyPaystackTransaction } from "@/lib/payments/paystack";

// POST /api/admin/donations/verify — Verify a donation via Paystack
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (
      !session?.user ||
      !["ADMIN", "SUPER_ADMIN"].includes(session.user.role)
    ) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { donationId } = await req.json();
    if (!donationId) {
      return NextResponse.json({ error: "Donation ID is required" }, { status: 400 });
    }

    const donation = await prisma.donation.findUnique({ where: { id: donationId } });
    if (!donation) {
      return NextResponse.json({ error: "Donation not found" }, { status: 404 });
    }

    if (!donation.paymentId) {
      return NextResponse.json({ error: "No payment reference found for this donation" }, { status: 400 });
    }

    const txn = await verifyPaystackTransaction(donation.paymentId);

    const newStatus = txn.status === "success" ? "PAID" : txn.status === "failed" ? "FAILED" : "PENDING";

    const updated = await prisma.donation.update({
      where: { id: donationId },
      data: { status: newStatus as "PAID" | "FAILED" | "PENDING" },
    });

    return NextResponse.json({
      donation: updated,
      paystack: {
        status: txn.status,
        reference: txn.reference,
        amount: txn.amount / 100,
        currency: txn.currency,
        channel: txn.channel,
        paidAt: txn.paid_at,
        customer: txn.customer,
      },
    });
  } catch (error) {
    console.error("[ADMIN_DONATION_VERIFY]", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Verification failed" },
      { status: 500 }
    );
  }
}
