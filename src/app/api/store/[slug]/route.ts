import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/store/[slug] — Get single product by slug
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    const product = await prisma.product.findUnique({
      where: { slug },
      include: {
        category: { select: { name: true, slug: true } },
        variants: {
          select: { id: true, name: true, value: true, price: true, stock: true, sku: true },
        },
      },
    });

    if (!product || !product.isActive) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    // Increment view count
    await prisma.product.update({
      where: { id: product.id },
      data: { viewCount: { increment: 1 } },
    });

    // Get related products (same category)
    const related = await prisma.product.findMany({
      where: {
        isActive: true,
        id: { not: product.id },
        ...(product.categoryId ? { categoryId: product.categoryId } : {}),
      },
      select: {
        id: true,
        name: true,
        slug: true,
        summary: true,
        price: true,
        comparePrice: true,
        images: true,
        stock: true,
        badge: true,
        isDigital: true,
        category: { select: { name: true, slug: true } },
      },
      take: 4,
      orderBy: { salesCount: "desc" },
    });

    return NextResponse.json({ product, related });
  } catch (error) {
    console.error("[STORE_PRODUCT_GET]", error);
    return NextResponse.json({ error: "Failed to fetch product" }, { status: 500 });
  }
}
