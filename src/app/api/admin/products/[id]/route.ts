import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/utils";
import { logAdminAction } from "@/lib/audit";

// GET /api/admin/products/[id] — Get single product
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user || !["ADMIN", "SUPER_ADMIN"].includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        category: true,
        variants: true,
        _count: {
          select: { orderItems: true, cartItems: true },
        },
      },
    });

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    return NextResponse.json({ product });
  } catch (error) {
    console.error("[ADMIN_PRODUCT_GET]", error);
    return NextResponse.json({ error: "Failed to fetch product" }, { status: 500 });
  }
}

// PUT /api/admin/products/[id] — Update product
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user || !["ADMIN", "SUPER_ADMIN"].includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();
    const {
      name, description, summary, price, comparePrice, images,
      categoryId, sku, stock, lowStockAlert, isActive, isFeatured,
      isDigital, weight, tags, badge, metaTitle, metaDescription, variants,
    } = body;

    // Build the update data
    const data: Record<string, unknown> = {};
    if (name !== undefined) {
      data.name = name;
      // Only regenerate slug if name changed and slug not explicitly set
      if (!body.slug) data.slug = slugify(name);
      else data.slug = body.slug;
    }
    if (description !== undefined) data.description = description || null;
    if (summary !== undefined) data.summary = summary || null;
    if (price !== undefined) data.price = price;
    if (comparePrice !== undefined) data.comparePrice = comparePrice || null;
    if (images !== undefined) data.images = images;
    if (categoryId !== undefined) data.categoryId = categoryId || null;
    if (sku !== undefined) data.sku = sku || null;
    if (stock !== undefined) data.stock = parseInt(String(stock));
    if (lowStockAlert !== undefined) data.lowStockAlert = parseInt(String(lowStockAlert));
    if (isActive !== undefined) data.isActive = isActive;
    if (isFeatured !== undefined) data.isFeatured = isFeatured;
    if (isDigital !== undefined) data.isDigital = isDigital;
    if (weight !== undefined) data.weight = weight || null;
    if (tags !== undefined) data.tags = tags;
    if (badge !== undefined) data.badge = badge || null;
    if (metaTitle !== undefined) data.metaTitle = metaTitle || null;
    if (metaDescription !== undefined) data.metaDescription = metaDescription || null;

    // Handle variants: delete existing and recreate
    if (variants !== undefined) {
      await prisma.productVariant.deleteMany({ where: { productId: id } });
      if (variants.length > 0) {
        await prisma.productVariant.createMany({
          data: variants.map((v: { name: string; value: string; price?: number; stock?: number; sku?: string }) => ({
            productId: id,
            name: v.name,
            value: v.value,
            price: v.price || null,
            stock: v.stock ?? 0,
            sku: v.sku || null,
          })),
        });
      }
    }

    const product = await prisma.product.update({
      where: { id },
      data,
      include: { category: true, variants: true },
    });

    await logAdminAction({
      action: "UPDATE",
      entity: "Product",
      entityId: id,
      details: data,
    });

    return NextResponse.json({ product });
  } catch (error) {
    console.error("[ADMIN_PRODUCT_PUT]", error);
    return NextResponse.json({ error: "Failed to update product" }, { status: 500 });
  }
}

// DELETE /api/admin/products/[id] — Delete product
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user || !["ADMIN", "SUPER_ADMIN"].includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const product = await prisma.product.findUnique({
      where: { id },
      select: { name: true },
    });

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    // Delete related cart items first
    await prisma.cartItem.deleteMany({ where: { productId: id } });
    await prisma.product.delete({ where: { id } });

    await logAdminAction({
      action: "DELETE",
      entity: "Product",
      entityId: id,
      details: { name: product.name },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[ADMIN_PRODUCT_DELETE]", error);
    return NextResponse.json({ error: "Failed to delete product" }, { status: 500 });
  }
}
