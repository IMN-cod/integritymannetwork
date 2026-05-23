import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { createStripeCheckoutSession } from "@/lib/payments/stripe";
import { initializePaystackTransaction } from "@/lib/payments/paystack";
import { createPayPalOrder } from "@/lib/payments/paypal";
import { rateLimit, rateLimitResponse } from "@/lib/rate-limit";
import { DEFAULT_SHIPPING_CONFIG, ShippingConfig } from "@/app/api/store/shipping/route";

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
  discountCode: z.string().optional(),
  discountPercent: z.coerce.number().min(0).max(100).optional(),
  shippingMethodId: z.string().optional(),
  shippingMethodName: z.string().optional(),
  items: z.array(
    z.object({
      productId: z.string(),
      variantId: z.string().optional(),
      quantity: z.coerce.number().int().min(1),
      price: z.coerce.number().min(0),
    })
  ),
});

export async function POST(request: Request) {
  try {
    const rl = rateLimit(request, { key: "orders", limit: 20, windowMs: 60 * 1000 });
    if (!rl.ok) return rateLimitResponse(rl);

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

    // ── Load shipping config ──────────────────────────────────────────────────
    const shippingConfigSetting = await prisma.siteSetting.findUnique({
      where: { key: "shippingConfig" },
    });
    let shippingConfig: ShippingConfig = DEFAULT_SHIPPING_CONFIG;
    if (shippingConfigSetting?.value) {
      try {
        const parsed = JSON.parse(shippingConfigSetting.value) as Partial<ShippingConfig>;
        shippingConfig = {
          ...DEFAULT_SHIPPING_CONFIG,
          ...parsed,
          zones: parsed.zones ?? DEFAULT_SHIPPING_CONFIG.zones,
          classes: parsed.classes ?? DEFAULT_SHIPPING_CONFIG.classes,
        };
      } catch { /* use default */ }
    }

    // ── Resolve delivery method price ─────────────────────────────────────────
    const afterDiscount = subtotal * (1 - (data.discountPercent ?? 0) / 100);
    let methodPrice = shippingConfig.methods.find((m) => m.enabled)?.price ?? DEFAULT_SHIPPING_CONFIG.methods[0].price;
    if (data.shippingMethodId) {
      const chosen = shippingConfig.methods.find((m) => m.id === data.shippingMethodId && m.enabled);
      if (chosen) methodPrice = chosen.price;
    }

    // ── Per-product shipping data ─────────────────────────────────────────────
    const productDetails = await prisma.product.findMany({
      where: { id: { in: data.items.map((i) => i.productId) } },
      select: {
        id: true,
        shippingClass: true,
        freeShipping: true,
        handlingFee: true,
        isDigital: true,
      },
    });
    const productMap = new Map(productDetails.map((p) => [p.id, p]));

    // Sum per-item handling fees (multiplied by quantity)
    const totalHandlingFee = data.items.reduce((sum, item) => {
      const p = productMap.get(item.productId);
      if (!p || !p.handlingFee) return sum;
      return sum + Number(p.handlingFee) * item.quantity;
    }, 0);

    // Find the highest-surcharge shipping class present in the cart (non-digital, non-individually-free items)
    const cartClasses = data.items
      .map((item) => productMap.get(item.productId))
      .filter((p) => p && !p.isDigital && !p.freeShipping)
      .map((p) => p!.shippingClass ?? "STANDARD");

    const classSurcharge = cartClasses.reduce((max, classId) => {
      const classCfg = shippingConfig.classes.find((c) => c.id === classId);
      return Math.max(max, classCfg?.extraFee ?? 0);
    }, 0);

    // Check free-shipping eligibility: all non-digital items must be in eligible classes
    const hasIneligibleClass = cartClasses.some((classId) => {
      const cls = shippingConfig.classes.find((c) => c.id === classId);
      return cls ? !cls.freeShippingEligible : false;
    });
    const allItemsInCartAreFree = data.items.every((item) => {
      const p = productMap.get(item.productId);
      return p?.isDigital || p?.freeShipping;
    });

    const isFreeShipping =
      allItemsInCartAreFree ||
      (!hasIneligibleClass && shippingConfig.freeShippingEnabled && afterDiscount >= shippingConfig.freeShippingThreshold);

    const shippingCost = isFreeShipping
      ? totalHandlingFee   // handling fees still apply even on free shipping
      : methodPrice + classSurcharge + totalHandlingFee;

    const total = afterDiscount + shippingCost;

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
      const firstIssue = error.errors[0];
      const field = firstIssue?.path.join(".") || "unknown";
      return NextResponse.json(
        { error: `Invalid order data (field: ${field}): ${firstIssue?.message}`, details: error.errors },
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
