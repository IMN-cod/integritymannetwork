import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { verifyPaystackTransaction } from "@/lib/payments/paystack";
import { finalizePaystackOrder } from "@/lib/payments/finalize";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

function ordersUrl(result: "success" | "failed", reference?: string) {
  const url = new URL("/dashboard/orders", APP_URL);
  url.searchParams.set("payment", result);
  if (reference) url.searchParams.set("ref", reference);
  return url;
}

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    const login = new URL("/auth/login", APP_URL);
    login.searchParams.set("callbackUrl", request.url);
    return NextResponse.redirect(login);
  }

  const reference =
    request.nextUrl.searchParams.get("reference") ||
    request.nextUrl.searchParams.get("trxref");
  if (!reference || reference.length > 200) {
    return NextResponse.redirect(ordersUrl("failed"));
  }

  try {
    const order = await prisma.order.findFirst({
      where: {
        userId: session.user.id,
        paymentMethod: "PAYSTACK",
        paymentId: reference,
      },
      select: { id: true, orderNumber: true },
    });
    if (!order) return NextResponse.redirect(ordersUrl("failed"));

    const payment = await verifyPaystackTransaction(reference);
    await finalizePaystackOrder(payment);
    return NextResponse.redirect(ordersUrl("success", order.orderNumber));
  } catch (error) {
    console.error("[ORDER_PAYSTACK_CALLBACK]", error);
    return NextResponse.redirect(ordersUrl("failed", reference));
  }
}
