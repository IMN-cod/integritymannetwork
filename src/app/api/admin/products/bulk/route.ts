import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logAdminAction } from "@/lib/audit";

// POST /api/admin/products/bulk — Bulk actions on products
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user || !["ADMIN", "SUPER_ADMIN"].includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { action, productIds } = await req.json();

    if (!action || !productIds?.length) {
      return NextResponse.json({ error: "Action and product IDs are required" }, { status: 400 });
    }

    let result = { count: 0 };

    switch (action) {
      case "activate":
        result = await prisma.product.updateMany({
          where: { id: { in: productIds } },
          data: { isActive: true },
        });
        break;

      case "deactivate":
        result = await prisma.product.updateMany({
          where: { id: { in: productIds } },
          data: { isActive: false },
        });
        break;

      case "feature":
        result = await prisma.product.updateMany({
          where: { id: { in: productIds } },
          data: { isFeatured: true },
        });
        break;

      case "unfeature":
        result = await prisma.product.updateMany({
          where: { id: { in: productIds } },
          data: { isFeatured: false },
        });
        break;

      case "delete":
        // Delete cart items first
        await prisma.cartItem.deleteMany({
          where: { productId: { in: productIds } },
        });
        result = await prisma.product.deleteMany({
          where: { id: { in: productIds } },
        });
        break;

      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    await logAdminAction({
      action: "BULK_ACTION",
      entity: "Product",
      details: { action, productIds, affected: result.count },
    });

    return NextResponse.json({ success: true, affected: result.count });
  } catch (error) {
    console.error("[ADMIN_PRODUCTS_BULK]", error);
    return NextResponse.json({ error: "Failed to perform bulk action" }, { status: 500 });
  }
}
