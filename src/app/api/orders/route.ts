import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { createStripeCheckoutSession } from "@/lib/payments/stripe";
import { initializePaystackTransaction } from "@/lib/payments/paystack";
import { createPayPalOrder } from "@/lib/payments/paypal";

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

// ═══════════════════════════════════════════════════════
// POST /api/orders — Create new order
// ═══════════════════════════════════════════════════════

const shippingSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email(),
  phone: z.string().min(1),
  address: z.string().min(1),
  city: z.string().min(1),
  state: z.string().min(1),
  country: z.string().min(1),
  zipCode: z.string().optional(),
});

const orderSchema = z.object({
  shipping: shippingSchema,
  paymentMethod: z.enum(["PAYSTACK", "STRIPE", "PAYPAL"]),
  items: z.array(
    z.object({
      productId: z.string(),
      variantId: z.string().optional(),
      quantity: z.number().int().min(1),
      price: z.number(),
    })
  ),
});

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const data = orderSchema.parse(body);

    // Calculate totals
    const subtotal = data.items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );
    const shippingCost = subtotal > 50000 ? 0 : 3500;
    const total = subtotal + shippingCost;

    // Generate order number
    const orderCount = await prisma.order.count();
    const orderNumber = `ORD-${new Date().getFullYear()}-${String(
      orderCount + 1
    ).padStart(4, "0")}`;

    // Fetch product names for order items
    const productIds = data.items.map((item) => item.productId);
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true, name: true },
    });
    const productNameMap = new Map(products.map((p: { id: string; name: string }) => [p.id, p.name]));

    // Create order with items
    const order = await prisma.order.create({
      data: {
        userId: session.user.id,
        orderNumber,
        subtotal,
        shippingCost,
        total,
        paymentMethod: data.paymentMethod,
        status: "PENDING",
        paymentStatus: "PENDING",
        shippingAddress: data.shipping as Record<string, string>,
        items: {
          create: data.items.map((item) => ({
            productId: item.productId,
            productName: productNameMap.get(item.productId) || "Unknown Product",
            variantInfo: item.variantId || null,
            quantity: item.quantity,
            price: item.price,
          })),
        },
      },
      include: {
        items: {
          include: {
            product: {
              select: { name: true, slug: true, images: true },
            },
          },
        },
      },
    });

    // Clear cart after order
    await prisma.cartItem.deleteMany({
      where: { userId: session.user.id },
    });

    // Initialize payment gateway
    let paymentUrl: string;
    const customerEmail =
      (data.shipping.email as string) || session.user.email || "";

    switch (data.paymentMethod) {
      case "STRIPE": {
        const stripeSession = await createStripeCheckoutSession({
          orderId: order.id,
          items: data.items.map((item) => ({
            name: productNameMap.get(item.productId) || "Product",
            price: item.price,
            quantity: item.quantity,
          })),
          customerEmail,
          successUrl: `${BASE_URL}/dashboard?order=success&ref=${order.orderNumber}`,
          cancelUrl: `${BASE_URL}/checkout?status=cancelled`,
        });
        paymentUrl = stripeSession.url!;
        await prisma.order.update({
          where: { id: order.id },
          data: { paymentId: stripeSession.id },
        });
        break;
      }

      case "PAYSTACK": {
        const paystackResult = await initializePaystackTransaction({
          email: customerEmail,
          amount: total,
          reference: order.orderNumber,
          callbackUrl: `${BASE_URL}/dashboard?order=success&ref=${order.orderNumber}`,
          metadata: {
            orderId: order.id,
            orderNumber: order.orderNumber,
            type: "order",
          },
        });
        paymentUrl = paystackResult.authorization_url;
        await prisma.order.update({
          where: { id: order.id },
          data: { paymentId: paystackResult.reference },
        });
        break;
      }

      case "PAYPAL": {
        const paypalOrder = await createPayPalOrder({
          amount: total,
          currency: "GHS",
          description: `Order ${order.orderNumber} — The Integrity Man Network`,
          orderId: order.id,
          returnUrl: `${BASE_URL}/dashboard?order=success&ref=${order.orderNumber}`,
          cancelUrl: `${BASE_URL}/checkout?status=cancelled`,
        });
        const approveLink = paypalOrder.links.find(
          (l) => l.rel === "approve"
        );
        paymentUrl = approveLink?.href || "";
        await prisma.order.update({
          where: { id: order.id },
          data: { paymentId: paypalOrder.id },
        });
        break;
      }

      default:
        return NextResponse.json(
          { error: "Unsupported payment method" },
          { status: 400 }
        );
    }

    return NextResponse.json({ order, paymentUrl }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid data", details: error.errors },
        { status: 400 }
      );
    }
    console.error("[ORDERS_POST]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// ═══════════════════════════════════════════════════════
// GET /api/orders — List user's orders (or all for admin)
// ═══════════════════════════════════════════════════════

export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const skip = (page - 1) * limit;

    const isAdmin = ["ADMIN", "SUPER_ADMIN"].includes(
      (session.user as { role?: string }).role || ""
    );

    const where = isAdmin ? {} : { userId: session.user.id };

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        include: {
          items: {
            include: {
              product: {
                select: { name: true, slug: true, images: true },
              },
            },
          },
          user: {
            select: { firstName: true, lastName: true, email: true },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.order.count({ where }),
    ]);

    return NextResponse.json({
      orders,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("[ORDERS_GET]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
