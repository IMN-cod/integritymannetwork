import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/store — Public product listing with advanced filtering
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "12");
    const category = searchParams.get("category") || "";
    const search = searchParams.get("search") || "";
    const sort = searchParams.get("sort") || "newest";
    const featured = searchParams.get("featured") === "true";

    // New filter params
    const minPrice = searchParams.get("minPrice") ? parseFloat(searchParams.get("minPrice")!) : null;
    const maxPrice = searchParams.get("maxPrice") ? parseFloat(searchParams.get("maxPrice")!) : null;
    const productType = searchParams.get("type") || ""; // "physical" | "digital"
    const inStockOnly = searchParams.get("inStock") === "true";
    const tag = searchParams.get("tag") || "";
    const ids = searchParams.get("ids")?.split(",").filter(Boolean) || [];

    const where: Record<string, unknown> = { isActive: true };

    if (featured) where.isFeatured = true;

    if (ids.length > 0) {
      where.id = { in: ids };
    }

    if (category) {
      where.category = { slug: category };
    }

    if (productType === "digital") where.isDigital = true;
    else if (productType === "physical") where.isDigital = false;

    if (minPrice !== null || maxPrice !== null) {
      where.price = {
        ...(minPrice !== null ? { gte: minPrice } : {}),
        ...(maxPrice !== null ? { lte: maxPrice } : {}),
      };
    }

    // Compound AND conditions for search + inStock + tag
    const andConditions: object[] = [];

    if (search) {
      andConditions.push({
        OR: [
          { name: { contains: search, mode: "insensitive" } },
          { description: { contains: search, mode: "insensitive" } },
          { summary: { contains: search, mode: "insensitive" } },
          { tags: { hasSome: [search.toLowerCase()] } },
        ],
      });
    }

    if (inStockOnly) {
      andConditions.push({
        OR: [{ stock: { gt: 0 } }, { isDigital: true }],
      });
    }

    if (tag) {
      andConditions.push({ tags: { hasSome: [tag.toLowerCase()] } });
    }

    if (andConditions.length > 0) {
      where.AND = andConditions;
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
