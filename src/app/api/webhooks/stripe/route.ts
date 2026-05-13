import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyStripeWebhook } from "@/lib/payments/stripe";
import { sendOrderPaidNotifications, sendDonationPaidNotifications } from "@/lib/email";

export async function POST(request: Request) {
  try {
    const body = await request.text();
    const signature = request.headers.get("stripe-signature") || "";

    let event;
    try {
      event = verifyStripeWebhook(body, signature);
    } catch (err) {
      console.error("[STRIPE_WEBHOOK] Signature verification failed:", err);
      return NextResponse.json(
        { error: "Invalid signature" },
        { status: 400 }
      );
    }

    // Idempotency: ignore events we have already processed.
    try {
      await prisma.webhookEvent.create({
        data: { provider: "stripe", eventId: event.id, eventType: event.type },
      });
    } catch {
      // Unique constraint violation → duplicate delivery; ack and exit.
      console.log("[STRIPE_WEBHOOK] Duplicate event ignored:", event.id);
      return NextResponse.json({ received: true, duplicate: true });
    }

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object;
        const orderId = session.metadata?.orderId;
        const donationId = session.metadata?.donationId;

        if (orderId) {
          await prisma.order.update({
            where: { id: orderId },
            data: {
              paymentStatus: "PAID",
              status: "CONFIRMED",
              paymentId: session.payment_intent as string,
            },
          });
          sendOrderPaidNotifications(orderId).catch((err) =>
            console.error("[STRIPE_WEBHOOK_NOTIFY]", err)
          );
        }

        if (donationId) {
          await prisma.donation.update({
            where: { id: donationId },
            data: {
              status: "PAID",
              paymentId: session.payment_intent as string,
            },
          });
          sendDonationPaidNotifications(donationId).catch((err) =>
            console.error("[STRIPE_WEBHOOK_NOTIFY]", err)
          );
        }
        break;
      }

      case "payment_intent.payment_failed": {
        const intent = event.data.object;
        console.error("[STRIPE_WEBHOOK] Payment failed:", intent.id);
        break;
      }

      default:
        console.log(`[STRIPE_WEBHOOK] Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("[STRIPE_WEBHOOK]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
