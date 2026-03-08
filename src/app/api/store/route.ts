import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/store — Public product listing
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "12");
    const category = searchParams.get("category") || "";
    const search = searchParams.get("search") || "";
    const sort = searchParams.get("sort") || "newest";
    const featured = searchParams.get("featured") === "true";

    const where: Record<string, unknown> = { isActive: true };

    if (featured) where.isFeatured = true;

    if (category) {
      where.category = { slug: category };
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
        { summary: { contains: search, mode: "insensitive" } },
        { tags: { hasSome: [search.toLowerCase()] } },
      ];
    }

    type SortOrder = "asc" | "desc";
    let orderBy: Record<string, SortOrder> = { createdAt: "desc" };
    if (sort === "price-asc") orderBy = { price: "asc" };
    else if (sort === "price-desc") orderBy = { price: "desc" };
    else if (sort === "name") orderBy = { name: "asc" };
    else if (sort === "popular") orderBy = { salesCount: "desc" };

    const [products, total, categories] = await Promise.all([
      prisma.product.findMany({
        where,
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
          tags: true,
          isFeatured: true,
          isDigital: true,
          salesCount: true,
          createdAt: true,
          category: { select: { name: true, slug: true } },
          variants: { select: { id: true, name: true, value: true, price: true, stock: true } },
        },
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.product.count({ where }),
      // Get categories with product counts
      prisma.productCategory.findMany({
        select: {
          id: true,
          name: true,
          slug: true,
          image: true,
          _count: { select: { products: { where: { isActive: true } } } },
        },
        orderBy: { sortOrder: "asc" },
      }),
    ]);

    return NextResponse.json({
      products,
      categories,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("[STORE_GET_ERROR]", error);
    return NextResponse.json({ error: "Failed to fetch products" }, { status: 500 });
  }
}
