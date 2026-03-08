import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logAdminAction } from "@/lib/audit";

// GET /api/admin/orders — List all orders with filtering
export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user || !["ADMIN", "SUPER_ADMIN"].includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || "";
    const paymentStatus = searchParams.get("paymentStatus") || "";

    const where: Record<string, unknown> = {};

    if (search) {
      where.OR = [
        { orderNumber: { contains: search, mode: "insensitive" } },
        { user: { firstName: { contains: search, mode: "insensitive" } } },
        { user: { lastName: { contains: search, mode: "insensitive" } } },
        { user: { email: { contains: search, mode: "insensitive" } } },
        { customerEmail: { contains: search, mode: "insensitive" } },
      ];
    }

    if (status) where.status = status;
    if (paymentStatus) where.paymentStatus = paymentStatus;

    const [orders, total, stats] = await Promise.all([
      prisma.order.findMany({
        where,
        include: {
          user: { select: { firstName: true, lastName: true, email: true, avatar: true } },
          items: { include: { product: { select: { name: true, images: true } } } },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.order.count({ where }),
      Promise.all([
        prisma.order.count(),
        prisma.order.count({ where: { status: "PENDING" } }),
        prisma.order.count({ where: { status: "PROCESSING" } }),
        prisma.order.count({ where: { status: "SHIPPED" } }),
        prisma.order.count({ where: { status: "DELIVERED" } }),
        prisma.order.count({ where: { paymentStatus: "PAID" } }),
        prisma.order.aggregate({ _sum: { total: true }, where: { paymentStatus: "PAID" } }),
      ]),
    ]);

    const [totalOrders, pendingOrders, processingOrders, shippedOrders, deliveredOrders, paidOrders, revenueAgg] = stats;

    return NextResponse.json({
      orders,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
      stats: {
        total: totalOrders,
        pending: pendingOrders,
        processing: processingOrders,
        shipped: shippedOrders,
        delivered: deliveredOrders,
        paid: paidOrders,
        revenue: Number(revenueAgg._sum.total || 0),
      },
    });
  } catch (error) {
    console.error("[ADMIN_ORDERS_GET]", error);
    return NextResponse.json({ error: "Failed to fetch orders" }, { status: 500 });
  }
}

// PATCH /api/admin/orders — Update order status
export async function PATCH(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user || !["ADMIN", "SUPER_ADMIN"].includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id, status, paymentStatus, trackingNumber, trackingUrl, notes } = await req.json();

    if (!id) {
      return NextResponse.json({ error: "Order ID is required" }, { status: 400 });
    }

    const data: Record<string, unknown> = {};
    if (status) data.status = status;
    if (paymentStatus) data.paymentStatus = paymentStatus;
    if (trackingNumber !== undefined) data.trackingNumber = trackingNumber;
    if (trackingUrl !== undefined) data.trackingUrl = trackingUrl;
    if (notes !== undefined) data.notes = notes;

    const order = await prisma.order.update({
      where: { id },
      data,
      include: {
        user: { select: { firstName: true, lastName: true, email: true } },
        items: true,
      },
    });

    // Update product sales count if order is delivered
    if (status === "DELIVERED") {
      for (const item of order.items) {
        await prisma.product.update({
          where: { id: item.productId },
          data: { salesCount: { increment: item.quantity } },
        });
      }
    }

    await logAdminAction({
      action: "STATUS_CHANGE",
      entity: "Order",
      entityId: id,
      details: data,
    });

    return NextResponse.json({ order });
  } catch (error) {
    console.error("[ADMIN_ORDERS_PATCH]", error);
    return NextResponse.json({ error: "Failed to update order" }, { status: 500 });
  }
}
