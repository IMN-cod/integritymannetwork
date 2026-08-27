import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  validatePaystackWebhook,
  verifyPaystackTransaction,
} from "@/lib/payments/paystack";
import { finalizePaystackPayment } from "@/lib/payments/finalize";

export async function POST(request: Request) {
  try {
    const body = await request.text();
    const signature = request.headers.get("x-paystack-signature") || "";

    // Verify webhook signature
    const isValid = validatePaystackWebhook(body, signature);
    if (!isValid) {
      console.error("[PAYSTACK_WEBHOOK] Invalid signature");
      return NextResponse.json(
        { error: "Invalid signature" },
        { status: 400 }
      );
    }

    const event = JSON.parse(body) as {
      event?: string;
      data?: {
        id?: string | number;
        reference?: string;
        metadata?: Record<string, unknown>;
      };
    };

    // Idempotency: Paystack does not provide a stable event id, but each
    // event carries a unique reference + event name. Use the composite.
    const reference = event.data?.reference || event.data?.id;
    if (!reference) {
      console.warn("[PAYSTACK_WEBHOOK] Event missing reference/id — rejected:", event.event);
      return NextResponse.json({ error: "Missing event reference" }, { status: 400 });
    }

    const paystackEventKey = `${event.event || "unknown"}:${reference}`;

    switch (event.event) {
      case "charge.success": {
        const verified = await verifyPaystackTransaction(String(reference));
        if (verified.reference !== String(reference)) {
          return NextResponse.json(
            { error: "Verified reference mismatch" },
            { status: 400 }
          );
        }
        await finalizePaystackPayment(verified);
        break;
      }

      case "transfer.failed":
      case "charge.failed": {
        const failData = event.data || {};
        console.error(
          `[PAYSTACK_WEBHOOK] ${event.event}:`,
          failData.reference || failData.id
        );

        const failedReference = String(failData.reference || failData.id || "");
        const donationId = typeof failData.metadata?.donationId === "string"
          ? failData.metadata.donationId
          : undefined;
        const orderId = typeof failData.metadata?.orderId === "string"
          ? failData.metadata.orderId
          : undefined;

        if (donationId) {
          await prisma.donation.updateMany({
            where: { id: donationId, paymentId: failedReference, status: "PENDING" },
            data: { status: "FAILED" },
          });
        }

        if (orderId) {
          await prisma.order.updateMany({
            where: { id: orderId, paymentId: failedReference, paymentStatus: "PENDING" },
            data: { paymentStatus: "FAILED" },
          });
        }
        break;
      }

      default:
        console.log(`[PAYSTACK_WEBHOOK] Unhandled event: ${event.event}`);
    }

    try {
      await prisma.webhookEvent.create({
        data: { provider: "paystack", eventId: paystackEventKey, eventType: event.event },
      });
    } catch {
      return NextResponse.json({ received: true, duplicate: true });
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("[PAYSTACK_WEBHOOK]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
