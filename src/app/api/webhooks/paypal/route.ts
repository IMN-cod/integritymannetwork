import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyPayPalWebhook, capturePayPalOrder } from "@/lib/payments/paypal";

const PAYPAL_WEBHOOK_ID = process.env.PAYPAL_WEBHOOK_ID || "";

export async function POST(request: Request) {
  try {
    const body = await request.text();
    const headerEntries: Record<string, string> = {};

    // Collect PayPal-specific headers
    for (const [key, value] of request.headers.entries()) {
      if (key.startsWith("paypal-")) {
        headerEntries[key] = value;
      }
    }

    // Verify webhook signature
    const isValid = await verifyPayPalWebhook({
      webhookId: PAYPAL_WEBHOOK_ID,
      headers: headerEntries,
      body,
    });

    if (!isValid) {
      console.error("[PAYPAL_WEBHOOK] Invalid signature");
      return NextResponse.json(
        { error: "Invalid signature" },
        { status: 400 }
      );
    }

    const event = JSON.parse(body);

    switch (event.event_type) {
      case "CHECKOUT.ORDER.APPROVED": {
        // Capture the payment when user approves
        const paypalOrderId = event.resource?.id;
        if (paypalOrderId) {
          const captureResult = await capturePayPalOrder(paypalOrderId);
          const referenceId =
            captureResult.purchase_units?.[0]?.payments?.captures?.[0]?.id;

          // Check if this was an order or donation based on reference_id
          const internalId =
            event.resource?.purchase_units?.[0]?.reference_id;

          if (internalId) {
            // Try to update as order first, then as donation
            const order = await prisma.order.findUnique({
              where: { id: internalId },
            });

            if (order) {
              await prisma.order.update({
                where: { id: internalId },
                data: {
                  paymentStatus: "PAID",
                  status: "CONFIRMED",
                  paymentId: referenceId || paypalOrderId,
                },
              });
            } else {
              // Check if it's a donation
              const donation = await prisma.donation.findUnique({
                where: { id: internalId },
              });

              if (donation) {
                await prisma.donation.update({
                  where: { id: internalId },
                  data: {
                    status: "PAID",
                    paymentId: referenceId || paypalOrderId,
                  },
                });
              }
            }
          }
        }
        break;
      }

      case "PAYMENT.CAPTURE.COMPLETED": {
        // Payment has been successfully captured
        const captureId = event.resource?.id;
        console.log(
          "[PAYPAL_WEBHOOK] Payment captured successfully:",
          captureId
        );
        break;
      }

      case "PAYMENT.CAPTURE.DENIED":
      case "PAYMENT.CAPTURE.REFUNDED": {
        console.error(
          `[PAYPAL_WEBHOOK] ${event.event_type}:`,
          event.resource?.id
        );
        break;
      }

      default:
        console.log(
          `[PAYPAL_WEBHOOK] Unhandled event type: ${event.event_type}`
        );
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("[PAYPAL_WEBHOOK]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
