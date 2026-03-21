import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { validatePaystackWebhook } from "@/lib/payments/paystack";

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

    switch (event.event) {
      case "charge.success": {
        const data = event.data;
        const { reference, metadata } = data;

        if (metadata?.orderId) {
          await prisma.order.update({
            where: { id: metadata.orderId },
            data: {
              paymentStatus: "PAID",
              status: "CONFIRMED",
              paymentId: reference,
            },
          });
        }

        if (metadata?.donationId) {
          await prisma.donation.update({
            where: { id: metadata.donationId },
            data: {
              status: "PAID",
              paymentId: reference,
            },
          });
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
