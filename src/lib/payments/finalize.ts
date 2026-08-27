import { prisma } from "@/lib/prisma";
import {
  sendDonationPaidNotifications,
  sendOrderPaidNotifications,
} from "@/lib/email";

export interface PaystackPaymentData {
  status: string;
  reference: string;
  amount: number;
  currency: string;
  channel: string;
  metadata?: Record<string, unknown>;
}

export class PaymentValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PaymentValidationError";
  }
}

function metadataId(metadata: Record<string, unknown> | undefined, key: string) {
  const value = metadata?.[key];
  return typeof value === "string" && value.length > 0 ? value : null;
}

export function validatePaystackPayment({
  payment,
  expectedReference,
  expectedAmount,
  expectedCurrency,
}: {
  payment: PaystackPaymentData;
  expectedReference: string | null;
  expectedAmount: number;
  expectedCurrency: string;
}) {
  if (payment.status !== "success") {
    throw new PaymentValidationError(`Payment status is ${payment.status || "unknown"}`);
  }
  if (!expectedReference || payment.reference !== expectedReference) {
    throw new PaymentValidationError("Payment reference does not match the pending record");
  }

  const expectedMinorAmount = Math.round(expectedAmount * 100);
  if (!Number.isSafeInteger(payment.amount) || payment.amount !== expectedMinorAmount) {
    throw new PaymentValidationError("Payment amount does not match the pending record");
  }

  if (payment.currency?.toUpperCase() !== expectedCurrency.toUpperCase()) {
    throw new PaymentValidationError("Payment currency does not match the pending record");
  }
}

export async function finalizePaystackDonation(payment: PaystackPaymentData) {
  const donationId = metadataId(payment.metadata, "donationId");
  const donation = donationId
    ? await prisma.donation.findUnique({ where: { id: donationId } })
    : await prisma.donation.findFirst({ where: { paymentId: payment.reference } });

  if (!donation) {
    throw new PaymentValidationError("Donation record not found");
  }
  if (donation.paymentMethod !== "PAYSTACK") {
    throw new PaymentValidationError("Donation was not initialized with Paystack");
  }

  validatePaystackPayment({
    payment,
    expectedReference: donation.paymentId,
    expectedAmount: Number(donation.amount),
    expectedCurrency: donation.currency,
  });

  const updated = await prisma.donation.updateMany({
    where: {
      id: donation.id,
      paymentId: payment.reference,
      paymentMethod: "PAYSTACK",
      status: "PENDING",
    },
    data: { status: "PAID" },
  });

  // Always ensure the deduplicated outbox entries exist. If a previous
  // request updated the payment but failed before queuing email, a retry
  // repairs the missing notification without sending a duplicate.
  await sendDonationPaidNotifications(donation.id);

  return { id: donation.id, newlyPaid: updated.count > 0 };
}

export async function finalizePaystackOrder(payment: PaystackPaymentData) {
  const orderId = metadataId(payment.metadata, "orderId");
  const order = orderId
    ? await prisma.order.findUnique({
        where: { id: orderId },
        include: { items: { select: { productId: true, variantInfo: true } } },
      })
    : await prisma.order.findFirst({
        where: { paymentId: payment.reference },
        include: { items: { select: { productId: true, variantInfo: true } } },
      });

  if (!order) {
    throw new PaymentValidationError("Order record not found");
  }
  if (order.paymentMethod !== "PAYSTACK") {
    throw new PaymentValidationError("Order was not initialized with Paystack");
  }

  validatePaystackPayment({
    payment,
    expectedReference: order.paymentId,
    expectedAmount: Number(order.total),
    expectedCurrency: "GHS",
  });

  const updated = await prisma.order.updateMany({
    where: {
      id: order.id,
      paymentId: payment.reference,
      paymentMethod: "PAYSTACK",
      paymentStatus: "PENDING",
    },
    data: { paymentStatus: "PAID", status: "CONFIRMED" },
  });

  if (updated.count > 0 && order.items.length > 0) {
    await prisma.cartItem.deleteMany({
      where: {
        userId: order.userId,
        OR: order.items.map((item) => ({
          productId: item.productId,
          variantId: item.variantInfo,
        })),
      },
    });
  }

  await sendOrderPaidNotifications(order.id);

  return { id: order.id, newlyPaid: updated.count > 0 };
}

export async function finalizePaystackPayment(payment: PaystackPaymentData) {
  const donationId = metadataId(payment.metadata, "donationId");
  const orderId = metadataId(payment.metadata, "orderId");

  if (donationId) return finalizePaystackDonation(payment);
  if (orderId) return finalizePaystackOrder(payment);

  const [donation, order] = await Promise.all([
    prisma.donation.findFirst({
      where: { paymentId: payment.reference, paymentMethod: "PAYSTACK" },
      select: { id: true },
    }),
    prisma.order.findFirst({
      where: { paymentId: payment.reference, paymentMethod: "PAYSTACK" },
      select: { id: true },
    }),
  ]);

  if (donation && !order) return finalizePaystackDonation(payment);
  if (order && !donation) return finalizePaystackOrder(payment);
  throw new PaymentValidationError("No unique payment record matches the reference");
}
