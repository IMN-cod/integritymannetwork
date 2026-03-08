import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/utils";
import { logAdminAction } from "@/lib/audit";

// GET /api/admin/products — List products with stats
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
    const status = searchParams.get("status") || "all"; // all, active, inactive, featured, low-stock
    const categoryId = searchParams.get("categoryId") || "";
    const sortBy = searchParams.get("sortBy") || "newest"; // newest, name, price-asc, price-desc, stock, sales

    // Build where clause
    const where: Record<string, unknown> = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { sku: { contains: search, mode: "insensitive" } },
        { tags: { has: search.toLowerCase() } },
      ];
    }

    if (status === "active") where.isActive = true;
    else if (status === "inactive") where.isActive = false;
    else if (status === "featured") where.isFeatured = true;
    else if (status === "low-stock") {
      where.stock = { lte: 5 };
      where.isActive = true;
    }

    if (categoryId) where.categoryId = categoryId;

    // Sort
    let orderBy: Record<string, string> = { createdAt: "desc" };
    if (sortBy === "name") orderBy = { name: "asc" };
    else if (sortBy === "price-asc") orderBy = { price: "asc" };
    else if (sortBy === "price-desc") orderBy = { price: "desc" };
    else if (sortBy === "stock") orderBy = { stock: "asc" };
    else if (sortBy === "sales") orderBy = { salesCount: "desc" };

    const [products, total, stats] = await Promise.all([
      prisma.product.findMany({
        where,
        select: {
          id: true,
          name: true,
          slug: true,
          price: true,
          comparePrice: true,
          images: true,
          sku: true,
          stock: true,
          lowStockAlert: true,
          isActive: true,
          isFeatured: true,
          isDigital: true,
          badge: true,
          tags: true,
          salesCount: true,
          viewCount: true,
          createdAt: true,
          category: {
            select: { id: true, name: true, slug: true },
          },
          _count: {
            select: { orderItems: true, variants: true },
          },
        },
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.product.count({ where }),
      // Get aggregate stats
      Promise.all([
        prisma.product.count(),
        prisma.product.count({ where: { isActive: true } }),
        prisma.product.count({ where: { stock: { lte: 5 }, isActive: true } }),
        prisma.product.count({ where: { isFeatured: true } }),
        prisma.product.aggregate({
          _sum: { salesCount: true },
        }),
        prisma.orderItem.aggregate({
          _sum: { price: true, quantity: true },
        }),
      ]),
    ]);

    const [totalProducts, activeProducts, lowStockProducts, featuredProducts, salesAgg, revenueAgg] = stats;

    return NextResponse.json({
      products,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
      stats: {
        total: totalProducts,
        active: activeProducts,
        lowStock: lowStockProducts,
        featured: featuredProducts,
        totalSales: salesAgg._sum.salesCount || 0,
        totalRevenue: Number(revenueAgg._sum.price || 0),
      },
    });
  } catch (error) {
    console.error("[ADMIN_PRODUCTS_GET]", error);
    return NextResponse.json({ error: "Failed to fetch products" }, { status: 500 });
  }
}

// POST /api/admin/products — Create a new product
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user || !["ADMIN", "SUPER_ADMIN"].includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const {
      name, description, summary, price, comparePrice, images,
      categoryId, sku, stock, lowStockAlert, isActive, isFeatured,
      isDigital, weight, tags, badge, metaTitle, metaDescription, variants,
    } = body;

    if (!name || price === undefined) {
      return NextResponse.json({ error: "Name and price are required" }, { status: 400 });
    }

    const slug = slugify(name);
    const existing = await prisma.product.findUnique({ where: { slug } });
    const finalSlug = existing ? `${slug}-${Date.now().toString(36)}` : slug;

    const product = await prisma.product.create({
      data: {
        name,
        slug: finalSlug,
        description: description || null,
        summary: summary || null,
        price,
        comparePrice: comparePrice || null,
        images: images || [],
        categoryId: categoryId || null,
        sku: sku || null,
        stock: stock ?? 0,
        lowStockAlert: lowStockAlert ?? 5,
        isActive: isActive ?? true,
        isFeatured: isFeatured || false,
        isDigital: isDigital || false,
        weight: weight || null,
        tags: tags || [],
        badge: badge || null,
        metaTitle: metaTitle || null,
        metaDescription: metaDescription || null,
        ...(variants?.length > 0 && {
          variants: {
            create: variants.map((v: { name: string; value: string; price?: number; stock?: number; sku?: string }) => ({
              name: v.name,
              value: v.value,
              price: v.price || null,
              stock: v.stock ?? 0,
              sku: v.sku || null,
            })),
          },
        }),
      },
      include: {
        category: true,
        variants: true,
      },
    });

    await logAdminAction({
      action: "CREATE",
      entity: "Product",
      entityId: product.id,
      details: { name, slug: finalSlug, price, sku },
    });

    return NextResponse.json({ product }, { status: 201 });
  } catch (error) {
    console.error("[ADMIN_PRODUCTS_POST]", error);
    return NextResponse.json({ error: "Failed to create product" }, { status: 500 });
  }
}
