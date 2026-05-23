import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { validatePaystackWebhook } from "@/lib/payments/paystack";
import { sendOrderPaidNotifications, sendDonationPaidNotifications } from "@/lib/email";

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

    const event = JSON.parse(body);

    // Idempotency: Paystack does not provide a stable event id, but each
    // event carries a unique reference + event name. Use the composite.
    const reference = event.data?.reference || event.data?.id;
    if (!reference) {
      console.warn("[PAYSTACK_WEBHOOK] Event missing reference/id — rejected:", event.event);
      return NextResponse.json({ error: "Missing event reference" }, { status: 400 });
    }

    const paystackEventKey = `${event.event || "unknown"}:${reference}`;
    try {
      await prisma.webhookEvent.create({
        data: { provider: "paystack", eventId: paystackEventKey, eventType: event.event },
      });
    } catch {
      console.log("[PAYSTACK_WEBHOOK] Duplicate event ignored:", paystackEventKey);
      return NextResponse.json({ received: true, duplicate: true });
    }

    switch (event.event) {
      case "charge.success": {
        const data = event.data;
        const { reference, metadata } = data;

        if (metadata?.orderId) {
          const updated = await prisma.order.updateMany({
            where: { id: metadata.orderId, paymentStatus: "PENDING" },
            data: {
              paymentStatus: "PAID",
              status: "CONFIRMED",
              paymentId: reference,
            },
          });
          if (updated.count > 0) {
            sendOrderPaidNotifications(metadata.orderId).catch((err) =>
              console.error("[PAYSTACK_WEBHOOK_NOTIFY]", err)
            );
          }
        }

        if (metadata?.donationId) {
          const updated = await prisma.donation.updateMany({
            where: { id: metadata.donationId, status: "PENDING" },
            data: {
              status: "PAID",
              paymentId: reference,
            },
          });
          if (updated.count > 0) {
            sendDonationPaidNotifications(metadata.donationId).catch((err) =>
              console.error("[PAYSTACK_WEBHOOK_NOTIFY]", err)
            );
          }
        }
        break;
      }

      case "transfer.failed":
      case "charge.failed": {
        const failData = event.data;
        console.error(
          `[PAYSTACK_WEBHOOK] ${event.event}:`,
          failData.reference
        );

        // Mark donation as FAILED in database
        if (failData.metadata?.donationId) {
          await prisma.donation.update({
            where: { id: failData.metadata.donationId },
            data: { status: "FAILED" },
          });
        }

        // Mark order as FAILED if applicable
        if (failData.metadata?.orderId) {
          await prisma.order.update({
            where: { id: failData.metadata.orderId },
            data: { paymentStatus: "FAILED" },
          });
        }
        break;
      }

      default:
        console.log(`[PAYSTACK_WEBHOOK] Unhandled event: ${event.event}`);
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
